import React, { useState, useEffect } from 'react';
import { useUIStore } from './stores/uiStore';
import { Header } from './components/layout/Header';
import { ImprovedMainLayout } from './components/layout/ImprovedMainLayout';
import { AISettingsModal } from './components/common/AISettingsModal';
import { LoginOverlay } from './components/common/LoginOverlay';
import { useProjectHandlers } from './hooks/useProjectHandlers';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useVideoHandlers } from './hooks/useVideoHandlers';
import { useAIServiceManager } from './hooks/useAIServiceManager';
import { AuthService } from './services/authService';
import { 
  GeneratedCharacter, 
  GeneratedBackground, 
  GeneratedSettingCut,
  GeneratedTextCard,
  GeneratedImage,
  GeneratedVideo,
  GeneratedProjectData
} from './types/project';
import { AIProvider } from './types/ai';
import { User } from './types/auth';

// const mainSteps = [
//   "프로젝트 개요",
//   "이미지 생성", 
//   "영상 생성",
// ];

export default function App() {
  const { addNotification } = useUIStore();
  const [currentStep, setCurrentStep] = useState("프로젝트 개요");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'profile'>('login');
  const [AuthModal, setAuthModal] = useState<React.ComponentType<any> | null>(null);

  // 인증 서비스 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await AuthService.initializeUsers();
        const user = AuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    // AuthModal 동적 로드
    const loadAuthModal = async () => {
      try {
        const { AuthModal: AuthModalComponent } = await import('./components/common/AuthModal');
        setAuthModal(() => AuthModalComponent);
      } catch (error) {
        console.error('Failed to load AuthModal:', error);
      }
    };

    initializeAuth();
    loadAuthModal();
  }, []);
  
  // AI 서비스 관리
  const {
    selectedProvider,
    changeAIService
  } = useAIServiceManager();
  
  // 프로젝트 개요 상태
  const [story, setStory] = useState(() => {
    const saved = localStorage.getItem('projectStory');
    return saved || "";
  });
  const [characterList, setCharacterList] = useState<any[]>(() => {
    const saved = localStorage.getItem('projectCharacterList');
    return saved ? JSON.parse(saved) : [];
  });
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [storySummary, setStorySummary] = useState(() => {
    const saved = localStorage.getItem('projectStorySummary');
    return saved || "";
  });
  const [finalScenario, setFinalScenario] = useState("");
  const [generatedProjectData, setGeneratedProjectData] = useState<GeneratedProjectData | null>(null);
  
  // 이미지 생성 상태
  const [generatedCharacters, setGeneratedCharacters] = useState<GeneratedCharacter[]>([]);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<GeneratedBackground[]>([]);
  const [generatedSettingCuts, setGeneratedSettingCuts] = useState<GeneratedSettingCut[]>([]);
  
  // 고급 이미지 생성 상태
  const [generatedAdvancedImages, setGeneratedAdvancedImages] = useState<GeneratedCharacter[]>([]);
  
  // 영상 생성 상태
  const [generatedTextCards, setGeneratedTextCards] = useState<GeneratedTextCard[]>([]);
  const [generatedCharacterImages, setGeneratedCharacterImages] = useState<GeneratedImage[]>([]);
  const [generatedVideoBackgrounds, setGeneratedVideoBackgrounds] = useState<GeneratedImage[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  
  // 영상 생성 선택 상태
  const [selectedTextCards, setSelectedTextCards] = useState<Set<number>>(new Set());
  const [selectedCharacterImages, setSelectedCharacterImages] = useState<Set<number>>(new Set());
  const [selectedVideoBackgrounds, setSelectedVideoBackgrounds] = useState<Set<number>>(new Set());
  const [cutTextCardSelections] = useState<{ [key: string]: Set<number> }>({});
  const [selectedCuts] = useState<Set<string>>(new Set());
  const [characterPrompt] = useState("");
  
  // UI 상태
  const [showTextResults, setShowTextResults] = useState(false);
  
  // 단계 상태 관리
  const [stepStatus, setStepStatus] = useState({
    scenarioGenerated: false,
    aiReviewCompleted: false,
    jsonCardsGenerated: false,
    projectOverviewSaved: false
  });

  // 핸들러 훅들
  const projectHandlers = useProjectHandlers(
    story, setStory,
    characterList, setCharacterList,
    scenarioPrompt, setScenarioPrompt,
    storySummary, setStorySummary,
    finalScenario, setFinalScenario,
    generatedProjectData, setGeneratedProjectData,
    currentStep, setCurrentStep,
    generatedCharacters,
    setStepStatus
  );

  const imageHandlers = useImageHandlers(
    generatedCharacters, setGeneratedCharacters,
    generatedBackgrounds, setGeneratedBackgrounds,
    generatedSettingCuts, setGeneratedSettingCuts,
    generatedProjectData,
    'google', // 기본값
    '16:9' // aspectRatio 기본값
  );

  // VideoGenerationStep의 편집 핸들러 참조
  const videoStepEditHandlerRef = React.useRef<((cardId: number, currentText: string) => void) | null>(null);

  const videoHandlers = useVideoHandlers(
    generatedTextCards, setGeneratedTextCards,
    generatedCharacterImages, setGeneratedCharacterImages,
    generatedVideoBackgrounds, setGeneratedVideoBackgrounds,
    generatedVideos, setGeneratedVideos,
    generatedProjectData,
    (cardId: number, currentText: string) => {
      // VideoGenerationStep의 편집 모달을 열기 위한 핸들러
      if (videoStepEditHandlerRef.current) {
        videoStepEditHandlerRef.current(cardId, currentText);
      }
    }
  );

  const handleLogin = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleRegister = () => {
    setAuthModalMode('register');
    setShowAuthModal(true);
  };

  const handleProfile = () => {
    setAuthModalMode('profile');
    setShowAuthModal(true);
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    
    // 관리자 계정인 경우 환경 변수 키값 자동 적용
    if (AuthService.isAdminUser(user.email)) {
      console.log('🎉 관리자 계정으로 로그인 - 환경 변수 키값 자동 적용');
    }
    
    addNotification({
      type: 'success',
      title: '로그인 성공',
      message: `${user.name}님, 환영합니다!`
    });
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    addNotification({
      type: 'info',
      title: '로그아웃',
      message: '로그아웃되었습니다.'
    });
  };

  const handleAPIKeySave = async (apiKeys: any) => {
    if (currentUser) {
      try {
        const result = await AuthService.updateUser(currentUser.id, { apiKeys });
        if (result.success && result.user) {
          setCurrentUser(result.user);
          addNotification({
            type: 'success',
            title: 'API 키 저장',
            message: 'API 키가 성공적으로 저장되었습니다.'
          });
        }
      } catch (error) {
        console.error('API 키 저장 실패:', error);
        addNotification({
          type: 'error',
          title: '저장 실패',
          message: 'API 키 저장 중 오류가 발생했습니다.'
        });
      }
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    addNotification({
      type: 'success',
      title: '인증 성공',
      message: authModalMode === 'login' ? '로그인되었습니다.' : 
               authModalMode === 'register' ? '회원가입이 완료되었습니다.' :
               '회원정보가 수정되었습니다.'
    });
  };

  // 프로젝트 데이터 localStorage 저장
  useEffect(() => {
    if (story) {
      localStorage.setItem('projectStory', story);
    }
  }, [story]);

  useEffect(() => {
    if (characterList.length > 0) {
      localStorage.setItem('projectCharacterList', JSON.stringify(characterList));
    }
  }, [characterList]);

  useEffect(() => {
    if (storySummary) {
      localStorage.setItem('projectStorySummary', storySummary);
    }
  }, [storySummary]);

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  const handleAISettingsClick = () => {
    setShowAISettings(true);
  };

  const handleAISettingsClose = () => {
    setShowAISettings(false);
  };

  const handleAIProviderChange = async (provider: AIProvider) => {
    await changeAIService(provider);
  };

  const handleAISettingsSave = () => {
    addNotification({
      type: 'info',
      title: 'AI 설정',
      message: 'AI 서비스 설정이 저장되었습니다. 변경사항을 적용하려면 페이지를 새로고침하세요.',
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onProfileClick={handleProfile}
        onRegister={handleRegister}
        currentUser={currentUser}
      />
      
      <ImprovedMainLayout
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        // 프로젝트 개요 props
        story={story}
        setStory={setStory}
        characterList={characterList}
        setCharacterList={setCharacterList}
        scenarioPrompt={scenarioPrompt}
        setScenarioPrompt={setScenarioPrompt}
        storySummary={storySummary}
        setStorySummary={setStorySummary}
        finalScenario={finalScenario}
        setFinalScenario={setFinalScenario}
        generatedProjectData={generatedProjectData}
        setGeneratedProjectData={setGeneratedProjectData}
        // 이미지 생성 props
        generatedCharacters={generatedCharacters}
        setGeneratedCharacters={setGeneratedCharacters}
        generatedBackgrounds={generatedBackgrounds}
        setGeneratedBackgrounds={setGeneratedBackgrounds}
        generatedSettingCuts={generatedSettingCuts}
        setGeneratedSettingCuts={setGeneratedSettingCuts}
        generatedAdvancedImages={generatedAdvancedImages}
        setGeneratedAdvancedImages={setGeneratedAdvancedImages}
        // 영상 생성 props
        generatedTextCards={generatedTextCards}
        setGeneratedTextCards={setGeneratedTextCards}
        generatedCharacterImages={generatedCharacterImages}
        setGeneratedCharacterImages={setGeneratedCharacterImages}
        generatedVideoBackgrounds={generatedVideoBackgrounds}
        setGeneratedVideoBackgrounds={setGeneratedVideoBackgrounds}
        generatedVideos={generatedVideos}
        setGeneratedVideos={setGeneratedVideos}
        // 영상 생성 선택 상태
        selectedTextCards={selectedTextCards}
        setSelectedTextCards={setSelectedTextCards}
        selectedCharacterImages={selectedCharacterImages}
        setSelectedCharacterImages={setSelectedCharacterImages}
        selectedVideoBackgrounds={selectedVideoBackgrounds}
        setSelectedVideoBackgrounds={setSelectedVideoBackgrounds}
        cutTextCardSelections={cutTextCardSelections}
        selectedCuts={selectedCuts}
        characterPrompt={characterPrompt}
        // 핸들러들
        projectHandlers={projectHandlers}
        imageHandlers={imageHandlers}
        videoHandlers={videoHandlers}
        // UI 상태
        showTextResults={showTextResults}
        setShowTextResults={setShowTextResults}
        stepStatus={stepStatus}
        setStepStatus={setStepStatus}
        // AI 설정
        selectedAIProvider={selectedProvider}
        onAISettingsClick={handleAISettingsClick}
        currentUser={currentUser}
        videoStepEditHandlerRef={videoStepEditHandlerRef}
      />
      
      {/* 미로그인 상태에서 로그인 오버레이 표시 */}
      {!isLoggedIn && (
        <LoginOverlay
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
      
      {/* AI 설정 모달 */}
      <AISettingsModal
        isOpen={showAISettings}
        onClose={handleAISettingsClose}
        selectedProvider={selectedProvider}
        onProviderChange={handleAIProviderChange}
        onSave={handleAISettingsSave}
      />
      
      {/* 인증 모달 */}
      {AuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleAuthModalClose}
          mode={authModalMode}
          onSuccess={handleLoginSuccess}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
