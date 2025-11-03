import { AIProvider, FunctionBasedAIProviders, DEFAULT_FUNCTION_AI_PROVIDERS, GenerationType } from '../types/ai';

const STORAGE_KEY = 'function_based_ai_providers';

/**
 * 기능별 AI Provider 설정 관리 유틸리티
 */
export class AIProviderSettings {
  /**
   * 기능별 AI Provider 설정 로드
   */
  static load(): FunctionBasedAIProviders {
    try {
      if (typeof window === 'undefined') {
        return DEFAULT_FUNCTION_AI_PROVIDERS;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 유효성 검증
        if (
          parsed &&
          typeof parsed === 'object' &&
          ['text', 'image', 'video'].every(key => 
            key in parsed && 
            ['google', 'chatgpt', 'anthropic', 'kling'].includes(parsed[key])
          )
        ) {
          return parsed as FunctionBasedAIProviders;
        }
      }
    } catch (error) {
      console.error('기능별 AI Provider 설정 로드 실패:', error);
    }

    return { ...DEFAULT_FUNCTION_AI_PROVIDERS };
  }

  /**
   * 기능별 AI Provider 설정 저장
   */
  static save(providers: FunctionBasedAIProviders): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
        console.log('✅ 기능별 AI Provider 설정 저장:', providers);
      }
    } catch (error) {
      console.error('기능별 AI Provider 설정 저장 실패:', error);
    }
  }

  /**
   * 특정 기능의 AI Provider 가져오기
   */
  static getProviderForFunction(type: GenerationType): AIProvider {
    const settings = this.load();
    return settings[type] || DEFAULT_FUNCTION_AI_PROVIDERS[type];
  }

  /**
   * 특정 기능의 AI Provider 설정
   */
  static setProviderForFunction(type: GenerationType, provider: AIProvider): void {
    const settings = this.load();
    settings[type] = provider;
    this.save(settings);
  }

  /**
   * 모든 설정 초기화
   */
  static reset(): void {
    this.save(DEFAULT_FUNCTION_AI_PROVIDERS);
  }
}

