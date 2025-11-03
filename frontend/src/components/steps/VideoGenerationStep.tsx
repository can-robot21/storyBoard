import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import Button from '../common/Button';
import { EpisodeStructureManager } from '../videoGeneration/EpisodeStructureManager';
import { TextCardGenerator } from '../videoGeneration/TextCardGenerator';
import { ImageGenerator } from '../videoGeneration/ImageGenerator';
import { VideoGenerator } from '../videoGeneration/VideoGenerator';
import FrameByFrameVideoGenerator from '../videoGeneration/FrameByFrameVideoGenerator';
import VideoGenerationModal from '../common/VideoGenerationModal';
import ResetWarningModal from '../common/ResetWarningModal';
import { useVideoGeneration } from '../../hooks/useVideoGeneration';
import { VideoGenerationStepProps } from '../../types/videoGeneration';
import { SceneTextCard, GeneratedVideo } from '../../types/videoGeneration';
import { Zap } from 'lucide-react';

export const VideoGenerationStep: React.FC<VideoGenerationStepProps> = ({
  generatedTextCards,
  setGeneratedTextCards,
  generatedCharacterImages,
  setGeneratedCharacterImages,
  generatedVideoBackgrounds,
  setGeneratedVideoBackgrounds,
  generatedVideos,
  setGeneratedVideos,
  selectedTextCards,
  setSelectedTextCards,
  selectedCharacterImages,
  setSelectedCharacterImages,
  selectedVideoBackgrounds,
  setSelectedVideoBackgrounds,
  cutTextCardSelections,
  selectedCuts,
  characterPrompt,
  scenarioPrompt,
  storySummary,
  setStorySummary,
  finalScenario,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  setStory,
  characterList,
  setCharacterList,
  generatedCharacters = [],
  generatedBackgrounds = [],
  generatedSettingCuts = [],
  generatedAdvancedImages = [],
  onNext,
  canProceedToNext,
  onEditCard,
  onSetEditHandler
}) => {
  // 프레임-프레임 모드 상태
  const [isFrameByFrameMode, setIsFrameByFrameMode] = useState(false);
  
  // 영상 생성 모달 상태
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const {
    commonInputsCompleted,
    episodes,
    setEpisodes,
    showEpisodeStructure,
    setShowEpisodeStructure,
    showHeadingInput,
    setShowHeadingInput,
    videoTitle,
    setVideoTitle,
    videoDescription,
    setVideoDescription,
    videoNotes,
    setVideoNotes,
    handleSaveHeadingInfo,
    handleExportData,
    handleImportData,
    handleClearAllData
  } = useVideoGeneration();

  // 씬 텍스트 카드 상태
  const [generatedSceneTextCards, setGeneratedSceneTextCards] = useState<SceneTextCard[]>([]);

  // 설정 컷 이미지 상태 (새로 추가)
  const [generatedSettingCutImages, setGeneratedSettingCutImages] = useState<any[]>([]);
  const [selectedSettingCutImages, setSelectedSettingCutImages] = useState<Set<number>>(new Set());

  // JSON 영문 카드 생성 상태 추적
  const [isEnglishJsonCardGenerated, setIsEnglishJsonCardGenerated] = useState(false);
  
  // 초기화 경고 모달 상태
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [pendingResetAction, setPendingResetAction] = useState<(() => void) | null>(null);

  // 프로젝트 참조 데이터 로드 및 JSON 영문 카드 생성 상태 확인
  useEffect(() => {
    const loadProjectReferenceData = () => {
      try {
        const savedData = localStorage.getItem('projectReferenceData');
        if (savedData) {
          const data = JSON.parse(savedData);
          // 프로젝트 참조 데이터가 있으면 사용할 수 있도록 준비
          console.log('프로젝트 참조 데이터 로드됨:', data);
        }
      } catch (error) {
        console.error('프로젝트 참조 데이터 로드 오류:', error);
      }
    };

    const checkEnglishJsonCardStatus = () => {
      // generatedProjectData에서 영문 카드가 있는지 확인
      if (generatedProjectData?.englishCards) {
        const hasEnglishCards = Object.keys(generatedProjectData.englishCards).length > 0;
        setIsEnglishJsonCardGenerated(hasEnglishCards);
        console.log('JSON 영문 카드 생성 상태:', hasEnglishCards);
      }
    };

    loadProjectReferenceData();
    checkEnglishJsonCardStatus();
  }, [generatedProjectData]);

  // 편집 핸들러 등록
  useEffect(() => {
    if (onSetEditHandler) {
      onSetEditHandler((cardId: number, currentText: string) => {
        // 편집 모달 열기 로직
        console.log('Edit card:', cardId, currentText);
      });
    }
  }, [onSetEditHandler]);

  // 다음 단계로 진행 가능 여부
  const canProceed = useMemo(() => {
    return generatedVideos.length > 0 && commonInputsCompleted;
  }, [generatedVideos.length, commonInputsCompleted]);

  // 초기화 경고 처리 함수들
  const handleResetWithWarning = useCallback((resetAction: () => void) => {
    if (isEnglishJsonCardGenerated) {
      setPendingResetAction(() => resetAction);
      setShowResetWarning(true);
    } else {
      resetAction();
    }
  }, [isEnglishJsonCardGenerated]);

  const handleConfirmReset = useCallback(() => {
    if (pendingResetAction) {
      pendingResetAction();
      // 모든 상태 초기화
      setGeneratedTextCards([]);
      setGeneratedCharacterImages([]);
      setGeneratedVideoBackgrounds([]);
      setGeneratedSettingCutImages([]);
      setSelectedSettingCutImages(new Set());
      setGeneratedSceneTextCards([]);
      setStorySummary('');
      setStory('');
      setCharacterList([]);
    }
    setShowResetWarning(false);
    setPendingResetAction(null);
  }, [pendingResetAction, setGeneratedTextCards, setGeneratedCharacterImages, setGeneratedVideoBackgrounds, setStorySummary, setStory, setCharacterList]);

  const handleCancelReset = useCallback(() => {
    setShowResetWarning(false);
    setPendingResetAction(null);
  }, []);

  // 데이터 저장/로드 핸들러
  const handleExport = useCallback(() => {
    handleExportData();
  }, [handleExportData]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleImportData(event);
  }, [handleImportData]);

  const handleClear = useCallback(() => {
    handleResetWithWarning(() => {
      handleClearAllData();
    });
  }, [handleResetWithWarning, handleClearAllData]);

  // 인라인 영상 생성 섹션 위치로 스크롤하기 위한 ref
  const generationSectionRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-6">
      {/* 이전 단계 연계 정보 표시 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
        <h4 className="text-sm font-semibold text-purple-800 mb-3">🔄 이전 단계 연계 현황</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* 프로젝트 개요 연계 */}
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-blue-800 mb-2">📋 프로젝트 개요</div>
            <div className="text-gray-700">
              {story && <div>✅ 스토리 입력됨</div>}
              {characterList.length > 0 && <div>✅ 캐릭터 {characterList.length}개</div>}
              {finalScenario && <div>✅ 시나리오 생성됨</div>}
            </div>
          </div>
          
          {/* TXT2IMG 연계 */}
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-green-800 mb-2">🎨 TXT2IMG</div>
            <div className="text-gray-700">
              {generatedCharacterImages.length > 0 && <div>✅ 캐릭터 이미지 {generatedCharacterImages.length}개</div>}
              {generatedVideoBackgrounds.length > 0 && <div>✅ 배경 이미지 {generatedVideoBackgrounds.length}개</div>}
            </div>
          </div>
          
          {/* IMG2IMG 연계 */}
          <div className="bg-white p-3 rounded border">
            <div className="font-medium text-yellow-800 mb-2">🍌 IMG2IMG</div>
            <div className="text-gray-700">
              <div>✅ 고급 이미지 생성 준비됨</div>
            </div>
          </div>
        </div>
      </div>

      {/* 헤딩 정보 입력 */}
      <div className={`border rounded-lg p-4 ${isEnglishJsonCardGenerated ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-semibold ${isEnglishJsonCardGenerated ? 'text-gray-500' : 'text-gray-800'}`}>
            📝 헤딩 정보
            {isEnglishJsonCardGenerated && <span className="ml-2 text-xs text-red-500">(비활성화됨)</span>}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !isEnglishJsonCardGenerated && setShowHeadingInput(!showHeadingInput)}
              disabled={isEnglishJsonCardGenerated}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                isEnglishJsonCardGenerated 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {showHeadingInput ? '입력 숨기기' : '입력 보기-수정'}
            </button>
            {showHeadingInput && !isEnglishJsonCardGenerated && (
              <button
                onClick={handleSaveHeadingInfo}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            )}
          </div>
        </div>
        
        {showHeadingInput && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영상 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="영상 제목을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영상 설명
              </label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="영상에 대한 설명을 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                영상 노트
              </label>
              <textarea
                value={videoNotes}
                onChange={(e) => setVideoNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="영상 제작에 대한 노트를 입력하세요"
              />
            </div>
          </div>
        )}
        
        {!showHeadingInput && videoTitle && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">저장된 헤딩 정보</h4>
            <div className="space-y-1 text-sm">
              <div><strong>제목:</strong> {videoTitle}</div>
              {videoDescription && <div><strong>설명:</strong> {videoDescription}</div>}
              {videoNotes && <div><strong>노트:</strong> {videoNotes}</div>}
            </div>
          </div>
        )}
      </div>

      {/* 에피소드/씬 구조 관리 */}
      <EpisodeStructureManager
        episodes={episodes}
        setEpisodes={setEpisodes}
        showEpisodeStructure={showEpisodeStructure}
        setShowEpisodeStructure={setShowEpisodeStructure}
        story={story}
        characterList={characterList}
        storySummary={storySummary}
        onCommonInputsComplete={() => {
          // 공통 입력 완료 처리
        }}
        onCommonInputsReset={() => {
          // 공통 입력 초기화 처리
        }}
        onStoryChange={setStory}
        onCharacterListChange={setCharacterList}
        onStorySummaryChange={setStorySummary}
        // 헤딩 정보와 공통 입력 항목 데이터 전달
        videoTitle={videoTitle}
        videoDescription={videoDescription}
        videoNotes={videoNotes}
        finalScenario={finalScenario}
        generatedProjectData={generatedProjectData}
        // JSON 영문 카드 생성 상태 전달
        isDisabled={isEnglishJsonCardGenerated}
        // 초기화 경고 처리 전달
        onResetWithWarning={handleResetWithWarning}
      />

      {/* 텍스트 카드 생성 */}
      <TextCardGenerator
        generatedTextCards={generatedTextCards}
        setGeneratedTextCards={setGeneratedTextCards}
        selectedTextCards={selectedTextCards}
        setSelectedTextCards={setSelectedTextCards}
        cutTextCardSelections={cutTextCardSelections}
        story={story}
        characterList={characterList}
        finalScenario={finalScenario}
        generatedProjectData={generatedProjectData}
        showTextResults={showTextResults}
        setShowTextResults={setShowTextResults}
        onEditCard={onEditCard}
        // 추가된 props for auto generation
        episodes={episodes}
        generatedCharacterImages={generatedCharacterImages}
        generatedVideoBackgrounds={generatedVideoBackgrounds}
        videoTitle={videoTitle}
        videoDescription={videoDescription}
        videoNotes={videoNotes}
        // 씬 기반 텍스트 카드 관련 props
        generatedSceneTextCards={generatedSceneTextCards}
        setGeneratedSceneTextCards={setGeneratedSceneTextCards}
      />

      {/* 이미지 생성 */}
      <ImageGenerator
        generatedCharacterImages={generatedCharacterImages}
        setGeneratedCharacterImages={setGeneratedCharacterImages}
        generatedVideoBackgrounds={generatedVideoBackgrounds}
        setGeneratedVideoBackgrounds={setGeneratedVideoBackgrounds}
        selectedCharacterImages={selectedCharacterImages}
        setSelectedCharacterImages={setSelectedCharacterImages}
        selectedVideoBackgrounds={selectedVideoBackgrounds}
        setSelectedVideoBackgrounds={setSelectedVideoBackgrounds}
        story={story}
        characterList={characterList}
        finalScenario={finalScenario}
        // 프로젝트 참조 이미지들 (이미지 생성 단계에서 생성한 이미지들)
        projectReferenceCharacters={generatedCharacters}
        projectReferenceBackgrounds={generatedBackgrounds}
        projectReferenceSettingCuts={[...generatedSettingCuts, ...(generatedSettingCutImages || [])]}
        // 설정 컷 이미지 관련
        generatedSettingCutImages={generatedSettingCutImages}
        setGeneratedSettingCutImages={setGeneratedSettingCutImages}
        selectedSettingCutImages={selectedSettingCutImages}
        setSelectedSettingCutImages={setSelectedSettingCutImages}
      />

      {/* 영상 생성 */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎬 AI 교정 생성</h3>
        <div className="flex gap-4">
          <button
            onClick={() => {
              // 간단 모드(인라인)로 전환 후 해당 섹션으로 스크롤
              setIsFrameByFrameMode(false);
              setTimeout(() => {
                generationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 0);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            AI 교정 생성
          </button>
          <button
            onClick={() => setIsFrameByFrameMode(!isFrameByFrameMode)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isFrameByFrameMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            고급 프레임별 생성
          </button>
          <button
            onClick={() => setShowVideoModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            간단한 영상 생성
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          AI 교정 생성: Veo 3.0/3.1 모델로 최적화된 영상 생성 | 간단한 생성: 이미지→영상, 프레임별, 이미지 참조, 영상 확장 기능
        </p>
      </div>

      {/* 영상 생성 */}
      <div ref={generationSectionRef} />
      {isFrameByFrameMode ? (
        <FrameByFrameVideoGenerator
          onVideoGenerated={(videoUrl) => {
            const newVideo: GeneratedVideo = {
              id: Date.now(),
              video: videoUrl,
              videoUrl: videoUrl,
              timestamp: new Date().toISOString(),
              textCards: [],
              characterImages: [],
              backgrounds: [],
              projectTexts: [],
              aiReviewTexts: [],
              sceneCommonSettings: [],
              videoRatio: '16:9',
              thumbnail: '',
              duration: '8',
              type: 'general'
            };
            setGeneratedVideos(prev => [...prev, newVideo]);
          }}
        />
      ) : (
        <VideoGenerator
          generatedVideos={generatedVideos}
          setGeneratedVideos={setGeneratedVideos}
          generatedTextCards={generatedTextCards}
          setGeneratedTextCards={setGeneratedTextCards}
          generatedCharacterImages={generatedCharacterImages}
          generatedVideoBackgrounds={generatedVideoBackgrounds}
          selectedTextCards={selectedTextCards}
          setSelectedTextCards={setSelectedTextCards}
          selectedCharacterImages={selectedCharacterImages}
          selectedVideoBackgrounds={selectedVideoBackgrounds}
          setSelectedVideoBackgrounds={setSelectedVideoBackgrounds}
          selectedCuts={selectedCuts}
          story={story}
          characterList={characterList}
          finalScenario={finalScenario}
          generatedProjectData={generatedProjectData}
          generatedSceneTextCards={generatedSceneTextCards}
          episodes={episodes}
        />
      )}

      {/* 데이터 관리 */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💾 데이터 관리</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            데이터 내보내기
          </Button>
          
          <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">
            데이터 가져오기
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <Button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            모든 데이터 초기화
          </Button>
        </div>
      </div>

      {/* 다음 단계 진행 버튼 */}
      {canProceed && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">🎉 영상 생성 완료</h3>
              <p className="text-sm text-gray-600 mt-1">
                {generatedVideos.length}개의 영상이 생성되었습니다. 다음 단계로 진행하세요.
              </p>
            </div>
            <Button
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              onClick={onNext}
            >
              다음 단계로 →
            </Button>
          </div>
        </div>
      )}

      {/* 초기화 경고 모달 */}
      <ResetWarningModal
        isOpen={showResetWarning}
        onClose={handleCancelReset}
        onConfirm={handleConfirmReset}
        title="프로젝트 초기화 경고"
        message="JSON 영문 카드가 생성된 상태에서 수정하면 모든 프로젝트 텍스트가 초기화됩니다."
        confirmText="초기화하고 계속"
        cancelText="취소"
      />

      {/* 영상 생성 모달 */}
      <VideoGenerationModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onVideoGenerated={(videoUrl) => {
          const newVideo: GeneratedVideo = {
            id: Date.now(),
            video: videoUrl,
            videoUrl: videoUrl,
            timestamp: new Date().toISOString(),
            textCards: [],
            characterImages: [],
            backgrounds: [],
            projectTexts: [],
            aiReviewTexts: [],
            sceneCommonSettings: [],
            videoRatio: '16:9',
            thumbnail: '',
            duration: '8',
            type: 'general'
          };
          setGeneratedVideos(prev => [...prev, newVideo]);
        }}
        generatedImages={generatedCharacterImages.map(img => ({
          id: img.id.toString(),
          url: img.image,
          prompt: img.input
        }))}
      />
    </div>
  );
};