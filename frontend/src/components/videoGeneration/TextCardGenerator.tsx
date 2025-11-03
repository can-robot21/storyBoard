import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedTextCard, SceneTextCard, CutTextCard } from '../../types/videoGeneration';
import { useUIStore } from '../../stores/uiStore';
import { ProjectReferenceModal } from '../common/ProjectReferenceModal';
import { Trash2 } from 'lucide-react';

interface TextCardGeneratorProps {
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<GeneratedTextCard[]>>;
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  cutTextCardSelections: {[key: string]: Set<number>};
  story: string;
  characterList: any[];
  finalScenario: string;
  generatedProjectData: any;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  onEditCard?: (cardId: number, currentText: string) => void;
  // 추가된 props for auto generation
  episodes?: any[];
  generatedCharacterImages?: any[];
  generatedVideoBackgrounds?: any[];
  videoTitle?: string;
  videoDescription?: string;
  videoNotes?: string;
  storySummary?: string;
  // 씬 기반 텍스트 카드 관련 props
  generatedSceneTextCards?: SceneTextCard[];
  setGeneratedSceneTextCards?: React.Dispatch<React.SetStateAction<SceneTextCard[]>>;
}

export const TextCardGenerator: React.FC<TextCardGeneratorProps> = React.memo(({
  generatedTextCards,
  setGeneratedTextCards,
  selectedTextCards,
  setSelectedTextCards,
  cutTextCardSelections,
  story,
  characterList,
  finalScenario,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  onEditCard,
  // 추가된 props
  episodes = [],
  generatedCharacterImages = [],
  generatedVideoBackgrounds = [],
  videoTitle = '',
  videoDescription = '',
  videoNotes = '',
  storySummary = '',
  // 씬 기반 텍스트 카드 관련 props
  generatedSceneTextCards = [],
  setGeneratedSceneTextCards
}) => {
  const { addNotification } = useUIStore();
  
  // 로그인 상태 확인 및 API 키 가져오기
  const getAPIKey = (): string => {
    try {
      if (typeof window === 'undefined') return '';
      
      // 현재 사용자 확인
      const currentUserRaw = localStorage.getItem('storyboard_current_user');
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      
      if (!currentUser) {
        console.log('🔑 API 키 로딩: 미설정 (로그인 필요)');
        return '';
      }
      
      // 사용자 API 키 확인
      if (currentUser?.apiKeys?.google) {
        return currentUser.apiKeys.google;
      }
      
      // 로컬 저장소에서 API 키 확인
      const localKeysRaw = localStorage.getItem('user_api_keys');
      if (localKeysRaw) {
        const localKeys = JSON.parse(localKeysRaw);
        if (localKeys?.google) {
          return localKeys.google;
        }
      }
      
      console.log('🔑 API 키 로딩: 미설정');
      return '';
    } catch (error) {
      console.error('API 키 로딩 오류:', error);
      return '';
    }
  };
  
  // 에피소드만 선택 모드 상태
  const [episodeOnlyMode, setEpisodeOnlyMode] = useState(false);
  const [selectedEpisodeForCards, setSelectedEpisodeForCards] = useState<any>(null);
  const [selectedCutsForEpisode, setSelectedCutsForEpisode] = useState<Set<string>>(new Set());

  // 에피소드 선택 시 모든 컷을 기본 선택
  const handleEpisodeSelectForCards = (episode: any) => {
    setSelectedEpisodeForCards(episode);
    
    // 모든 컷을 기본 선택
    const allCuts = new Set<string>();
    episode.scenes.forEach((scene: any) => {
      for (let i = 1; i <= (scene.cuts || 3); i++) {
        allCuts.add(`${scene.id}-${i}`);
      }
    });
    setSelectedCutsForEpisode(allCuts);
  };

  // 에피소드 컷 선택 토글
  const toggleEpisodeCutSelection = (sceneId: number, cutNumber: number) => {
    const cutKey = `${sceneId}-${cutNumber}`;
    setSelectedCutsForEpisode(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cutKey)) {
        newSet.delete(cutKey);
      } else {
        newSet.add(cutKey);
      }
      return newSet;
    });
  };
  
  // 상태 관리 (단순화)
  const [showSceneCards, setShowSceneCards] = useState(false);
  const [localSceneTextCards, setLocalSceneTextCards] = useState<SceneTextCard[]>([]);
  const [editingSceneId, setEditingSceneId] = useState<number | null>(null);
  const [editingSceneData, setEditingSceneData] = useState<{
    title: string;
    description: string;
    commonSettings: string;
  } | null>(null);
  const [editingCutId, setEditingCutId] = useState<number | null>(null);
  const [editingCutData, setEditingCutData] = useState<{
    text: string;
  } | null>(null);
  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);

  // localStorage에서 씬 텍스트 카드 로드 및 변경 감지
  useEffect(() => {
    const loadCards = () => {
      const savedCards = localStorage.getItem('generatedSceneTextCards');
      if (savedCards) {
        try {
          const parsedCards = JSON.parse(savedCards);
          setLocalSceneTextCards(parsedCards);
          if (setGeneratedSceneTextCards) {
            setGeneratedSceneTextCards(parsedCards);
          }
        } catch (error) {
          console.error('씬 텍스트 카드 로드 오류:', error);
        }
      }
    };

    // 초기 로드
    loadCards();

    // localStorage 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'generatedSceneTextCards') {
        loadCards();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 이벤트 기반으로 변경
    const handleTextCardUpdate = () => loadCards();
    window.addEventListener('textCardUpdated', handleTextCardUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('textCardUpdated', handleTextCardUpdate);
    };
  }, [setGeneratedSceneTextCards]);

  // 씬 텍스트 카드 컷 선택 토글
  const toggleCutSelection = useCallback((sceneId: number, cutId: number) => {
    const updatedCards = localSceneTextCards.map(sceneCard => 
      sceneCard.sceneId === sceneId 
        ? {
            ...sceneCard,
            cuts: sceneCard.cuts.map(cut => 
              cut.id === cutId 
                ? { ...cut, selected: !cut.selected }
                : cut
            )
          }
        : sceneCard
    );
    
    setLocalSceneTextCards(updatedCards);
    localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));
    
    if (setGeneratedSceneTextCards) {
      setGeneratedSceneTextCards(updatedCards);
    }
  }, [localSceneTextCards, setGeneratedSceneTextCards]);

  // 씬 텍스트 카드 삭제
  const deleteSceneTextCard = useCallback((sceneId: number) => {
    const updatedCards = localSceneTextCards.filter(card => card.sceneId !== sceneId);
    setLocalSceneTextCards(updatedCards);
    localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));
    
    if (setGeneratedSceneTextCards) {
      setGeneratedSceneTextCards(updatedCards);
    }
    
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '씬 텍스트 카드가 삭제되었습니다.',
    });
  }, [localSceneTextCards, setGeneratedSceneTextCards, addNotification]);

  // 일반 텍스트 카드 삭제
  const deleteTextCard = useCallback((cardId: number) => {
    setGeneratedTextCards(prev => prev.filter(card => card.id !== cardId));
    
    // 선택된 텍스트 카드에서도 제거
    setSelectedTextCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
    
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '텍스트 카드가 삭제되었습니다.',
    });
  }, [setGeneratedTextCards, setSelectedTextCards, addNotification]);

  // 선택된 텍스트 카드들 일괄 삭제
  const deleteSelectedTextCards = useCallback(() => {
    if (selectedTextCards.size === 0) {
      addNotification({
        type: 'warning',
        title: '선택된 카드 없음',
        message: '삭제할 텍스트 카드를 선택해주세요.',
      });
      return;
    }

    setGeneratedTextCards(prev => prev.filter(card => !selectedTextCards.has(card.id)));
    setSelectedTextCards(new Set());
    
    addNotification({
      type: 'success',
      title: '일괄 삭제 완료',
      message: `${selectedTextCards.size}개의 텍스트 카드가 삭제되었습니다.`,
    });
  }, [selectedTextCards, setGeneratedTextCards, setSelectedTextCards, addNotification]);

  // 씬 수정 시작
  const startEditingScene = useCallback((sceneCard: SceneTextCard) => {
    setEditingSceneId(sceneCard.sceneId);
    setEditingSceneData({
      title: sceneCard.sceneTitle,
      description: sceneCard.sceneDescription,
      commonSettings: sceneCard.sceneCommonSettings || ''
    });
  }, []);

  // 씬 수정 취소
  const cancelEditingScene = useCallback(() => {
    setEditingSceneId(null);
    setEditingSceneData(null);
  }, []);

  // 씬 수정 완료
  const saveEditingScene = useCallback(() => {
    if (!editingSceneId || !editingSceneData) return;

    const updatedCards = localSceneTextCards.map(card => 
      card.sceneId === editingSceneId 
        ? {
            ...card,
            sceneTitle: editingSceneData.title,
            sceneDescription: editingSceneData.description,
            sceneCommonSettings: editingSceneData.commonSettings
          }
        : card
    );

    setLocalSceneTextCards(updatedCards);
    localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));
    
    if (setGeneratedSceneTextCards) {
      setGeneratedSceneTextCards(updatedCards);
    }

    setEditingSceneId(null);
    setEditingSceneData(null);

    addNotification({
      type: 'success',
      title: '수정 완료',
      message: '씬 정보가 수정되었습니다.',
    });
  }, [editingSceneId, editingSceneData, localSceneTextCards, setGeneratedSceneTextCards, addNotification]);

  // 컷 수정 시작
  const startEditingCut = useCallback((cut: CutTextCard) => {
    setEditingCutId(cut.id);
    setEditingCutData({
      text: cut.text
    });
  }, []);

  // 컷 수정 취소
  const cancelEditingCut = useCallback(() => {
    setEditingCutId(null);
    setEditingCutData(null);
  }, []);

  // 컷 수정 완료
  const saveEditingCut = useCallback(() => {
    if (!editingCutId || !editingCutData) return;

    const updatedCards = localSceneTextCards.map(sceneCard => ({
      ...sceneCard,
      cuts: sceneCard.cuts.map(cut => 
        cut.id === editingCutId 
          ? { ...cut, text: editingCutData.text }
          : cut
      )
    }));

    setLocalSceneTextCards(updatedCards);
    localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));
    
    if (setGeneratedSceneTextCards) {
      setGeneratedSceneTextCards(updatedCards);
    }

    setEditingCutId(null);
    setEditingCutData(null);

    addNotification({
      type: 'success',
      title: '수정 완료',
      message: '컷 정보가 수정되었습니다.',
    });
  }, [editingCutId, editingCutData, localSceneTextCards, setGeneratedSceneTextCards, addNotification]);

  // 프로젝트 참조에서 에피소드 선택 핸들러
  const handleEpisodeSelection = useCallback((episode: any) => {
    setSelectedEpisodeForCards(episode);
    setShowProjectReferenceModal(false);
    
    addNotification({
      type: 'success',
      title: '에피소드 선택 완료',
      message: `"${episode.title}" 에피소드가 선택되었습니다. 텍스트 카드를 생성하세요.`,
    });
  }, [addNotification]);

  // 선택된 에피소드로 텍스트 카드 생성
  const handleGenerateCardsFromEpisode = useCallback(async () => {
    if (!selectedEpisodeForCards) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '에피소드를 먼저 선택해주세요.',
      });
      return;
    }

    try {
      const { GoogleAIService } = await import('../../services/googleAIService');
      
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      
      const prompt = `다음 에피소드 정보를 바탕으로 텍스트 카드를 생성해주세요:

=== 에피소드 정보 ===
제목: ${selectedEpisodeForCards.title}
설명: ${selectedEpisodeForCards.description}

=== 씬 구성 ===
${selectedEpisodeForCards.scenes.map((scene: any, index: number) => 
  `씬 ${index + 1}: ${scene.title}
- 설명: ${scene.description}
- 컷 수: ${scene.cuts || 3}개`
).join('\n')}

=== 요청사항 ===
각 씬을 개별 텍스트 카드로 생성해주세요. 각 카드는 다음과 같은 구조로 작성해주세요:

1. 씬 제목과 설명
2. 씬의 분위기와 설정
3. 주요 캐릭터와 행동
4. 촬영 지시사항 (카메라 앵글, 조명, 소품 등)
5. 대사와 감정 표현

각 텍스트 카드는 영상 제작에 직접 사용할 수 있도록 구체적이고 실용적으로 작성해주세요.`;

      const result = await googleAIService.generateText(prompt);
      
      if (result) {
        // 결과를 텍스트 카드로 변환
        const newCards: GeneratedTextCard[] = selectedEpisodeForCards.scenes.map((scene: any, index: number) => ({
          id: Date.now() + index,
          generatedText: `씬 ${index + 1}: ${scene.title}\n\n${scene.description}\n\n${result}`,
          timestamp: new Date().toISOString()
        }));

        setGeneratedTextCards(prev => [...prev, ...newCards]);
        
        addNotification({
          type: 'success',
          title: '생성 완료',
          message: `${newCards.length}개의 텍스트 카드가 생성되었습니다.`,
        });
      }
    } catch (error) {
      console.error('텍스트 카드 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '텍스트 카드 생성 중 오류가 발생했습니다.',
      });
    }
  }, [selectedEpisodeForCards, setGeneratedTextCards, addNotification]);

  // 텍스트 카드 선택 토글
  const toggleTextCardSelection = useCallback((cardId: number) => {
    setSelectedTextCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, [setSelectedTextCards]);

  return (
    <div className="bg-blue-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">📝 텍스트 카드 생성</h3>
      
      {/* 프로젝트 참조 선택 섹션 */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <h4 className="text-md font-semibold text-gray-800 mb-3">에피소드 텍스트 카드 생성</h4>
        
        {/* 에피소드만 선택 모드 토글 */}
        <div className="mb-4 p-3 bg-yellow-50 rounded border">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-yellow-800">에피소드 텍스트 카드 모드</h5>
              <p className="text-xs text-yellow-700">에피소드 구조를 기반으로 씬별 텍스트 카드를 생성합니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={episodeOnlyMode}
                onChange={(e) => setEpisodeOnlyMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setShowProjectReferenceModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            📋 에피소드 선택
          </button>
          
          {selectedEpisodeForCards && (
            <button
              onClick={handleGenerateCardsFromEpisode}
              disabled={selectedCutsForEpisode.size === 0}
              className={`px-4 py-2 rounded transition-colors ${
                selectedCutsForEpisode.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              🎬 에피소드 텍스트 카드 생성 ({selectedCutsForEpisode.size}개)
            </button>
          )}
        </div>
        
        {selectedEpisodeForCards && (
          <div className="p-3 bg-green-50 rounded border">
            <div className="text-sm">
              <strong>선택된 에피소드:</strong> {selectedEpisodeForCards.title}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {selectedEpisodeForCards.scenes.length}개 씬, 총 {selectedEpisodeForCards.scenes.reduce((sum: number, scene: any) => sum + (scene.cuts || 3), 0)}개 컷
              <br />
              <span className="text-green-600 font-medium">
                선택된 컷: {selectedCutsForEpisode.size}개
              </span>
            </div>
            
            {/* 에피소드별 컷 선택 */}
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-2">컷 선택 (공통 항목 제외)</h5>
              <div className="space-y-2">
                {selectedEpisodeForCards.scenes.map((scene: any, sceneIndex: number) => (
                  <div key={scene.id} className="bg-white p-2 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{scene.title}</span>
                      <span className="text-xs text-gray-500">{scene.cuts || 3}개 컷</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: scene.cuts || 3 }, (_, cutIndex) => {
                        const cutKey = `${scene.id}-${cutIndex + 1}`;
                        const isSelected = selectedCutsForEpisode.has(cutKey);
                        return (
                          <label key={cutIndex} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleEpisodeCutSelection(scene.id, cutIndex + 1)}
                              className="rounded"
                            />
                            <span className="text-xs">컷 {cutIndex + 1}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 생성된 씬 텍스트 카드 목록 */}
      {localSceneTextCards.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-800">
              생성된 씬 텍스트 카드 ({localSceneTextCards.length}개)
            </h4>
            <button
              onClick={() => setShowSceneCards(!showSceneCards)}
              className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
            >
              {showSceneCards ? '숨기기' : '보기'}
            </button>
          </div>
          
          {showSceneCards && (
            <div className="space-y-3">
              {localSceneTextCards.map((sceneCard) => (
                <div key={sceneCard.id} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-semibold text-green-800">
                        🎬 {sceneCard.sceneTitle}
                      </h5>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        {sceneCard.cuts.length}개 컷
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updatedCards = localSceneTextCards.map(card => 
                            card.id === sceneCard.id 
                              ? { ...card, showScene: !card.showScene }
                              : card
                          );
                          setLocalSceneTextCards(updatedCards);
                          localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));
                          
                          if (setGeneratedSceneTextCards) {
                            setGeneratedSceneTextCards(updatedCards);
                          }
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {sceneCard.showScene ? '숨기기' : '보이기'}
                      </button>
                      <button
                        onClick={() => startEditingScene(sceneCard)}
                        className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => deleteSceneTextCard(sceneCard.sceneId)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                  
                  {/* 씬 수정 폼 */}
                  {editingSceneId === sceneCard.sceneId && editingSceneData ? (
                    <div className="bg-yellow-50 p-3 rounded border mb-3">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">씬 제목</label>
                          <input
                            type="text"
                            value={editingSceneData.title}
                            onChange={(e) => setEditingSceneData(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">씬 설명</label>
                          <textarea
                            value={editingSceneData.description}
                            onChange={(e) => setEditingSceneData(prev => prev ? { ...prev, description: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">씬 공통 설정</label>
                          <textarea
                            value={editingSceneData.commonSettings}
                            onChange={(e) => setEditingSceneData(prev => prev ? { ...prev, commonSettings: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveEditingScene}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            저장
                          </button>
                          <button
                            onClick={cancelEditingScene}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 mb-3">
                      <div className="mb-2">
                        <strong>씬 설명:</strong> {sceneCard.sceneDescription}
                      </div>
                      {sceneCard.sceneCommonSettings && (
                        <div className="bg-blue-50 p-2 rounded border">
                          <strong>씬 공통 설정:</strong>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap mt-1">
                            {sceneCard.sceneCommonSettings}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {sceneCard.showScene && (
                    <div className="space-y-2">
                      {sceneCard.cuts.map((cut) => (
                        <div key={cut.id} className="bg-gray-50 p-3 rounded border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cut.selected}
                                onChange={() => toggleCutSelection(sceneCard.sceneId, cut.id)}
                                className="rounded"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                컷 {cut.cutNumber}
                              </span>
                            </div>
                            <button
                              onClick={() => startEditingCut(cut)}
                              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                            >
                              ✏️ 수정
                            </button>
                          </div>
                          
                          {/* 컷 수정 폼 */}
                          {editingCutId === cut.id && editingCutData ? (
                            <div className="bg-yellow-50 p-3 rounded border mb-2">
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">컷 내용</label>
                                  <textarea
                                    value={editingCutData.text}
                                    onChange={(e) => setEditingCutData(prev => prev ? { ...prev, text: e.target.value } : null)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                                    rows={6}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={saveEditingCut}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={cancelEditingCut}
                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap">
                              {cut.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    생성 시간: {new Date(sceneCard.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 생성된 텍스트 카드 목록 */}
      {generatedTextCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-800">
              생성된 텍스트 카드 ({generatedTextCards.length}개)
              {selectedTextCards.size > 0 && (
                <span className="ml-2 text-sm text-blue-600">
                  ({selectedTextCards.size}개 선택됨)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2">
              {selectedTextCards.size > 0 && (
                <button
                  onClick={deleteSelectedTextCards}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1 inline" />
                  선택 삭제
                </button>
              )}
              <button
                onClick={() => setShowTextResults(!showTextResults)}
                className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
              >
                {showTextResults ? '숨기기' : '보기'}
              </button>
            </div>
          </div>
          
          {showTextResults && (
            <div className="space-y-3">
              {generatedTextCards.map((card, index) => (
                <div key={card.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTextCards.has(card.id)}
                        onChange={() => toggleTextCardSelection(card.id)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        카드 {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onEditCard && (
                        <button
                          onClick={() => onEditCard(card.id, card.generatedText)}
                          className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                          ✏️ 수정
                        </button>
                      )}
                      <button
                        onClick={() => deleteTextCard(card.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {card.generatedText}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    생성 시간: {new Date(card.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 프로젝트 참조 모달 */}
      <ProjectReferenceModal
        isOpen={showProjectReferenceModal}
        onClose={() => setShowProjectReferenceModal(false)}
        story={story}
        characterList={characterList}
        finalScenario={finalScenario}
        generatedProjectData={generatedProjectData}
        episodes={episodes}
        onEpisodeSelection={handleEpisodeSelection}
        // 에피소드만 선택 모드 전달
        episodeOnlyMode={episodeOnlyMode}
        onEpisodeSelectForCards={handleEpisodeSelectForCards}
        onEditItem={(type, index, data) => {
          // 데이터 수정 처리
          if (type === 'koreanCards') {
            // 한글 카드 수정
            console.log('한글 카드 수정:', index, data);
          } else if (type === 'englishCards') {
            // 영어 카드 수정
            console.log('영어 카드 수정:', index, data);
          } else if (type === 'textCard') {
            // 텍스트 카드 수정
            const updatedCards = [...generatedTextCards];
            updatedCards[index] = data;
            setGeneratedTextCards(updatedCards);
          }
        }}
        onProjectReset={() => {
          // 프로젝트 초기화 로직 (부모 컴포넌트에서 처리)
          console.log('프로젝트 초기화 요청');
        }}
      />
    </div>
  );
});