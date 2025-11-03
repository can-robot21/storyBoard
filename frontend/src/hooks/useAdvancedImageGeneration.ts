import { useState, useCallback } from 'react';
import { PromptImageBasicData } from '../components/common/modules/PromptImageBasicModule';
import { SizeStyleConfigData } from '../components/common/modules/SizeStyleConfigModule';
import { CameraLightingData } from '../components/common/modules/CameraLightingModule';
import { defaultDetailedSettings } from '../constants/imageGenerationOptions';

/**
 * 고급 이미지 생성 모달 상태 관리 커스텀 훅
 * 상태 관리를 분리하여 메인 컴포넌트를 단순화
 */
export const useAdvancedImageGeneration = () => {
  const [step, setStep] = useState(1);
  
  // 모듈별 데이터 상태
  const [basicData, setBasicData] = useState<PromptImageBasicData>({
    prompt: '',
    attachedImages: [],
    imageRoles: []
  });
  
  const [sizeStyleData, setSizeStyleData] = useState<SizeStyleConfigData>({
    selectedOutputSize: null,
    selectedEditingStyle: null,
    config: {
      style: 'realistic',
      quality: 'high',
      aspectRatio: '16:9',
      customSize: '',
      additionalPrompt: ''
    },
    responseModality: 'text_image'
  });
  
  const [cameraLightingData, setCameraLightingData] = useState<CameraLightingData>({
    detailedSettings: defaultDetailedSettings,
    config: {
      style: 'realistic',
      quality: 'high',
      aspectRatio: '16:9',
      customSize: '',
      additionalPrompt: ''
    },
    isDetailedMode: false
  });

  // 생성된 이미지 상태
  const [generatedImage, setGeneratedImage] = useState<{
    imageUrl: string;
    prompt: string;
    settings: any;
    timestamp: Date;
  } | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState<{
    image: string;
    prompt: string;
    settings: any;
    timestamp: Date;
  } | null>(null);

  // UI 상태
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [showPreviewOptions, setShowPreviewOptions] = useState(true);
  const [realTimePrompt, setRealTimePrompt] = useState('');

  // 최적화 결과 상태
  const [optimizationResult, setOptimizationResult] = useState<{
    aiOptimizedKorean: string;
    translatedEnglish: string;
    geminiOptimized: string;
    model?: string;
    ratio?: string;
    upscale?: string;
    settings?: string;
  } | null>(null);

  // AI 번역 진행 상태
  const [isTranslating, setIsTranslating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 전체 모달 초기화 함수
  const resetModalState = useCallback(() => {
    setStep(1);
    setBasicData({
      prompt: '',
      attachedImages: [],
      imageRoles: []
    });
    setSizeStyleData({
      selectedOutputSize: null,
      selectedEditingStyle: null,
      config: {
        style: 'realistic',
        quality: 'high',
        aspectRatio: '16:9',
        customSize: '',
        additionalPrompt: ''
      },
      responseModality: 'text_image'
    });
    setCameraLightingData({
      detailedSettings: defaultDetailedSettings,
      config: {
        style: 'realistic',
        quality: 'high',
        aspectRatio: '16:9',
        customSize: '',
        additionalPrompt: ''
      },
      isDetailedMode: false
    });
    setRealTimePrompt('');
    setOptimizationResult(null);
    setGeneratedImage(null);
    setIsGenerating(false);
    setShowPromptDetails(false);
    setShowPreviewOptions(true);
    setIsTranslating(false);
    setIsOptimizing(false);
    setGeneratedImageData(null);
  }, []);

  // 최적화 결과만 초기화
  const resetOptimizationResult = useCallback(() => {
    setOptimizationResult(null);
    setIsTranslating(false);
    setIsOptimizing(false);
  }, []);

  return {
    // 상태
    step,
    setStep,
    basicData,
    setBasicData,
    sizeStyleData,
    setSizeStyleData,
    cameraLightingData,
    setCameraLightingData,
    generatedImage,
    setGeneratedImage,
    isGenerating,
    setIsGenerating,
    generatedImageData,
    setGeneratedImageData,
    showPromptDetails,
    setShowPromptDetails,
    showPreviewOptions,
    setShowPreviewOptions,
    realTimePrompt,
    setRealTimePrompt,
    optimizationResult,
    setOptimizationResult,
    isTranslating,
    setIsTranslating,
    isOptimizing,
    setIsOptimizing,
    
    // 함수
    resetModalState,
    resetOptimizationResult
  };
};

