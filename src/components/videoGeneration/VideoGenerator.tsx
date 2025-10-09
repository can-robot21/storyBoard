import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import VideoGenerationErrorModal from '../common/VideoGenerationErrorModal';
import VideoPromptConfirmModal from '../common/VideoPromptConfirmModal';
import { GeneratedVideo, GeneratedTextCard, GeneratedImage, ErrorModalState, ConfirmModalState, SceneTextCard } from '../../types/videoGeneration';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

interface VideoGeneratorProps {
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  generatedTextCards: GeneratedTextCard[];
  generatedCharacterImages: GeneratedImage[];
  generatedVideoBackgrounds: GeneratedImage[];
  selectedTextCards: Set<number>;
  selectedCharacterImages: Set<number>;
  selectedVideoBackgrounds: Set<number>;
  selectedCuts: Set<string>;
  story: string;
  characterList: any[];
  finalScenario: string;
  generatedProjectData: any;
  // 씬 텍스트 카드 관련 props
  generatedSceneTextCards?: SceneTextCard[];
  // 에피소드 영상 생성 관련 props
  episodes?: Array<{
    id: number;
    title: string;
    description: string;
    scenes: Array<{
      id: number;
      title: string;
      description: string;
      cuts: number;
    }>;
  }>;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  generatedVideos,
  setGeneratedVideos,
  generatedTextCards,
  generatedCharacterImages,
  generatedVideoBackgrounds,
  selectedTextCards,
  selectedCharacterImages,
  selectedVideoBackgrounds,
  selectedCuts,
  story,
  characterList,
  finalScenario,
  generatedProjectData,
  generatedSceneTextCards = [],
  episodes = []
}) => {
  const { addNotification } = useUIStore();
  
  // 상태 관리
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [currentGenerationAbortController, setCurrentGenerationAbortController] = useState<AbortController | null>(null);
  const [selectedVideoModel, setSelectedVideoModel] = useState<'veo-3.0-generate-001' | 'veo-3.0-fast' | 'veo-3.0-standard'>('veo-3.0-generate-001');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoQuality, setVideoQuality] = useState('720p');
  const [videoDuration, setVideoDuration] = useState('medium');
  const [videoFramerate, setVideoFramerate] = useState('30fps');
  const [englishPrompt, setEnglishPrompt] = useState('');

  // 에러 모달 상태
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    error: '',
    hasImages: false,
    currentPrompt: '',
    currentVideoRatio: '16:9',
    currentReferenceImages: []
  });

  // 프롬프트 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    prompt: '',
    videoRatio: '16:9',
    referenceImages: [],
    onConfirm: () => {}
  });

  // 최종 프롬프트 수정 모달 상태
  const [finalPromptModal, setFinalPromptModal] = useState<{
    isOpen: boolean;
    prompt: string;
    onConfirm: (editedPrompt: string) => void;
  }>({
    isOpen: false,
    prompt: '',
    onConfirm: () => {}
  });

  // 최적화된 프롬프트 수정 모달 상태
  const [optimizedPromptModal, setOptimizedPromptModal] = useState<{
    isOpen: boolean;
    originalPrompt: string;
    optimizedPrompt: string;
    referenceImages: string[];
    onConfirm: (finalPrompt: string) => void;
  }>({
    isOpen: false,
    originalPrompt: '',
    optimizedPrompt: '',
    referenceImages: [],
    onConfirm: () => {}
  });

  // 선택된 텍스트 카드들 (일반 텍스트 카드 + 씬 텍스트 카드의 선택된 컷들)
  const selectedTextCardsData = useMemo(() => {
    const regularCards = generatedTextCards.filter(card => selectedTextCards.has(card.id));
    
    // 씬 텍스트 카드에서 선택된 컷들 수집
    const sceneCutCards = generatedSceneTextCards.flatMap(sceneCard => 
      sceneCard.cuts
        .filter(cut => cut.selected)
        .map(cut => ({
          id: cut.id,
          generatedText: cut.text,
          timestamp: cut.timestamp,
          sceneCommon: `${sceneCard.sceneTitle}: ${sceneCard.sceneDescription}`,
          originalSceneCommon: sceneCard.sceneDescription,
          sceneCommonSettings: sceneCard.sceneCommonSettings || ''
        }))
    );
    
    return [...regularCards, ...sceneCutCards];
  }, [generatedTextCards, selectedTextCards, generatedSceneTextCards]);

  // 선택된 캐릭터 이미지들
  const selectedCharacterImagesData = useMemo(() => {
    return generatedCharacterImages.filter(image => selectedCharacterImages.has(image.id));
  }, [generatedCharacterImages, selectedCharacterImages]);

  // 선택된 배경 이미지들
  const selectedBackgroundImagesData = useMemo(() => {
    return generatedVideoBackgrounds.filter(image => selectedVideoBackgrounds.has(image.id));
  }, [generatedVideoBackgrounds, selectedVideoBackgrounds]);

  // 에피소드 영상 생성
  const handleGenerateEpisodeVideo = async (episodeIndex: number) => {
    const episode = episodes[episodeIndex];
    if (!episode) {
      addNotification({
        type: 'error',
        title: '에피소드 오류',
        message: '선택된 에피소드를 찾을 수 없습니다.',
      });
      return;
    }

    // 해당 에피소드의 씬 텍스트 카드 찾기
    const episodeSceneCards = generatedSceneTextCards.filter(card => 
      card.sceneId && episode.scenes.some(scene => scene.id === card.sceneId)
    );

    if (episodeSceneCards.length === 0) {
      addNotification({
        type: 'error',
        title: '텍스트 카드 없음',
        message: '해당 에피소드의 텍스트 카드가 없습니다. 먼저 텍스트 카드를 생성해주세요.',
      });
      return;
    }

    // 선택된 컷들만 필터링
    const selectedSceneCards = episodeSceneCards.filter(card => 
      card.cuts.some(cut => selectedCuts.has(`${card.sceneId}-${cut.cutNumber}`))
    );

    if (selectedSceneCards.length === 0) {
      addNotification({
        type: 'error',
        title: '선택된 컷 없음',
        message: '해당 에피소드에서 선택된 컷이 없습니다.',
      });
      return;
    }

    // 선택된 이미지들 수집
    const selectedImages = [
      ...selectedCharacterImagesData.map(img => ({ type: 'character', image: img.image, description: img.description })),
      ...selectedBackgroundImagesData.map(img => ({ type: 'background', image: img.image, description: img.description }))
    ];

    // 에피소드 영상 생성 프롬프트
    const prompt = `다음 에피소드 정보를 바탕으로 영상을 생성해주세요:

=== 에피소드 정보 ===
제목: ${episode.title}
설명: ${episode.description}

=== 선택된 씬/컷 구성 ===
${selectedSceneCards.map(card => 
  `씬: ${card.sceneTitle}
- 설명: ${card.sceneDescription}
- 공통 설정: ${card.sceneCommonSettings || '기본 설정'}
- 선택된 컷: ${card.cuts.filter(cut => selectedCuts.has(`${card.sceneId}-${cut.cutNumber}`)).map(cut => `컷 ${cut.cutNumber}: ${cut.text}`).join('\n')}`
).join('\n\n')}

=== 참조 이미지 정보 ===
${selectedImages.length > 0 ? selectedImages.map(img => 
  `- ${img.type === 'character' ? '캐릭터' : '배경'} 이미지: ${img.description}`
).join('\n') : '참조 이미지 없음'}

=== 요구사항 ===
1. 에피소드의 전체적인 스토리 흐름을 유지
2. 각 씬의 공통 설정을 일관되게 적용
3. 선택된 컷들의 내용을 정확히 반영
4. 씬 간 자연스러운 전환 효과
5. 에피소드의 분위기와 일치하는 영상 스타일
6. 참조 이미지의 스타일과 분위기를 반영`;

    // 참조 이미지 준비
    const referenceImages = selectedImages.map(img => img.image);

    // 확인 모달 표시
    setConfirmModal({
      isOpen: true,
      prompt,
      videoRatio: '16:9',
      referenceImages,
      onConfirm: () => handleOptimizedPromptEdit(prompt, referenceImages, (finalPrompt) => 
        generateEpisodeVideoWithModel(finalPrompt, '16:9', 'gemini-2.5-flash', referenceImages, episode.title)
      )
    });
  };

  // 최종 프롬프트 수정 핸들러
  const handleFinalPromptEdit = (prompt: string, onConfirm: (editedPrompt: string) => void) => {
    setFinalPromptModal({
      isOpen: true,
      prompt,
      onConfirm
    });
  };

  // 최종 프롬프트 확인 핸들러
  const handleFinalPromptConfirm = (editedPrompt: string) => {
    finalPromptModal.onConfirm(editedPrompt);
    setFinalPromptModal({
      isOpen: false,
      prompt: '',
      onConfirm: () => {}
    });
  };

  // 최적화된 프롬프트 생성 및 수정 핸들러
  const handleOptimizedPromptEdit = async (originalPrompt: string, referenceImages: string[], onConfirm: (finalPrompt: string) => void) => {
    try {
      // AI를 사용하여 프롬프트 최적화
      const optimizationPrompt = `다음 프롬프트를 영상 생성에 최적화하여 개선해주세요:

원본 프롬프트:
${originalPrompt}

참조 이미지 정보:
${referenceImages.length > 0 ? '참조 이미지가 포함되어 있습니다.' : '참조 이미지가 없습니다.'}

요구사항:
1. 영상 생성에 적합한 구체적인 장면 묘사
2. 카메라 앵글과 움직임 명시
3. 조명과 분위기 표현
4. 참조 이미지의 스타일 반영
5. 자연스러운 영상 흐름 구성

최적화된 프롬프트를 생성해주세요:`;

      const optimizedPrompt = await googleAIService.generateText(optimizationPrompt);
      
      setOptimizedPromptModal({
        isOpen: true,
        originalPrompt,
        optimizedPrompt: optimizedPrompt || originalPrompt,
        referenceImages,
        onConfirm
      });
    } catch (error) {
      console.error('프롬프트 최적화 오류:', error);
      // 최적화 실패 시 원본 프롬프트로 진행
      setOptimizedPromptModal({
        isOpen: true,
        originalPrompt,
        optimizedPrompt: originalPrompt,
        referenceImages,
        onConfirm
      });
    }
  };

  // 최적화된 프롬프트 확인 핸들러
  const handleOptimizedPromptConfirm = (finalPrompt: string) => {
    optimizedPromptModal.onConfirm(finalPrompt);
    setOptimizedPromptModal({
      isOpen: false,
      originalPrompt: '',
      optimizedPrompt: '',
      referenceImages: [],
      onConfirm: () => {}
    });
  };

  // 실제 에피소드 영상 생성
  const generateEpisodeVideoWithModel = async (
    prompt: string,
    ratio: string,
    model: string,
    referenceImages: string[],
    episodeTitle: string
  ) => {
    setIsGeneratingVideo(true);
    setConfirmModal({ isOpen: false, prompt: '', videoRatio: '', referenceImages: [], onConfirm: () => {} });

    try {
      const abortController = new AbortController();
      setCurrentGenerationAbortController(abortController);

      const result = await googleAIService.generateVideo({
        prompt,
        ratio,
        model,
        referenceImages,
        abortSignal: abortController.signal
      });

      if (result && result.videoUrl) {
        const newVideo: GeneratedVideo = {
          id: Date.now(),
          title: `${episodeTitle} - 에피소드 영상`,
          description: prompt,
          videoUrl: result.videoUrl,
          thumbnail: result.thumbnail || '',
          duration: result.duration || '0:00',
          timestamp: new Date().toISOString(),
          type: 'episode',
          episodeId: episodes.find(ep => ep.title === episodeTitle)?.id,
          // 기존 필드들 (빈 값으로 설정)
          textCards: [],
          characterImages: [],
          backgrounds: [],
          projectTexts: [],
          aiReviewTexts: [],
          sceneCommonSettings: [],
          video: result.videoUrl,
          videoRatio: '16:9'
        };

        setGeneratedVideos(prev => [...prev, newVideo]);
        
        addNotification({
          type: 'success',
          title: '에피소드 영상 생성 완료',
          message: `${episodeTitle} 에피소드 영상이 성공적으로 생성되었습니다.`,
        });
      } else {
        throw new Error('영상 생성에 실패했습니다.');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        addNotification({
          type: 'info',
          title: '생성 취소됨',
          message: '에피소드 영상 생성이 취소되었습니다.',
        });
      } else {
        console.error('에피소드 영상 생성 오류:', error);
        addNotification({
          type: 'error',
          title: '생성 실패',
          message: `에피소드 영상 생성에 실패했습니다: ${error.message}`,
        });
      }
    } finally {
      setIsGeneratingVideo(false);
      setCurrentGenerationAbortController(null);
    }
  };

  // 영상 생성
  const handleGenerateAIVideo = async () => {
    if (selectedTextCardsData.length === 0) {
      addNotification({
        type: 'error',
        title: '선택 오류',
        message: '최소 하나의 텍스트 카드를 선택해주세요.',
      });
      return;
    }

    // 선택된 이미지들 수집
    const selectedImages = [
      ...selectedCharacterImagesData.map(img => ({ type: 'character', image: img.image, description: img.description })),
      ...selectedBackgroundImagesData.map(img => ({ type: 'background', image: img.image, description: img.description }))
    ];

    // 프롬프트 생성
    const prompt = `다음 정보를 바탕으로 영상을 생성해주세요:

=== 기본 정보 ===
- 스토리: ${story}
- 캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
- 시나리오: ${finalScenario}

=== 선택된 텍스트 카드 ===
${selectedTextCardsData.map((card, index) => `${index + 1}. ${card.generatedText}`).join('\n')}

=== 참조 이미지 정보 ===
${selectedImages.length > 0 ? selectedImages.map(img => 
  `- ${img.type === 'character' ? '캐릭터' : '배경'} 이미지: ${img.description}`
).join('\n') : '참조 이미지 없음'}

=== 영상 설정 ===
- 비율: ${videoRatio}
- 품질: ${videoQuality}
- 길이: ${videoDuration}
- 프레임레이트: ${videoFramerate}
- 모델: ${selectedVideoModel}

=== 요구사항 ===
1. 텍스트 카드의 내용을 정확히 반영
2. 캐릭터의 감정과 행동을 자연스럽게 표현
3. 스토리의 분위기와 일치하는 영상 스타일
4. 참조 이미지의 스타일과 분위기를 반영하여 일관성 유지
5. 고품질, 시네마틱한 영상 제작`;

    // 참조 이미지 준비
    const referenceImages = selectedImages.map(img => img.image);

    // 확인 모달 표시
    setConfirmModal({
      isOpen: true,
      prompt,
      videoRatio,
      referenceImages,
      onConfirm: () => handleOptimizedPromptEdit(prompt, referenceImages, (finalPrompt) => 
        generateVideoWithModel(finalPrompt, videoRatio, selectedVideoModel, referenceImages)
      )
    });
  };

  // 실제 영상 생성
  const generateVideoWithModel = async (prompt: string, videoRatio: string, modelVersion: string, referenceImages?: string[], abortController?: AbortController) => {
    setIsGeneratingVideo(true);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      const result = await googleAIService.generateVideo({
        prompt,
        ratio: videoRatio,
        model: modelVersion,
        referenceImages,
        abortSignal: abortController?.signal
      });

      if (result && result.videoUrl) {
        const newVideo: GeneratedVideo = {
          id: Date.now(),
          textCards: selectedTextCardsData,
          characterImages: selectedCharacterImagesData,
          backgrounds: selectedBackgroundImagesData,
          projectTexts: selectedTextCardsData.map(card => card.generatedText),
          aiReviewTexts: [],
          sceneCommonSettings: selectedTextCardsData.map(card => card.sceneCommon || ''),
          video: result.videoUrl,
          videoRatio: videoRatio,
          timestamp: new Date().toISOString()
        };

        setGeneratedVideos(prev => [...prev, newVideo]);
        
        addNotification({
          type: 'success',
          title: '영상 생성 완료',
          message: '영상이 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('영상 생성 오류:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        addNotification({
          type: 'info',
          title: '생성 취소',
          message: '영상 생성이 취소되었습니다.',
        });
        return;
      }

      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        error: error instanceof Error ? error.message : '영상 생성에 실패했습니다.',
        hasImages: !!(referenceImages && referenceImages.length > 0),
        currentPrompt: prompt,
        currentVideoRatio: videoRatio,
        currentReferenceImages: referenceImages || []
      });
    } finally {
      setIsGeneratingVideo(false);
      setCurrentGenerationAbortController(null);
    }
  };

  // 영상 생성 취소
  const handleCancelVideoGeneration = () => {
    if (currentGenerationAbortController) {
      currentGenerationAbortController.abort();
      setCurrentGenerationAbortController(null);
    }
  };

  // 에러 모달 핸들러
  const handleErrorRetry = () => {
    setErrorModal({ ...errorModal, isOpen: false });
    generateVideoWithModel(errorModal.currentPrompt, errorModal.currentVideoRatio, selectedVideoModel, errorModal.currentReferenceImages);
  };

  const handleErrorRetryWithoutImages = () => {
    setErrorModal({ ...errorModal, isOpen: false });
    generateVideoWithModel(errorModal.currentPrompt, errorModal.currentVideoRatio, selectedVideoModel);
  };

  const handleErrorGenerateStoryboard = () => {
    setErrorModal({ ...errorModal, isOpen: false });
    addNotification({
      type: 'info',
      title: '스토리보드 생성',
      message: '스토리보드 생성 기능은 준비 중입니다.',
    });
  };

  const handleErrorCancel = () => {
    setErrorModal({ ...errorModal, isOpen: false });
  };

  return (
    <div className="bg-red-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold text-red-800 mb-4">🎬 영상 생성</h3>
      
      {/* 에피소드 영상 생성 */}
      {episodes.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <h4 className="text-md font-semibold text-blue-800 mb-3">🎬 에피소드 영상 생성</h4>
          <div className="space-y-3">
            {episodes.map((episode, index) => {
              // 해당 에피소드의 선택된 컷 수 계산
              const episodeSceneCards = generatedSceneTextCards.filter(card => 
                card.sceneId && episode.scenes.some(scene => scene.id === card.sceneId)
              );
              const selectedCutsCount = episodeSceneCards.reduce((count, card) => 
                count + card.cuts.filter(cut => selectedCuts.has(`${card.sceneId}-${cut.cutNumber}`)).length, 0
              );
              const totalCutsCount = episodeSceneCards.reduce((count, card) => count + card.cuts.length, 0);

              return (
                <div key={episode.id} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{episode.title}</div>
                      <div className="text-sm text-gray-600">{episode.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        씬 {episode.scenes.length}개, 총 컷 {episode.scenes.reduce((sum, scene) => sum + (scene.cuts || 3), 0)}개
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        선택된 컷: {selectedCutsCount}개 / {totalCutsCount}개
                        {selectedCutsCount === 0 && <span className="text-red-500 ml-2">⚠️ 컷을 선택해주세요</span>}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleGenerateEpisodeVideo(index)}
                      disabled={isGeneratingVideo || selectedCutsCount === 0}
                      className={`px-4 py-2 rounded transition-colors ${
                        isGeneratingVideo || selectedCutsCount === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isGeneratingVideo ? '생성 중...' : '에피소드 영상 생성'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 영상 설정 */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 모델</label>
            <select
              value={selectedVideoModel}
              onChange={(e) => setSelectedVideoModel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="veo-3.0-generate-001">Veo 3.0 Generate</option>
              <option value="veo-3.0-fast">Veo 3.0 Fast</option>
              <option value="veo-3.0-standard">Veo 3.0 Standard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 비율</label>
            <select
              value={videoRatio}
              onChange={(e) => setVideoRatio(e.target.value as '16:9' | '9:16')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="16:9">16:9 (가로)</option>
              <option value="9:16">9:16 (세로)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
            <select
              value={videoQuality}
              onChange={(e) => setVideoQuality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">길이</label>
            <select
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="short">짧음 (5초)</option>
              <option value="medium">보통 (10초)</option>
              <option value="long">김 (20초)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">프레임레이트</label>
            <select
              value={videoFramerate}
              onChange={(e) => setVideoFramerate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="24fps">24fps</option>
              <option value="30fps">30fps</option>
              <option value="60fps">60fps</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">영어 프롬프트 (선택사항)</label>
          <textarea
            value={englishPrompt}
            onChange={(e) => setEnglishPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            rows={3}
            placeholder="영어로 추가 프롬프트를 입력하세요"
          />
        </div>
      </div>

      {/* 선택된 항목 요약 */}
      <div className="bg-white p-4 rounded-lg border mb-4">
        <h4 className="text-md font-semibold text-gray-800 mb-3">📋 선택된 항목 요약</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 텍스트 카드 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">📝</span>
              <span className="text-sm font-medium text-blue-800">텍스트 카드</span>
            </div>
            <div className="text-sm text-blue-700">
              <div>선택된 컷: <span className="font-semibold">{selectedTextCardsData.length}개</span></div>
              {selectedTextCardsData.length === 0 && (
                <div className="text-xs text-blue-500 mt-1">컷을 선택해주세요</div>
              )}
            </div>
          </div>

          {/* 캐릭터 이미지 */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-600">👤</span>
              <span className="text-sm font-medium text-purple-800">캐릭터 이미지</span>
            </div>
            <div className="text-sm text-purple-700">
              <div>선택된 이미지: <span className="font-semibold">{selectedCharacterImagesData.length}개</span></div>
              {selectedCharacterImagesData.length === 0 && (
                <div className="text-xs text-purple-500 mt-1">캐릭터 이미지를 선택해주세요</div>
              )}
            </div>
          </div>

          {/* 배경 이미지 */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600">🏞️</span>
              <span className="text-sm font-medium text-orange-800">배경 이미지</span>
            </div>
            <div className="text-sm text-orange-700">
              <div>선택된 이미지: <span className="font-semibold">{selectedBackgroundImagesData.length}개</span></div>
              {selectedBackgroundImagesData.length === 0 && (
                <div className="text-xs text-orange-500 mt-1">배경 이미지를 선택해주세요</div>
              )}
            </div>
          </div>
        </div>

        {/* 전체 상태 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">영상 생성 준비 상태:</span>
              <span className={`ml-2 font-semibold ${
                selectedTextCardsData.length > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedTextCardsData.length > 0 ? '✅ 준비 완료' : '❌ 컷을 선택해주세요'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              총 참조 이미지: {selectedCharacterImagesData.length + selectedBackgroundImagesData.length}개
              {(selectedCharacterImagesData.length + selectedBackgroundImagesData.length) > 0 && (
                <span className="text-green-600 ml-1">✓ 영상에 반영됨</span>
              )}
            </div>
          </div>
          
          {/* 이미지 반영 상세 정보 */}
          {(selectedCharacterImagesData.length + selectedBackgroundImagesData.length) > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-green-700">
                <span className="font-medium">🖼️ 참조 이미지 반영:</span>
                {selectedCharacterImagesData.length > 0 && (
                  <span className="ml-2">캐릭터 {selectedCharacterImagesData.length}개</span>
                )}
                {selectedBackgroundImagesData.length > 0 && (
                  <span className="ml-2">배경 {selectedBackgroundImagesData.length}개</span>
                )}
                <span className="ml-2">→ 프롬프트에 포함되어 영상 생성에 활용됩니다</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 영상 생성 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={handleGenerateAIVideo}
          disabled={isGeneratingVideo || selectedTextCardsData.length === 0}
          className={`px-6 py-3 ${
            isGeneratingVideo || selectedTextCardsData.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isGeneratingVideo ? '영상 생성 중...' : 'AI 영상 생성'}
        </Button>
        
        {isGeneratingVideo && (
          <Button
            onClick={handleCancelVideoGeneration}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white"
          >
            생성 취소
          </Button>
        )}
      </div>

      {/* 생성된 영상 목록 */}
      {generatedVideos.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="text-md font-semibold text-red-800">
            생성된 영상 ({generatedVideos.length}개)
          </h4>
          <div className="space-y-4">
            {generatedVideos.map((video, index) => (
              <div key={video.id} className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-800">영상 {index + 1}</h5>
                  <span className="text-xs text-gray-500">
                    {new Date(video.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <video
                      src={video.video}
                      controls
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">비율:</span>
                      <span className="ml-2 text-gray-600">{video.videoRatio}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">텍스트 카드:</span>
                      <span className="ml-2 text-gray-600">{video.textCards.length}개</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">캐릭터 이미지:</span>
                      <span className="ml-2 text-gray-600">{video.characterImages.length}개</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">배경 이미지:</span>
                      <span className="ml-2 text-gray-600">{video.backgrounds.length}개</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      <VideoGenerationErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        error={errorModal.error}
        hasImages={errorModal.hasImages}
        onRetry={handleErrorRetry}
        onRetryWithoutImages={handleErrorRetryWithoutImages}
        onGenerateStoryboard={handleErrorGenerateStoryboard}
        onCancel={handleErrorCancel}
      />

      {/* 확인 모달 */}
      <VideoPromptConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        prompt={confirmModal.prompt}
        optimizedPrompt={confirmModal.prompt}
        modelConfig={{
          displayName: selectedVideoModel,
          model: selectedVideoModel
        }}
        videoConfig={{
          aspectRatio: confirmModal.videoRatio,
          durationSeconds: 8,
          numberOfVideos: 1
        }}
        hasImages={confirmModal.referenceImages.length > 0}
        imageCount={confirmModal.referenceImages.length}
        onConfirm={confirmModal.onConfirm}
      />

      {/* 최종 프롬프트 수정 모달 */}
      {finalPromptModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">최종 프롬프트 수정</h2>
              <button
                onClick={() => setFinalPromptModal({ isOpen: false, prompt: '', onConfirm: () => {} })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* 왼쪽: 프롬프트 편집 */}
              <div className="flex-1 p-4 border-r">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    영상 생성 프롬프트
                  </label>
                  <textarea
                    value={finalPromptModal.prompt}
                    onChange={(e) => setFinalPromptModal(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="영상 생성에 사용될 프롬프트를 수정하세요..."
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 프롬프트 작성 팁</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 구체적인 장면과 액션을 명시하세요</li>
                    <li>• 카메라 앵글과 움직임을 설명하세요</li>
                    <li>• 조명과 분위기를 표현하세요</li>
                    <li>• 영상의 스타일과 톤을 지정하세요</li>
                    <li>• 참조 이미지의 스타일을 반영하세요</li>
                  </ul>
                </div>
              </div>
              
              {/* 오른쪽: 선택된 정보 표시 */}
              <div className="w-80 p-4 bg-gray-50 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">선택된 정보</h3>
                
                {/* 선택된 텍스트 카드 */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">📝 텍스트 카드 ({selectedTextCardsData.length}개)</h4>
                  <div className="space-y-1">
                    {selectedTextCardsData.slice(0, 3).map((card, index) => (
                      <div key={card.id} className="text-xs text-gray-600 bg-white p-2 rounded border">
                        {index + 1}. {card.generatedText.substring(0, 50)}...
                      </div>
                    ))}
                    {selectedTextCardsData.length > 3 && (
                      <div className="text-xs text-gray-500">+ {selectedTextCardsData.length - 3}개 더</div>
                    )}
                  </div>
                </div>

                {/* 선택된 이미지 */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">🖼️ 참조 이미지 ({selectedCharacterImagesData.length + selectedBackgroundImagesData.length}개)</h4>
                  <div className="space-y-1">
                    {selectedCharacterImagesData.slice(0, 2).map((img, index) => (
                      <div key={img.id} className="text-xs text-gray-600 bg-white p-2 rounded border">
                        캐릭터: {img.description?.substring(0, 30)}...
                      </div>
                    ))}
                    {selectedBackgroundImagesData.slice(0, 2).map((img, index) => (
                      <div key={img.id} className="text-xs text-gray-600 bg-white p-2 rounded border">
                        배경: {img.description?.substring(0, 30)}...
                      </div>
                    ))}
                    {(selectedCharacterImagesData.length + selectedBackgroundImagesData.length) > 4 && (
                      <div className="text-xs text-gray-500">+ {(selectedCharacterImagesData.length + selectedBackgroundImagesData.length) - 4}개 더</div>
                    )}
                  </div>
                </div>

                {/* 선택된 컷 (에피소드 영상인 경우) */}
                {selectedCuts.size > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">🎬 선택된 컷 ({selectedCuts.size}개)</h4>
                    <div className="space-y-1">
                      {Array.from(selectedCuts).slice(0, 3).map((cutId, index) => (
                        <div key={cutId} className="text-xs text-gray-600 bg-white p-2 rounded border">
                          컷 {cutId}
                        </div>
                      ))}
                      {selectedCuts.size > 3 && (
                        <div className="text-xs text-gray-500">+ {selectedCuts.size - 3}개 더</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setFinalPromptModal({ isOpen: false, prompt: '', onConfirm: () => {} })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleFinalPromptConfirm(finalPromptModal.prompt)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                수정된 프롬프트로 영상 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 최적화된 프롬프트 수정 모달 */}
      {optimizedPromptModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">최적화된 프롬프트 수정</h2>
              <button
                onClick={() => setOptimizedPromptModal({ isOpen: false, originalPrompt: '', optimizedPrompt: '', referenceImages: [], onConfirm: () => {} })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex overflow-hidden">
              {/* 왼쪽: 원본 프롬프트 */}
              <div className="w-1/3 p-4 border-r bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">📝 원본 프롬프트</h3>
                <div className="bg-white p-3 rounded-lg border h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">{optimizedPromptModal.originalPrompt}</pre>
                </div>
                
                {/* 참조 이미지 정보 */}
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">🖼️ 참조 이미지 ({optimizedPromptModal.referenceImages.length}개)</h4>
                  {optimizedPromptModal.referenceImages.length > 0 ? (
                    <div className="space-y-2">
                      {optimizedPromptModal.referenceImages.slice(0, 3).map((img, index) => (
                        <div key={index} className="bg-white p-2 rounded border">
                          <img src={img} alt={`참조 이미지 ${index + 1}`} className="w-full h-16 object-cover rounded" />
                        </div>
                      ))}
                      {optimizedPromptModal.referenceImages.length > 3 && (
                        <div className="text-xs text-gray-500">+ {optimizedPromptModal.referenceImages.length - 3}개 더</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">참조 이미지 없음</div>
                  )}
                </div>
              </div>
              
              {/* 가운데: 최적화된 프롬프트 편집 */}
              <div className="flex-1 p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✨ 최적화된 프롬프트 (수정 가능)
                  </label>
                  <textarea
                    value={optimizedPromptModal.optimizedPrompt}
                    onChange={(e) => setOptimizedPromptModal(prev => ({ ...prev, optimizedPrompt: e.target.value }))}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="AI가 최적화한 프롬프트를 수정하세요..."
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">🤖 AI 최적화 가이드</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• 영상 생성에 최적화된 구체적인 장면 묘사</li>
                    <li>• 카메라 앵글과 움직임이 명시됨</li>
                    <li>• 조명과 분위기가 표현됨</li>
                    <li>• 참조 이미지 스타일이 반영됨</li>
                    <li>• 자연스러운 영상 흐름이 구성됨</li>
                  </ul>
                </div>
              </div>
              
              {/* 오른쪽: 비교 및 미리보기 */}
              <div className="w-1/3 p-4 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">📊 프롬프트 비교</h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-1">원본 길이</div>
                    <div className="text-sm text-gray-600">{optimizedPromptModal.originalPrompt.length}자</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-1">최적화 길이</div>
                    <div className="text-sm text-gray-600">{optimizedPromptModal.optimizedPrompt.length}자</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 mb-1">참조 이미지</div>
                    <div className="text-sm text-gray-600">{optimizedPromptModal.referenceImages.length}개</div>
                  </div>
                </div>
                
                <div className="mt-4 bg-white p-3 rounded-lg border">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">💡 최적화 포인트</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ 구체적인 장면 묘사</li>
                    <li>✓ 카메라 워크 명시</li>
                    <li>✓ 조명 및 분위기</li>
                    <li>✓ 참조 이미지 반영</li>
                    <li>✓ 영상 흐름 최적화</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-600">
                AI가 최적화한 프롬프트를 수정하여 더 나은 영상을 생성하세요
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setOptimizedPromptModal({ isOpen: false, originalPrompt: '', optimizedPrompt: '', referenceImages: [], onConfirm: () => {} })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleOptimizedPromptConfirm(optimizedPromptModal.optimizedPrompt)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  최적화된 프롬프트로 영상 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
