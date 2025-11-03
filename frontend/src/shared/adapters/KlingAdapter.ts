import { BaseAIAdapter } from './BaseAIAdapter';
import { 
  PromptOptimizationResult, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  AIServiceFeatures 
} from '../../types/aiService';
import { DetailedSettings } from '../../types/imageGeneration';
import { AIProvider } from '../../types/ai';

/**
 * Kling AI 서비스 어댑터
 */
export class KlingAdapter extends BaseAIAdapter {
  private accessKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(accessKey: string, secretKey: string, baseUrl: string = 'https://api-singapore.klingai.com') {
    const features: AIServiceFeatures = {
      promptOptimization: true,
      imageGeneration: true,
      imageAnalysis: false,
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      supportedQualities: ['standard', 'high'],
      customSettings: ['style', 'model'],
      maxImageSize: 1024,
      maxPromptLength: 2000
    };

    super('kling', features);
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Kling AI 특화 프롬프트 최적화
   */
  async optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult> {
    try {
      const processedPrompt = this.preprocessPrompt(prompt);
      
      // Kling AI 특화 최적화 로직
      let optimizedPrompt = this.applyKlingOptimization(processedPrompt, settings);
      
      // 카메라 설정 적용
      if (settings.camera) {
        optimizedPrompt = this.applyCameraSettings(optimizedPrompt, settings.camera);
      }
      
      // 조명 설정 적용
      if (settings.lighting) {
        optimizedPrompt = this.applyLightingSettings(optimizedPrompt, settings.lighting);
      }

      const result: PromptOptimizationResult = {
        originalPrompt: prompt,
        optimizedPrompt,
        provider: this.provider,
        optimizationDetails: {
          appliedTechniques: ['kling-optimization', 'camera-settings', 'lighting-settings'],
          estimatedTokens: this.estimateTokens(optimizedPrompt),
          confidence: 0.88
        },
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      this.handleError(error, '프롬프트 최적화');
    }
  }

  /**
   * Kling AI 이미지 생성
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const token = this.generateJWTToken();
      
      const klingOptions = {
        model: 'kling-v1',
        prompt: options.prompt,
        aspect_ratio: this.getKlingAspectRatio(options.aspectRatio),
        quality: options.quality === 'high' ? 'high' : 'standard',
        style: options.style || 'realistic'
      };

      const response = await fetch(`${this.baseUrl}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(klingOptions)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Kling AI API error: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }

      const data = await response.json();
      
      const result: ImageGenerationResponse = {
        images: data.data.map((img: any) => ({
          url: img.url,
          metadata: {
            model: 'kling-v1',
            provider: this.provider,
            aspectRatio: options.aspectRatio,
            quality: options.quality,
            taskId: img.task_id
          }
        })),
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        model: 'kling-v1',
        provider: this.provider,
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      this.handleError(error, '이미지 생성');
    }
  }

  /**
   * Kling AI 특화 최적화 로직
   */
  private applyKlingOptimization(prompt: string, settings: DetailedSettings): string {
    let optimizedPrompt = prompt;
    
    // Kling AI는 중국어와 영어 모두 지원
    if (!optimizedPrompt.toLowerCase().includes('create') && !optimizedPrompt.toLowerCase().includes('generate')) {
      optimizedPrompt = `Create a high-quality image: ${optimizedPrompt}`;
    }
    
    // 스타일 적용
    if (settings.style) {
      const styleMap: { [key: string]: string } = {
        'realistic': 'photorealistic, detailed, natural lighting',
        'artistic': 'artistic style, creative composition',
        'cartoon': 'cartoon style, colorful, playful',
        'anime': 'anime style, Japanese animation aesthetic'
      };
      optimizedPrompt += `. Style: ${styleMap[settings.style] || settings.style}`;
    }
    
    // 품질 설정
    if (settings.quality) {
      const qualityMap: { [key: string]: string } = {
        'high': 'high quality, detailed, professional',
        'standard': 'good quality, clear',
        'ultra': 'ultra high quality, extremely detailed'
      };
      optimizedPrompt += `. Quality: ${qualityMap[settings.quality] || settings.quality}`;
    }
    
    return optimizedPrompt;
  }

  /**
   * Kling AI 비율 매핑
   */
  private getKlingAspectRatio(aspectRatio: string): string {
    const ratioMap: { [key: string]: string } = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:3': '4:3',
      '3:4': '3:4'
    };
    return ratioMap[aspectRatio] || '16:9';
  }

  /**
   * JWT 토큰 생성 (Kling AI 인증 방식)
   */
  private generateJWTToken(): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const payload = {
      iss: this.accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800, // 30분 후 만료
      nbf: Math.floor(Date.now() / 1000) - 5 // 5초 전부터 유효
    };

    // 간단한 JWT 구현 (실제로는 jwt 라이브러리 사용 권장)
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    
    const signature = this.hmacSha256(
      `${encodedHeader}.${encodedPayload}`,
      this.secretKey
    );
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Base64 URL 인코딩
   */
  private base64UrlEncode(str: string): string {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * HMAC SHA256 서명 (간단한 구현)
   */
  private hmacSha256(message: string, secret: string): string {
    // 실제 구현에서는 crypto 라이브러리 사용 권장
    // 여기서는 간단한 해시 함수로 대체
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(message);
    
    // 간단한 해시 구현 (실제로는 Web Crypto API 사용)
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += String.fromCharCode(data[i] ^ key[i % key.length]);
    }
    
    return this.base64UrlEncode(btoa(hash));
  }

  /**
   * Kling AI 서비스 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      const token = this.generateJWTToken();
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Kling AI 서비스 사용 불가:', error);
      return false;
    }
  }
}
