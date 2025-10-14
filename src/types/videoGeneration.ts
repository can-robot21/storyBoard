// 영상 생성 관련 타입 정의

import { Episode, Scene } from './projectOverview';

// Episode와 Scene 타입을 다시 export
export type { Episode, Scene };

export interface SceneTextCard {
  id: number;
  sceneId: number;
  sceneTitle: string;
  sceneDescription: string;
  sceneCommonSettings?: string;
  cuts: CutTextCard[];
  showScene: boolean;
  timestamp: string;
}

export interface CutTextCard {
  id: number;
  cutNumber: number;
  text: string;
  selected: boolean;
  timestamp: string;
}

export interface GeneratedTextCard {
  id: number;
  generatedText: string;
  timestamp: string;
  sceneCommon?: string;
  originalSceneCommon?: string;
  story?: string;
  cutCount?: number;
}

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
  sceneCommonSettings: string[];
  video: string;
  videoRatio: string;
  timestamp: string;
  // 에피소드 영상 생성을 위한 추가 필드
  title?: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: string;
  type?: 'general' | 'episode';
  episodeId?: number;
}

export interface VideoSettings {
  quality: string;
  duration: string;
  framerate: string;
  englishPrompt: string;
}

export interface VideoSettingsEnabled {
  style: boolean;
  quality: boolean;
  duration: boolean;
  framerate: boolean;
  englishPrompt: boolean;
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

export interface VideoGenerationStepProps {
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<GeneratedTextCard[]>>;
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  // 선택 상태
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  // 컷별 텍스트카드 선택 상태
  cutTextCardSelections: {[key: string]: Set<number>};
  // 선택된 컷들 (영상 생성용)
  selectedCuts: Set<string>;
  characterPrompt: string;
  scenarioPrompt: string;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  finalScenario: string;
  generatedProjectData: any;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  // 프로젝트 개요 데이터
  story: string;
  setStory: (story: string) => void;
  characterList: any[];
  setCharacterList: (characters: any[]) => void;
  onNext: () => void;
  canProceedToNext?: () => boolean;
  onEditCard?: (cardId: number, currentText: string) => void;
  onSetEditHandler?: (handler: (cardId: number, currentText: string) => void) => void;
}
