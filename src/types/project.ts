// 프로젝트 관련 타입 정의

export type StepStatus = 'pending' | 'current' | 'completed';
export type StepType = 'overview' | 'character' | 'video';
export type VideoRatio = '16:9' | '1:1' | '9:16';

// 프로젝트 기본 정보
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'deleted';
  steps: ProjectSteps;
}

// 프로젝트 단계별 데이터
export interface ProjectSteps {
  overview: OverviewStep;
  character: CharacterStep;
  video: VideoStep;
}

// 프로젝트 개요 단계
export interface OverviewStep {
  id: 'overview';
  title: string;
  description: string;
  status: StepStatus;
  data: {
    story: string;
    character: string;
    storyText: string;
    prompts: {
      storyPrompt: string;
      characterPrompt: string;
      scenarioPrompt: string;
    };
  };
}

// 캐릭터 설정 단계
export interface CharacterStep {
  id: 'character';
  title: string;
  description: string;
  status: StepStatus;
  data: {
    characters: Character[];
    backgrounds: Background[];
    settingCuts: SettingCut[];
  };
}

// 영상 생성 단계
export interface VideoStep {
  id: 'video';
  title: string;
  description: string;
  status: StepStatus;
  data: {
    settings: {
      cutCount: number;
      videoRatio: VideoRatio;
      currentCutIndex: number;
    };
    cuts: VideoCut[];
    pagination: {
      currentPage: number;
      itemsPerPage: number;
      totalPages: number;
    };
  };
}

// 캐릭터 정보
export interface Character {
  id: string;
  name: string;
  description: string;
  style: '애니메이션' | '사실적' | '만화' | '픽사';
  imageUrl: string;
  attachedImages: File[];
  createdAt: string;
}

// 배경 정보
export interface Background {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  attachedImages: File[];
  createdAt: string;
}

// 설정 컷 정보
export interface SettingCut {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  attachedImages: File[];
  createdAt: string;
}

// 영상 컷 정보
export interface VideoCut {
  id: string;
  cutNumber: number;
  textScenario: string;
  characterOutfit: string;
  additionalElements: string;
  videoUrl: string;
  videoRatio: VideoRatio;
  attachedImages: {
    characterOutfit: File[];
    additional: File[];
  };
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// AI 생성 요청 타입
export interface AITextRequest {
  story?: string;
  character?: string;
  storyText?: string;
}

export interface AIImageRequest {
  description: string;
  style?: string;
  attachedImages?: File[];
}

export interface AIVideoRequest {
  cutNumber: number;
  textScenario: string;
  characterOutfit: string;
  additionalElements: string;
  videoRatio: VideoRatio;
  attachedCharacterOutfitImages?: File[];
  attachedAdditionalImages?: File[];
}

// AI 생성 응답 타입
export interface AITextResponse {
  prompt: string;
  generated: string;
  timestamp: string;
}

export interface AIImageResponse {
  imageUrl: string;
  generated: string;
  timestamp: string;
}

export interface AIVideoResponse {
  videoUrl: string;
  generated: string;
  timestamp: string;
}

// 파일 다운로드 타입
export interface DownloadRequest {
  url: string;
  filename: string;
}

// 프로젝트 저장 요청 타입
export interface SaveProjectRequest {
  projectId: string;
  projectData: Project;
  includeAssets?: boolean;
}

// 프로젝트 내보내기 타입
export interface ExportProjectRequest {
  projectId: string;
  format: 'json' | 'zip';
  includeAssets?: boolean;
}
