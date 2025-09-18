// UI 관련 상수
export const UI_CONSTANTS = {
  // 전체 너비를 사용하는 카드 제목들
  FULL_WIDTH_CARDS: {
    KOREAN: ['스토리', '시나리오', '대사', '시각및설정', '영상설정프롬프트'],
    ENGLISH: ['Story', 'Scenario', 'Dialogue', 'Visual Settings', 'Visual Settings Prompt']
  },
  
  // 버튼 스타일
  BUTTON_STYLES: {
    PRIMARY: 'px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600',
    SECONDARY: 'px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600',
    SUCCESS: 'px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600',
    DANGER: 'px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600',
    WARNING: 'px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600',
    INFO: 'px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600'
  },
  
  // 카드 스타일
  CARD_STYLES: {
    KOREAN: 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm',
    ENGLISH: 'bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm',
    REFERENCE: 'bg-white rounded-lg border p-4'
  },
  
  // 섹션 제목 스타일
  SECTION_TITLES: {
    KOREAN: 'text-lg font-medium text-gray-800 flex items-center gap-2',
    ENGLISH: 'text-lg font-medium text-blue-800 flex items-center gap-2',
    MAIN: 'text-xl font-semibold text-gray-800'
  }
};

// 기본 설정값
export const DEFAULT_SETTINGS = {
  PROMPT_LENGTH: {
    VIDEO: 1000,
    SCENARIO: 2000
  },
  SCENE_CUT: {
    SCENE_COUNT: 3,
    CUT_COUNT: 3
  }
};

// 이모지 상수
export const EMOJIS = {
  STORY: '📖',
  CHARACTER: '👥',
  SCENARIO: '🎬',
  VIDEO_SETTINGS: '🎨',
  PROJECT_OVERVIEW: '📋',
  KOREAN: '🇰🇷',
  ENGLISH: '🇺🇸',
  SETTINGS: '⚙️',
  SAVE: '💾',
  DELETE: '🗑️',
  EDIT: '✏️',
  HIDE: '👁️‍🗨️',
  SHOW: '👁️'
};