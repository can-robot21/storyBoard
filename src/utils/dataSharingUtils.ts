// 데이터 공유 및 생성 유틸리티
import { GeneratedProjectData, GeneratedCharacter, GeneratedBackground, GeneratedSettingCut, GeneratedImage, GeneratedVideo, GeneratedTextCard } from '../types/project';

export interface DataSharingOptions {
  includeImages: boolean;
  includeVideos: boolean;
  includeMetadata: boolean;
  compressData: boolean;
  format: 'json' | 'url' | 'clipboard';
}

export interface SharedProjectData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  data: {
    story?: string;
    characterList?: Array<{ id: number; name: string; description: string }>;
    finalScenario?: string;
    generatedProjectData?: GeneratedProjectData;
    generatedCharacters?: GeneratedCharacter[];
    generatedBackgrounds?: GeneratedBackground[];
    generatedSettingCuts?: GeneratedSettingCut[];
    generatedTextCards?: GeneratedTextCard[];
    generatedImages?: GeneratedImage[];
    generatedVideos?: GeneratedVideo[];
  };
  metadata: {
    version: string;
    totalItems: number;
    dataSize: number;
  };
}

/**
 * 프로젝트 데이터를 공유 가능한 형식으로 변환
 */
export const prepareProjectForSharing = (
  projectData: {
    story?: string;
    characterList?: Array<{ id: number; name: string; description: string }>;
    finalScenario?: string;
    generatedProjectData?: GeneratedProjectData;
    generatedCharacters?: GeneratedCharacter[];
    generatedBackgrounds?: GeneratedBackground[];
    generatedSettingCuts?: GeneratedSettingCut[];
    generatedTextCards?: GeneratedTextCard[];
    generatedImages?: GeneratedImage[];
    generatedVideos?: GeneratedVideo[];
  },
  options: DataSharingOptions
): SharedProjectData => {
  const sharedData: SharedProjectData = {
    id: generateProjectId(),
    title: 'StoryBoard Project',
    description: 'AI Generated StoryBoard',
    createdAt: new Date().toISOString(),
    data: {},
    metadata: {
      version: '1.0.0',
      totalItems: 0,
      dataSize: 0
    }
  };

  // 기본 데이터 포함
  if (projectData.story) sharedData.data.story = projectData.story;
  if (projectData.characterList) sharedData.data.characterList = projectData.characterList;
  if (projectData.finalScenario) sharedData.data.finalScenario = projectData.finalScenario;
  if (projectData.generatedProjectData) sharedData.data.generatedProjectData = projectData.generatedProjectData;

  // 옵션에 따른 데이터 포함
  if (options.includeImages) {
    if (projectData.generatedCharacters) sharedData.data.generatedCharacters = projectData.generatedCharacters;
    if (projectData.generatedBackgrounds) sharedData.data.generatedBackgrounds = projectData.generatedBackgrounds;
    if (projectData.generatedSettingCuts) sharedData.data.generatedSettingCuts = projectData.generatedSettingCuts;
    if (projectData.generatedImages) sharedData.data.generatedImages = projectData.generatedImages;
  }

  if (options.includeVideos) {
    if (projectData.generatedTextCards) sharedData.data.generatedTextCards = projectData.generatedTextCards;
    if (projectData.generatedVideos) sharedData.data.generatedVideos = projectData.generatedVideos;
  }

  // 메타데이터 계산
  sharedData.metadata.totalItems = calculateTotalItems(sharedData.data);
  sharedData.metadata.dataSize = calculateDataSize(sharedData);

  return sharedData;
};

/**
 * 프로젝트 ID 생성
 */
export const generateProjectId = (): string => {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 총 아이템 수 계산
 */
export const calculateTotalItems = (data: SharedProjectData['data']): number => {
  let total = 0;
  
  if (data.generatedCharacters) total += data.generatedCharacters.length;
  if (data.generatedBackgrounds) total += data.generatedBackgrounds.length;
  if (data.generatedSettingCuts) total += data.generatedSettingCuts.length;
  if (data.generatedTextCards) total += data.generatedTextCards.length;
  if (data.generatedImages) total += data.generatedImages.length;
  if (data.generatedVideos) total += data.generatedVideos.length;
  
  return total;
};

/**
 * 데이터 크기 계산 (바이트)
 */
export const calculateDataSize = (sharedData: SharedProjectData): number => {
  const jsonString = JSON.stringify(sharedData);
  return new Blob([jsonString]).size;
};

/**
 * 데이터를 클립보드에 복사
 */
export const copyToClipboard = async (data: SharedProjectData): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error('클립보드 복사 실패:', error);
    return false;
  }
};

/**
 * 데이터를 URL로 공유 (Base64 인코딩)
 */
export const generateShareableUrl = (data: SharedProjectData): string => {
  const jsonString = JSON.stringify(data);
  const encodedData = btoa(unescape(encodeURIComponent(jsonString)));
  const baseUrl = window.location.origin;
  return `${baseUrl}/share/${encodedData}`;
};

/**
 * URL에서 데이터 복원
 */
export const restoreFromUrl = (encodedData: string): SharedProjectData | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(encodedData)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('URL에서 데이터 복원 실패:', error);
    return null;
  }
};

/**
 * 데이터 검증
 */
export const validateSharedData = (data: any): data is SharedProjectData => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    typeof data.createdAt === 'string' &&
    typeof data.data === 'object' &&
    typeof data.metadata === 'object' &&
    typeof data.metadata.version === 'string' &&
    typeof data.metadata.totalItems === 'number' &&
    typeof data.metadata.dataSize === 'number'
  );
};

/**
 * 데이터 압축 (간단한 압축)
 */
export const compressData = (data: SharedProjectData): string => {
  // 실제 압축 라이브러리를 사용할 수 있지만, 여기서는 간단한 방법 사용
  const jsonString = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(jsonString)));
};

/**
 * 데이터 압축 해제
 */
export const decompressData = (compressedData: string): SharedProjectData | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(compressedData)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('데이터 압축 해제 실패:', error);
    return null;
  }
};

/**
 * 데이터 공유 실행
 */
export const shareProjectData = async (
  projectData: any,
  options: DataSharingOptions
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const sharedData = prepareProjectForSharing(projectData, options);
    
    switch (options.format) {
      case 'clipboard':
        const success = await copyToClipboard(sharedData);
        return { success };
        
      case 'url':
        const url = generateShareableUrl(sharedData);
        return { success: true, url };
        
      case 'json':
        const jsonString = JSON.stringify(sharedData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `storyboard_${sharedData.id}.json`;
        link.click();
        
        URL.revokeObjectURL(downloadUrl);
        return { success: true };
        
      default:
        return { success: false, error: '지원하지 않는 형식입니다.' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' };
  }
};

/**
 * 데이터 생성 상태 추적
 */
export interface DataGenerationStatus {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  errors: string[];
  warnings: string[];
}

export const createDataGenerationTracker = () => {
  const status: DataGenerationStatus = {
    isGenerating: false,
    progress: 0,
    currentStep: '',
    errors: [],
    warnings: []
  };

  return {
    status,
    startGeneration: (step: string) => {
      status.isGenerating = true;
      status.progress = 0;
      status.currentStep = step;
      status.errors = [];
      status.warnings = [];
    },
    updateProgress: (progress: number, step?: string) => {
      status.progress = Math.min(100, Math.max(0, progress));
      if (step) status.currentStep = step;
    },
    addError: (error: string) => {
      status.errors.push(error);
    },
    addWarning: (warning: string) => {
      status.warnings.push(warning);
    },
    completeGeneration: () => {
      status.isGenerating = false;
      status.progress = 100;
    },
    reset: () => {
      status.isGenerating = false;
      status.progress = 0;
      status.currentStep = '';
      status.errors = [];
      status.warnings = [];
    }
  };
};
