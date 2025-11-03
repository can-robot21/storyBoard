import { AIProvider } from './ai';
import { DetailedSettings } from './imageGeneration';

// AI 서비스 기능 정의
export interface AIServiceFeatures {
  promptOptimization: boolean;
  imageGeneration: boolean;
  imageAnalysis: boolean;
  supportedRatios: string[];
  supportedQualities: string[];
  customSettings: string[];
  maxImageSize?: number;
  maxPromptLength?: number;
}

// 프롬프트 최적화 결과
export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  provider: AIProvider;
  optimizationDetails: {
    appliedTechniques: string[];
    estimatedTokens: number;
    confidence: number;
  };
  timestamp: Date;
}

// 이미지 생성 옵션
export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio: string;
  quality: string;
  style: string;
  customSettings?: Record<string, any>;
  attachedImages?: File[];
  imageRoles?: any[];
}

// 이미지 생성 응답
export interface ImageGenerationResponse {
  images: Array<{
    url: string;
    base64?: string;
    metadata?: Record<string, any>;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: AIProvider;
  timestamp: Date;
}

// AI 서비스 어댑터 인터페이스
export interface AIServiceAdapter {
  optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult>;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;
  getSupportedFeatures(): AIServiceFeatures;
  validateSettings(settings: DetailedSettings): boolean;
  getServiceName(): string;
  isAvailable(): Promise<boolean>;
}

// AI 서비스 팩토리 인터페이스
export interface AIServiceFactory {
  createAdapter(provider: AIProvider): AIServiceAdapter;
  getAvailableProviders(): AIProvider[];
  getProviderFeatures(provider: AIProvider): AIServiceFeatures;
}

// AI 서비스 설정
export interface AIServiceConfig {
  provider: AIProvider;
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  customHeaders?: Record<string, string>;
}

// AI 서비스 상태
export interface AIServiceState {
  selectedProvider: AIProvider;
  availableProviders: AIProvider[];
  currentAdapter: AIServiceAdapter | null;
  isLoading: boolean;
  error: string | null;
  lastUsed: Date | null;
}

