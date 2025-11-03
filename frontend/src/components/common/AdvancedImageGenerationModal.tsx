import React, { useEffect, useState } from 'react';
import { AdvancedImageGenerationProps } from '../../types/imageGeneration';
import { PromptImageBasicModule } from './modules/PromptImageBasicModule';
import { SizeStyleConfigModule } from './modules/SizeStyleConfigModule';
import { CameraLightingModule } from './modules/CameraLightingModule';
import { PromptOptimizationStep } from './modules/PromptOptimizationStep';
import { ImageGenerationStep } from './modules/ImageGenerationStep';
import { useAdvancedImageGeneration } from '../../hooks/useAdvancedImageGeneration';
import { ImageGenerationService } from '../../services/imageGenerationService';
import { getFormattedErrorMessage } from '../../utils/contentPolicyValidator';
import { ErrorMessageModal } from './ErrorMessageModal';

export const AdvancedImageGenerationModal: React.FC<AdvancedImageGenerationProps> = ({
  isOpen,
  onClose,
  onComplete,
  nanoBananaService
}) => {
  // 커스텀 훅을 사용한 상태 관리
  const {
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
    optimizationResult,
    setOptimizationResult,
    isTranslating,
    setIsTranslating,
    isOptimizing,
    setIsOptimizing,
    resetModalState,
    resetOptimizationResult
  } = useAdvancedImageGeneration();

  // 편의를 위한 별칭
  const prompt = basicData.prompt;
  const attachedImages = basicData.attachedImages;
  const imageRoles = basicData.imageRoles;
  const selectedOutputSize = sizeStyleData.selectedOutputSize;
  const selectedEditingStyle = sizeStyleData.selectedEditingStyle;
  const config = sizeStyleData.config;
  const responseModality = sizeStyleData.responseModality;
  const detailedSettings = cameraLightingData.detailedSettings;
  const isDetailedMode = cameraLightingData.isDetailedMode;

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

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      resetModalState();
      setErrorModal({ isOpen: false, title: '', message: '' });
    }
  }, [isOpen, resetModalState]);

  // 프롬프트 변경 시 최적화 결과 초기화
  useEffect(() => {
    setOptimizationResult(null);
  }, [basicData, sizeStyleData, cameraLightingData, setOptimizationResult]);

  // 디바운싱 훅 사용 예시 (필요 시 실제 값에 적용)
  // const debouncedPrompt = useDebounce(prompt, 300);

  // 설정 변경 핸들러 (하위 호환성)
  const handleConfigChange = (key: string, value: string) => {
    setSizeStyleData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };


  // 이미지 저장 핸들러
  const handleSaveImage = (imageData: {
    imageUrl: string;
    prompt: string;
    timestamp: string;
    settings: any;
  }) => {
    if (!generatedImageData) {
      alert('저장할 이미지 데이터가 없습니다.\n\n먼저 이미지를 생성해주세요.');
      return;
    }

    try {
      const saveResults = ImageGenerationService.saveImageToStorage(
        generatedImageData,
        attachedImages
      );

      // onComplete 콜백 호출
        onComplete({
          description: generatedImageData.prompt,
          image: generatedImageData.image,
          attachedImages: attachedImages
        });
        
        // 저장 성공 메시지
      const successMessage = `이미지가 성공적으로 저장되었습니다!\n\n저장 위치:\n• 고급이미지 카드: ${saveResults.advanced ? '✅' : '❌'}\n• 프로젝트 참조 모달: ${saveResults.project ? '✅' : '❌'}\n• 생성 페이지 하단: ${saveResults.general ? '✅' : '❌'}`;
        
        alert(successMessage);
        onClose();
      } catch (error) {
        console.error('❌ 이미지 저장 중 오류 발생:', error);
        alert('이미지 저장 중 오류가 발생했습니다.\n\n로컬 스토리지 용량이 부족할 수 있습니다.\n브라우저 데이터를 정리하거나 다른 브라우저를 사용해보세요.');
    }
  };

  // 이미지 생성 핸들러 (서비스 사용)
  const handleGenerate = async () => {
    console.log('🚀 이미지 생성 시작 - 서비스 상태 확인');
    
    if (!nanoBananaService) {
      console.error('❌ NanoBanana 서비스가 초기화되지 않음');
      try {
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const localKeysRaw = localStorage.getItem('user_api_keys');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};
        
        const hasLocalKey = !!localKeys.google;
        const hasUserKey = !!currentUser?.apiKeys?.google;
        
        if (!hasLocalKey && !hasUserKey) {
          alert('Google AI API 키가 설정되지 않았습니다.\n\n설정 → AI 설정에서 Google AI API 키를 입력해주세요.');
        } else {
          alert('API 키는 설정되어 있지만 서비스 초기화에 실패했습니다.\n\n페이지를 새로고침하거나 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('❌ API 키 상태 확인 중 오류:', error);
        alert('API 키 상태를 확인하는 중 오류가 발생했습니다.\n\n페이지를 새로고침해주세요.');
      }
      return;
    }

    console.log('✅ NanoBanana 서비스 확인 완료 - 이미지 생성 시작');
    setIsGenerating(true);
    
    try {
      const imageData = await ImageGenerationService.generateImage(
        nanoBananaService,
        {
          prompt,
          attachedImages,
          imageRoles,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          config,
          optimizationResult
        }
      );

      const basePrompt = prompt || '';
      setGeneratedImage({
        imageUrl: imageData,
        prompt: basePrompt,
        settings: {
          config,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          responseModality,
          attachedImages: attachedImages.length,
          imageRoles
        },
        timestamp: new Date()
      });
      
      const imageDataObj = {
        image: imageData,
        prompt: basePrompt,
        settings: {
          config,
          selectedOutputSize,
          selectedEditingStyle,
          detailedSettings,
          isDetailedMode,
          responseModality,
          attachedImages: attachedImages.length,
          imageRoles
        },
        timestamp: new Date()
      };
      setGeneratedImageData(imageDataObj);
      
      console.log('✅ 이미지 생성 완료 - 모달 유지');
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      // 에러 메시지 포맷팅
      const errorMessage = getFormattedErrorMessage(error, prompt);
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '이미지 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 이미지 업로드 핸들러 (모듈에서 처리됨, 하위 호환성)
  const handleImageUpload = (files: File[]) => {
    const newRoles = files.map((file, index) => ({
      id: `role_${Date.now()}_${index}`,
      file: file,
      role: 'character' as const,
      description: `참조 이미지 ${index + 1}`,
      weight: 5
    }));
    setBasicData(prev => ({
      ...prev,
      attachedImages: files,
      imageRoles: newRoles
    }));
  };

  // 모달 닫기 핸들러
  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">고급 이미지 생성</h2>
          <button
            onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

          {/* 단계별 진행 - 3단계로 축소 */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div
                      className={`w-8 h-0.5 ${
                        step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                {step === 1 && '기본 생성 (프롬프트/이미지)'}
                {step === 2 && '사이즈/스타일 설정'}
                {step === 3 && '카메라/조명 설정'}
              </p>
            </div>
          </div>

          {/* 1단계: 기본 생성 (프롬프트/이미지) */}
          {step === 1 && (
            <PromptImageBasicModule
              initialData={basicData}
              onDataChange={setBasicData}
              onNext={() => setStep(2)}
            />
          )}

          {/* 2단계: 사이즈/스타일 설정 */}
          {step === 2 && (
            <SizeStyleConfigModule
              initialData={sizeStyleData}
              onDataChange={(data) => {
                setSizeStyleData(data);
                // config 변경 시 cameraLightingData의 config도 동기화
                setCameraLightingData(prev => ({
                  ...prev,
                  config: data.config
                }));
              }}
              onPrev={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {/* 3단계: 카메라/조명 설정 */}
          {step === 3 && (
            <CameraLightingModule
              initialData={{
                ...cameraLightingData,
                config: sizeStyleData.config // 최신 config 동기화
              }}
              onDataChange={(data) => {
                setCameraLightingData(data);
                // config 변경 시 sizeStyleData의 config도 동기화
                setSizeStyleData(prev => ({
                  ...prev,
                  config: data.config
                }));
              }}
              attachedImages={basicData.attachedImages}
              imageRoles={basicData.imageRoles}
              isGenerating={isGenerating}
              selectedOutputSize={sizeStyleData.selectedOutputSize}
              onPrev={() => setStep(2)}
              onNext={() => {
                // 최적화 단계로 이동 (4단계)
                setStep(4);
              }}
            />
          )}


          {/* 4단계: 프롬프트 최적화 및 확인 */}
          {step === 4 && (
            <PromptOptimizationStep
              prompt={prompt}
              imageRoles={imageRoles}
              selectedOutputSize={selectedOutputSize}
              selectedEditingStyle={selectedEditingStyle}
                  detailedSettings={detailedSettings}
              isDetailedMode={isDetailedMode}
                  config={config}
              optimizationResult={optimizationResult}
              isTranslating={isTranslating}
              isOptimizing={isOptimizing}
              onOptimizationResultChange={setOptimizationResult}
              onTranslatingChange={setIsTranslating}
              onOptimizingChange={setIsOptimizing}
              onResetOptimization={resetOptimizationResult}
              onPrev={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {/* 5단계: 이미지 생성 */}
          {step === 5 && (
            <ImageGenerationStep
              prompt={prompt}
              generatedImage={generatedImage}
              optimizationResult={optimizationResult}
              isGenerating={isGenerating}
              showPromptDetails={showPromptDetails}
              onGenerate={handleGenerate}
              onShowPromptDetailsChange={setShowPromptDetails}
              onSave={handleSaveImage}
              onReset={resetModalState}
              onPrev={() => setStep(4)}
            />
          )}

        </div>
      </div>

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
