import { 
  AIServiceAdapter, 
  AIServiceFeatures, 
  PromptOptimizationResult, 
  ImageGenerationResponse, 
  ImageGenerationOptions 
} from '../../types/aiService';
import { DetailedSettings } from '../../types/imageGeneration';
import { AIProvider } from '../../types/ai';

/**
 * 기본 AI 서비스 어댑터
 * 모든 AI 서비스 어댑터의 기본 구현을 제공
 */
export abstract class BaseAIAdapter implements AIServiceAdapter {
  protected provider: AIProvider;
  protected features: AIServiceFeatures;

  constructor(provider: AIProvider, features: AIServiceFeatures) {
    this.provider = provider;
    this.features = features;
  }

  /**
   * 프롬프트 최적화 - 각 AI 서비스별로 구현
   */
  abstract optimizePrompt(prompt: string, settings: DetailedSettings): Promise<PromptOptimizationResult>;

  /**
   * 이미지 생성 - 각 AI 서비스별로 구현
   */
  abstract generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;

  /**
   * 지원 기능 반환
   */
  getSupportedFeatures(): AIServiceFeatures {
    return this.features;
  }

  /**
   * 설정 유효성 검증 - 기본 구현
   */
  validateSettings(settings: DetailedSettings): boolean {
    // 기본 검증 로직
    if (!settings.aspectRatio || !this.features.supportedRatios.includes(settings.aspectRatio)) {
      return false;
    }
    
    if (!settings.quality || !this.features.supportedQualities.includes(settings.quality)) {
      return false;
    }

    return true;
  }

  /**
   * 서비스 이름 반환
   */
  getServiceName(): string {
    return this.provider;
  }

  /**
   * 서비스 사용 가능 여부 확인 - 기본 구현
   */
  async isAvailable(): Promise<boolean> {
    try {
      // 기본적인 연결 테스트
      return true;
    } catch (error) {
      console.error(`${this.provider} 서비스 사용 불가:`, error);
      return false;
    }
  }

  /**
   * 공통 프롬프트 전처리
   */
  protected preprocessPrompt(prompt: string): string {
    // 기본 전처리 로직
    return prompt.trim().replace(/\s+/g, ' ');
  }

  /**
   * 공통 에러 처리
   */
  protected handleError(error: any, operation: string): never {
    console.error(`${this.provider} ${operation} 실패:`, error);
    throw new Error(`${this.provider} ${operation} 실패: ${error.message || '알 수 없는 오류'}`);
  }

  /**
   * 토큰 사용량 추정
   */
  protected estimateTokens(text: string): number {
    // 간단한 토큰 추정 (실제로는 각 AI 서비스별로 다를 수 있음)
    return Math.ceil(text.length / 4);
  }

  /**
   * 설정을 AI 서비스별 옵션으로 변환
   */
  protected convertSettingsToOptions(settings: DetailedSettings): Record<string, any> {
    const options: Record<string, any> = {
      aspectRatio: settings.aspectRatio,
      quality: settings.quality,
      style: settings.style
    };

    // AI 서비스별 특화 설정 추가
    if (this.features.customSettings.includes('camera')) {
      options.camera = settings.camera;
    }
    
    if (this.features.customSettings.includes('lighting')) {
      options.lighting = settings.lighting;
    }

    return options;
  }

  /**
   * 카메라 설정 적용 (기본 구현)
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
   * 조명 설정 적용 (기본 구현)
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
}

