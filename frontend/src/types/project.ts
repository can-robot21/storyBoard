// 기본 프로젝트 타입들
export interface Character {
  id: number;
  name: string;
  description: string;
}

// 프로젝트 단계 타입
export type StepType = '프로젝트 개요' | '이미지 생성' | '영상 생성';

// 단계 상태 타입
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

// 프로젝트 인터페이스
export interface Project {
  id: string;
  name: string;
  description?: string;
  currentStep: StepType;
  stepStatus: Record<StepType, StepStatus>;
  createdAt: string;
  updatedAt: string;
  data: ProjectState;
}

export interface ProjectSettings {
  videoRatio: '16:9' | '1:1' | '9:16';
  cutCount: number;
  currentCutIndex: number;
}

// 이미지 생성 메타데이터
export interface ImageGenerationMetadata {
  // 생성 옵션
  personGeneration?: 'allow_adult' | 'allow_all' | 'dont_allow';
  aspectRatio?: string;
  imageSize?: string;
  numberOfImages?: number;
  
  // API 응답 정보
  apiResponse?: {
    generatedCount: number;
    requestedCount: number;
    timestamp: string;
  };
  
  // 안전 속성 정보
  safetyAttributes?: {
    blocked: boolean;
    categories?: Record<string, string>;
    scores?: Record<string, number>;
  };
}

// 생성된 아이템들의 기본 인터페이스
export interface BaseGeneratedItem {
  id: number;
  description: string;
  image: string;
  attachedImages: string[];
  timestamp: string;
  generationMetadata?: ImageGenerationMetadata;
}

export interface GeneratedCharacter extends BaseGeneratedItem {
  type: 'character';
}

export interface GeneratedBackground extends BaseGeneratedItem {
  type: 'background';
}

export interface GeneratedSettingCut extends BaseGeneratedItem {
  type: 'setting';
}

// 텍스트 카드 관련 타입
export interface GeneratedTextCard {
  id: number;
  generatedText: string;
  timestamp: string;
  sceneCommon?: string;
  originalSceneCommon?: string;
  story?: string;
  originalStory?: string;
  cutCount?: number;
}

// 영상 관련 타입
export interface GeneratedImage {
  id: number;
  input: string;
  image: string;
  timestamp: string;
  description?: string;
  source?: string;
}

export interface GeneratedVideo {
  id: number;
  textCards: GeneratedTextCard[];
  characterImages: GeneratedImage[];
  backgrounds: GeneratedImage[];
  projectTexts: string[];
  aiReviewTexts: string[];
  sceneCommonSettings?: string[]; // videoGeneration 타입과 호환을 위해 추가
  video: string;
  videoRatio: string;
  timestamp: string;
  // 에피소드 영상 생성을 위한 추가 필드 (videoGeneration 타입과 호환)
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  type?: 'general' | 'episode';
  episodeId?: number;
}

// AI 생성 결과 타입
export interface AIGenerationResult {
  characterPrompt: string;
  scenarioPrompt: string;
  imagePrompts: {
    character: string;
    background: string;
    setting: string;
  };
  videoPrompts: {
    main: string;
    cuts: string[];
  };
}

export interface GroupedResults {
  characterGroup: {
    title: string;
    description: string;
    prompt: string;
    videoOptimization: string;
  };
  scenarioGroup: {
    title: string;
    description: string;
    prompt: string;
    videoOptimization: string;
  };
  videoGroup: {
    title: string;
    description: string;
    mainPrompt: string;
    cutPrompts: string[];
    videoOptimization: string;
  };
}

export interface GeneratedProjectData {
  reviewResult: string;
  groupedResults: GroupedResults;
  finalScenario: string;
  englishPrompt?: string;
  imagePrompts?: {
    character: string;
    background: string;
    setting: string;
  };
}

// 프로젝트 상태 타입
export interface ProjectState {
  // 기본 정보
  story: string;
  characterList: Character[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  
  // 생성된 데이터
  generatedProjectData: GeneratedProjectData | null;
  generatedCharacters: GeneratedCharacter[];
  generatedBackgrounds: GeneratedBackground[];
  generatedSettingCuts: GeneratedSettingCut[];
  generatedTextCards: GeneratedTextCard[];
  generatedCharacterImages: GeneratedImage[];
  generatedVideoBackgrounds: GeneratedImage[];
  generatedVideos: GeneratedVideo[];
  
  // 설정
  settings: ProjectSettings;
}

// 액션 타입들
export type ProjectAction = 
  | { type: 'SET_STORY'; payload: string }
  | { type: 'SET_CHARACTER_LIST'; payload: Character[] }
  | { type: 'ADD_CHARACTER'; payload: Character }
  | { type: 'REMOVE_CHARACTER'; payload: number }
  | { type: 'SET_SCENARIO_PROMPT'; payload: string }
  | { type: 'SET_STORY_SUMMARY'; payload: string }
  | { type: 'SET_FINAL_SCENARIO'; payload: string }
  | { type: 'SET_GENERATED_PROJECT_DATA'; payload: GeneratedProjectData | null }
  | { type: 'ADD_GENERATED_CHARACTER'; payload: GeneratedCharacter }
  | { type: 'REMOVE_GENERATED_CHARACTER'; payload: number }
  | { type: 'ADD_GENERATED_BACKGROUND'; payload: GeneratedBackground }
  | { type: 'REMOVE_GENERATED_BACKGROUND'; payload: number }
  | { type: 'ADD_GENERATED_SETTING_CUT'; payload: GeneratedSettingCut }
  | { type: 'REMOVE_GENERATED_SETTING_CUT'; payload: number }
  | { type: 'ADD_GENERATED_TEXT_CARD'; payload: GeneratedTextCard }
  | { type: 'REMOVE_GENERATED_TEXT_CARD'; payload: number }
  | { type: 'ADD_GENERATED_VIDEO'; payload: GeneratedVideo }
  | { type: 'REMOVE_GENERATED_VIDEO'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectSettings> }
  | { type: 'RESET_PROJECT' };

// 컴포넌트 Props 타입들
export interface ProjectOverviewStepProps {
  story: string;
  setStory: (story: string) => void;
  characterList: Character[];
  setCharacterList: (characters: Character[]) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (prompt: string) => void;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  finalScenario: string;
  setFinalScenario: (scenario: string) => void;
  generatedProjectData: GeneratedProjectData | null;
  setGeneratedProjectData: (data: GeneratedProjectData | null) => void;
  onNext: () => void;
}

export interface ImageGenerationStepProps {
  generatedCharacters: GeneratedCharacter[];
  setGeneratedCharacters: (characters: GeneratedCharacter[]) => void;
  generatedBackgrounds: GeneratedBackground[];
  setGeneratedBackgrounds: (backgrounds: GeneratedBackground[]) => void;
  generatedSettingCuts: GeneratedSettingCut[];
  setGeneratedSettingCuts: (cuts: GeneratedSettingCut[]) => void;
  generatedProjectData: GeneratedProjectData | null;
  onNext: () => void;
}

export interface VideoGenerationStepProps {
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: (cards: GeneratedTextCard[]) => void;
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: (images: GeneratedImage[]) => void;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: (backgrounds: GeneratedImage[]) => void;
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: (videos: GeneratedVideo[]) => void;
  characterPrompt: string;
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  generatedProjectData: GeneratedProjectData | null;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  onNext: () => void;
}

// API 응답 타입들
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProjectSaveRequest {
  projectId?: string;
  userId?: string;
  projectData: ProjectState;
}

export interface ProjectLoadResponse {
  projectId: string;
  projectData: ProjectState;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  isShared?: boolean;
}

// 데이터베이스 관련 타입들
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  email: string;
  name: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserApiKey {
  provider: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  templateData: any;
  isPublic: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  userName?: string;
}

export interface UsageStats {
  id: number;
  userId: string;
  actionType: string;
  aiProvider?: string;
  tokenCount: number;
  cost: number;
  timestamp: string;
  metadata?: any;
}

export interface ProjectHistory {
  id: number;
  projectId: string;
  userId: string;
  action: string;
  data?: any;
  timestamp: string;
}

// 유틸리티 타입들
export type ProjectStep = '프로젝트 개요' | '이미지 생성' | '영상 생성';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

// 체크박스 상태 타입
export interface CheckboxState {
  textCards: Set<number>;
  characterImages: Set<number>;
  backgrounds: Set<number>;
}

// 파일 업로드 타입
export interface FileUpload {
  file: File;
  preview: string;
  id: string;
}

// 다운로드 타입
export type DownloadType = 'character' | 'background' | 'setting' | 'cut' | 'video';

export interface DownloadData {
  type: DownloadType;
  id: number;
  name: string;
  data?: any;
}