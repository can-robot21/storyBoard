import React, { Suspense, lazy, useState } from 'react';
import { useUIStore } from '../../stores/uiStore';

// Lazy loading 컴포넌트들
const ProjectOverviewStep = lazy(() => import('../steps/ProjectOverviewStep').then(module => ({ default: module.ProjectOverviewStep })));
const ImageGenerationStep = lazy(() => import('../steps/ImageGenerationStep').then(module => ({ default: module.ImageGenerationStep })));
const NanoBananaImageStep = lazy(() => import('../steps/NanoBananaImageStep').then(module => ({ default: module.NanoBananaImageStep })));
const VideoGenerationStep = lazy(() => import('../steps/VideoGenerationStep').then(module => ({ default: module.VideoGenerationStep })));

// 로딩 컴포넌트
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">컴포넌트를 불러오는 중...</p>
    </div>
  </div>
);

// 에러 바운더리 컴포넌트
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('컴포넌트 로딩 오류:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              컴포넌트 로딩 오류
            </h2>
            <p className="text-gray-600 mb-4">
              컴포넌트를 불러오는 중 오류가 발생했습니다.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 메인 레이아웃 컴포넌트 (Lazy Loading 적용)
interface LazyMainLayoutProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onNext: () => void;
  stepStatus: any;
  setStepStatus: (status: any) => void;
  
  // 프로젝트 개요 상태
  story: string;
  setStory: (story: string) => void;
  characterList: Array<{ id: number; name: string; description: string }>;
  setCharacterList: (characters: Array<{ id: number; name: string; description: string }>) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (prompt: string) => void;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  finalScenario: string;
  setFinalScenario: (scenario: string) => void;
  generatedProjectData: any;
  setGeneratedProjectData: (data: any) => void;

  // 이미지 생성 상태
  generatedCharacters: any[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<any[]>>;
  generatedBackgrounds: any[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<any[]>>;
  generatedSettingCuts: any[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<any[]>>;
  generatedAdvancedImages: any[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<any[]>>;
  showTextResults: boolean;
  setShowTextResults: React.Dispatch<React.SetStateAction<boolean>>;

  // 영상 생성 상태
  generatedTextCards: any[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<any[]>>;
  generatedCharacterImages: any[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<any[]>>;
  generatedVideoBackgrounds: any[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<any[]>>;
  generatedSettingCutImages: any[];
  setGeneratedSettingCutImages: React.Dispatch<React.SetStateAction<any[]>>;
  generatedVideos: any[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<any[]>>;

  // 선택 상태
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  cutTextCardSelections: {[key: string]: Set<number>};
  setCutTextCardSelections: React.Dispatch<React.SetStateAction<{[key: string]: Set<number>}>>;
  selectedCuts: Set<string>;
  characterPrompt: string;
  canProceedToNext: () => any;
  onEditCard?: (cardId: number, cardData: any) => void;
}

export const LazyMainLayout: React.FC<LazyMainLayoutProps> = (props) => {
  const { currentStep } = props;

  // 현재 단계에 따른 컴포넌트 렌더링
  const renderCurrentStep = () => {
    switch (currentStep) {
      case '프로젝트 개요':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ProjectOverviewStep {...props} />
            </Suspense>
          </ErrorBoundary>
        );
      case '이미지 생성':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ImageGenerationStep {...props} />
            </Suspense>
          </ErrorBoundary>
        );
      case '이미지 생성-나노 바나나':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <NanoBananaImageStep {...props} />
            </Suspense>
          </ErrorBoundary>
        );
      case '영상 생성':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <VideoGenerationStep {...props} />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                알 수 없는 단계
              </h2>
              <p className="text-gray-600">
                선택된 단계를 찾을 수 없습니다.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-hidden">
      {renderCurrentStep()}
    </div>
  );
};

// 성능 최적화를 위한 메모이제이션된 컴포넌트
export const MemoizedLazyMainLayout = React.memo(LazyMainLayout);

// 컴포넌트 프리로딩 함수
export const preloadComponents = () => {
  // 프로젝트 개요 컴포넌트 프리로딩
  import('../steps/ProjectOverviewStep');
  
  // 이미지 생성 컴포넌트 프리로딩
  import('../steps/ImageGenerationStep');
  
  // 나노바나나 이미지 컴포넌트 프리로딩
  import('../steps/NanoBananaImageStep');
  
  // 영상 생성 컴포넌트 프리로딩
  import('../steps/VideoGenerationStep');
};

// 컴포넌트 로딩 상태 훅
export const useComponentLoading = () => {
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  const setLoading = (component: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [component]: loading
    }));
  };

  const isLoading = (component: string) => loadingStates[component] || false;

  return { setLoading, isLoading };
};

export default LazyMainLayout;
