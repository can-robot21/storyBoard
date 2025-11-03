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
 * Claude (Anthropic) 서비스 어댑터
 */
export class ClaudeAdapter extends BaseAIAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.anthropic.com/v1') {
    const features: AIServiceFeatures = {
      promptOptimization: true,
      imageGeneration: false, // Claude는 이미지 생성 지원하지 않음
      imageAnalysis: true,
      supportedRatios: [],
      supportedQualities: [],
      customSettings: ['analysis'],
      maxImageSize: 0,
      maxPromptLength: 200000
    };

    super('anthropic', features);
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Claude 특화 프롬프트 최적화
   */
  async optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult> {
    try {
      const processedPrompt = this.preprocessPrompt(prompt);
      
      // Claude 특화 최적화 로직
      let optimizedPrompt = this.applyClaudeOptimization(processedPrompt, settings);
      
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
          appliedTechniques: ['claude-optimization', 'camera-settings', 'lighting-settings'],
          estimatedTokens: this.estimateTokens(optimizedPrompt),
          confidence: 0.9
        },
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      this.handleError(error, '프롬프트 최적화');
    }
  }

  /**
   * Claude 이미지 생성 (지원하지 않음)
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    throw new Error('Claude는 이미지 생성을 지원하지 않습니다. 텍스트 분석 및 프롬프트 최적화만 가능합니다.');
  }

  /**
   * Claude 특화 최적화 로직
   */
  private applyClaudeOptimization(prompt: string, settings: DetailedSettings): string {
    let optimizedPrompt = prompt;
    
    // Claude는 더 자연스러운 언어 처리에 특화
    if (!optimizedPrompt.toLowerCase().includes('create') && !optimizedPrompt.toLowerCase().includes('generate')) {
      optimizedPrompt = `Create a detailed visual description for image generation: ${optimizedPrompt}`;
    }
    
    // 스타일 적용
    if (settings.style) {
      const styleMap: { [key: string]: string } = {
        'realistic': 'photorealistic with natural lighting and realistic textures',
        'artistic': 'artistic interpretation with creative composition',
        'cartoon': 'cartoon-style illustration with vibrant colors',
        'anime': 'anime-style artwork with detailed character design'
      };
      optimizedPrompt += `. Visual style: ${styleMap[settings.style] || settings.style}`;
    }
    
    // 품질 설정
    if (settings.quality) {
      const qualityMap: { [key: string]: string } = {
        'high': 'high-quality, detailed, professional',
        'standard': 'good quality, clear',
        'ultra': 'ultra-high quality, extremely detailed, professional grade'
      };
      optimizedPrompt += `. Quality level: ${qualityMap[settings.quality] || settings.quality}`;
    }
    
    return optimizedPrompt;
  }

  /**
   * 이미지 분석 기능
   */
  async analyzeImage(imageUrl: string, prompt?: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt || '이 이미지를 자세히 분석하고 설명해주세요.'
                },
                {
                  type: 'image',
                  source: {
                    type: 'url',
                    url: imageUrl
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      this.handleError(error, '이미지 분석');
    }
  }

  /**
   * Claude 서비스 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Claude 서비스 사용 불가:', error);
      return false;
    }
  }
}
