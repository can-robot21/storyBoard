import { BaseAIAdapter } from './BaseAIAdapter';
import { 
  PromptOptimizationResult, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  AIServiceFeatures 
} from '../../types/aiService';
import { DetailedSettings } from '../../types/imageGeneration';
import { AIProvider } from '../../types/ai';
import { NanoBananaService } from '../../services/ai/NanoBananaService';

/**
 * 나노바나나 (Google AI) 서비스 어댑터
 */
export class NanoBananaAdapter extends BaseAIAdapter {
  private nanoBananaService: NanoBananaService;

  constructor(nanoBananaService: NanoBananaService) {
    const features: AIServiceFeatures = {
      promptOptimization: true,
      imageGeneration: true,
      imageAnalysis: true,
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      supportedQualities: ['high', 'standard', 'ultra'],
      customSettings: ['camera', 'lighting', 'style'],
      maxImageSize: 1024,
      maxPromptLength: 4000
    };

    super('google', features);
    this.nanoBananaService = nanoBananaService;
  }

  /**
   * 나노바나나 특화 프롬프트 최적화
   */
  async optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult> {
    try {
      const processedPrompt = this.preprocessPrompt(prompt);
      
      // 나노바나나 특화 최적화 로직
      let optimizedPrompt = this.applyNanoBananaOptimization(processedPrompt, settings);
      
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
          appliedTechniques: ['nano-banana-optimization', 'camera-settings', 'lighting-settings'],
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
   * 나노바나나 이미지 생성
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const nanoBananaOptions = {
        prompt: options.prompt,
        aspectRatio: options.aspectRatio,
        quality: options.quality,
        styleEnhancement: options.style,
        customSize: options.customSettings?.customSize || '',
        additionalPrompt: options.customSettings?.additionalPrompt || '',
        responseModalities: 'Image' as const,
        provider: this.provider,
        model: 'gemini-2.5-flash-image'
      };

      const result = await this.nanoBananaService.generateImageWithGemini25(nanoBananaOptions as any);
      
      const response: ImageGenerationResponse = {
        images: result.images.map((img: any) => ({
          url: img.url,
          base64: img.base64,
          metadata: {
            model: result.model,
            provider: this.provider,
            aspectRatio: options.aspectRatio,
            quality: options.quality
          }
        })),
        usage: result.usage,
        model: result.model,
        provider: this.provider,
        timestamp: new Date()
      };

      return response;
    } catch (error) {
      this.handleError(error, '이미지 생성');
    }
  }

  /**
   * 나노바나나 특화 최적화 로직
   */
  private applyNanoBananaOptimization(prompt: string, settings: DetailedSettings): string {
    // 기존의 나노바나나 최적화 로직을 여기에 구현
    let optimizedPrompt = prompt;
    
    // 기본 품질 향상
    if (!optimizedPrompt.toLowerCase().includes('photorealistic')) {
      optimizedPrompt = `Generate a photorealistic image of ${optimizedPrompt}`;
    }
    
    // 스타일 적용
    if (settings.style) {
      optimizedPrompt += `. Style: ${settings.style}`;
    }
    
    // 품질 설정
    if (settings.quality) {
      const qualityMap: { [key: string]: string } = {
        'high': 'ultra high quality',
        'standard': 'high quality',
        'ultra': 'maximum quality'
      };
      optimizedPrompt += `. Quality: ${qualityMap[settings.quality] || settings.quality}`;
    }
    
    return optimizedPrompt;
  }

  /**
   * 카메라 설정 적용
   */
  protected applyCameraSettings(prompt: string, cameraSettings: any): string {
    if (!cameraSettings) return prompt;
    
    let cameraDescription = '';
    
    // 카메라 위치
    if (cameraSettings.position) {
      const positionMap: { [key: string]: string } = {
        'front': 'positioned in front of',
        'side': 'positioned to the side of',
        'back': 'positioned behind',
        'top': 'positioned above',
        'bottom': 'positioned below'
      };
      cameraDescription += positionMap[cameraSettings.position] || `positioned ${cameraSettings.position}`;
    }
    
    // 카메라 거리
    if (cameraSettings.distance) {
      const distanceMap: { [key: number]: string } = {
        1: 'captured from about 2 meters away for intimate framing',
        2: 'captured from about 2.5 meters away for close-up framing',
        3: 'captured from about 3 meters away for medium framing',
        4: 'captured from about 4 meters away for full-body proportions',
        5: 'captured from about 5 meters away for environmental context'
      };
      cameraDescription += `. ${distanceMap[cameraSettings.distance] || 'captured from appropriate distance'}`;
    }
    
    // 카메라 각도
    if (cameraSettings.tiltAngle && cameraSettings.tiltAngle !== 0) {
      const angle = Math.abs(cameraSettings.tiltAngle);
      if (cameraSettings.tiltAngle > 0) {
        cameraDescription += `. Capture from a slightly elevated high-angle position — positioned about 4 meters away and slightly above and to the right of the subject, angled downward diagonally at approximately ${angle}°`;
      } else {
        cameraDescription += `. Capture from a slightly lowered low-angle position — positioned about 4 meters away and slightly below and to the left of the subject, angled upward diagonally at approximately ${angle}°`;
      }
    }
    
    return cameraDescription ? `${prompt}. ${cameraDescription}` : prompt;
  }

  /**
   * 조명 설정 적용
   */
  protected applyLightingSettings(prompt: string, lightingSettings: any): string {
    if (!lightingSettings) return prompt;
    
    let lightingDescription = '';
    
    // 조명 방향
    if (lightingSettings.direction) {
      lightingDescription += `Illuminate the scene with natural daylight coming from the ${lightingSettings.direction} direction`;
    }
    
    // 조명 강도
    if (lightingSettings.intensity) {
      const intensityMap: { [key: string]: string } = {
        'soft': 'soft, gentle lighting',
        'medium': 'balanced lighting',
        'strong': 'strong, dramatic lighting'
      };
      lightingDescription += `, using ${intensityMap[lightingSettings.intensity] || lightingSettings.intensity}`;
    }
    
    // 색온도
    if (lightingSettings.colorTemperature) {
      lightingDescription += `. Maintain balanced exposure around ${lightingSettings.colorTemperature}K`;
    }
    
    return lightingDescription ? `${prompt}. ${lightingDescription}` : prompt;
  }

  /**
   * 나노바나나 서비스 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 나노바나나 서비스의 사용 가능 여부 확인
      return this.nanoBananaService.isAvailable();
    } catch (error) {
      console.error('나노바나나 서비스 사용 불가:', error);
      return false;
    }
  }
}

