// 프로젝트 개요 관련 타입 정의

export interface ProjectOverviewData {
  story: string;
  characterList: Character[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  generatedProjectData: GeneratedProjectData | null;
}

export interface Character {
  id: number;
  name: string;
  description: string;
}

export interface GeneratedProjectData {
  projectInfo?: {
    title: string;
    createdAt: string;
    version: string;
  };
  koreanCards: Record<string, string> | null;
  englishCards: Record<string, string> | null;
  settings?: {
    promptLength: {
      video: number;
      scenario: number;
    };
    sceneCuts: {
      sceneCount: number;
      cutCount: number;
    };
  };
  projectOverviewSaved?: boolean;
  aiReviewResult?: {
    scenarioReview?: string;
  };
}

export interface StepStatus {
  scenarioGenerated: boolean;
  aiReviewCompleted: boolean;
  jsonCardsGenerated: boolean;
  projectOverviewSaved: boolean;
}

export interface SceneCutSettings {
  sceneCount: number;
  cutCount: number;
}

export interface PromptLengthSettings {
  video: number;
  scenario: number;
}

export interface Episode {
  id: number;
  title: string;
  description: string;
  scenes: Scene[];
}

export interface Scene {
  id: number;
  title: string;
  description: string;
  cuts: number;
}

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
  canProceedToNext?: () => boolean;
  stepStatus: StepStatus;
  setStepStatus: (status: StepStatus) => void;
}
