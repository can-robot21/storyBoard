// AI 서비스 관련 타입들

// AI 제공자 타입
export type AIProvider = 'google' | 'chatgpt' | 'anthropic' | 'kling';

// 생성 기능 타입
export type GenerationType = 'text' | 'image' | 'video';

// 기능별 AI Provider 설정
export interface FunctionBasedAIProviders {
  text: AIProvider;
  image: AIProvider;
  video: AIProvider;
}

// 기본 기능별 AI Provider 설정
export const DEFAULT_FUNCTION_AI_PROVIDERS: FunctionBasedAIProviders = {
  text: 'google',
  image: 'google',
  video: 'google'
};

// AI 모델 타입
export type AIModel = 
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'claude-3-sonnet'
  | 'claude-3-opus'
  | 'gemini-2.5-flash-image-preview';

// 이미지 생성 모델 타입
export type ImageModel = 
  | 'imagen-4.0-fast-generate-001'
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001'
  | 'imagen-3.0-generate-002'
  | 'dall-e-3'
  | 'dall-e-2'
  | 'gemini-2.5-flash-image-preview'
  | 'gemini-2.5-flash-image';

// 영상 생성 모델 타입
export type VideoModel = 
  | 'veo-3.0-generate-001'
  | 'veo-3.0-fast-generate-001'
  | 'veo-3.0-generate-001'
  | 'sora';

// 영상 생성 모델 버전 타입
export type VideoModelVersion = 'veo-3.0-generate-001' | 'veo-3.0-fast' | 'veo-3.0-standard';

// 영상 모델 설정 타입
export interface VideoModelConfig {
  version: VideoModelVersion;
  model: VideoModel;
  displayName: string;
  description: string;
  features: {
    maxDuration: number;
    maxResolution: string;
    aspectRatios: string[];
    supportsPersonGeneration?: boolean;
    supportsAudio?: boolean;
    maxTokens?: number;
  };
  pricing: {
    tier: 'free' | 'paid';
    costPerSecond?: number;
    costPerToken?: number;
    freeQuota?: number;
  };
  performance: {
    generationSpeed: 'fast' | 'medium' | 'slow';
    quality: 'standard' | 'high' | 'ultra';
    reliability: number; // 0-100
  };
}

// 기본 AI 생성 옵션
export interface BaseAIOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  userId?: string;
  projectId?: string;
}

// 텍스트 생성 옵션
export interface TextGenerationOptions extends BaseAIOptions {
  provider: AIProvider;
  model: AIModel;
  stream?: boolean;
  systemPrompt?: string; // Provider별 기본 System Prompt가 없을 때 사용
  generationType?: GenerationType; // 텍스트/이미지/영상 구분
}

// 이미지 생성 옵션
export interface ImageGenerationOptions extends BaseAIOptions {
  provider: AIProvider;
  model: ImageModel;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality: 'standard' | 'high' | 'ultra';
  style?: 'photographic' | 'artistic' | 'cartoon' | 'anime';
  numberOfImages?: number;
}

// 영상 생성 옵션
export interface VideoGenerationOptions extends BaseAIOptions {
  provider: AIProvider;
  model: VideoModel;
  videoRatio: '16:9' | '1:1' | '9:16';
  duration: number; // 초 단위
  quality: 'standard' | 'high' | 'ultra';
  numberOfVideos?: number;
}

// AI 서비스 응답 타입들
export interface TextGenerationResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface ImageGenerationResponse {
  images: string[]; // base64 또는 URL
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface VideoGenerationResponse {
  videos: string[]; // URL 또는 base64
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  duration: number;
}

// AI 서비스 설정 타입
export interface AIServiceConfig {
  apiKey: string;
  baseUrl?: string;
}

// AI 서비스 인터페이스
export interface IAIService {
  generateText(options: TextGenerationOptions): Promise<TextGenerationResponse>;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;
  generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse>;
  isAvailable(): boolean;
  getConfig(): AIServiceConfig;
}

// AI 서비스 팩토리 타입
export interface AIServiceFactory {
  createService(provider: AIProvider, config: AIServiceConfig): IAIService;
  getAvailableProviders(): AIProvider[];
  validateConfig(provider: AIProvider, config: Partial<AIServiceConfig>): boolean;
}

// 프롬프트 템플릿 타입
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'text' | 'image' | 'video';
  template: string;
  variables: string[];
  example: {
    input: Record<string, any>;
    output: string;
  };
}

// AI 생성 히스토리 타입
export interface AIGenerationHistory {
  id: string;
  timestamp: number;
  provider: AIProvider;
  model: string;
  type: 'text' | 'image' | 'video';
  prompt: string;
  response: TextGenerationResponse | ImageGenerationResponse | VideoGenerationResponse;
  options: TextGenerationOptions | ImageGenerationOptions | VideoGenerationOptions;
  duration: number; // 밀리초
}

// AI 서비스 상태 타입
export interface AIServiceState {
  currentProvider: AIProvider;
  availableProviders: AIProvider[];
  isGenerating: boolean;
  generationHistory: AIGenerationHistory[];
  rateLimitStatus: {
    requestsRemaining: number;
    tokensRemaining: number;
    resetTime: number;
  };
  error: string | null;
}

// AI 서비스 액션 타입
export type AIServiceAction = 
  | { type: 'SET_PROVIDER'; payload: AIProvider }
  | { type: 'SET_AVAILABLE_PROVIDERS'; payload: AIProvider[] }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'ADD_GENERATION_HISTORY'; payload: AIGenerationHistory }
  | { type: 'UPDATE_RATE_LIMIT'; payload: { requestsRemaining: number; tokensRemaining: number; resetTime: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_HISTORY' };

// AI 서비스 훅 반환 타입
export interface UseAIServiceReturn {
  // 상태
  currentProvider: AIProvider;
  availableProviders: AIProvider[];
  isGenerating: boolean;
  generationHistory: AIGenerationHistory[];
  rateLimitStatus: AIServiceState['rateLimitStatus'];
  error: string | null;
  
  // 액션
  setProvider: (provider: AIProvider) => void;
  generateText: (options: Omit<TextGenerationOptions, 'provider'>) => Promise<TextGenerationResponse>;
  generateImage: (options: Omit<ImageGenerationOptions, 'provider'>) => Promise<ImageGenerationResponse>;
  generateVideo: (options: Omit<VideoGenerationOptions, 'provider'>) => Promise<VideoGenerationResponse>;
  clearHistory: () => void;
  clearError: () => void;
  
  // 유틸리티
  getAvailableModels: (type: 'text' | 'image' | 'video') => string[];
  getRateLimitStatus: () => AIServiceState['rateLimitStatus'];
  isProviderAvailable: (provider: AIProvider) => boolean;
}
