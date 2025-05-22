import { createCipher, createDecipher, randomBytes } from 'crypto';

export interface EncryptedCredentials {
  encryptedId: string;
  encryptedPassword: string;
}

export interface DecryptedCredentials {
  id: string;
  password: string;
}

/**
 * 간단한 Base64 인코딩 (ID,PASSWORD 형태)
 */
export function encodeCredentialsSimple(id: string, password: string): string {
  const combined = `${id},${password}`;
  return Buffer.from(combined, 'utf8').toString('base64');
}

/**
 * 간단한 Base64 디코딩 (ID,PASSWORD 형태)
 */
export function decodeCredentialsSimple(encoded: string): DecryptedCredentials {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const [id, password] = decoded.split(',');
    
    if (!id || !password) {
      throw new Error('잘못된 형식입니다. ID,PASSWORD 형태여야 합니다.');
    }
    
    return { id, password };
  } catch (error) {
    throw new Error(`Base64 디코딩 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 문자열을 간단히 암호화합니다 (호환성을 위해 간단한 방식 사용)
 */
export function encrypt(text: string, secretKey: string = 'default-key'): string {
  try {
    // 간단한 XOR 방식으로 변경 (Node.js 버전 호환성)
    const key = Buffer.from(secretKey, 'utf8');
    const data = Buffer.from(text, 'utf8');
    const encrypted = Buffer.alloc(data.length);
    
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key[i % key.length];
    }
    
    return encrypted.toString('base64');
  } catch (error) {
    throw new Error(`암호화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 암호화된 문자열을 복호화합니다
 */
export function decrypt(encryptedText: string, secretKey: string = 'default-key'): string {
  try {
    const key = Buffer.from(secretKey, 'utf8');
    const encrypted = Buffer.from(encryptedText, 'base64');
    const decrypted = Buffer.alloc(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key[i % key.length];
    }
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`복호화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * ID와 패스워드를 암호화합니다
 */
export function encryptCredentials(id: string, password: string, secretKey?: string): EncryptedCredentials {
  return {
    encryptedId: encrypt(id, secretKey),
    encryptedPassword: encrypt(password, secretKey)
  };
}

/**
 * 암호화된 ID와 패스워드를 복호화합니다
 */
export function decryptCredentials(
  encryptedId: string, 
  encryptedPassword: string, 
  secretKey?: string
): DecryptedCredentials {
  return {
    id: decrypt(encryptedId, secretKey),
    password: decrypt(encryptedPassword, secretKey)
  };
}

/**
 * 랜덤 시크릿 키를 생성합니다
 */
export function generateSecretKey(): string {
  return randomBytes(32).toString('hex');
}