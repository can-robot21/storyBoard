import { 
  AIServiceFactory, 
  AIServiceAdapter, 
  AIServiceFeatures 
} from '../../types/aiService';
import { AIProvider } from '../../types/ai';
import { BaseAIAdapter } from '../adapters/BaseAIAdapter';
import { NanoBananaAdapter } from '../adapters/NanoBananaAdapter';
import { ChatGPTAdapter } from '../adapters/ChatGPTAdapter';
import { ClaudeAdapter } from '../adapters/ClaudeAdapter';
import { KlingAdapter } from '../adapters/KlingAdapter';
import { NanoBananaService } from '../../services/ai/NanoBananaService';

/**
 * AI 서비스 팩토리
 * 각 AI 서비스별 어댑터를 생성하고 관리
 */
export class AIServiceFactoryImpl implements AIServiceFactory {
  private nanoBananaService: NanoBananaService;
  private adapters: Map<AIProvider, AIServiceAdapter> = new Map();
  private apiKeys: Map<AIProvider, { accessKey?: string; secretKey?: string; apiKey?: string }> = new Map();

  constructor(nanoBananaService: NanoBananaService) {
    this.nanoBananaService = nanoBananaService;
  }

  /**
   * API 키 설정
   */
  setApiKey(provider: AIProvider, credentials: { accessKey?: string; secretKey?: string; apiKey?: string }): void {
    this.apiKeys.set(provider, credentials);
    // 기존 어댑터 캐시 제거
    this.adapters.delete(provider);
  }

  /**
   * AI 서비스 어댑터 생성
   */
  createAdapter(provider: AIProvider): AIServiceAdapter {
    // 캐시된 어댑터가 있으면 반환
    if (this.adapters.has(provider)) {
      return this.adapters.get(provider)!;
    }

    let adapter: AIServiceAdapter;
    const credentials = this.apiKeys.get(provider);

    switch (provider) {
      case 'google':
        adapter = new NanoBananaAdapter(this.nanoBananaService);
        break;
      
      case 'chatgpt':
        if (!credentials?.apiKey) {
          throw new Error('ChatGPT API 키가 설정되지 않았습니다');
        }
        adapter = new ChatGPTAdapter(credentials.apiKey);
        break;
      
      case 'anthropic':
        if (!credentials?.apiKey) {
          throw new Error('Claude API 키가 설정되지 않았습니다');
        }
        adapter = new ClaudeAdapter(credentials.apiKey);
        break;
      
      case 'kling':
        if (!credentials?.accessKey || !credentials?.secretKey) {
          throw new Error('Kling AI Access Key와 Secret Key가 설정되지 않았습니다');
        }
        adapter = new KlingAdapter(credentials.accessKey, credentials.secretKey);
        break;
      
      default:
        throw new Error(`지원하지 않는 AI 서비스: ${provider}`);
    }

    // 어댑터 캐시
    this.adapters.set(provider, adapter);
    return adapter;
  }

  /**
   * 사용 가능한 AI 서비스 목록 반환
   */
  getAvailableProviders(): AIProvider[] {
    return ['google', 'chatgpt', 'anthropic', 'kling'];
  }

  /**
   * 특정 AI 서비스의 기능 반환
   */
  getProviderFeatures(provider: AIProvider): AIServiceFeatures {
    const adapter = this.createAdapter(provider);
    return adapter.getSupportedFeatures();
  }

  /**
   * 모든 AI 서비스의 기능 반환
   */
  getAllProviderFeatures(): Map<AIProvider, AIServiceFeatures> {
    const features = new Map<AIProvider, AIServiceFeatures>();
    
    for (const provider of this.getAvailableProviders()) {
      try {
        features.set(provider, this.getProviderFeatures(provider));
      } catch (error) {
        console.warn(`${provider} 서비스 기능 조회 실패:`, error);
      }
    }
    
    return features;
  }

  /**
   * AI 서비스 사용 가능 여부 확인
   */
  async checkProviderAvailability(provider: AIProvider): Promise<boolean> {
    try {
      const adapter = this.createAdapter(provider);
      return await adapter.isAvailable();
    } catch (error) {
      console.error(`${provider} 서비스 사용 가능 여부 확인 실패:`, error);
      return false;
    }
  }

  /**
   * 모든 AI 서비스 사용 가능 여부 확인
   */
  async checkAllProvidersAvailability(): Promise<Map<AIProvider, boolean>> {
    const availability = new Map<AIProvider, boolean>();
    
    for (const provider of this.getAvailableProviders()) {
      availability.set(provider, await this.checkProviderAvailability(provider));
    }
    
    return availability;
  }

  /**
   * 캐시된 어댑터 제거
   */
  clearAdapterCache(provider?: AIProvider): void {
    if (provider) {
      this.adapters.delete(provider);
    } else {
      this.adapters.clear();
    }
  }

  /**
   * 팩토리 상태 정보 반환
   */
  getFactoryStatus(): {
    availableProviders: AIProvider[];
    cachedAdapters: AIProvider[];
    totalAdapters: number;
  } {
    return {
      availableProviders: this.getAvailableProviders(),
      cachedAdapters: Array.from(this.adapters.keys()),
      totalAdapters: this.adapters.size
    };
  }
}

// 싱글톤 인스턴스 생성 함수
let factoryInstance: AIServiceFactoryImpl | null = null;

export const createAIServiceFactory = (nanoBananaService: NanoBananaService): AIServiceFactoryImpl => {
  if (!factoryInstance) {
    factoryInstance = new AIServiceFactoryImpl(nanoBananaService);
  }
  return factoryInstance;
};

export const getAIServiceFactory = (): AIServiceFactoryImpl => {
  if (!factoryInstance) {
    throw new Error('AI 서비스 팩토리가 초기화되지 않았습니다. createAIServiceFactory를 먼저 호출하세요.');
  }
  return factoryInstance;
};

