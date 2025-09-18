// 영상 생성 서비스 - 버전별 분리
import { GoogleGenAI } from '@google/genai';
import { VideoModelConfig, VideoModelVersion } from '../../types/ai';
import { getVideoModelConfig } from '../../utils/videoModelConfig';
import { createDataUrl } from '../../utils/base64Utils';

export class VideoGenerationService {
  private ai: GoogleGenAI;
  private currentModelVersion: VideoModelVersion;

  constructor(apiKey: string, modelVersion: VideoModelVersion = 'veo-3.0-fast') {
    this.ai = new GoogleGenAI({ apiKey });
    this.currentModelVersion = modelVersion;
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
    referenceImages?: string[] // Base64 이미지 배열
  ): Promise<string> {
    const modelConfig = this.getCurrentModelConfig();
    
    // 이미지 참조가 있는 경우 프롬프트에 추가
    let finalPrompt = prompt;
    if (referenceImages && referenceImages.length > 0) {
      const imageReferences = referenceImages.map((img, index) => 
        `참조 이미지 ${index + 1}: ${img}`
      ).join('\n\n');
      
      finalPrompt = `${prompt}\n\n=== 참조 이미지 ===\n${imageReferences}`;
    }
    
    // 모델별 최적화된 프롬프트 생성
    const optimizedPrompt = await this.createOptimizedPrompt(finalPrompt, videoRatio, modelConfig);
    
    // 모델별 설정 적용
    const videoConfig = this.createVideoConfig(modelConfig, videoRatio, customOptions);
    
    try {
      console.log(`${modelConfig.displayName}을 사용하여 영상을 생성합니다.`);
      
      // Veo API 호출
      let operation = await this.ai.models.generateVideos({
        model: modelConfig.model,
        prompt: optimizedPrompt,
        config: videoConfig,
      });

      console.log(`Video generation started: ${operation.name}`);

      // 비디오 생성 완료까지 대기
      while (!operation.done) {
        console.log(`Video ${operation.name} is still generating...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await this.ai.operations.getVideosOperation({ operation });
      }

      if (!operation.response?.generatedVideos || operation.response.generatedVideos.length === 0) {
        console.warn(`${modelConfig.displayName}에서 영상이 생성되지 않았습니다. 스토리보드를 생성합니다.`);
        throw new Error('No videos generated');
      }

      const video = operation.response.generatedVideos[0];
      if (!video?.video?.uri) {
        throw new Error('Video URI not found in response');
      }
      const videoUri = `${video.video.uri}&key=${process.env.REACT_APP_GEMINI_API_KEY}`;
      
      console.log(`Video generated successfully: ${videoUri}`);
      return videoUri;

    } catch (error) {
      console.error(`${modelConfig.displayName} 영상 생성 실패:`, error);
      
      // Veo 2.0으로 폴백 시도
      if (this.currentModelVersion !== 'veo-2.0') {
        console.log('Veo 2.0으로 폴백을 시도합니다.');
        this.setModelVersion('veo-2.0');
        return await this.generateVideo(prompt, videoRatio, customOptions);
      }
      
      // 모든 모델 실패 시 스토리보드 생성
      console.log('모든 영상 생성 모델 실패. 스토리보드를 생성합니다.');
      return await this.generateStoryboardFallback(prompt, videoRatio);
    }
  }

  // 모델별 최적화된 프롬프트 생성
  private async createOptimizedPrompt(
    originalPrompt: string, 
    videoRatio: string, 
    modelConfig: VideoModelConfig
  ): Promise<string> {
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

  // 모델별 비디오 설정 생성
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
      personGeneration: 'ALLOW_ALL' as const,
    };

    // Veo 3.0 모델의 경우 추가 설정
    if (modelConfig.version.startsWith('veo-3.0')) {
      return {
        ...baseConfig,
        resolution: customOptions?.resolution || modelConfig.features.maxResolution,
        // generateAudio와 fps는 Gemini API에서 지원되지 않으므로 제거
      };
    }

    // Veo 2.0 모델의 경우 기본 설정
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
