import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { NanoBananaService } from '../../services/ai/NanoBananaService';
import { ImageAnalysisModal } from '../common/ImageAnalysisModal';
import { ImageGenerationForm, ImageGenerationConfig } from '../common/ImageGenerationForm';
import { AdvancedImageGenerationModal } from '../common/AdvancedImageGenerationModal';
import { AISettingsModal } from '../common/AISettingsModal';
import { StyleReferenceModal } from '../common/StyleReferenceModal';
import { PromptConfirmationModal } from '../common/PromptConfirmationModal';
import { NanoBananaImageStepHeader } from './NanoBananaImageStepHeader';
import { NanoBananaImageStepTabs } from './NanoBananaImageStepTabs';
import { AIProvider } from '../../types/ai';
import type { GeneratedCharacter, GeneratedBackground, GeneratedSettingCut, ImageGenerationMetadata } from '../../types/project';
import { useUIStore } from '../../stores/uiStore';
import { ErrorMessageModal } from '../common/ErrorMessageModal';

interface NanoBananaImageStepProps {
  generatedCharacters: GeneratedCharacter[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<GeneratedCharacter[]>>;
  generatedBackgrounds: GeneratedBackground[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<GeneratedBackground[]>>;
  generatedSettingCuts: GeneratedSettingCut[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<GeneratedSettingCut[]>>;
  // 고급 이미지 생성 props
  generatedAdvancedImages: GeneratedCharacter[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<GeneratedCharacter[]>>;
  generatedProjectData: any;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  // 프로젝트 개요 데이터
  story: string;
  characterList: any[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  onNext: () => void;
  canProceedToNext?: () => boolean;
  // 사용자 정보
  currentUser?: any;
}

export const NanoBananaImageStep: React.FC<NanoBananaImageStepProps> = ({
  generatedCharacters,
  setGeneratedCharacters,
  generatedBackgrounds,
  setGeneratedBackgrounds,
  generatedSettingCuts,
  setGeneratedSettingCuts,
  // 고급 이미지 생성 props
  generatedAdvancedImages,
  setGeneratedAdvancedImages,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  characterList,
  scenarioPrompt,
  storySummary,
  finalScenario,
  onNext,
  canProceedToNext,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  
  // 에러 모달 상태
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  
  // 기본 이미지 생성 상태
  const [characterInput, setCharacterInput] = useState('');
  const [backgroundInput, setBackgroundInput] = useState('');
  const [settingCut, setSettingCut] = useState('');
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);
  
  // 공통 입력 항목 표시 상태
  const [showCommonInputs, setShowCommonInputs] = useState(false);
  const [commonInputsCompleted, setCommonInputsCompleted] = useState(false);
  
  // 공통 이미지 생성 설정
  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({
    style: 'realistic',
    quality: 'high',
    aspectRatio: '1:1',
    customSize: '',
    additionalPrompt: '',
    // Imagen 3/4 옵션들
    numberOfImages: 4,
    imageSize: '1K',
    personGeneration: 'allow_adult',
    // Gemini 2.5 Flash Image 옵션들 (img2img용)
    responseModalities: 'Image',
    styleEnhancement: 'balanced',
    editMode: 'modify',
    detailPreservation: 70,
    editIntensity: 50,
    cameraControl: 'maintain'
  });
  const [showCommonOptions, setShowCommonOptions] = useState(true);
  
  // 개별 옵션 표시 상태
  const [showCharacterOptions, setShowCharacterOptions] = useState(false);
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);
  const [showSettingOptions, setShowSettingOptions] = useState(false);
  
  // 개별 옵션 설정 상태
  const [characterOptions, setCharacterOptions] = useState<ImageGenerationConfig>({
    ...imageConfig,
    customSize: '',
    additionalPrompt: '',
    responseModalities: 'Image',
    styleEnhancement: 'none',
    editMode: 'modify',
    detailPreservation: 75,
    editIntensity: 50,
    cameraControl: 'maintain',
    // 카메라 설정 옵션들
    cameraPosition: 'front',
    lensType: 'standard',
    focalDistance: 'medium',
    cameraFilter: 'none'
  });
  
  const [backgroundOptions, setBackgroundOptions] = useState<ImageGenerationConfig>({
    ...imageConfig,
    customSize: '',
    additionalPrompt: '',
    responseModalities: 'Image',
    styleEnhancement: 'none',
    editMode: 'modify',
    detailPreservation: 75,
    editIntensity: 50,
    cameraControl: 'maintain',
    // 카메라 설정 옵션들
    cameraPosition: 'front',
    lensType: 'standard',
    focalDistance: 'medium',
    cameraFilter: 'none'
  });
  
  const [settingOptions, setSettingOptions] = useState<ImageGenerationConfig>({
    ...imageConfig,
    customSize: '',
    additionalPrompt: '',
    responseModalities: 'Image',
    styleEnhancement: 'none',
    editMode: 'modify',
    detailPreservation: 75,
    editIntensity: 50,
    cameraControl: 'maintain',
    // 카메라 설정 옵션들
    cameraPosition: 'front',
    lensType: 'standard',
    focalDistance: 'medium',
    cameraFilter: 'none'
  });
  
  // 공통 입력 완료 처리
  const handleCommonInputsComplete = () => {
    if (!story || characterList.length === 0) {
      console.log('스토리와 캐릭터 정보를 입력해주세요.');
      return;
    }

    setCommonInputsCompleted(true);
    setShowCommonInputs(false);
    console.log('기본 정보가 성공적으로 입력되었습니다.');
  };

  // 공통 입력 초기화
  const handleCommonInputsReset = () => {
    setCommonInputsCompleted(false);
    console.log('공통 입력 항목이 초기화되었습니다.');
  };

  // 고급 이미지 생성 모달 상태
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  
  // 이미지 분석 모달 상태
  const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);
  
  // AI 설정 모달 상태
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState<AIProvider>('google');

  // 스타일 참조 모달 상태
  const [showStyleReferenceModal, setShowStyleReferenceModal] = useState(false);

  // 생성 중 상태
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingSettingCut, setIsGeneratingSettingCut] = useState(false);
  
  // 프롬프트 확인 모달 상태
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{
    type: 'character' | 'background' | 'setting';
    prompt: string;
    attachedImages: File[];
    settings: ImageGenerationConfig;
  } | null>(null);

  // API 키 확인 함수 (개선된 버전)
  const getAPIKey = () => {
    try {
      if (typeof window !== 'undefined') {
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const localKeysRaw = localStorage.getItem('user_api_keys');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};
        
        // 우선순위: 로컬 키 > 사용자 키 > 빈 문자열
        const apiKey = localKeys.google || currentUser?.apiKeys?.google || '';
        
        console.log('🔍 API 키 검색 결과:', {
          hasLocalKeys: !!localKeys.google,
          hasUserKeys: !!currentUser?.apiKeys?.google,
          currentUser: currentUser?.email,
          finalKey: apiKey ? `${apiKey.substring(0, 8)}...` : '없음'
        });
        
        return apiKey;
      }
    } catch (error) {
      console.error('❌ API 키 로드 오류:', error);
    }
    return '';
  };

  // NanoBanana 서비스 인스턴스
  const nanoBananaService = useMemo(() => {
    const apiKey = getAPIKey();
    console.log('🔑 API 키 상태:', apiKey ? '설정됨' : '미설정');
    
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ API 키가 설정되지 않았습니다.');
      return null;
    }
    
    try {
      const service = new NanoBananaService({ apiKey });
      console.log('✅ NanoBanana 서비스 초기화 성공');
      return service;
    } catch (error) {
      console.error('❌ NanoBanana 서비스 초기화 실패:', error);
      return null;
    }
  }, [currentUser]); // currentUser가 변경될 때마다 서비스 재생성

  // 캐릭터 생성 핸들러
  const handleGenerateCharacter = async () => {
    if (!characterInput.trim()) {
      console.log('캐릭터 설명을 입력해주세요.');
      return;
    }

    // 프롬프트 확인 모달 표시
    setPendingGeneration({
      type: 'character',
      prompt: characterInput,
      attachedImages: attachedCharacterImages,
      settings: characterOptions
    });
    setShowPromptModal(true);
  };

  // 실제 캐릭터 생성 실행
  const executeCharacterGeneration = async () => {
    if (!pendingGeneration) return;

    if (!nanoBananaService) {
      console.error('❌ NanoBanana 서비스가 초기화되지 않았습니다.');
      alert('API 키가 설정되지 않았습니다. 설정에서 Google AI API 키를 입력해주세요.');
      setIsGeneratingCharacter(false);
      return;
    }

    setIsGeneratingCharacter(true);
    try {
      let result;
      
      if (pendingGeneration.attachedImages.length > 0) {
        // img2img 생성 (첨부된 이미지가 있을 때)
        console.log('🍌 img2img 캐릭터 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        const imageResult = await nanoBananaService.generateImageWithReference(
          detailedPrompt,
          pendingGeneration.attachedImages[0]
        );
        
        if (imageResult) {
          result = {
            images: [imageResult],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            model: 'gemini-2.5-flash-image'
          };
        }
      } else {
        // 일반 이미지 생성
        console.log('🍌 일반 캐릭터 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        result = await nanoBananaService.generateImage({
          prompt: detailedPrompt,
        provider: 'google',
          aspectRatio: pendingGeneration.settings.aspectRatio as "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
          style: pendingGeneration.settings.style as "photographic" | "artistic" | "cartoon" | "anime",
          quality: pendingGeneration.settings.quality as "standard" | "high" | "ultra",
          numberOfImages: pendingGeneration.settings.numberOfImages,
        model: 'gemini-2.5-flash-image-preview'
      });
      }

      if (result && result.images && result.images.length > 0) {
        // 나노 바나나는 항상 1개만 생성되므로 메타데이터에 반영
        const personGeneration = pendingGeneration.settings?.personGeneration || 'allow_adult';
        const generationMetadata: ImageGenerationMetadata = {
          personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
          aspectRatio: pendingGeneration.settings?.aspectRatio || '1:1',
          numberOfImages: 1, // 나노 바나나는 항상 1개만 생성
          apiResponse: {
            generatedCount: 1,
            requestedCount: 1,
            timestamp: new Date().toISOString()
          }
        };
        
        const newCharacter: GeneratedCharacter = {
          id: Date.now(),
          description: pendingGeneration.prompt,
          image: result.images[0],
          attachedImages: pendingGeneration.attachedImages.map(f => f.name || 'file'), // File[]를 string[]로 변환
          timestamp: new Date().toISOString(),
          type: 'character',
          generationMetadata
        };

        setGeneratedCharacters(prev => [...prev, newCharacter]);
        setCharacterInput('');
        setAttachedCharacterImages([]);
        
        // 성공 메시지 (나노 바나나 특성 반영)
        const personGenerationText = personGeneration === 'allow_all' ? '모든 연령 허용' :
                                    personGeneration === 'allow_adult' ? '성인만 허용' :
                                    personGeneration === 'dont_allow' ? '사람 생성 차단' : '기본값';
        
        addNotification({
          type: 'success',
          title: '캐릭터 생성 완료',
          message: `이미지가 생성되었습니다. (나노 바나나 API는 항상 1개만 생성)\n\n적용된 옵션:\n• 사람 생성: ${personGenerationText}\n• 화면 비율: ${pendingGeneration.settings?.aspectRatio || '1:1'}`
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 캐릭터 생성 완료:', {
            이미지개수: 1,
            personGeneration,
            aspectRatio: pendingGeneration.settings?.aspectRatio
          });
        }
      } else {
        throw new Error('이미지 생성 결과가 없습니다.');
      }
    } catch (error) {
      console.error('❌ 캐릭터 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '캐릭터 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingCharacter(false);
      setShowPromptModal(false);
      setPendingGeneration(null);
    }
  };

  // 배경 생성 핸들러
  const handleGenerateBackground = async () => {
    if (!backgroundInput.trim()) {
      console.log('배경 설명을 입력해주세요.');
        return;
      }
      
    // 프롬프트 확인 모달 표시
    setPendingGeneration({
      type: 'background',
      prompt: backgroundInput,
      attachedImages: attachedBackgroundImages,
      settings: backgroundOptions
    });
    setShowPromptModal(true);
  };

  // 실제 배경 생성 실행
  const executeBackgroundGeneration = async () => {
    if (!pendingGeneration) return;

    if (!nanoBananaService) {
      console.error('❌ NanoBanana 서비스가 초기화되지 않았습니다.');
      alert('API 키가 설정되지 않았습니다. 설정에서 Google AI API 키를 입력해주세요.');
      setIsGeneratingBackground(false);
      return;
    }
      
    setIsGeneratingBackground(true);
    try {
      let result;
      
      if (pendingGeneration.attachedImages.length > 0) {
        // img2img 생성 (첨부된 이미지가 있을 때)
        console.log('🍌 img2img 배경 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        const imageResult = await nanoBananaService.generateImageWithReference(
          detailedPrompt,
          pendingGeneration.attachedImages[0]
        );
        
        if (imageResult) {
          result = {
            images: [imageResult],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            model: 'gemini-2.5-flash-image'
          };
        }
      } else {
        // 일반 이미지 생성
        console.log('🍌 일반 배경 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        result = await nanoBananaService.generateImage({
          prompt: detailedPrompt,
        provider: 'google',
          aspectRatio: pendingGeneration.settings.aspectRatio as "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
          style: pendingGeneration.settings.style as "photographic" | "artistic" | "cartoon" | "anime",
          quality: pendingGeneration.settings.quality as "standard" | "high" | "ultra",
          numberOfImages: pendingGeneration.settings.numberOfImages,
        model: 'gemini-2.5-flash-image-preview'
      });
      }

      if (result && result.images && result.images.length > 0) {
        // 나노 바나나는 항상 1개만 생성되므로 메타데이터에 반영
        const personGeneration = pendingGeneration.settings?.personGeneration || 'allow_adult';
        const generationMetadata: ImageGenerationMetadata = {
          personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
          aspectRatio: pendingGeneration.settings?.aspectRatio || '1:1',
          numberOfImages: 1, // 나노 바나나는 항상 1개만 생성
          apiResponse: {
            generatedCount: 1,
            requestedCount: 1,
            timestamp: new Date().toISOString()
          }
        };
        
        const newBackground: GeneratedBackground = {
          id: Date.now(),
          description: pendingGeneration.prompt,
          image: result.images[0],
          attachedImages: pendingGeneration.attachedImages.map(f => f.name || 'file'), // File[]를 string[]로 변환
          timestamp: new Date().toISOString(),
          type: 'background',
          generationMetadata
        };

        setGeneratedBackgrounds(prev => [...prev, newBackground]);
        setBackgroundInput('');
        setAttachedBackgroundImages([]);
        
        // 성공 메시지 (나노 바나나 특성 반영)
        const personGenerationText = personGeneration === 'allow_all' ? '모든 연령 허용' :
                                    personGeneration === 'allow_adult' ? '성인만 허용' :
                                    personGeneration === 'dont_allow' ? '사람 생성 차단' : '기본값';
        
        addNotification({
          type: 'success',
          title: '배경 생성 완료',
          message: `이미지가 생성되었습니다. (나노 바나나 API는 항상 1개만 생성)\n\n적용된 옵션:\n• 사람 생성: ${personGenerationText}\n• 화면 비율: ${pendingGeneration.settings?.aspectRatio || '1:1'}`
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 배경 생성 완료:', {
            이미지개수: 1,
            personGeneration,
            aspectRatio: pendingGeneration.settings?.aspectRatio
          });
        }
      }
    } catch (error) {
      console.error('배경 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '배경 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingBackground(false);
      setShowPromptModal(false);
      setPendingGeneration(null);
    }
  };

  // 설정 컷 생성 핸들러
  const handleGenerateSettingCut = async () => {
    if (!settingCut.trim()) {
      console.log('설정 컷 설명을 입력해주세요.');
      return;
    }

    // 프롬프트 확인 모달 표시
    setPendingGeneration({
      type: 'setting',
      prompt: settingCut,
      attachedImages: attachedSettingImages,
      settings: settingOptions
    });
    setShowPromptModal(true);
  };

  // 실제 설정 컷 생성 실행
  const executeSettingCutGeneration = async () => {
    if (!pendingGeneration) return;

    if (!nanoBananaService) {
      console.error('❌ NanoBanana 서비스가 초기화되지 않았습니다.');
      alert('API 키가 설정되지 않았습니다. 설정에서 Google AI API 키를 입력해주세요.');
      setIsGeneratingSettingCut(false);
      return;
    }

    setIsGeneratingSettingCut(true);
    try {
      let result;
      
      if (pendingGeneration.attachedImages.length > 0) {
        // img2img 생성 (첨부된 이미지가 있을 때)
        console.log('🍌 img2img 설정 컷 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        const imageResult = await nanoBananaService.generateImageWithReference(
          detailedPrompt,
          pendingGeneration.attachedImages[0]
        );
        
        if (imageResult) {
          result = {
            images: [imageResult],
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            model: 'gemini-2.5-flash-image'
          };
        }
      } else {
        // 일반 이미지 생성
        console.log('🍌 일반 설정 컷 생성 시작');
        
        // 상세 프롬프트 구성
        let detailedPrompt = pendingGeneration.prompt;
        
        // 기본 설정 추가
        if (pendingGeneration.settings.customSize) {
          detailedPrompt += `\n\n사이즈 요청사항: ${pendingGeneration.settings.customSize}`;
        }
        if (pendingGeneration.settings.additionalPrompt) {
          detailedPrompt += `\n\n추가 요청사항: ${pendingGeneration.settings.additionalPrompt}`;
        }
        
        // 스타일과 품질 추가
        detailedPrompt += `\n\n스타일: ${pendingGeneration.settings.style}, 품질: ${pendingGeneration.settings.quality}, 비율: ${pendingGeneration.settings.aspectRatio}`;
        
        // 카메라 설정 추가
        if (pendingGeneration.settings.cameraPosition) {
          const cameraMap: { [key: string]: string } = {
            'front': '정면 촬영',
            'side': '측면 촬영',
            'back': '후면 촬영',
            'top': '상단 촬영',
            'low_angle': '로우 앵글',
            'high_angle': '하이 앵글',
            'bird_eye': '버드아이 뷰',
            'worm_eye': '웜아이 뷰'
          };
          detailedPrompt += `\n카메라 위치: ${cameraMap[pendingGeneration.settings.cameraPosition] || pendingGeneration.settings.cameraPosition}`;
        }
        
        if (pendingGeneration.settings.lensType) {
          detailedPrompt += `\n렌즈: ${pendingGeneration.settings.lensType}`;
        }
        
        if (pendingGeneration.settings.focalDistance) {
          detailedPrompt += `\n초점 거리: ${pendingGeneration.settings.focalDistance}`;
        }
        
        // 스타일 강화 설정 추가
        if (pendingGeneration.settings.styleEnhancement && pendingGeneration.settings.styleEnhancement !== 'none') {
          const enhancementMap: { [key: string]: string } = {
            'enhanced': '강화된 스타일',
            'subtle': '은은한 스타일 강화',
            'dramatic': '드라마틱한 스타일 강화'
          };
          detailedPrompt += `\n스타일 강화: ${enhancementMap[pendingGeneration.settings.styleEnhancement] || pendingGeneration.settings.styleEnhancement}`;
        }
        
        // 편집 모드 추가
        if (pendingGeneration.settings.editMode) {
          const editModeMap: { [key: string]: string } = {
            'modify': '수정 모드',
            'enhance': '향상 모드',
            'transform': '변환 모드'
          };
          detailedPrompt += `\n편집 모드: ${editModeMap[pendingGeneration.settings.editMode] || pendingGeneration.settings.editMode}`;
        }
        
        // 세부사항 보존 설정 추가
        if (pendingGeneration.settings.detailPreservation) {
          detailedPrompt += `\n세부사항 보존: ${pendingGeneration.settings.detailPreservation}%`;
        }
        
        result = await nanoBananaService.generateImage({
          prompt: detailedPrompt,
        provider: 'google',
          aspectRatio: pendingGeneration.settings.aspectRatio as "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
          style: pendingGeneration.settings.style as "photographic" | "artistic" | "cartoon" | "anime",
          quality: pendingGeneration.settings.quality as "standard" | "high" | "ultra",
          numberOfImages: pendingGeneration.settings.numberOfImages,
        model: 'gemini-2.5-flash-image-preview'
      });
      }

      if (result && result.images && result.images.length > 0) {
        // 나노 바나나는 항상 1개만 생성되므로 메타데이터에 반영
        const personGeneration = pendingGeneration.settings?.personGeneration || 'allow_adult';
        const generationMetadata: ImageGenerationMetadata = {
          personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
          aspectRatio: pendingGeneration.settings?.aspectRatio || '1:1',
          numberOfImages: 1, // 나노 바나나는 항상 1개만 생성
          apiResponse: {
            generatedCount: 1,
            requestedCount: 1,
            timestamp: new Date().toISOString()
          }
        };
        
        const newSettingCut: GeneratedSettingCut = {
          id: Date.now(),
          description: pendingGeneration.prompt,
          image: result.images[0],
          attachedImages: pendingGeneration.attachedImages.map(f => f.name || 'file'), // File[]를 string[]로 변환
          timestamp: new Date().toISOString(),
          type: 'setting',
          generationMetadata
        };

        setGeneratedSettingCuts(prev => [...prev, newSettingCut]);
        setSettingCut('');
        setAttachedSettingImages([]);
        
        // 성공 메시지 (나노 바나나 특성 반영)
        const personGenerationText = personGeneration === 'allow_all' ? '모든 연령 허용' :
                                    personGeneration === 'allow_adult' ? '성인만 허용' :
                                    personGeneration === 'dont_allow' ? '사람 생성 차단' : '기본값';
        
        addNotification({
          type: 'success',
          title: '설정 컷 생성 완료',
          message: `이미지가 생성되었습니다. (나노 바나나 API는 항상 1개만 생성)\n\n적용된 옵션:\n• 사람 생성: ${personGenerationText}\n• 화면 비율: ${pendingGeneration.settings?.aspectRatio || '1:1'}`
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 설정 컷 생성 완료:', {
            이미지개수: 1,
            personGeneration,
            aspectRatio: pendingGeneration.settings?.aspectRatio
          });
        }
      }
    } catch (error) {
      console.error('설정 컷 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '설정 컷 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingSettingCut(false);
      setShowPromptModal(false);
      setPendingGeneration(null);
    }
  };

  // 고급 이미지 생성 완료 핸들러
  const handleAdvancedImageComplete = (result: any) => {
    console.log('🎉 고급 이미지 생성 완료:', result);
    
    if (result && result.image) {
      const newAdvancedImage: GeneratedCharacter = {
        id: Date.now(),
        description: result.description || '고급 이미지',
        image: result.image,
        attachedImages: (result.attachedImages || []).map((f: File) => f.name || 'file'), // File[]를 string[]로 변환
        timestamp: new Date().toISOString(),
        type: 'character'
      };
      
      setGeneratedAdvancedImages(prev => [...prev, newAdvancedImage]);
      console.log('✅ 고급 이미지가 성공적으로 생성되어 목록에 추가되었습니다.');
      
      // 모달 닫기
      setShowAdvancedModal(false);
    } else {
      console.error('❌ 고급 이미지 생성 결과가 올바르지 않습니다:', result);
    }
  };

  // 프롬프트 확인 모달 핸들러
  const handlePromptConfirm = async () => {
    if (!pendingGeneration) return;

    switch (pendingGeneration.type) {
      case 'character':
        await executeCharacterGeneration();
        break;
      case 'background':
        await executeBackgroundGeneration();
        break;
      case 'setting':
        await executeSettingCutGeneration();
        break;
    }
  };

  const handlePromptCancel = () => {
    setShowPromptModal(false);
    setPendingGeneration(null);
  };

  return (
    <div className="space-y-6">
      {/* 상단 블록: 프로젝트 개요, 이미지 생성 옵션, 공통 입력 항목, 이미지 분석 도구 */}
      <NanoBananaImageStepHeader
        story={story}
        characterList={characterList}
        storySummary={storySummary}
        finalScenario={finalScenario}
        showCommonOptions={showCommonOptions}
        setShowCommonOptions={setShowCommonOptions}
        imageConfig={imageConfig}
        setImageConfig={setImageConfig}
        showCommonInputs={showCommonInputs}
        setShowCommonInputs={setShowCommonInputs}
        commonInputsCompleted={commonInputsCompleted}
        onCommonInputsComplete={handleCommonInputsComplete}
        onCommonInputsReset={handleCommonInputsReset}
        onOpenImageAnalysis={() => setShowImageAnalysisModal(true)}
        onOpenAPIKeySetup={() => setShowAISettingsModal(true)}
        onOpenAdvancedImageGeneration={() => setShowAdvancedModal(true)}
        onOpenStyleReference={() => setShowStyleReferenceModal(true)}
      />

      {/* 탭 기반 생성 도구 */}
      <NanoBananaImageStepTabs
        onGenerateCharacter={handleGenerateCharacter}
        onGenerateBackground={handleGenerateBackground}
        onGenerateSettingCut={handleGenerateSettingCut}
        characterInput={characterInput}
        setCharacterInput={setCharacterInput}
        backgroundInput={backgroundInput}
        setBackgroundInput={setBackgroundInput}
        settingCut={settingCut}
        setSettingCut={setSettingCut}
        attachedCharacterImages={attachedCharacterImages}
        setAttachedCharacterImages={setAttachedCharacterImages}
        attachedBackgroundImages={attachedBackgroundImages}
        setAttachedBackgroundImages={setAttachedBackgroundImages}
        attachedSettingImages={attachedSettingImages}
        setAttachedSettingImages={setAttachedSettingImages}
        showCharacterOptions={showCharacterOptions}
        setShowCharacterOptions={setShowCharacterOptions}
        showBackgroundOptions={showBackgroundOptions}
        setShowBackgroundOptions={setShowBackgroundOptions}
        showSettingOptions={showSettingOptions}
        setShowSettingOptions={setShowSettingOptions}
        characterOptions={characterOptions}
        setCharacterOptions={setCharacterOptions}
        backgroundOptions={backgroundOptions}
        setBackgroundOptions={setBackgroundOptions}
        settingOptions={settingOptions}
        setSettingOptions={setSettingOptions}
        isGenerating={isGeneratingCharacter || isGeneratingBackground || isGeneratingSettingCut}
        generatedCharacters={generatedCharacters}
        generatedBackgrounds={generatedBackgrounds}
        generatedSettingCuts={generatedSettingCuts}
        generatedAdvancedImages={generatedAdvancedImages}
        setGeneratedAdvancedImages={setGeneratedAdvancedImages}
      />

      {/* 하단 생성 이미지 첨부 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">생성된 이미지</h2>
        </div>

        {generatedAdvancedImages.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-3">생성된 이미지 ({generatedAdvancedImages.length}개)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generatedAdvancedImages.map((advancedImage, index) => (
                <div key={advancedImage.id} className="border rounded-lg p-3">
                  <img
                    src={advancedImage.image}
                    alt={`이미지 ${index + 1}`}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {advancedImage.description}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        try {
                          const canvas = document.createElement('canvas');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              
                              canvas.toBlob((blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `이미지_상세_${index + 1}_${Date.now()}.png`;
                                  document.body.appendChild(link);
                        link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }
                              }, 'image/png');
                            }
                          };
                          img.src = advancedImage.image;
                        } catch (error) {
                          console.error('상세 다운로드 오류:', error);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white p-1 rounded text-xs"
                      title="상세 다운로드"
                    >
                      HD
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const canvas = document.createElement('canvas');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              
                              canvas.toBlob((blob) => {
                                if (blob) {
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                                  link.download = `이미지_저사양_${index + 1}_${Date.now()}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                                }
                              }, 'image/jpeg', 0.7); // JPEG 품질 70%
                            }
                          };
                          img.src = advancedImage.image;
                        } catch (error) {
                          console.error('저사양 다운로드 오류:', error);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-xs"
                      title="저사양 다운로드"
                    >
                      SD
                    </button>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* 모달들 */}
        <AdvancedImageGenerationModal
          isOpen={showAdvancedModal}
          onClose={() => setShowAdvancedModal(false)}
          onComplete={handleAdvancedImageComplete}
          nanoBananaService={nanoBananaService}
        />

      <ImageAnalysisModal
        isOpen={showImageAnalysisModal}
        onClose={() => setShowImageAnalysisModal(false)}
      />

      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
        selectedProvider={selectedAIProvider}
        onProviderChange={setSelectedAIProvider}
        onSave={() => {
          // API 키 저장 후 서비스 재초기화
          console.log('AI 설정이 저장되었습니다.');
        }}
      />

      <StyleReferenceModal
        isOpen={showStyleReferenceModal}
        onClose={() => setShowStyleReferenceModal(false)}
      />

      {/* 프롬프트 확인 모달 */}
      <PromptConfirmationModal
        isOpen={showPromptModal}
        onClose={handlePromptCancel}
        onConfirm={handlePromptConfirm}
        prompt={pendingGeneration?.prompt || ''}
        title={`${pendingGeneration?.type === 'character' ? '캐릭터' : pendingGeneration?.type === 'background' ? '배경' : '설정 컷'} 이미지 생성 확인`}
        isLoading={isGeneratingCharacter || isGeneratingBackground || isGeneratingSettingCut}
        attachedImages={pendingGeneration?.attachedImages || []}
        settings={pendingGeneration?.settings}
        isNanoBanana={true} // 나노 바나나 API 사용 표시
      />

      {/* 에러 모달 */}
      <ErrorMessageModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        error={{
          title: errorModal.title,
          message: errorModal.message,
          type: 'error'
        }}
      />
    </div>
  );
};