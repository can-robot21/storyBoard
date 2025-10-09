// 영상 생성 모델 설정 상수
import { VideoModelConfig, VideoModelVersion } from '../types/ai';

// 영상 모델 설정 데이터
export const VIDEO_MODEL_CONFIGS: Record<VideoModelVersion, VideoModelConfig> = {
  'veo-3.0-generate-001': {
    version: 'veo-3.0-generate-001',
    model: 'veo-3.0-generate-001',
    displayName: 'Veo 3.0 Generate (기본)',
    description: '안정적이고 빠른 영상 생성 모델',
    features: {
      maxDuration: 8,
      maxResolution: '720p',
      aspectRatios: ['16:9', '1:1', '9:16'],
      supportsPersonGeneration: true
    },
    pricing: {
      tier: 'free',
      freeQuota: 10 // 월 10개 무료
    },
    performance: {
      generationSpeed: 'fast',
      quality: 'standard',
      reliability: 95
    }
  },
  'veo-3.0-fast': {
    version: 'veo-3.0-fast',
    model: 'veo-3.0-fast-generate-001',
    displayName: 'Veo 3.0 Fast (빠른 생성)',
    description: '고품질 영상을 빠르게 생성 (오디오 포함, 720p/1080p, personGeneration 미지원)',
    features: {
      maxDuration: 8,
      maxResolution: '1080p', // Google AI API 문서에 따르면 720p 또는 1080p 지원
      aspectRatios: ['16:9', '1:1', '9:16'],
      supportsPersonGeneration: false, // Veo 3.0 Fast는 personGeneration 미지원
      supportsAudio: true, // Veo 3.0은 기본적으로 오디오 포함
      maxTokens: 1024 // 텍스트 입력 토큰 제한
    },
    pricing: {
      tier: 'paid',
      costPerSecond: 0.05,
      freeQuota: 5 // 월 5개 무료
    },
    performance: {
      generationSpeed: 'fast',
      quality: 'high',
      reliability: 90
    }
  },
  'veo-3.0-standard': {
    version: 'veo-3.0-standard',
    model: 'veo-3.0-generate-001',
    displayName: 'Veo 3.0 Standard (고품질)',
    description: '최고 품질의 영상 생성 (오디오 포함, 720p/1080p)',
    features: {
      maxDuration: 8,
      maxResolution: '1080p', // Google AI API 문서에 따르면 720p 또는 1080p 지원
      aspectRatios: ['16:9', '1:1', '9:16'],
      supportsPersonGeneration: true, // Veo 3.0은 personGeneration 지원
      supportsAudio: true, // Veo 3.0은 기본적으로 오디오 포함
      maxTokens: 1024 // 텍스트 입력 토큰 제한
    },
    pricing: {
      tier: 'paid',
      costPerSecond: 0.1,
      freeQuota: 3 // 월 3개 무료
    },
    performance: {
      generationSpeed: 'slow',
      quality: 'ultra',
      reliability: 85
    }
  }
};

// 기본 모델 버전
export const DEFAULT_VIDEO_MODEL_VERSION: VideoModelVersion = 'veo-3.0-generate-001';

// 모델 버전별 설정 가져오기
export const getVideoModelConfig = (version: VideoModelVersion): VideoModelConfig => {
  return VIDEO_MODEL_CONFIGS[version];
};

// 사용 가능한 모델 버전 목록
export const getAvailableVideoModelVersions = (): VideoModelVersion[] => {
  return Object.keys(VIDEO_MODEL_CONFIGS) as VideoModelVersion[];
};

// 모델 버전별 특징 비교
export const compareVideoModels = (version1: VideoModelVersion, version2: VideoModelVersion) => {
  const config1 = getVideoModelConfig(version1);
  const config2 = getVideoModelConfig(version2);
  
  return {
    maxDuration: {
      [version1]: config1.features.maxDuration,
      [version2]: config2.features.maxDuration
    },
    maxResolution: {
      [version1]: config1.features.maxResolution,
      [version2]: config2.features.maxResolution
    },
    pricing: {
      [version1]: config1.pricing,
      [version2]: config2.pricing
    },
    performance: {
      [version1]: config1.performance,
      [version2]: config2.performance
    }
  };
};

// 모델 버전별 추천 사용 사례
export const getRecommendedUseCase = (version: VideoModelVersion): string[] => {
  switch (version) {
    case 'veo-3.0-generate-001':
      return [
        '빠른 프로토타입 제작',
        '테스트용 영상 생성',
        '일반적인 영상 생성',
        '비용 절약이 중요한 경우'
      ];
    case 'veo-3.0-fast':
      return [
        '일반적인 마케팅 영상',
        '소셜미디어 콘텐츠',
        '교육용 영상',
        '오디오가 포함된 빠른 생성'
      ];
    case 'veo-3.0-standard':
      return [
        '프로페셔널 영상 제작',
        '고품질 마케팅 영상',
        '프레젠테이션 영상',
        '최고 품질이 필요한 경우'
      ];
    default:
      return [];
  }
};
