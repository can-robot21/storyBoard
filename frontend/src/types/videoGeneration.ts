// Google Veo API 최신 타입 정의
export enum GenerationMode {
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  FRAMES_TO_VIDEO = 'FRAMES_TO_VIDEO', 
  REFERENCES_TO_VIDEO = 'REFERENCES_TO_VIDEO',
  EXTEND_VIDEO = 'EXTEND_VIDEO'
}

export enum VeoModel {
  VEO = 'veo-3.0-generate-001',
  VEO_FAST = 'veo-3.0-fast',
  VEO_STANDARD = 'veo-3.0-standard'
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16'
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p'
}

export interface ImageFile {
  file: File;
  base64: string;
}

export interface VideoFile {
  file: File;
  base64: string;
}

export interface GenerateVideoParams {
  prompt?: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mode: GenerationMode;
  startFrame?: ImageFile | null;
  endFrame?: ImageFile | null;
  referenceImages?: ImageFile[];
  styleImage?: ImageFile | null;
  inputVideo?: VideoFile | null;
  inputVideoObject?: any; // Video object from Google API
  isLooping?: boolean;
}

// 기존 타입들 유지
export interface GeneratedVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail?: string;
  duration?: string;
  timestamp: string;
  prompt: string;
  model: string;
  ratio: string;
  quality: string;
  referenceImages?: string[];
  videoObject?: any; // 영상 확장을 위한 객체
  
  // 기존 속성들 (하위 호환성)
  videoRatio?: string;
  type?: string;
  projectTexts?: string[];
  characterImages?: GeneratedImage[];
  backgrounds?: GeneratedImage[];
  textCards?: any[];
  aiReviewTexts?: any[];
  sceneCommonSettings?: any[];
  video?: string;
}

export interface GeneratedTextCard {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  type: 'korean' | 'english';
  episodeId?: number;
  sceneId?: number;
  cutId?: number;
  
  // 하위 호환성을 위한 추가 속성들
  generatedText?: string;
}

export interface GeneratedImage {
  id: number;
  description: string;
  image: string;
  timestamp: string;
  type: 'character' | 'background' | 'settingCut';
  input?: string; // 하위 호환성
  source?: string; // 하위 호환성
}

export interface SceneTextCard {
  id: number;
  title: string;
  description: string;
  cuts: CutTextCard[];
  timestamp: string;
  
  // 하위 호환성을 위한 추가 속성들
  sceneId?: number;
  sceneTitle?: string;
  sceneDescription?: string;
  sceneCommonSettings?: string;
  showScene?: boolean;
}

export interface CutTextCard {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  type: 'korean' | 'english';
  
  // 하위 호환성을 위한 추가 속성들
  text?: string;
  selected?: boolean;
  cutNumber?: number;
}

export interface ErrorModalState {
  isOpen: boolean;
  error: string;
  hasImages: boolean;
  currentPrompt: string;
  currentVideoRatio: string;
  currentReferenceImages: string[];
}

export interface ConfirmModalState {
  isOpen: boolean;
  prompt: string;
  videoRatio: string;
  referenceImages: string[];
  onConfirm: () => void;
}

// VideoGenerationStep Props 타입 추가
export interface VideoGenerationStepProps {
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<GeneratedTextCard[]>>;
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedSettingCutImages: GeneratedImage[];
  setGeneratedSettingCutImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  cutTextCardSelections: any;
  selectedCuts: Set<string>;
  characterPrompt: string;
  scenarioPrompt: string;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  story: string;
  setStory: (story: string) => void;
  characterList: any[];
  setCharacterList: (characters: { id: number; name: string; description: string; }[]) => void;
  finalScenario: string;
  generatedProjectData: any;
  generatedSceneTextCards?: SceneTextCard[];
  episodes?: any[];
  onNext: () => void;
  canProceedToNext: () => any;
  onEditCard?: (cardId: number, cardData: any) => void;
  onSetEditHandler?: (handler: any) => void;
}