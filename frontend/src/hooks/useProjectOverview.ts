import { useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useAIService } from './useAIService';
import { 
  SceneCutSettings, 
  PromptLengthSettings,
  Episode
} from '../types/projectOverview';

export const useProjectOverview = () => {
  const { addNotification } = useUIStore();
  const { generateText } = useAIService();

  // 기본 입력 상태
  const [dialogue, setDialogue] = useState('');
  const [additionalScenarioSettings, setAdditionalScenarioSettings] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // 공통 입력 항목 표시 상태
  const [showCommonInputs, setShowCommonInputs] = useState(false);
  const [commonInputsCompleted, setCommonInputsCompleted] = useState(false);
  
  // 단계별 입력 항목 표시 상태
  const [showStepInputs, setShowStepInputs] = useState({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
    episodeStructure: false
  });
  
  // 씬/에피소드 구조 관리
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // 프롬프트 길이 설정
  const [promptLengthSettings, setPromptLengthSettings] = useState<PromptLengthSettings>({
    video: 1000,
    scenario: 2000
  });

  // 씬/컷 설정
  const [sceneCutSettings, setSceneCutSettings] = useState<SceneCutSettings>({
    sceneCount: 3,
    cutCount: 3
  });

  // API 키 상태 확인
  const checkAPIKeyStatus = () => {
    const getCurrentUser = () => {
      try {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem('storyboard_current_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const getLocalApiKey = (): string => {
      try {
        if (typeof window === 'undefined') return '';
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google) return localKeys.google as string;
        }
        const user = getCurrentUser();
        if (user?.apiKeys?.google) return user.apiKeys.google as string;
      } catch {}
      return '';
    };

    const user = getCurrentUser();
    const adminEmail = (process.env.REACT_APP_ADMIN_EMAIL as string) || 'star612.net@gmail.com';
    const isAdmin = !!(user && user.email === adminEmail);

    // 모든 사용자가 개인 API 키를 입력해야 함 (환경변수 사용 안함)
    const apiKey = getLocalApiKey();

    return {
      hasApiKey: !!(apiKey && apiKey !== 'your-gemini-api-key' && apiKey !== 'your-gemini-api-key-here'),
      isAdmin,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPreview: apiKey ? '설정됨' : '없음'
    };
  };

  // 단계별 입력 항목 토글 함수
  const toggleStepInputs = (step: keyof typeof showStepInputs) => {
    setShowStepInputs(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  // 공통 입력 완료 처리
  const handleCommonInputsComplete = (story: string, characterList: any[]) => {
    // 에피소드 구조가 있는 경우 해당 구조를 우선 사용
    const hasEpisodeStructure = episodes.length > 0 && episodes.some(episode => 
      episode.scenes.length > 0 && episode.scenes.some(scene => scene.cuts > 0)
    );

    if (!story || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 입력해주세요.',
      });
      return;
    }

    // 에피소드 구조가 없는 경우에만 전역 씬/컷 설정 검증
    if (!hasEpisodeStructure && (sceneCutSettings.sceneCount === 0 || sceneCutSettings.cutCount === 0)) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '에피소드 구조가 없으므로 씬/컷 설정을 입력해주세요.',
      });
      return;
    }

    setCommonInputsCompleted(true);
    setShowCommonInputs(false);
    
    addNotification({
      type: 'success',
      title: '공통 입력 완료',
      message: hasEpisodeStructure 
        ? '에피소드 구조 기반으로 기본 정보가 입력되었습니다.'
        : '기본 정보가 성공적으로 입력되었습니다.',
    });
  };

  // 공통 입력 초기화
  const handleCommonInputsReset = () => {
    setCommonInputsCompleted(false);
    
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '공통 입력 항목이 초기화되었습니다.',
    });
  };

  // 에피소드 추가
  const addEpisode = () => {
    const newEpisode = {
      id: Date.now(),
      title: '',
      description: '',
      scenes: []
    };
    setEpisodes(prev => [...prev, newEpisode]);
  };

  // 씬 추가
  const addScene = (episodeIndex: number) => {
    const newScene = {
      id: Date.now(),
      title: '',
      description: '',
      cuts: 1
    };
    setEpisodes(prev => prev.map((episode, index) => 
      index === episodeIndex 
        ? { ...episode, scenes: [...episode.scenes, newScene] }
        : episode
    ));
  };

  // 에피소드 업데이트
  const updateEpisode = (episodeIndex: number, field: string, value: string) => {
    setEpisodes(prev => prev.map((episode, index) => 
      index === episodeIndex 
        ? { ...episode, [field]: value }
        : episode
    ));
  };

  // 씬 업데이트
  const updateScene = (episodeIndex: number, sceneIndex: number, field: string, value: string | number) => {
    setEpisodes(prev => prev.map((episode, index) => 
      index === episodeIndex 
        ? {
            ...episode,
            scenes: episode.scenes.map((scene: any, sIndex: number) => 
              sIndex === sceneIndex 
                ? { ...scene, [field]: value }
                : scene
            )
          }
        : episode
    ));
  };

  // 씬 삭제
  const deleteScene = (episodeIndex: number, sceneIndex: number) => {
    setEpisodes(prev => prev.map((episode, index) => 
      index === episodeIndex 
        ? {
            ...episode,
            scenes: episode.scenes.filter((_: any, sIndex: number) => sIndex !== sceneIndex)
          }
        : episode
    ));
  };

  // 영어 번역 함수
  const translateToEnglish = async (koreanText: string, maxLength: number): Promise<string> => {
    try {
      const prompt = `다음 한국어 텍스트를 영어로 번역해주세요. 번역된 텍스트는 ${maxLength}자 이내로 작성해주세요.\n\n한국어 텍스트: ${koreanText}`;
      
      const result = await generateText({
        prompt,
        model: 'gemini-2.5-flash',
        maxTokens: Math.floor(maxLength / 2),
        temperature: 0.3
      });
      
      return result || koreanText;
    } catch (error) {
      console.error('영어 번역 오류:', error);
      return koreanText;
    }
  };

  // 에피소드 구조 기반 씬/컷 설정 계산
  const getEffectiveSceneCutSettings = () => {
    const hasEpisodeStructure = episodes.length > 0 && episodes.some(episode => 
      episode.scenes.length > 0 && episode.scenes.some(scene => scene.cuts > 0)
    );

    if (hasEpisodeStructure) {
      // 에피소드 구조가 있는 경우 실제 구조를 반영
      const totalScenes = episodes.reduce((sum, episode) => sum + episode.scenes.length, 0);
      const totalCuts = episodes.reduce((sum, episode) => 
        sum + episode.scenes.reduce((sceneSum, scene) => sceneSum + scene.cuts, 0), 0
      );
      const averageCutsPerScene = totalScenes > 0 ? Math.round(totalCuts / totalScenes) : 3;
      
      return {
        sceneCount: totalScenes,
        cutCount: averageCutsPerScene
      };
    }

    // 에피소드 구조가 없는 경우 전역 설정 사용
    return sceneCutSettings;
  };

  return {
    // 상태
    dialogue,
    setDialogue,
    additionalScenarioSettings,
    setAdditionalScenarioSettings,
    isGeneratingAll,
    setIsGeneratingAll,
    showCommonInputs,
    setShowCommonInputs,
    commonInputsCompleted,
    setCommonInputsCompleted,
    showStepInputs,
    setShowStepInputs,
    episodes,
    setEpisodes,
    promptLengthSettings,
    setPromptLengthSettings,
    sceneCutSettings,
    setSceneCutSettings,

    // 함수
    checkAPIKeyStatus,
    toggleStepInputs,
    handleCommonInputsComplete,
    handleCommonInputsReset,
    addEpisode,
    addScene,
    updateEpisode,
    updateScene,
    deleteScene,
    translateToEnglish,
    getEffectiveSceneCutSettings
  };
};
