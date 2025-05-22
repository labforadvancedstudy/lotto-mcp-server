#!/usr/bin/env node

import { createInterface } from 'readline';
import { encryptCredentials, generateSecretKey, encodeCredentialsSimple } from './crypto-utils.js';

interface CredentialInput {
  id: string;
  password: string;
  useSimpleMode: boolean;
  useCustomSecret: boolean;
  customSecret?: string;
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    
    let input = '';
    
    const handler = (data: Buffer) => {
      const char = data.toString();
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
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

async function getCredentials(): Promise<CredentialInput> {
  console.log('🔐 로또 계정 정보 인코딩 도구');
  console.log('================================\n');
  
  const id = await question('동행복권 ID: ');
  const password = await questionHidden('동행복권 패스워드: ');
  
  console.log('\n📌 인코딩 방식을 선택하세요:');
  console.log('1. 간단 모드 (Base64) - 추천');
  console.log('2. 고급 모드 (AES 암호화)');
  
  const modeAnswer = await question('\n선택 (1/2): ');
  const useSimpleMode = modeAnswer === '1' || modeAnswer === '';
  
  let useCustomSecret = false;
  let customSecret: string | undefined;
  
  if (!useSimpleMode) {
    const useCustomSecretAnswer = await question('사용자 정의 암호화 키를 사용하시겠습니까? (y/N): ');
    useCustomSecret = useCustomSecretAnswer.toLowerCase() === 'y' || useCustomSecretAnswer.toLowerCase() === 'yes';
    
    if (useCustomSecret) {
      customSecret = await questionHidden('암호화 키 입력 (32자 이상 권장): ');
      if (customSecret.length < 8) {
        console.log('\n⚠️  경고: 암호화 키가 너무 짧습니다. 보안을 위해 최소 8자 이상 입력해주세요.');
        customSecret = await questionHidden('암호화 키 재입력: ');
      }
    }
  }
  
  return { id, password, useSimpleMode, useCustomSecret, customSecret };
}

function generateSimpleMCPConfig(encodedCredentials: string): string {
  const config = {
    mcpServers: {
      lotto: {
        command: "node",
        args: ["path/to/lotto-mcp-server/dist/index.js"],
        env: {
          LOTTO_CREDENTIALS: encodedCredentials
        }
      }
    }
  };
  
  return JSON.stringify(config, null, 2);
}

function generateAdvancedMCPConfig(encryptedId: string, encryptedPassword: string, secretKey?: string): string {
  const config = {
    mcpServers: {
      lotto: {
        command: "node",
        args: ["path/to/lotto-mcp-server/dist/index.js"],
        env: {
          LOTTO_ENCRYPTED_ID: encryptedId,
          LOTTO_ENCRYPTED_PASSWORD: encryptedPassword,
          ...(secretKey && { LOTTO_SECRET_KEY: secretKey })
        }
      }
    }
  };
  
  return JSON.stringify(config, null, 2);
}

async function main() {
  try {
    const credentials = await getCredentials();
    
    console.log('\n✅ 인코딩 완료!\n');
    
    if (credentials.useSimpleMode) {
      // 간단 모드 (Base64)
      const encoded = encodeCredentialsSimple(credentials.id, credentials.password);
      
      console.log('🔑 Base64 인코딩된 계정 정보:');
      console.log('================================');
      console.log(`인코딩된 계정: ${encoded}`);
      
      console.log('\n💡 터미널에서 직접 생성하는 방법:');
      console.log('================================');
      console.log(`echo "${credentials.id},${credentials.password}" | base64`);
      
      console.log('\n📋 Claude Desktop 설정 파일 (claude_desktop_config.json):');
      console.log('================================');
      console.log(generateSimpleMCPConfig(encoded));
      
    } else {
      // 고급 모드 (AES 암호화)
      let secretKey: string | undefined;
      if (credentials.useCustomSecret) {
        secretKey = credentials.customSecret;
      }
      
      const encrypted = encryptCredentials(credentials.id, credentials.password, secretKey);
      
      console.log('🔑 AES 암호화된 계정 정보:');
      console.log('================================');
      console.log(`암호화된 ID: ${encrypted.encryptedId}`);
      console.log(`암호화된 패스워드: ${encrypted.encryptedPassword}`);
      
      if (credentials.useCustomSecret && credentials.customSecret) {
        console.log(`사용자 정의 키: ${credentials.customSecret}`);
      }
      
      console.log('\n📋 Claude Desktop 설정 파일 (claude_desktop_config.json):');
      console.log('================================');
      console.log(generateAdvancedMCPConfig(encrypted.encryptedId, encrypted.encryptedPassword, credentials.customSecret));
    }
    
    console.log('\n📝 사용법:');
    console.log('1. 위의 설정을 claude_desktop_config.json에 복사하세요');
    console.log('2. "path/to/lotto-mcp-server/dist/index.js"를 실제 경로로 변경하세요');
    console.log('3. Claude Desktop을 재시작하세요');
    console.log('4. 이제 ID/패스워드 없이 "로또 3게임 구매해줘"라고 말하면 됩니다!');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error instanceof Error ? error.message : '알 수 없는 오류');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();