import React, { useState } from 'react';
import { ProjectOverviewStep } from '../steps/ProjectOverviewStep';
import { ImageGenerationStep } from '../steps/ImageGenerationStep';
import { NanoBananaImageStep } from '../steps/NanoBananaImageStep';
import { VideoGenerationStep } from '../steps/VideoGenerationStep';
import ProgressTracker from '../common/ProgressTracker';
import { FormattedText, FormattedJSON } from '../common/FormattedText';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';
import { safeBase64ToObject } from '../../utils/base64Utils';

// 텍스트 카드 아이템 컴포넌트
interface TextCardItemProps {
  card: any;
  index: number;
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<any[]>>;
  videoHandlers: any;
}

const TextCardItem: React.FC<TextCardItemProps> = ({
  card,
  index,
  selectedTextCards,
  setSelectedTextCards,
  setGeneratedTextCards,
  videoHandlers
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(card.generatedText);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedText(card.generatedText);
  };
  
  const handleSave = () => {
    setGeneratedTextCards(prev => 
      prev.map(c => 
        c.id === card.id 
          ? { ...c, generatedText: editedText }
          : c
      )
    );
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(card.generatedText);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-600">컷 {index + 1}</span>
          {(card.generatedText.split('\n').length > 2 || card.generatedText.length > 150) && (
            <button
              onClick={handleToggleExpand}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
            >
              {isExpanded ? '감추기' : '더보기'}
            </button>
          )}
        </div>
        <input
          type="checkbox"
          checked={selectedTextCards.has(card.id)}
          onChange={() => {
            const newSet = new Set(selectedTextCards);
            if (newSet.has(card.id)) {
              newSet.delete(card.id);
            } else {
              newSet.add(card.id);
            }
            setSelectedTextCards(newSet);
          }}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
      <div className="mb-4">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className={`text-sm text-gray-700 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
            <FormattedText 
              text={card.generatedText}
              className=""
            />
          </div>
        )}
      </div>
      <div className="flex gap-2 w-full">
        {isEditing ? (
          <>
            <button 
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              저장
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleEdit}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              수정
            </button>
            <button 
              onClick={() => videoHandlers.handleSaveTextCard?.(card.id)}
              className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              다운로드
            </button>
            <button 
              onClick={() => videoHandlers.handleDeleteTextCard?.(card.id)}
              className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface MainLayoutProps {
  currentStep: string;
  // 프로젝트 개요 props
  story: string;
  setStory: (story: string) => void;
  characterList: any[];
  setCharacterList: (list: any[]) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (prompt: string) => void;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  finalScenario: string;
  setFinalScenario: (scenario: string) => void;
  generatedProjectData: any;
  setGeneratedProjectData: (data: any) => void;
  // 이미지 생성 props
  generatedCharacters: any[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<any[]>>;
  generatedBackgrounds: any[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<any[]>>;
  generatedSettingCuts: any[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<any[]>>;
  // 고급 이미지 생성 props
  generatedAdvancedImages: any[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<any[]>>;
  // 영상 생성 props
  generatedTextCards: any[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<any[]>>;
  generatedCharacterImages: any[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<any[]>>;
  generatedVideoBackgrounds: any[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<any[]>>;
  generatedVideos: any[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<any[]>>;
  // 영상 생성 선택 상태
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  // 핸들러들
  projectHandlers: any;
  imageHandlers: any;
  videoHandlers: any;
  // UI 상태
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  currentStep,
  story, setStory,
  characterList, setCharacterList,
  scenarioPrompt, setScenarioPrompt,
  storySummary, setStorySummary,
  finalScenario, setFinalScenario,
  generatedProjectData, setGeneratedProjectData,
  generatedCharacters, setGeneratedCharacters,
  generatedBackgrounds, setGeneratedBackgrounds,
  generatedSettingCuts, setGeneratedSettingCuts,
  // 고급 이미지 생성 props
  generatedAdvancedImages, setGeneratedAdvancedImages,
  generatedTextCards, setGeneratedTextCards,
  generatedCharacterImages, setGeneratedCharacterImages,
  generatedVideoBackgrounds, setGeneratedVideoBackgrounds,
  generatedVideos, setGeneratedVideos,
  selectedTextCards, setSelectedTextCards,
  selectedCharacterImages, setSelectedCharacterImages,
  selectedVideoBackgrounds, setSelectedVideoBackgrounds,
  projectHandlers, imageHandlers, videoHandlers,
  showTextResults, setShowTextResults
}) => {
  const { addNotification } = useUIStore();
  const [finalPromptCards, setFinalPromptCards] = useState<{
    korean: {[key: string]: string};
    english: {[key: string]: string};
  }>({
    korean: {},
    english: {}
  });
  const [englishPromptResults] = useState<{[key: string]: string}>({});
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  const [editingText, setEditingText] = useState<{[key: string]: boolean}>({});
  const [savedTexts, setSavedTexts] = useState<{[key: string]: boolean}>({});

  // 최종 프롬프트 JSON 카드 생성
  const handleGenerateFinalPromptCards = async () => {
    try {
      setIsGeneratingCards(true);
      
      const promptData = {
        story: story,
        characters: characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        scenario: scenarioPrompt,
        dialogue: '', // 대사 데이터가 있다면 추가
        finalScenario: finalScenario
      };

      // 국문 프롬프트 카드 생성
      const koreanCards = {
        '스토리': promptData.story,
        '캐릭터': promptData.characters,
        '시각및설정': promptData.scenario, // 시각 및 설정은 scenarioPrompt 사용
        '시나리오': promptData.finalScenario,
        '대사': promptData.dialogue,
        '영상설정프롬프트': promptData.scenario
      };

      // 영문 프롬프트 카드 생성 (기존 영문 프롬프트 결과 사용)
      const englishCards = {
        'Story': englishPromptResults.story || `[English] ${promptData.story}`,
        'Characters': englishPromptResults.characters || `[English] ${promptData.characters}`,
        'Visual Settings': englishPromptResults.visualSettings || `[English] ${promptData.scenario}`,
        'Scenario': englishPromptResults.scenario || `[English] ${promptData.finalScenario}`,
        'Dialogue': englishPromptResults.dialogue || `[English] ${promptData.dialogue}`,
        'Visual Settings Prompt': englishPromptResults.visualSettingsPrompt || `[English] ${promptData.scenario}`
      };

      setFinalPromptCards({
        korean: koreanCards,
        english: englishCards
      });

      addNotification({
        type: 'success',
        title: '프롬프트 카드 생성 완료',
        message: '국문/영문 프롬프트 카드가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '프롬프트 카드 생성 실패',
        message: '프롬프트 카드 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingCards(false);
    }
  };

  // 텍스트 편집 함수
  const handleEditText = (type: string) => {
    setEditingText(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: `${type} 편집 모드가 활성화되었습니다.`,
    });
  };

  // 텍스트 저장 함수
  const handleSaveText = (type: string) => {
    setSavedTexts(prev => ({
      ...prev,
      [type]: true
    }));
    setEditingText(prev => ({
      ...prev,
      [type]: false
    }));
    
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: `${type}이 저장되었습니다.`,
    });
  };


  // 텍스트 내용 가져오기
  const getTextContent = (type: string): string => {
    switch (type) {
      case 'story': return story;
      case 'scenario': return scenarioPrompt;
      case 'dialogue': return ''; // 대사 데이터가 있다면 추가
      case 'storySummary': return storySummary;
      case 'finalScenario': return finalScenario;
      case 'review': return generatedProjectData ? JSON.stringify(generatedProjectData.reviewResult, null, 2) : '';
      default: return '';
    }
  };

  // 텍스트 내용 업데이트
  const updateTextContent = (type: string, content: string) => {
    switch (type) {
      case 'story': setStory(content); break;
      case 'scenario': setScenarioPrompt(content); break;
      case 'dialogue': /* 대사 업데이트 */ break;
      case 'storySummary': setStorySummary(content); break;
      case 'finalScenario': setFinalScenario(content); break;
      case 'review': 
        if (generatedProjectData) {
          setGeneratedProjectData({
            ...generatedProjectData,
            reviewResult: JSON.parse(content)
          });
        }
        break;
    }
  };
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 사이드바 - 입력 및 제어 */}
      <aside className="w-80 bg-white border-r p-4 overflow-y-auto flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{currentStep}</h2>
        
        {currentStep === "프로젝트 개요" && (
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
            onNext={projectHandlers.handleNextStep}
          />
        )}
        
        {currentStep === "이미지 생성" && (
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
            onNext={projectHandlers.handleNextStep}
          />
        )}

        {currentStep === "이미지 생성/나노 바나나" && (
          <NanoBananaImageStep
            generatedCharacters={generatedCharacters}
            setGeneratedCharacters={setGeneratedCharacters}
            generatedBackgrounds={generatedBackgrounds}
            setGeneratedBackgrounds={setGeneratedBackgrounds}
            generatedSettingCuts={generatedSettingCuts}
            setGeneratedSettingCuts={setGeneratedSettingCuts}
            generatedAdvancedImages={generatedAdvancedImages}
            setGeneratedAdvancedImages={setGeneratedAdvancedImages}
            generatedProjectData={generatedProjectData}
            showTextResults={showTextResults}
            setShowTextResults={setShowTextResults}
            story={story}
            characterList={characterList}
            scenarioPrompt={scenarioPrompt}
            storySummary={storySummary}
            finalScenario={finalScenario}
            onNext={projectHandlers.handleNextStep}
          />
        )}
        
        {currentStep === "영상 생성" && (
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
            characterPrompt=""
            scenarioPrompt={scenarioPrompt}
            storySummary={storySummary}
            finalScenario={finalScenario}
            generatedProjectData={generatedProjectData}
            showTextResults={showTextResults}
            setShowTextResults={setShowTextResults}
            story={story}
            characterList={characterList}
            onNext={() => {}}
          />
        )}
        </div>
        
        {/* 프로젝트 참고 토글 버튼 - 왼쪽 하단 */}
        {(currentStep === "이미지 생성" || currentStep === "이미지 생성/나노 바나나" || currentStep === "영상 생성") && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowTextResults(!showTextResults)}
              className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
              <span className="text-lg">📋</span>
              <span className="text-sm font-medium">
                생성 프로젝트 참고
              </span>
              <span className="text-xs text-blue-600">
                {showTextResults ? '[감추기]' : '[보이기]'}
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 진행률 표시 */}
          <ProgressTracker 
            currentStep={currentStep}
            steps={[
              { id: '프로젝트 개요', title: '프로젝트 개요', description: '스토리 및 캐릭터 설정', status: currentStep === '프로젝트 개요' ? 'current' : 'completed' },
              { id: '이미지 생성', title: '이미지 생성', description: '캐릭터 및 배경 이미지 생성', status: currentStep === '이미지 생성' ? 'current' : 'pending' },
              { id: '영상 생성', title: '영상 생성', description: '컷별 영상 생성', status: currentStep === '영상 생성' ? 'current' : 'pending' }
            ]}
          />
          
          <h2 className="text-xl font-semibold mb-6 text-gray-800 mt-6">생성 결과</h2>
          
          {currentStep === "프로젝트 개요" && (
            <div className="space-y-6">
              {/* 영상 설정 프롬프트 결과 (1~3번 입력 기반) */}
              {scenarioPrompt && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      설정용 영상 설정 프롬프트
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditText('scenario')}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={savedTexts.scenario}
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleSaveText('scenario')}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={savedTexts.scenario}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                  {editingText.scenario ? (
                    <textarea
                      value={scenarioPrompt}
                      onChange={(e) => setScenarioPrompt(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={8}
                    />
                  ) : (
                    <div className="bg-white p-4 rounded border border-blue-100">
                      <FormattedText 
                        text={scenarioPrompt}
                        className="text-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* AI 시나리오 결과 (4~5번 입력 + 영상 설정 프롬프트 기반) */}
              {finalScenario && (
                <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-800 flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      국문 시나리오
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditText('finalScenario')}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={savedTexts.finalScenario}
                      >
                        수정
                      </button>
                      {editingText.finalScenario ? (
                        <>
                          <button 
                            onClick={() => {
                              setEditingText(prev => ({ ...prev, finalScenario: false }));
                            }}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            취소
                          </button>
                          <button 
                            onClick={() => handleSaveText('finalScenario')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleSaveText('finalScenario')}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          disabled={savedTexts.finalScenario}
                        >
                          저장
                        </button>
                      )}
                    </div>
                  </div>
                  {editingText.finalScenario ? (
                    <textarea
                      value={finalScenario}
                      onChange={(e) => setFinalScenario(e.target.value)}
                      className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={10}
                    />
                  ) : (
                    <div className="bg-white p-4 rounded border border-green-100">
                      <FormattedText 
                        text={finalScenario}
                        className="text-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 프로젝트 개요 저장 결과 - 국문/영문 카드 */}
              {generatedProjectData && (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      프로젝트 개요 저장 결과
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditText('review')}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                        disabled={savedTexts.review}
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleSaveText('review')}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        disabled={savedTexts.review}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                  {editingText.review ? (
                    <textarea
                      value={getTextContent('review')}
                      onChange={(e) => updateTextContent('review', e.target.value)}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={8}
                    />
                  ) : (
                    <div className="bg-white p-4 rounded border border-purple-100">
                      <FormattedJSON 
                        data={generatedProjectData.reviewResult}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {currentStep === "이미지 생성" && (
            <div className="space-y-6">
              {/* 캐릭터 이미지 결과 카드 */}
              {generatedCharacters.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      생성된 캐릭터
                      <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {generatedCharacters.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => imageHandlers.handleRegenerateAllCharacters?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => imageHandlers.handleSaveAllCharacters?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedCharacters.map((character, index) => (
                      <div key={character.id} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {character.image && character.image.startsWith('data:image') ? (
                            <img 
                              src={character.image} 
                              alt={`캐릭터 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🖼️</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">캐릭터 {index + 1}</h4>
                        <FormattedText 
                          text={character.description}
                          className="text-sm text-gray-600 mb-3 line-clamp-3"
                        />
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => imageHandlers.handleRegenerateCharacter?.(character.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleSaveCharacter?.(character.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleDeleteCharacter?.(character.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 배경 이미지 결과 카드 */}
              {generatedBackgrounds.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-800 flex items-center gap-2">
                      <span className="text-xl">🌄</span>
                      생성된 배경
                      <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {generatedBackgrounds.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => imageHandlers.handleRegenerateAllBackgrounds?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => imageHandlers.handleSaveAllBackgrounds?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedBackgrounds.map((background, index) => (
                      <div key={background.id} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {background.image && background.image.startsWith('data:image') ? (
                            <img 
                              src={background.image} 
                              alt={`배경 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🖼️</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">배경 {index + 1}</h4>
                        <FormattedText 
                          text={background.description}
                          className="text-sm text-gray-600 mb-3 line-clamp-3"
                        />
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => imageHandlers.handleRegenerateBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleSaveBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleDeleteBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 설정 컷 이미지 결과 카드 */}
              {generatedSettingCuts.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      생성된 설정 컷
                      <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        {generatedSettingCuts.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => imageHandlers.handleRegenerateAllSettingCuts?.()}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => imageHandlers.handleSaveAllSettingCuts?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSettingCuts.map((cut, index) => (
                      <div key={cut.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {cut.image && cut.image.startsWith('data:image') ? (
                            <img 
                              src={cut.image} 
                              alt={`설정 컷 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🖼️</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">설정 컷 {index + 1}</h4>
                        <FormattedText 
                          text={cut.description}
                          className="text-sm text-gray-600 mb-3 line-clamp-3"
                        />
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => imageHandlers.handleRegenerateSettingCut?.(cut.id)}
                            className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleSaveSettingCut?.(cut.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => imageHandlers.handleDeleteSettingCut?.(cut.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentStep === "영상 생성" && (
            <div className="space-y-6">
              {/* 텍스트 카드 결과 */}
              {generatedTextCards.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2">
                      <span className="text-xl">📝</span>
                      생성된 텍스트 카드
                      <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {generatedTextCards.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => videoHandlers.handleRegenerateAllTextCards?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => videoHandlers.handleSaveAllTextCards?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {generatedTextCards.map((card, index) => (
                      <TextCardItem
                        key={card.id}
                        card={card}
                        index={index}
                        selectedTextCards={selectedTextCards}
                        setSelectedTextCards={setSelectedTextCards}
                        setGeneratedTextCards={setGeneratedTextCards}
                        videoHandlers={videoHandlers}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 캐릭터 이미지 결과 */}
              {generatedCharacterImages.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-800 flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      생성된 캐릭터 이미지
                      <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {generatedCharacterImages.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => videoHandlers.handleRegenerateAllCharacterImages?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => videoHandlers.handleSaveAllCharacterImages?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedCharacterImages.map((image, index) => (
                      <div key={image.id} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-green-600">캐릭터 {index + 1}</span>
                          <input
                            type="checkbox"
                            checked={selectedCharacterImages.has(image.id)}
                            onChange={() => {
                              const newSet = new Set(selectedCharacterImages);
                              if (newSet.has(image.id)) {
                                newSet.delete(image.id);
                              } else {
                                newSet.add(image.id);
                              }
                              setSelectedCharacterImages(newSet);
                            }}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {image.image && image.image.startsWith('data:image') ? (
                            <img 
                              src={image.image} 
                              alt={`캐릭터 이미지 ${image.id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">{image.image}</span>
                          )}
                        </div>
                        <FormattedText 
                          text={image.input}
                          className="text-sm text-gray-700 mb-3 line-clamp-2"
                        />
                        <div className="flex gap-1">
                          <button 
                            onClick={() => videoHandlers.handleRegenerateCharacterImage?.(image.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => videoHandlers.handleSaveCharacterImage?.(image.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => videoHandlers.handleDeleteCharacterImage?.(image.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 영상 배경 결과 */}
              {generatedVideoBackgrounds.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                      <span className="text-xl">🏞️</span>
                      생성된 영상 배경
                      <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        {generatedVideoBackgrounds.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => videoHandlers.handleRegenerateAllVideoBackgrounds?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => videoHandlers.handleSaveAllVideoBackgrounds?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedVideoBackgrounds.map((background, index) => (
                      <div key={background.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-purple-600">배경 {index + 1}</span>
                          <input
                            type="checkbox"
                            checked={selectedVideoBackgrounds.has(background.id)}
                            onChange={() => {
                              const newSet = new Set(selectedVideoBackgrounds);
                              if (newSet.has(background.id)) {
                                newSet.delete(background.id);
                              } else {
                                newSet.add(background.id);
                              }
                              setSelectedVideoBackgrounds(newSet);
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {background.image && background.image.startsWith('data:image') ? (
                            <img 
                              src={background.image} 
                              alt={`영상 배경 ${background.id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-400">{background.image}</span>
                          )}
                        </div>
                        <FormattedText 
                          text={background.input}
                          className="text-sm text-gray-700 mb-3 line-clamp-2"
                        />
                        <div className="flex gap-1">
                          <button 
                            onClick={() => videoHandlers.handleRegenerateVideoBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => videoHandlers.handleSaveVideoBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                          <button 
                            onClick={() => videoHandlers.handleDeleteVideoBackground?.(background.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 영상 결과 */}
              {generatedVideos.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">생성된 영상</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => videoHandlers.handleRegenerateAllVideos?.()}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        전체 재생성
                      </button>
                      <button 
                        onClick={() => videoHandlers.handleSaveAllVideos?.()}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        전체 저장
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedVideos.map((video, index) => {
                      // 스토리보드 데이터 파싱 (안전한 Base64 디코딩)
                      let storyboardData = null;
                      if (video.video && video.video.startsWith('data:application/json;base64,')) {
                        try {
                          const base64Data = video.video.split(',')[1];
                          storyboardData = safeBase64ToObject(base64Data);
                        } catch (e) {
                          console.error('스토리보드 데이터 파싱 오류:', e);
                        }
                      }

                      return (
                        <div key={video.id} className="border rounded p-4">
                          <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border-2 border-dashed border-blue-300">
                            {storyboardData ? (
                              <div className="text-center p-4">
                                <div className="text-4xl mb-2">🎬</div>
                                <div className="text-lg font-medium text-blue-800 mb-1">영상 스토리보드</div>
                                <div className="text-sm text-blue-600">상세한 제작 가이드가 생성되었습니다</div>
                              </div>
                            ) : video.video && video.video.startsWith('http') ? (
                              <video 
                                src={video.video} 
                                controls
                                className="w-full h-full object-cover"
                                preload="metadata"
                              >
                                브라우저가 비디오를 지원하지 않습니다.
                              </video>
                            ) : (
                              <span className="text-gray-400">{video.video}</span>
                            )}
                          </div>
                          <h4 className="font-medium mb-2">
                            {storyboardData ? `스토리보드 ${index + 1}` : `영상 ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">{new Date(video.timestamp).toLocaleString()}</p>
                          
                          {storyboardData && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm text-blue-800 font-medium mb-2">📋 스토리보드 미리보기</div>
                              <div className="text-xs text-blue-700 line-clamp-3">
                                {storyboardData.storyboard}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => videoHandlers.handleRegenerateVideo?.(video.id)}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              재생성
                            </button>
                            <button 
                              onClick={() => videoHandlers.handleSaveVideo?.(video.id)}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              저장
                            </button>
                            <button 
                              onClick={() => videoHandlers.handleDeleteVideo?.(video.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 나노 바나나 이미지 생성 결과 - 오른쪽 본문 */}
          {currentStep === "이미지 생성/나노 바나나" && (
            <div className="space-y-6">
              {/* 고급 이미지 항목 */}
              {generatedAdvancedImages.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      고급 이미지 항목
                      <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        {generatedAdvancedImages.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          generatedAdvancedImages.forEach((image) => {
                            const link = document.createElement('a');
                            link.href = image.image;
                            link.download = `advanced_image_${image.id}.png`;
                            link.click();
                          });
                        }}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        전체 다운로드
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedAdvancedImages.map((image, index) => (
                      <div key={image.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {image.image && image.image.startsWith('data:image') ? (
                            <img 
                              src={image.image} 
                              alt={`고급 이미지 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🎨</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">고급 이미지 {index + 1}</h4>
                        <FormattedText 
                          text={image.description}
                          className="text-sm text-gray-600 mb-3"
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = image.image;
                              link.download = `advanced_image_${image.id}.png`;
                              link.click();
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            다운로드
                          </button>
                          <button 
                            onClick={() => {
                              setGeneratedAdvancedImages(prev => prev.filter(img => img.id !== image.id));
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* 나노 바나나 캐릭터 이미지 결과 카드 */}
              {generatedCharacters.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-yellow-800 flex items-center gap-2">
                      <span className="text-xl">👤</span>
                      나노 바나나 캐릭터 이미지
                      <span className="text-sm bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
                        {generatedCharacters.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          generatedCharacters.forEach((character) => {
                            const link = document.createElement('a');
                            link.href = character.image;
                            link.download = `nano_character_${character.id}.png`;
                            link.click();
                          });
                        }}
                        className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                      >
                        전체 다운로드
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedCharacters.map((character, index) => (
                      <div key={character.id} className="bg-white border border-yellow-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {character.image && character.image.startsWith('data:image') ? (
                            <img 
                              src={character.image} 
                              alt={`나노 바나나 캐릭터 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🍌</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">캐릭터 {index + 1}</h4>
                        <FormattedText 
                          text={character.description}
                          className="text-sm text-gray-600 mb-3"
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = character.image;
                              link.download = `nano_character_${character.id}.png`;
                              link.click();
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            다운로드
                          </button>
                          <button 
                            onClick={() => {
                              // 재생성 기능 (추후 구현)
                              console.log('재생성:', character.id);
                            }}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => {
                              setGeneratedCharacters(prev => prev.filter(c => c.id !== character.id));
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 나노 바나나 배경 이미지 결과 카드 */}
              {generatedBackgrounds.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-green-800 flex items-center gap-2">
                      <span className="text-xl">🏞️</span>
                      나노 바나나 배경 이미지
                      <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {generatedBackgrounds.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          generatedBackgrounds.forEach((background) => {
                            const link = document.createElement('a');
                            link.href = background.image;
                            link.download = `nano_background_${background.id}.png`;
                            link.click();
                          });
                        }}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        전체 다운로드
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedBackgrounds.map((background, index) => (
                      <div key={background.id} className="bg-white border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {background.image && background.image.startsWith('data:image') ? (
                            <img 
                              src={background.image} 
                              alt={`나노 바나나 배경 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🍌</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">배경 {index + 1}</h4>
                        <FormattedText 
                          text={background.description}
                          className="text-sm text-gray-600 mb-3"
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = background.image;
                              link.download = `nano_background_${background.id}.png`;
                              link.click();
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            다운로드
                          </button>
                          <button 
                            onClick={() => {
                              console.log('재생성:', background.id);
                            }}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => {
                              setGeneratedBackgrounds(prev => prev.filter(b => b.id !== background.id));
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 나노 바나나 설정 컷 이미지 결과 카드 */}
              {generatedSettingCuts.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      나노 바나나 설정 컷 이미지
                      <span className="text-sm bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        {generatedSettingCuts.length}개
                      </span>
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          generatedSettingCuts.forEach((settingCut) => {
                            const link = document.createElement('a');
                            link.href = settingCut.image;
                            link.download = `nano_setting_cut_${settingCut.id}.png`;
                            link.click();
                          });
                        }}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        전체 다운로드
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedSettingCuts.map((settingCut, index) => (
                      <div key={settingCut.id} className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {settingCut.image && settingCut.image.startsWith('data:image') ? (
                            <img 
                              src={settingCut.image} 
                              alt={`나노 바나나 설정 컷 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center">
                              <div className="text-4xl mb-2">🍌</div>
                              <div className="text-sm">이미지 로딩 중...</div>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium mb-2 text-gray-800">설정 컷 {index + 1}</h4>
                        <FormattedText 
                          text={settingCut.description}
                          className="text-sm text-gray-600 mb-3"
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = settingCut.image;
                              link.download = `nano_setting_cut_${settingCut.id}.png`;
                              link.click();
                            }}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            다운로드
                          </button>
                          <button 
                            onClick={() => {
                              console.log('재생성:', settingCut.id);
                            }}
                            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            재생성
                          </button>
                          <button 
                            onClick={() => {
                              setGeneratedSettingCuts(prev => prev.filter(s => s.id !== settingCut.id));
                            }}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 프로젝트 참고 섹션 - 오른쪽 본문 하단 */}
          {(currentStep === "이미지 생성" || currentStep === "이미지 생성/나노 바나나" || currentStep === "영상 생성") && showTextResults && (
            <div className="mt-8 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  생성 프로젝트 참고
                </h2>
                
                <div className="space-y-4">
                  {/* 스토리 정보 */}
                  {story && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">📖 스토리</h3>
                      <FormattedText 
                        text={story}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                  
                  {/* 캐릭터 정보 */}
                  {characterList.length > 0 && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">👥 캐릭터</h3>
                      <div className="space-y-2">
                        {characterList.map((char, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-3">
                            <div className="font-medium text-gray-800">{char.name}</div>
                            <div className="text-sm text-gray-600">{char.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 시나리오 정보 */}
                  {finalScenario && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">🎬 시나리오</h3>
                      <FormattedText 
                        text={finalScenario}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                  
                  {/* 영상 설정 프롬프트 */}
                  {scenarioPrompt && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">🎨 영상 설정</h3>
                      <FormattedText 
                        text={scenarioPrompt}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 최종 프롬프트 JSON 카드 - 오른쪽 메인 메뉴 하단 */}
          {currentStep === "프로젝트 개요" && finalScenario && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">최종 프롬프트 카드</h2>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleGenerateFinalPromptCards}
                  disabled={isGeneratingCards}
                >
                  {isGeneratingCards ? '생성 중...' : 'JSON 카드 생성'}
                </Button>
              </div>
              
              {/* 국문 프롬프트 카드 */}
              {Object.keys(finalPromptCards.korean).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🇰🇷</span>
                    국문 프롬프트
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(finalPromptCards.korean).map(([title, content]) => {
                      const isFullWidth = ['스토리', '시나리오', '대사', '시각및설정', '영상설정프롬프트'].includes(title);
                      return (
                        <div key={title} className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${isFullWidth ? 'w-full' : ''}`}>
                          <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">🇰🇷</span>
                            [{title}] 국문 프롬프트
                          </h4>
                          <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 영문 프롬프트 카드 */}
              {Object.keys(finalPromptCards.english).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🇺🇸</span>
                    영문 프롬프트
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(finalPromptCards.english).map(([title, content]) => {
                      const isFullWidth = ['Story', 'Scenario', 'Dialogue', 'Visual Settings', 'Visual Settings Prompt'].includes(title);
                      return (
                        <div key={title} className={`bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm ${isFullWidth ? 'w-full' : ''}`}>
                          <h4 className="text-lg font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <span className="text-xl">🇺🇸</span>
                            [{title}] 영문 프롬프트
                          </h4>
                          <div className="bg-white p-4 rounded border border-blue-100">
                            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
