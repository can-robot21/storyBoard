import React, { useState } from 'react';
import { useUIStore } from './stores/uiStore';
import Button from './components/common/Button';
import ProgressTracker from './components/common/ProgressTracker';
import ImageUpload from './components/common/ImageUpload';
import StreamingText from './components/common/StreamingText';
import { googleAIService } from './services/googleAIService';
import { downloadBase64Image, downloadVideo, downloadText } from './utils/downloadUtils';

const mainSteps = [
  "프로젝트 개요",
  "이미지 생성", 
  "영상 생성",
];

const progressSteps = [
  {
    id: 'overview',
    title: '프로젝트 개요',
    description: 'AI 텍스트 생성',
    status: 'completed' as const,
  },
  {
    id: 'character',
    title: '이미지 생성',
    description: 'AI 이미지 생성',
    status: 'current' as const,
  },
  {
    id: 'video',
    title: '영상 생성',
    description: '컷별 이미지 생성',
    status: 'pending' as const,
  },
];

export default function App() {
  const { addNotification } = useUIStore();
  const [currentStep, setCurrentStep] = useState("프로젝트 개요");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 프로젝트 개요 상태
  const [story, setStory] = useState("");
  const [storyText, setStoryText] = useState("");
  
  // 추가 입력 필드들
  const [videoStyle, setVideoStyle] = useState("");
  const [visualElements, setVisualElements] = useState("");
  const [emotionalElements, setEmotionalElements] = useState("");
  const [dialogue, setDialogue] = useState("");
  
  // 캐릭터 넘버링 시스템
  const [characterList, setCharacterList] = useState<string[]>([]);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  
  // 생성된 프롬프트들
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  const [storySummary, setStorySummary] = useState(""); // 500자 스토리 정리
  const [finalScenario, setFinalScenario] = useState(""); // 최종 텍스트 시나리오
  
  // 항목별 수정/확정 상태
  const [itemEditStatus, setItemEditStatus] = useState({
    character: false,
    scenario: false
  });
  
  const [itemConfirmStatus, setItemConfirmStatus] = useState({
    character: false,
    scenario: false
  });
  
  // 수정 중인 항목별 내용
  const [editingItems, setEditingItems] = useState({
    character: "",
    scenario: ""
  });
  
  // 통합 AI 검토 결과 수정 상태
  const [editingReviewResult, setEditingReviewResult] = useState(false);
  const [editingReviewText, setEditingReviewText] = useState("");
  
  // 영상 생성 최적화 프롬프트들
  const [characterVideoPrompt, setCharacterVideoPrompt] = useState("");
  const [scenarioVideoPrompt, setScenarioVideoPrompt] = useState("");
  
  // 프롬프트 수정 상태
  const [editingPrompts, setEditingPrompts] = useState({
    character: false,
    scenario: false
  });
  
  // 수정 중인 프롬프트들
  const [editingVideoPrompts, setEditingVideoPrompts] = useState({
    character: "",
    scenario: ""
  });
  
  // 저장 상태
  const [isSaved, setIsSaved] = useState(false);
  
  
  // 캐릭터 설정 상태
  const [characterInput, setCharacterInput] = useState("");
  const [backgroundInput, setBackgroundInput] = useState("");
  const [settingCut, setSettingCut] = useState("");
  const [generatedCharacters, setGeneratedCharacters] = useState<any[]>([]);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<any[]>([]);
  const [generatedSettingCuts, setGeneratedSettingCuts] = useState<any[]>([]);
  
  // 첨부된 이미지들 (캐릭터 설정용)
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);
  
  // 영상 생성 상태
  const [cutCount, setCutCount] = useState(3);
  const [videoRatio, setVideoRatio] = useState("16:9");
  const [textScenario, setTextScenario] = useState("");
  const [characterOutfit, setCharacterOutfit] = useState("");
  const [additionalElements, setAdditionalElements] = useState("");
  const [generatedCuts, setGeneratedCuts] = useState<any[]>([]);
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  
  // 영상 생성용 첨부 이미지들
  const [attachedCharacterOutfitImages, setAttachedCharacterOutfitImages] = useState<File[]>([]);
  const [attachedAdditionalImages, setAttachedAdditionalImages] = useState<File[]>([]);
  
  // 새로운 영상 생성 상태들
  const [storySceneInput, setStorySceneInput] = useState("");
  const [generatedTextCards, setGeneratedTextCards] = useState<any[]>([]);
  const [characterOutfitInput, setCharacterOutfitInput] = useState("");
  const [characterOutfitImages, setCharacterOutfitImages] = useState<File[]>([]);
  const [generatedCharacterVideos, setGeneratedCharacterVideos] = useState<any[]>([]);
  const [generatedCharacterImages, setGeneratedCharacterImages] = useState<any[]>([]);
  const [videoBackgroundInput, setVideoBackgroundInput] = useState("");
  const [videoBackgroundImages, setVideoBackgroundImages] = useState<File[]>([]);
  const [generatedVideoBackgrounds, setGeneratedVideoBackgrounds] = useState<any[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  
  // 체크박스 상태들
  const [checkedTextCards, setCheckedTextCards] = useState<Set<number>>(new Set());
  const [checkedCharacterImages, setCheckedCharacterImages] = useState<Set<number>>(new Set());
  const [checkedBackgrounds, setCheckedBackgrounds] = useState<Set<number>>(new Set());
  
  // 프로젝트 저장 상태
  const [isProjectSaved, setIsProjectSaved] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // 텍스트 생성 결과 표시 상태
  const [showTextResults, setShowTextResults] = useState(false);

  // 완료/수정/확정 버튼 시스템 상태
  const [groupCompletionStatus, setGroupCompletionStatus] = useState({
    story: false,
    character: false,
    scenario: false,
    video: false
  });
  
  const [groupEditStatus, setGroupEditStatus] = useState({
    story: false,
    character: false,
    scenario: false,
    video: false
  });
  
  const [isAllGroupsConfirmed, setIsAllGroupsConfirmed] = useState(false);

  const handleRun = () => {
    addNotification({
      type: 'success',
      title: '실행 완료',
      message: `${currentStep}이 성공적으로 실행되었습니다.`,
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    addNotification({
      type: 'success',
      title: '로그인 완료',
      message: '성공적으로 로그인되었습니다.',
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    addNotification({
      type: 'info',
      title: '로그아웃',
      message: '로그아웃되었습니다.',
    });
  };

  // 스트리밍 상태
  const [isStreaming, setIsStreaming] = useState({
    character: false,
    scenario: false
  });

  // 통합 프로젝트 데이터 생성 (구조화된 출력)
  const [generatedProjectData, setGeneratedProjectData] = useState<any>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const handleGenerateAllPrompts = async () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '주요 스토리 라인을 먼저 입력해주세요.',
      });
      return;
    }
    
    setIsGeneratingAll(true);
    
    try {
      // 최종 텍스트 시나리오 생성
      const finalScenarioPrompt = `다음은 현재까지 입력되고 생성된 모든 프로젝트 정보입니다. 이를 바탕으로 최종 텍스트 시나리오를 생성해주세요:

=== 입력된 정보 ===
주요 스토리 라인: ${story}
영상 스타일: ${videoStyle || '미지정'}
시각적 요소: ${visualElements || '미지정'}
감정적 요소: ${emotionalElements || '미지정'}
상세 스토리 텍스트: ${storyText || '미지정'}
주요 대사: ${dialogue || '미지정'}
캐릭터 목록: ${characterList.length > 0 ? characterList.join(', ') : '미지정'}

=== 생성된 프롬프트들 ===
캐릭터 프롬프트: ${characterPrompt || '미생성'}
시나리오 프롬프트: ${scenarioPrompt || '미생성'}
스토리 정리: ${storySummary || '미생성'}

=== 요청사항 ===
위의 모든 정보를 종합하여 완성된 텍스트 시나리오를 생성해주세요. 다음 형식으로 작성해주세요:

1. 시나리오 제목
2. 스토리 개요 (3-4문장)
3. 등장인물 소개
4. 장면별 시나리오 (3-5개 장면)
   - 장면 1: [장면명]
     * 배경: [설정과 분위기]
     * 등장인물: [등장하는 캐릭터들]
     * 행동: [주요 행동과 움직임]
     * 대사: [대사와 나레이션]
     * 시각적 요소: [카메라 워크, 색감, 조명 등]
   
5. 결말 및 메시지

영상 제작에 최적화된 구체적이고 상세한 시나리오를 작성해주세요.`;

      const finalResult = await googleAIService.generateText(finalScenarioPrompt);
      setFinalScenario(finalResult);

      // 기존 그룹별 정리도 유지
      const reviewPrompt = `다음은 현재까지 입력되고 생성된 프로젝트 정보입니다. 이를 검토하고 그룹별로 정리된 형태로 리뉴얼해주세요:

=== 입력된 정보 ===
주요 스토리 라인: ${story}
영상 스타일: ${videoStyle || '미지정'}
시각적 요소: ${visualElements || '미지정'}
감정적 요소: ${emotionalElements || '미지정'}
상세 스토리 텍스트: ${storyText || '미지정'}
주요 대사: ${dialogue || '미지정'}
캐릭터 목록: ${characterList.length > 0 ? characterList.join(', ') : '미지정'}

=== 기존 생성된 프롬프트들 ===
캐릭터 프롬프트: ${characterPrompt || '미생성'}
시나리오 프롬프트: ${scenarioPrompt || '미생성'}

=== 요청사항 ===
다음 형식으로 그룹별로 정리하여 JSON 형태로 응답해주세요:

{
  "characterGroup": {
    "title": "캐릭터 그룹", 
    "description": "각 캐릭터별 상세한 설정과 디자인",
    "prompt": "캐릭터 설정 프롬프트",
    "videoOptimization": "캐릭터 영상 생성 최적화 프롬프트 (영문)"
  },
  "scenarioGroup": {
    "title": "시나리오 그룹",
    "description": "스토리 구조와 장면 구성",
    "prompt": "시나리오 프롬프트",
    "videoOptimization": "시나리오 영상 생성 최적화 프롬프트 (영문)"
  },
  "videoGroup": {
    "title": "영상 생성 그룹",
    "description": "최종 영상 제작을 위한 통합 프롬프트",
    "mainPrompt": "메인 영상 생성 프롬프트",
    "cutPrompts": ["컷1 프롬프트", "컷2 프롬프트", "컷3 프롬프트"],
    "videoOptimization": "통합 영상 생성 최적화 프롬프트 (영문)"
  }
}

모든 프롬프트는 일관성 있고 체계적으로 정리하여 최종 영상 제작에 최적화된 형태로 제공해주세요.`;

      const result = await googleAIService.generateText(reviewPrompt);
      
      // JSON 파싱 시도
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        // JSON 파싱 실패 시 기본 구조로 설정
        parsedResult = {
          storyGroup: {
            title: "스토리 그룹",
            description: "주요 스토리 아크와 핵심 메시지",
            prompt: result,
            videoOptimization: "Video generation optimization prompt"
          }
        };
      }
      
      // 검토 결과를 그룹별로 표시
      setGeneratedProjectData({
        reviewResult: result,
        groupedResults: parsedResult,
        finalScenario: finalResult,
        originalData: {
          story,
          videoStyle,
          visualElements,
          emotionalElements,
          storyText,
          dialogue,
          characterList,
          characterPrompt,
          scenarioPrompt,
          storySummary
        }
      });
      
      addNotification({
        type: 'success',
        title: '시나리오 생성 완료',
        message: '최종 텍스트 시나리오와 모든 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '시나리오 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };


  // 캐릭터 일괄 생성 함수
  const handleGenerateAllCharacters = async () => {
    if (characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터를 먼저 추가해주세요.',
      });
      return;
    }
    
    try {
      const allCharactersPrompt = `다음 캐릭터들을 바탕으로 통합 캐릭터 프롬프트를 생성해주세요:

캐릭터 목록:
${characterList.map((char, index) => `캐릭터${index + 1}: ${char}`).join('\n')}

영상 스타일: ${videoStyle || '애니메이션'}

다음 형식으로 생성해주세요:
- 캐릭터별 상세 설정: [각 캐릭터의 외모, 성격, 특징]
- 캐릭터 간 관계: [캐릭터들 간의 관계와 상호작용]
- 통합 디자인 가이드: [전체적인 캐릭터 디자인 방향]
- 영상 제작 최적화: [영상 제작에 필요한 캐릭터 설정]

모든 캐릭터를 종합적으로 고려한 통합 프롬프트를 생성해주세요.`;

      const result = await googleAIService.generateText(allCharactersPrompt);
      setCharacterPrompt(result);

      // 영상 생성 최적화 프롬프트도 함께 생성
      const videoPrompt = `Create an optimized video generation prompt in English for character animation:

Characters: ${characterList.join(', ')}
Style: ${videoStyle || 'Animation'}
Target: Video generation

Generate a detailed English prompt optimized for video generation that includes:
- Character visual appearance and design
- Character movements and expressions
- Animation style and quality
- Character interactions and behaviors
- Visual effects and details
- Color scheme and lighting

Format as a single, comprehensive prompt ready for video AI generation.`;

      const videoResult = await googleAIService.generateText(videoPrompt);
      setCharacterVideoPrompt(videoResult);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `총 ${characterList.length}개 캐릭터의 통합 프롬프트가 생성되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 프롬프트 생성에 실패했습니다.',
      });
    }
  };

  // 캐릭터 프롬프트 생성 (Google AI) - 넘버링 지원 (기존 함수 유지)
  const handleGenerateCharacterPrompt = async (characterIndex?: number) => {
    const targetCharacter = characterIndex !== undefined ? characterList[characterIndex] : characterInput;
    
    if (!targetCharacter?.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력해주세요.',
      });
      return;
    }
    
    try {
      const characterNumber = characterIndex !== undefined ? characterIndex + 1 : 1;
      const prompt = await googleAIService.generateCharacterPrompt(
        targetCharacter,
        videoStyle || '애니메이션'
      );
      
      // 캐릭터별 프롬프트 저장 (기존 방식 유지)
      if (characterIndex === undefined) {
      setCharacterPrompt(prompt);
      }

      // 영상 생성 최적화 프롬프트도 함께 생성
      const videoPrompt = `Create an optimized video generation prompt in English for character animation:

Character ${characterNumber}: ${targetCharacter}
Style: ${videoStyle || 'Animation'}
Target: Video generation

Generate a detailed English prompt optimized for video generation that includes:
- Character visual appearance and design
- Character movements and expressions
- Animation style and quality
- Character interactions and behaviors
- Visual effects and details
- Color scheme and lighting

Format as a single, comprehensive prompt ready for video AI generation.`;

      const videoResult = await googleAIService.generateText(videoPrompt);
      
      if (characterIndex === undefined) {
        setCharacterVideoPrompt(videoResult);
      }
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `캐릭터${characterNumber} 프롬프트와 영상 최적화 프롬프트가 생성되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 프롬프트 생성에 실패했습니다.',
      });
    }
  };

  // 시나리오 프롬프트 생성 (Google AI)
  const handleGenerateScenarioPrompt = async () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '주요 스토리 라인을 먼저 입력해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 정보를 바탕으로 시나리오 프롬프트를 생성해주세요:

주요 스토리 라인: ${story}
상세 스토리 텍스트: ${storyText || '미지정'}
주요 대사: ${dialogue || '미지정'}
영상 스타일: ${videoStyle || '미지정'}
시각적 요소: ${visualElements || '미지정'}
감정적 요소: ${emotionalElements || '미지정'}
캐릭터 목록: ${characterList.length > 0 ? characterList.join(', ') : '미지정'}

다음 형식으로 생성해주세요:
- 시나리오 구조: [전체적인 스토리 흐름과 전개]
- 캐릭터별 역할: [각 캐릭터의 역할과 특징]
- 주요 장면: [핵심 장면들과 전환점]
- 대사 활용: [대사와 나레이션의 활용 방안]
- 시각적 연출: [장면별 시각적 연출 방법]
- 감정적 흐름: [관객의 감정 변화와 몰입도]
- 영상 스타일 적용: [선택된 영상 스타일에 맞는 연출 방법]

상세 스토리 텍스트와 주요 대사를 충분히 반영하여 영상 제작에 최적화된 시나리오를 생성해주세요.`;

      const result = await googleAIService.generateText(prompt);
      setScenarioPrompt(result);

      // 영상 생성 최적화 프롬프트도 함께 생성
      const videoPrompt = `Create an optimized video generation prompt in English for scenario animation:

Main Story: ${story}
Detailed Story: ${storyText || 'Not specified'}
Dialogue: ${dialogue || 'Not specified'}
Video Style: ${videoStyle || 'Not specified'}
Visual Elements: ${visualElements || 'Not specified'}
Emotional Elements: ${emotionalElements || 'Not specified'}
Characters: ${characterList.length > 0 ? characterList.join(', ') : 'Not specified'}

Generate a detailed English prompt optimized for video generation that includes:
- Overall narrative structure and pacing
- Scene transitions and flow
- Visual storytelling elements
- Character development through visuals
- Cinematic techniques and camera work
- Mood and atmosphere
- Action sequences and key moments
- Dialogue integration and timing
- Visual style implementation
- Emotional impact and audience engagement

Format as a single, comprehensive prompt ready for video AI generation.`;

      const videoResult = await googleAIService.generateText(videoPrompt);
      setScenarioVideoPrompt(videoResult);
      
      // 시나리오 프롬프트 생성 후 500자 스토리 정리도 자동 생성
      await handleGenerateStorySummary();
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '시나리오 프롬프트, 영상 최적화 프롬프트, 500자 스토리 정리가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '시나리오 프롬프트 생성에 실패했습니다.',
      });
    }
  };

  // 스토리 정리 (500자 프롬프트)
  const handleGenerateStorySummary = async () => {
    if (!scenarioPrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '먼저 시나리오 프롬프트를 생성해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 정보를 바탕으로 500자 이내의 스토리 정리 프롬프트를 생성해주세요:

주요 스토리 라인: ${story}
시나리오 프롬프트: ${scenarioPrompt || '미생성'}
상세 스토리 텍스트: ${storyText || '미지정'}
주요 대사: ${dialogue || '미지정'}
영상 스타일: ${videoStyle || '미지정'}
시각적 요소: ${visualElements || '미지정'}
감정적 요소: ${emotionalElements || '미지정'}
캐릭터 목록: ${characterList.length > 0 ? characterList.join(', ') : '미지정'}

다음 형식으로 500자 이내로 간결하고 명확하게 정리해주세요:
- 핵심 스토리 아크: [주요 스토리 라인과 전개]
- 캐릭터 설정: [주요 캐릭터들의 역할과 특징]
- 시나리오 구조: [장면 구성과 흐름]
- 영상 스타일: [선택된 스타일과 시각적 특징]
- 감정적 메시지: [관객에게 전달할 핵심 메시지]

반드시 500자 이내로 간결하고 명확하게 작성해주세요.`;

      const result = await googleAIService.generateText(prompt);
      setStorySummary(result);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '500자 스토리 정리가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '스토리 정리 생성에 실패했습니다.',
      });
    }
  };

  // 프롬프트 수정 시작
  const handleStartEditPrompt = (type: 'character' | 'scenario') => {
    setEditingPrompts(prev => ({ ...prev, [type]: true }));
    
    // 통합 AI 검토 결과에서 현재 값을 가져와서 수정 모드로 설정
    let currentValue = '';
    if (generatedProjectData?.groupedResults) {
      if (type === 'character') {
        currentValue = generatedProjectData.groupedResults.characterGroup?.videoOptimization || characterVideoPrompt;
      } else if (type === 'scenario') {
        currentValue = generatedProjectData.groupedResults.scenarioGroup?.videoOptimization || scenarioVideoPrompt;
      }
    } else {
      // 통합 AI 검토 결과가 없으면 기존 값 사용
      currentValue = type === 'character' ? characterVideoPrompt : scenarioVideoPrompt;
    }
    
    setEditingVideoPrompts(prev => ({
      ...prev,
      [type]: currentValue
    }));
  };

  // 입력 데이터 변경 시 관련 프롬프트 초기화
  const handleInputChange = (type: 'character' | 'scenario' | 'scenarioText' | 'dialogue') => {
    // 입력이 변경되면 관련된 생성된 프롬프트들을 초기화
    if (type === 'character') {
      setCharacterPrompt('');
      setCharacterVideoPrompt('');
    } else if (type === 'scenario' || type === 'scenarioText' || type === 'dialogue') {
      setScenarioPrompt('');
      setScenarioVideoPrompt('');
      setStorySummary('');
      setFinalScenario('');
    }
    
    // 통합 AI 검토 결과도 초기화
    setGeneratedProjectData(null);
    setIsSaved(false);
  };

  // 항목별 수정 시작
  const handleStartEditItem = (type: 'character' | 'scenario') => {
    setItemEditStatus(prev => ({ ...prev, [type]: true }));
    
    // 현재 값을 수정 모드로 설정
    let currentValue = '';
    if (type === 'character') {
      currentValue = characterPrompt;
    } else if (type === 'scenario') {
      currentValue = scenarioPrompt;
    }
    
    setEditingItems(prev => ({
      ...prev,
      [type]: currentValue
    }));
  };

  // 항목별 수정 취소
  const handleCancelEditItem = (type: 'character' | 'scenario') => {
    setItemEditStatus(prev => ({ ...prev, [type]: false }));
    setEditingItems(prev => ({ ...prev, [type]: "" }));
  };

  // 항목별 수정 확정
  const handleConfirmEditItem = (type: 'character' | 'scenario') => {
    const newValue = editingItems[type];
    
    // 기존 상태 업데이트
    if (type === 'character') {
      setCharacterPrompt(newValue);
    } else if (type === 'scenario') {
      setScenarioPrompt(newValue);
    }
    
    setItemEditStatus(prev => ({ ...prev, [type]: false }));
    setEditingItems(prev => ({ ...prev, [type]: "" }));
    
    addNotification({
      type: 'success',
      title: '수정 완료',
      message: `${type === 'character' ? '캐릭터' : '시나리오'} 프롬프트가 수정되었습니다.`,
    });
  };

  // 항목별 확정
  const handleConfirmItem = (type: 'character' | 'scenario') => {
    setItemConfirmStatus(prev => ({ ...prev, [type]: true }));
    addNotification({
      type: 'success',
      title: '확정 완료',
      message: `${type === 'character' ? '캐릭터' : '시나리오'} 항목이 확정되었습니다.`,
    });
  };

  // 통합 AI 검토 결과 수정 시작
  const handleStartEditReviewResult = () => {
    setEditingReviewResult(true);
    setEditingReviewText(generatedProjectData?.reviewResult || "");
  };

  // 통합 AI 검토 결과 수정 취소
  const handleCancelEditReviewResult = () => {
    setEditingReviewResult(false);
    setEditingReviewText("");
  };

  // 통합 AI 검토 결과 수정 저장
  const handleSaveEditReviewResult = async () => {
    if (generatedProjectData) {
      // 영문 프롬프트도 함께 생성
      try {
        const englishPrompt = `Create an optimized English prompt for video generation based on the following Korean content:

${editingReviewText}

Generate a comprehensive English prompt that includes:
- Visual style and atmosphere
- Character descriptions and movements
- Scene composition and camera work
- Lighting and mood
- Action sequences and transitions
- Color palette and visual effects
- Narrative structure and pacing

Format as a single, comprehensive prompt ready for video AI generation.`;

        const englishResult = await googleAIService.generateText(englishPrompt);
        
        setGeneratedProjectData((prev: any) => ({
          ...prev,
          reviewResult: editingReviewText,
          englishPrompt: englishResult
        }));
        
        addNotification({
          type: 'success',
          title: '수정 완료',
          message: '통합 AI 검토 결과와 영문 프롬프트가 생성되었습니다.',
        });
      } catch (error) {
        setGeneratedProjectData((prev: any) => ({
          ...prev,
          reviewResult: editingReviewText
        }));
        addNotification({
          type: 'success',
          title: '수정 완료',
          message: '통합 AI 검토 결과가 수정되었습니다.',
        });
      }
    }
    setEditingReviewResult(false);
    setEditingReviewText("");
  };

  // 프롬프트 수정 취소
  const handleCancelEditPrompt = (type: 'character' | 'scenario') => {
    setEditingPrompts(prev => ({ ...prev, [type]: false }));
    setEditingVideoPrompts(prev => ({ ...prev, [type]: "" }));
  };

  // 프롬프트 수정 확정
  const handleConfirmEditPrompt = (type: 'character' | 'scenario') => {
    const newPrompt = editingVideoPrompts[type];
    
    // 기존 상태 업데이트
    if (type === 'character') {
      setCharacterVideoPrompt(newPrompt);
    } else {
      setScenarioVideoPrompt(newPrompt);
    }
    
    // 통합 AI 검토 결과도 업데이트
    if (generatedProjectData?.groupedResults) {
      setGeneratedProjectData((prev: any) => ({
        ...prev,
        groupedResults: {
          ...prev.groupedResults,
          [type === 'character' ? 'characterGroup' : 'scenarioGroup']: {
            ...prev.groupedResults[type === 'character' ? 'characterGroup' : 'scenarioGroup'],
            videoOptimization: newPrompt
          }
        }
      }));
    }
    
    setEditingPrompts(prev => ({ ...prev, [type]: false }));
    setEditingVideoPrompts(prev => ({ ...prev, [type]: "" }));
    
    addNotification({
      type: 'success',
      title: '수정 완료',
      message: `${type === 'character' ? '캐릭터' : '시나리오'} 프롬프트가 수정되었습니다.`,
    });
  };

  // 시나리오 저장
  const handleSaveScenario = () => {
    // 통합 AI 검토 결과가 있으면 저장 가능
    if (!generatedProjectData?.groupedResults) {
      addNotification({
        type: 'error',
        title: '저장 오류',
        message: '통합 AI 검토를 먼저 실행해주세요.',
      });
      return;
    }
    
    setIsSaved(true);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 개요가 성공적으로 저장되었습니다.',
    });
  };

  // 다음 단계로 이동
  const handleNextStep = () => {
    if (!isSaved) {
      addNotification({
        type: 'error',
        title: '이동 오류',
        message: '먼저 시나리오를 저장해주세요.',
      });
      return;
    }
    
    setCurrentStep("이미지 생성");
    addNotification({
      type: 'info',
      title: '단계 이동',
      message: '이미지 생성 단계로 이동했습니다.',
    });
  };

  // 그룹 완료 처리
  const handleGroupComplete = (groupType: 'story' | 'character' | 'scenario' | 'video') => {
    setGroupCompletionStatus(prev => ({ ...prev, [groupType]: true }));
    addNotification({
      type: 'success',
      title: '완료',
      message: `${groupType === 'story' ? '스토리' : groupType === 'character' ? '캐릭터' : groupType === 'scenario' ? '시나리오' : '영상'} 그룹이 완료되었습니다.`,
    });
  };

  // 그룹 수정 시작
  const handleGroupEdit = (groupType: 'story' | 'character' | 'scenario' | 'video') => {
    setGroupEditStatus(prev => ({ ...prev, [groupType]: true }));
  };

  // 그룹 수정 취소
  const handleGroupEditCancel = (groupType: 'story' | 'character' | 'scenario' | 'video') => {
    setGroupEditStatus(prev => ({ ...prev, [groupType]: false }));
  };

  // 그룹 확정
  const handleGroupConfirm = (groupType: 'story' | 'character' | 'scenario' | 'video') => {
    setGroupEditStatus(prev => ({ ...prev, [groupType]: false }));
    setGroupCompletionStatus(prev => {
      const updatedStatus = { ...prev, [groupType]: true };
      // 모든 그룹이 완료되었는지 확인
      const allCompleted = Object.values(updatedStatus).every(status => status);
      setIsAllGroupsConfirmed(allCompleted);
      return updatedStatus;
    });
    
    addNotification({
      type: 'success',
      title: '확정 완료',
      message: `${groupType === 'story' ? '스토리' : groupType === 'character' ? '캐릭터' : groupType === 'scenario' ? '시나리오' : '영상'} 그룹이 확정되었습니다.`,
    });
  };


  // 이미지 첨부 핸들러 (ImageUpload 컴포넌트에서 직접 처리하므로 제거)
  // const handleImageAttach = ...

  // 이미지 삭제 핸들러 (ImageUpload 컴포넌트에서 직접 처리하므로 제거)
  // const handleImageRemove = ...

  // 캐릭터 재생성 함수
  const handleRegenerateCharacter = async (characterId: number) => {
    try {
      const character = generatedCharacters.find(char => char.id === characterId);
      if (!character) return;

      let imagePrompt = character.description;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.character) {
        imagePrompt = generatedProjectData.imagePrompts.character;
      }
      
      // Google AI로 캐릭터 이미지 재생성
      const imageResult = await googleAIService.generateCharacterImage(imagePrompt);
      
      // 기존 캐릭터 업데이트
      setGeneratedCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? { ...char, image: imageResult, timestamp: new Date().toISOString() }
            : char
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '캐릭터 이미지가 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 이미지 재생성에 실패했습니다.',
      });
    }
  };

  // 배경 재생성 함수
  const handleRegenerateBackground = async (backgroundId: number) => {
    try {
      const background = generatedBackgrounds.find(bg => bg.id === backgroundId);
      if (!background) return;

      let imagePrompt = background.description;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.background) {
        imagePrompt = generatedProjectData.imagePrompts.background;
      }
      
      // Google AI로 배경 이미지 재생성
      const imageResult = await googleAIService.generateBackgroundImage(imagePrompt);
      
      // 기존 배경 업데이트
      setGeneratedBackgrounds(prev => 
        prev.map(bg => 
          bg.id === backgroundId 
            ? { ...bg, image: imageResult, timestamp: new Date().toISOString() }
            : bg
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '배경 이미지가 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '배경 이미지 재생성에 실패했습니다.',
      });
    }
  };

  // 설정 컷 재생성 함수
  const handleRegenerateSettingCut = async (settingId: number) => {
    try {
      const setting = generatedSettingCuts.find(cut => cut.id === settingId);
      if (!setting) {
        addNotification({
          type: 'error',
          title: '재생성 실패',
          message: '설정 컷을 찾을 수 없습니다.',
        });
        return;
      }

      let imagePrompt = setting.description;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.setting) {
        imagePrompt = generatedProjectData.imagePrompts.setting;
        addNotification({
          type: 'info',
          title: '통합 프롬프트 사용',
          message: '프로젝트 개요에서 생성된 최적화된 프롬프트를 사용합니다.',
        });
      }
      
      // Google AI로 설정 컷 이미지 재생성
      const imageResult = await googleAIService.generateSettingCutImage(imagePrompt);
      
      // 기존 설정 컷 업데이트
      setGeneratedSettingCuts(prev => 
        prev.map(cut => 
          cut.id === settingId 
            ? { ...cut, image: imageResult, timestamp: new Date().toISOString() }
            : cut
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '설정 컷이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      console.error('설정 컷 재생성 오류:', error);
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '설정 컷 재생성 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
    }
  };

  // 캐릭터 삭제 함수
  const handleDeleteCharacter = (characterId: number) => {
    setGeneratedCharacters(prev => prev.filter(char => char.id !== characterId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '캐릭터가 삭제되었습니다.',
    });
  };

  // 배경 삭제 함수
  const handleDeleteBackground = (backgroundId: number) => {
    setGeneratedBackgrounds(prev => prev.filter(bg => bg.id !== backgroundId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '배경이 삭제되었습니다.',
    });
  };

  // 설정 컷 삭제 함수
  const handleDeleteSettingCut = (settingId: number) => {
    setGeneratedSettingCuts(prev => prev.filter(cut => cut.id !== settingId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '설정 컷이 삭제되었습니다.',
    });
  };

  // 스토리/장면 텍스트 카드 생성
  const handleGenerateTextCard = async () => {
    if (!storySceneInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리/장면을 입력해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 스토리/장면을 바탕으로 영상 제작용 텍스트 카드를 생성해주세요:

스토리/장면: ${storySceneInput}

다음 형식으로 생성해주세요:
- 장면 제목: [간단한 장면명]
- 장면 설명: [장면의 핵심 내용과 분위기]
- 캐릭터 행동: [주요 캐릭터들의 행동과 움직임]
- 대사/나레이션: [핵심 대사나 나레이션]
- 시각적 요소: [카메라 워크, 색감, 조명 등]
- 감정적 톤: [관객에게 전달할 감정]

영상 제작에 최적화된 상세한 텍스트 카드를 생성해주세요.`;

      const result = await googleAIService.generateText(prompt);
      
      const newTextCard = {
        id: Date.now(),
        input: storySceneInput,
        generatedText: result,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedTextCards(prev => [...prev, newTextCard]);
      setStorySceneInput("");
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '텍스트 카드가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '텍스트 카드 생성에 실패했습니다.',
      });
    }
  };

  // 텍스트 카드 수정
  const handleEditTextCard = (cardId: number, newText: string) => {
    setGeneratedTextCards(prev => 
      prev.map(card => 
        card.id === cardId 
          ? { ...card, generatedText: newText }
          : card
      )
    );
  };

  // 텍스트 카드 삭제
  const handleDeleteTextCard = (cardId: number) => {
    setGeneratedTextCards(prev => prev.filter(card => card.id !== cardId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '텍스트 카드가 삭제되었습니다.',
    });
  };

  // 캐릭터 이미지 생성
  const handleGenerateCharacterImage = async () => {
    if (!characterOutfitInput.trim() && characterOutfitImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 + 의상 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 캐릭터 + 의상 정보를 바탕으로 이미지를 생성해주세요:

캐릭터 + 의상: ${characterOutfitInput}

캐릭터 이미지 생성에 최적화된 프롬프트를 생성해주세요.`;

      const imageResult = await googleAIService.generateCharacterImage(prompt);
      
      const newCharacterImage = {
        id: Date.now(),
        input: characterOutfitInput,
        image: imageResult,
        attachedImages: characterOutfitImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedCharacterImages(prev => [...prev, newCharacterImage]);
      setCharacterOutfitInput("");
      setCharacterOutfitImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 이미지가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성에 실패했습니다.',
      });
    }
  };

  // 캐릭터 + 의상 영상 생성
  const handleGenerateCharacterVideo = async () => {
    if (!characterOutfitInput.trim() && characterOutfitImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 + 의상 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 캐릭터 + 의상 정보를 바탕으로 영상을 생성해주세요:

캐릭터 + 의상: ${characterOutfitInput}
영상 비율: ${videoRatio}

영상 생성에 최적화된 프롬프트를 생성해주세요.`;

      // Google AI로 영상 생성 (실제 구현에서는 Google AI Video API 사용)
      const videoResult = await googleAIService.generateVideo(prompt, videoRatio);
      
      const newCharacterVideo = {
        id: Date.now(),
        input: characterOutfitInput,
        video: videoResult,
        videoRatio: videoRatio,
        attachedImages: characterOutfitImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedCharacterVideos(prev => [...prev, newCharacterVideo]);
      setCharacterOutfitInput("");
      setCharacterOutfitImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 영상이 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 영상 생성에 실패했습니다.',
      });
    }
  };

  // 캐릭터 영상 재생성
  const handleRegenerateCharacterVideo = async (videoId: number) => {
    try {
      const video = generatedCharacterVideos.find(v => v.id === videoId);
      if (!video) return;

      const prompt = `다음 캐릭터 + 의상 정보를 바탕으로 영상을 재생성해주세요:

캐릭터 + 의상: ${video.input}
영상 비율: ${video.videoRatio}

영상 생성에 최적화된 프롬프트를 생성해주세요.`;

      const videoResult = await googleAIService.generateVideo(prompt, video.videoRatio);
      
      setGeneratedCharacterVideos(prev => 
        prev.map(v => 
          v.id === videoId 
            ? { ...v, video: videoResult, timestamp: new Date().toISOString() }
            : v
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '캐릭터 영상이 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 영상 재생성에 실패했습니다.',
      });
    }
  };

  // 캐릭터 영상 삭제
  const handleDeleteCharacterVideo = (videoId: number) => {
    setGeneratedCharacterVideos(prev => prev.filter(v => v.id !== videoId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '캐릭터 영상이 삭제되었습니다.',
    });
  };

  // 영상용 배경 생성
  const handleGenerateVideoBackground = async () => {
    if (!videoBackgroundInput.trim() && videoBackgroundImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      const prompt = `다음 배경 정보를 바탕으로 배경을 생성해주세요:

배경 설명: ${videoBackgroundInput}

배경 생성에 최적화된 프롬프트를 생성해주세요.`;

      const imageResult = await googleAIService.generateBackgroundImage(prompt);
      
      const newBackground = {
        id: Date.now(),
        input: videoBackgroundInput,
        image: imageResult,
        attachedImages: videoBackgroundImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedVideoBackgrounds(prev => [...prev, newBackground]);
      setVideoBackgroundInput("");
      setVideoBackgroundImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '배경이 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 생성에 실패했습니다.',
      });
    }
  };

  // 영상용 배경 재생성
  const handleRegenerateVideoBackground = async (backgroundId: number) => {
    try {
      const background = generatedVideoBackgrounds.find(bg => bg.id === backgroundId);
      if (!background) return;

      const prompt = `다음 배경 정보를 바탕으로 배경을 재생성해주세요:

배경 설명: ${background.input}

배경 생성에 최적화된 프롬프트를 생성해주세요.`;

      const imageResult = await googleAIService.generateBackgroundImage(prompt);
      
      setGeneratedVideoBackgrounds(prev => 
        prev.map(bg => 
          bg.id === backgroundId 
            ? { ...bg, image: imageResult, timestamp: new Date().toISOString() }
            : bg
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '배경이 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '배경 재생성에 실패했습니다.',
      });
    }
  };

  // 영상용 배경 삭제
  const handleDeleteVideoBackground = (backgroundId: number) => {
    setGeneratedVideoBackgrounds(prev => prev.filter(bg => bg.id !== backgroundId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '배경이 삭제되었습니다.',
    });
  };

  // 체크박스 토글 함수들
  const toggleTextCardCheck = (cardId: number) => {
    setCheckedTextCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleCharacterImageCheck = (imageId: number) => {
    setCheckedCharacterImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const toggleBackgroundCheck = (backgroundId: number) => {
    setCheckedBackgrounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(backgroundId)) {
        newSet.delete(backgroundId);
      } else {
        newSet.add(backgroundId);
      }
      return newSet;
    });
  };

  // 영상 썸네일 생성
  const handleGenerateVideoThumbnail = async () => {
    const selectedTextCards = generatedTextCards.filter(card => checkedTextCards.has(card.id));
    const selectedCharacterImages = generatedCharacterImages.filter(img => checkedCharacterImages.has(img.id));
    const selectedBackgrounds = generatedVideoBackgrounds.filter(bg => checkedBackgrounds.has(bg.id));

    if (selectedTextCards.length === 0 || selectedCharacterImages.length === 0 || selectedBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '각 카테고리에서 최소 1개씩 선택해주세요.',
      });
      return;
    }

    try {
      const prompt = `다음 선택된 요소들을 바탕으로 영상 썸네일을 생성해주세요:

선택된 텍스트 카드: ${selectedTextCards.map(card => card.generatedText).join('\n\n')}
선택된 캐릭터 이미지: ${selectedCharacterImages.map(img => img.input).join(', ')}
선택된 배경: ${selectedBackgrounds.map(bg => bg.input).join(', ')}
영상 비율: ${videoRatio}

선택된 모든 요소를 통합하여 영상 썸네일을 생성해주세요.`;

      const thumbnailResult = await googleAIService.generateVideo(prompt, videoRatio);
      
      const newThumbnail = {
        id: Date.now(),
        textCards: selectedTextCards,
        characterImages: selectedCharacterImages,
        backgrounds: selectedBackgrounds,
        thumbnail: thumbnailResult,
        videoRatio: videoRatio,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedVideos(prev => [...prev, newThumbnail]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '영상 썸네일이 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '영상 썸네일 생성에 실패했습니다.',
      });
    }
  };

  // AI 영상 생성 (통합)
  const handleGenerateAIVideo = async () => {
    // 체크된 항목들만 선택
    const selectedTextCards = generatedTextCards.filter(card => checkedTextCards.has(card.id));
    const selectedCharacterImages = generatedCharacterImages.filter(img => checkedCharacterImages.has(img.id));
    const selectedBackgrounds = generatedVideoBackgrounds.filter(bg => checkedBackgrounds.has(bg.id));

    if (selectedTextCards.length === 0 || selectedCharacterImages.length === 0 || selectedBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '각 카테고리에서 최소 1개씩 선택해주세요.',
      });
      return;
    }
    
    try {
      // 프로젝트 개요에서 생성된 텍스트 참조
      const projectTexts = [];
      if (characterPrompt) projectTexts.push(`캐릭터 프롬프트: ${characterPrompt}`);
      if (scenarioPrompt) projectTexts.push(`시나리오 프롬프트: ${scenarioPrompt}`);
      if (storySummary) projectTexts.push(`스토리 요약: ${storySummary}`);
      if (finalScenario || generatedProjectData?.finalScenario) {
        projectTexts.push(`최종 시나리오: ${finalScenario || generatedProjectData?.finalScenario}`);
      }

      // AI 검토 결과 참조
      const aiReviewTexts = [];
      if (generatedProjectData?.groupedResults) {
        const { characterGroup, scenarioGroup, videoGroup } = generatedProjectData.groupedResults;
        if (characterGroup?.videoOptimization) aiReviewTexts.push(`캐릭터 영상 최적화: ${characterGroup.videoOptimization}`);
        if (scenarioGroup?.videoOptimization) aiReviewTexts.push(`시나리오 영상 최적화: ${scenarioGroup.videoOptimization}`);
        if (videoGroup?.videoOptimization) aiReviewTexts.push(`통합 영상 최적화: ${videoGroup.videoOptimization}`);
      }

      const prompt = `다음 선택된 요소들과 프로젝트 개요 텍스트를 바탕으로 컷별 영상을 생성해주세요:

=== 프로젝트 개요 텍스트 ===
${projectTexts.join('\n\n')}

=== AI 검토 결과 ===
${aiReviewTexts.join('\n\n')}

=== 선택된 스토리/장면 (컷별) ===
${selectedTextCards.map((card, index) => `컷 ${index + 1}: ${card.generatedText}`).join('\n\n')}

=== 선택된 캐릭터 이미지 ===
${selectedCharacterImages.map(img => img.input).join(', ')}

=== 선택된 배경 ===
${selectedBackgrounds.map(bg => bg.input).join(', ')}

=== 영상 설정 ===
영상 비율: ${videoRatio}

위의 모든 정보를 통합하여 각 컷별로 완성된 영상을 생성해주세요.`;

      const videoResult = await googleAIService.generateVideo(prompt, videoRatio);
      
      const newVideo = {
        id: Date.now(),
        textCards: selectedTextCards,
        characterImages: selectedCharacterImages,
        backgrounds: selectedBackgrounds,
        projectTexts: projectTexts,
        aiReviewTexts: aiReviewTexts,
        video: videoResult,
        videoRatio: videoRatio,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedVideos(prev => [...prev, newVideo]);
      
      addNotification({
        type: 'success',
        title: '영상 생성 완료',
        message: '선택된 요소들을 바탕으로 AI 영상이 성공적으로 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '영상 생성 실패',
        message: '영상 생성 중 오류가 발생했습니다.',
      });
    }
  };

  // 캐릭터 AI 이미지 생성 (Google AI + 통합 프롬프트 활용)
  const handleGenerateCharacter = async () => {
    if (!characterInput.trim() && attachedCharacterImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      let imagePrompt = characterInput;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.character) {
        imagePrompt = generatedProjectData.imagePrompts.character;
        addNotification({
          type: 'info',
          title: '통합 프롬프트 사용',
          message: '프로젝트 개요에서 생성된 최적화된 프롬프트를 사용합니다.',
        });
      }
      
      // Google AI로 캐릭터 이미지 생성
      const imageResult = await googleAIService.generateCharacterImage(imagePrompt);
      
      const newCharacter = {
        id: Date.now(),
        description: characterInput,
        image: imageResult, // Google AI 생성 결과
        attachedImages: attachedCharacterImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedCharacters(prev => [...prev, newCharacter]);
      setCharacterInput("");
      setAttachedCharacterImages([]);
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 이미지가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성에 실패했습니다.',
      });
    }
  };

  // 배경 AI 이미지 생성 (Google AI + 통합 프롬프트 활용)
  const handleGenerateBackground = async () => {
    if (!backgroundInput.trim() && attachedBackgroundImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      let imagePrompt = backgroundInput;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.background) {
        imagePrompt = generatedProjectData.imagePrompts.background;
        addNotification({
          type: 'info',
          title: '통합 프롬프트 사용',
          message: '프로젝트 개요에서 생성된 최적화된 프롬프트를 사용합니다.',
        });
      }
      
      // Google AI로 배경 이미지 생성
      const imageResult = await googleAIService.generateBackgroundImage(imagePrompt);
      
      const newBackground = {
        id: Date.now(),
        description: backgroundInput,
        image: imageResult, // Google AI 생성 결과
        attachedImages: attachedBackgroundImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedBackgrounds(prev => [...prev, newBackground]);
      setBackgroundInput("");
      setAttachedBackgroundImages([]);
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '배경 이미지가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 이미지 생성에 실패했습니다.',
      });
    }
  };

  // 설정 컷 생성 (Google AI + 통합 프롬프트 활용)
  const handleGenerateSettingCut = async () => {
    if (!settingCut.trim() && attachedSettingImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '설정 컷 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    try {
      let imagePrompt = settingCut;
      
      // 통합된 프롬프트가 있으면 사용, 없으면 기본 프롬프트 사용
      if (generatedProjectData?.imagePrompts?.setting) {
        imagePrompt = generatedProjectData.imagePrompts.setting;
        addNotification({
          type: 'info',
          title: '통합 프롬프트 사용',
          message: '프로젝트 개요에서 생성된 최적화된 프롬프트를 사용합니다.',
        });
      }
      
      // Google AI로 설정 컷 이미지 생성
      const imageResult = await googleAIService.generateSettingCutImage(imagePrompt);
      
      const newSettingCut = {
        id: Date.now(),
        description: settingCut,
        image: imageResult, // Google AI 생성 결과
        attachedImages: attachedSettingImages,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedSettingCuts(prev => [...prev, newSettingCut]);
      setSettingCut("");
      setAttachedSettingImages([]);
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '설정 컷이 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '설정 컷 생성에 실패했습니다.',
      });
    }
  };

  // 컷별 영상 생성 (Google AI)
  const handleGenerateCut = async () => {
    if (!textScenario.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '텍스트 시나리오를 입력해주세요.',
      });
      return;
    }
    
    try {
      // Google AI로 영상 생성
      const videoPrompt = `${textScenario}\n\n캐릭터+의상: ${characterOutfit}\n추가 요소: ${additionalElements}`;
      const videoResult = await googleAIService.generateVideo(videoPrompt, videoRatio);
      
      const newCut = {
        id: Date.now(),
        cutNumber: currentCutIndex + 1,
        textScenario: textScenario,
        characterOutfit: characterOutfit,
        additionalElements: additionalElements,
        attachedCharacterOutfitImages: attachedCharacterOutfitImages,
        attachedAdditionalImages: attachedAdditionalImages,
        video: videoResult, // Google AI 생성 결과
        videoRatio: videoRatio,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedCuts(prev => {
        const updatedCuts = [...prev, newCut];
        // 컷 번호별로 정렬
        return updatedCuts.sort((a, b) => a.cutNumber - b.cutNumber);
      });
      setCurrentCutIndex(prev => prev + 1);
      setTextScenario("");
      setCharacterOutfit("");
      setAdditionalElements("");
      setAttachedCharacterOutfitImages([]);
      setAttachedAdditionalImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `컷 ${currentCutIndex + 1} 영상이 생성되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '영상 생성에 실패했습니다.',
      });
    }
  };


  // 이전 컷으로 이동
  const handlePreviousCut = () => {
    if (currentCutIndex > 0) {
      setCurrentCutIndex(prev => prev - 1);
    }
  };

  // 다음 컷으로 이동
  const handleNextCutNavigation = () => {
    if (currentCutIndex < cutCount - 1) {
      setCurrentCutIndex(prev => prev + 1);
    } else {
      addNotification({
        type: 'info',
        title: '완료',
        message: '마지막 컷입니다.',
      });
    }
  };

  // 프로젝트 영상 저장
  const handleSaveProject = () => {
    if (generatedCuts.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 오류',
        message: '생성된 영상이 없습니다.',
      });
      return;
    }
    
    setIsProjectSaved(true);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 영상이 저장되었습니다.',
    });
  };

  const handleDeleteCut = (cutId: number) => {
    setGeneratedCuts(prev => {
      const filteredCuts = prev.filter(cut => cut.id !== cutId);
      // 삭제 후 컷 번호 재정렬
      return filteredCuts.map((cut, index) => ({
        ...cut,
        cutNumber: index + 1
      }));
    });
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '컷이 삭제되었습니다.',
    });
  };

  // 페이지네이션 함수들
  const getTotalPages = () => Math.ceil(generatedCuts.length / itemsPerPage);
  
  const getCurrentPageCuts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return generatedCuts.slice(startIndex, endIndex);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 다운로드 핸들러
  const handleDownload = async (type: 'character' | 'background' | 'setting' | 'cut', id: number, name: string, data?: any) => {
    try {
      let success = false;
      
      switch (type) {
        case 'character':
          // 캐릭터 이미지 다운로드
          if (data?.image && data.image.startsWith('data:image')) {
            success = downloadBase64Image(data.image, `${name}.jpg`);
          } else {
            // 텍스트인 경우 텍스트 파일로 다운로드
            success = downloadText(data?.image || '이미지 데이터 없음', `${name}.txt`);
          }
          break;
          
        case 'background':
          // 배경 이미지 다운로드
          if (data?.image && data.image.startsWith('data:image')) {
            success = downloadBase64Image(data.image, `${name}.jpg`);
          } else {
            success = downloadText(data?.image || '이미지 데이터 없음', `${name}.txt`);
          }
          break;
          
        case 'setting':
          // 설정 컷 이미지 다운로드
          if (data?.image && data.image.startsWith('data:image')) {
            success = downloadBase64Image(data.image, `${name}.jpg`);
          } else {
            success = downloadText(data?.image || '이미지 데이터 없음', `${name}.txt`);
          }
          break;
          
        case 'cut':
          // 영상 다운로드 (비동기 처리)
          if (data?.video && data.video.startsWith('http')) {
            success = await downloadVideo(data.video, `${name}.mp4`);
          } else {
            success = downloadText(data?.video || '영상 데이터 없음', `${name}.txt`);
          }
          break;
          
        default:
          console.log(`다운로드: ${type} - ${id} - ${name}`);
          success = true;
      }
      
      if (success) {
        addNotification({
          type: 'success',
          title: '다운로드 완료',
          message: `${name}이 다운로드되었습니다.`,
        });
      } else {
        addNotification({
          type: 'error',
          title: '다운로드 실패',
          message: '파일 다운로드에 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('다운로드 오류:', error);
      addNotification({
        type: 'error',
        title: '다운로드 오류',
        message: '파일 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 상단 헤더 */}
      <header className="w-full bg-white shadow-md px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎬 AI 영상 프로젝트</h1>

        <nav className="flex gap-2">
          {mainSteps.map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentStep === step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {step}
            </button>
          ))}
        </nav>

        <div className="flex gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" onClick={handleLogout}>로그아웃</Button>
              <Button variant="outline" size="sm">설정</Button>
              <Button variant="outline" size="sm">저장</Button>
              <Button size="sm">내보내기</Button>
            </>
          ) : (
            <Button size="sm" onClick={handleLogin}>로그인</Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 - 입력 및 제어 */}
        <aside className="w-80 bg-white border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{currentStep}</h2>
          
          {currentStep === "프로젝트 개요" && (
            <div className="space-y-6">
              {/* 스토리 기본 설정 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">1. 스토리 기본 설정</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주요 스토리 라인 (300자 이내)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="주요 스토리 라인을 간결하게 입력하세요 (300자 이내)"
                    rows={3}
                    maxLength={300}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {story.length}/300자
                </div>
              </div>

                {/* 영상 스타일 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">영상 스타일</label>
                  <select
                    value={videoStyle}
                    onChange={(e) => setVideoStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">스타일을 선택하세요</option>
                    <option value="2D 애니메이션">2D 애니메이션</option>
                    <option value="3D 애니메이션">3D 애니메이션</option>
                    <option value="실사">실사</option>
                    <option value="픽사 스타일">픽사 스타일</option>
                    <option value="일본 애니메이션">일본 애니메이션</option>
                    <option value="펜화">펜화</option>
                    <option value="연필화">연필화</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                
                {/* 시각적 요소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시각적 요소</label>
                  <textarea
                    value={visualElements}
                    onChange={(e) => setVisualElements(e.target.value)}
                    placeholder="색감, 조명, 구도, 카메라 워크 등 시각적 특징을 입력하세요"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* 감정적 요소 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">감정적 요소</label>
                  <textarea
                    value={emotionalElements}
                    onChange={(e) => setEmotionalElements(e.target.value)}
                    placeholder="분위기, 톤, 감정적 메시지, 관객에게 전달하고자 하는 감정을 입력하세요"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
              </div>

              {/* 캐릭터 설정 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">2. 캐릭터 설정</h3>
                
                {/* 캐릭터 추가 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={characterInput}
                      onChange={(e) => setCharacterInput(e.target.value)}
                      placeholder="캐릭터 설명을 입력하세요"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (characterInput.trim()) {
                          setCharacterList(prev => [...prev, characterInput.trim()]);
                          setCharacterInput("");
                          handleInputChange('character');
                        }
                      }}
                    >
                      추가
                </Button>
                </div>
                  
                  {/* 캐릭터 목록 */}
                  {characterList.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-600">캐릭터 목록</h4>
                      {characterList.map((char, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">캐릭터{index + 1}: {char}</span>
                          <button
                            onClick={() => {
                              setCharacterList(prev => prev.filter((_, i) => i !== index));
                              handleInputChange('character');
                            }}
                            className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 캐릭터 일괄 생성 버튼 */}
                  {characterList.length > 0 && (
                    <Button 
                      className="w-full mt-3" 
                      onClick={() => handleGenerateAllCharacters()}
                    >
                      캐릭터 일괄 AI 생성
                </Button>
                  )}
                </div>
              </div>

              {/* 시나리오 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">3. 시나리오 생성</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상세 스토리 텍스트</label>
                  <textarea
                    value={storyText}
                    onChange={(e) => {
                      setStoryText(e.target.value);
                      handleInputChange('scenarioText');
                    }}
                    placeholder="상세 스토리 텍스트를 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주요 대사</label>
                  <textarea
                    value={dialogue}
                    onChange={(e) => {
                      setDialogue(e.target.value);
                      handleInputChange('dialogue');
                    }}
                    placeholder="주요 대사나 나레이션을 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <Button className="w-full" onClick={handleGenerateScenarioPrompt}>
                  시나리오용 프롬프트 AI 생성
                </Button>
              </div>


              {/* 통합 AI 검토 및 시나리오 생성 */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <span className="text-green-600">🔍</span>
                  통합 AI 검토 및 시나리오 생성
                </h3>
                <p className="text-sm text-gray-600">
                  모든 입력 정보를 검토하고 최종 텍스트 시나리오를 생성합니다.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
                  onClick={handleGenerateAllPrompts}
                  disabled={isGeneratingAll || !(itemConfirmStatus.character && itemConfirmStatus.scenario)}
                >
                  {isGeneratingAll ? 'AI 검토 중...' : '🔍 통합 AI 검토 및 시나리오 생성'}
                </Button>
                
                {!(itemConfirmStatus.character && itemConfirmStatus.scenario) && (
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    모든 항목(캐릭터, 시나리오)을 확정한 후 사용 가능합니다.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {currentStep === "이미지 생성" && (
            <div className="space-y-6">

              {/* 캐릭터 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">캐릭터 생성</h3>
                <textarea
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="캐릭터 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <ImageUpload
                  onImagesChange={setAttachedCharacterImages}
                  attachedImages={attachedCharacterImages}
                  maxImages={5}
                  className="mt-3"
                />
                
                <Button className="w-full" onClick={handleGenerateCharacter}>
                  캐릭터 생성
                </Button>
              </div>
              
              {/* 배경 설정 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">배경 설정</h3>
                <textarea
                  value={backgroundInput}
                  onChange={(e) => setBackgroundInput(e.target.value)}
                  placeholder="배경 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <ImageUpload
                  onImagesChange={setAttachedBackgroundImages}
                  attachedImages={attachedBackgroundImages}
                  maxImages={5}
                  className="mt-3"
                />
                
                <Button className="w-full" onClick={handleGenerateBackground}>
                  배경 생성
                </Button>
              </div>
              
              {/* 설정 컷 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">설정 컷</h3>
                <textarea
                  value={settingCut}
                  onChange={(e) => setSettingCut(e.target.value)}
                  placeholder="설정 컷 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <ImageUpload
                  onImagesChange={setAttachedSettingImages}
                  attachedImages={attachedSettingImages}
                  maxImages={5}
                  className="mt-3"
                />
                
                <Button className="w-full" onClick={handleGenerateSettingCut}>
                  설정 컷 생성
                </Button>
              </div>

              {/* 생성된 텍스트 참조 버튼 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">📝 생성된 텍스트</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTextResults(!showTextResults)}
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  {showTextResults ? '숨기기' : '보기'}
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === "영상 생성" && (
            <div className="space-y-6">
              {/* 영상 비율 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">영상 비율</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setVideoRatio("16:9")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "16:9"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    16:9
                  </button>
                  <button
                    onClick={() => setVideoRatio("1:1")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "1:1"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setVideoRatio("9:16")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "9:16"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    9:16
                  </button>
                </div>
              </div>

              {/* 1. 스토리/장면 입력 - 컷별 텍스트 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">1. 스토리/장면 입력 (컷별 텍스트 생성)</h3>
                <textarea
                  value={storySceneInput}
                  onChange={(e) => setStorySceneInput(e.target.value)}
                  placeholder="스토리나 장면을 입력하세요 (컷별로 텍스트 카드가 생성됩니다)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button className="w-full" onClick={handleGenerateTextCard}>
                  AI 생성
                </Button>
              </div>

              {/* 2. 캐릭터 + 의상 + 이미지 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">2. 캐릭터 + 의상 + 이미지</h3>
                <textarea
                  value={characterOutfitInput}
                  onChange={(e) => setCharacterOutfitInput(e.target.value)}
                  placeholder="캐릭터와 의상을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <ImageUpload
                  onImagesChange={setCharacterOutfitImages}
                  attachedImages={characterOutfitImages}
                  maxImages={5}
                  className="mt-3"
                />
                
                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={handleGenerateCharacterImage}>
                    이미지 생성
                  </Button>
                  <Button variant="outline" className="flex-1">
                    입력
                  </Button>
                </div>
              </div>

              {/* 3. 배경 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">3. 배경 생성</h3>
                <textarea
                  value={videoBackgroundInput}
                  onChange={(e) => setVideoBackgroundInput(e.target.value)}
                  placeholder="배경 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <ImageUpload
                  onImagesChange={setVideoBackgroundImages}
                  attachedImages={videoBackgroundImages}
                  maxImages={5}
                  className="mt-3"
                />
                
                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={handleGenerateVideoBackground}>
                    AI 생성
                  </Button>
                  <Button variant="outline" className="flex-1">
                    입력
                  </Button>
                </div>
              </div>

              {/* AI 영상 생성 */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <span className="text-purple-600">🎬</span>
                  AI 영상 생성
                </h3>
                <p className="text-sm text-gray-600">
                  모든 요소를 통합하여 최종 영상을 생성합니다.
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                  onClick={handleGenerateAIVideo}
                  disabled={checkedTextCards.size === 0 || checkedCharacterImages.size === 0 || checkedBackgrounds.size === 0}
                >
                  🎬 AI 영상 생성
                </Button>
                
                {(checkedTextCards.size === 0 || checkedCharacterImages.size === 0 || checkedBackgrounds.size === 0) && (
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    각 카테고리에서 최소 1개씩 선택한 후 사용 가능합니다.
                  </div>
                )}
              </div>

              {/* 생성된 텍스트 참조 버튼 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">📝 생성된 텍스트</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTextResults(!showTextResults)}
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  {showTextResults ? '숨기기' : '보기'}
                </Button>
              </div>

            </div>
          )}
        </aside>

        {/* 메인 Canvas - 결과 표시 */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">생성 결과</h2>
            
            {currentStep === "프로젝트 개요" && (
              <div className="space-y-6">

                {/* 캐릭터 설정 프롬프트 - 통합 AI 검토 결과 반영 */}
                {generatedProjectData?.groupedResults?.characterGroup && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">캐릭터 설정 프롬프트</h3>
                    <div className="bg-green-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.prompt}</pre>
                    </div>
                    
                    {/* 영상 최적화 프롬프트 */}
                    {generatedProjectData.groupedResults.characterGroup.videoOptimization && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">영상 생성 최적화 프롬프트 (영문)</h4>
                          {!editingPrompts.character && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEditPrompt('character')}
                            >
                              수정
                            </Button>
                          )}
                        </div>
                        
                        {editingPrompts.character ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingVideoPrompts.character}
                              onChange={(e) => setEditingVideoPrompts(prev => ({ ...prev, character: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={6}
                            />
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleConfirmEditPrompt('character')}
                              >
                                확정
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEditPrompt('character')}
                              >
                                취소
                              </Button>
                    </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.videoOptimization}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 정리된 스토리 - 500자 스토리 정리 */}
                {storySummary && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 text-purple-600">📝 정리된 스토리 (500자)</h3>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{storySummary}</pre>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">글자 수: {storySummary.length}/500자</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // 스토리 정리 수정 기능 (추후 구현 가능)
                          console.log('스토리 정리 수정');
                        }}
                        className="text-purple-600 border-purple-300"
                      >
                        수정
                      </Button>
                    </div>
                  </div>
                )}

                {/* 항목별 카드 - 수정/확정-취소/저장 */}
                {(characterPrompt || scenarioPrompt) && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-800">📋 항목별 카드</h3>
                    

                    {/* 캐릭터 카드 */}
                {characterPrompt && (
                  <div className="bg-white rounded-lg border p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-medium text-green-600">👥 캐릭터 프롬프트</h4>
                          <div className="flex gap-2">
                            {!itemEditStatus.character ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartEditItem('character')}
                                  className="text-green-600 border-green-300"
                                >
                                  수정
                                </Button>
                                {!itemConfirmStatus.character && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmItem('character')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    확정
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmEditItem('character')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  저장
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelEditItem('character')}
                                >
                                  취소
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {itemEditStatus.character ? (
                          <textarea
                            value={editingItems.character}
                            onChange={(e) => setEditingItems(prev => ({ ...prev, character: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={8}
                          />
                        ) : (
                          <div className="bg-green-50 p-4 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{characterPrompt}</pre>
                    </div>
                        )}
                        
                        {itemConfirmStatus.character && (
                          <div className="mt-2 text-xs text-green-600 font-medium">
                            ✅ 확정됨
                          </div>
                        )}
                  </div>
                )}

                    {/* 시나리오 카드 */}
                {scenarioPrompt && (
                      <div className="bg-white rounded-lg border p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-medium text-purple-600">📝 시나리오 프롬프트</h4>
                          <div className="flex gap-2">
                            {!itemEditStatus.scenario ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStartEditItem('scenario')}
                                  className="text-purple-600 border-purple-300"
                                >
                                  수정
                                </Button>
                                {!itemConfirmStatus.scenario && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmItem('scenario')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    확정
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmEditItem('scenario')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  저장
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelEditItem('scenario')}
                                >
                                  취소
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {itemEditStatus.scenario ? (
                          <textarea
                            value={editingItems.scenario}
                            onChange={(e) => setEditingItems(prev => ({ ...prev, scenario: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={8}
                          />
                        ) : (
                          <div className="bg-purple-50 p-4 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{scenarioPrompt}</pre>
                          </div>
                        )}
                        
                        {itemConfirmStatus.scenario && (
                          <div className="mt-2 text-xs text-green-600 font-medium">
                            ✅ 확정됨
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 시나리오 항목 - 왼쪽 입력 내용으로 채우기 */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">시나리오 항목</h3>
                  
                  {/* 상세 스토리 텍스트 */}
                  {storyText && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">상세 스토리 텍스트</h4>
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">{storyText}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 주요 대사 */}
                  {dialogue && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">주요 대사</h4>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">{dialogue}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 생성된 시나리오 프롬프트 - 통합 AI 검토 결과 반영 */}
                  {generatedProjectData?.groupedResults?.scenarioGroup && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">생성된 시나리오 프롬프트</h4>
                    <div className="bg-purple-50 p-4 rounded-md">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.prompt}</pre>
                      </div>
                    </div>
                  )}
                  
                  {/* 영상 최적화 프롬프트 - 통합 AI 검토 결과 반영 */}
                  {generatedProjectData?.groupedResults?.scenarioGroup?.videoOptimization && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-700">영상 생성 최적화 프롬프트 (영문)</h4>
                        {!editingPrompts.scenario && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditPrompt('scenario')}
                          >
                            수정
                          </Button>
                        )}
                      </div>
                      
                      {editingPrompts.scenario ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingVideoPrompts.scenario}
                            onChange={(e) => setEditingVideoPrompts(prev => ({ ...prev, scenario: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={6}
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmEditPrompt('scenario')}
                            >
                              확정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelEditPrompt('scenario')}
                            >
                              취소
                            </Button>
                    </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.videoOptimization}</pre>
                        </div>
                      )}
                  </div>
                )}

                  {/* 입력 내용이 없을 때 안내 */}
                  {!storyText && !dialogue && !generatedProjectData?.groupedResults?.scenarioGroup && (
                    <div className="text-center text-gray-500 py-8">
                      <p>좌측에서 상세 스토리 텍스트와 주요 대사를 입력하고 통합 AI 검토를 클릭하세요.</p>
                    </div>
                  )}
                </div>

                {/* 영상 생성 프롬프트 - 통합 AI 검토 결과 반영 */}
                {generatedProjectData?.groupedResults?.videoGroup && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">영상 생성 프롬프트</h3>
                    
                    {/* 메인 영상 생성 프롬프트 */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">메인 영상 생성 프롬프트</h4>
                      <div className="bg-orange-50 p-4 rounded-md">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.mainPrompt}</pre>
                      </div>
                      </div>
                    
                    {/* 컷별 영상 프롬프트 */}
                    {generatedProjectData.groupedResults.videoGroup.cutPrompts && generatedProjectData.groupedResults.videoGroup.cutPrompts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">컷별 영상 프롬프트</h4>
                        <div className="space-y-2">
                          {generatedProjectData.groupedResults.videoGroup.cutPrompts.map((cut: string, index: number) => (
                            <div key={index} className="bg-yellow-50 p-3 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-yellow-700">컷 {index + 1}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // 컷별 수정 기능 (추후 구현 가능)
                                    console.log(`컷 ${index + 1} 수정`);
                                  }}
                                  className="text-xs"
                                >
                                  수정
                                </Button>
                      </div>
                              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{cut}</pre>
                            </div>
                          ))}
                    </div>
                  </div>
                )}

                    {/* 영상 생성 최적화 프롬프트 */}
                    {generatedProjectData.groupedResults.videoGroup.videoOptimization && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">영상 생성 최적화 프롬프트 (영문)</h4>
                          {!editingPrompts.scenario && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // 영상 최적화 프롬프트 수정 (추후 구현 가능)
                                console.log('영상 최적화 프롬프트 수정');
                              }}
                            >
                              수정
                            </Button>
                          )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.videoOptimization}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 캐릭터별 카드 */}
                {characterList.length > 0 && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 text-green-600">👥 캐릭터별 카드</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {characterList.map((char, index) => (
                        <div key={index} className="bg-green-50 rounded-lg border border-green-200 p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-green-800">캐릭터 {index + 1}</h4>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // 캐릭터 수정 기능 (추후 구현 가능)
                                  console.log(`캐릭터 ${index + 1} 수정`);
                                }}
                                className="text-green-600 border-green-300 text-xs"
                              >
                                수정
                              </Button>
                              <button
                                onClick={() => setCharacterList(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-green-600 mb-3">{char}</p>
                          <div className="space-y-2">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1 text-xs">캐릭터 설정</h5>
                              <div className="bg-white p-2 rounded border text-xs">
                                <p className="text-gray-700">상세 설정이 필요합니다.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 시나리오 항목별 카드 */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-medium mb-4 text-purple-600">📝 시나리오 항목별 카드</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 스토리 카드 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                      <h4 className="font-medium text-blue-800 mb-2">📖 스토리</h4>
                      <div className="space-y-2">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">주요 스토리 라인</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{story || '입력되지 않음'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">영상 스타일</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{videoStyle || '미지정'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">시각적 요소</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{visualElements || '미지정'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">감정적 요소</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{emotionalElements || '미지정'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 시나리오 카드 */}
                    <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                      <h4 className="font-medium text-purple-800 mb-2">📝 시나리오</h4>
                      <div className="space-y-2">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">상세 스토리 텍스트</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{storyText || '입력되지 않음'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">주요 대사</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{dialogue || '입력되지 않음'}</p>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1 text-xs">캐릭터 목록</h5>
                          <div className="bg-white p-2 rounded border text-xs">
                            <p className="text-gray-700">{characterList.length > 0 ? characterList.join(', ') : '입력되지 않음'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


                {/* 최종 텍스트 시나리오 */}
                {(finalScenario || generatedProjectData?.finalScenario) && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 text-orange-600">🎬 최종 텍스트 시나리오</h3>
                    <div className="bg-orange-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {finalScenario || generatedProjectData?.finalScenario}
                      </pre>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        글자 수: {(finalScenario || generatedProjectData?.finalScenario || '').length}자
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // 최종 시나리오 수정 기능 (추후 구현 가능)
                          console.log('최종 시나리오 수정');
                        }}
                        className="text-orange-600 border-orange-300"
                      >
                        수정
                      </Button>
                    </div>
                  </div>
                )}

                {/* 3단계 카드 - 통합 AI 검토 결과 */}
                {generatedProjectData?.groupedResults && (
                  <div className="space-y-6">
                    {/* 1단계: 캐릭터 */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      {/* 캐릭터 카드 */}
                      {generatedProjectData.groupedResults.characterGroup && (
                        <div className="bg-white rounded-lg border p-6">
                          <h3 className="text-lg font-medium mb-4 text-green-600">👥 캐릭터</h3>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">캐릭터 프롬프트</h4>
                              <div className="bg-green-50 p-3 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.prompt}</pre>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">영상 최적화 프롬프트</h4>
                              <div className="bg-gray-50 p-3 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.videoOptimization}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2단계: 시나리오 */}
                    {generatedProjectData.groupedResults.scenarioGroup && (
                      <div className="bg-white rounded-lg border p-6">
                        <h3 className="text-lg font-medium mb-4 text-purple-600">📝 시나리오</h3>
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">시나리오 프롬프트</h4>
                            <div className="bg-purple-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.prompt}</pre>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">영상 최적화 프롬프트</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.videoOptimization}</pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3단계: 영상 생성 프롬프트 */}
                    {generatedProjectData.groupedResults.videoGroup && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 text-orange-600">🎬 영상 생성 프롬프트</h3>
                    <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">메인 영상 생성 프롬프트</h4>
                            <div className="bg-orange-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.mainPrompt}</pre>
                      </div>
                          </div>
                          
                          {generatedProjectData.groupedResults.videoGroup.cutPrompts && generatedProjectData.groupedResults.videoGroup.cutPrompts.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">컷별 영상 프롬프트</h4>
                          <div className="space-y-2">
                                {generatedProjectData.groupedResults.videoGroup.cutPrompts.map((cut: string, index: number) => (
                                  <div key={index} className="bg-yellow-50 p-3 rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-medium text-yellow-700">컷 {index + 1}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          // 컷별 수정 기능 (추후 구현 가능)
                                          console.log(`컷 ${index + 1} 수정`);
                                        }}
                                        className="text-xs"
                                      >
                                        수정
                                      </Button>
                                    </div>
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{cut}</pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                          
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">영상 생성 최적화 프롬프트</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.videoOptimization}</pre>
                            </div>
                          </div>
                    </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 통합 AI 검토 및 정리 버튼 */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-green-600">🔍 통합 AI 검토 및 정리</h3>
                      <p className="text-sm text-gray-600">입력된 모든 내용을 검토하고 영상 제작에 최적화된 프롬프트를 생성합니다.</p>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium"
                      onClick={handleGenerateAllPrompts}
                      disabled={isGeneratingAll}
                    >
                      {isGeneratingAll ? 'AI 검토 중...' : '🔍 통합 AI 검토 및 정리'}
                    </Button>
                  </div>
                  
                  {/* 통합 AI 검토 결과 */}
                  {generatedProjectData?.reviewResult && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-800">통합 AI 검토 결과</h4>
                        <div className="flex gap-2">
                          {!editingReviewResult ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleStartEditReviewResult}
                              className="text-green-600 border-green-300"
                            >
                              수정
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEditReviewResult}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                저장
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditReviewResult}
                              >
                                취소
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {editingReviewResult ? (
                        <textarea
                          value={editingReviewText}
                          onChange={(e) => setEditingReviewText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows={12}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-yellow-50 p-4 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.reviewResult}</pre>
                          </div>
                          
                          {/* 영문 프롬프트 */}
                          {generatedProjectData.englishPrompt && (
                            <div>
                              <h5 className="font-medium text-gray-700 mb-2">영문 프롬프트 (English Prompt)</h5>
                              <div className="bg-blue-50 p-4 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.englishPrompt}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 프로젝트 개요 저장/다음 버튼 */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                      <h3 className="text-lg font-medium mb-2">프로젝트 개요 완성</h3>
                      <p className="text-sm text-gray-600">
                        {generatedProjectData?.groupedResults 
                          ? "통합 AI 검토가 완료되었습니다. 프로젝트를 저장하고 다음 단계로 진행하세요."
                          : "통합 AI 검토를 통해 프롬프트를 생성한 후 저장하세요."
                        }
                      </p>
                      </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSaveScenario}
                        disabled={isSaved || !generatedProjectData?.groupedResults}
                        className={isSaved ? "bg-gray-400" : "bg-green-600 hover:bg-green-700 disabled:opacity-50"}
                      >
                        {isSaved ? "저장 완료" : "프로젝트 개요 저장"}
                      </Button>
                      {isSaved && (
                        <Button 
                          onClick={handleNextStep}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          다음
                        </Button>
                      )}
                    </div>
                    </div>
                    {isSaved && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-800">✅ 프로젝트 개요가 저장되었습니다. 다음 버튼을 클릭하여 캐릭터 설정 단계로 이동하세요.</p>
                      </div>
                    )}
                  </div>

                {/* 안내 메시지 */}
                {!generatedProjectData && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>좌측에서 프로젝트 정보를 입력하고 "통합 AI 검토 및 정리" 버튼을 클릭하여 프롬프트를 생성하세요.</p>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === "이미지 생성" && (
              <div className="space-y-6">

                {/* 생성된 캐릭터들 */}
                {generatedCharacters.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 캐릭터들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedCharacters.map((char) => (
                        <div key={char.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {char.image.startsWith('data:image') ? (
                              <img 
                                src={char.image} 
                                alt={`캐릭터 ${char.id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400">{char.image}</span>
                            )}
                          </div>
                          <h4 className="font-medium mb-3 text-center">캐릭터 {char.id}</h4>
                          <div className="flex justify-between items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateCharacter(char.id)}
                              className="text-blue-600 border-blue-300"
                            >
                              재생성
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload('character', char.id, `캐릭터_${char.id}`, char)}
                            >
                              다운로드
                            </Button>
                            <button 
                              onClick={() => handleDeleteCharacter(char.id)}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 생성된 배경들 */}
                {generatedBackgrounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 배경들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedBackgrounds.map((bg) => (
                        <div key={bg.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {bg.image.startsWith('data:image') ? (
                              <img 
                                src={bg.image} 
                                alt={`배경 ${bg.id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400">{bg.image}</span>
                            )}
                          </div>
                          <h4 className="font-medium mb-3 text-center">배경 {bg.id}</h4>
                          <div className="flex justify-between items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateBackground(bg.id)}
                              className="text-blue-600 border-blue-300"
                            >
                              재생성
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload('background', bg.id, `배경_${bg.id}`, bg)}
                            >
                              다운로드
                            </Button>
                            <button 
                              onClick={() => handleDeleteBackground(bg.id)}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 생성된 설정 컷들 */}
                {generatedSettingCuts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 설정 컷들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedSettingCuts.map((cut) => (
                        <div key={cut.id} className="bg-white rounded-lg border p-4">
                          {/* 컷별 텍스트 카드 헤더 */}
                          <div className="mb-3">
                            <h4 className="font-medium text-blue-600 text-center">컷 {cut.id}</h4>
                          </div>
                          
                          {/* 영상 제작용 텍스트 카드 */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg mb-3">
                            <h5 className="font-medium text-gray-800 mb-2 text-sm">## 영상 제작용 텍스트 카드</h5>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {cut.description}
                            </div>
                          </div>
                          
                          {/* 이미지 섬네일 (3분의 1 크기) */}
                          <div className="w-1/3 mx-auto mb-3">
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {cut.image.startsWith('data:image') ? (
                                <img 
                                  src={cut.image} 
                                  alt={`설정 컷 ${cut.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">{cut.image}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* 영상 설정 */}
                          <div className="bg-gray-50 p-2 rounded-lg mb-3">
                            <h6 className="font-medium text-gray-700 mb-1 text-xs">⚙️ 영상 설정</h6>
                            <div className="text-xs text-gray-600">
                              <p>생성 시간: {new Date(cut.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {/* 액션 버튼들 */}
                          <div className="flex justify-between items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateSettingCut(cut.id)}
                              className="text-blue-600 border-blue-300"
                            >
                              재생성
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload('setting', cut.id, `설정컷_${cut.id}`, cut)}
                            >
                              다운로드
                            </Button>
                            <button 
                              onClick={() => handleDeleteSettingCut(cut.id)}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 다음 버튼 */}
                {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium mb-2">캐릭터 설정 완료</h3>
                        <p className="text-sm text-gray-600">
                          생성된 항목: 캐릭터 {generatedCharacters.length}개, 
                          배경 {generatedBackgrounds.length}개, 
                          설정컷 {generatedSettingCuts.length}개
                        </p>
                      </div>
                      <Button 
                        onClick={() => setCurrentStep("영상 생성")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 안내 메시지 */}
                {generatedCharacters.length === 0 && generatedBackgrounds.length === 0 && generatedSettingCuts.length === 0 && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>좌측의 생성 버튼들을 클릭하여 캐릭터, 배경, 설정컷을 생성하세요.</p>
                  </div>
                )}

                {/* 텍스트 생성 결과 - 오른쪽 하단 */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-blue-600">📝 텍스트 생성 결과</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTextResults(!showTextResults)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      {showTextResults ? '숨기기' : '보기'}
                    </Button>
                  </div>
                  
                  {showTextResults && (
                    <div className="space-y-4">

                      {/* 캐릭터 프롬프트 */}
                      {characterPrompt && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">캐릭터 설정 프롬프트</h4>
                          <div className="bg-green-50 p-3 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{characterPrompt}</pre>
                          </div>
                          {characterVideoPrompt && (
                            <div className="mt-2">
                              <h5 className="font-medium text-gray-600 mb-1">영상 최적화 프롬프트 (영문)</h5>
                              <div className="bg-gray-50 p-3 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{characterVideoPrompt}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 시나리오 프롬프트 */}
                      {scenarioPrompt && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">시나리오 프롬프트</h4>
                          <div className="bg-purple-50 p-3 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{scenarioPrompt}</pre>
                          </div>
                          {scenarioVideoPrompt && (
                            <div className="mt-2">
                              <h5 className="font-medium text-gray-600 mb-1">영상 최적화 프롬프트 (영문)</h5>
                              <div className="bg-gray-50 p-3 rounded-md">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{scenarioVideoPrompt}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 통합 AI 검토 결과 */}
                      {generatedProjectData?.groupedResults && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">통합 AI 검토 결과</h4>
                          <div className="bg-yellow-50 p-3 rounded-md">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.reviewResult}</pre>
                          </div>
                        </div>
                      )}

                      {!characterPrompt && !scenarioPrompt && !generatedProjectData && (
                        <div className="text-center text-gray-500 py-4">
                          <p>이전 단계에서 생성된 프롬프트가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {currentStep === "영상 생성" && (
              <div className="space-y-6">
                {/* 스토리/장면 입력 결과물 - 대사별 컷 리스트 */}
                {generatedTextCards.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">🎬 스토리/장면 입력 결과물</h3>
                    <div className="space-y-4">
                      {generatedTextCards.map((card) => (
                        <div key={card.id} className="bg-white rounded-lg border p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkedTextCards.has(card.id)}
                                onChange={() => toggleTextCardCheck(card.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-blue-600">컷 {card.id}</h4>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const newText = prompt('스토리/장면을 수정하세요:', card.generatedText);
                                  if (newText !== null) {
                                    handleEditTextCard(card.id, newText);
                                  }
                                }}
                                className="text-blue-500 text-sm px-3 py-1 hover:bg-blue-50 rounded border border-blue-300"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => handleDeleteTextCard(card.id)}
                                className="text-red-500 text-sm px-3 py-1 hover:bg-red-50 rounded border border-red-300"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          
                          {/* 스토리/장면 내용 */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-3">
                            <h5 className="font-medium text-gray-800 mb-2">📖 스토리/장면</h5>
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {card.generatedText}
                            </div>
                          </div>
                          
                          {/* 대사 리스트 (예시) */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h6 className="font-medium text-gray-700 mb-2">💬 대사 리스트</h6>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="text-sm text-gray-600">캐릭터1: "안녕하세요!"</span>
                                <div className="flex gap-1">
                                  <button className="text-xs text-blue-500 px-2 py-1 hover:bg-blue-50 rounded">수정</button>
                                  <button className="text-xs text-green-500 px-2 py-1 hover:bg-green-50 rounded">완료</button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between bg-white p-2 rounded border">
                                <span className="text-sm text-gray-600">캐릭터2: "반갑습니다!"</span>
                                <div className="flex gap-1">
                                  <button className="text-xs text-blue-500 px-2 py-1 hover:bg-blue-50 rounded">수정</button>
                                  <button className="text-xs text-green-500 px-2 py-1 hover:bg-green-50 rounded">완료</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 생성된 캐릭터 이미지들 */}
                {generatedCharacterImages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">👤 생성된 캐릭터 이미지들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedCharacterImages.map((image) => (
                        <div key={image.id} className="bg-white rounded-lg border p-4">
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
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkedCharacterImages.has(image.id)}
                                onChange={() => toggleCharacterImageCheck(image.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-green-600">캐릭터 이미지 {image.id}</h4>
                            </div>
                            <button 
                              onClick={() => setGeneratedCharacterImages(prev => prev.filter(img => img.id !== image.id))}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 생성된 캐릭터 영상들 */}
                {generatedCharacterVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">👥 생성된 캐릭터 영상들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedCharacterVideos.map((video) => (
                        <div key={video.id} className="bg-white rounded-lg border p-4">
                          <div className={`bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden ${
                            video.videoRatio === "16:9" ? "aspect-video" : 
                            video.videoRatio === "1:1" ? "aspect-square" : 
                            "aspect-[9/16]"
                          }`}>
                            {video.video && video.video.startsWith('http') ? (
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
                          <h4 className="font-medium mb-3 text-center">캐릭터 영상 {video.id}</h4>
                          <div className="flex justify-between items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateCharacterVideo(video.id)}
                              className="text-blue-600 border-blue-300"
                            >
                              재생성
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload('cut', video.id, `캐릭터영상_${video.id}`, video)}
                            >
                              다운로드
                            </Button>
                            <button 
                              onClick={() => handleDeleteCharacterVideo(video.id)}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 생성된 배경들 */}
                {generatedVideoBackgrounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">🖼️ 생성된 배경들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedVideoBackgrounds.map((bg) => (
                        <div key={bg.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {bg.image && bg.image.startsWith('data:image') ? (
                              <img 
                                src={bg.image} 
                                alt={`배경 ${bg.id}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400">{bg.image}</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checkedBackgrounds.has(bg.id)}
                                onChange={() => toggleBackgroundCheck(bg.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <h4 className="font-medium text-purple-600">배경 {bg.id}</h4>
                            </div>
                            <button 
                              onClick={() => handleDeleteVideoBackground(bg.id)}
                              className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded"
                            >
                              삭제
                            </button>
                          </div>
                          <div className="flex justify-between items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRegenerateVideoBackground(bg.id)}
                              className="text-blue-600 border-blue-300"
                            >
                              재생성
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDownload('background', bg.id, `배경_${bg.id}`, bg)}
                            >
                              다운로드
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 영상 썸네일 생성 버튼 */}
                {(generatedTextCards.length > 0 || generatedCharacterImages.length > 0 || generatedVideoBackgrounds.length > 0) && (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium mb-2">🎬 영상 썸네일 생성</h3>
                        <p className="text-sm text-gray-600">
                          각 카테고리에서 원하는 항목을 선택하고 영상 썸네일을 생성하세요.
                        </p>
                      </div>
                      <Button 
                        onClick={handleGenerateVideoThumbnail}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={checkedTextCards.size === 0 || checkedCharacterImages.size === 0 || checkedBackgrounds.size === 0}
                      >
                        영상 썸네일 생성
                      </Button>
                    </div>
                    {(checkedTextCards.size === 0 || checkedCharacterImages.size === 0 || checkedBackgrounds.size === 0) && (
                      <div className="mt-3 text-xs text-gray-500">
                        각 카테고리에서 최소 1개씩 선택해주세요.
                      </div>
                    )}
                  </div>
                )}

                {/* 컷별 영상 생성 그룹 */}
                {generatedVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">🎬 컷별 영상 생성 그룹</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedVideos.map((video, index) => (
                        <div key={video.id} className="bg-white rounded-lg border p-4">
                          {/* 영상 카드 헤더 */}
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-800">영상{index + 1}</h4>
                              <p className="text-xs text-gray-500">{new Date(video.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // 재생성 로직 - 기존 선택된 항목들로 다시 생성
                                  handleGenerateAIVideo();
                                }}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-2 py-1"
                              >
                                재생성
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDownload('cut', video.id, `영상_${index + 1}`, video)}
                                className="text-xs px-2 py-1"
                              >
                                다운로드
                              </Button>
                              <button 
                                onClick={() => setGeneratedVideos(prev => prev.filter(v => v.id !== video.id))}
                                className="text-red-500 text-xs px-2 py-1 hover:bg-red-50 rounded border border-red-300"
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          {/* 영상 미리보기 (작은 크기) */}
                          <div className="mb-3">
                            <div className={`bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden ${
                              video.videoRatio === "16:9" ? "aspect-video" : 
                              video.videoRatio === "1:1" ? "aspect-square" : 
                              "aspect-[9/16]"
                            }`}>
                              {video.thumbnail && video.thumbnail.startsWith('http') ? (
                                <video 
                                  src={video.thumbnail} 
                                  controls
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                >
                                  브라우저가 비디오를 지원하지 않습니다.
                                </video>
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
                                <span className="text-gray-400 text-xs">{video.thumbnail || video.video}</span>
                              )}
                            </div>
                          </div>

                          {/* 영상 설정 정보 */}
                          <div className="p-2 bg-gray-50 rounded-lg">
                            <h6 className="font-medium text-gray-700 mb-1 text-xs">⚙️ 영상 설정</h6>
                            <div className="text-xs text-gray-600">
                              <p>비율: {video.videoRatio}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 안내 메시지 */}
                {generatedTextCards.length === 0 && generatedCharacterVideos.length === 0 && generatedVideoBackgrounds.length === 0 && generatedVideos.length === 0 && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>좌측에서 각 항목을 입력하고 AI 생성 버튼을 클릭하여 영상을 생성하세요.</p>
                  </div>
                )}

                {/* 생성된 텍스트 참조 - 가장 하단 고정 */}
                {showTextResults && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4 text-blue-600">📝 생성된 텍스트 참조</h3>
                    <div className="space-y-6">
                      {/* 프로젝트 개요에서 생성한 텍스트들 */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-800 text-lg">프로젝트 개요 텍스트</h4>
                        
                        {/* 캐릭터 프롬프트 */}
                        {characterPrompt && (
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-medium text-green-600 mb-2">👥 캐릭터 프롬프트</h5>
                            <div className="bg-green-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{characterPrompt}</pre>
                            </div>
                          </div>
                        )}

                        {/* 시나리오 프롬프트 */}
                        {scenarioPrompt && (
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-medium text-purple-600 mb-2">📝 시나리오 프롬프트</h5>
                            <div className="bg-purple-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{scenarioPrompt}</pre>
                            </div>
                          </div>
                        )}

                        {/* 500자 스토리 정리 */}
                        {storySummary && (
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-medium text-orange-600 mb-2">📖 500자 스토리 정리</h5>
                            <div className="bg-orange-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{storySummary}</pre>
                            </div>
                          </div>
                        )}

                        {/* 최종 텍스트 시나리오 */}
                        {(finalScenario || generatedProjectData?.finalScenario) && (
                          <div className="bg-white rounded-lg border p-4">
                            <h5 className="font-medium text-indigo-600 mb-2">🎬 최종 텍스트 시나리오</h5>
                            <div className="bg-indigo-50 p-3 rounded-md">
                              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{finalScenario || generatedProjectData?.finalScenario}</pre>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI 검토 결과 - 항목별 카드로 분리 */}
                      {generatedProjectData?.groupedResults && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-800 text-lg">AI 검토 결과</h4>
                          
                          {/* 캐릭터 그룹 */}
                          {generatedProjectData.groupedResults.characterGroup && (
                            <div className="bg-white rounded-lg border p-4">
                              <h5 className="font-medium text-green-600 mb-3">👥 캐릭터 그룹</h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">캐릭터 프롬프트</h6>
                                  <div className="bg-green-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.prompt}</pre>
                                  </div>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">영상 최적화 프롬프트 (영문)</h6>
                                  <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.characterGroup.videoOptimization}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 시나리오 그룹 */}
                          {generatedProjectData.groupedResults.scenarioGroup && (
                            <div className="bg-white rounded-lg border p-4">
                              <h5 className="font-medium text-purple-600 mb-3">📝 시나리오 그룹</h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">시나리오 프롬프트</h6>
                                  <div className="bg-purple-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.prompt}</pre>
                                  </div>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">영상 최적화 프롬프트 (영문)</h6>
                                  <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.scenarioGroup.videoOptimization}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 영상 생성 그룹 */}
                          {generatedProjectData.groupedResults.videoGroup && (
                            <div className="bg-white rounded-lg border p-4">
                              <h5 className="font-medium text-orange-600 mb-3">🎬 영상 생성 그룹</h5>
                              <div className="space-y-3">
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">메인 영상 생성 프롬프트</h6>
                                  <div className="bg-orange-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.mainPrompt}</pre>
                                  </div>
                                </div>
                                {generatedProjectData.groupedResults.videoGroup.cutPrompts && generatedProjectData.groupedResults.videoGroup.cutPrompts.length > 0 && (
                                  <div>
                                    <h6 className="font-medium text-gray-700 mb-1">컷별 영상 프롬프트</h6>
                                    <div className="space-y-2">
                                      {generatedProjectData.groupedResults.videoGroup.cutPrompts.map((cut: string, index: number) => (
                                        <div key={index} className="bg-yellow-50 p-3 rounded-md">
                                          <div className="text-sm font-medium text-yellow-700 mb-1">컷 {index + 1}</div>
                                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{cut}</pre>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">영상 생성 최적화 프롬프트 (영문)</h6>
                                  <div className="bg-gray-50 p-3 rounded-md">
                                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">{generatedProjectData.groupedResults.videoGroup.videoOptimization}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!characterPrompt && !scenarioPrompt && !storySummary && !finalScenario && !generatedProjectData?.finalScenario && !generatedProjectData?.groupedResults && (
                        <div className="text-center text-gray-500 py-4">
                          <p>이전 단계에서 생성된 텍스트가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 하단 진행률 추적기 */}
      <ProgressTracker 
        steps={progressSteps}
        currentStep={currentStep}
        onStepClick={(stepId) => {
          const stepMap: { [key: string]: string } = {
            'overview': '프로젝트 개요',
            'character': '이미지 생성',
            'video': '영상 생성'
          };
          setCurrentStep(stepMap[stepId] || '프로젝트 개요');
        }}
      />
    </div>
  );
}