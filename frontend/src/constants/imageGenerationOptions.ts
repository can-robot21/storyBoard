import { ImageOutputSize, ImageEditingStyle } from '../types/imageGeneration';

// 이미지 출력 사이즈 옵션들 (한글 UI용)
export const outputSizeOptions: ImageOutputSize[] = [
  {
    ratio: '1:1',
    resolution: '1024x1024',
    tokens: 1290,
    description: '정사각형 (SNS용)',
    displayName: '정사각형'
  },
  {
    ratio: '16:9',
    resolution: '1344x768',
    tokens: 1290,
    description: '와이드스크린 (동영상용)',
    displayName: '와이드스크린'
  },
  {
    ratio: '9:16',
    resolution: '768x1344',
    tokens: 1290,
    description: '세로형 (모바일용)',
    displayName: '세로형'
  },
  {
    ratio: '4:3',
    resolution: '1024x768',
    tokens: 1290,
    description: '전통적 비율 (인쇄용)',
    displayName: '전통적'
  },
  {
    ratio: '3:4',
    resolution: '768x1024',
    tokens: 1290,
    description: '세로 전통적 (인쇄용)',
    displayName: '세로 전통적'
  },
  {
    ratio: '2:3',
    resolution: '768x1152',
    tokens: 1290,
    description: '세로형 (포스터용)',
    displayName: '세로형 포스터'
  },
  {
    ratio: '3:2',
    resolution: '1152x768',
    tokens: 1290,
    description: '가로형 (포스터용)',
    displayName: '가로형 포스터'
  },
  {
    ratio: '4:5',
    resolution: '1024x1280',
    tokens: 1290,
    description: '세로형 (인스타그램용)',
    displayName: '인스타그램 세로'
  },
  {
    ratio: '5:4',
    resolution: '1280x1024',
    tokens: 1290,
    description: '가로형 (인스타그램용)',
    displayName: '인스타그램 가로'
  },
  {
    ratio: '21:9',
    resolution: '1920x822',
    tokens: 1290,
    description: '울트라 와이드 (시네마용)',
    displayName: '울트라 와이드'
  }
];

// 이미지 편집 스타일 옵션들 (한글 UI용)
export const editingStyleOptions: ImageEditingStyle[] = [
  {
    id: 'element_add',
    name: '요소 추가',
    description: '기존 이미지에 새로운 요소를 추가합니다',
    prompt: 'Add the following element to the image while maintaining the original style, lighting, and perspective:',
    displayName: '요소 추가'
  },
  {
    id: 'detail_preserve',
    name: '세부사항 보존',
    description: '편집 과정에서 중요한 세부사항을 보존합니다',
    prompt: 'Modify the image while preserving important details and maintaining the original quality:',
    displayName: '세부사항 보존'
  },
  {
    id: 'style_transfer',
    name: '스타일 변환',
    description: '이미지 스타일을 다른 스타일로 변환합니다',
    prompt: 'Transform the image style while keeping the main subject and composition:',
    displayName: '스타일 변환'
  },
  {
    id: 'composition_change',
    name: '구성 변경',
    description: '이미지 구성과 레이아웃을 변경합니다',
    prompt: 'Change the composition and layout of the image while maintaining the main elements:',
    displayName: '구성 변경'
  },
  {
    id: 'lighting_adjust',
    name: '조명 조정',
    description: '이미지의 조명과 분위기를 조정합니다',
    prompt: 'Adjust the lighting and atmosphere of the image:',
    displayName: '조명 조정'
  },
  {
    id: 'color_grading',
    name: '컬러 그레이딩',
    description: '컬러 그레이딩과 톤 보정을 적용합니다',
    prompt: 'Apply color grading and tone correction to the image:',
    displayName: '컬러 그레이딩'
  }
];

// 기본 상세 설정값 - 카메라 각도 분리
export const defaultDetailedSettings = {
  camera: {
    position: 'front' as const,
    distance: 5,
    angle: '0',
    
    // 카메라 회전 각도 (크랙/크레인)
    panAngle: 0, // 좌우 회전 (-180° ~ +180°)
    tiltAngle: 0, // 위아래 회전 (-90° ~ +90°)
    rollAngle: 0, // 프레임 회전 (-45° ~ +45°)
    
    // 화면상 위치 (절대값)
    screenPositionX: 0, // 화면 가로 위치 (-100 ~ +100)
    screenPositionY: 0, // 화면 세로 위치 (-100 ~ +100)
    
    lensType: 'standard' as const,
    rotationX: 0,
    rotationY: 0,
    lensFocalLength: 50,
    compressionEffect: 'normal' as const,
    gridPosition: { x: 0, y: 0 },
    motionBlur: 'none' as const,
    depthOfField: 'medium' as const
  },
  lighting: {
    type: 'natural' as const,
    direction: 'front' as const,
    intensity: 'medium' as const,
    shadows: 'soft' as const,
    volumetricLighting: false,
    rimLighting: false,
    goldenHour: false,
    haze: 'none' as const
  },
  color: {
    palette: 'natural' as const,
    saturation: 'medium' as const,
    contrast: 'medium' as const,
    colorTemperature: 'neutral' as const,
    goldenAccents: false,
    cinematicGrading: false
  }
};
