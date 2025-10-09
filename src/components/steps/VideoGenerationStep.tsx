import React, { useEffect, useMemo, useCallback, useState } from 'react';
import Button from '../common/Button';
import { EpisodeStructureManager } from '../videoGeneration/EpisodeStructureManager';
import { TextCardGenerator } from '../videoGeneration/TextCardGenerator';
import { ImageGenerator } from '../videoGeneration/ImageGenerator';
import { VideoGenerator } from '../videoGeneration/VideoGenerator';
import { useVideoGeneration } from '../../hooks/useVideoGeneration';
import { VideoGenerationStepProps } from '../../types/videoGeneration';
import { SceneTextCard } from '../../types/videoGeneration';

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
  onNext,
  canProceedToNext,
  onEditCard,
  onSetEditHandler
}) => {
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

  // 프로젝트 참조 데이터 로드
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

    loadProjectReferenceData();
  }, []);

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

  // 데이터 저장/로드 핸들러
  const handleExport = useCallback(() => {
    handleExportData();
  }, [handleExportData]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleImportData(event);
  }, [handleImportData]);

  const handleClear = useCallback(() => {
    handleClearAllData();
  }, [handleClearAllData]);

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
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">📝 헤딩 정보</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeadingInput(!showHeadingInput)}
              className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
            >
              {showHeadingInput ? '입력 숨기기' : '입력 보기/수정'}
            </button>
            {showHeadingInput && (
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
        // 프로젝트 참조 이미지들
        projectReferenceCharacters={generatedCharacterImages}
        projectReferenceBackgrounds={generatedVideoBackgrounds}
        projectReferenceSettingCuts={generatedSettingCutImages}
        // 설정 컷 이미지 관련
        generatedSettingCutImages={generatedSettingCutImages}
        setGeneratedSettingCutImages={setGeneratedSettingCutImages}
        selectedSettingCutImages={selectedSettingCutImages}
        setSelectedSettingCutImages={setSelectedSettingCutImages}
      />

      {/* 영상 생성 */}
      <VideoGenerator
        generatedVideos={generatedVideos}
        setGeneratedVideos={setGeneratedVideos}
        generatedTextCards={generatedTextCards}
        generatedCharacterImages={generatedCharacterImages}
        generatedVideoBackgrounds={generatedVideoBackgrounds}
        selectedTextCards={selectedTextCards}
        selectedCharacterImages={selectedCharacterImages}
        selectedVideoBackgrounds={selectedVideoBackgrounds}
        selectedCuts={selectedCuts}
        story={story}
        characterList={characterList}
        finalScenario={finalScenario}
        generatedProjectData={generatedProjectData}
        generatedSceneTextCards={generatedSceneTextCards}
        episodes={episodes}
      />

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
    </div>
  );
};