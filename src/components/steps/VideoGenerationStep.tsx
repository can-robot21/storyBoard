import React, { useState } from 'react';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

interface GeneratedTextCard {
  id: number;
  generatedText: string;
  timestamp: string;
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
  characterPrompt,
  scenarioPrompt,
  storySummary,
  finalScenario,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  characterList,
  onNext
}) => {
  const { addNotification } = useUIStore();
  
  // 영상 비율 설정 (1:1은 Veo API에서 지원되지 않음)
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // 입력 필드들
  const [storySceneInput, setStorySceneInput] = useState('');
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
  const [applyOptions, setApplyOptions] = useState(false);
  
  
  // 텍스트 참조 표시는 props로 받음

  // 텍스트 카드 생성 (구조화된 AI 프롬프트 사용)
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
      // 간단한 AI 텍스트 생성
      const textPrompt = `다음 장면을 바탕으로 영상 제작용 텍스트 카드를 생성해주세요:

${storySceneInput}

영상 제작에 필요한 다음 요소들을 포함해주세요:
- 장면 설명
- 캐릭터 액션
- 대사 (있는 경우)
- 시각적 요소
- 카메라 앵글 제안
- 분위기와 감정`;

      const result = await googleAIService.generateText(textPrompt);
      
      const newTextCard = {
        id: Date.now(),
        generatedText: result,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedTextCards([...generatedTextCards, newTextCard]);
      setStorySceneInput('');
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '구조화된 텍스트 카드가 생성되었습니다.',
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

  // AI 영상 생성
  const handleGenerateAIVideo = async () => {
    // 선택된 항목들만 사용
    const selectedTextCardsFiltered = generatedTextCards.filter(card => 
      selectedTextCards.has(card.id)
    );
    const selectedCharacterImagesFiltered = generatedCharacterImages.filter(img => 
      selectedCharacterImages.has(img.id)
    );
    const selectedBackgroundsFiltered = generatedVideoBackgrounds.filter(bg => 
      selectedVideoBackgrounds.has(bg.id)
    );

    if (selectedTextCardsFiltered.length === 0 || selectedCharacterImagesFiltered.length === 0 || selectedBackgroundsFiltered.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '최소 1개씩 텍스트 카드, 캐릭터 이미지, 배경 이미지를 선택해주세요.',
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

      // 기본 프롬프트 구성
      let prompt = `다음 선택된 요소들과 프로젝트 개요 텍스트를 바탕으로 컷별 영상을 생성해주세요:

=== 프로젝트 개요 텍스트 ===
${projectTexts.join('\n\n')}

=== AI 검토 결과 ===
${aiReviewTexts.join('\n\n')}

=== 선택된 스토리/장면 (컷별) ===
${selectedTextCardsFiltered.map((card, index) => `컷 ${index + 1}: ${card.generatedText}`).join('\n\n')}

=== 선택된 캐릭터 이미지 ===
${selectedCharacterImagesFiltered.map(img => img.input).join(', ')}

=== 선택된 배경 ===
${selectedBackgroundsFiltered.map(bg => bg.input).join(', ')}

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

      const videoResult = await googleAIService.generateVideo(prompt, videoRatio);
      
      const newVideo = {
        id: Date.now(),
        textCards: selectedTextCardsFiltered,
        characterImages: selectedCharacterImagesFiltered,
        backgrounds: selectedBackgroundsFiltered,
        projectTexts: projectTexts,
        aiReviewTexts: aiReviewTexts,
        video: videoResult,
        videoRatio: videoRatio,
        timestamp: new Date().toISOString()
      };
      
      setGeneratedVideos([...generatedVideos, newVideo]);
      
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

  // 재생성 함수들
  const handleRegenerateTextCard = async (cardId: number) => {
    try {
      const textCard = generatedTextCards.find(card => card.id === cardId);
      if (!textCard) return;

      const textResult = await googleAIService.generateText(textCard.generatedText);
      
      setGeneratedTextCards((prev: GeneratedTextCard[]) =>
        prev.map((card: GeneratedTextCard) =>
          card.id === cardId
            ? { ...card, generatedText: textResult, timestamp: new Date().toISOString() }
            : card
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '텍스트 카드가 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '텍스트 카드 재생성에 실패했습니다.',
      });
    }
  };

  const handleRegenerateCharacterImage = async (imageId: number) => {
    try {
      const characterImage = generatedCharacterImages.find(img => img.id === imageId);
      if (!characterImage) return;

      const imageResult = await googleAIService.generateCharacterImage(characterImage.input);
      
      setGeneratedCharacterImages((prev: GeneratedImage[]) =>
        prev.map((img: GeneratedImage) =>
          img.id === imageId
            ? { ...img, image: imageResult, timestamp: new Date().toISOString() }
            : img
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

  const handleRegenerateVideoBackground = async (backgroundId: number) => {
    try {
      const background = generatedVideoBackgrounds.find(bg => bg.id === backgroundId);
      if (!background) return;

      const imageResult = await googleAIService.generateBackgroundImage(background.input);
      
      setGeneratedVideoBackgrounds((prev: GeneratedImage[]) =>
        prev.map((bg: GeneratedImage) =>
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

  // 삭제 함수들
  const handleDeleteTextCard = (cardId: number) => {
    setGeneratedTextCards((prev: GeneratedTextCard[]) => prev.filter((card: GeneratedTextCard) => card.id !== cardId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '텍스트 카드가 삭제되었습니다.',
    });
  };

  const handleDeleteCharacterImage = (imageId: number) => {
    setGeneratedCharacterImages((prev: GeneratedImage[]) => prev.filter((img: GeneratedImage) => img.id !== imageId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '캐릭터 이미지가 삭제되었습니다.',
    });
  };

  const handleDeleteVideoBackground = (backgroundId: number) => {
    setGeneratedVideoBackgrounds((prev: GeneratedImage[]) => prev.filter((bg: GeneratedImage) => bg.id !== backgroundId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '배경 이미지가 삭제되었습니다.',
    });
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

      {/* 1. 스토리/장면 입력 */}
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

      {/* 생성 결과는 오른쪽 본문에 표시되므로 왼쪽에서는 제거 */}

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
          disabled={generatedTextCards.length === 0 || generatedCharacterImages.length === 0 || generatedVideoBackgrounds.length === 0}
        >
          🎬 AI 영상 생성
        </Button>
        
        {(generatedTextCards.length === 0 || generatedCharacterImages.length === 0 || generatedVideoBackgrounds.length === 0) && (
          <div className="text-xs text-gray-500 mt-2 text-center">
            텍스트 카드, 캐릭터 이미지, 배경 이미지를 먼저 생성해주세요.
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
