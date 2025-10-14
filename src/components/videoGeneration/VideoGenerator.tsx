import React, { useState, useMemo, useRef, useCallback } from 'react';
import Button from '../common/Button';
import VideoCardModal from '../common/VideoCardModal';
import VideoGenerationErrorModal from '../common/VideoGenerationErrorModal';
import VideoPromptConfirmModal from '../common/VideoPromptConfirmModal';
import ImageSelectionModal from '../common/ImageSelectionModal';
import { GeneratedVideo, GeneratedTextCard, GeneratedImage, ErrorModalState, ConfirmModalState, SceneTextCard } from '../../types/videoGeneration';
import { Episode, Scene } from '../../types/projectOverview';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';
import { Upload, Image as ImageIcon, Zap, Download, Play } from 'lucide-react';

interface VideoGeneratorProps {
  generatedVideos: GeneratedVideo[];
  setGeneratedVideos: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  generatedTextCards: GeneratedTextCard[];
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<GeneratedTextCard[]>>;
  generatedCharacterImages: GeneratedImage[];
  generatedVideoBackgrounds: GeneratedImage[];
  selectedTextCards: Set<number>;
  setSelectedTextCards: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCharacterImages: Set<number>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedCuts: Set<string>;
  story: string;
  characterList: any[];
  finalScenario: string;
  generatedProjectData: any;
  // 씬 텍스트 카드 관련 props
  generatedSceneTextCards?: SceneTextCard[];
  // 에피소드 구조 관련 props
  episodes?: Episode[];
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  generatedVideos,
  setGeneratedVideos,
  generatedTextCards,
  setGeneratedTextCards,
  generatedCharacterImages,
  generatedVideoBackgrounds,
  selectedTextCards,
  setSelectedTextCards,
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
  const [videoDuration, setVideoDuration] = useState('8');
  const [customDuration, setCustomDuration] = useState('8');
  const [englishPrompt, setEnglishPrompt] = useState('');
  const [koreanPrompt, setKoreanPrompt] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 새로운 상태들
  const [skipPromptEdit, setSkipPromptEdit] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 컷 단위 프롬프트 상태
  const [cutBasedPrompt, setCutBasedPrompt] = useState<{
    cuts: Array<{
      id: string;
      startTime: string;
      endTime: string;
      description: string;
      dialogue: string;
      character: string;
      cameraAngle: string;
      style: string;
    }>;
    backgroundSound: string;
    styleTags: string[];
  }>({
    cuts: [],
    backgroundSound: '',
    styleTags: []
  });
  
  // 영상 카드 모달 상태
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // 새로운 상태들
  const [showImageSelectionModal, setShowImageSelectionModal] = useState(false);
  const [selectedStoredImages, setSelectedStoredImages] = useState<string[]>([]);
  const [useDefaultOptions, setUseDefaultOptions] = useState(true);
  const [generationMode, setGenerationMode] = useState<'simple' | 'advanced'>('simple');

  // 에러 모달 상태
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    error: '',
    hasImages: false,
    currentPrompt: '',
    currentVideoRatio: '16:9',
    currentReferenceImages: []
  });

  // 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    prompt: '',
    videoRatio: '16:9',
    referenceImages: [],
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

  // 에피소드 구조 기반 영상 생성 정보 계산
  const getEpisodeBasedVideoInfo = useMemo(() => {
    if (episodes.length === 0) return null;

    const totalScenes = episodes.reduce((sum, episode) => sum + episode.scenes.length, 0);
    const totalCuts = episodes.reduce((sum: number, episode: Episode) => 
      sum + episode.scenes.reduce((sceneSum: number, scene: Scene) => sceneSum + scene.cuts, 0), 0
    );

    return {
      totalEpisodes: episodes.length,
      totalScenes,
      totalCuts,
      averageCutsPerScene: totalScenes > 0 ? Math.round(totalCuts / totalScenes) : 3,
      episodes: episodes.map(episode => ({
        title: episode.title,
        sceneCount: episode.scenes.length,
        cutCount: episode.scenes.reduce((sum: number, scene: Scene) => sum + scene.cuts, 0)
      }))
    };
  }, [episodes]);

  // 최적화된 프롬프트 생성 (에피소드 구조 반영)
  const createOptimizedPrompt = useCallback((basePrompt: string) => {
    if (!getEpisodeBasedVideoInfo) return basePrompt;

    const episodeInfo = getEpisodeBasedVideoInfo;
    const episodeStructure = episodeInfo.episodes.map(ep => 
      `- ${ep.title}: ${ep.sceneCount}개 씬, ${ep.cutCount}개 컷`
    ).join('\n');

    return `${basePrompt}
    
=== 에피소드 구조 정보 ===
총 에피소드: ${episodeInfo.totalEpisodes}개
총 씬: ${episodeInfo.totalScenes}개
총 컷: ${episodeInfo.totalCuts}개
씬당 평균 컷: ${episodeInfo.averageCutsPerScene}개

에피소드별 구성:
${episodeStructure}

위 에피소드 구조를 반영하여 일관성 있는 영상을 생성해주세요.`;
  }, [getEpisodeBasedVideoInfo]);

  // 한국어 프롬프트를 영문으로 번역
  const translateKoreanPrompt = useCallback(async (koreanText: string) => {
    if (!koreanText.trim()) return;
    
    setIsTranslating(true);
    try {
      const { googleAIService } = await import('../../services/googleAIService');
      const translatedText = await googleAIService.generateText(
        `다음 한국어 텍스트를 자연스러운 영어로 번역해주세요. 영상 생성에 적합한 표현으로 번역해주세요:\n\n${koreanText}`
      );
      
      if (translatedText) {
        setEnglishPrompt(translatedText);
        addNotification({
          type: 'success',
          title: '번역 완료',
          message: '한국어 프롬프트가 영어로 번역되었습니다.',
        });
      }
    } catch (error) {
      console.error('번역 오류:', error);
      addNotification({
        type: 'error',
        title: '번역 실패',
        message: '프롬프트 번역에 실패했습니다.',
      });
    } finally {
      setIsTranslating(false);
    }
  }, [addNotification]);

  // 선택된 텍스트 카드들 (일반 텍스트 카드 + 씬 텍스트 카드의 선택된 컷들)
  const selectedTextCardsData = useMemo(() => {
    const regularCards = generatedTextCards.filter(card => selectedTextCards.has(card.id));
    
    // 씬 텍스트 카드에서 선택된 컷들 수집
    const sceneCutCards = generatedSceneTextCards.flatMap(sceneCard => 
      sceneCard.cuts.filter(cut => selectedCuts.has(cut.id.toString()))
    );
    
    return [...regularCards, ...sceneCutCards];
  }, [generatedTextCards, selectedTextCards, generatedSceneTextCards, selectedCuts]);

  // 선택된 캐릭터 이미지들
  const selectedCharacterImagesData = useMemo(() => {
    return generatedCharacterImages.filter(image => selectedCharacterImages.has(image.id));
  }, [generatedCharacterImages, selectedCharacterImages]);

  // 선택된 배경 이미지들
  const selectedBackgroundImagesData = useMemo(() => {
    return generatedVideoBackgrounds.filter(image => selectedVideoBackgrounds.has(image.id));
  }, [generatedVideoBackgrounds, selectedVideoBackgrounds]);

  // 모든 참조 이미지 가져오기
  const getAllReferenceImages = () => {
    const allImages = [
      ...uploadedImages,
      ...selectedStoredImages,
      ...selectedCharacterImagesData.map(img => img.image),
      ...selectedBackgroundImagesData.map(img => img.image)
    ];
    return allImages;
  };

  // 파일 선택 핸들러
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === files.length) {
            setUploadedImages(prev => [...prev, ...newImages]);
          }
          }
        };
        reader.readAsDataURL(file);
    });
  };

  // 저장된 이미지 선택 핸들러
  const handleStoredImageSelect = (images: string[]) => {
    setSelectedStoredImages(images);
    setShowImageSelectionModal(false);
    console.log('저장된 이미지 선택됨:', images.length, '개');
  };

  // 영상 생성 핸들러 (최적화된 버전)
  const handleGenerateAIVideo = async () => {
    // 중복 클릭 방지
    if (isGeneratingVideo || isProcessing) {
      addNotification({
        type: 'warning',
        title: '처리 중',
        message: '이미 영상 생성이 진행 중입니다.',
      });
      return;
    }

    if (!englishPrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '영문 프롬프트를 입력해주세요.',
      });
      return;
    }

    setIsProcessing(true);
    setGenerationStep('영상 생성 준비 중...');

    try {
      // 모든 참조 이미지 수집
      const referenceImages = getAllReferenceImages();

      // 참조 이미지 정보 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('영상 생성에 사용될 참조 이미지:', {
          업로드된_이미지: uploadedImages.length,
          저장된_이미지: selectedStoredImages.length,
          선택된_캐릭터_이미지: selectedCharacterImagesData.length,
          선택된_배경_이미지: selectedBackgroundImagesData.length,
          총_참조_이미지: referenceImages.length
        });
      }

      // 프롬프트 수정 단계 생략 옵션 확인
      if (skipPromptEdit) {
        setGenerationStep('프롬프트 수정 단계 생략...');
        // 바로 영상 생성 진행
        await generateVideoWithModel(englishPrompt, videoRatio, selectedVideoModel, referenceImages);
      } else {
        // 프롬프트 수정 진행 여부 확인
        const shouldSkip = window.confirm(
          '프롬프트 수정 단계를 생략하고 바로 영상 생성을 진행하시겠습니까?\n\n' +
          '• 예: 입력한 프롬프트로 바로 생성\n' +
          '• 아니오: AI가 프롬프트를 최적화한 후 생성'
        );

        if (shouldSkip) {
          setSkipPromptEdit(true);
          setGenerationStep('프롬프트 수정 단계 생략...');
          await generateVideoWithModel(englishPrompt, videoRatio, selectedVideoModel, referenceImages);
        } else {
          setGenerationStep('프롬프트 최적화 중...');
          await handleOptimizedPromptEdit(englishPrompt, referenceImages, (finalPrompt) => 
            generateVideoWithModel(finalPrompt, videoRatio, selectedVideoModel, referenceImages)
          );
        }
      }
    } catch (error) {
      console.error('영상 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '영상 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
      setGenerationStep('');
    }
  };

  // 컷 기반 프롬프트 생성 함수
  const generateCutBasedPrompt = async (originalPrompt: string, referenceImages: string[]) => {
    try {
      const cutPrompt = `다음 프롬프트를 컷 단위로 분석하여 [00:00-00:01] 형식의 시간 표시와 함께 디테일한 영상 프롬프트를 생성해주세요:

원본 프롬프트:
${originalPrompt}

참조 이미지 정보:
${referenceImages.length > 0 ? '참조 이미지가 포함되어 있습니다.' : '참조 이미지가 없습니다.'}

다음 형식으로 생성해주세요:

[00:00–00:01]  
카메라 앵글과 장면 설명 (구체적인 시각적 묘사)

[00:01–00:02]  
다음 컷의 카메라 앵글과 장면 설명

[00:02–00:03]  
다음 컷의 카메라 앵글과 장면 설명

🎧 Background sounds: 배경음 설명

🗣️ Dialogue:  
👔 캐릭터명 (동작 설명): "대사 내용"  
😟 캐릭터명 (동작 설명): "대사 내용"

🎨 Style Tags: 스타일 태그들

각 컷은 1초 단위로 구성하고, 구체적인 카메라 앵글(Wide shot, Medium shot, Close-up 등), 캐릭터 동작, 조명, 스타일을 포함해주세요.`;

      const cutBasedResult = await googleAIService.generateText(cutPrompt);
      
      if (cutBasedResult) {
        // 결과를 파싱하여 컷 단위로 분리
        parseCutBasedPrompt(cutBasedResult);
        return cutBasedResult;
      }
    } catch (error) {
      console.error('컷 기반 프롬프트 생성 오류:', error);
    }
    return originalPrompt;
  };

  // 컷 기반 프롬프트 파싱 함수
  const parseCutBasedPrompt = (promptText: string) => {
    const cuts: Array<{
      id: string;
      startTime: string;
      endTime: string;
      description: string;
      dialogue: string;
      character: string;
      cameraAngle: string;
      style: string;
    }> = [];

    // 시간 패턴 매칭 [00:00–00:01]
    const timePattern = /\[(\d{2}:\d{2})–(\d{2}:\d{2})\]/g;
    const lines = promptText.split('\n');
    
    let currentCut: any = null;
    let backgroundSound = '';
    let styleTags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 시간 패턴 매칭
      const timeMatch = line.match(timePattern);
      if (timeMatch) {
        if (currentCut) {
          cuts.push(currentCut);
        }
        
        const timeStr = timeMatch[0];
        const timeParts = timeStr.match(/(\d{2}:\d{2})–(\d{2}:\d{2})/);
        if (timeParts) {
          currentCut = {
            id: `cut_${cuts.length + 1}`,
            startTime: timeParts[1],
            endTime: timeParts[2],
            description: lines[i + 1]?.trim() || '',
            dialogue: '',
            character: '',
            cameraAngle: '',
            style: ''
          };
        }
      }
      
      // 배경음 찾기
      if (line.includes('🎧 Background sounds:')) {
        backgroundSound = line.replace('🎧 Background sounds:', '').trim();
      }
      
      // 스타일 태그 찾기
      if (line.includes('🎨 Style Tags:')) {
        const tags = line.replace('🎨 Style Tags:', '').trim();
        styleTags = tags.split(',').map(tag => tag.trim());
      }
      
      // 대사 찾기
      if (line.includes('🗣️ Dialogue:')) {
        // 다음 몇 줄에서 대사 추출
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const dialogueLine = lines[j].trim();
          if (dialogueLine.includes(':')) {
            const [character, dialogue] = dialogueLine.split(':');
            if (currentCut) {
              currentCut.dialogue = dialogue?.replace(/[""]/g, '').trim() || '';
              currentCut.character = character?.trim() || '';
            }
          }
        }
      }
    }
    
    if (currentCut) {
      cuts.push(currentCut);
    }

    setCutBasedPrompt({
      cuts,
      backgroundSound,
      styleTags
    });
  };

  // 최종 프롬프트 생성 함수
  const generateFinalPrompt = () => {
    let finalPrompt = '';
    
    // 컷별 프롬프트 생성
    cutBasedPrompt.cuts.forEach((cut) => {
      finalPrompt += `[${cut.startTime}–${cut.endTime}]\n`;
      finalPrompt += `${cut.description}\n\n`;
    });
    
    // 배경음 추가
    if (cutBasedPrompt.backgroundSound) {
      finalPrompt += `🎧 Background sounds: ${cutBasedPrompt.backgroundSound}\n\n`;
    }
    
    // 대사 추가
    const dialogues = cutBasedPrompt.cuts.filter(cut => cut.dialogue && cut.character);
    if (dialogues.length > 0) {
      finalPrompt += `🗣️ Dialogue:\n`;
      dialogues.forEach((cut) => {
        finalPrompt += `👔 ${cut.character}: "${cut.dialogue}"\n`;
      });
      finalPrompt += '\n';
    }
    
    // 스타일 태그 추가
    if (cutBasedPrompt.styleTags.length > 0) {
      finalPrompt += `🎨 Style Tags: ${cutBasedPrompt.styleTags.join(', ')}\n`;
    }
    
    return finalPrompt.trim();
  };

  // 최적화된 프롬프트 생성 및 수정 핸들러
  const handleOptimizedPromptEdit = async (originalPrompt: string, referenceImages: string[], onConfirm: (finalPrompt: string) => void) => {
    try {
      // 컷 기반 프롬프트 생성
      const cutBasedPrompt = await generateCutBasedPrompt(originalPrompt, referenceImages);
      
      if (cutBasedPrompt) {
        setOptimizedPromptModal({
          isOpen: true,
          originalPrompt,
          optimizedPrompt: cutBasedPrompt,
          referenceImages,
          onConfirm
        });
      }
    } catch (error) {
      console.error('프롬프트 최적화 오류:', error);
      // 최적화 실패 시 원본 프롬프트로 진행
      onConfirm(originalPrompt);
    }
  };

  // 실제 영상 생성
  const generateVideoWithModel = async (prompt: string, videoRatio: string, modelVersion: string, referenceImages?: string[], abortController?: AbortController) => {
    setIsGeneratingVideo(true);
    setGenerationProgress(0);
    setEstimatedTime('예상 시간: 2-3분');
    setConfirmModal({ ...confirmModal, isOpen: false });
    
    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 2000);

    try {
      // 단계별 진행 표시
      setGenerationStep('프롬프트 최적화 중...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기

      setGenerationStep('영상 생성 요청 중...');
      // 최적화된 프롬프트 생성
      const optimizedPrompt = createOptimizedPrompt(prompt);
      
      setGenerationStep('AI 서버에 영상 생성 요청 중...');
      const result = await googleAIService.generateVideo({
        prompt: optimizedPrompt,
        ratio: videoRatio,
        model: modelVersion,
        duration: videoDuration === 'custom' ? customDuration : videoDuration,
        referenceImages,
        abortSignal: abortController?.signal
      });

      if (result && result.videoUrl) {
        setGenerationStep('영상 생성 완료!');
        setGenerationProgress(100);
        setEstimatedTime('완료!');
        
        const newVideo: GeneratedVideo = {
          id: Date.now(),
          textCards: [], // 텍스트 카드 의존성 제거
          characterImages: selectedCharacterImagesData,
          backgrounds: selectedBackgroundImagesData,
          projectTexts: [optimizedPrompt], // 최적화된 프롬프트 사용
          aiReviewTexts: [],
          sceneCommonSettings: [],
          video: result.videoUrl,
          videoRatio: videoRatio,
          timestamp: new Date().toISOString(),
          videoUrl: result.videoUrl,
          thumbnail: result.thumbnail,
          duration: result.duration,
          type: 'general'
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
      clearInterval(progressInterval);
      setIsGeneratingVideo(false);
      setCurrentGenerationAbortController(null);
      setGenerationProgress(0);
      setEstimatedTime('');
      setGenerationStep('');
    }
  };

  // 영상 생성 취소
  const handleCancelVideoGeneration = () => {
    if (currentGenerationAbortController) {
      currentGenerationAbortController.abort();
    }
  };

  // 영상 다운로드 핸들러
  const handleVideoDownload = async (video: GeneratedVideo, event: React.MouseEvent) => {
    event.stopPropagation(); // 카드 클릭 이벤트 방지
    
    try {
      if (!video.videoUrl) {
        addNotification({
          type: 'error',
          title: '다운로드 실패',
          message: '영상 URL이 없습니다.',
        });
        return;
      }

      // 영상 다운로드
      const response = await fetch(video.videoUrl);
      if (!response.ok) {
        throw new Error('영상 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 파일명 생성 (타임스탬프 포함)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `video_${timestamp}.mp4`;
      
      // 다운로드 실행
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 메모리 정리
      window.URL.revokeObjectURL(url);
      
      addNotification({
        type: 'success',
        title: '다운로드 완료',
        message: '영상이 성공적으로 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('영상 다운로드 오류:', error);
      addNotification({
        type: 'error',
        title: '다운로드 실패',
        message: '영상 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  // 영상 카드 클릭 핸들러
  const handleVideoCardClick = (video: GeneratedVideo) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  // 영상 삭제 핸들러
  const handleVideoDelete = (videoId: number) => {
    setGeneratedVideos(prev => prev.filter(video => video.id !== videoId));
    addNotification({
      type: 'success',
      title: '영상 삭제 완료',
      message: '영상이 성공적으로 삭제되었습니다.',
    });
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

  return (
    <div className="space-y-6">
      {/* 에피소드 구조 정보 표시 */}
      {getEpisodeBasedVideoInfo && (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="font-medium text-green-800">🎬 에피소드 구조 정보</h5>
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
              구조 기반 생성
            </span>
          </div>
          <div className="text-sm text-green-700">
            <p>총 {getEpisodeBasedVideoInfo.totalEpisodes}개 에피소드, {getEpisodeBasedVideoInfo.totalScenes}개 씬, {getEpisodeBasedVideoInfo.totalCuts}개 컷</p>
            <div className="mt-1 text-xs text-green-600">
              {getEpisodeBasedVideoInfo.episodes.map((ep, index) => (
                <span key={index} className="mr-3">
                  {ep.title}: {ep.sceneCount}씬/{ep.cutCount}컷
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 간단/고급 모드 선택 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">영상 생성</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setGenerationMode('simple')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                generationMode === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              간단 모드
            </button>
            <button
              onClick={() => setGenerationMode('advanced')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                generationMode === 'advanced'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              고급 모드
            </button>
          </div>
        </div>

        {/* 간단 모드 */}
        {generationMode === 'simple' && (
          <div className="space-y-4">
            {/* 원클릭 영상 생성 */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h5 className="font-medium text-green-800">🚀 원클릭 영상 생성</h5>
                  <p className="text-sm text-green-600">AI가 자동으로 최적의 프롬프트를 생성합니다</p>
                </div>
                <button
                  onClick={async () => {
                    if (!story && !finalScenario) {
                      addNotification({
                        type: 'error',
                        title: '입력 필요',
                        message: '스토리나 시나리오 정보가 필요합니다.',
                      });
                      return;
                    }

                    try {
                      const { googleAIService } = await import('../../services/googleAIService');
                      const autoPrompt = await googleAIService.generateText(
                        `다음 정보를 바탕으로 영상 생성에 최적화된 영문 프롬프트를 생성해주세요:

스토리: ${story || '없음'}
시나리오: ${finalScenario || '없음'}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ') || '없음'}

영상 생성에 적합한 자연스러운 영어 프롬프트를 생성해주세요.`
                      );
                      
                      if (autoPrompt) {
                        setEnglishPrompt(autoPrompt);
                        addNotification({
                          type: 'success',
                          title: '자동 프롬프트 생성 완료',
                          message: 'AI가 최적의 프롬프트를 생성했습니다.',
                        });
                      }
                    } catch (error) {
                      console.error('자동 프롬프트 생성 오류:', error);
                      addNotification({
                        type: 'error',
                        title: '생성 실패',
                        message: '자동 프롬프트 생성에 실패했습니다.',
                      });
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  ✨ AI 프롬프트 생성
                </button>
              </div>
              <div className="text-xs text-green-600">
                스토리와 시나리오 정보를 바탕으로 AI가 자동으로 영상 생성 프롬프트를 만들어드립니다.
              </div>
            </div>

            {/* 기본 옵션 적용 여부 */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-blue-800">기본 옵션 적용</h5>
                  <p className="text-sm text-blue-600">권장 설정으로 빠른 영상 생성</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefaultOptions}
                    onChange={(e) => setUseDefaultOptions(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* 한국어 프롬프트 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                한국어 프롬프트
              </label>
              <div className="space-y-2">
                <textarea
                  value={koreanPrompt}
                  onChange={(e) => setKoreanPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="한국어로 영상에 대한 설명을 입력하세요..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => translateKoreanPrompt(koreanPrompt)}
                    disabled={!koreanPrompt.trim() || isTranslating}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      !koreanPrompt.trim() || isTranslating
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isTranslating ? '번역 중...' : '영문으로 번역'}
                  </button>
                  <span className="text-xs text-gray-500 self-center">
                    한국어로 입력하면 자동으로 영문으로 번역됩니다
                  </span>
                </div>
              </div>
            </div>

            {/* 영문 프롬프트 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                영문 프롬프트 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <textarea
                  value={englishPrompt}
                  onChange={(e) => setEnglishPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="영어로 영상 내용을 설명해주세요. 예: A beautiful sunset over mountains with birds flying"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!englishPrompt.trim()) {
                        addNotification({
                          type: 'error',
                          title: '입력 필요',
                          message: '영문 프롬프트를 먼저 입력해주세요.',
                        });
                        return;
                      }
                      
                      setOptimizedPromptModal({
                        isOpen: true,
                        originalPrompt: englishPrompt,
                        optimizedPrompt: englishPrompt,
                        referenceImages: getAllReferenceImages(),
                        onConfirm: (finalPrompt) => {
                          setEnglishPrompt(finalPrompt);
                          setOptimizedPromptModal({ ...optimizedPromptModal, isOpen: false });
                          addNotification({
                            type: 'success',
                            title: '프롬프트 수정 완료',
                            message: '프롬프트가 수정되었습니다.',
                          });
                        }
                      });
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    ✏️ 프롬프트 수정
                  </button>
                  <span className="text-xs text-gray-500 self-center">
                    AI가 프롬프트를 최적화해드립니다
                  </span>
                </div>
              </div>
            </div>

            {/* 통합 참조 이미지 관리 */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-purple-800">🖼️ 참조 이미지 관리</h5>
                <div className="flex gap-2">
                  <Button
                    onClick={handleFileSelect}
                    className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    업로드
                  </Button>
                  <Button
                    onClick={() => setShowImageSelectionModal(true)}
                    className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 text-sm"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    선택
                  </Button>
                </div>
                </div>

                {/* 선택된 이미지 미리보기 */}
              <div className="space-y-2">
                {getAllReferenceImages().length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {getAllReferenceImages().slice(0, 8).map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`참조 이미지 ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => {
                            // 이미지 제거 로직
                            if (uploadedImages.includes(image)) {
                              setUploadedImages(prev => prev.filter(img => img !== image));
                            }
                            if (selectedStoredImages.includes(image)) {
                              setSelectedStoredImages(prev => prev.filter(img => img !== image));
                            }
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {getAllReferenceImages().length > 8 && (
                      <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{getAllReferenceImages().length - 8}개 더
                        </div>
                    )}
                      </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    참조 이미지가 없습니다. 업로드 또는 선택 버튼을 클릭하여 추가하세요.
                  </div>
                )}
            </div>

              <div className="mt-2 text-xs text-purple-600">
                총 {getAllReferenceImages().length}개의 참조 이미지가 선택되었습니다.
                </div>
                </div>
                
            {/* 영상 생성 진행률 표시 */}
            {isGeneratingVideo && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-yellow-800">🎬 영상 생성 중...</h5>
                  <span className="text-sm text-yellow-600">{estimatedTime}</span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs text-yellow-600">
                  <span>{Math.round(generationProgress)}% 완료</span>
                  <button
                    onClick={handleCancelVideoGeneration}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 프롬프트 수정 생략 옵션 */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-yellow-800">⚡ 빠른 생성 옵션</h5>
                  <p className="text-sm text-yellow-600">프롬프트 수정 단계를 생략하고 바로 생성</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipPromptEdit}
                    onChange={(e) => setSkipPromptEdit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>

            {/* 단계별 진행 표시 */}
            {(isGeneratingVideo || isProcessing) && generationStep && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="font-medium text-blue-800">{generationStep}</p>
                    <p className="text-sm text-blue-600">
                      {isGeneratingVideo ? `${Math.round(generationProgress)}% 완료` : '처리 중...'}
                    </p>
                  </div>
                </div>
                {isGeneratingVideo && (
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-blue-600 mt-1">
                      <span>{estimatedTime}</span>
                      <button
                        onClick={handleCancelVideoGeneration}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 영상 생성 버튼 */}
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateAIVideo}
                disabled={isGeneratingVideo || isProcessing || !englishPrompt.trim()}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isGeneratingVideo || isProcessing || !englishPrompt.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGeneratingVideo || isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isProcessing ? '처리 중...' : '영상 생성 중...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {skipPromptEdit ? '바로 영상생성' : 'AI 영상 생성'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 고급 모드 */}
        {generationMode === 'advanced' && (
          <div className="space-y-4">
            {/* 고급 설정들 */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영상 모델
                </label>
                  <select
                    value={selectedVideoModel}
                    onChange={(e) => setSelectedVideoModel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="veo-3.0-generate-001">Veo 3.0 Generate</option>
                    <option value="veo-3.0-fast">Veo 3.0 Fast</option>
                    <option value="veo-3.0-standard">Veo 3.0 Standard</option>
                  </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영상 비율
                </label>
                  <select
                    value={videoRatio}
                  onChange={(e) => setVideoRatio(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="16:9">16:9 (가로)</option>
                    <option value="9:16">9:16 (세로)</option>
                  </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영상 품질
                </label>
                  <select
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  영상 길이 (초)
                </label>
                <div className="space-y-2">
                  <select
                    value={videoDuration}
                    onChange={(e) => {
                      setVideoDuration(e.target.value);
                      if (e.target.value !== 'custom') {
                        setCustomDuration(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="4">4초 (매우 짧음)</option>
                    <option value="5">5초 (짧음)</option>
                    <option value="6">6초 (보통)</option>
                    <option value="7">7초 (김)</option>
                    <option value="8">8초 (매우 김)</option>
                    <option value="custom">사용자 정의</option>
                  </select>
                  {videoDuration === 'custom' && (
                    <input
                      type="number"
                      min="4"
                      max="8"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="4-8초 사이의 값을 입력하세요"
                    />
                  )}
                  <div className="text-xs text-gray-500">
                    Veo API는 4-8초 영상만 지원합니다. 편집을 위한 여유 시간은 프롬프트에 포함됩니다.
                  </div>
                </div>
              </div>
      </div>

            {/* 한국어 프롬프트 입력 */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                한국어 프롬프트
              </label>
              <div className="space-y-2">
                <textarea
                  value={koreanPrompt}
                  onChange={(e) => setKoreanPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="한국어로 영상에 대한 설명을 입력하세요..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => translateKoreanPrompt(koreanPrompt)}
                    disabled={!koreanPrompt.trim() || isTranslating}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      !koreanPrompt.trim() || isTranslating
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isTranslating ? '번역 중...' : '영문으로 번역'}
                  </button>
                  <span className="text-xs text-gray-500 self-center">
                    한국어로 입력하면 자동으로 영문으로 번역됩니다
                  </span>
          </div>
          </div>
          </div>
          
            {/* 영문 프롬프트 입력 */}
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                영문 프롬프트 <span className="text-red-500">*</span>
              </label>
          <textarea
            value={englishPrompt}
            onChange={(e) => setEnglishPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="영어로 영상 내용을 설명해주세요. 예: A beautiful sunset over mountains with birds flying"
              />
      </div>

            {/* 프롬프트 수정 기능 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-blue-800">✏️ 프롬프트 수정</h5>
                <button
                  onClick={() => {
                    if (!englishPrompt.trim()) {
                      addNotification({
                        type: 'error',
                        title: '입력 필요',
                        message: '영문 프롬프트를 먼저 입력해주세요.',
                      });
                      return;
                    }
                    
                    setOptimizedPromptModal({
                      isOpen: true,
                      originalPrompt: englishPrompt,
                      optimizedPrompt: englishPrompt,
                      referenceImages: getAllReferenceImages(),
                      onConfirm: (finalPrompt) => {
                        setEnglishPrompt(finalPrompt);
                        setOptimizedPromptModal({ ...optimizedPromptModal, isOpen: false });
                        addNotification({
                          type: 'success',
                          title: '프롬프트 수정 완료',
                          message: '프롬프트가 수정되었습니다.',
                        });
                      }
                    });
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  프롬프트 수정
                </button>
              </div>
              <div className="text-xs text-blue-600">
                AI가 프롬프트를 분석하고 영상 생성에 최적화된 형태로 개선해드립니다.
          </div>
          </div>

            {/* 통합 참조 이미지 관리 */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-purple-800">🖼️ 참조 이미지 관리</h5>
                <div className="flex gap-2">
                  <Button
                    onClick={handleFileSelect}
                    className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    업로드
                  </Button>
                  <Button
                    onClick={() => setShowImageSelectionModal(true)}
                    className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 text-sm"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    선택
                  </Button>
            </div>
          </div>

              {/* 선택된 이미지 미리보기 */}
              <div className="space-y-2">
                {getAllReferenceImages().length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {getAllReferenceImages().slice(0, 8).map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`참조 이미지 ${index + 1}`}
                          className="w-full h-16 object-cover rounded border"
                        />
                        <button
                          onClick={() => {
                            // 이미지 제거 로직
                            if (uploadedImages.includes(image)) {
                              setUploadedImages(prev => prev.filter(img => img !== image));
                            }
                            if (selectedStoredImages.includes(image)) {
                              setSelectedStoredImages(prev => prev.filter(img => img !== image));
                            }
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
            </div>
                    ))}
                    {getAllReferenceImages().length > 8 && (
                      <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{getAllReferenceImages().length - 8}개 더
                      </div>
              )}
            </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    참조 이미지가 없습니다. 업로드 또는 선택 버튼을 클릭하여 추가하세요.
          </div>
                )}
        </div>

              <div className="mt-2 text-xs text-purple-600">
                총 {getAllReferenceImages().length}개의 참조 이미지가 선택되었습니다.
            </div>
          </div>
          
            {/* 프롬프트 수정 생략 옵션 */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-yellow-800">⚡ 빠른 생성 옵션</h5>
                  <p className="text-sm text-yellow-600">프롬프트 수정 단계를 생략하고 바로 생성</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipPromptEdit}
                    onChange={(e) => setSkipPromptEdit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </div>

            {/* 단계별 진행 표시 */}
            {(isGeneratingVideo || isProcessing) && generationStep && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="font-medium text-blue-800">{generationStep}</p>
                    <p className="text-sm text-blue-600">
                      {isGeneratingVideo ? `${Math.round(generationProgress)}% 완료` : '처리 중...'}
                    </p>
                  </div>
                </div>
                {isGeneratingVideo && (
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-blue-600 mt-1">
                      <span>{estimatedTime}</span>
                      <button
                        onClick={handleCancelVideoGeneration}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

      {/* 영상 생성 버튼 */}
            <div className="flex justify-center">
        <Button
          onClick={handleGenerateAIVideo}
                disabled={isGeneratingVideo || isProcessing || !englishPrompt.trim()}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isGeneratingVideo || isProcessing || !englishPrompt.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGeneratingVideo || isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isProcessing ? '처리 중...' : '영상 생성 중...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {skipPromptEdit ? '바로 영상생성' : 'AI 영상 생성'}
                  </>
                )}
        </Button>
            </div>
          </div>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 에러 모달 */}
      <VideoGenerationErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        onCancel={() => setErrorModal({ ...errorModal, isOpen: false })}
        error={errorModal.error}
        hasImages={errorModal.hasImages}
        onRetry={handleErrorRetry}
        onRetryWithoutImages={handleErrorRetryWithoutImages}
        onGenerateStoryboard={handleErrorGenerateStoryboard}
      />

      {/* 확인 모달 */}
      <VideoPromptConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        prompt={confirmModal.prompt}
        optimizedPrompt={confirmModal.prompt}
        modelConfig={{
          displayName: selectedVideoModel,
          model: selectedVideoModel
        }}
        videoConfig={{
          ratio: confirmModal.videoRatio,
          quality: videoQuality,
          duration: videoDuration,
          framerate: '30fps'
        }}
        hasImages={confirmModal.referenceImages.length > 0}
        imageCount={confirmModal.referenceImages.length}
      />

      {/* 이미지 선택 모달 */}
      <ImageSelectionModal
        isOpen={showImageSelectionModal}
        onClose={() => setShowImageSelectionModal(false)}
        onSelectImages={handleStoredImageSelect}
        title="저장된 이미지 선택"
      />

        {/* 생성된 영상 목록 */}
        {generatedVideos.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎬 생성된 영상 ({generatedVideos.length}개)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedVideos.map((video) => (
                <div
                  key={video.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  {/* 영상 썸네일 - 정사각형 */}
                  <div 
                    className="bg-gray-100 rounded mb-3 flex items-center justify-center relative group aspect-square"
                    onClick={() => handleVideoCardClick(video)}
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt="영상 썸네일"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <Zap className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">영상 미리보기</p>
                      </div>
                    )}
                    
                    {/* 재생 버튼 오버레이 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* 영상 정보 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        영상 #{video.id}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {video.videoRatio}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(video.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {video.projectTexts?.[0]?.substring(0, 50)}...
                    </div>
                    
                    {/* 액션 버튼들 */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleVideoDownload(video, e)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="영상 다운로드"
                        >
                          <Download className="w-3 h-3" />
                          다운로드
                        </button>
                        <button
                          onClick={() => handleVideoCardClick(video)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          title="영상 상세보기"
                        >
                          <Play className="w-3 h-3" />
                          재생
                        </button>
                      </div>
                      {video.duration && (
                        <span className="text-xs text-gray-500">
                          {video.duration}초
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* 영상 카드 모달 */}
      <VideoCardModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        video={selectedVideo}
        onDelete={handleVideoDelete}
      />

      {/* 프롬프트 수정 모달 */}
      {optimizedPromptModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">🎬 컷 단위 프롬프트 수정</h2>
              <button
                onClick={() => setOptimizedPromptModal({ ...optimizedPromptModal, isOpen: false })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* 왼쪽: 원본 프롬프트 */}
              <div className="w-1/3 p-4 border-r">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    원본 프롬프트
                  </label>
                  <textarea
                    value={optimizedPromptModal.originalPrompt}
                    readOnly
                    className="w-full h-80 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 컷 단위 프롬프트 팁</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• [00:00-00:01] 형식으로 시간 표시</li>
                    <li>• Wide shot, Medium shot, Close-up 명시</li>
                    <li>• 캐릭터 동작과 표정 구체화</li>
                    <li>• 조명과 분위기 세부 묘사</li>
                    <li>• 대사와 배경음 효과 포함</li>
                  </ul>
                </div>
              </div>
              
              {/* 가운데: 컷 단위 편집 */}
              <div className="w-1/3 p-4 border-r">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    컷 단위 편집
                  </label>
                  <div className="h-80 overflow-y-auto space-y-3">
                    {cutBasedPrompt.cuts.map((cut, index) => (
                      <div key={cut.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            [{cut.startTime}–{cut.endTime}]
                          </span>
                          <button
                            onClick={() => {
                              const newCuts = cutBasedPrompt.cuts.filter((_, i) => i !== index);
                              setCutBasedPrompt(prev => ({ ...prev, cuts: newCuts }));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            삭제
                          </button>
                        </div>
                        <textarea
                          value={cut.description}
                          onChange={(e) => {
                            const newCuts = [...cutBasedPrompt.cuts];
                            newCuts[index].description = e.target.value;
                            setCutBasedPrompt(prev => ({ ...prev, cuts: newCuts }));
                          }}
                          className="w-full h-16 px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                          placeholder="컷 설명..."
                        />
                        <div className="mt-2">
                          <input
                            type="text"
                            value={cut.character}
                            onChange={(e) => {
                              const newCuts = [...cutBasedPrompt.cuts];
                              newCuts[index].character = e.target.value;
                              setCutBasedPrompt(prev => ({ ...prev, cuts: newCuts }));
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs mb-1"
                            placeholder="캐릭터명"
                          />
                          <textarea
                            value={cut.dialogue}
                            onChange={(e) => {
                              const newCuts = [...cutBasedPrompt.cuts];
                              newCuts[index].dialogue = e.target.value;
                              setCutBasedPrompt(prev => ({ ...prev, cuts: newCuts }));
                            }}
                            className="w-full h-12 px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                            placeholder="대사..."
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newCut = {
                          id: `cut_${cutBasedPrompt.cuts.length + 1}`,
                          startTime: `${String(Math.floor(cutBasedPrompt.cuts.length)).padStart(2, '0')}:${String((cutBasedPrompt.cuts.length * 1) % 60).padStart(2, '0')}`,
                          endTime: `${String(Math.floor(cutBasedPrompt.cuts.length + 1)).padStart(2, '0')}:${String(((cutBasedPrompt.cuts.length + 1) * 1) % 60).padStart(2, '0')}`,
                          description: '',
                          dialogue: '',
                          character: '',
                          cameraAngle: '',
                          style: ''
                        };
                        setCutBasedPrompt(prev => ({ ...prev, cuts: [...prev.cuts, newCut] }));
                      }}
                      className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm"
                    >
                      + 컷 추가
                    </button>
                  </div>
                </div>
                
                {/* 배경음과 스타일 태그 */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🎧 배경음</label>
                    <input
                      type="text"
                      value={cutBasedPrompt.backgroundSound}
                      onChange={(e) => setCutBasedPrompt(prev => ({ ...prev, backgroundSound: e.target.value }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="배경음 설명..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">🎨 스타일 태그</label>
                    <input
                      type="text"
                      value={cutBasedPrompt.styleTags.join(', ')}
                      onChange={(e) => setCutBasedPrompt(prev => ({ ...prev, styleTags: e.target.value.split(',').map(tag => tag.trim()) }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      placeholder="스타일 태그들..."
                    />
                  </div>
                </div>
              </div>
              
              {/* 오른쪽: 최종 프롬프트 */}
              <div className="w-1/3 p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최종 프롬프트
                  </label>
                  <textarea
                    value={generateFinalPrompt()}
                    onChange={(e) => setOptimizedPromptModal(prev => ({ ...prev, optimizedPrompt: e.target.value }))}
                    className="w-full h-80 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="최종 프롬프트가 여기에 표시됩니다..."
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">✨ 컷 기반 특징</h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• 시간 단위별 구체적인 장면 구성</li>
                    <li>• 카메라 앵글과 움직임 명시</li>
                    <li>• 캐릭터별 대사와 동작 포함</li>
                    <li>• 배경음과 스타일 태그 적용</li>
                    <li>• 영상 생성 최적화된 구조</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-xs text-gray-500">
                컷 단위로 세밀하게 조정하여 더 정확한 영상을 생성할 수 있습니다.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setOptimizedPromptModal({ ...optimizedPromptModal, isOpen: false })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => optimizedPromptModal.onConfirm(generateFinalPrompt())}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  컷 기반 프롬프트로 영상 생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};