// 이미지 생성 관련 타입 정의

// 이미지 용도 타입
export interface ImageRole {
  id: string;
  file: File;
  role: 'character' | 'background' | 'style' | 'camera' | 'element';
  description: string;
  weight: number; // 1-10
}

// 이미지 출력 사이즈 타입
export interface ImageOutputSize {
  ratio: string;
  resolution: string;
  tokens?: number;
  description: string;
  displayName?: string; // 한글 표시명
}

// 이미지 편집 스타일 타입
export interface ImageEditingStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  displayName?: string; // 한글 표시명
}

// 프롬프트 최적화 결과 타입
export interface OptimizedPrompt {
  originalPrompt: string;
  optimizedPrompt: string;
  technicalSettings: {
    ratio: string;
    upscale: string;
    excludeElements: string[];
  };
  qualityEnhancements: string[];
  outputSize?: ImageOutputSize | null;
  editingStyle?: ImageEditingStyle | null;
}

// 카메라 설정 타입 - 좌우/위아래 각도 분리
export interface CameraSettings {
  position: 'front' | 'back' | 'side' | 'top' | 'bottom';
  distance: number;
  angle: string;
  
  // 카메라 회전 각도 (크랙/크레인)
  panAngle: number; // 좌우 회전 (-180° ~ +180°)
  tiltAngle: number; // 위아래 회전 (-90° ~ +90°)
  rollAngle: number; // 프레임 회전 (-45° ~ +45°)
  
  // 화면상 위치 (절대값)
  screenPositionX: number; // 화면 가로 위치 (-100 ~ +100)
  screenPositionY: number; // 화면 세로 위치 (-100 ~ +100)
  
  lensType: 'standard' | 'wide' | 'telephoto' | 'macro';
  rotationX: number;
  rotationY: number;
  lensFocalLength: number; // 렌즈 초점거리 (mm)
  compressionEffect: 'normal' | 'strong' | 'weak';
  gridPosition: { x: number; y: number }; // 화면 그리드 기준 위치
  motionBlur: 'none' | 'light' | 'medium' | 'strong';
  depthOfField: 'shallow' | 'medium' | 'deep';
}

// 조명 설정 타입
export interface LightingSettings {
  type: 'natural' | 'artificial' | 'mixed';
  direction: 'front' | 'back' | 'side' | 'top' | 'bottom';
  intensity: 'low' | 'medium' | 'high';
  shadows: 'soft' | 'medium' | 'hard';
  volumetricLighting: boolean; // 체적 조명 효과
  rimLighting: boolean; // 림 라이팅 효과
  goldenHour: boolean; // 골든 아워 효과
  haze: 'none' | 'light' | 'medium' | 'heavy'; // 공기 질감
}

// 색상 설정 타입
export interface ColorSettings {
  palette: 'natural' | 'vibrant' | 'muted' | 'monochrome';
  saturation: 'low' | 'medium' | 'high';
  contrast: 'low' | 'medium' | 'high';
  colorTemperature: 'warm' | 'neutral' | 'cool';
  goldenAccents: boolean; // 금색 액센트
  cinematicGrading: boolean; // 시네마틱 그레이딩
}

// 상세 설정 타입
export interface DetailedSettings {
  camera: CameraSettings;
  lighting: LightingSettings;
  color: ColorSettings;
  aspectRatio?: string;
  quality?: string;
  style?: string;
}

// 이미지 생성 설정 타입
export interface ImageGenerationConfig {
  style: string;
  quality: string;
  aspectRatio: string;
  customSize: string;
  additionalPrompt: string;
}

// 고급 이미지 생성 모달 Props 타입
export interface AdvancedImageGenerationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { description: string; image: string; attachedImages: File[] }) => void;
  nanoBananaService?: any;
}

// 설정 변경 핸들러 타입
export type SettingsChangeHandler<T> = (key: keyof T, value: any) => void;

// 설정 컴포넌트 Props 타입
export interface SettingsComponentProps<T> {
  settings: T;
  onChange: SettingsChangeHandler<T>;
  disabled?: boolean;
}
