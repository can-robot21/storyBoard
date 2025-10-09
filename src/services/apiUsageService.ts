import { APIUsage, APIUsageStats, APIConfig, APIStatus } from '../types/api-usage';

/**
 * API 사용량 추적 서비스
 */
export class APIUsageService {
  private static instance: APIUsageService;
  private usageHistory: APIUsage[] = [];
  private apiConfigs: Record<string, APIConfig> = {};

  private constructor() {
    this.initializeAPIConfigs();
    this.loadUsageHistory();
  }

  static getInstance(): APIUsageService {
    if (!APIUsageService.instance) {
      APIUsageService.instance = new APIUsageService();
    }
    return APIUsageService.instance;
  }

  /**
   * API 설정 초기화
   */
  private initializeAPIConfigs(): void {
    this.apiConfigs = {
      'google-gemini-pro': {
        provider: 'Google',
        model: 'gemini-pro',
        pricing: {
          tier: 'free',
          freeQuota: 1000, // 월 1000회 무료
        },
        features: {
          maxTokens: 8000,
        },
      },
      'google-veo-3.0': {
        provider: 'Google',
        model: 'veo-3.0-generate-001',
        pricing: {
          tier: 'free',
          freeQuota: 10, // 월 10개 무료
        },
        features: {
          maxTokens: 1000,
          maxDuration: 8,
          maxResolution: '720p',
        },
      },
      'google-veo-3.0-fast': {
        provider: 'Google',
        model: 'veo-3.0-fast',
        pricing: {
          tier: 'paid',
          costPerToken: 0.05,
          freeQuota: 5, // 월 5개 무료
        },
        features: {
          maxTokens: 1000,
          maxDuration: 8,
          maxResolution: '720p',
        },
      },
      'google-veo-3.0-standard': {
        provider: 'Google',
        model: 'veo-3.0-standard',
        pricing: {
          tier: 'paid',
          costPerToken: 0.1,
          freeQuota: 3, // 월 3개 무료
        },
        features: {
          maxTokens: 1000,
          maxDuration: 8,
          maxResolution: '1080p',
        },
      },
      'openai-gpt-4o': {
        provider: 'OpenAI',
        model: 'gpt-4o',
        pricing: {
          tier: 'paid',
          costPerToken: 0.03,
          freeQuota: 0,
        },
        features: {
          maxTokens: 4000,
        },
      },
      'openai-dall-e-3': {
        provider: 'OpenAI',
        model: 'dall-e-3',
        pricing: {
          tier: 'paid',
          costPerToken: 0.04,
          freeQuota: 0,
        },
        features: {
          maxTokens: 1000,
        },
      },
    };
  }

  /**
   * 사용량 기록
   */
  recordUsage(usage: Omit<APIUsage, 'id' | 'timestamp'>): void {
    const newUsage: APIUsage = {
      ...usage,
      id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.usageHistory.push(newUsage);
    this.saveUsageHistory();

    console.log(`API 사용량 기록: ${usage.provider}/${usage.model} - ${usage.tokensUsed} 토큰, $${usage.cost}`);
  }

  /**
   * 사용량 통계 조회
   */
  getUsageStats(userId?: string): APIUsageStats {
    const userUsage = userId 
      ? this.usageHistory.filter(u => u.userId === userId)
      : this.usageHistory;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = userUsage.filter(u => u.timestamp >= currentMonth);

    const totalTokens = userUsage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const totalCost = userUsage.reduce((sum, u) => sum + u.cost, 0);

    const usageByProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};
    const usageByModel: Record<string, { tokens: number; cost: number; requests: number }> = {};

    userUsage.forEach(usage => {
      // Provider별 집계
      if (!usageByProvider[usage.provider]) {
        usageByProvider[usage.provider] = { tokens: 0, cost: 0, requests: 0 };
      }
      usageByProvider[usage.provider].tokens += usage.tokensUsed;
      usageByProvider[usage.provider].cost += usage.cost;
      usageByProvider[usage.provider].requests += 1;

      // Model별 집계
      const modelKey = `${usage.provider}-${usage.model}`;
      if (!usageByModel[modelKey]) {
        usageByModel[modelKey] = { tokens: 0, cost: 0, requests: 0 };
      }
      usageByModel[modelKey].tokens += usage.tokensUsed;
      usageByModel[modelKey].cost += usage.cost;
      usageByModel[modelKey].requests += 1;
    });

    // 월별 사용량 계산
    const monthlyTokens = monthlyUsage.reduce((sum, u) => sum + u.tokensUsed, 0);
    const monthlyLimit = this.getMonthlyLimit();
    const remaining = Math.max(0, monthlyLimit - monthlyTokens);

    return {
      totalTokens,
      totalCost,
      usageByProvider,
      usageByModel,
      monthlyUsage: {
        current: monthlyTokens,
        limit: monthlyLimit,
        remaining,
      },
    };
  }

  /**
   * API 상태 조회
   */
  getAPIStatus(provider: string, model: string): APIStatus {
    const configKey = `${provider.toLowerCase()}-${model.toLowerCase()}`;
    const config = this.apiConfigs[configKey];

    if (!config) {
      return {
        isActive: false,
        quotaRemaining: 0,
        quotaUsed: 0,
        lastUsed: new Date(),
        errorMessage: 'API 설정을 찾을 수 없습니다.',
      };
    }

    const stats = this.getUsageStats();
    const monthlyUsage = stats.monthlyUsage;
    const isActive = monthlyUsage.remaining > 0;

    return {
      isActive,
      quotaRemaining: monthlyUsage.remaining,
      quotaUsed: monthlyUsage.current,
      lastUsed: this.getLastUsedTime(provider, model),
      errorMessage: !isActive ? '월별 사용량 한도를 초과했습니다.' : undefined,
    };
  }

  /**
   * 월별 사용량 한도 조회
   */
  private getMonthlyLimit(): number {
    // 기본 월별 한도 (모든 API 합계)
    return 10000; // 10,000 토큰
  }

  /**
   * 마지막 사용 시간 조회
   */
  private getLastUsedTime(provider: string, model: string): Date {
    const lastUsage = this.usageHistory
      .filter(u => u.provider === provider && u.model === model)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return lastUsage?.timestamp || new Date();
  }

  /**
   * 사용량 히스토리 로드
   */
  private loadUsageHistory(): void {
    try {
      const saved = localStorage.getItem('api-usage-history');
      if (saved) {
        this.usageHistory = JSON.parse(saved).map((u: any) => ({
          ...u,
          timestamp: new Date(u.timestamp),
        }));
      }
    } catch (error) {
      console.error('API 사용량 히스토리 로드 실패:', error);
      this.usageHistory = [];
    }
  }

  /**
   * 사용량 히스토리 저장
   */
  private saveUsageHistory(): void {
    try {
      localStorage.setItem('api-usage-history', JSON.stringify(this.usageHistory));
    } catch (error) {
      console.error('API 사용량 히스토리 저장 실패:', error);
    }
  }

  /**
   * 사용량 히스토리 초기화
   */
  clearUsageHistory(): void {
    this.usageHistory = [];
    this.saveUsageHistory();
  }

  /**
   * API 설정 조회
   */
  getAPIConfig(provider: string, model: string): APIConfig | null {
    const configKey = `${provider.toLowerCase()}-${model.toLowerCase()}`;
    return this.apiConfigs[configKey] || null;
  }

  /**
   * 모든 API 설정 조회
   */
  getAllAPIConfigs(): Record<string, APIConfig> {
    return { ...this.apiConfigs };
  }
}

// 싱글톤 인스턴스 내보내기
export const apiUsageService = APIUsageService.getInstance();
