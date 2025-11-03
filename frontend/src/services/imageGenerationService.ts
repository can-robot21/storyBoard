import { ImageRole, ImageGenerationConfig, ImageOutputSize, ImageEditingStyle, DetailedSettings } from '../types/imageGeneration';
import { generateOptimizedPrompt } from '../utils/promptOptimizer';
import { manageStorageQuota } from '../utils/imageUtils';
import { validateContentPolicy, getFormattedErrorMessage, checkAPIResponseForPolicyViolation } from '../utils/contentPolicyValidator';

/**
 * 이미지 생성 서비스
 * 이미지 생성 로직을 분리한 서비스 클래스
 */
export class ImageGenerationService {
  /**
   * 이미지 생성 핸들러
   */
  static async generateImage(
    nanoBananaService: any,
    params: {
      prompt: string;
      attachedImages: File[];
      imageRoles: ImageRole[];
      selectedOutputSize: ImageOutputSize | null;
      selectedEditingStyle: ImageEditingStyle | null;
      detailedSettings: DetailedSettings;
      isDetailedMode: boolean;
      config: ImageGenerationConfig;
      optimizationResult: {
        geminiOptimized: string;
        ratio?: string;
      } | null;
    }
  ): Promise<string> {
    const {
      prompt,
      attachedImages,
      imageRoles,
      selectedOutputSize,
      selectedEditingStyle,
      detailedSettings,
      isDetailedMode,
      config,
      optimizationResult
    } = params;

    if (!nanoBananaService) {
      throw new Error('NanoBanana 서비스가 초기화되지 않았습니다.');
    }

    // 프롬프트 검증
    const basePrompt = prompt || '';
    if (!basePrompt || basePrompt.trim().length === 0) {
      throw new Error('유효한 프롬프트를 입력해주세요.');
    }

    // 콘텐츠 정책 검증 (금지 항목 확인) - personGeneration 옵션 전달
    // config에 personGeneration이 있을 수 있지만, imageGenerationService에서는 직접 전달하지 않음
    // personGeneration은 googleAIService에서 처리됨
    const validation = validateContentPolicy(basePrompt);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // 최종 프롬프트 및 비율 결정
    let finalPrompt: string;
    let finalAspectRatio: string;

    if (optimizationResult) {
      // 최적화 결과가 있으면 우선 사용
      finalPrompt = optimizationResult.geminiOptimized;
      finalAspectRatio = optimizationResult.ratio || selectedOutputSize?.ratio || config.aspectRatio || '16:9';
    } else {
      // 최적화 결과가 없으면 generateOptimizedPrompt 사용
      const optimizedData = generateOptimizedPrompt(
        basePrompt,
        imageRoles,
        selectedOutputSize,
        selectedEditingStyle,
        detailedSettings,
        isDetailedMode,
        config
      );
      finalPrompt = optimizedData.prompt;
      finalAspectRatio = optimizedData.ratio;
    }

    // 최종 비율 결정: 우선순위
    // 1. 커스텀 사이즈가 있으면 (customSize 우선, aspectRatio 무시)
    // 2. 상단 옵션 (selectedOutputSize 또는 config.aspectRatio)
    // 3. 기본값 16:9
    if (config.customSize && config.customSize.trim()) {
      // 커스텀 사이즈가 입력되면 aspectRatio는 사용하지 않음 (customSize가 우선)
      // customSize는 프롬프트에 포함되어 전달됨
      console.log('📐 커스텀 사이즈 우선 적용:', config.customSize);
      // 커스텀 사이즈가 있을 때는 기본 비율을 유지하되, customSize를 통해 처리
      // 실제 비율은 customSize 파싱 결과를 사용하거나 기본값 사용
      if (!finalAspectRatio || finalAspectRatio === '1:1') {
        finalAspectRatio = selectedOutputSize?.ratio || config.aspectRatio || '16:9';
      }
    } else {
      // 커스텀 사이즈가 없으면 일반적인 우선순위 적용
      if (!finalAspectRatio) {
        finalAspectRatio = selectedOutputSize?.ratio || config.aspectRatio || '16:9';
      }
    }

    console.log('📐 최종 이미지 생성 비율:', finalAspectRatio);
    console.log('📝 최종 프롬프트:', finalPrompt.substring(0, 100) + (finalPrompt.length > 100 ? '...' : ''));

    let result;

    // 첨부 이미지 처리
    if (attachedImages && attachedImages.length > 0) {
      console.log('🖼️ 첨부 이미지가 있는 경우 - 다중 참조 이미지 처리');
      result = await nanoBananaService.generateImageWithMultipleReferences(
        finalPrompt,
        attachedImages,
        imageRoles,
        {
          style: config.style,
          quality: config.quality,
          aspectRatio: finalAspectRatio,
          customSize: config.customSize,
          additionalPrompt: config.additionalPrompt
        }
      );
    } else {
      console.log('🖼️ 첨부 이미지가 없는 경우 - 일반 이미지 생성');
      result = await nanoBananaService.generateImage({
        prompt: finalPrompt,
        style: config.style,
        quality: config.quality,
        aspectRatio: finalAspectRatio,
        customSize: config.customSize,
        additionalPrompt: config.additionalPrompt
      });
    }

    // 결과 추출
    if (!result) {
      // API 응답이 없을 때 정책 위반 가능성 확인
      const policyCheck = checkAPIResponseForPolicyViolation({ message: 'No response from API' });
      if (policyCheck) {
        throw new Error(policyCheck.message);
      }
      throw new Error('이미지 생성 결과가 없습니다.');
    }

    let imageData: string | null = null;

    if (typeof result === 'string') {
      imageData = result;
    } else if (result && typeof result === 'object') {
      if (result.image) {
        imageData = result.image;
      } else if (result.images && result.images.length > 0) {
        imageData = result.images[0];
      } else if (result.data) {
        imageData = result.data;
      }
    }

    if (!imageData) {
      throw new Error('이미지 생성 결과에서 이미지 데이터를 찾을 수 없습니다.');
    }

    return imageData;
  }

  /**
   * 이미지 생성 중 에러 처리
   */
  static handleImageGenerationError(error: any, originalPrompt?: string): never {
    const formattedMessage = getFormattedErrorMessage(error, originalPrompt);
    throw new Error(formattedMessage);
  }

  /**
   * 이미지 저장 서비스
   */
  static saveImageToStorage(
    imageData: {
      image: string;
      prompt: string;
      settings: any;
      timestamp: Date;
    },
    attachedImages: File[]
  ): { advanced: boolean; project: boolean; general: boolean } {
    const optimizedImageData = {
      id: Date.now(),
      image: imageData.image,
      prompt: imageData.prompt,
      description: imageData.prompt,
      settings: imageData.settings,
      timestamp: imageData.timestamp,
      attachedImagesCount: attachedImages.length,
      metadata: {
        fullPrompt: imageData.prompt,
        settings: imageData.settings,
        generationDate: imageData.timestamp.toISOString(),
        imageCount: 1,
        attachedImagesCount: attachedImages.length
      }
    };

    // 저장소별로 저장
    const saveResults = {
      advanced: false,
      project: false,
      general: false
    };

    try {
      // 1. 고급 이미지 전용 저장소
      const advancedImages = JSON.parse(localStorage.getItem('advanced_images') || '[]');
      advancedImages.push(optimizedImageData);
      saveResults.advanced = manageStorageQuota('advanced_images', advancedImages);

      // 2. 프로젝트 참조용 저장소
      const projectImages = JSON.parse(localStorage.getItem('project_images') || '[]');
      projectImages.push(optimizedImageData);
      saveResults.project = manageStorageQuota('project_images', projectImages);

      // 3. 일반 저장소
      const savedImages = JSON.parse(localStorage.getItem('saved_images') || '[]');
      savedImages.push(optimizedImageData);
      saveResults.general = manageStorageQuota('saved_images', savedImages);

      return saveResults;
    } catch (error) {
      console.error('❌ 이미지 저장 중 오류 발생:', error);
      throw error;
    }
  }
}

