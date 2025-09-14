import { BaseAIService } from './BaseAIService';
import { TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';

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
      // 기존 googleAIService의 generateText 메서드 사용
      const text = await this.ai.generateText(options.prompt, options.model || 'gemini-2.5-flash');

      return this.formatTextResponse(
        text,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gemini-2.5-flash'
      );
    } catch (error) {
      this.handleError(error, '텍스트 생성');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const response = await this.ai.models.generateImages({
        model: options.model || 'imagen-4.0-ultra-generate-001',
        prompt: options.prompt,
        config: {
          numberOfImages: options.numberOfImages || 1,
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

      return this.formatImageResponse(
        images,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'imagen-4.0-ultra-generate-001'
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
