#!/usr/bin/env node

import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP 서버 실행 함수
function startMCPServer(credentials) {
  const serverPath = join(__dirname, '..', 'dist', 'index.js');
  
  if (!existsSync(serverPath)) {
    console.error('❌ MCP 서버 파일을 찾을 수 없습니다:', serverPath);
    console.error('📦 패키지가 올바르게 설치되지 않았을 수 있습니다.');
    process.exit(1);
  }

  // 환경변수 설정
  const env = {
    ...process.env,
    LOTTO_CREDENTIALS: credentials
  };

  // MCP 서버 실행
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env
  });

  // stdin/stdout 연결 (MCP 통신)
  process.stdin.pipe(server.stdin);
  server.stdout.pipe(process.stdout);
  server.stderr.pipe(process.stderr);

  // 프로세스 종료 처리
  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });

  server.on('exit', (code) => {
    process.exit(code);
  });
}

// CLI 도구 모드
function showHelp() {
  // package.json에서 실제 패키지명 읽기
  let packageName = '@your-username/lotto-mcp-server';
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    packageName = packageJson.name;
  } catch (error) {
    // 기본값 사용
  }

  console.log(`
🎰 로또 MCP 서버

사용법:
  npx ${packageName} [옵션]

옵션:
  --help, -h          이 도움말 표시
  --version, -v       버전 정보 표시
  --setup             계정 설정 도우미 실행
  --encode <id> <pw>  계정 정보 Base64 인코딩
  --config            Claude Desktop 설정 예시 출력

환경변수:
  LOTTO_CREDENTIALS   Base64로 인코딩된 "ID,패스워드"

예시:
  # 계정 설정 도우미
  npx ${packageName} --setup
  
  # 계정 정보 직접 인코딩
  npx ${packageName} --encode "my_id" "my_password"
  
  # MCP 서버 직접 실행 (환경변수 사용)
  LOTTO_CREDENTIALS="bXlfaWQsbXlfcGFzc3dvcmQ=" npx ${packageName}

Claude Desktop 설정:
  {
    "mcpServers": {
      "lotto": {
        "command": "npx",
        "args": ["${packageName}"],
        "env": {
          "LOTTO_CREDENTIALS": "your_base64_credentials_here"
        }
      }
    }
  }
`);
}

function showVersion() {
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    console.log(`v${packageJson.version}`);
  } catch (error) {
    console.log('v1.0.0');
  }
}

function encodeCredentials(id, password) {
  if (!id || !password) {
    console.error('❌ ID와 패스워드를 모두 입력해주세요.');
    console.log('사용법: npx <package-name> --encode "your_id" "your_password"');
    process.exit(1);
  }

  const credentials = Buffer.from(`${id},${password}`, 'utf8').toString('base64');
  
  console.log('✅ 계정 정보 인코딩 완료!');
  console.log('');
  console.log('🔑 Base64 인코딩된 계정 정보:');
  console.log(`${credentials}`);
  console.log('');
  console.log('📋 Claude Desktop 설정에 사용:');
  console.log(`"LOTTO_CREDENTIALS": "${credentials}"`);
}

async function setupCredentials() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function question(prompt) {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  }

  function questionHidden(prompt) {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      
      let input = '';
      
      const handler = (data) => {
        const char = data.toString();
        
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', handler);
            process.stdout.write('\n');
            resolve(input);
            break;
          case '\u0003':
            process.exit();
            break;
          case '\u007f':
            if (input.length > 0) {
              input = input.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            input += char;
            process.stdout.write('*');
        }
      };
      
      process.stdin.on('data', handler);
    });
  }

  // 실제 패키지명 가져오기
  let packageName = '@your-username/lotto-mcp-server';
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    packageName = packageJson.name;
  } catch (error) {
    // 기본값 사용
  }

  try {
    console.log('🔐 로또 계정 설정 도우미');
    console.log('================================');
    console.log('');
    
    const id = await question('동행복권 ID: ');
    const password = await questionHidden('동행복권 패스워드: ');
    
    console.log('');
    encodeCredentials(id, password);
    
    console.log('');
    console.log('📋 완성된 Claude Desktop 설정:');
    console.log('================================');
    
    const credentials = Buffer.from(`${id},${password}`, 'utf8').toString('base64');
    const config = {
      mcpServers: {
        lotto: {
          command: "npx",
          args: [packageName],
          env: {
            LOTTO_CREDENTIALS: credentials
          }
        }
      }
    };
    
    console.log(JSON.stringify(config, null, 2));
    
  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message);
  } finally {
    rl.close();
  }
}

function showConfig() {
  // 실제 패키지명 가져오기
  let packageName = '@your-username/lotto-mcp-server';
  try {
    const packagePath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    packageName = packageJson.name;
  } catch (error) {
    // 기본값 사용
  }

  console.log('📋 Claude Desktop 설정 예시:');
  console.log('================================');
  
  const config = {
    mcpServers: {
      lotto: {
        command: "npx",
        args: [packageName],
        env: {
          LOTTO_CREDENTIALS: "your_base64_credentials_here"
        }
      }
    }
  };
  
  console.log(JSON.stringify(config, null, 2));
  console.log('');
  console.log('💡 계정 정보 인코딩:');
  console.log('echo "your_id,your_password" | base64');
}

// 메인 실행 로직
async function main() {
  const args = process.argv.slice(2);
  
  // MCP 서버 모드 감지 (환경변수로 구분)
  if (process.env.MCP_SERVER_MODE === 'true' || process.stdin.isTTY === false) {
    // MCP 서버 모드 - stdin/stdout으로 JSON-RPC 통신
    const credentials = process.env.LOTTO_CREDENTIALS;
    
    if (!credentials) {
      console.error('❌ LOTTO_CREDENTIALS 환경변수가 설정되지 않았습니다.');
      process.exit(1);
    }
    
    startMCPServer(credentials);
    return;
  }
  
  // CLI 모드
  // 도움말
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // 버전
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }
  
  // 설정 도우미
  if (args.includes('--setup')) {
    await setupCredentials();
    return;
  }
  
  // 인코딩
  if (args.includes('--encode')) {
    const encodeIndex = args.indexOf('--encode');
    const id = args[encodeIndex + 1];
    const password = args[encodeIndex + 2];
    encodeCredentials(id, password);
    return;
  }
  
  // 설정 예시
  if (args.includes('--config')) {
    showConfig();
    return;
  }
  
  // 기본값: MCP 서버 실행
  const credentials = process.env.LOTTO_CREDENTIALS;
  
  if (!credentials) {
    console.error('❌ LOTTO_CREDENTIALS 환경변수가 설정되지 않았습니다.');
    console.log('');
    
    // 실제 패키지명 가져오기
    let packageName = '@your-username/lotto-mcp-server';
    try {
      const packagePath = join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      packageName = packageJson.name;
    } catch (error) {
      // 기본값 사용
    }

    console.log(`💡 도움말: npx ${packageName} --help`);
    console.log(`🔧 설정: npx ${packageName} --setup`);
    process.exit(1);
  }
  
  // MCP 서버 실행
  startMCPServer(credentials);
}

main().catch((error) => {
  console.error('❌ 실행 중 오류 발생:', error.message);
  process.exit(1);
});