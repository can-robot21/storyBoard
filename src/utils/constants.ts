// 애플리케이션 상수 정의

// API 관련 상수
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// 애플리케이션 설정
export const APP_CONFIG = {
  NAME: 'AI 영상 프로젝트',
  VERSION: '1.4.0',
  DESCRIPTION: 'AI 기반 이미지→영상 생성 워크플로우 툴',
  AUTHOR: 'AI Assistant',
  LICENSE: 'MIT',
} as const;

// 메인 단계 정의
export const MAIN_STEPS = [
  '프로젝트 개요',
  '캐릭터 설정',
  '영상 생성',
] as const;

// 진행률 추적기 단계
export const PROGRESS_STEPS = [
  {
    id: 'overview',
    title: '프로젝트 개요',
    description: 'AI 텍스트 생성',
    status: 'completed' as const,
  },
  {
    id: 'character',
    title: '캐릭터 설정',
    description: 'AI 이미지 생성',
    status: 'current' as const,
  },
  {
    id: 'video',
    title: '영상 생성',
    description: '컷별 이미지 생성',
    status: 'pending' as const,
  },
] as const;

// 영상 비율 옵션
export const VIDEO_RATIOS = [
  { value: '16:9', label: '16:9 (가로)', aspect: 'aspect-video' },
  { value: '1:1', label: '1:1 (정사각형)', aspect: 'aspect-square' },
  { value: '9:16', label: '9:16 (세로)', aspect: 'aspect-[9/16]' },
] as const;

// 컷 수 옵션
export const CUT_COUNT_OPTIONS = [
  { value: 1, label: '1컷' },
  { value: 2, label: '2컷' },
  { value: 3, label: '3컷' },
  { value: 4, label: '4컷' },
  { value: 5, label: '5컷' },
  { value: 6, label: '6컷' },
  { value: 7, label: '7컷' },
  { value: 8, label: '8컷' },
  { value: 9, label: '9컷' },
  { value: 10, label: '10컷' },
] as const;

// 캐릭터 스타일 옵션
export const CHARACTER_STYLES = [
  { value: '애니메이션', label: '애니메이션 스타일' },
  { value: '사실적', label: '사실적 스타일' },
  { value: '만화', label: '만화 스타일' },
  { value: '픽사', label: '픽사 스타일' },
] as const;

// 음성 옵션
export const VOICEOVER_OPTIONS = [
  { value: 'ko-female', label: '한국어 여성' },
  { value: 'ko-male', label: '한국어 남성' },
  { value: 'en-female', label: '영어 여성' },
  { value: 'en-male', label: '영어 남성' },
] as const;

// 배경 음악 옵션
export const BACKGROUND_MUSIC_OPTIONS = [
  { value: 'calm', label: '차분한' },
  { value: 'energetic', label: '활기찬' },
  { value: 'mysterious', label: '신비로운' },
  { value: 'romantic', label: '로맨틱한' },
  { value: 'none', label: '없음' },
] as const;

// 페이지네이션 설정
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 9,
  MAX_VISIBLE_PAGES: 5,
  DEFAULT_PAGE: 1,
} as const;

// 파일 업로드 설정
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  MAX_FILES_PER_UPLOAD: 10,
} as const;

// 알림 설정
export const NOTIFICATION_CONFIG = {
  AUTO_CLOSE_DELAY: 5000,
  MAX_NOTIFICATIONS: 5,
  POSITION: 'top-right' as const,
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER: 'ai_video_user',
  SETTINGS: 'ai_video_settings',
  PROJECTS: 'ai_video_projects',
  RECENT_PROJECTS: 'ai_video_recent_projects',
  BOOKMARKS: 'ai_video_bookmarks',
} as const;

// API 엔드포인트
export const API_ENDPOINTS = {
  PROJECTS: '/projects',
  CHARACTERS: '/characters',
  BACKGROUNDS: '/backgrounds',
  VIDEOS: '/videos',
  AI: {
    TEXT: '/ai/text',
    IMAGE: '/ai/image',
    VIDEO: '/ai/video',
  },
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  UPLOAD: '/upload',
  DOWNLOAD: '/download',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
  GENERATION_FAILED: 'AI 생성에 실패했습니다.',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  PROJECT_SAVED: '프로젝트가 저장되었습니다.',
  PROJECT_EXPORTED: '프로젝트가 내보내기되었습니다.',
  CHARACTER_GENERATED: '캐릭터가 생성되었습니다.',
  BACKGROUND_GENERATED: '배경이 생성되었습니다.',
  VIDEO_GENERATED: '영상이 생성되었습니다.',
  FILE_UPLOADED: '파일이 업로드되었습니다.',
  FILE_DOWNLOADED: '파일이 다운로드되었습니다.',
  SETTINGS_SAVED: '설정이 저장되었습니다.',
} as const;

// 색상 테마
export const COLORS = {
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  SUCCESS: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  ERROR: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

// 애니메이션 설정
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// 반응형 브레이크포인트
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
} as const;

// 그리드 설정
export const GRID_CONFIG = {
  COLUMNS: {
    MOBILE: 1,
    TABLET: 2,
    DESKTOP: 3,
  },
  GAP: {
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
  },
} as const;
