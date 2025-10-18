import React, { useState, useEffect } from 'react';
import { SmartInputHelper } from '../common/SmartInputHelper';
import { RealTimeFeedback } from '../common/RealTimeFeedback';
import { useUIStore } from '../../stores/uiStore';

interface CommonInputsSectionProps {
  story: string;
  characterList: any[];
  storySummary?: string;
  onComplete?: () => void;
  onReset?: () => void;
  showEditMode?: boolean;
  title?: string;
  // 입력 가능한 모드를 위한 추가 props
  editable?: boolean;
  onStoryChange?: (story: string) => void;
  onCharacterListChange?: (characters: any[]) => void;
  onStorySummaryChange?: (summary: string) => void;
}

export const CommonInputsSection: React.FC<CommonInputsSectionProps> = ({
  story,
  characterList,
  storySummary,
  onComplete,
  onReset,
  showEditMode = false,
  title = "📋 공통 입력 항목",
  editable = false,
  onStoryChange,
  onCharacterListChange,
  onStorySummaryChange
}) => {
  const { addNotification } = useUIStore();
  const [showCommonInputs, setShowCommonInputs] = useState(false);
  const [commonInputsCompleted, setCommonInputsCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 상태
  
  // 로컬 상태 관리 (editable 모드에서 사용)
  const [localStory, setLocalStory] = useState(story);
  const [localCharacterList, setLocalCharacterList] = useState(characterList);
  const [localStorySummary, setLocalStorySummary] = useState(storySummary || '');
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterDescription, setNewCharacterDescription] = useState('');
  
  // 수정 전 원본 데이터 저장
  const [originalStory, setOriginalStory] = useState(story);
  const [originalCharacterList, setOriginalCharacterList] = useState(characterList);
  const [originalStorySummary, setOriginalStorySummary] = useState(storySummary || '');

  // props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalStory(story);
    setLocalCharacterList(characterList);
    setLocalStorySummary(storySummary || '');
  }, [story, characterList, storySummary]);

  // localStorage에서 공통입력 완료 상태 로드
  useEffect(() => {
    const savedState = localStorage.getItem('commonInputsCompleted');
    if (savedState === 'true') {
      setCommonInputsCompleted(true);
    }
  }, []);

  // 공통입력 완료 상태를 localStorage에 저장
  const saveCommonInputsState = (completed: boolean) => {
    localStorage.setItem('commonInputsCompleted', completed.toString());
  };

  // 캐릭터 추가
  const addCharacter = () => {
    if (!newCharacterName.trim() || !newCharacterDescription.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 이름과 설명을 모두 입력해주세요.',
      });
      return;
    }

    const newCharacter = {
      id: Date.now(),
      name: newCharacterName.trim(),
      description: newCharacterDescription.trim()
    };

    const updatedCharacters = [...localCharacterList, newCharacter];
    setLocalCharacterList(updatedCharacters);
    onCharacterListChange?.(updatedCharacters);
    
    setNewCharacterName('');
    setNewCharacterDescription('');
    
    addNotification({
      type: 'success',
      title: '캐릭터 추가',
      message: `${newCharacter.name} 캐릭터가 추가되었습니다.`,
    });
  };

  // 캐릭터 삭제
  const removeCharacter = (characterId: number) => {
    const updatedCharacters = localCharacterList.filter(c => c.id !== characterId);
    setLocalCharacterList(updatedCharacters);
    onCharacterListChange?.(updatedCharacters);
    
    addNotification({
      type: 'info',
      title: '캐릭터 삭제',
      message: '캐릭터가 삭제되었습니다.',
    });
  };

  // 공통 입력 완료 처리
  const handleCommonInputsComplete = () => {
    const currentStory = editable ? localStory : story;
    const currentCharacterList = editable ? localCharacterList : characterList;
    
    if (!currentStory || currentCharacterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 입력해주세요.',
      });
      return;
    }

    // editable 모드인 경우 부모 컴포넌트에 변경사항 전달
    if (editable) {
      onStoryChange?.(localStory);
      onCharacterListChange?.(localCharacterList);
      onStorySummaryChange?.(localStorySummary);
    }

    setCommonInputsCompleted(true);
    saveCommonInputsState(true);
    setShowCommonInputs(false);
    
    addNotification({
      type: 'success',
      title: '공통 입력 완료',
      message: '기본 정보가 성공적으로 입력되었습니다.',
    });

    onComplete?.();
  };

  // 공통 입력 초기화
  const handleCommonInputsReset = () => {
    setCommonInputsCompleted(false);
    saveCommonInputsState(false);
    
    if (editable) {
      setLocalStory('');
      setLocalCharacterList([]);
      setLocalStorySummary('');
      onStoryChange?.('');
      onCharacterListChange?.([]);
      onStorySummaryChange?.('');
    }
    
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '공통 입력 항목이 초기화되었습니다.',
    });

    onReset?.();
  };

  // 수정 모드 시작
  const handleStartEdit = () => {
    // 현재 데이터를 원본으로 저장
    setOriginalStory(localStory);
    setOriginalCharacterList([...localCharacterList]);
    setOriginalStorySummary(localStorySummary);
    
    setIsEditing(true);
    setShowCommonInputs(true);
    
    addNotification({
      type: 'info',
      title: '수정 모드',
      message: '공통 입력 항목을 수정할 수 있습니다.',
    });
  };

  // 수정 취소
  const handleCancelEdit = () => {
    // 원본 데이터로 복원
    setLocalStory(originalStory);
    setLocalCharacterList([...originalCharacterList]);
    setLocalStorySummary(originalStorySummary);
    
    setIsEditing(false);
    
    addNotification({
      type: 'info',
      title: '수정 취소',
      message: '변경사항이 취소되었습니다.',
    });
  };

  // 수정 완료
  const handleFinishEdit = () => {
    // 유효성 검사
    if (!localStory.trim() || localCharacterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 입력해주세요.',
      });
      return;
    }

    // 부모 컴포넌트에 변경사항 전달
    if (editable) {
      onStoryChange?.(localStory);
      onCharacterListChange?.(localCharacterList);
      onStorySummaryChange?.(localStorySummary);
    }

    setIsEditing(false);
    
    addNotification({
      type: 'success',
      title: '수정 완료',
      message: '공통 입력 항목이 수정되었습니다.',
    });
  };

  // 초기화
  const handleReset = () => {
    setCommonInputsCompleted(false);
    saveCommonInputsState(false);
    
    if (editable) {
      setLocalStory('');
      setLocalCharacterList([]);
      setLocalStorySummary('');
      onStoryChange?.('');
      onCharacterListChange?.([]);
      onStorySummaryChange?.('');
    }
    
    setIsEditing(false);
    
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '공통 입력 항목이 초기화되었습니다.',
    });

    onReset?.();
  };

  const isInputReady = editable ? 
    (localStory && localCharacterList.length > 0) : 
    (story && characterList.length > 0);

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            {commonInputsCompleted ? 
              '✅ 기본 정보 입력 완료' : 
              isInputReady ? 
                '✅ 입력 준비 완료' : 
                '⏳ 스토리와 캐릭터 정보를 입력해주세요'
            }
          </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowCommonInputs(prev => !prev)}
                          className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                        >
                          {showCommonInputs ? '입력 숨기기' : '입력 보기-수정'}
                        </button>
                        {showCommonInputs && (
                          <>
                            {!commonInputsCompleted ? (
                              <button
                                onClick={handleCommonInputsComplete}
                                disabled={!isInputReady}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  isInputReady 
                                    ? 'bg-green-600 text-white hover:bg-green-700' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                입력완료
                              </button>
                            ) : (
                              <>
                                {!isEditing ? (
                                  <>
                                    <button
                                      onClick={handleStartEdit}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={handleReset}
                                      className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                                    >
                                      초기화
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={handleFinishEdit}
                                      disabled={!isInputReady}
                                      className={`px-3 py-1 text-xs rounded transition-colors ${
                                        isInputReady 
                                          ? 'bg-green-600 text-white hover:bg-green-700' 
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      }`}
                                    >
                                      입력완료
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                    >
                                      취소
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
        </div>
      </div>
      
      {showCommonInputs && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">📝 기본 정보</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  스토리 제목 <span className="text-red-500">*</span>
                </label>
                <SmartInputHelper
                  type="story"
                  onApplySuggestion={(suggestion) => {
                    if (onStoryChange) {
                      onStoryChange(suggestion);
                    }
                  }}
                  currentValue={localStory}
                />
              </div>
                          {(editable && (showCommonInputs || isEditing)) ? (
                            <input
                              type="text"
                              value={localStory}
                              onChange={(e) => setLocalStory(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="스토리 제목을 입력하세요"
                            />
                          ) : (
                            <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                              {story || '스토리 제목이 없습니다'}
                            </div>
                          )}
                          <RealTimeFeedback
                            type="story"
                            value={localStory}
                            required={true}
                            minLength={5}
                            maxLength={200}
                          />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                캐릭터 정보 <span className="text-red-500">*</span>
              </label>
                          {(editable && (showCommonInputs || isEditing)) ? (
                            <div className="space-y-3">
                              {/* 기존 캐릭터 목록 */}
                              {localCharacterList.length > 0 && (
                                <div className="space-y-2">
                                  {localCharacterList.map((character) => (
                                    <div key={character.id} className="flex items-center gap-2 bg-white p-2 rounded border">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-800">{character.name}</div>
                                        <div className="text-xs text-gray-600">{character.description}</div>
                                      </div>
                                      <button
                                        onClick={() => removeCharacter(character.id)}
                                        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* 새 캐릭터 추가 */}
                              <div className="bg-white p-3 rounded border border-dashed border-gray-300">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs text-gray-600">새 캐릭터 추가</div>
                                  <SmartInputHelper
                                    type="character"
                                    onApplySuggestion={(suggestion) => {
                                      const parts = suggestion.split(' - ');
                                      if (parts.length >= 2) {
                                        setNewCharacterName(parts[0]);
                                        setNewCharacterDescription(parts[1]);
                                      } else {
                                        setNewCharacterName(suggestion);
                                      }
                                    }}
                                    currentValue={`${newCharacterName} - ${newCharacterDescription}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={newCharacterName}
                                    onChange={(e) => setNewCharacterName(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="캐릭터 이름"
                                  />
                                  <input
                                    type="text"
                                    value={newCharacterDescription}
                                    onChange={(e) => setNewCharacterDescription(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="캐릭터 설명"
                                  />
                                  <button
                                    onClick={addCharacter}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    캐릭터 추가
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                              {characterList.length > 0 ? 
                                characterList.map(c => `${c.name}: ${c.description}`).join(', ') : 
                                '캐릭터 정보가 없습니다'
                              }
                            </div>
                          )}
                          <RealTimeFeedback
                            type="character"
                            value={localCharacterList}
                            required={true}
                          />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                스토리 요약
              </label>
                          {(editable && (showCommonInputs || isEditing)) ? (
                            <textarea
                              value={localStorySummary}
                              onChange={(e) => setLocalStorySummary(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="스토리 요약을 입력하세요"
                            />
                          ) : (
                            <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                              {storySummary || '스토리 요약이 없습니다'}
                            </div>
                          )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
