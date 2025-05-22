import { LottoService as BaseLottoService, getLastLottoRound } from '@rich-automation/lotto';
import { chromium } from 'playwright';
import { decryptCredentials, decodeCredentialsSimple } from './crypto-utils.js';

export interface LottoPurchaseResult {
  success: boolean;
  numbers?: number[][];
  message: string;
}

export interface LottoCheckResult {
  success: boolean;
  results?: Array<{
    numbers: number[];
    rank: number;
    matchedNumbers: number[];
  }>;
  message: string;
}

export interface MCPConfig {
  // 간단 모드 (Base64)
  credentials?: string;
  // 고급 모드 (AES 암호화)
  encryptedId?: string;
  encryptedPassword?: string;
  secretKey?: string;
}

export class LottoMCPService {
  private lottoService: BaseLottoService;
  private isSignedIn: boolean = false;
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
    
    // Docker 환경 감지 및 강제 headless 모드 설정
    const isDocker = process.env.container === 'docker' || 
                     process.env.DOCKER_CONTAINER === 'true' ||
                     require('fs').existsSync('/.dockerenv');
    
    this.lottoService = new BaseLottoService({
      controller: chromium,
      headless: true, // Docker에서는 항상 headless
      defaultViewport: { width: 1280, height: 720 },
      logLevel: 0, // ERROR만 출력하여 JSON 파싱 방해 방지
      // Docker 환경을 위한 추가 Chromium 옵션
      ...(isDocker && {
        launchOptions: {
          args: [
            '--headless',
            '--no-sandbox', 
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-field-trial-config',
            '--disable-ipc-flooding-protection'
          ]
        }
      })
    });
  }

  private getCredentials(): { id: string; password: string } {
    const { credentials, encryptedId, encryptedPassword, secretKey } = this.config;
    
    // 간단 모드 (Base64) 우선 확인
    if (credentials) {
      try {
        return decodeCredentialsSimple(credentials);
      } catch (error) {
        throw new Error(`간단 인코딩 계정 정보 디코딩에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
    
    // 고급 모드 (AES 암호화) 확인
    if (encryptedId && encryptedPassword) {
      try {
        return decryptCredentials(encryptedId, encryptedPassword, secretKey);
      } catch (error) {
        throw new Error(`고급 암호화 계정 정보 복호화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
    
    throw new Error('계정 정보가 설정되지 않았습니다. npm run encrypt-credentials 명령을 실행하여 계정을 설정해주세요.');
  }

  async purchaseLotto(count: number): Promise<LottoPurchaseResult> {
    try {
      // 입력 검증
      if (count < 1 || count > 5) {
        return {
          success: false,
          message: '구매 개수는 1~5개 사이여야 합니다.'
        };
      }

      // 계정 정보 가져오기
      const { id, password } = this.getCredentials();

      // 로그인
      if (!this.isSignedIn) {
        await this.lottoService.signIn(id, password);
        this.isSignedIn = true;
      }

      // 로또 구매
      const numbers = await this.lottoService.purchase(count);

      return {
        success: true,
        numbers,
        message: `${count}게임을 성공적으로 구매했습니다.`
      };
    } catch (error) {
      return {
        success: false,
        message: `구매 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  async checkLottoWinning(numbers: number[][], round?: number): Promise<LottoCheckResult> {
    try {
      // 입력 검증
      if (!numbers || numbers.length === 0) {
        return {
          success: false,
          message: '확인할 로또 번호를 입력해주세요.'
        };
      }

      // 번호 형식 검증
      for (const numberSet of numbers) {
        if (numberSet.length !== 6) {
          return {
            success: false,
            message: '로또 번호는 6개여야 합니다.'
          };
        }
        
        for (const num of numberSet) {
          if (num < 1 || num > 45) {
            return {
              success: false,
              message: '로또 번호는 1~45 사이여야 합니다.'
            };
          }
        }
      }

      // 회차 설정 (기본값: 현재 회차)
      const targetRound = round || getLastLottoRound();

      // 당첨 확인
      const checkResults = await this.lottoService.check(numbers, targetRound);

      const results = numbers.map((numberSet, index) => ({
        numbers: numberSet,
        rank: checkResults[index]?.rank || 0,
        matchedNumbers: checkResults[index]?.matchedNumbers || []
      }));

      return {
        success: true,
        results,
        message: `${targetRound}회차 당첨 결과를 확인했습니다.`
      };
    } catch (error) {
      return {
        success: false,
        message: `당첨 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  async destroy(): Promise<void> {
    await this.lottoService.destroy();
    this.isSignedIn = false;
  }
}