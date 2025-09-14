import { IAIService, TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';

/**
 * AI 서비스의 기본 구현체
 * 모든 AI 서비스는 이 클래스를 상속받아 구현해야 함
 */
export abstract class BaseAIService implements IAIService {
  protected config: any;
  protected isAvailableFlag: boolean = false;

  constructor(config: any) {
    this.config = config;
    this.validateConfig();
  }

  /**
   * 설정 검증 (하위 클래스에서 구현)
   */
  protected abstract validateConfig(): void;

  /**
   * 텍스트 생성 (하위 클래스에서 구현)
   */
  abstract generateText(options: TextGenerationOptions): Promise<TextGenerationResponse>;

  /**
   * 이미지 생성 (하위 클래스에서 구현)
   */
  abstract generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;

  /**
   * 영상 생성 (하위 클래스에서 구현)
   */
  abstract generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse>;

  /**
   * 서비스 사용 가능 여부 확인
   */
  isAvailable(): boolean {
    return this.isAvailableFlag;
  }

  /**
   * 설정 정보 반환
   */
  getConfig(): any {
    return this.config;
  }

  /**
   * 공통 에러 처리
   */
  protected handleError(error: any, operation: string): never {
    console.error(`AI 서비스 오류 (${operation}):`, error);
    throw new Error(`${operation} 중 오류가 발생했습니다: ${error.message || error}`);
  }

  /**
   * 공통 응답 포맷팅
   */
  protected formatTextResponse(text: string, usage: any, model: string, finishReason: string = 'stop'): TextGenerationResponse {
    return {
      text,
      usage: {
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
      model,
      finishReason
    };
  }

  protected formatImageResponse(images: string[], usage: any, model: string): ImageGenerationResponse {
    return {
      images,
      usage: {
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
      model
    };
  }

  protected formatVideoResponse(videos: string[], usage: any, model: string, duration: number): VideoGenerationResponse {
    return {
      videos,
      usage: {
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
      model,
      duration
    };
  }
}
