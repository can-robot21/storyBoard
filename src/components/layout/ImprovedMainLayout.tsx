import React, { useState } from 'react';
import { StepSettingsPanel } from './StepSettingsPanel';
import { ActionPanel } from './ActionPanel';
import { StepProgressPanel } from './StepProgressPanel';
import { StepHelpModal } from '../common/StepHelpModal';
import { ProjectReferenceModal } from '../common/ProjectReferenceModal';
import { UnifiedReferenceModal } from '../common/UnifiedReferenceModal';
import { APIUsageIndicator } from '../common/APIUsageIndicator';
import { ProjectOverviewStep } from '../steps/ProjectOverviewStep';
import { ImageGenerationStep } from '../steps/ImageGenerationStep';
import { NanoBananaImageStep } from '../steps/NanoBananaImageStep';
import { VideoGenerationStep } from '../steps/VideoGenerationStep';
import { useSettingsManager } from '../../hooks/useSettingsManager';

interface ImprovedMainLayoutProps {
  currentStep: string;
  setCurrentStep: (step: string) => void;
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
      if (['스토리', '영상 설정', '캐릭터 설정', '씬/컷 구성', '시나리오 추가 설정', '영상 시나리오', '씬별 컷별 프롬프트'].includes(cardType)) {
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

  // 상태에서 항목 삭제 핸들러
  const handleDeleteFromState = (type: string, index: number) => {
    switch (type) {
      case 'characterImages':
        setGeneratedCharacterImages((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'backgroundImages':
        setGeneratedVideoBackgrounds((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'settingCuts':
        setGeneratedSettingCuts((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'textCards':
        setGeneratedTextCards((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'videos':
        setGeneratedVideos((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'characters':
        setGeneratedCharacters((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      case 'backgrounds':
        setGeneratedBackgrounds((prev: any[]) => prev.filter((_, i) => i !== index));
        break;
      default:
        console.log('삭제할 수 없는 타입:', type);
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
      {/* 상단 설정 패널 */}
      {settings.ui.showStepSettings && (
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
      )}

      {/* 메인 콘텐츠 영역 */}
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

      {/* 하단 진행 상태 패널 */}
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
          selectedAIProvider={selectedAIProvider}
          onAISettingsClick={onAISettingsClick}
          hasAPIKey={hasAPIKey}
        />

      {/* 하단 액션 패널 */}
      <ActionPanel
        currentStep={currentStep}
        onHelpClick={() => setShowHelpModal(true)}
        onProjectReferenceClick={() => setShowProjectReference(true)}
        onExportClick={() => {/* 내보내기 로직 */}}
        onToggleSettings={() => updateUISettings({ showStepSettings: !settings.ui.showStepSettings })}
        projectHandlers={projectHandlers}
        imageHandlers={imageHandlers}
        videoHandlers={videoHandlers}
        stepStatus={stepStatus}
        canProceedToNext={canProceedToNext()}
      />

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
        onGenerateJsonCard={handleGenerateJsonCard}
        episodes={[]}
        cutTextCardSelections={cutTextCardSelections}
        selectedCuts={selectedCuts}
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
      
      {/* API 사용량 표시기 */}
      <APIUsageIndicator />
    </div>
  );
};
