import React, { useState } from 'react';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

interface GeneratedTextCard {
  id: number;
  generatedText: string;
  timestamp: string;
  sceneCommon?: string;
  originalSceneCommon?: string;
  story?: string;
  cutCount?: number;
}

interface GeneratedImage {
  id: number;
  input: string;
  image: string;
  timestamp: string;
}

interface GeneratedVideo {
  id: number;
  textCards: GeneratedTextCard[];
  characterImages: GeneratedImage[];
  backgrounds: GeneratedImage[];
  projectTexts: string[];
  aiReviewTexts: string[];
  sceneCommonSettings: string[];
  video: string;
  videoRatio: string;
  timestamp: string;
}

interface VideoGenerationStepProps {
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<GeneratedTextCard[]>>;
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  // 선택 상태
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  // 컷별 텍스트카드 선택 상태
  cutTextCardSelections: {[key: string]: Set<number>};
  // 선택된 컷들 (영상 생성용)
  selectedCuts: Set<string>;
  characterPrompt: string;
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  generatedProjectData: any;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  // 프로젝트 개요 데이터
  story: string;
  characterList: any[];
  onNext: () => void;
  canProceedToNext?: () => boolean;
}

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
  finalScenario,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  characterList,
  onNext,
  canProceedToNext
}) => {
  const { addNotification } = useUIStore();
  
  // 영상 비율 설정 (1:1은 Veo API에서 지원되지 않음)
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // 씬 공통설정 (단순화)
  const [sceneCommonInput, setSceneCommonInput] = useState('');

  // 컷 숫자 설정
  const [cutCount, setCutCount] = useState(1);

  // 스토리 입력 (컷별 이미지 생성 프롬프트)
  const [storyInput, setStoryInput] = useState('');

  // 텍스트 출력 제한
  const [textLimit, setTextLimit] = useState(2000);

  // 기존 입력 필드들 (호환성을 위해 유지)
  const [characterOutfitInput, setCharacterOutfitInput] = useState('');
  const [characterOutfitImages, setCharacterOutfitImages] = useState<File[]>([]);
  const [videoBackgroundInput, setVideoBackgroundInput] = useState('');
  const [videoBackgroundImages, setVideoBackgroundImages] = useState<File[]>([]);
  
  // 영상 옵션 설정
  const [videoOptions, setVideoOptions] = useState({
    style: 'cinematic',
    mood: 'dramatic',
    cameraWork: 'smooth',
    effects: [] as string[],
    music: 'epic',
    customPrompt: ''
  });

  // 영상 모델 버전 설정
  const [selectedVideoModel, setSelectedVideoModel] = useState<'veo-2.0' | 'veo-3.0-fast' | 'veo-3.0-standard'>('veo-2.0');
  const [applyOptions, setApplyOptions] = useState(false);
  
  // 텍스트 카드 편집 상태
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingCardText, setEditingCardText] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // 텍스트 카드 편집 함수들
  const handleEditCard = (cardId: number, currentText: string) => {
    setEditingCardId(cardId);
    setEditingCardText(currentText);
  };

  const handleSaveCardEdit = () => {
    if (editingCardId !== null) {
      setGeneratedTextCards(prev => 
        prev.map(card => 
          card.id === editingCardId 
            ? { ...card, generatedText: editingCardText }
            : card
        )
      );
      setEditingCardId(null);
      setEditingCardText('');
      addNotification({
        type: 'success',
        title: '수정 완료',
        message: '텍스트 카드가 수정되었습니다.',
      });
    }
  };

  const handleCancelCardEdit = () => {
    setEditingCardId(null);
    setEditingCardText('');
  };

  const handleDeleteCard = (cardId: number) => {
    if (window.confirm('이 텍스트 카드를 삭제하시겠습니까?')) {
      setGeneratedTextCards(prev => prev.filter(card => card.id !== cardId));
      setSelectedTextCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      addNotification({
        type: 'info',
        title: '삭제 완료',
        message: '텍스트 카드가 삭제되었습니다.',
      });
    }
  };
  
  // 텍스트 참조 표시는 props로 받음

  // 텍스트 카드 생성 (구조화된 AI 프롬프트 사용)
  const handleGenerateTextCard = async () => {
    if (!storyInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리를 입력해주세요.',
      });
      return;
    }

    try {
      // 컷별 카드 생성 형식의 AI 텍스트 생성
      const textPrompt = `다음 스토리를 바탕으로 ${cutCount}컷 영상 제작용 텍스트 카드를 생성해주세요:

**씬 공통설정:**
${sceneCommonInput ? `- 공통 설정: ${sceneCommonInput}` : ''}

**스토리:**
${storyInput}

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 생성되는 텍스트는 반드시 ${textLimit}자 이내여야 합니다.
⚠️ ${textLimit}자를 초과하면 생성이 실패합니다.
⚠️ 각 컷별 설명을 간결하고 명확하게 작성하세요.

**중요한 출력 형식 요구사항:**
반드시 다음 형식으로 출력해주세요 (공백과 마크다운 형식을 정확히 지켜주세요):

--- **컷 1: [컷 제목]**

**필수 항목:**
* **캐릭터:** [캐릭터 설명]
* **액션:** [액션 설명]  
* **배경:** [배경 설명]
* **대사:** [대사 내용]

**추가 항목 (필요한 경우):**
* **구도:** [구도 설명]
* **조명:** [조명 설명]
* **카메라 움직임:** [카메라 움직임 설명]

**⚠️ 형식 주의사항:**
1. * **항목명:** 형식에서 * 뒤에 공백은 정확히 1개만 사용
2. **필수 항목:** 헤더는 반드시 포함
3. 각 항목은 새로운 줄에서 시작
4. 마크다운 형식을 정확히 준수

--- **컷 2: [컷 제목]**

**필수 항목:**
* **캐릭터:** [캐릭터의 외모, 의상, 특징을 영어로 상세히 설명]
* **액션:** [캐릭터의 구체적인 행동을 영어로 설명]
* **배경:** [장면의 배경과 환경을 영어로 설명]
* **대사:** [캐릭터의 대사를 한국어로 표시]

**추가 항목 (필요한 경우):**
* **구도:** [카메라 앵글과 구도를 영어로 설명]
* **조명:** [조명과 분위기를 영어로 설명]
* **카메라 움직임:** [카메라의 움직임을 영어로 설명]

... (총 ${cutCount}컷까지)

**중요한 지침:**
1. 필수 항목은 모든 컷에 반드시 포함되어야 합니다.
2. 추가 항목은 장면에 필요한 경우에만 포함하세요.
3. 캐릭터, 액션, 배경은 영어로 작성하세요.
4. 대사는 한국어로 작성하세요.
5. 각 항목은 구체적이고 상세하게 작성하세요.

**중요**: 반드시 ${textLimit}자 이내로 작성하고, 위의 --- **컷 X: [제목]** 형식을 정확히 따라주세요.`;

      const result = await googleAIService.generateText(textPrompt);
      
      // 씬 공통설정 추가 생성
      let generatedSceneCommon = sceneCommonInput;
      if (sceneCommonInput.trim()) {
        try {
          const sceneCommonPrompt = `다음 씬 공통설정을 더 상세하고 구체적으로 확장해주세요:

${sceneCommonInput}

다음 요소들을 포함하여 확장해주세요:
- 전체적인 분위기와 무드
- 시각적 스타일과 톤
- 음악과 사운드 디자인
- 색감과 조명의 기본 톤
- 전체적인 카메라 워크 스타일

**중요**: 반드시 ${Math.floor(textLimit * 0.3)}자 이내로 작성하세요.`;
          
          generatedSceneCommon = await googleAIService.generateText(sceneCommonPrompt);
        } catch (error) {
          console.warn('씬 공통설정 생성 실패:', error);
          generatedSceneCommon = sceneCommonInput;
        }
      }
      
      // 스토리 추가 생성
      let generatedStory = storyInput;
      if (storyInput.trim()) {
        try {
          const storyPrompt = `다음 스토리를 더 상세하고 감정적으로 확장해주세요:

${storyInput}

다음 요소들을 포함하여 확장해주세요:
- 캐릭터의 내면 심리와 감정
- 장면의 긴장감과 드라마
- 시각적 메타포와 상징
- 감정적 몰입을 위한 세부 묘사
- 스토리의 깊이와 의미

**중요**: 반드시 ${Math.floor(textLimit * 0.4)}자 이내로 작성하세요.`;
          
          generatedStory = await googleAIService.generateText(storyPrompt);
        } catch (error) {
          console.warn('스토리 생성 실패:', error);
          generatedStory = storyInput;
        }
      }
      
      const newTextCard = {
        id: Date.now(),
        generatedText: result,
        timestamp: new Date().toISOString(),
        cutCount: cutCount,
        sceneCommon: generatedSceneCommon,
        story: generatedStory,
        originalSceneCommon: sceneCommonInput,
        originalStory: storyInput,
        sceneNumber: generatedTextCards.length + 1 // 새로운 씬 번호
      };
      
      setGeneratedTextCards([...generatedTextCards, newTextCard]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `씬${generatedTextCards.length + 1} (${cutCount}컷) 텍스트 카드가 생성되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `텍스트 카드 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 캐릭터 이미지 생성 (구조화된 AI 프롬프트 사용)
  const handleGenerateCharacterImage = async () => {
    if (!characterOutfitInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터와 의상을 입력해주세요.',
      });
      return;
    }

    try {
      // 간단한 이미지 생성
      const imagePrompt = `캐릭터 이미지 생성: ${characterOutfitInput}

고품질, 상세한 디테일, 영상 제작용 캐릭터 이미지로 생성해주세요.`;

      const imageResult = await googleAIService.generateCharacterImage(imagePrompt);
      
      const newCharacterImage = {
        id: Date.now(),
        input: characterOutfitInput,
        image: imageResult,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedCharacterImages([...generatedCharacterImages, newCharacterImage]);
      setCharacterOutfitInput('');
      setCharacterOutfitImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '구조화된 캐릭터 이미지가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `캐릭터 이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 첨부된 이미지로 캐릭터 카드 추가
  const handleAddCharacterImageFromFile = () => {
    if (characterOutfitImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '이미지를 첨부해주세요.',
      });
      return;
    }

    characterOutfitImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const newCharacterImage = {
          id: Date.now() + Math.random(),
          input: characterOutfitInput || `첨부된 이미지: ${file.name}`,
          image: imageData,
          timestamp: new Date().toISOString(),
        };
        
        setGeneratedCharacterImages(prev => [...prev, newCharacterImage]);
      };
      reader.readAsDataURL(file);
    });

    setCharacterOutfitImages([]);
    setCharacterOutfitInput('');
    
    addNotification({
      type: 'success',
      title: '캐릭터 이미지 추가 완료',
      message: '첨부된 이미지가 캐릭터 카드로 추가되었습니다.',
    });
  };

  // 배경 생성 (구조화된 AI 프롬프트 사용)
  const handleGenerateVideoBackground = async () => {
    if (!videoBackgroundInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력해주세요.',
      });
      return;
    }

    try {
      // 간단한 배경 이미지 생성
      const imagePrompt = `배경 이미지 생성: ${videoBackgroundInput}

고품질, 상세한 디테일, 영상 제작용 배경 이미지로 생성해주세요.`;

      const imageResult = await googleAIService.generateBackgroundImage(imagePrompt);
      
      const newBackground = {
        id: Date.now(),
        input: videoBackgroundInput,
        image: imageResult,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedVideoBackgrounds([...generatedVideoBackgrounds, newBackground]);
      setVideoBackgroundInput('');
      setVideoBackgroundImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '구조화된 배경 이미지가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `배경 이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 첨부된 이미지로 배경 카드 추가
  const handleAddBackgroundImageFromFile = () => {
    if (videoBackgroundImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '이미지를 첨부해주세요.',
      });
      return;
    }

    videoBackgroundImages.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        const newBackground = {
          id: Date.now() + Math.random(),
          input: videoBackgroundInput || `첨부된 이미지: ${file.name}`,
          image: imageData,
          timestamp: new Date().toISOString(),
        };
        
        setGeneratedVideoBackgrounds(prev => [...prev, newBackground]);
      };
      reader.readAsDataURL(file);
    });

    setVideoBackgroundImages([]);
    setVideoBackgroundInput('');
    
    addNotification({
      type: 'success',
      title: '배경 이미지 추가 완료',
      message: '첨부된 이미지가 배경 카드로 추가되었습니다.',
    });
  };

  // 모델별 영상 생성 함수 - 이미지 참조 지원
  const generateVideoWithModel = async (prompt: string, videoRatio: string, modelVersion: string, referenceImages?: string[]) => {
    // VideoGenerationService 임포트 및 사용
    const { VideoGenerationService } = await import('../../services/ai/VideoGenerationService');
    const videoService = new VideoGenerationService(
      process.env.REACT_APP_GEMINI_API_KEY || '',
      modelVersion as any
    );
    
    return await videoService.generateVideo(prompt, videoRatio, {
      duration: 8,
      resolution: modelVersion === 'veo-3.0-standard' ? '1080p' : '720p'
      // audioEnabled와 fps는 Gemini API에서 지원되지 않으므로 제거
    }, referenceImages);
  };

  // AI 영상 생성
  const handleGenerateAIVideo = async () => {
    // 선택된 컷들만 사용 (개별 컷 선택 기반)
    const selectedCutsArray = Array.from(selectedCuts);
    if (selectedCutsArray.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '최소 1개의 컷을 선택해주세요.',
      });
      return;
    }

    // 선택된 컷들의 정보 수집
    const allCutInfo: any[] = [];
    const sceneCommonSettings: string[] = []; // 씬 공통설정 수집
    
    selectedCutsArray.forEach(cutKey => {
      const [cardId, cutNumber] = cutKey.split('-');
      const card = generatedTextCards.find(c => c.id === parseInt(cardId));
      if (card) {
        // 씬 공통설정 수집 (중복 제거)
        if (card.sceneCommon && !sceneCommonSettings.includes(card.sceneCommon)) {
          sceneCommonSettings.push(card.sceneCommon);
        }
        // 컷별 텍스트 파싱 함수 (간단한 버전)
        const parseCutTexts = (text: string) => {
          const cutPattern = /--- \*\*컷\s*(\d+):\s*([^*]+)\*\*/g;
          const cuts: { [key: number]: { title: string; content: string; sections: any } } = {};
          let match;

          while ((match = cutPattern.exec(text)) !== null) {
            const cutNum = parseInt(match[1]);
            const cutTitle = match[2].trim();
            const startIndex = match.index + match[0].length;
            
            const nextMatch = cutPattern.exec(text);
            const endIndex = nextMatch ? nextMatch.index : text.length;
            
            const cutContent = text.substring(startIndex, endIndex).trim();
            
            const sections = {
              character: '',
              action: '',
              background: '',
              dialogue: '',
              composition: '',
              lighting: '',
              cameraMovement: ''
            };
            
            // 개선된 파싱 패턴들
            const patterns = {
              character: [/\*\s*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              action: [/\*\s*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              background: [/\*\s*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              dialogue: [/\*\s*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              composition: [/\*\s*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              lighting: [/\*\s*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/],
              cameraMovement: [/\*\s*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/]
            };

            Object.keys(patterns).forEach(sectionKey => {
              for (const pattern of patterns[sectionKey as keyof typeof patterns]) {
                const match = cutContent.match(pattern);
                if (match) {
                  sections[sectionKey as keyof typeof sections] = match[1].trim();
                  break;
                }
              }
            });
            
            cuts[cutNum] = {
              title: cutTitle,
              content: cutContent,
              sections: sections
            };
            
            cutPattern.lastIndex = endIndex;
          }

          return cuts;
        };

        const cutTexts = parseCutTexts(card.generatedText || '');
        const cut = cutTexts[parseInt(cutNumber)];
        if (cut) {
          allCutInfo.push({
            cutNumber: parseInt(cutNumber),
            title: cut.title,
            content: cut.content,
            sections: cut.sections,
            textCardId: card.id,
            // 컷의 모든 섹션을 통합한 텍스트
            integratedText: `컷 ${cutNumber}: ${cut.title}
캐릭터: ${cut.sections.character || '없음'}
액션: ${cut.sections.action || '없음'}
배경: ${cut.sections.background || '없음'}
대사: ${cut.sections.dialogue || '없음'}
구도: ${cut.sections.composition || '없음'}
조명: ${cut.sections.lighting || '없음'}
카메라 움직임: ${cut.sections.cameraMovement || '없음'}`
          });
        }
      }
    });
    const selectedCharacterImagesFiltered = generatedCharacterImages.filter(img => 
      selectedCharacterImages.has(img.id)
    );
    const selectedBackgroundsFiltered = generatedVideoBackgrounds.filter(bg => 
      selectedVideoBackgrounds.has(bg.id)
    );

    if (allCutInfo.length === 0 || selectedCharacterImagesFiltered.length === 0 || selectedBackgroundsFiltered.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '최소 1개씩 컷, 캐릭터 이미지, 배경 이미지를 선택해주세요.',
      });
      return;
    }
    
    setIsGeneratingVideo(true);
    addNotification({
      type: 'info',
      title: '영상 생성 시작',
      message: 'AI가 실제 영상과 오디오를 생성하고 있습니다. 최대 6분까지 소요될 수 있습니다...',
    });
    
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

      // 선택된 이미지들에서 참조 이미지 추출
      const referenceImages: string[] = [];
      
      // 캐릭터 이미지 참조 추가
      selectedCharacterImagesFiltered.forEach(img => {
        if (img.image) {
          referenceImages.push(img.image);
        }
      });
      
      // 배경 이미지 참조 추가
      selectedBackgroundsFiltered.forEach(bg => {
        if (bg.image) {
          referenceImages.push(bg.image);
        }
      });

      // 기본 프롬프트 구성
      let prompt = `다음 선택된 요소들과 프로젝트 개요 텍스트를 바탕으로 컷별 영상을 생성해주세요:

=== 프로젝트 개요 텍스트 ===
${projectTexts.join('\n\n')}

=== AI 검토 결과 ===
${aiReviewTexts.join('\n\n')}

=== 씬 공통설정 ===
${sceneCommonSettings.length > 0 ? 
  sceneCommonSettings.map((setting, index) => `씬 ${index + 1} 공통설정:\n${setting}`).join('\n\n') : 
  '씬 공통설정이 없습니다.'}

=== 선택된 컷들의 완전한 정보 ===
${allCutInfo.length > 0 ? 
  allCutInfo.map(cut => `컷 ${cut.cutNumber}: ${cut.title}
캐릭터: ${cut.sections.character || '없음'}
액션: ${cut.sections.action || '없음'}
배경: ${cut.sections.background || '없음'}
대사: ${cut.sections.dialogue || '없음'}
구도: ${cut.sections.composition || '없음'}
조명: ${cut.sections.lighting || '없음'}
카메라 움직임: ${cut.sections.cameraMovement || '없음'}`).join('\n\n') : 
  '선택된 컷 정보가 없습니다.'}

=== 선택된 캐릭터 이미지 ===
${selectedCharacterImagesFiltered.map(img => img.input).join(', ')}

=== 선택된 배경 ===
${selectedBackgroundsFiltered.map(bg => bg.input).join(', ')}

=== 참조 이미지 정보 ===
${referenceImages.length > 0 ? 
  `총 ${referenceImages.length}개의 참조 이미지가 제공됩니다. 이 이미지들을 참고하여 일관된 스타일과 캐릭터, 배경을 유지하여 영상을 생성해주세요.` : 
  '참조 이미지가 없습니다. 텍스트 설명만을 바탕으로 영상을 생성해주세요.'}

=== 영상 설정 ===
영상 비율: ${videoRatio}`;

      // 영상 옵션 적용
      if (applyOptions) {
        prompt += `

=== 영상 옵션 ===
스타일: ${videoOptions.style}
무드: ${videoOptions.mood}
카메라 워크: ${videoOptions.cameraWork}
배경음악: ${videoOptions.music}`;

        if (videoOptions.customPrompt.trim()) {
          prompt += `

=== 추가 프롬프트 ===
${videoOptions.customPrompt}`;
        }
      }

      prompt += `

위의 모든 정보를 통합하여 각 컷별로 완성된 영상을 생성해주세요.`;

      // 선택된 모델에 따라 영상 생성 (참조 이미지 포함)
      const videoResult = await generateVideoWithModel(prompt, videoRatio, selectedVideoModel, referenceImages);
      
      const newVideo = {
        id: Date.now(),
        textCards: allCutInfo,
        characterImages: selectedCharacterImagesFiltered,
        backgrounds: selectedBackgroundsFiltered,
        projectTexts: projectTexts,
        aiReviewTexts: aiReviewTexts,
        sceneCommonSettings: sceneCommonSettings,
        video: videoResult,
        videoRatio: videoRatio,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedVideos([...generatedVideos, newVideo]);
      
      addNotification({
        type: 'success',
        title: '영상 생성 완료',
        message: '선택된 요소들을 바탕으로 실제 영상이 성공적으로 생성되었습니다.',
      });
    } catch (error) {
      console.error('Google AI 비디오 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '영상 생성 실패',
        message: `영상 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsGeneratingVideo(false);
    }
  };








  return (
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
            16:9 (가로)
          </button>
          <button
            onClick={() => setVideoRatio("9:16")}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              videoRatio === "9:16"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            9:16 (세로)
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">1:1 비율은 현재 지원되지 않습니다.</p>
      </div>

      {/* 1. 씬 공통설정 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">1. 씬 공통설정</h3>
        <textarea
          value={sceneCommonInput}
          onChange={(e) => setSceneCommonInput(e.target.value)}
          placeholder="씬 공통설정을 입력하세요 (선택사항)"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 2. 컷 숫자 설정 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">2. 컷 숫자 설정</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={cutCount}
            onChange={(e) => setCutCount(Number(e.target.value))}
            min="1"
            max="10"
            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">컷</span>
        </div>
      </div>

      {/* 3. 텍스트 출력 제한 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">3. 텍스트 출력 제한</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={textLimit}
            onChange={(e) => setTextLimit(Number(e.target.value))}
            min="500"
            max="5000"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">자</span>
        </div>
        <p className="text-xs text-gray-500">AI 생성 텍스트의 최대 길이를 설정합니다 (기본: 2000자)</p>
      </div>

      {/* 4. 스토리 입력 - 컷별 이미지 생성 프롬프트 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">4. 스토리 입력 - 컷별 이미지 생성 프롬프트</h3>
        <textarea
          value={storyInput}
          onChange={(e) => setStoryInput(e.target.value)}
          placeholder="스토리를 입력하세요 (컷별 이미지 생성 프롬프트가 생성됩니다)"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button className="w-full" onClick={handleGenerateTextCard}>
          AI 생성 텍스트 ({cutCount}컷, {textLimit}자 제한)
        </Button>
      </div>


      {/* 5. 캐릭터 + 의상 + 이미지 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">5. 캐릭터 + 의상 + 이미지</h3>
        <textarea
          value={characterOutfitInput}
          onChange={(e) => setCharacterOutfitInput(e.target.value)}
          placeholder="캐릭터와 의상을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <ImageUpload
          onImagesChange={setCharacterOutfitImages}
          attachedImages={characterOutfitImages}
          maxImages={5}
          className="mt-3"
        />
        
        <div className="flex space-x-2">
          <Button className="flex-1" onClick={handleGenerateCharacterImage}>
            AI 생성
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleAddCharacterImageFromFile}
            disabled={characterOutfitImages.length === 0}
          >
            첨부 이미지 추가
          </Button>
        </div>
      </div>

      {/* 6. 배경 생성 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">6. 배경 생성</h3>
        <textarea
          value={videoBackgroundInput}
          onChange={(e) => setVideoBackgroundInput(e.target.value)}
          placeholder="배경 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
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
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleAddBackgroundImageFromFile}
            disabled={videoBackgroundImages.length === 0}
          >
            첨부 이미지 추가
          </Button>
        </div>
      </div>

      {/* 생성 결과는 오른쪽 본문에 표시되므로 왼쪽에서는 제거 */}

      {/* 7. AI 영상 생성 */}
      <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <span className="text-purple-600">🎬</span>
          7. AI 영상 생성
        </h3>
        <p className="text-sm text-gray-600">
          선택된 요소들을 통합하여 실제 영상을 생성합니다.
        </p>

        {/* 영상 모델 선택 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">영상 생성 모델</label>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                value: 'veo-2.0',
                name: 'Veo 2.0 (기본)',
                description: '안정적이고 빠른 영상 생성',
                features: ['무료', '빠른 생성', '시각적 전용'],
                color: 'blue'
              },
              {
                value: 'veo-3.0-fast',
                name: 'Veo 3.0 Fast (빠른 생성)',
                description: '고품질 영상을 빠르게 생성',
                features: ['고품질', '빠른 생성'],
                color: 'green'
              },
              {
                value: 'veo-3.0-standard',
                name: 'Veo 3.0 Standard (고품질)',
                description: '최고 품질의 영상 생성',
                features: ['최고 품질', '1080p'],
                color: 'purple'
              }
            ].map((model) => (
              <label
                key={model.value}
                className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedVideoModel === model.value
                    ? `border-${model.color}-500 bg-${model.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="videoModel"
                  value={model.value}
                  checked={selectedVideoModel === model.value}
                  onChange={(e) => setSelectedVideoModel(e.target.value as any)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{model.name}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      model.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      model.color === 'green' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {model.features[0]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{model.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-500 space-y-1">
          <div>선택된 컷: {selectedCuts.size}개</div>
          <div>선택된 캐릭터: {selectedCharacterImages.size}개</div>
          <div>선택된 배경: {selectedVideoBackgrounds.size}개</div>
        </div>
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleGenerateAIVideo}
          disabled={selectedCuts.size === 0 || selectedCharacterImages.size === 0 || selectedVideoBackgrounds.size === 0 || isGeneratingVideo}
        >
          {isGeneratingVideo ? '🎬 영상 생성 중...' : `🎬 AI 영상 생성 (${selectedVideoModel})`}
        </Button>
        
        {/* 선택된 모델 정보 표시 */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="font-medium">선택된 모델: {selectedVideoModel}</div>
          <div>
            {selectedVideoModel === 'veo-2.0' && '시각적 전용, 무료, 빠른 생성, 720p'}
            {selectedVideoModel === 'veo-3.0-fast' && '고품질, 빠른 생성, 720p'}
            {selectedVideoModel === 'veo-3.0-standard' && '최고 품질, 1080p'}
          </div>
        </div>
        
        {(selectedCuts.size === 0 || selectedCharacterImages.size === 0 || selectedVideoBackgrounds.size === 0) && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            컷, 캐릭터, 배경을 선택해주세요.
          </div>
        )}
      </div>

      {/* 영상 옵션 설정 */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <span className="text-gray-600">⚙️</span>
          영상 옵션 설정
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 스타일 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 스타일</label>
            <select
              value={videoOptions.style}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, style: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cinematic">시네마틱</option>
              <option value="documentary">다큐멘터리</option>
              <option value="animation">애니메이션</option>
              <option value="realistic">리얼리스틱</option>
            </select>
          </div>

          {/* 무드 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 무드</label>
            <select
              value={videoOptions.mood}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, mood: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dramatic">드라마틱</option>
              <option value="light">가벼운</option>
              <option value="mysterious">신비로운</option>
              <option value="romantic">로맨틱</option>
            </select>
          </div>

          {/* 카메라 워크 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카메라 워크</label>
            <select
              value={videoOptions.cameraWork}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, cameraWork: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="smooth">부드러운</option>
              <option value="dynamic">다이나믹</option>
              <option value="static">정적</option>
              <option value="handheld">핸드헬드</option>
            </select>
          </div>

          {/* 음악 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배경음악</label>
            <select
              value={videoOptions.music}
              onChange={(e) => setVideoOptions(prev => ({ ...prev, music: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="epic">에픽</option>
              <option value="calm">차분한</option>
              <option value="tense">긴장감 있는</option>
              <option value="romantic">로맨틱</option>
              <option value="none">없음</option>
            </select>
          </div>

        </div>

        {/* 커스텀 프롬프트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">추가 프롬프트</label>
          <textarea
            value={videoOptions.customPrompt}
            onChange={(e) => setVideoOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
            placeholder="추가로 적용하고 싶은 영상 설정을 입력하세요..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 옵션 적용 체크박스 */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="applyOptions"
            checked={applyOptions}
            onChange={(e) => setApplyOptions(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="applyOptions" className="text-sm font-medium text-gray-700">
            영상 생성 시 위 옵션들을 적용합니다
          </label>
        </div>
      </div>

    </div>
  );
};
