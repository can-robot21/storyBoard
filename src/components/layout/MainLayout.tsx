import React, { useState } from 'react';
import { ProjectOverviewStep } from '../steps/ProjectOverviewStep';
import { ImageGenerationStep } from '../steps/ImageGenerationStep';
import { NanoBananaImageStep } from '../steps/NanoBananaImageStep';
import { VideoGenerationStep } from '../steps/VideoGenerationStep';
import ProgressTracker from '../common/ProgressTracker';
import { FormattedText, FormattedJSON } from '../common/FormattedText';
import Button from '../common/Button';
import { ProjectReferenceSection } from '../common/ProjectReferenceSection';
import { useUIStore } from '../../stores/uiStore';
import { safeBase64ToObject } from '../../utils/base64Utils';
import { UI_CONSTANTS, EMOJIS } from '../../utils/constants';

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

  const handleDelete = () => {
    if (window.confirm('이 텍스트 카드를 삭제하시겠습니까?')) {
      setGeneratedTextCards(prev => prev.filter(c => c.id !== card.id));
      setSelectedTextCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(card.id);
        return newSet;
      });
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-600">씬 {index + 1}</span>
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
            <Button 
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              저장
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="flex-1 text-sm"
            >
              취소
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="flex-1 text-sm"
            >
              수정
            </Button>
            <Button 
              onClick={handleDelete}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50 text-sm"
            >
              삭제
            </Button>
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
  showCutTextCards: boolean;
  setShowCutTextCards: (show: boolean) => void;
  cutVisibility: { [key: string]: boolean };
  setCutVisibility: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  // 단계 상태
  stepStatus: any;
  setStepStatus: (status: any) => void;
  // 토큰 사용량
  tokenUsage: {
    imageGeneration: { current: number; total: number };
    videoGeneration: { current: number; total: number };
  };
  setTokenUsage: (usage: any) => void;
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
  showTextResults, setShowTextResults,
  showCutTextCards, setShowCutTextCards,
  cutVisibility, setCutVisibility,
  // 단계 상태
  stepStatus, setStepStatus,
  // 토큰 사용량
  tokenUsage, setTokenUsage
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

  // 통합된 섹션 표시 상태 관리
  const [sectionVisibility, setSectionVisibility] = useState({
    projectOverview: true,
    videoPrompt: true,
    scenarioPrompt: true,
    koreanCards: true,
    englishCards: true,
    projectKoreanCards: true,
    projectEnglishCards: true
  });

  // 섹션 표시 상태 토글 함수
  const toggleSectionVisibility = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 토큰 사용량 업데이트 함수
  const updateTokenUsage = (type: 'imageGeneration' | 'videoGeneration', current: number) => {
    setTokenUsage((prev: any) => ({
      ...prev,
      [type]: {
        current: current,
        total: prev[type].total + current
      }
    }));
  };

  // 컷 카드 편집 상태 관리
  const [editingCutCard, setEditingCutCard] = useState<{cardId: number, cutNumber: number} | null>(null);
  const [editingCutData, setEditingCutData] = useState<any>(null);
  
  // 컷별 텍스트카드 선택 상태 관리
  const [cutTextCardSelections, setCutTextCardSelections] = useState<{[key: string]: Set<number>}>({});
  
  // 개별 컷 선택 상태 관리 (영상 생성용)
  const [selectedCuts, setSelectedCuts] = useState<Set<string>>(new Set());

  // 컷 카드 편집 함수들
  const handleEditCutCard = (cardId: number, cutNumber: number, cutData: any) => {
    setEditingCutCard({cardId, cutNumber});
    setEditingCutData({...cutData});
  };

  const handleSaveCutCard = () => {
    if (editingCutCard && editingCutData) {
      // 해당 텍스트 카드의 컷 데이터 업데이트 또는 추가
      setGeneratedTextCards(prev => 
        prev.map(card => {
          if (card.id === editingCutCard.cardId) {
            const cutTexts = parseCutTexts(card.generatedText || '');
            const isNewCut = !cutTexts[editingCutCard.cutNumber];
            
            // 기존 컷이 있는지 확인하여 업데이트 또는 추가
            if (cutTexts[editingCutCard.cutNumber]) {
              // 기존 컷 업데이트
              cutTexts[editingCutCard.cutNumber] = {
                ...cutTexts[editingCutCard.cutNumber],
                ...editingCutData
              };
            } else {
              // 새로운 컷 추가
              cutTexts[editingCutCard.cutNumber] = editingCutData;
            }
            
            // 업데이트된 컷 데이터를 텍스트로 변환
            const updatedText = Object.keys(cutTexts)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(cutNum => {
                const cut = cutTexts[parseInt(cutNum)];
                return `--- **컷 ${cutNum}: ${cut.title}**

**필수 항목:**
* **캐릭터:** ${cut.sections.character || ''}
* **액션:** ${cut.sections.action || ''}
* **배경:** ${cut.sections.background || ''}
* **대사:** ${cut.sections.dialogue || ''}

**추가 항목:**
* **구도:** ${cut.sections.composition || ''}
* **조명:** ${cut.sections.lighting || ''}
* **카메라 움직임:** ${cut.sections.cameraMovement || ''}`;
              }).join('\n\n');
            
            // 새로운 컷이 추가된 경우 cutCount 업데이트
            const updatedCutCount = Object.keys(cutTexts).length;
            
            return { 
              ...card, 
              generatedText: updatedText,
              cutCount: updatedCutCount
            };
          }
          return card;
        })
      );
      
      setEditingCutCard(null);
      setEditingCutData(null);
    }
  };

  const handleCancelCutCardEdit = () => {
    setEditingCutCard(null);
    setEditingCutData(null);
  };

  // 새로운 컷 추가 함수
  const handleAddNewCut = (cardId: number) => {
    // 모든 텍스트 카드에서 컷들을 수집하여 가장 큰 컷 번호 찾기
    let maxCutNumber = 0;
    generatedTextCards.forEach(card => {
      const cutTexts = parseCutTexts(card.generatedText || '');
      const cardMaxCut = Math.max(...Object.keys(cutTexts).map(Number), 0);
      maxCutNumber = Math.max(maxCutNumber, cardMaxCut);
    });
    
    const newCutNumber = maxCutNumber + 1;
    
    // 새로운 컷 데이터 생성 (빈 데이터)
    const newCutData = {
      title: `새 컷 ${newCutNumber}`,
      content: '',
      sections: {
        character: '',
        action: '',
        background: '',
        dialogue: '',
        composition: '',
        lighting: '',
        cameraMovement: ''
      }
    };
    
    // 수정 모달 열기
    setEditingCutCard({ cardId, cutNumber: newCutNumber });
    setEditingCutData(newCutData);
  };

  // 컷 삭제 함수
  const handleDeleteCutCard = (cardId: number, cutNumber: number) => {
    if (window.confirm(`컷 ${cutNumber}을 삭제하시겠습니까?`)) {
      setGeneratedTextCards(prev => 
        prev.map(card => {
          if (card.id === cardId) {
            const cutTexts = parseCutTexts(card.generatedText || '');
            
            // 해당 컷 삭제
            delete cutTexts[cutNumber];
            
            // 업데이트된 컷 데이터를 텍스트로 변환
            const updatedText = Object.keys(cutTexts)
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(cutNum => {
                const cut = cutTexts[parseInt(cutNum)];
                return `--- **컷 ${cutNum}: ${cut.title}**

**필수 항목:**
* **캐릭터:** ${cut.sections.character || ''}
* **액션:** ${cut.sections.action || ''}
* **배경:** ${cut.sections.background || ''}
* **대사:** ${cut.sections.dialogue || ''}

**추가 항목:**
* **구도:** ${cut.sections.composition || ''}
* **조명:** ${cut.sections.lighting || ''}
* **카메라 움직임:** ${cut.sections.cameraMovement || ''}`;
              }).join('\n\n');
            
            // 컷 수 업데이트
            const updatedCutCount = Object.keys(cutTexts).length;
            
            return { 
              ...card, 
              generatedText: updatedText,
              cutCount: updatedCutCount
            };
          }
          return card;
        })
      );
      
      // 선택된 컷에서도 제거
      const cutKey = `${cardId}-${cutNumber}`;
      setSelectedCuts(prev => {
        const newSet = new Set(prev);
        newSet.delete(cutKey);
        return newSet;
      });
    }
  };


  // 컷별 텍스트카드 선택 함수들
  const handleCutTextCardToggle = (cardId: number, cutNumber: number, textCardId: number) => {
    const key = `${cardId}-${cutNumber}`;
    setCutTextCardSelections(prev => {
      const current = prev[key] || new Set();
      const newSet = new Set(current);
      if (newSet.has(textCardId)) {
        newSet.delete(textCardId);
      } else {
        newSet.add(textCardId);
      }
      return { ...prev, [key]: newSet };
    });
  };

  const getCutTextCardSelections = (cardId: number, cutNumber: number) => {
    const key = `${cardId}-${cutNumber}`;
    return cutTextCardSelections[key] || new Set();
  };

  // 컷별 텍스트 파싱 함수 (개선된 버전)
  const parseCutTexts = (text: string) => {
    const cutPattern = /--- \*\*컷\s*(\d+):\s*([^*]+)\*\*/g;
    const cuts: { [key: number]: { title: string; content: string; sections: any } } = {};
    let match;
    
    // 모든 컷 매치를 먼저 찾기
    const allMatches: Array<{
      cutNumber: number;
      cutTitle: string;
      startIndex: number;
      match: RegExpExecArray;
    }> = [];
    while ((match = cutPattern.exec(text)) !== null) {
      allMatches.push({
        cutNumber: parseInt(match[1]),
        cutTitle: match[2].trim(),
        startIndex: match.index + match[0].length,
        match: match
      });
    }

    // 각 컷의 내용 추출
    allMatches.forEach((cutMatch, index) => {
      const cutNumber = cutMatch.cutNumber;
      const cutTitle = cutMatch.cutTitle;
      const startIndex = cutMatch.startIndex;
      
      // 다음 컷의 시작 위치 또는 텍스트 끝까지
      const nextCutStart = index < allMatches.length - 1 
        ? allMatches[index + 1].match.index 
        : text.length;
      
      const cutContent = text.substring(startIndex, nextCutStart).trim();
      
      // 각 섹션 파싱 (필수/추가 항목)
      const sections = {
        character: '',
        action: '',
        background: '',
        dialogue: '',
        composition: '',
        lighting: '',
        cameraMovement: ''
      };
      
      // 개선된 파싱 패턴들 (여러 가능한 형식 지원)
      const patterns = {
        character: [
          /\*\s*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,  // * **캐릭터:**
          /\*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,        // ***캐릭터:**
          /\*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,        // **캐릭터:**
          /캐릭터:\s*([\s\S]*?)(?=\*\*|$)/                     // 캐릭터: (간단한 형태)
        ],
        action: [
          /\*\s*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /액션:\s*([\s\S]*?)(?=\*\*|$)/
        ],
        background: [
          /\*\s*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /배경:\s*([\s\S]*?)(?=\*\*|$)/
        ],
        dialogue: [
          /\*\s*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /대사:\s*([\s\S]*?)(?=\*\*|$)/
        ],
        composition: [
          /\*\s*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /구도:\s*([\s\S]*?)(?=\*\*|$)/
        ],
        lighting: [
          /\*\s*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /조명:\s*([\s\S]*?)(?=\*\*|$)/
        ],
        cameraMovement: [
          /\*\s*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
          /\*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /\*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
          /카메라 움직임:\s*([\s\S]*?)(?=\*\*|$)/
        ]
      };

      // 각 섹션에 대해 여러 패턴 시도
      Object.keys(patterns).forEach(sectionKey => {
        for (const pattern of patterns[sectionKey as keyof typeof patterns]) {
          const match = cutContent.match(pattern);
          if (match) {
            sections[sectionKey as keyof typeof sections] = match[1].trim();
            break;
          }
        }
      });
      
      // 파싱 실패 시 대체 파싱 방법
      if (!sections.character && !sections.action && !sections.background && !sections.dialogue) {
        // 기존 형식으로 파싱 시도
        const descMatch = cutContent.match(/\* \*\*설명:\*\*\s*([\s\S]*?)(?=\* \*\*|$)/);
        if (descMatch) {
          sections.background = descMatch[1].trim();
        }
        
        const actionDialogueMatch = cutContent.match(/\* \*\*액션\/대사:\*\*\s*([\s\S]*?)(?=\* \*\*|$)/);
        if (actionDialogueMatch) {
          sections.action = actionDialogueMatch[1].trim();
        }
        
        const cameraMatch = cutContent.match(/\* \*\*카메라:\*\*\s*([\s\S]*?)(?=\* \*\*|$)/);
        if (cameraMatch) {
          sections.composition = cameraMatch[1].trim();
        }
        
        const visualMatch = cutContent.match(/\* \*\*시각 효과:\*\*\s*([\s\S]*?)(?=\* \*\*|$)/);
        if (visualMatch) {
          sections.lighting = visualMatch[1].trim();
        }
      }
      
      // 디버깅을 위한 로그 추가
      console.log(`컷 ${cutNumber} 파싱 결과:`, {
        character: sections.character,
        action: sections.action,
        background: sections.background,
        dialogue: sections.dialogue,
        composition: sections.composition,
        lighting: sections.lighting,
        cameraMovement: sections.cameraMovement
      });
      
      cuts[cutNumber] = {
        title: cutTitle,
        content: cutContent,
        sections: sections
      };
    });

    return cuts;
  };

  // 프로젝트 개요 삭제 함수
  const handleDeleteProjectOverview = () => {
    if (window.confirm('프로젝트 개요 저장 결과를 삭제하시겠습니까?\n\n삭제 시 4단계 버튼이 재활성화되고 2단계로 돌아갑니다.')) {
      setGeneratedProjectData(null);
      setSectionVisibility(prev => ({ ...prev, projectOverview: true }));
      
      // 4단계 재활성화 및 2단계로 돌아가기
      setStepStatus((prev: any) => ({
        ...prev,
        jsonCardsGenerated: false,
        aiReviewCompleted: false,
        projectOverviewSaved: false
      }));
      
      addNotification({
        type: 'info',
        title: '삭제 완료',
        message: '프로젝트 개요 저장 결과가 삭제되었습니다. 2단계부터 다시 진행하세요.',
      });
    }
  };

  // 설정용 영상 설정 프롬프트 삭제 함수
  const handleDeleteVideoPrompt = () => {
    if (window.confirm('설정용 영상 설정 프롬프트를 삭제하시겠습니까?')) {
      setScenarioPrompt('');
      setSectionVisibility(prev => ({ ...prev, videoPrompt: true }));
    }
  };

  // 설정용 시나리오 설정 프롬프트 삭제 함수
  const handleDeleteScenarioPrompt = () => {
    if (window.confirm('설정용 시나리오 설정 프롬프트를 삭제하시겠습니까?')) {
      setFinalScenario('');
      setSectionVisibility(prev => ({ ...prev, scenarioPrompt: true }));
    }
  };

  // 텍스트/토큰 카운트 계산 함수
  const calculateTextStats = (text: string) => {
    if (!text) return { characters: 0, tokens: 0 };
    const characters = text.length;
    const tokens = Math.ceil(characters / 4); // 대략적인 토큰 계산 (1토큰 ≈ 4문자)
    return { characters, tokens };
  };

  // 현재 표시 중인 텍스트 통계 계산
  const getCurrentTextStats = () => {
    let totalCharacters = 0;
    let totalTokens = 0;
    let stats = [];

    if (currentStep === "프로젝트 개요") {
      if (story) {
        const storyStats = calculateTextStats(story);
        totalCharacters += storyStats.characters;
        totalTokens += storyStats.tokens;
        stats.push(`스토리: ${storyStats.characters}자/${storyStats.tokens}토큰`);
      }
      if (scenarioPrompt) {
        const scenarioStats = calculateTextStats(scenarioPrompt);
        totalCharacters += scenarioStats.characters;
        totalTokens += scenarioStats.tokens;
        stats.push(`영상설정: ${scenarioStats.characters}자/${scenarioStats.tokens}토큰`);
      }
      if (finalScenario) {
        const finalStats = calculateTextStats(finalScenario);
        totalCharacters += finalStats.characters;
        totalTokens += finalStats.tokens;
        stats.push(`시나리오: ${finalStats.characters}자/${finalStats.tokens}토큰`);
      }
    } else if (currentStep === "이미지 생성" || currentStep === "이미지 생성/나노 바나나") {
      // 이미지 생성 관련 통계
      const characterTexts = generatedCharacters.map(c => c.prompt || '').join(' ');
      const backgroundTexts = generatedBackgrounds.map(b => b.prompt || '').join(' ');
      const settingTexts = generatedSettingCuts.map(s => s.prompt || '').join(' ');
      
      if (characterTexts) {
        const charStats = calculateTextStats(characterTexts);
        totalCharacters += charStats.characters;
        totalTokens += charStats.tokens;
        stats.push(`캐릭터: ${charStats.characters}자/${charStats.tokens}토큰`);
      }
      if (backgroundTexts) {
        const bgStats = calculateTextStats(backgroundTexts);
        totalCharacters += bgStats.characters;
        totalTokens += bgStats.tokens;
        stats.push(`배경: ${bgStats.characters}자/${bgStats.tokens}토큰`);
      }
      if (settingTexts) {
        const settingStats = calculateTextStats(settingTexts);
        totalCharacters += settingStats.characters;
        totalTokens += settingStats.tokens;
        stats.push(`설정: ${settingStats.characters}자/${settingStats.tokens}토큰`);
      }
    } else if (currentStep === "영상 생성") {
      // 영상 생성 관련 통계
      const videoTexts = generatedTextCards.map(c => c.generatedText || '').join(' ');
      if (videoTexts) {
        const videoStats = calculateTextStats(videoTexts);
        totalCharacters += videoStats.characters;
        totalTokens += videoStats.tokens;
        stats.push(`영상프롬프트: ${videoStats.characters}자/${videoStats.tokens}토큰`);
      }
    }

    return {
      total: { characters: totalCharacters, tokens: totalTokens },
      breakdown: stats
    };
  };

  // 최종 프롬프트 JSON 카드 생성
  const handleGenerateFinalPromptCards = async () => {
    try {
      setIsGeneratingCards(true);
      
      const promptData = {
        story: story,
        characters: characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        scenario: scenarioPrompt,
        finalScenario: finalScenario
      };

      // 국문 프롬프트 카드 생성
      const koreanCards = {
        '스토리': promptData.story,
        '캐릭터': promptData.characters,
        '시각및설정': promptData.scenario, // 시각 및 설정은 scenarioPrompt 사용
        '시나리오': promptData.finalScenario,
        '영상설정프롬프트': promptData.scenario
      };

      // 영문 프롬프트 카드 생성 (기존 영문 프롬프트 결과 사용)
      const englishCards = {
        'Story': englishPromptResults.story || `[English] ${promptData.story}`,
        'Characters': englishPromptResults.characters || `[English] ${promptData.characters}`,
        'Visual Settings': englishPromptResults.visualSettings || `[English] ${promptData.scenario}`,
        'Scenario': englishPromptResults.scenario || `[English] ${promptData.finalScenario}`,
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
            canProceedToNext={projectHandlers.canProceedToNext}
            stepStatus={stepStatus}
            setStepStatus={setStepStatus}
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
            canProceedToNext={projectHandlers.canProceedToNext}
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
            canProceedToNext={projectHandlers.canProceedToNext}
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
            cutTextCardSelections={cutTextCardSelections}
            selectedCuts={selectedCuts}
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
          
          {/* 토큰 사용량 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-medium">이미지 생성:</span>
                  <span className="text-blue-800">회당 {tokenUsage.imageGeneration.current}토큰</span>
                  <span className="text-blue-600">|</span>
                  <span className="text-blue-800">누적 {tokenUsage.imageGeneration.total}토큰</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-medium">영상 생성:</span>
                  <span className="text-purple-800">회당 {tokenUsage.videoGeneration.current}토큰</span>
                  <span className="text-purple-600">|</span>
                  <span className="text-purple-800">누적 {tokenUsage.videoGeneration.total}토큰</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 텍스트/토큰 카운트 표시 */}
          {(() => {
            const stats = getCurrentTextStats();
            if (stats.total.characters > 0) {
              return (
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">총합: {stats.total.characters}자 / {stats.total.tokens}토큰</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.breakdown.join(' | ')}
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}
          
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
                        onClick={() => toggleSectionVisibility('videoPrompt')}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        {sectionVisibility.videoPrompt ? '감추기' : '보이기'}
                      </button>
                      {editingText.scenario ? (
                        <>
                          <button 
                            onClick={() => {
                              setEditingText(prev => ({ ...prev, scenario: false }));
                            }}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            취소
                          </button>
                          <button 
                            onClick={() => handleSaveText('scenario')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEditText('scenario')}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={savedTexts.scenario}
                          >
                            수정
                          </button>
                          <button 
                            onClick={handleDeleteVideoPrompt}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {sectionVisibility.videoPrompt && (
                    <>
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
                    </>
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
                        onClick={() => toggleSectionVisibility('scenarioPrompt')}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        {sectionVisibility.scenarioPrompt ? '감추기' : '보이기'}
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
                        <>
                          <button 
                            onClick={() => handleEditText('finalScenario')}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={savedTexts.finalScenario}
                          >
                            수정
                          </button>
                          <button 
                            onClick={handleDeleteScenarioPrompt}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {sectionVisibility.scenarioPrompt && (
                    <>
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
                    </>
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">캐릭터 {index + 1}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Imagen
                          </span>
                        </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">배경 {index + 1}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Imagen
                          </span>
                        </div>
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">설정 컷 {index + 1}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Imagen
                          </span>
                        </div>
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
              {/* 영상 생성 진행 상태 및 선택 현황 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-medium text-blue-800 flex items-center gap-2 mb-4">
                  <span className="text-xl">📊</span>
                  영상 생성 현황
                </h3>
                
                {/* 진행 표시기 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">진행 단계</span>
                    <span className="text-xs text-gray-500">
                      {generatedTextCards.length > 0 ? '4/4' : '1/4'} 완료
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: generatedTextCards.length > 0 ? '100%' : '25%' 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span className={generatedTextCards.length > 0 ? 'text-blue-600 font-medium' : ''}>
                      ✓ 기본 설정
                    </span>
                    <span className={generatedTextCards.length > 0 ? 'text-blue-600 font-medium' : ''}>
                      ✓ 콘텐츠 생성
                    </span>
                    <span className={selectedCuts.size > 0 && selectedCharacterImages.size > 0 && selectedVideoBackgrounds.size > 0 ? 'text-blue-600 font-medium' : ''}>
                      ✓ 요소 선택
                    </span>
                    <span className={generatedVideos.length > 0 ? 'text-blue-600 font-medium' : ''}>
                      ✓ 영상 생성
                    </span>
                  </div>
                </div>

                {/* 선택 상태 통합 표시 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">선택된 컷</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCuts.size > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCuts.size}개
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedCuts.size === 0 ? '컷을 선택해주세요' : '선택 완료'}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">선택된 캐릭터</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedCharacterImages.size > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedCharacterImages.size}개
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedCharacterImages.size === 0 ? '캐릭터를 선택해주세요' : '선택 완료'}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">선택된 배경</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        selectedVideoBackgrounds.size > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedVideoBackgrounds.size}개
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedVideoBackgrounds.size === 0 ? '배경을 선택해주세요' : '선택 완료'}
                    </div>
                  </div>
                </div>

                {/* 미리보기 기능 */}
                {(selectedCuts.size > 0 || selectedCharacterImages.size > 0 || selectedVideoBackgrounds.size > 0) && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-lg">👁️</span>
                      선택된 요소 미리보기
                    </h4>
                    <div className="space-y-3">
                      {selectedCuts.size > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">컷</span>
                          <span className="text-sm text-gray-600">
                            {Array.from(selectedCuts).map(cutKey => {
                              const [, cutNumber] = cutKey.split('-');
                              return `컷${cutNumber}`;
                            }).join(', ')}
                          </span>
                        </div>
                      )}
                      {selectedCharacterImages.size > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">캐릭터</span>
                          <span className="text-sm text-gray-600">
                            {selectedCharacterImages.size}개 캐릭터 이미지
                          </span>
                        </div>
                      )}
                      {selectedVideoBackgrounds.size > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">배경</span>
                          <span className="text-sm text-gray-600">
                            {selectedVideoBackgrounds.size}개 배경 이미지
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 에러 메시지 개선 */}
                {selectedCuts.size === 0 || selectedCharacterImages.size === 0 || selectedVideoBackgrounds.size === 0 ? (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 mb-1">영상 생성을 위해 필요한 요소</h4>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {selectedCuts.size === 0 && (
                            <li>• 최소 1개의 컷을 선택해주세요</li>
                          )}
                          {selectedCharacterImages.size === 0 && (
                            <li>• 최소 1개의 캐릭터 이미지를 선택해주세요</li>
                          )}
                          {selectedVideoBackgrounds.size === 0 && (
                            <li>• 최소 1개의 배경 이미지를 선택해주세요</li>
                          )}
                        </ul>
                        <p className="text-xs text-yellow-600 mt-2">
                          모든 요소를 선택하면 영상 생성 버튼이 활성화됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 text-lg">✅</span>
                      <div>
                        <h4 className="text-sm font-medium text-green-800">영상 생성 준비 완료</h4>
                        <p className="text-xs text-green-700">
                          모든 필요한 요소가 선택되었습니다. 영상 생성 버튼을 클릭하여 진행하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 씬별 메인 블록 구조 */}
              {generatedTextCards.length > 0 && (
                <div className="space-y-6">
                  {/* 씬 설정 결과 헤더 */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-green-800 flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      씬 설정 결과
                      <span className="text-sm bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        {generatedTextCards.length}개 씬
                      </span>
                    </h3>
                  </div>
                  
                  {/* 씬별 메인 블록 */}
                  {generatedTextCards.map((card, cardIndex) => {
                    const cutTexts = parseCutTexts(card.generatedText || '');
                    const cutCount = card.cutCount || 1;
                    const sceneKey = `scene${cardIndex + 1}`;
                    const isSceneVisible = cutVisibility[sceneKey] !== false;
                    
                    return (
                      <div key={card.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
                        {/* 씬 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-medium text-green-700">씬{cardIndex + 1}</h4>
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                              {cutCount}컷
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCutVisibility(prev => ({ ...prev, [sceneKey]: !isSceneVisible }))}
                              className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              {isSceneVisible ? '[감추기]' : '[보이기]'}
                            </button>
                            <button
                              onClick={() => handleAddNewCut(card.id)}
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              [컷추가]
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`씬${cardIndex + 1}을 삭제하시겠습니까?`)) {
                                  setGeneratedTextCards(prev => prev.filter((_, index) => index !== cardIndex));
                                }
                              }}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              [삭제]
                            </button>
                          </div>
                        </div>
                        
                        {/* 컷 카드 편집 모달 - 씬 레벨용 */}
                        {editingCutCard && editingCutCard.cardId === card.id && editingCutData && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                              <h3 className="text-lg font-medium text-gray-800 mb-4">컷 카드 편집</h3>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">컷 제목</label>
                                  <input
                                    type="text"
                                    value={editingCutData.title}
                                    onChange={(e) => setEditingCutData({...editingCutData, title: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">캐릭터</label>
                                  <textarea
                                    value={editingCutData.sections.character}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, character: e.target.value}
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">액션</label>
                                  <textarea
                                    value={editingCutData.sections.action}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, action: e.target.value}
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">배경</label>
                                  <textarea
                                    value={editingCutData.sections.background}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, background: e.target.value}
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">대사</label>
                                  <textarea
                                    value={editingCutData.sections.dialogue}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, dialogue: e.target.value}
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">구도</label>
                                  <textarea
                                    value={editingCutData.sections.composition}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, composition: e.target.value}
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">조명</label>
                                  <textarea
                                    value={editingCutData.sections.lighting}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, lighting: e.target.value}
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">카메라 움직임</label>
                                  <textarea
                                    value={editingCutData.sections.cameraMovement}
                                    onChange={(e) => setEditingCutData({
                                      ...editingCutData, 
                                      sections: {...editingCutData.sections, cameraMovement: e.target.value}
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex gap-2 mt-6">
                                <Button 
                                  onClick={handleSaveCutCard}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  저장
                                </Button>
                                <Button 
                                  onClick={handleCancelCutCardEdit}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isSceneVisible && (
                          <div className="space-y-4">
                            {/* 씬 공통설정 */}
                            {card.sceneCommon && (
                              <div className="bg-white border border-green-200 rounded-lg p-4">
                                <h5 className="text-md font-medium text-green-700 mb-2">씬 공통설정</h5>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{card.sceneCommon}</div>
                                {card.originalSceneCommon && card.originalSceneCommon !== card.sceneCommon && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">원본 입력:</div>
                                    <div className="text-xs text-gray-600 italic">{card.originalSceneCommon}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 스토리 */}
                            {card.story && (
                              <div className="bg-white border border-green-200 rounded-lg p-4">
                                <h5 className="text-md font-medium text-green-700 mb-2">스토리</h5>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{card.story}</div>
                                {card.originalStory && card.originalStory !== card.story && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">원본 입력:</div>
                                    <div className="text-xs text-gray-600 italic">{card.originalStory}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 컷별 카드 */}
                            <div className="space-y-3">
                              <h5 className="text-md font-medium text-green-700 mb-2">컷별 상세</h5>
                              {Array.from({ length: cutCount }, (_, cutIndex) => {
                                const cutNumber = cutIndex + 1;
                                const cutData = cutTexts[cutNumber];
                                const cutKey = `scene${cardIndex + 1}_cut${cutNumber}`;
                                const isCutVisible = cutVisibility[cutKey] !== false;
                                
                                return (
                                  <div key={cutIndex} className="bg-white border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <h6 className="font-medium text-green-700">컷{cutNumber}</h6>
                                        <button
                                          onClick={() => setCutVisibility(prev => ({ ...prev, [cutKey]: !isCutVisible }))}
                                          className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                                        >
                                          {isCutVisible ? '[감추기]' : '[보이기]'}
                                        </button>
                                        <div className="flex gap-1 ml-2">
                                          <button
                                            onClick={() => handleEditCutCard(card.id, cutNumber, cutData)}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                            title="컷 수정"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() => handleDeleteCutCard(card.id, cutNumber)}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                            title="컷 삭제"
                                          >
                                            삭제
                                          </button>
                                          <input
                                            type="checkbox"
                                            checked={selectedCuts.has(`${card.id}-${cutNumber}`)}
                                            onChange={() => {
                                              const cutKey = `${card.id}-${cutNumber}`;
                                              const newSet = new Set(selectedCuts);
                                              if (newSet.has(cutKey)) {
                                                newSet.delete(cutKey);
                                              } else {
                                                newSet.add(cutKey);
                                              }
                                              setSelectedCuts(newSet);
                                            }}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                            title="컷 선택"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {isCutVisible && cutData && (
                                      <div className="space-y-2">
                                        <div className="border-l-4 border-green-400 pl-3">
                                          <h6 className="font-medium text-green-600 mb-1">{cutData.title}</h6>
                                        </div>
                                        
                                        {/* 필수 항목 */}
                                        <div className="space-y-2">
                                          <div className="text-xs font-medium text-gray-500 mb-1">필수 항목</div>
                                          
                                          {cutData.sections.character && (
                                            <div className="bg-blue-50 rounded p-2">
                                              <div className="text-xs font-medium text-blue-600 mb-1">👤 캐릭터</div>
                                              <div className="text-sm text-gray-700">{cutData.sections.character}</div>
                                            </div>
                                          )}
                                          
                                          {cutData.sections.action && (
                                            <div className="bg-green-50 rounded p-2">
                                              <div className="text-xs font-medium text-green-600 mb-1">🏃 액션</div>
                                              <div className="text-sm text-gray-700">{cutData.sections.action}</div>
                                            </div>
                                          )}
                                          
                                          {cutData.sections.background && (
                                            <div className="bg-purple-50 rounded p-2">
                                              <div className="text-xs font-medium text-purple-600 mb-1">🏞️ 배경</div>
                                              <div className="text-sm text-gray-700">{cutData.sections.background}</div>
                                            </div>
                                          )}
                                          
                                          {cutData.sections.dialogue && (
                                            <div className="bg-orange-50 rounded p-2">
                                              <div className="text-xs font-medium text-orange-600 mb-1">💬 대사</div>
                                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{cutData.sections.dialogue}</div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* 추가 항목 */}
                                        {(cutData.sections.composition || cutData.sections.lighting || cutData.sections.cameraMovement) && (
                                          <div className="space-y-2">
                                            <div className="text-xs font-medium text-gray-500 mb-1">추가 항목</div>
                                            
                                            {cutData.sections.composition && (
                                              <div className="bg-gray-50 rounded p-2">
                                                <div className="text-xs font-medium text-gray-600 mb-1">📐 구도</div>
                                                <div className="text-sm text-gray-700">{cutData.sections.composition}</div>
                                              </div>
                                            )}
                                            
                                            {cutData.sections.lighting && (
                                              <div className="bg-yellow-50 rounded p-2">
                                                <div className="text-xs font-medium text-yellow-600 mb-1">💡 조명</div>
                                                <div className="text-sm text-gray-700">{cutData.sections.lighting}</div>
                                              </div>
                                            )}
                                            
                                            {cutData.sections.cameraMovement && (
                                              <div className="bg-indigo-50 rounded p-2">
                                                <div className="text-xs font-medium text-indigo-600 mb-1">🎥 카메라 움직임</div>
                                                <div className="text-sm text-gray-700">{cutData.sections.cameraMovement}</div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                      </div>
                                    )}
                                    
                                    {isCutVisible && !cutData && (
                                      <div className="text-sm text-gray-500 italic">
                                        컷별 상세 설명이 아직 생성되지 않았습니다.
                                      </div>
                                    )}
                                    
                                    {isCutVisible && cutData && !cutData.sections.character && !cutData.sections.action && !cutData.sections.background && !cutData.sections.dialogue && (
                                      <div className="bg-gray-50 rounded p-3">
                                        <div className="text-xs font-medium text-gray-600 mb-2">원본 텍스트 (파싱 실패)</div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{cutData.content}</div>
                                      </div>
                                    )}

                                    {/* 컷 카드 편집 모달 - 개별 컷용 */}
                                    {editingCutCard && editingCutCard.cardId === card.id && editingCutCard.cutNumber === cutNumber && editingCutData && (
                                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                                          <h3 className="text-lg font-medium text-gray-800 mb-4">컷 카드 편집</h3>
                                          
                                          <div className="space-y-4">
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">컷 제목</label>
                                              <input
                                                type="text"
                                                value={editingCutData.title}
                                                onChange={(e) => setEditingCutData({...editingCutData, title: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">캐릭터</label>
                                              <textarea
                                                value={editingCutData.sections.character}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, character: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">액션</label>
                                              <textarea
                                                value={editingCutData.sections.action}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, action: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">배경</label>
                                              <textarea
                                                value={editingCutData.sections.background}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, background: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">대사</label>
                                              <textarea
                                                value={editingCutData.sections.dialogue}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, dialogue: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">구도</label>
                                              <textarea
                                                value={editingCutData.sections.composition}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, composition: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">조명</label>
                                              <textarea
                                                value={editingCutData.sections.lighting}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, lighting: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                            
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-1">카메라 움직임</label>
                                              <textarea
                                                value={editingCutData.sections.cameraMovement}
                                                onChange={(e) => setEditingCutData({
                                                  ...editingCutData, 
                                                  sections: {...editingCutData.sections, cameraMovement: e.target.value}
                                                })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="flex gap-2 mt-6">
                                            <Button 
                                              onClick={handleSaveCutCard}
                                              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                              저장
                                            </Button>
                                            <Button 
                                              onClick={handleCancelCutCardEdit}
                                              variant="outline"
                                              className="flex-1"
                                            >
                                              취소
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

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
            <ProjectReferenceSection
              generatedProjectData={generatedProjectData}
              story={story}
              characterList={characterList}
              finalScenario={finalScenario}
              scenarioPrompt={scenarioPrompt}
              showKoreanCards={sectionVisibility.koreanCards}
              showEnglishCards={sectionVisibility.englishCards}
              onToggleKoreanCards={() => toggleSectionVisibility('koreanCards')}
              onToggleEnglishCards={() => toggleSectionVisibility('englishCards')}
            />
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-xl">🇰🇷</span>
                      국문 프롬프트
                    </h3>
                    <button 
                      onClick={() => toggleSectionVisibility('projectKoreanCards')}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      {sectionVisibility.projectKoreanCards ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {sectionVisibility.projectKoreanCards && (
                    <div className="space-y-4">
                      {Object.entries(finalPromptCards.korean).map(([title, content]) => {
                        const isFullWidth = UI_CONSTANTS.FULL_WIDTH_CARDS.KOREAN.includes(title);
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
                  )}
                </div>
              )}

              {/* 영문 프롬프트 카드 */}
              {Object.keys(finalPromptCards.english).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-xl">🇺🇸</span>
                      영문 프롬프트
                    </h3>
                    <button 
                      onClick={() => toggleSectionVisibility('projectEnglishCards')}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      {sectionVisibility.projectEnglishCards ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {sectionVisibility.projectEnglishCards && (
                    <div className="space-y-4">
                      {Object.entries(finalPromptCards.english).map(([title, content]) => {
                        const isFullWidth = UI_CONSTANTS.FULL_WIDTH_CARDS.ENGLISH.includes(title);
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
                  )}
                </div>
              )}
            </div>
          )}

          {/* 프로젝트 개요 저장 결과 - 가장 하단 */}
          {currentStep === "프로젝트 개요" && generatedProjectData && (
            <div className="mt-8 space-y-6">
              <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-purple-800 flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    프로젝트 개요 저장 결과
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleSectionVisibility('projectOverview')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {sectionVisibility.projectOverview ? '감추기' : '보이기'}
                    </button>
                    <button 
                      onClick={handleDeleteProjectOverview}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {sectionVisibility.projectOverview && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
