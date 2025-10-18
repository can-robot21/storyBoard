import { useState, useCallback } from 'react';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface SettingsState {
  promptLength: {
    video: number;
    scenario: number;
  };
  sceneCut: {
    sceneCount: number;
    cutCount: number;
  };
  image: {
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: '16:9' | '9:16' | '2:3' | '1:1' | 'free';
  };
  video: {
    quality: '720p' | '1080p' | '4k';
    duration: 'short' | 'medium' | 'long';
  };
  ui: {
    showStepSettings: boolean;
    showMainSettings: boolean;
    defaultCollapsed: boolean;
  };
}

interface SectionVisibility {
  projectInfo: boolean;
  characters: boolean;
  scenario: boolean;
  textCards: boolean;
  characterImages: boolean;
  backgroundImages: boolean;
  settingCutImages: boolean;
  videos: boolean;
  jsonCards: boolean;
  englishJson: boolean;
  koreanJson: boolean;
  rawData: boolean;
}

export const useSettingsManager = () => {
  // 통합 설정 상태
  const [settings, setSettings] = useState<SettingsState>({
    promptLength: {
      video: DEFAULT_SETTINGS.PROMPT_LENGTH.VIDEO,
      scenario: DEFAULT_SETTINGS.PROMPT_LENGTH.SCENARIO
    },
    sceneCut: {
      sceneCount: DEFAULT_SETTINGS.SCENE_CUT.SCENE_COUNT,
      cutCount: DEFAULT_SETTINGS.SCENE_CUT.CUT_COUNT
    },
    image: {
      quality: 'standard',
      aspectRatio: '16:9'
    },
    video: {
      quality: '720p',
      duration: 'medium'
    },
    ui: {
      showStepSettings: false, // 기본 감춤
      showMainSettings: false, // 기본 감춤
      defaultCollapsed: true
    }
  });

  // 섹션별 표시/숨김 상태
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    projectInfo: true,
    characters: true,
    scenario: false, // 기본 감춤
    textCards: false, // 기본 감춤
    characterImages: false, // 기본 감춤
    backgroundImages: false, // 기본 감춤
    settingCutImages: false, // 기본 감춤
    videos: true,
    jsonCards: false, // 기본 감춤
    englishJson: false, // 기본 감춤
    koreanJson: false, // 기본 감춤
    rawData: false // 기본 감춤
  });

  // 설정 업데이트 함수들
  const updatePromptLength = useCallback((updates: Partial<SettingsState['promptLength']>) => {
    setSettings(prev => ({
      ...prev,
      promptLength: { ...prev.promptLength, ...updates }
    }));
  }, []);

  const updateSceneCut = useCallback((updates: Partial<SettingsState['sceneCut']>) => {
    setSettings(prev => ({
      ...prev,
      sceneCut: { ...prev.sceneCut, ...updates }
    }));
  }, []);

  const updateImageSettings = useCallback((updates: Partial<SettingsState['image']>) => {
    setSettings(prev => ({
      ...prev,
      image: { ...prev.image, ...updates }
    }));
  }, []);

  const updateVideoSettings = useCallback((updates: Partial<SettingsState['video']>) => {
    setSettings(prev => ({
      ...prev,
      video: { ...prev.video, ...updates }
    }));
  }, []);

  const updateUISettings = useCallback((updates: Partial<SettingsState['ui']>) => {
    setSettings(prev => ({
      ...prev,
      ui: { ...prev.ui, ...updates }
    }));
  }, []);

  // 섹션 표시/숨김 토글
  const toggleSectionVisibility = useCallback((section: keyof SectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // 모든 섹션 표시/숨김
  const toggleAllSections = useCallback((visible: boolean) => {
    setSectionVisibility(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: visible
      }), {} as SectionVisibility)
    );
  }, []);

  // 설정 초기화
  const resetSettings = useCallback(() => {
    setSettings({
      promptLength: {
        video: DEFAULT_SETTINGS.PROMPT_LENGTH.VIDEO,
        scenario: DEFAULT_SETTINGS.PROMPT_LENGTH.SCENARIO
      },
      sceneCut: {
        sceneCount: DEFAULT_SETTINGS.SCENE_CUT.SCENE_COUNT,
        cutCount: DEFAULT_SETTINGS.SCENE_CUT.CUT_COUNT
      },
      image: {
        quality: 'standard',
        aspectRatio: '16:9'
      },
      video: {
        quality: '1080p',
        duration: 'medium'
      },
      ui: {
        showStepSettings: false,
        showMainSettings: false,
        defaultCollapsed: true
      }
    });
  }, []);

  return {
    settings,
    sectionVisibility,
    updatePromptLength,
    updateSceneCut,
    updateImageSettings,
    updateVideoSettings,
    updateUISettings,
    toggleSectionVisibility,
    toggleAllSections,
    resetSettings
  };
};