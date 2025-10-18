import React, { useState } from 'react';
import { StepSettingsPanel } from './StepSettingsPanel';
import { ActionPanel } from './ActionPanel';
import { StepProgressPanel } from './StepProgressPanel';
import { StepHelpModal } from '../common/StepHelpModal';
import { ProjectReferenceModal } from '../common/ProjectReferenceModal';
import { UnifiedReferenceModal } from '../common/UnifiedReferenceModal';
import { ProjectOverviewStep } from '../steps/ProjectOverviewStep';
import { ImageGenerationStep } from '../steps/ImageGenerationStep';
import { NanoBananaImageStep } from '../steps/NanoBananaImageStep';
import { VideoGenerationStep } from '../steps/VideoGenerationStep';
import { useSettingsManager } from '../../hooks/useSettingsManager';
import { useUIStore } from '../../stores/uiStore';
import { storageOptimizationService } from '../../services/storageOptimizationService';

interface ImprovedMainLayoutProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  onShowSecurityCheck?: () => void;
  onShowBackupManager?: () => void;
  onShowEnhancedApiKeyManager?: () => void;
  onShowSessionManager?: () => void;
  onShowDataSyncManager?: () => void;
  onShowPermissionManager?: () => void;
  onShowActivityLogManager?: () => void;
  onShowManagementModal?: () => void;
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

  // 영상 생성 상태
  generatedTextCards: any[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<any[]>>;
  generatedCharacterImages: any[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<any[]>>;
  generatedVideoBackgrounds: any[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<any[]>>;
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
  selectedCuts: Set<string>;
  characterPrompt: string;

  // 핸들러들
  projectHandlers: any;
  imageHandlers: any;
  videoHandlers: any;

  // UI 상태
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  stepStatus: any;
  setStepStatus: (status: any) => void;

  // AI 설정
  selectedAIProvider?: string;
  
  // 핸들러
  onAISettingsClick?: () => void;
  
  // 사용자 정보
  currentUser?: any;
  // 영상 편집 핸들러 참조
  videoStepEditHandlerRef?: React.MutableRefObject<((cardId: number, currentText: string) => void) | null>;
}

export const ImprovedMainLayout: React.FC<ImprovedMainLayoutProps> = ({
  currentStep,
  setCurrentStep,
  onShowSecurityCheck,
  onShowBackupManager,
  onShowEnhancedApiKeyManager,
  onShowSessionManager,
  onShowDataSyncManager,
  onShowPermissionManager,
  onShowActivityLogManager,
  onShowManagementModal,
  // 프로젝트 개요 상태
  story,
  setStory,
  characterList,
  setCharacterList,
  scenarioPrompt,
  setScenarioPrompt,
  storySummary,
  setStorySummary,
  finalScenario,
  setFinalScenario,
  generatedProjectData,
  setGeneratedProjectData,
  // 이미지 생성 상태
  generatedCharacters,
  setGeneratedCharacters,
  generatedBackgrounds,
  setGeneratedBackgrounds,
  generatedSettingCuts,
  setGeneratedSettingCuts,
  generatedAdvancedImages,
  setGeneratedAdvancedImages,
  // 영상 생성 상태
  generatedTextCards,
  setGeneratedTextCards,
  generatedCharacterImages,
  setGeneratedCharacterImages,
  generatedVideoBackgrounds,
  setGeneratedVideoBackgrounds,
  generatedVideos,
  setGeneratedVideos,
  // 선택 상태
  selectedTextCards,
  setSelectedTextCards,
  selectedCharacterImages,
  setSelectedCharacterImages,
  selectedVideoBackgrounds,
  setSelectedVideoBackgrounds,
  cutTextCardSelections,
  selectedCuts,
  characterPrompt,
  // 핸들러들
  projectHandlers,
  imageHandlers,
  videoHandlers,
  // UI 상태
  showTextResults,
  setShowTextResults,
  stepStatus,
  setStepStatus,
  // AI 설정
  selectedAIProvider,
  onAISettingsClick,
  // 사용자 정보
  currentUser,
  videoStepEditHandlerRef
}) => {
  const { addNotification } = useUIStore();
  
  // API 키 상태 확인
  const getAPIKey = () => {
    if (currentUser?.apiKeys?.google) {
      return currentUser.apiKeys.google;
    }
    try {
      if (typeof window !== 'undefined') {
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google) return localKeys.google;
        }
      }
    } catch {}
    return process.env.REACT_APP_GEMINI_API_KEY || '';
  };

  const hasAPIKey = getAPIKey().trim() !== '';

  // 통합 설정 관리
  const {
    settings,
    updatePromptLength,
    updateSceneCut,
    updateImageSettings,
    updateVideoSettings,
    updateUISettings
  } = useSettingsManager();

  // 모달 상태
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProjectReference, setShowProjectReference] = useState(false);
  const [showUnifiedReference, setShowUnifiedReference] = useState(false);
  
  // ActionPanel 표시/숨김 상태
  const [isActionPanelVisible, setIsActionPanelVisible] = useState(true);
  const [referenceData, setReferenceData] = useState<{
    title: string;
    type: string;
    data: any[];
    aiProvider?: string;
  }>({ title: '', type: '', data: [] });

  // 영상 설정 상태
  const [videoSettings, setVideoSettings] = useState({
    quality: '1080p',
    duration: 'medium',
    ratio: '16:9',
    englishPrompt: ''
  });

  // 단계별 진행 상태 확인
  const canProceedToNext = () => {
    switch (currentStep) {
      case "프로젝트 개요":
        return stepStatus.projectOverviewSaved;
      case "TXT2IMG":
      case "IMG2IMG":
        return (generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0);
      case "영상 생성":
        return generatedVideos.length > 0;
      default:
        return false;
    }
  };

  // 프로젝트 초기화 핸들러
  const handleProjectReset = async () => {
    try {
      // 스토리지 상태 확인
      const storageHealth = await storageOptimizationService.getStorageHealth();
      if (storageHealth?.localStorage?.status === 'critical') {
        addNotification({
          type: 'warning',
          title: '스토리지 용량 부족',
          message: '스토리지 용량이 부족합니다. 초기화 후 정리가 필요할 수 있습니다.',
        });
      }

      // 모든 프로젝트 데이터 초기화
      setStory('');
      setCharacterList([]);
      setFinalScenario('');
      setGeneratedProjectData(null);
      setGeneratedCharacters([]);
      setGeneratedBackgrounds([]);
      setGeneratedSettingCuts([]);
      setGeneratedTextCards([]);
      setGeneratedVideos([]);
      setGeneratedCharacterImages([]);
      setGeneratedVideoBackgrounds([]);
      setVideoSettings({
        quality: '',
        duration: '',
        ratio: '',
        englishPrompt: ''
      });
      
      // 단계 상태 초기화
      setStepStatus({
        scenarioGenerated: false,
        aiReviewCompleted: false,
        jsonCardsGenerated: false,
        koreanCardDraftGenerated: false,
        projectOverviewSaved: false
      });
      
      // 현재 단계를 첫 번째로 리셋
      setCurrentStep('프로젝트 개요');
      
      // 로컬 스토리지 초기화 (최적화된 서비스 사용)
      storageOptimizationService.clearAllStorage();
      
      // 알림 표시
      addNotification({
        type: 'success',
        title: '프로젝트 초기화 완료',
        message: '모든 프로젝트 데이터가 초기화되었습니다.',
      });
    } catch (error) {
      console.error('프로젝트 초기화 실패:', error);
      addNotification({
        type: 'error',
        title: '초기화 실패',
        message: '프로젝트 초기화 중 오류가 발생했습니다.',
      });
    }
  };

  // 참조 모달 열기 핸들러
  const handleShowReference = (type: string, data: any[], aiProvider?: string) => {
    const titleMap: { [key: string]: string } = {
      story: '스토리',
      characters: '캐릭터',
      scenario: '시나리오',
      projectData: 'JSON 카드',
      characterImages: '캐릭터 이미지',
      backgroundImages: '배경 이미지',
      settingCuts: '설정컷',
      textCards: '텍스트 카드',
      videos: '생성된 영상'
    };

    setReferenceData({
      title: titleMap[type] || type,
      type,
      data,
      aiProvider: aiProvider || selectedAIProvider
    });
    setShowUnifiedReference(true);
  };

  // JSON 카드 생성 핸들러
  const handleGenerateJsonCard = (cardType: string, content: string) => {
    setGeneratedProjectData((prev: any) => {
      const newData = { ...prev };
      
      // 카드 타입에 따라 적절한 위치에 저장
      if (['스토리', '영상 설정', '캐릭터 설정', '씬-컷 구성', '시나리오 추가 설정', '영상 시나리오', '씬별 컷별 프롬프트'].includes(cardType)) {
        // 한국어 카드
        if (!newData.koreanCards) {
          newData.koreanCards = {};
        }
        newData.koreanCards[cardType] = content;
      } else if (['Story', 'Visual Settings', 'Character Settings', 'Scene Cut Structure', 'Additional Scenario Settings', 'Video Scenario', 'Scene Cut Prompts'].includes(cardType)) {
        // 영어 카드
        if (!newData.englishCards) {
          newData.englishCards = {};
        }
        newData.englishCards[cardType] = content;
      }
      
      return newData;
    });
  };

  // 상태에서 항목 삭제 핸들러 (인덱스 기반)
  const handleDeleteFromState = (type: string, index: number) => {
    console.log('삭제 요청:', { type, index }); // 디버깅용 로그 추가
    
    switch (type) {
      case 'characterImages':
        setGeneratedCharacterImages((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('캐릭터 이미지 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'backgroundImages':
        setGeneratedVideoBackgrounds((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('배경 이미지 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'settingCuts':
        setGeneratedSettingCuts((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('설정 컷 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'textCards':
        setGeneratedTextCards((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('텍스트 카드 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'videos':
        setGeneratedVideos((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('비디오 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'characters':
        setGeneratedCharacters((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('캐릭터 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      case 'backgrounds':
        setGeneratedBackgrounds((prev: any[]) => {
          const filtered = prev.filter((_, i) => i !== index);
          console.log('배경 삭제 후:', { 원본: prev.length, 삭제후: filtered.length, 삭제인덱스: index });
          return filtered;
        });
        break;
      default:
        console.log('삭제할 수 없는 타입:', type);
    }
  };

  // ID 기반 삭제 핸들러 (더 안전한 삭제 방식)
  const handleDeleteById = (type: string, id: number) => {
    console.log('ID 기반 삭제 요청:', { type, id });
    
    switch (type) {
      case 'characters':
        setGeneratedCharacters((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('캐릭터 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'backgrounds':
        setGeneratedBackgrounds((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('배경 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'settingCuts':
        setGeneratedSettingCuts((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('설정 컷 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'characterImages':
        setGeneratedCharacterImages((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('캐릭터 이미지 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'backgroundImages':
        setGeneratedVideoBackgrounds((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('배경 이미지 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'textCards':
        setGeneratedTextCards((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('텍스트 카드 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      case 'videos':
        setGeneratedVideos((prev: any[]) => {
          const filtered = prev.filter((item: any) => item.id !== id);
          console.log('비디오 ID 삭제 후:', { 삭제ID: id, 원본: prev.length, 삭제후: filtered.length });
          return filtered;
        });
        break;
      default:
        console.log('ID 기반 삭제할 수 없는 타입:', type);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "프로젝트 개요":
        return (
          <ProjectOverviewStep
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
            onNext={projectHandlers.handleNext}
            canProceedToNext={canProceedToNext}
            stepStatus={stepStatus}
            setStepStatus={setStepStatus}
          />
        );

      case "TXT2IMG":
        return (
          <ImageGenerationStep
            generatedCharacters={generatedCharacters}
            setGeneratedCharacters={setGeneratedCharacters}
            generatedBackgrounds={generatedBackgrounds}
            setGeneratedBackgrounds={setGeneratedBackgrounds}
            generatedSettingCuts={generatedSettingCuts}
            setGeneratedSettingCuts={setGeneratedSettingCuts}
            generatedProjectData={generatedProjectData}
            showTextResults={showTextResults}
            setShowTextResults={setShowTextResults}
            story={story}
            characterList={characterList}
            scenarioPrompt={scenarioPrompt}
            storySummary={storySummary}
            finalScenario={finalScenario}
            onNext={projectHandlers.handleNext}
            canProceedToNext={canProceedToNext}
            globalImageSettings={settings.image}
            onOpenSettings={onAISettingsClick}
          />
        );

      case "IMG2IMG":
        return (
          <NanoBananaImageStep
            generatedProjectData={generatedProjectData}
            story={story}
            characterList={characterList}
            scenarioPrompt={scenarioPrompt}
            storySummary={storySummary}
            finalScenario={finalScenario}
            generatedCharacters={generatedCharacters}
            setGeneratedCharacters={setGeneratedCharacters}
            generatedBackgrounds={generatedBackgrounds}
            setGeneratedBackgrounds={setGeneratedBackgrounds}
            generatedSettingCuts={generatedSettingCuts}
            setGeneratedSettingCuts={setGeneratedSettingCuts}
            generatedAdvancedImages={generatedAdvancedImages}
            setGeneratedAdvancedImages={setGeneratedAdvancedImages}
            showTextResults={showTextResults}
            setShowTextResults={setShowTextResults}
            onNext={projectHandlers.handleNext}
            canProceedToNext={canProceedToNext}
            currentUser={currentUser}
            globalImageSettings={settings.image}
          />
        );

      case "영상 생성":
        return (
          <VideoGenerationStep
            generatedTextCards={generatedTextCards}
            setGeneratedTextCards={setGeneratedTextCards}
            generatedCharacterImages={generatedCharacterImages}
            setGeneratedCharacterImages={setGeneratedCharacterImages}
            generatedVideoBackgrounds={generatedVideoBackgrounds}
            setGeneratedVideoBackgrounds={setGeneratedVideoBackgrounds}
            generatedSettingCutImages={generatedSettingCuts}
            setGeneratedSettingCutImages={setGeneratedSettingCuts}
            generatedVideos={generatedVideos}
            setGeneratedVideos={setGeneratedVideos}
            selectedTextCards={selectedTextCards}
            setSelectedTextCards={setSelectedTextCards}
            selectedCharacterImages={selectedCharacterImages}
            setSelectedCharacterImages={setSelectedCharacterImages}
            selectedVideoBackgrounds={selectedVideoBackgrounds}
            setSelectedVideoBackgrounds={setSelectedVideoBackgrounds}
            cutTextCardSelections={cutTextCardSelections}
            selectedCuts={selectedCuts}
            characterPrompt={characterPrompt}
            scenarioPrompt={scenarioPrompt}
            storySummary={storySummary}
            setStorySummary={setStorySummary}
            finalScenario={finalScenario}
            generatedProjectData={generatedProjectData}
            showTextResults={showTextResults}
            setShowTextResults={setShowTextResults}
            story={story}
            setStory={setStory}
            characterList={characterList}
            setCharacterList={setCharacterList}
            onNext={projectHandlers.handleNext}
            canProceedToNext={canProceedToNext}
            onEditCard={(cardId, cardData) => {
              // VideoGenerationStep의 편집 모달을 직접 열기
              if (videoStepEditHandlerRef?.current) {
                videoStepEditHandlerRef.current(cardId, cardData);
              }
            }}
            onSetEditHandler={(handler) => {
              if (videoStepEditHandlerRef) {
                videoStepEditHandlerRef.current = handler;
              }
            }}
          />
        );

      default:
        return <div>알 수 없는 단계입니다.</div>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 상단 설정 패널 - 고정 */}
      {settings.ui.showStepSettings && (
        <div className="flex-shrink-0">
          <StepSettingsPanel
            currentStep={currentStep}
            promptLengthSettings={settings.promptLength}
            setPromptLengthSettings={updatePromptLength}
            sceneCutSettings={settings.sceneCut}
            setSceneCutSettings={updateSceneCut}
            imageSettings={settings.image}
            setImageSettings={updateImageSettings}
            videoSettings={settings.video}
            setVideoSettings={updateVideoSettings}
            selectedAIProvider={selectedAIProvider}
            onAISettingsClick={onAISettingsClick}
            onTogglePanel={() => updateUISettings({ showStepSettings: false })}
          />
        </div>
      )}

      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6">
          {/* 단계별 콘텐츠 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 진행 상태 패널 - 고정 */}
      <div className="flex-shrink-0">
        <StepProgressPanel
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          story={story}
          characterList={characterList}
          finalScenario={finalScenario}
          generatedProjectData={generatedProjectData}
          generatedCharacters={generatedCharacters}
          generatedBackgrounds={generatedBackgrounds}
          generatedSettingCuts={generatedSettingCuts}
          generatedTextCards={generatedTextCards}
          generatedVideos={generatedVideos}
          generatedCharacterImages={generatedCharacterImages}
          generatedVideoBackgrounds={generatedVideoBackgrounds}
          videoSettings={videoSettings}
          cutTextCardSelections={cutTextCardSelections}
          selectedCuts={selectedCuts}
          onShowReference={handleShowReference}
          onDeleteItem={handleDeleteFromState}
          selectedAIProvider={selectedAIProvider}
          onAISettingsClick={onAISettingsClick}
          hasAPIKey={hasAPIKey}
          onUsefulToolsClick={() => setIsActionPanelVisible(!isActionPanelVisible)}
        />
      </div>

      {/* 하단 액션 패널 - 고정 */}
      <div className="flex-shrink-0">
        <ActionPanel
          currentStep={currentStep}
          onHelpClick={() => setShowHelpModal(true)}
          onProjectReferenceClick={() => setShowProjectReference(true)}
          onExportClick={() => {/* 내보내기 로직 */}}
          onToggleSettings={() => updateUISettings({ showStepSettings: !settings.ui.showStepSettings })}
          onManagementToolsClick={onShowManagementModal}
          projectHandlers={projectHandlers}
          imageHandlers={imageHandlers}
          videoHandlers={videoHandlers}
          stepStatus={stepStatus}
          canProceedToNext={canProceedToNext()}
          isActionPanelVisible={isActionPanelVisible}
          onToggleActionPanel={() => setIsActionPanelVisible(!isActionPanelVisible)}
        />
      </div>

      {/* 모달들 */}
      <StepHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        currentStep={currentStep}
      />

      <ProjectReferenceModal
        isOpen={showProjectReference}
        onClose={() => setShowProjectReference(false)}
        story={story}
        characterList={characterList}
        finalScenario={finalScenario}
        generatedProjectData={generatedProjectData}
        generatedCharacters={generatedCharacters}
        generatedBackgrounds={generatedBackgrounds}
        generatedSettingCuts={generatedSettingCuts}
        generatedTextCards={generatedTextCards}
        generatedVideos={generatedVideos}
        generatedCharacterImages={generatedCharacterImages}
        generatedVideoBackgrounds={generatedVideoBackgrounds}
        videoSettings={videoSettings}
        onDeleteItem={handleDeleteFromState}
        onDeleteById={handleDeleteById}
        onGenerateJsonCard={handleGenerateJsonCard}
        onEditItem={(type, index, data) => {
          // 데이터 수정 처리
          if (type === 'koreanCards') {
            // 한글 카드 수정
            setGeneratedProjectData((prev: any) => ({
              ...prev,
              koreanCards: data
            }));
          } else if (type === 'englishCards') {
            // 영어 카드 수정
            setGeneratedProjectData((prev: any) => ({
              ...prev,
              englishCards: data
            }));
          } else if (type === 'textCard') {
            // 텍스트 카드 수정
            const updatedCards = [...generatedTextCards];
            updatedCards[index] = data;
            setGeneratedTextCards(updatedCards);
          }
        }}
        episodes={[]}
        cutTextCardSelections={cutTextCardSelections}
        selectedCuts={selectedCuts}
        onProjectReset={handleProjectReset}
      />

      {/* 통합 참조 모달 */}
      <UnifiedReferenceModal
        isOpen={showUnifiedReference}
        onClose={() => setShowUnifiedReference(false)}
        title={referenceData.title}
        dataType={referenceData.type}
        data={referenceData.data}
        selectedAIProvider={referenceData.aiProvider || selectedAIProvider}
        onDeleteItem={(index) => {
          // 삭제 로직 구현
          const newData = [...referenceData.data];
          newData.splice(index, 1);
          setReferenceData({
            ...referenceData,
            data: newData
          });
          
          // 실제 데이터 상태도 업데이트
          handleDeleteFromState(referenceData.type, index);
        }}
        onUseInStep={(selectedData) => {
          // 선택된 데이터를 현재 단계에서 활용하는 로직
          console.log('선택된 데이터:', selectedData);
          setShowUnifiedReference(false);
        }}
        onCopyPrompt={(item) => {
          // 프롬프트 복사 로직
          const promptText = JSON.stringify(item, null, 2);
          navigator.clipboard.writeText(promptText);
        }}
        onEditItem={(index, item) => {
          // 텍스트 카드 수정 로직
          if (referenceData.type === 'textCards') {
            // VideoGenerationStep의 편집 모달을 직접 열기
            // videoHandlers를 통해 VideoGenerationStep의 handleEditCard 호출
            if (videoHandlers?.handleEditCard) {
              videoHandlers.handleEditCard(item.id, item.generatedText || item);
            }
          }
        }}
      />
      
    </div>
  );
};
