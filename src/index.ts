#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { LottoMCPService, MCPConfig } from './lotto-service.js';

// 입력 스키마 정의
const PurchaseLottoSchema = z.object({
  count: z.number().min(1).max(5).describe('구매할 로또 게임 수 (1-5)')
});

const CheckLottoSchema = z.object({
  numbers: z.array(z.array(z.number().min(1).max(45))).describe('확인할 로또 번호 배열'),
  round: z.number().optional().describe('확인할 회차 (선택사항, 기본값: 현재 회차)')
});

class LottoMCPServer {
  private server: Server;
  private lottoService: LottoMCPService;

  constructor() {
    this.server = new Server(
      {
        name: 'lotto-mcp-server',
        version: '1.0.0',
        description: 'MCP Server for automated lotto purchase and winning check'
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // 환경변수에서 설정 읽기
    const config: MCPConfig = {
      // 간단 모드 (Base64)
      credentials: process.env.LOTTO_CREDENTIALS,
      // 고급 모드 (AES 암호화)
      encryptedId: process.env.LOTTO_ENCRYPTED_ID,
      encryptedPassword: process.env.LOTTO_ENCRYPTED_PASSWORD,
      secretKey: process.env.LOTTO_SECRET_KEY
    };

    this.lottoService = new LottoMCPService(config);
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // 도구 목록 반환
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'purchase_lotto',
            description: '동행복권에서 로또를 자동으로 구매합니다. (계정 정보는 환경변수에서 자동으로 가져옵니다)',
            inputSchema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: '구매할 로또 게임 수 (1-5)'
                }
              },
              required: ['count']
            }
          },
          {
            name: 'check_lotto_winning',
            description: '로또 번호의 당첨 결과를 확인합니다.',
            inputSchema: {
              type: 'object',
              properties: {
                numbers: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'number',
                      minimum: 1,
                      maximum: 45
                    },
                    minItems: 6,
                    maxItems: 6
                  },
                  description: '확인할 로또 번호 배열 (예: [[1,2,3,4,5,6], [7,8,9,10,11,12]])'
                },
                round: {
                  type: 'number',
                  description: '확인할 회차 (선택사항, 기본값: 현재 회차)'
                }
              },
              required: ['numbers']
            }
          }
        ]
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'purchase_lotto': {
            const parsed = PurchaseLottoSchema.parse(args);
            const result = await this.lottoService.purchaseLotto(parsed.count);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'check_lotto_winning': {
            const parsed = CheckLottoSchema.parse(args);
            const result = await this.lottoService.checkLottoWinning(
              parsed.numbers,
              parsed.round
            );

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `오류 발생: ${errorMessage}`
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // 프로세스 종료 시 정리
    process.on('SIGINT', async () => {
      await this.lottoService.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.lottoService.destroy();
      process.exit(0);
    });
  }
}

// 서버 시작
async function main() {
  // 브라우저/Playwright 로그 억제
  process.on('warning', () => {}); // 경고 무시
  
  const server = new LottoMCPServer();
  await server.start();
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});