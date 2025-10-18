import { enhancedCryptoService, EncryptedApiKey, ApiKeyMetadata } from './enhancedCryptoService';
import { databaseService } from './database/DatabaseService';
import { AuthService } from './authService';

export interface ApiKeyManagementResult {
  success: boolean;
  message: string;
  data?: any;
  errors: string[];
}

export interface ApiKeyUsageStats {
  provider: string;
  totalUsage: number;
  lastUsed: number;
  averageUsagePerDay: number;
  isActive: boolean;
  isExpired: boolean;
}

export class EnhancedApiKeyService {
  private static instance: EnhancedApiKeyService;
  private readonly SUPPORTED_PROVIDERS = [
    'google',
    'openai',
    'anthropic',
    'midjourney',
    'nano-banana'
  ];

  static getInstance(): EnhancedApiKeyService {
    if (!EnhancedApiKeyService.instance) {
      EnhancedApiKeyService.instance = new EnhancedApiKeyService();
    }
    return EnhancedApiKeyService.instance;
  }

  /**
   * API 키 저장 (암호화)
   */
  async saveApiKey(
    userId: string,
    provider: string,
    apiKey: string,
    userPassword: string,
    options?: {
      expiresAt?: number;
      isActive?: boolean;
    }
  ): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`🔐 API 키 저장 시작: ${provider}`);

      // 1. API 키 보안 검사
      const securityCheck = enhancedCryptoService.validateApiKeySecurity(apiKey);
      if (!securityCheck.isValid) {
        result.errors.push(...securityCheck.issues);
        result.message = 'API 키 보안 검사 실패';
        return result;
      }

      // 2. API 키 암호화
      const encryptedApiKey = await enhancedCryptoService.encryptApiKey(apiKey, userPassword);

      // 3. 메타데이터 생성
      const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const metadata = enhancedCryptoService.createApiKeyMetadata(provider, keyId);
      
      if (options?.expiresAt) {
        metadata.expiresAt = options.expiresAt;
      }
      if (options?.isActive !== undefined) {
        metadata.isActive = options.isActive;
      }

      // 4. 암호화된 API 키 저장
      const stored = await enhancedCryptoService.storeEncryptedApiKey(
        userId,
        provider,
        encryptedApiKey,
        metadata
      );

      if (!stored) {
        result.errors.push('API 키 저장에 실패했습니다.');
        return result;
      }

      // 5. 데이터베이스에도 저장 (호환성)
      await databaseService.saveUserApiKey(userId, provider, apiKey);

      result.success = true;
      result.message = 'API 키가 성공적으로 저장되었습니다.';
      result.data = {
        provider,
        keyId,
        maskedKey: enhancedCryptoService.maskApiKey(apiKey),
        metadata
      };

      console.log(`✅ API 키 저장 완료: ${provider}`);
      return result;
    } catch (error) {
      console.error('❌ API 키 저장 실패:', error);
      result.errors.push(`API 키 저장 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 로드 (복호화)
   */
  async loadApiKey(
    userId: string,
    provider: string,
    userPassword: string
  ): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`🔓 API 키 로드 시작: ${provider}`);

      // 1. 암호화된 API 키 로드
      const { encryptedApiKey, metadata } = enhancedCryptoService.loadEncryptedApiKey(userId, provider);
      
      if (!encryptedApiKey || !metadata) {
        result.errors.push('저장된 API 키를 찾을 수 없습니다.');
        return result;
      }

      // 2. 만료 확인
      if (enhancedCryptoService.isApiKeyExpired(metadata)) {
        result.errors.push('API 키가 만료되었습니다.');
        return result;
      }

      // 3. 활성 상태 확인
      if (!metadata.isActive) {
        result.errors.push('API 키가 비활성화되어 있습니다.');
        return result;
      }

      // 4. API 키 복호화
      const decryptedApiKey = await enhancedCryptoService.decryptApiKey(encryptedApiKey, userPassword);

      // 5. 사용 기록 업데이트
      const updatedMetadata = enhancedCryptoService.updateApiKeyUsage(metadata);
      await enhancedCryptoService.storeEncryptedApiKey(userId, provider, encryptedApiKey, updatedMetadata);

      result.success = true;
      result.message = 'API 키가 성공적으로 로드되었습니다.';
      result.data = {
        provider,
        apiKey: decryptedApiKey,
        metadata: updatedMetadata
      };

      console.log(`✅ API 키 로드 완료: ${provider}`);
      return result;
    } catch (error) {
      console.error('❌ API 키 로드 실패:', error);
      result.errors.push(`API 키 로드 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 삭제
   */
  async deleteApiKey(userId: string, provider: string): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`🗑️ API 키 삭제 시작: ${provider}`);

      // 1. 암호화된 API 키 삭제
      const deleted = enhancedCryptoService.deleteEncryptedApiKey(userId, provider);
      
      if (!deleted) {
        result.errors.push('API 키 삭제에 실패했습니다.');
        return result;
      }

      // 2. 데이터베이스에서도 삭제
      await databaseService.deleteUserApiKey(userId, provider);

      result.success = true;
      result.message = 'API 키가 성공적으로 삭제되었습니다.';

      console.log(`✅ API 키 삭제 완료: ${provider}`);
      return result;
    } catch (error) {
      console.error('❌ API 키 삭제 실패:', error);
      result.errors.push(`API 키 삭제 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 목록 조회
   */
  async getApiKeyList(userId: string): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`📋 API 키 목록 조회 시작: ${userId}`);

      // 1. 암호화된 API 키 목록 조회
      const encryptedApiKeys = enhancedCryptoService.getEncryptedApiKeyList(userId);

      // 2. 메타데이터만 반환 (보안)
      const apiKeyList = encryptedApiKeys.map(item => ({
        provider: item.provider,
        keyId: item.metadata.keyId,
        createdAt: item.metadata.createdAt,
        lastUsed: item.metadata.lastUsed,
        usageCount: item.metadata.usageCount,
        isActive: item.metadata.isActive,
        isExpired: item.isExpired,
        expiresAt: item.metadata.expiresAt,
        maskedKey: this.generateMaskedKey(item.provider)
      }));

      result.success = true;
      result.message = 'API 키 목록이 성공적으로 조회되었습니다.';
      result.data = apiKeyList;

      console.log(`✅ API 키 목록 조회 완료: ${apiKeyList.length}개`);
      return result;
    } catch (error) {
      console.error('❌ API 키 목록 조회 실패:', error);
      result.errors.push(`API 키 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 사용 통계 조회
   */
  async getApiKeyUsageStats(userId: string): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`📊 API 키 사용 통계 조회 시작: ${userId}`);

      const encryptedApiKeys = enhancedCryptoService.getEncryptedApiKeyList(userId);
      const stats: ApiKeyUsageStats[] = [];

      for (const item of encryptedApiKeys) {
        const daysSinceCreation = Math.floor((Date.now() - item.metadata.createdAt) / (1000 * 60 * 60 * 24));
        const averageUsagePerDay = daysSinceCreation > 0 ? item.metadata.usageCount / daysSinceCreation : 0;

        stats.push({
          provider: item.provider,
          totalUsage: item.metadata.usageCount,
          lastUsed: item.metadata.lastUsed,
          averageUsagePerDay,
          isActive: item.metadata.isActive,
          isExpired: item.isExpired
        });
      }

      result.success = true;
      result.message = 'API 키 사용 통계가 성공적으로 조회되었습니다.';
      result.data = stats;

      console.log(`✅ API 키 사용 통계 조회 완료: ${stats.length}개`);
      return result;
    } catch (error) {
      console.error('❌ API 키 사용 통계 조회 실패:', error);
      result.errors.push(`API 키 사용 통계 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 활성화/비활성화
   */
  async toggleApiKeyStatus(userId: string, provider: string): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`🔄 API 키 상태 변경 시작: ${provider}`);

      // 1. 현재 API 키 로드
      const { encryptedApiKey, metadata } = enhancedCryptoService.loadEncryptedApiKey(userId, provider);
      
      if (!encryptedApiKey || !metadata) {
        result.errors.push('API 키를 찾을 수 없습니다.');
        return result;
      }

      // 2. 상태 변경
      metadata.isActive = !metadata.isActive;

      // 3. 업데이트된 메타데이터 저장
      await enhancedCryptoService.storeEncryptedApiKey(userId, provider, encryptedApiKey, metadata);

      result.success = true;
      result.message = `API 키가 ${metadata.isActive ? '활성화' : '비활성화'}되었습니다.`;
      result.data = {
        provider,
        isActive: metadata.isActive
      };

      console.log(`✅ API 키 상태 변경 완료: ${provider} (${metadata.isActive ? '활성' : '비활성'})`);
      return result;
    } catch (error) {
      console.error('❌ API 키 상태 변경 실패:', error);
      result.errors.push(`API 키 상태 변경 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 만료 설정
   */
  async setApiKeyExpiration(
    userId: string,
    provider: string,
    expiresAt: number
  ): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`⏰ API 키 만료 설정 시작: ${provider}`);

      // 1. 현재 API 키 로드
      const { encryptedApiKey, metadata } = enhancedCryptoService.loadEncryptedApiKey(userId, provider);
      
      if (!encryptedApiKey || !metadata) {
        result.errors.push('API 키를 찾을 수 없습니다.');
        return result;
      }

      // 2. 만료 시간 설정
      metadata.expiresAt = expiresAt;

      // 3. 업데이트된 메타데이터 저장
      await enhancedCryptoService.storeEncryptedApiKey(userId, provider, encryptedApiKey, metadata);

      result.success = true;
      result.message = 'API 키 만료 시간이 설정되었습니다.';
      result.data = {
        provider,
        expiresAt
      };

      console.log(`✅ API 키 만료 설정 완료: ${provider} (${new Date(expiresAt).toLocaleString()})`);
      return result;
    } catch (error) {
      console.error('❌ API 키 만료 설정 실패:', error);
      result.errors.push(`API 키 만료 설정 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * API 키 보안 검사
   */
  async performSecurityCheck(userId: string): Promise<ApiKeyManagementResult> {
    const result: ApiKeyManagementResult = {
      success: false,
      message: '',
      errors: []
    };

    try {
      console.log(`🔍 API 키 보안 검사 시작: ${userId}`);

      const encryptedApiKeys = enhancedCryptoService.getEncryptedApiKeyList(userId);
      const securityIssues: string[] = [];
      const recommendations: string[] = [];

      for (const item of encryptedApiKeys) {
        // 1. 만료된 API 키 확인
        if (item.isExpired) {
          securityIssues.push(`${item.provider} API 키가 만료되었습니다.`);
          recommendations.push(`${item.provider} API 키를 갱신하세요.`);
        }

        // 2. 오래된 API 키 확인 (1년 이상)
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        if (item.metadata.createdAt < oneYearAgo) {
          securityIssues.push(`${item.provider} API 키가 1년 이상 사용되었습니다.`);
          recommendations.push(`${item.provider} API 키를 주기적으로 갱신하세요.`);
        }

        // 3. 사용하지 않는 API 키 확인 (30일 이상)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        if (item.metadata.lastUsed < thirtyDaysAgo && item.metadata.usageCount > 0) {
          securityIssues.push(`${item.provider} API 키가 30일 이상 사용되지 않았습니다.`);
          recommendations.push(`사용하지 않는 ${item.provider} API 키를 삭제하거나 비활성화하세요.`);
        }
      }

      result.success = true;
      result.message = securityIssues.length === 0 ? '보안 검사를 통과했습니다.' : '보안 이슈가 발견되었습니다.';
      result.data = {
        issues: securityIssues,
        recommendations,
        totalApiKeys: encryptedApiKeys.length,
        activeApiKeys: encryptedApiKeys.filter(item => item.metadata.isActive).length,
        expiredApiKeys: encryptedApiKeys.filter(item => item.isExpired).length
      };

      console.log(`✅ API 키 보안 검사 완료: ${securityIssues.length}개 이슈 발견`);
      return result;
    } catch (error) {
      console.error('❌ API 키 보안 검사 실패:', error);
      result.errors.push(`API 키 보안 검사 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * 마스킹된 API 키 생성
   */
  private generateMaskedKey(provider: string): string {
    // 프로바이더별 기본 마스킹 패턴
    const patterns: { [key: string]: string } = {
      'google': 'AIza*******************************',
      'openai': 'sk-*******************************',
      'anthropic': 'sk-ant-*******************************',
      'midjourney': 'mj-*******************************',
      'nano-banana': 'nb-*******************************'
    };

    return patterns[provider] || '***-*******************************';
  }

  /**
   * 지원되는 프로바이더 목록 조회
   */
  getSupportedProviders(): string[] {
    return [...this.SUPPORTED_PROVIDERS];
  }

  /**
   * 프로바이더별 API 키 형식 검증
   */
  validateApiKeyFormat(provider: string, apiKey: string): boolean {
    const patterns: { [key: string]: RegExp } = {
      'google': /^AIza[a-zA-Z0-9]{35}$/,
      'openai': /^sk-[a-zA-Z0-9]{48}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9-]{95}$/,
      'midjourney': /^[a-zA-Z0-9-]{32}$/,
      'nano-banana': /^[a-zA-Z0-9]{32}$/
    };

    const pattern = patterns[provider];
    return pattern ? pattern.test(apiKey) : true; // 알 수 없는 프로바이더는 항상 true
  }
}

export const enhancedApiKeyService = EnhancedApiKeyService.getInstance();
