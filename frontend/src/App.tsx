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
import { UserMigrationModal } from './components/common/UserMigrationModal';
import { MigrationResult } from './services/userMigrationService';
import { SecurityCheckModal } from './components/common/SecurityCheckModal';
import { LogoutConfirmationModal, LogoutOptions } from './components/common/LogoutConfirmationModal';
import { logoutDataCleanupService } from './services/logoutDataCleanupService';
import { AccountDeletionModal, AccountDeletionOptions } from './components/common/AccountDeletionModal';
import { accountDeletionService } from './services/accountDeletionService';
import { BackupManagerModal } from './components/common/BackupManagerModal';
import { EnhancedApiKeyManagerModal } from './components/common/EnhancedApiKeyManagerModal';
import { SessionManagerModal } from './components/common/SessionManagerModal';
import { sessionManagementService } from './services/sessionManagementService';
import { PermissionManagerModal } from './components/common/PermissionManagerModal';
import { userPermissionService } from './services/userPermissionService';
import { ActivityLogManagerModal } from './components/common/ActivityLogManagerModal';
import { userActivityLogService } from './services/userActivityLogService';
import { ManagementModal } from './components/common/ManagementModal';
import IntroPage from './components/pages/IntroPage';
import DescriptionPage from './components/pages/DescriptionPage';

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
  
  // 페이지 라우팅 상태
  const [currentPage, setCurrentPage] = useState<'intro' | 'description' | 'main'>('intro');
  const [showAISettings, setShowAISettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasShownFirstTimeLoginModal, setHasShownFirstTimeLoginModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'profile'>('login');
  const [AuthModal, setAuthModal] = useState<React.ComponentType<any> | null>(null);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [pendingMigrationUser, setPendingMigrationUser] = useState<User | null>(null);
  const [showSecurityCheck, setShowSecurityCheck] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showAccountDeletion, setShowAccountDeletion] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showEnhancedApiKeyManager, setShowEnhancedApiKeyManager] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const [showActivityLogManager, setShowActivityLogManager] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);

  // 인증 서비스 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await AuthService.initializeUsers();
        const user = AuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
          
          // 세션 복원
          const session = sessionManagementService.loadSession();
          if (session) {
            console.log('세션 복원됨:', session.sessionId);
          }
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
    '16:9', // aspectRatio 기본값
    undefined, // imageOptions
    currentUser?.id || 'default' // currentProjectId
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

  const handleLoginSuccess = async (user: User, needsMigration?: boolean) => {
    if (needsMigration && currentUser) {
      // 마이그레이션이 필요한 경우
      setPendingMigrationUser(user);
      setShowMigrationModal(true);
      return;
    }
    
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    
    // 세션 시작
    try {
      sessionManagementService.startSession(user, {
        ipAddress: 'localhost', // 실제로는 클라이언트 IP 사용
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('세션 시작 실패:', error);
    }

    // 로그인 시 자동 동기화 (비활성화됨)
    // dataSyncService 관련 코드 제거됨
    
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
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = async (options: LogoutOptions) => {
    try {
      if (currentUser) {
        // 데이터 정리 실행
        const result = await logoutDataCleanupService.executeLogoutCleanup(currentUser.id, options);
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: '로그아웃 완료',
            message: `데이터 정리가 완료되었습니다. (프로젝트: ${result.clearedItems.projectData}개, 이미지: ${result.clearedItems.imageData}개)`
          });
        } else {
          addNotification({
            type: 'warning',
            title: '로그아웃 완료',
            message: '로그아웃되었지만 일부 데이터 정리 중 오류가 발생했습니다.'
          });
        }
      }

      // 세션 종료
      sessionManagementService.endSession();
      
      // 로그아웃 처리
      AuthService.logout();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setShowLogoutConfirmation(false);
    } catch (error) {
      console.error('로그아웃 처리 실패:', error);
      addNotification({
        type: 'error',
        title: '로그아웃 실패',
        message: '로그아웃 처리 중 오류가 발생했습니다.'
      });
    }
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

  const handleMigrationComplete = (result: MigrationResult) => {
    if (pendingMigrationUser) {
      setCurrentUser(pendingMigrationUser);
      setIsLoggedIn(true);
      setShowMigrationModal(false);
      setPendingMigrationUser(null);
      
      addNotification({
        type: 'success',
        title: '사용자 변경 완료',
        message: `데이터 마이그레이션이 완료되어 ${pendingMigrationUser.name}님으로 로그인되었습니다.`
      });
    }
  };

  const handleMigrationCancel = () => {
    setShowMigrationModal(false);
    setPendingMigrationUser(null);
    addNotification({
      type: 'info',
      title: '마이그레이션 취소',
      message: '사용자 변경이 취소되었습니다.'
    });
  };

  const handleAccountDeletion = () => {
    setShowAccountDeletion(true);
  };

  const handleAccountDeletionConfirm = async (options: AccountDeletionOptions) => {
    try {
      if (currentUser) {
        // 계정 삭제 실행
        const result = await accountDeletionService.executeAccountDeletion(currentUser.id, options);
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: '계정 삭제 완료',
            message: `계정이 성공적으로 삭제되었습니다. (프로젝트: ${result.deletedItems.projects}개, 이미지: ${result.deletedItems.images}개)`
          });

          // 세션 종료
          sessionManagementService.endSession();
          
          // 로그아웃 처리
          AuthService.logout();
          setCurrentUser(null);
          setIsLoggedIn(false);
          setShowAccountDeletion(false);
        } else {
          addNotification({
            type: 'error',
            title: '계정 삭제 실패',
            message: '계정 삭제 중 오류가 발생했습니다.'
          });
        }
      }
    } catch (error) {
      console.error('계정 삭제 처리 실패:', error);
      addNotification({
        type: 'error',
        title: '계정 삭제 실패',
        message: '계정 삭제 처리 중 오류가 발생했습니다.'
      });
    }
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

  // 페이지 라우팅 핸들러
  const handlePageNavigation = {
    toIntro: () => setCurrentPage('intro'),
    toDescription: () => setCurrentPage('description'),
    toMain: () => {
      setCurrentPage('main');
      // 본문 페이지 첫 접속시에만 로그인 모달 팝업
      if (!hasShownFirstTimeLoginModal && !isLoggedIn) {
        setShowAuthModal(true);
        setAuthModalMode('login');
        setHasShownFirstTimeLoginModal(true);
      }
    }
  };

  // 페이지별 렌더링
  if (currentPage === 'intro') {
    return <IntroPage onStart={handlePageNavigation.toDescription} />;
  }

  if (currentPage === 'description') {
    return (
      <DescriptionPage 
        onBack={handlePageNavigation.toIntro}
        onNext={handlePageNavigation.toMain}
      />
    );
  }

  // 메인 애플리케이션 (기존 코드)
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 상단 헤더 - 고정 */}
      <div className="flex-shrink-0">
        <Header
          isLoggedIn={isLoggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onProfileClick={handleProfile}
          onRegister={handleRegister}
          onTitleClick={handlePageNavigation.toIntro}
          currentUser={currentUser}
        />
      </div>
      
      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-hidden">
        <ImprovedMainLayout
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onShowSecurityCheck={() => setShowSecurityCheck(true)}
        onShowBackupManager={() => setShowBackupManager(true)}
        onShowEnhancedApiKeyManager={() => setShowEnhancedApiKeyManager(true)}
        onShowSessionManager={() => setShowSessionManager(true)}
        onShowPermissionManager={() => setShowPermissionManager(true)}
        onShowActivityLogManager={() => setShowActivityLogManager(true)}
        onShowManagementModal={() => setShowManagementModal(true)}
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
      </div>
      
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
          onAccountDeletion={handleAccountDeletion}
        />
      )}

      {/* 사용자 마이그레이션 모달 */}
      {showMigrationModal && currentUser && pendingMigrationUser && (
        <UserMigrationModal
          isOpen={showMigrationModal}
          onClose={handleMigrationCancel}
          currentUser={currentUser}
          targetUser={pendingMigrationUser}
          onMigrationComplete={handleMigrationComplete}
        />
      )}

      {/* 보안 검사 모달 */}
      <SecurityCheckModal
        isOpen={showSecurityCheck}
        onClose={() => setShowSecurityCheck(false)}
        onGoBack={() => {
          setShowSecurityCheck(false);
          setShowManagementModal(true);
        }}
      />

      {/* 로그아웃 확인 모달 */}
      <LogoutConfirmationModal
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
        onConfirm={handleLogoutConfirm}
        currentUser={currentUser}
      />

      {/* 계정 삭제 모달 */}
      <AccountDeletionModal
        isOpen={showAccountDeletion}
        onClose={() => setShowAccountDeletion(false)}
        onConfirm={handleAccountDeletionConfirm}
        currentUser={currentUser}
      />

      {/* 백업 관리 모달 */}
      <BackupManagerModal
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
        onGoBack={() => {
          setShowBackupManager(false);
          setShowManagementModal(true);
        }}
        currentUser={currentUser}
      />

      {/* 강화된 API 키 관리 모달 */}
      <EnhancedApiKeyManagerModal
        isOpen={showEnhancedApiKeyManager}
        onClose={() => setShowEnhancedApiKeyManager(false)}
        onGoBack={() => {
          setShowEnhancedApiKeyManager(false);
          setShowManagementModal(true);
        }}
        currentUser={currentUser}
      />

      {/* 세션 관리 모달 */}
      <SessionManagerModal
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        onGoBack={() => {
          setShowSessionManager(false);
          setShowManagementModal(true);
        }}
        currentUser={currentUser}
      />

      {/* 데이터 동기화 관리 모달 (비활성화됨) */}
      {/* DataSyncManagerModal 제거됨 */}

      {/* 권한 관리 모달 */}
      <PermissionManagerModal
        isOpen={showPermissionManager}
        onClose={() => setShowPermissionManager(false)}
        onGoBack={() => {
          setShowPermissionManager(false);
          setShowManagementModal(true);
        }}
        currentUser={currentUser}
      />

      {/* 활동 로그 관리 모달 */}
      <ActivityLogManagerModal
        isOpen={showActivityLogManager}
        onClose={() => setShowActivityLogManager(false)}
        onGoBack={() => {
          setShowActivityLogManager(false);
          setShowManagementModal(true);
        }}
        currentUser={currentUser}
      />

      {/* 통합 관리 모달 */}
      <ManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        onGoBack={() => {
          // 개별 관리 모달들을 모두 닫고 관리 도구 모달로 돌아가기
          setShowSecurityCheck(false);
          setShowBackupManager(false);
          setShowEnhancedApiKeyManager(false);
          setShowSessionManager(false);
          setShowPermissionManager(false);
          setShowActivityLogManager(false);
          // 관리 도구 모달은 열린 상태로 유지
        }}
        currentUser={currentUser}
        onSecurityCheck={() => setShowSecurityCheck(true)}
        onBackupManager={() => setShowBackupManager(true)}
        onEnhancedApiKeyManager={() => setShowEnhancedApiKeyManager(true)}
        onSessionManager={() => setShowSessionManager(true)}
        onPermissionManager={() => setShowPermissionManager(true)}
        onActivityLogManager={() => setShowActivityLogManager(true)}
      />
    </div>
  );
}
