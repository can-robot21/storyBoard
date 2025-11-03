/**
 * 핸들러 인터페이스 타입 정의
 * ImprovedMainLayout에서 사용하는 핸들러들의 타입을 명확히 정의
 */

// 프로젝트 관련 핸들러
export interface ProjectHandlers {
  // 생성 기능
  handleGenerateAllPrompts: () => Promise<void>;
  handleGenerateScenarioPrompt: () => Promise<void>;
  handleGenerateStorySummary: () => Promise<void>;
  
  // 재생성 기능
  handleRegenerateStory: () => Promise<void>;
  handleRegenerateCharacters: () => Promise<void>;
  handleRegenerateScenarioPrompt: () => Promise<void>;
  handleRegenerateStorySummary: () => Promise<void>;
  handleRegenerateFinalScenario: () => Promise<void>;
  handleRegenerateReview: () => Promise<void>;
  
  // 편집 기능
  handleEditStory: (newStory: string) => void;
  handleEditCharacters: (id: number, updates: { name?: string; description?: string }) => void;
  handleEditScenarioPrompt: (newPrompt: string) => void;
  handleEditStorySummary: (newSummary: string) => void;
  handleEditFinalScenario: (newScenario: string) => void;
  handleEditReview: (newReview: string) => void;
  
  // 내비게이션 기능
  handleNextStep: () => void;
  handleNext?: () => void; // handleNextStep의 별칭 (일부 컴포넌트에서 사용)
  canProceedToNext: () => boolean;
  isGeneratingAll: boolean;
  
  // 저장 기능
  handleSaveStory: () => Promise<void> | void;
  handleSaveCharacters: () => Promise<void> | void;
  handleSaveScenarioPrompt: () => Promise<void> | void;
  handleSaveStorySummary: () => Promise<void> | void;
  handleSaveFinalScenario: () => Promise<void> | void;
  handleSaveReview: () => Promise<void> | void;
  handleSaveScenario?: () => Promise<void> | void;
  
  // 단계 상태 관리
  setStepStatus?: (status: any) => void;
}

// 이미지 관련 핸들러
export interface GeneratedImageItem {
  id: number;
  description: string;
  image: string;
  imageStorageId?: string | null;
  attachedImages?: File[];
  timestamp: string;
}

export interface ImageHandlers {
  // 생성 기능
  handleGenerateCharacter: (characterInput: string, attachedImages: File[]) => Promise<GeneratedImageItem[] | null>;
  handleGenerateBackground: (backgroundInput: string, attachedImages: File[]) => Promise<GeneratedImageItem[] | null>;
  handleGenerateSettingCut: (settingCut: string, attachedImages: File[]) => Promise<GeneratedImageItem[] | null>;
  
  // 재생성 기능
  handleRegenerateCharacter: (characterId: number) => Promise<void>;
  handleRegenerateBackground: (backgroundId: number) => Promise<void>;
  handleRegenerateSettingCut: (settingId: number) => Promise<void>;
  
  // 삭제 기능
  handleDeleteCharacter: (characterId: number) => void;
  handleDeleteBackground: (backgroundId: number) => void;
  handleDeleteSettingCut: (settingId: number) => void;
  
  // 저장 기능
  handleSaveCharacter: (id: number) => Promise<void> | void;
  handleSaveBackground: (id: number) => Promise<void> | void;
  handleSaveSettingCut: (id: number) => Promise<void> | void;
  handleSaveAllCharacters: () => Promise<void> | void;
  handleSaveAllBackgrounds: () => Promise<void> | void;
  handleSaveAllSettingCuts: () => Promise<void> | void;
}

// 영상 관련 핸들러
export interface GeneratedVideoItem {
  id: number;
  text: string;
  image?: string;
  video?: string;
  timestamp: string;
}

export interface VideoHandlers {
  // 생성 기능
  handleGenerateTextCard: (prompt: string) => Promise<void>;
  handleGenerateCharacterImage: (characterOutfitInput: string, attachedImages?: File[]) => Promise<void>;
  handleGenerateVideoBackground: (videoBackgroundInput: string, attachedImages?: File[]) => Promise<void>;
  handleGenerateVideo?: (cardId: number, prompt?: string) => Promise<void>;
  
  // 편집 기능
  handleEditTextCard?: (cardId: number, newText: string) => void;
  handleEditCard?: (cardId: number, currentText: string) => void; // 일부 컴포넌트에서 사용
  
  // 삭제 기능
  handleDeleteTextCard: (cardId: number) => void;
  handleDeleteCharacterImage: (imageId: number) => void;
  handleDeleteVideoBackground: (backgroundId: number) => void;
  handleDeleteVideo: (videoId: number) => void;
  
  // 저장 기능
  handleSaveTextCard: (cardId: number) => Promise<void> | void;
  handleSaveCharacterImage: (imageId: number) => Promise<void> | void;
  handleSaveVideoBackground: (backgroundId: number) => Promise<void> | void;
  handleSaveVideo: (videoId: number) => Promise<void> | void;
  handleSaveAllTextCards: () => Promise<void> | void;
  handleSaveAllCharacterImages: () => Promise<void> | void;
  handleSaveAllVideoBackgrounds: () => Promise<void> | void;
  handleSaveAllVideos: () => Promise<void> | void;
}

