import { BaseAIService } from './BaseAIService';
import { TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';
import { apiUsageService } from '../apiUsageService';

/**
 * Google AI 서비스 구현체
 */
export class GoogleAIService extends BaseAIService {
  private ai: any;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    super(config);
    // 기존 googleAIService 인스턴스 사용
    this.ai = new (require('../googleAIService').GoogleAIService)();
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Google AI API 키가 필요합니다.');
    }
    this.isAvailableFlag = true;
  }

  async generateText(options: TextGenerationOptions): Promise<TextGenerationResponse> {
    try {
      const model = options.model || 'gemini-2.5-flash';
      
      // 기존 googleAIService의 generateText 메서드 사용
      const text = await this.ai.generateText(options.prompt, model);

      // 사용량 추적
      const estimatedTokens = Math.ceil(options.prompt.length / 4) + Math.ceil(text.length / 4);
      apiUsageService.recordUsage({
        provider: 'Google',
        model: model,
        actionType: 'text',
        tokensUsed: estimatedTokens,
        cost: 0, // 무료 모델
        userId: options.userId,
        projectId: options.projectId,
      });

      return this.formatTextResponse(
        text,
        { promptTokens: Math.ceil(options.prompt.length / 4), completionTokens: Math.ceil(text.length / 4), totalTokens: estimatedTokens },
        model
      );
    } catch (error) {
      this.handleError(error, '텍스트 생성');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const model = options.model || 'imagen-4.0-ultra-generate-001';
      const numberOfImages = options.numberOfImages || 1;
      
      const response = await this.ai.models.generateImages({
        model: model,
        prompt: options.prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: options.aspectRatio
        }
      });

      const images: string[] = [];
      if (response.generatedImages && response.generatedImages.length > 0) {
        for (const generatedImage of response.generatedImages) {
          if (generatedImage?.image?.imageBytes) {
            const base64ImageBytes = generatedImage.image.imageBytes;
            images.push(`data:image/jpeg;base64,${base64ImageBytes}`);
          }
        }
      }

      // 사용량 추적
      const estimatedTokens = Math.ceil(options.prompt.length / 4) + (numberOfImages * 100); // 이미지당 약 100 토큰
      apiUsageService.recordUsage({
        provider: 'Google',
        model: model,
        actionType: 'image',
        tokensUsed: estimatedTokens,
        cost: 0, // 무료 모델
        userId: options.userId,
        projectId: options.projectId,
      });

      return this.formatImageResponse(
        images,
        { promptTokens: Math.ceil(options.prompt.length / 4), completionTokens: numberOfImages * 100, totalTokens: estimatedTokens },
        model
      );
    } catch (error) {
      this.handleError(error, '이미지 생성');
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse> {
    try {
      const operation = await this.ai.models.generateVideos({
        model: options.model || 'veo-3.0-generate-preview',
        prompt: options.prompt,
        config: {
          numberOfVideos: options.numberOfVideos || 1,
          aspectRatio: options.videoRatio,
          durationSeconds: options.duration,
          personGeneration: 'ALLOW_ALL'
        }
      });

      // 영상 생성 완료까지 대기
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const updatedOperation = await this.ai.operations.getVideosOperation({ operation });
        if (updatedOperation.done) {
          break;
        }
      }

      const videos: string[] = [];
      if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
        for (const generatedVideo of operation.response.generatedVideos) {
          if (generatedVideo?.video?.uri) {
            videos.push(generatedVideo.video.uri);
          }
        }
      }

      return this.formatVideoResponse(
        videos,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'veo-3.0-generate-preview',
        options.duration
      );
    } catch (error) {
      this.handleError(error, '영상 생성');
    }
  }
}
