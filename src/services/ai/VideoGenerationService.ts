// 영상 생성 서비스 - 버전별 분리
import { GoogleGenAI } from '@google/genai';
import { VideoModelConfig, VideoModelVersion } from '../../types/ai';
import { getVideoModelConfig } from '../../utils/videoModelConfig';
import { createDataUrl } from '../../utils/base64Utils';
import { apiUsageService } from '../apiUsageService';

export class VideoGenerationService {
  private ai: GoogleGenAI;
  private currentModelVersion: VideoModelVersion;
  private onErrorCallback?: (error: string, hasImages: boolean) => Promise<'retry' | 'retryWithoutImages' | 'storyboard' | 'cancel'>;

  constructor(apiKey: string, modelVersion: VideoModelVersion = 'veo-3.0-fast') {
    this.ai = new GoogleGenAI({ vertexai: false, apiKey });
    this.currentModelVersion = modelVersion;
  }

  // 에러 처리 콜백 설정
  setErrorCallback(callback: (error: string, hasImages: boolean) => Promise<'retry' | 'retryWithoutImages' | 'storyboard' | 'cancel'>) {
    this.onErrorCallback = callback;
  }

  // 모델 버전 변경
  setModelVersion(version: VideoModelVersion): void {
    this.currentModelVersion = version;
  }

  // 현재 모델 설정 가져오기
  getCurrentModelConfig(): VideoModelConfig {
    return getVideoModelConfig(this.currentModelVersion);
  }

  // 영상 생성 (버전별 최적화) - 이미지 참조 지원
  async generateVideo(
    prompt: string, 
    videoRatio: string = '16:9',
    customOptions?: Partial<{
      duration: number;
      resolution: string;
    }>,
    referenceImages?: string[], // Base64 이미지 배열
    abortSignal?: AbortSignal // AbortController 지원
  ): Promise<string> {
    const modelConfig = this.getCurrentModelConfig();
    
    // 모델별 최적화된 프롬프트 생성
    const optimizedPrompt = await this.createOptimizedPrompt(prompt, videoRatio, modelConfig);
    
    // 모델별 설정 적용
    const videoConfig = this.createVideoConfig(modelConfig, videoRatio, customOptions);
    
    try {
      // 취소 신호 확인
      if (abortSignal?.aborted) {
        throw new Error('Video generation was cancelled');
      }

      console.log(`${modelConfig.displayName}을 사용하여 영상을 생성합니다.`);
      
      // 최종 프롬프트 정보 출력
      console.log('=== 최종 영상 생성 프롬프트 ===');
      console.log('원본 프롬프트:', prompt);
      console.log('최적화된 프롬프트:', optimizedPrompt);
      console.log('영상 비율:', videoRatio);
      console.log('모델 설정:', JSON.stringify(videoConfig, null, 2));
      console.log('참조 이미지 개수:', referenceImages?.length || 0);
      console.log('===============================');
      
      // Veo API 호출 (Google AI API 문서 기반)
      const config: any = {
        model: modelConfig.model,
        prompt: optimizedPrompt,
        config: videoConfig,
      };

      // Veo 3.0 모델의 경우 추가 설정 (Google AI API 문서 기반)
      if (modelConfig.version.startsWith('veo-3.0')) {
        // Veo 3.0은 기본적으로 오디오가 포함된 동영상을 생성
        // config.config.generateAudio = true; // 기본값이므로 명시적으로 설정하지 않음
        console.log('Veo 3.0 모델 사용 - 오디오 포함 동영상 생성');
      }

      // 이미지 참조가 있는 경우 추가 (개선된 이미지 처리)
      if (referenceImages && referenceImages.length > 0) {
        const processedImage = await this.processReferenceImage(referenceImages[0]);
        if (processedImage) {
          config.image = {
            imageBytes: processedImage.imageBytes,
            mimeType: processedImage.mimeType,
          };
          console.log('이미지 참조가 추가되었습니다:', processedImage.mimeType);
        } else {
          console.warn('이미지 처리 실패. 이미지 없이 진행합니다.');
        }
      }

      console.log('API 호출 시작...');
      let operation = await this.ai.models.generateVideos(config);

      console.log(`Video generation started: ${operation.name}`);

      // 비디오 생성 완료까지 대기 (제공된 코드 기반)
      while (!operation.done) {
        console.log(`Video ${operation.name} is still generating...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초마다 체크
        operation = await this.ai.operations.getVideosOperation({ operation });
      }

      console.log(`Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

      if (!operation.response?.generatedVideos || operation.response.generatedVideos.length === 0) {
        console.warn(`${modelConfig.displayName}에서 영상이 생성되지 않았습니다. 스토리보드를 생성합니다.`);
        throw new Error('No videos generated');
      }

      const video = operation.response.generatedVideos[0];
      if (!video?.video?.uri) {
        throw new Error('Video URI not found in response');
      }
      
      // API 키를 URI에 추가하여 반환
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      const videoUri = `${video.video.uri}&key=${apiKey}`;
      
      // 사용량 추적
      const estimatedTokens = Math.ceil(optimizedPrompt.length / 4) + 500; // 영상 생성은 더 많은 토큰 사용
      const cost = modelConfig.pricing.costPerToken ? estimatedTokens * modelConfig.pricing.costPerToken : 0;
      
      apiUsageService.recordUsage({
        provider: 'Google',
        model: modelConfig.model,
        actionType: 'video',
        tokensUsed: estimatedTokens,
        cost: cost,
      });
      
      console.log(`Video generated successfully: ${videoUri}`);
      
      // 제공된 코드의 다운로드 기능 추가
      try {
        await this.downloadVideo(videoUri, `video_${Date.now()}.mp4`);
      } catch (downloadError) {
        console.warn('비디오 다운로드 실패:', downloadError);
      }
      
      return videoUri;

    } catch (error) {
      console.error(`${modelConfig.displayName} 영상 생성 실패:`, error);
      
      const errorMessage = (error as any)?.message || 'Unknown error';
      const hasImages = Boolean(referenceImages && referenceImages.length > 0);
      
      // 사용자에게 선택권 제공
      if (this.onErrorCallback) {
        try {
          const userChoice = await this.onErrorCallback(errorMessage, hasImages);
          
          switch (userChoice) {
            case 'retry':
              console.log('사용자가 재시도를 선택했습니다.');
              return await this.generateVideo(prompt, videoRatio, customOptions, referenceImages);
              
            case 'retryWithoutImages':
              console.log('사용자가 이미지 없이 재시도를 선택했습니다.');
              const retryPrompt = `${prompt}\n\n(참조 이미지 없이 텍스트 설명만으로 영상을 생성해주세요)`;
              return await this.generateVideo(retryPrompt, videoRatio, customOptions, []);
              
            case 'storyboard':
              console.log('사용자가 스토리보드 생성을 선택했습니다.');
              return await this.generateStoryboardFallback(prompt, videoRatio);
              
            case 'cancel':
              console.log('사용자가 취소를 선택했습니다.');
              throw new Error('User cancelled video generation');
              
            default:
              throw new Error('Invalid user choice');
          }
        } catch (callbackError) {
          console.error('사용자 선택 처리 중 오류:', callbackError);
        }
      }
      
      // 콜백이 없는 경우 자동 폴백
      const isImageError = errorMessage.includes('Unable to process input image') || 
                          errorMessage.includes('input image');
      
      if (isImageError && hasImages) {
        console.log('이미지 참조로 인한 에러 감지. 이미지 없이 재시도합니다.');
        try {
          const retryPrompt = `${prompt}\n\n(참조 이미지 없이 텍스트 설명만으로 영상을 생성해주세요)`;
          return await this.generateVideo(retryPrompt, videoRatio, customOptions, []);
        } catch (retryError) {
          console.error('이미지 없이 재시도도 실패:', retryError);
        }
      }
      
      // Veo 3.0 Generate로 폴백 시도
      if (this.currentModelVersion !== 'veo-3.0-generate-001') {
        console.log('Veo 3.0 Generate로 폴백을 시도합니다.');
        this.setModelVersion('veo-3.0-generate-001' as VideoModelVersion);
        return await this.generateVideo(prompt, videoRatio, customOptions, referenceImages);
      }
      
      // 모든 모델 실패 시 스토리보드 생성
      console.log('모든 영상 생성 모델 실패. 스토리보드를 생성합니다.');
      return await this.generateStoryboardFallback(prompt, videoRatio);
    }
  }

  // 모델별 최적화된 프롬프트 생성
  public async createOptimizedPrompt(
    originalPrompt: string, 
    videoRatio: string, 
    modelConfig: VideoModelConfig
  ): Promise<string> {
    // 토큰 제한 확인 (Google AI API 문서 기반)
    const maxTokens = modelConfig.features.maxTokens || 1024;
    const estimatedTokens = Math.ceil(originalPrompt.length / 4); // 대략적인 토큰 계산
    
    if (estimatedTokens > maxTokens) {
      console.warn(`프롬프트가 토큰 제한을 초과합니다. ${estimatedTokens}/${maxTokens} 토큰`);
      // 프롬프트를 단축
      const shortenedPrompt = originalPrompt.substring(0, maxTokens * 4);
      console.log('프롬프트가 단축되었습니다.');
      return shortenedPrompt;
    }
    // 한글 프롬프트를 영어로 변환하는 최적화된 프롬프트
    const optimizationPrompt = `다음 프롬프트를 ${modelConfig.displayName}에 최적화된 영상 생성 프롬프트로 변환해주세요:

원본 프롬프트: ${originalPrompt}
영상 비율: ${videoRatio}
모델 버전: ${modelConfig.version}

요구사항:
1. ${modelConfig.features.maxDuration}초 길이의 영상에 적합한 내용으로 조정
2. 카메라 워크와 액션을 구체적으로 설명
3. 조명과 색감을 명확히 지정
4. 영상의 흐름과 전환이 자연스럽도록 구성
5. 시각적 요소에 집중하여 설명
6. 음성 없이 시각적 스토리텔링에 집중
7. 시각적 효과와 전환에 집중
8. Veo API가 이해하기 쉬운 명확한 영어로 작성
9. 구체적이고 상세한 시각적 묘사 포함

시각적 지시사항:
- 명확한 시각적 스토리텔링
- 부드러운 카메라 워크
- 일관된 색상 팔레트
- 효과적인 전환과 편집
- 구체적인 장면 묘사

최적화된 프롬프트만 반환해주세요 (추가 설명 없이):`;

    try {
      return await this.generateText(optimizationPrompt);
    } catch (error) {
      console.warn('프롬프트 최적화 실패, 원본 프롬프트 사용:', error);
      // 최적화 실패 시 원본 프롬프트를 영어로 간단 변환
      return `Create a ${modelConfig.features.maxDuration}-second video with ${videoRatio} aspect ratio: ${originalPrompt}`;
    }
  }

  // 모델별 비디오 설정 생성 (제공된 코드 기반)
  private createVideoConfig(
    modelConfig: VideoModelConfig, 
    videoRatio: string, 
    customOptions?: Partial<{
      duration: number;
      resolution: string;
    }>
  ) {
    const baseConfig = {
      numberOfVideos: 1,
      aspectRatio: videoRatio,
      durationSeconds: customOptions?.duration || modelConfig.features.maxDuration,
    };

    // personGeneration 지원 여부에 따라 설정 추가
    if (modelConfig.features.supportsPersonGeneration) {
      return {
        ...baseConfig,
        personGeneration: 'ALLOW_ALL' as const,
      };
    }

    // personGeneration을 지원하지 않는 모델 (Veo 2.0 등)
    return baseConfig;
  }

  // 텍스트 생성 (프롬프트 최적화용)
  private async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
      });
      
      return response.text || '';
    } catch (error) {
      console.error('텍스트 생성 실패:', error);
      return prompt; // 실패 시 원본 프롬프트 반환
    }
  }

  // 스토리보드 폴백 생성
  private async generateStoryboardFallback(prompt: string, videoRatio: string): Promise<string> {
    const storyboardPrompt = `다음 프롬프트를 바탕으로 상세한 영상 스토리보드를 생성해주세요:

프롬프트: ${prompt}
영상 비율: ${videoRatio}

🎬 영상 스토리보드

📝 장면 1: [장면 제목]
- 시간: 0-3초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

📝 장면 2: [장면 제목]
- 시간: 3-6초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

📝 장면 3: [장면 제목]
- 시간: 6-8초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

🎨 전체 영상 스타일:
- 톤앤매너: [드라마틱/코미디/로맨틱 등]
- 편집 스타일: [빠른 컷/긴 숏 등]
- 색상 그레이딩: [따뜻한/차가운/모노톤 등]

💡 제작 노트:
- [특별한 주의사항이나 제작 팁]
- [필요한 소품이나 세트]
- [특수 효과 요구사항]`;

    const storyboard = await this.generateText(storyboardPrompt);

    const storyboardData = {
      type: 'storyboard',
      prompt: prompt,
      videoRatio: videoRatio,
      storyboard: storyboard,
      timestamp: new Date().toISOString(),
      note: '영상 생성 모델 실패로 인해 스토리보드를 생성했습니다.'
    };

    // 안전한 Base64 인코딩 사용
    return createDataUrl(storyboardData, 'application/json');
  }

  // 제공된 코드의 다운로드 기능
  private async downloadVideo(url: string, filename: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = objectURL;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 정리
      URL.revokeObjectURL(objectURL);
      
      console.log(`Video downloaded: ${filename}`);
    } catch (error) {
      console.error('Video download failed:', error);
      throw error;
    }
  }

  // 제공된 코드의 Base64 변환 함수
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>(async (resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        resolve(url.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  }

  // 이미지 처리 및 검증 함수 (Google AI API 요구사항 기반)
  private async processReferenceImage(imageData: string): Promise<{ imageBytes: string; mimeType: string } | null> {
    try {
      // Base64 데이터에서 MIME 타입 추출
      const mimeMatch = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!mimeMatch) {
        console.error('잘못된 Base64 이미지 형식');
        return null;
      }

      const [, mimeType, base64Data] = mimeMatch;
      
      // 지원되는 이미지 형식 확인
      const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(mimeType)) {
        console.error(`지원되지 않는 이미지 형식: ${mimeType}`);
        return null;
      }

      // 이미지 크기 확인 (20MB 제한)
      const imageSizeBytes = (base64Data.length * 3) / 4; // Base64 to bytes
      const maxSizeBytes = 20 * 1024 * 1024; // 20MB
      
      if (imageSizeBytes > maxSizeBytes) {
        console.error(`이미지 크기가 너무 큽니다: ${(imageSizeBytes / 1024 / 1024).toFixed(2)}MB`);
        return null;
      }

      // 이미지 데이터 검증
      if (base64Data.length === 0) {
        console.error('빈 이미지 데이터');
        return null;
      }

      console.log(`이미지 처리 완료: ${mimeType}, 크기: ${(imageSizeBytes / 1024 / 1024).toFixed(2)}MB`);
      
      return {
        imageBytes: base64Data,
        mimeType: mimeType
      };

    } catch (error) {
      console.error('이미지 처리 중 오류:', error);
      return null;
    }
  }

  // 제공된 코드의 지연 함수
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 모델별 성능 정보 가져오기
  getPerformanceInfo(): {
    speed: string;
    quality: string;
    reliability: number;
    features: string[];
  } {
    const config = this.getCurrentModelConfig();
    
    return {
      speed: config.performance.generationSpeed,
      quality: config.performance.quality,
      reliability: config.performance.reliability,
      features: [
        `최대 ${config.features.maxDuration}초`,
        `${config.features.maxResolution} 해상도`,
        config.pricing.tier === 'free' ? '무료' : '유료'
      ]
    };
  }
}
