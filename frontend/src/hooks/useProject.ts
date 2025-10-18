import { useState, useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

export interface Character {
  id: number;
  name: string;
  description: string;
}

export interface GeneratedItem {
  id: number;
  description: string;
  image: string;
  attachedImages: string[];
  timestamp: string;
}

export interface GeneratedTextCard {
  id: number;
  generatedText: string;
  timestamp: string;
}

export interface GeneratedImage {
  id: number;
  input: string;
  image: string;
  timestamp: string;
}

export interface GeneratedVideo {
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

export interface ProjectData {
  story: string;
  characterList: Character[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  generatedProjectData: any;
  generatedCharacters: GeneratedItem[];
  generatedBackgrounds: GeneratedItem[];
  generatedSettingCuts: GeneratedItem[];
  generatedTextCards: GeneratedTextCard[];
  generatedCharacterImages: GeneratedImage[];
  generatedVideoBackgrounds: GeneratedImage[];
  generatedVideos: GeneratedVideo[];
}

const initialProjectData: ProjectData = {
  story: '',
  characterList: [],
  scenarioPrompt: '',
  storySummary: '',
  finalScenario: '',
  generatedProjectData: null,
  generatedCharacters: [],
  generatedBackgrounds: [],
  generatedSettingCuts: [],
  generatedTextCards: [],
  generatedCharacterImages: [],
  generatedVideoBackgrounds: [],
  generatedVideos: []
};

export const useProject = () => {
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);
  const { addNotification } = useUIStore();

  // 프로젝트 데이터 업데이트
  const updateProject = useCallback((updates: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...updates }));
  }, []);

  // 스토리 관련
  const setStory = useCallback((story: string) => {
    updateProject({ story });
  }, [updateProject]);

  // 캐릭터 관련
  const setCharacterList = useCallback((characterList: Character[]) => {
    updateProject({ characterList });
  }, [updateProject]);

  const addCharacter = useCallback((character: Character) => {
    setCharacterList([...projectData.characterList, character]);
  }, [projectData.characterList, setCharacterList]);

  const removeCharacter = useCallback((id: number) => {
    setCharacterList(projectData.characterList.filter(char => char.id !== id));
  }, [projectData.characterList, setCharacterList]);

  // 프롬프트 관련
  const setScenarioPrompt = useCallback((prompt: string) => {
    updateProject({ scenarioPrompt: prompt });
  }, [updateProject]);

  const setStorySummary = useCallback((summary: string) => {
    updateProject({ storySummary: summary });
  }, [updateProject]);

  const setFinalScenario = useCallback((scenario: string) => {
    updateProject({ finalScenario: scenario });
  }, [updateProject]);

  const setGeneratedProjectData = useCallback((data: any) => {
    updateProject({ generatedProjectData: data });
  }, [updateProject]);

  // 생성된 아이템들 관리
  const addGeneratedCharacter = useCallback((character: GeneratedItem) => {
    updateProject({ 
      generatedCharacters: [...projectData.generatedCharacters, character] 
    });
  }, [projectData.generatedCharacters, updateProject]);

  const removeGeneratedCharacter = useCallback((id: number) => {
    updateProject({ 
      generatedCharacters: projectData.generatedCharacters.filter(char => char.id !== id) 
    });
  }, [projectData.generatedCharacters, updateProject]);

  const addGeneratedBackground = useCallback((background: GeneratedItem) => {
    updateProject({ 
      generatedBackgrounds: [...projectData.generatedBackgrounds, background] 
    });
  }, [projectData.generatedBackgrounds, updateProject]);

  const removeGeneratedBackground = useCallback((id: number) => {
    updateProject({ 
      generatedBackgrounds: projectData.generatedBackgrounds.filter(bg => bg.id !== id) 
    });
  }, [projectData.generatedBackgrounds, updateProject]);

  const addGeneratedSettingCut = useCallback((settingCut: GeneratedItem) => {
    updateProject({ 
      generatedSettingCuts: [...projectData.generatedSettingCuts, settingCut] 
    });
  }, [projectData.generatedSettingCuts, updateProject]);

  const removeGeneratedSettingCut = useCallback((id: number) => {
    updateProject({ 
      generatedSettingCuts: projectData.generatedSettingCuts.filter(cut => cut.id !== id) 
    });
  }, [projectData.generatedSettingCuts, updateProject]);

  // 텍스트 카드 관리
  const addGeneratedTextCard = useCallback((textCard: GeneratedTextCard) => {
    updateProject({ 
      generatedTextCards: [...projectData.generatedTextCards, textCard] 
    });
  }, [projectData.generatedTextCards, updateProject]);

  const removeGeneratedTextCard = useCallback((id: number) => {
    updateProject({ 
      generatedTextCards: projectData.generatedTextCards.filter(card => card.id !== id) 
    });
  }, [projectData.generatedTextCards, updateProject]);

  // 영상 관련
  const addGeneratedVideo = useCallback((video: GeneratedVideo) => {
    updateProject({ 
      generatedVideos: [...projectData.generatedVideos, video] 
    });
  }, [projectData.generatedVideos, updateProject]);

  const removeGeneratedVideo = useCallback((id: number) => {
    updateProject({ 
      generatedVideos: projectData.generatedVideos.filter(video => video.id !== id) 
    });
  }, [projectData.generatedVideos, updateProject]);

  // 프로젝트 저장
  const saveProject = useCallback(async () => {
    try {
      // TODO: 실제 저장 로직 구현 (SQLite 또는 파일 저장)
      localStorage.setItem('storyboard-project', JSON.stringify(projectData));
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: '프로젝트가 저장되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '프로젝트 저장에 실패했습니다.',
      });
    }
  }, [projectData, addNotification]);

  // 프로젝트 로드
  const loadProject = useCallback(async (projectId?: string) => {
    try {
      const savedData = localStorage.getItem('storyboard-project');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setProjectData(parsedData);
        addNotification({
          type: 'success',
          title: '로드 완료',
          message: '프로젝트가 로드되었습니다.',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '로드 실패',
        message: '프로젝트 로드에 실패했습니다.',
      });
    }
  }, [addNotification]);

  // 프로젝트 초기화
  const resetProject = useCallback(() => {
    setProjectData(initialProjectData);
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '프로젝트가 초기화되었습니다.',
    });
  }, [addNotification]);

  return {
    projectData,
    updateProject,
    setStory,
    setCharacterList,
    addCharacter,
    removeCharacter,
    setScenarioPrompt,
    setStorySummary,
    setFinalScenario,
    setGeneratedProjectData,
    addGeneratedCharacter,
    removeGeneratedCharacter,
    addGeneratedBackground,
    removeGeneratedBackground,
    addGeneratedSettingCut,
    removeGeneratedSettingCut,
    addGeneratedTextCard,
    removeGeneratedTextCard,
    addGeneratedVideo,
    removeGeneratedVideo,
    saveProject,
    loadProject,
    resetProject
  };
};
