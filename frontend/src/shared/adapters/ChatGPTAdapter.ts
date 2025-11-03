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
 * ChatGPT (OpenAI) 서비스 어댑터
 */
export class ChatGPTAdapter extends BaseAIAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    const features: AIServiceFeatures = {
      promptOptimization: true,
      imageGeneration: true,
      imageAnalysis: false,
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      supportedQualities: ['standard', 'hd'],
      customSettings: ['style', 'size'],
      maxImageSize: 1024,
      maxPromptLength: 4000
    };

    super('chatgpt', features);
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * ChatGPT 특화 프롬프트 최적화
   */
  async optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult> {
    try {
      const processedPrompt = this.preprocessPrompt(prompt);
      
      // ChatGPT 특화 최적화 로직
      let optimizedPrompt = this.applyChatGPTOptimization(processedPrompt, settings);
      
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
          appliedTechniques: ['chatgpt-optimization', 'camera-settings', 'lighting-settings'],
          estimatedTokens: this.estimateTokens(optimizedPrompt),
          confidence: 0.85
        },
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      this.handleError(error, '프롬프트 최적화');
    }
  }

  /**
   * ChatGPT 이미지 생성 (DALL-E 3)
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const chatGPTOptions = {
        model: 'dall-e-3',
        prompt: options.prompt,
        n: 1,
        size: this.getDALLE3Size(options.aspectRatio),
        quality: options.quality === 'hd' ? 'hd' : 'standard',
        style: options.style === 'vivid' ? 'vivid' : 'natural'
      };

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatGPTOptions)
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: ImageGenerationResponse = {
        images: data.data.map((img: any) => ({
          url: img.url,
          metadata: {
            model: 'dall-e-3',
            provider: this.provider,
            aspectRatio: options.aspectRatio,
            quality: options.quality,
            revisedPrompt: img.revised_prompt
          }
        })),
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        },
        model: 'dall-e-3',
        provider: this.provider,
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      this.handleError(error, '이미지 생성');
    }
  }

  /**
   * ChatGPT 특화 최적화 로직
   */
  private applyChatGPTOptimization(prompt: string, settings: DetailedSettings): string {
    let optimizedPrompt = prompt;
    
    // DALL-E 3 최적화
    if (!optimizedPrompt.toLowerCase().includes('photorealistic')) {
      optimizedPrompt = `Create a photorealistic image of ${optimizedPrompt}`;
    }
    
    // 스타일 적용
    if (settings.style) {
      const styleMap: { [key: string]: string } = {
        'realistic': 'photorealistic, detailed, high quality',
        'artistic': 'artistic, creative, stylized',
        'cartoon': 'cartoon style, colorful, fun',
        'anime': 'anime style, Japanese animation'
      };
      optimizedPrompt += `. Style: ${styleMap[settings.style] || settings.style}`;
    }
    
    // 품질 설정
    if (settings.quality) {
      const qualityMap: { [key: string]: string } = {
        'high': 'ultra high quality, detailed',
        'standard': 'high quality',
        'hd': 'HD quality, ultra detailed'
      };
      optimizedPrompt += `. Quality: ${qualityMap[settings.quality] || settings.quality}`;
    }
    
    return optimizedPrompt;
  }

  /**
   * DALL-E 3 크기 매핑
   */
  private getDALLE3Size(aspectRatio: string): string {
    const sizeMap: { [key: string]: string } = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1024x1024', // DALL-E 3는 정사각형만 지원
      '3:4': '1024x1024'
    };
    return sizeMap[aspectRatio] || '1024x1024';
  }

  /**
   * ChatGPT 서비스 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('ChatGPT 서비스 사용 불가:', error);
      return false;
    }
  }
}
