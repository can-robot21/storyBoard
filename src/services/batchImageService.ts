import { GoogleGenAI } from '@google/genai';
import { apiUsageService } from './apiUsageService';

export interface BatchImageRequest {
  prompts: string[];
  model: string;
  aspectRatio: string;
  numberOfImages: number;
  style: 'realistic' | 'anime' | 'cartoon' | 'artistic';
  quality: 'standard' | 'hd';
}

export interface BatchImageResponse {
  images: Array<{
    prompt: string;
    imageUrl: string;
    success: boolean;
    error?: string;
  }>;
  totalGenerated: number;
  totalFailed: number;
  estimatedTokens: number;
  estimatedCost: number;
}

export class BatchImageService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 배치 이미지 생성
   */
  async generateBatchImages(request: BatchImageRequest): Promise<BatchImageResponse> {
    const results: BatchImageResponse['images'] = [];
    let totalTokens = 0;
    let totalCost = 0;

    console.log(`배치 이미지 생성 시작: ${request.prompts.length}개 프롬프트`);

    // 병렬 처리를 위한 청크 단위로 나누기 (API 제한 고려)
    const chunkSize = 3; // 한 번에 3개씩 처리
    const chunks = this.chunkArray(request.prompts, chunkSize);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(prompt => 
        this.generateSingleImage(prompt, request)
      );

      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        const prompt = chunk[index];
        if (result.status === 'fulfilled') {
          results.push({
            prompt,
            imageUrl: result.value.imageUrl,
            success: true,
          });
          totalTokens += result.value.tokens;
          totalCost += result.value.cost;
        } else {
          results.push({
            prompt,
            imageUrl: '',
            success: false,
            error: result.reason.message || 'Unknown error',
          });
        }
      });

      // 청크 간 지연 (API 제한 방지)
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalGenerated = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;

    // 전체 사용량 기록
    apiUsageService.recordUsage({
      provider: 'Google',
      model: request.model,
      actionType: 'image',
      tokensUsed: totalTokens,
      cost: totalCost,
    });

    console.log(`배치 이미지 생성 완료: ${totalGenerated}개 성공, ${totalFailed}개 실패`);

    return {
      images: results,
      totalGenerated,
      totalFailed,
      estimatedTokens: totalTokens,
      estimatedCost: totalCost,
    };
  }

  /**
   * 단일 이미지 생성
   */
  private async generateSingleImage(
    prompt: string, 
    request: BatchImageRequest
  ): Promise<{ imageUrl: string; tokens: number; cost: number }> {
    try {
      // 스타일 적용된 프롬프트 생성
      const styledPrompt = this.applyStyleToPrompt(prompt, request.style);
      
      const response = await this.ai.models.generateImages({
        model: request.model,
        prompt: styledPrompt,
        config: {
          numberOfImages: request.numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: request.aspectRatio,
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images generated');
      }

      const image = response.generatedImages[0];
      if (!image?.image?.imageBytes) {
        throw new Error('Image data not found');
      }

      const imageUrl = `data:image/jpeg;base64,${image.image.imageBytes}`;
      const tokens = Math.ceil(styledPrompt.length / 4) + (request.numberOfImages * 100);
      const cost = 0; // 무료 모델

      return { imageUrl, tokens, cost };
    } catch (error) {
      console.error(`이미지 생성 실패 (${prompt}):`, error);
      throw error;
    }
  }

  /**
   * 프롬프트에 스타일 적용
   */
  private applyStyleToPrompt(prompt: string, style: 'realistic' | 'anime' | 'cartoon' | 'artistic'): string {
    const stylePrefixes: Record<'realistic' | 'anime' | 'cartoon' | 'artistic', string> = {
      realistic: 'photorealistic, high quality, detailed, ',
      anime: 'anime style, manga style, Japanese animation, ',
      cartoon: 'cartoon style, animated, colorful, ',
      artistic: 'artistic, painting style, creative, ',
    };

    const prefix = stylePrefixes[style] || '';
    return `${prefix}${prompt}`;
  }

  /**
   * 배열을 청크로 나누기
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 이미지 품질 개선
   */
  async enhanceImageQuality(
    imageUrl: string, 
    enhancementType: 'upscale' | 'denoise' | 'color_correction'
  ): Promise<string> {
    try {
      // 이미지 품질 개선 로직 (실제 구현은 API에 따라 다름)
      console.log(`이미지 품질 개선: ${enhancementType}`);
      
      // 현재는 원본 이미지 반환 (실제 구현 필요)
      return imageUrl;
    } catch (error) {
      console.error('이미지 품질 개선 실패:', error);
      return imageUrl;
    }
  }

  /**
   * 이미지 스타일 변환
   */
  async convertImageStyle(
    imageUrl: string, 
    targetStyle: 'realistic' | 'anime' | 'cartoon' | 'artistic'
  ): Promise<string> {
    try {
      // 이미지 스타일 변환 로직 (실제 구현은 API에 따라 다름)
      console.log(`이미지 스타일 변환: ${targetStyle}`);
      
      // 현재는 원본 이미지 반환 (실제 구현 필요)
      return imageUrl;
    } catch (error) {
      console.error('이미지 스타일 변환 실패:', error);
      return imageUrl;
    }
  }
}

// 싱글톤 인스턴스
export const batchImageService = new BatchImageService(process.env.REACT_APP_GEMINI_API_KEY || '');
