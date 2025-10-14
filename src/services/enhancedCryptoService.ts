import { CryptoUtils } from '../utils/cryptoUtils';

export interface EncryptedApiKey {
  encryptedData: string;
  salt: string;
  iv: string;
  algorithm: string;
  keyDerivation: string;
  timestamp: number;
  version: string;
}

export interface ApiKeyMetadata {
  provider: string;
  keyId: string;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  isActive: boolean;
  expiresAt?: number;
}

export class EnhancedCryptoService {
  private static instance: EnhancedCryptoService;
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  private readonly SALT_LENGTH = 16;
  private readonly ITERATIONS = 100000;
  private readonly VERSION = '2.0.0';

  static getInstance(): EnhancedCryptoService {
    if (!EnhancedCryptoService.instance) {
      EnhancedCryptoService.instance = new EnhancedCryptoService();
    }
    return EnhancedCryptoService.instance;
  }

  /**
   * API 키 암호화
   */
  async encryptApiKey(apiKey: string, userPassword: string): Promise<EncryptedApiKey> {
    try {
      // 1. 솔트 생성
      const salt = this.generateSalt();
      
      // 2. 키 유도
      const derivedKey = await this.deriveKey(userPassword, salt);
      
      // 3. IV 생성
      const iv = this.generateIV();
      
      // 4. 암호화
      const encryptedData = await this.encrypt(apiKey, derivedKey, iv);
      
      return {
        encryptedData,
        salt,
        iv,
        algorithm: this.ALGORITHM,
        keyDerivation: 'PBKDF2',
        timestamp: Date.now(),
        version: this.VERSION
      };
    } catch (error) {
      console.error('API 키 암호화 실패:', error);
      throw new Error('API 키 암호화에 실패했습니다.');
    }
  }

  /**
   * API 키 복호화
   */
  async decryptApiKey(encryptedApiKey: EncryptedApiKey, userPassword: string): Promise<string> {
    try {
      // 1. 키 유도
      const derivedKey = await this.deriveKey(userPassword, encryptedApiKey.salt);
      
      // 2. 복호화
      const decryptedData = await this.decrypt(
        encryptedApiKey.encryptedData,
        derivedKey,
        encryptedApiKey.iv
      );
      
      return decryptedData;
    } catch (error) {
      console.error('API 키 복호화 실패:', error);
      throw new Error('API 키 복호화에 실패했습니다.');
    }
  }

  /**
   * 솔트 생성
   */
  private generateSalt(): string {
    const salt = new Uint8Array(this.SALT_LENGTH);
    crypto.getRandomValues(salt);
    return this.arrayBufferToBase64(salt);
  }

  /**
   * IV 생성
   */
  private generateIV(): string {
    const iv = new Uint8Array(this.IV_LENGTH);
    crypto.getRandomValues(iv);
    return this.arrayBufferToBase64(iv);
  }

  /**
   * 키 유도 (PBKDF2)
   */
  private async deriveKey(password: string, salt: string): Promise<CryptoKey> {
    try {
      const passwordBuffer = new TextEncoder().encode(password);
      const saltBuffer = this.base64ToArrayBuffer(salt);
      
      const importedKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: this.ITERATIONS,
          hash: 'SHA-256'
        },
        importedKey,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );
      
      return derivedKey;
    } catch (error) {
      console.error('키 유도 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터 암호화
   */
  private async encrypt(data: string, key: CryptoKey, iv: string): Promise<string> {
    try {
      const dataBuffer = new TextEncoder().encode(data);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: ivBuffer
        },
        key,
        dataBuffer
      );
      
      return this.arrayBufferToBase64(encryptedBuffer);
    } catch (error) {
      console.error('데이터 암호화 실패:', error);
      throw error;
    }
  }

  /**
   * 데이터 복호화
   */
  private async decrypt(encryptedData: string, key: CryptoKey, iv: string): Promise<string> {
    try {
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('데이터 복호화 실패:', error);
      throw error;
    }
  }

  /**
   * ArrayBuffer를 Base64로 변환
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Base64를 ArrayBuffer로 변환
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * API 키 메타데이터 생성
   */
  createApiKeyMetadata(provider: string, keyId: string): ApiKeyMetadata {
    return {
      provider,
      keyId,
      createdAt: Date.now(),
      lastUsed: 0,
      usageCount: 0,
      isActive: true
    };
  }

  /**
   * API 키 사용 기록 업데이트
   */
  updateApiKeyUsage(metadata: ApiKeyMetadata): ApiKeyMetadata {
    return {
      ...metadata,
      lastUsed: Date.now(),
      usageCount: metadata.usageCount + 1
    };
  }

  /**
   * API 키 만료 확인
   */
  isApiKeyExpired(metadata: ApiKeyMetadata): boolean {
    if (!metadata.expiresAt) return false;
    return Date.now() > metadata.expiresAt;
  }

  /**
   * API 키 보안 검사
   */
  validateApiKeySecurity(apiKey: string): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 1. 길이 검사
    if (apiKey.length < 20) {
      issues.push('API 키가 너무 짧습니다.');
      recommendations.push('최소 20자 이상의 API 키를 사용하세요.');
    }

    // 2. 복잡성 검사
    const hasUpperCase = /[A-Z]/.test(apiKey);
    const hasLowerCase = /[a-z]/.test(apiKey);
    const hasNumbers = /\d/.test(apiKey);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(apiKey);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      issues.push('API 키에 대소문자와 숫자가 모두 포함되어야 합니다.');
      recommendations.push('대소문자, 숫자, 특수문자를 조합하여 사용하세요.');
    }

    // 3. 패턴 검사
    const commonPatterns = [
      /^sk-[a-zA-Z0-9]{48}$/, // OpenAI
      /^AIza[a-zA-Z0-9]{35}$/, // Google AI
      /^xoxb-[a-zA-Z0-9-]+$/, // Slack
      /^ghp_[a-zA-Z0-9]{36}$/ // GitHub
    ];

    const matchesPattern = commonPatterns.some(pattern => pattern.test(apiKey));
    if (!matchesPattern) {
      issues.push('API 키 형식이 일반적인 패턴과 일치하지 않습니다.');
      recommendations.push('올바른 API 키 형식을 확인하세요.');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * API 키 마스킹
   */
  maskApiKey(apiKey: string, visibleChars: number = 4): string {
    if (apiKey.length <= visibleChars * 2) {
      return '*'.repeat(apiKey.length);
    }
    
    const start = apiKey.substring(0, visibleChars);
    const end = apiKey.substring(apiKey.length - visibleChars);
    const middle = '*'.repeat(apiKey.length - (visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }

  /**
   * API 키 해시 생성 (검증용)
   */
  async generateApiKeyHash(apiKey: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    } catch (error) {
      console.error('API 키 해시 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 암호화된 API 키 저장
   */
  async storeEncryptedApiKey(
    userId: string,
    provider: string,
    encryptedApiKey: EncryptedApiKey,
    metadata: ApiKeyMetadata
  ): Promise<boolean> {
    try {
      const storageKey = `encrypted_api_key_${userId}_${provider}`;
      const metadataKey = `api_key_metadata_${userId}_${provider}`;
      
      localStorage.setItem(storageKey, JSON.stringify(encryptedApiKey));
      localStorage.setItem(metadataKey, JSON.stringify(metadata));
      
      console.log(`🔐 암호화된 API 키 저장 완료: ${provider}`);
      return true;
    } catch (error) {
      console.error('암호화된 API 키 저장 실패:', error);
      return false;
    }
  }

  /**
   * 암호화된 API 키 로드
   */
  loadEncryptedApiKey(userId: string, provider: string): {
    encryptedApiKey: EncryptedApiKey | null;
    metadata: ApiKeyMetadata | null;
  } {
    try {
      const storageKey = `encrypted_api_key_${userId}_${provider}`;
      const metadataKey = `api_key_metadata_${userId}_${provider}`;
      
      const encryptedData = localStorage.getItem(storageKey);
      const metadataData = localStorage.getItem(metadataKey);
      
      return {
        encryptedApiKey: encryptedData ? JSON.parse(encryptedData) : null,
        metadata: metadataData ? JSON.parse(metadataData) : null
      };
    } catch (error) {
      console.error('암호화된 API 키 로드 실패:', error);
      return {
        encryptedApiKey: null,
        metadata: null
      };
    }
  }

  /**
   * 암호화된 API 키 삭제
   */
  deleteEncryptedApiKey(userId: string, provider: string): boolean {
    try {
      const storageKey = `encrypted_api_key_${userId}_${provider}`;
      const metadataKey = `api_key_metadata_${userId}_${provider}`;
      
      localStorage.removeItem(storageKey);
      localStorage.removeItem(metadataKey);
      
      console.log(`🗑️ 암호화된 API 키 삭제 완료: ${provider}`);
      return true;
    } catch (error) {
      console.error('암호화된 API 키 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 사용자별 암호화된 API 키 목록 조회
   */
  getEncryptedApiKeyList(userId: string): Array<{
    provider: string;
    metadata: ApiKeyMetadata;
    isExpired: boolean;
  }> {
    const apiKeys: Array<{
      provider: string;
      metadata: ApiKeyMetadata;
      isExpired: boolean;
    }> = [];

    try {
      // localStorage에서 사용자별 API 키 메타데이터 조회
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`api_key_metadata_${userId}_`)) {
          const provider = key.replace(`api_key_metadata_${userId}_`, '');
          const metadataData = localStorage.getItem(key);
          
          if (metadataData) {
            const metadata = JSON.parse(metadataData);
            apiKeys.push({
              provider,
              metadata,
              isExpired: this.isApiKeyExpired(metadata)
            });
          }
        }
      }
    } catch (error) {
      console.error('암호화된 API 키 목록 조회 실패:', error);
    }

    return apiKeys;
  }
}

export const enhancedCryptoService = EnhancedCryptoService.getInstance();
