#!/usr/bin/env node

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP 서버와 통신하는 테스트 함수
async function testMCPServer() {
  console.log('🧪 MCP 서버 테스트 시작');
  console.log('================================\n');

  // 테스트용 계정 정보 (Base64)
  const testCredentials = Buffer.from('test_id,test_password', 'utf8').toString('base64');
  
  // MCP 서버 실행
  const serverPath = join(__dirname, 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      LOTTO_CREDENTIALS: testCredentials
    }
  });

  // 에러 처리
  server.stderr.on('data', (data) => {
    console.error('❌ 서버 오류:', data.toString());
  });

  // 서버 종료 처리
  let serverClosed = false;
  server.on('exit', (code) => {
    if (!serverClosed) {
      console.log(`\n🔚 MCP 서버 종료 (코드: ${code})`);
    }
  });

  // 테스트 케이스들
  const tests = [
    {
      name: '도구 목록 확인',
      message: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }
    },
    {
      name: '로또 당첨 확인 테스트',
      message: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'check_lotto_winning',
          arguments: {
            numbers: [
              [1, 2, 3, 4, 5, 6],
              [7, 8, 9, 10, 11, 12],
              [13, 14, 15, 16, 17, 18]
            ]
          }
        }
      }
    }
  ];

  // 응답 수집
  let responseBuffer = '';
  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // JSON-RPC 응답 파싱 시도
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || ''; // 마지막 불완전한 줄 보관
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log('📨 서버 응답:');
          console.log(JSON.stringify(response, null, 2));
          console.log('');
        } catch (error) {
          console.log('📝 서버 출력:', line);
        }
      }
    }
  });

  // 테스트 실행
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}️⃣ ${test.name}`);
    console.log('🔄 요청:', JSON.stringify(test.message, null, 2));
    
    // 메시지 전송
    server.stdin.write(JSON.stringify(test.message) + '\n');
    
    // 응답 대기
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 서버 종료
  console.log('🛑 테스트 완료, 서버 종료 중...');
  serverClosed = true;
  server.kill('SIGTERM');
  
  // 정리 대기
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// 메인 실행
async function main() {
  try {
    await testMCPServer();
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

main();