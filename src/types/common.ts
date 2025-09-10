// 공통 타입 정의

// 알림 타입
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

// UI 상태 타입
export interface UIState {
  notifications: Notification[];
  currentStep: string;
  isLoggedIn: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
}

// 버튼 타입
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

// 진행률 추적기 타입
export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed';
}

// 파일 업로드 타입
export interface FileUpload {
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

// 페이지네이션 타입
export interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 폼 유효성 검사 타입
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isValid: boolean;
  errors: ValidationError[];
  touched: Record<string, boolean>;
}

// 모달 타입
export interface Modal {
  id: string;
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
}

// 드롭다운 옵션 타입
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// 테이블 컬럼 타입
export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: any) => React.ReactNode;
}

// 정렬 타입
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// 필터 타입
export interface Filter {
  key: string;
  value: any;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

// 검색 타입
export interface SearchConfig {
  query: string;
  fields: string[];
  caseSensitive?: boolean;
}

// 로딩 상태 타입
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// 에러 바운더리 타입
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// 컨텍스트 타입
export interface AppContextType {
  user: User | null;
  theme: 'light' | 'dark';
  language: string;
  notifications: Notification[];
  loading: LoadingState;
}

// 사용자 타입
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
  lastLoginAt?: string;
}

// 설정 타입
export interface AppSettings {
  theme: 'light' | 'dark';
  language: string;
  autoSave: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  editor: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
  };
}

// 로컬 스토리지 타입
export interface LocalStorageData {
  user: User | null;
  settings: AppSettings;
  recentProjects: string[];
  bookmarks: string[];
}

// 이벤트 타입
export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

// 유틸리티 타입
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 함수 타입
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;
export type ValueChangeHandler<T = any> = (value: T) => void;
export type AsyncValueChangeHandler<T = any> = (value: T) => Promise<void>;
