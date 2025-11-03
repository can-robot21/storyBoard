import { IAIService, AIServiceFactory, AIProvider, AIServiceConfig } from '../../types/ai';
import { GoogleAIService } from './GoogleAIService';
import { ChatGPTService } from './ChatGPTService';
import { NanoBananaService } from './NanoBananaService';

/**
 * AI 서비스 팩토리
 * 다양한 AI 제공자의 서비스를 생성하고 관리
 */
export class AIServiceFactoryImpl implements AIServiceFactory {
  private static instance: AIServiceFactoryImpl;
  private services: Map<AIProvider, IAIService> = new Map();

  private constructor() {}

  static getInstance(): AIServiceFactoryImpl {
    if (!AIServiceFactoryImpl.instance) {
      AIServiceFactoryImpl.instance = new AIServiceFactoryImpl();
    }
    return AIServiceFactoryImpl.instance;
  }

  createService(provider: AIProvider, config: AIServiceConfig): IAIService {
    // 기존 서비스가 있으면 재사용
    if (this.services.has(provider)) {
      const existingService = this.services.get(provider)!;
      if (existingService.isAvailable()) {
        return existingService;
      }
    }

    let service: IAIService;

    switch (provider) {
      case 'google':
        service = new GoogleAIService({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        });
        break;
      case 'chatgpt':
        service = new ChatGPTService({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        });
        break;
      case 'anthropic':
        // TODO: Anthropic 서비스 구현
        throw new Error('Anthropic 서비스는 아직 구현되지 않았습니다.');
      case 'kling':
        // TODO: Kling AI 서비스 구현
        throw new Error('Kling AI 서비스는 아직 구현되지 않았습니다.');
      default:
        throw new Error(`지원하지 않는 AI 제공자입니다: ${provider}`);
    }

    this.services.set(provider, service);
    return service;
  }

  getAvailableProviders(): AIProvider[] {
    const available: AIProvider[] = [];
    
    for (const [provider, service] of this.services) {
      if (service.isAvailable()) {
        available.push(provider);
      }
    }

    return available;
  }

  // 로그아웃 시 모든 서비스 무효화
  invalidateAllServices(): void {
    console.log('🔑 모든 AI 서비스 무효화 시작');
    this.services.clear();
    console.log('🔑 모든 AI 서비스 무효화 완료');
  }

  validateConfig(provider: AIProvider, config: Partial<AIServiceConfig>): boolean {
    try {
      switch (provider) {
        case 'google':
          return !!(config.apiKey && config.apiKey.startsWith('AI'));
        case 'chatgpt':
          return !!(config.apiKey && config.apiKey.startsWith('sk-'));
        case 'anthropic':
          return !!(config.apiKey && config.apiKey.startsWith('sk-ant-'));
        case 'kling':
          return !!(config.apiKey && config.apiKey.length > 0);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  getService(provider: AIProvider): IAIService | null {
    return this.services.get(provider) || null;
  }

  removeService(provider: AIProvider): void {
    this.services.delete(provider);
  }

  clearAllServices(): void {
    this.services.clear();
  }
}

// 싱글톤 인스턴스 내보내기
export const aiServiceFactory = AIServiceFactoryImpl.getInstance();
