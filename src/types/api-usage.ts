// API 사용량 추적 타입 정의
export interface APIUsage {
  id: string;
  provider: string;
  model: string;
  actionType: 'text' | 'image' | 'video';
  tokensUsed: number;
  cost: number;
  timestamp: Date;
  userId?: string;
  projectId?: string;
}

export interface APIUsageStats {
  totalTokens: number;
  totalCost: number;
  usageByProvider: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  usageByModel: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  monthlyUsage: {
    current: number;
    limit: number;
    remaining: number;
  };
}

export interface APIConfig {
  provider: string;
  model: string;
  pricing: {
    tier: 'free' | 'paid';
    costPerToken?: number;
    monthlyLimit?: number;
    freeQuota?: number;
  };
  features: {
    maxTokens: number;
    maxDuration?: number;
    maxResolution?: string;
  };
}

export interface APIStatus {
  isActive: boolean;
  quotaRemaining: number;
  quotaUsed: number;
  lastUsed: Date;
  errorMessage?: string;
}
