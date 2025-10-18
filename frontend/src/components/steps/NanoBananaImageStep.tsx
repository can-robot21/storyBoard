import React, { useState, useMemo } from 'react';
import Button from '../common/Button';
import { NanoBananaService } from '../../services/ai/NanoBananaService';
import { ImageAnalysisModal } from '../common/ImageAnalysisModal';
import { ImageGenerationForm, ImageGenerationConfig } from '../common/ImageGenerationForm';
import { AdvancedImageGenerationModal } from '../common/AdvancedImageGenerationModal';
import { APIKeySetupModal } from '../common/APIKeySetupModal';

interface GeneratedItem {
  id: number;
  description: string;
  image: string;
  attachedImages: File[];
  timestamp: string;
}

interface NanoBananaImageStepProps {
  generatedCharacters: GeneratedItem[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedBackgrounds: GeneratedItem[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedSettingCuts: GeneratedItem[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  // 고급 이미지 생성 props
  generatedAdvancedImages: GeneratedItem[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
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
  // 상단 기본 설정
  globalImageSettings?: {
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: '16:9' | '9:16' | '2:3' | '1:1' | 'free';
  };
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
  currentUser,
  globalImageSettings
}) => {
  // 기본 이미지 생성 상태
  const [characterInput, setCharacterInput] = useState('');
  const [backgroundInput, setBackgroundInput] = useState('');
  const [settingCut, setSettingCut] = useState('');
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);
  
  // 공통 이미지 생성 설정
  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({
    style: 'realistic',
    quality: 'high',
    aspectRatio: '1:1',
    customSize: '',
    additionalPrompt: ''
  });

  // 고급 이미지 생성 모달 상태
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  
  // 이미지 분석 모달 상태
  const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);
  
  // API 키 설정 모달 상태
  const [showAPIKeySetupModal, setShowAPIKeySetupModal] = useState(false);

  // 생성 중 상태
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingSettingCut, setIsGeneratingSettingCut] = useState(false);

  // API 키 확인 (사용자별 또는 환경 변수)
  const getAPIKey = () => {
    try {
      if (currentUser?.apiKeys?.google) return currentUser.apiKeys.google;
      if (typeof window !== 'undefined') {
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google) return localKeys.google as string;
        }
      }
    } catch {}
    return process.env.REACT_APP_GEMINI_API_KEY || '';
  };

  const hasAPIKey = getAPIKey().trim() !== '';

  // 나노 바나나 서비스 직접 인스턴스화
  const nanoBananaService = useMemo(() => {
    try {
      const apiKey = getAPIKey().trim();
      if (!apiKey || apiKey.length < 20 || !apiKey.startsWith('AIza')) {
        return null;
      }
      return new NanoBananaService({ apiKey });
    } catch (error) {
      console.error('⚠ 나노 바나나 서비스 초기화 실패:', error);
      return null;
    }
  }, [getAPIKey]);

  // 설정 우선순위 적용 함수 (본문 설정 우선)
  const applySettingsPriority = () => {
    // 본문 설정이 있으면 우선 적용, 없으면 상단 기본 설정 사용
    const finalAspectRatio = imageConfig.aspectRatio || globalImageSettings?.aspectRatio || '16:9';
    const finalQuality = imageConfig.quality || globalImageSettings?.quality || 'high';
    const finalStyle = imageConfig.style || 'realistic';

    // 설정 우선순위 안내 메시지
    if (imageConfig.aspectRatio && globalImageSettings?.aspectRatio && imageConfig.aspectRatio !== globalImageSettings.aspectRatio) {
      console.log('📋 설정 우선순위: 본문 설정이 상단 기본 설정보다 우선 적용됩니다.');
      console.log(`   본문 비율: ${imageConfig.aspectRatio}, 상단 기본 비율: ${globalImageSettings.aspectRatio}`);
    }
    if (imageConfig.quality && globalImageSettings?.quality && imageConfig.quality !== globalImageSettings.quality) {
      console.log('📋 설정 우선순위: 본문 설정이 상단 기본 설정보다 우선 적용됩니다.');
      console.log(`   본문 품질: ${imageConfig.quality}, 상단 기본 품질: ${globalImageSettings.quality}`);
    }

    return {
      aspectRatio: finalAspectRatio,
      quality: finalQuality,
      style: finalStyle
    };
  };

  // 공통 이미지 생성 함수
  const generateImage = async (
    prompt: string,
    attachedImages: File[],
    setIsGenerating: (loading: boolean) => void,
    setResult: (result: any) => void,
    clearInput: () => void
  ) => {
    try {
      setIsGenerating(true);
      
      if (!nanoBananaService) {
        console.error('❌ 나노 바나나 서비스를 사용할 수 없습니다.');
        return;
      }
      
      // 설정 우선순위 적용
      const settings = applySettingsPriority();
      console.log('⚙️ 적용된 설정:', settings);
      
      // 프롬프트 구성
      let finalPrompt = prompt;
      if (imageConfig.additionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${imageConfig.additionalPrompt}`;
      }
      if (imageConfig.customSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${imageConfig.customSize}`;
      }
      
      // 스타일과 품질 추가 (우선순위 적용된 설정 사용)
      finalPrompt = `${finalPrompt}\n\n스타일: ${settings.style}, 품질: ${settings.quality}, 비율: ${settings.aspectRatio}`;
      
      console.log('🔥 최종 프롬프트:', finalPrompt);

      let result;
      
      // 첨부된 이미지가 있는 경우 멀티 이미지 생성 사용
      if (attachedImages.length > 0) {
        console.log('📷 첨부된 이미지와 함께 생성:', attachedImages.length, '개');
        
        if (attachedImages.length > 1) {
          // 멀티 이미지 생성
          result = await nanoBananaService.generateImageWithMultipleReferences(
            finalPrompt,
            attachedImages,
            imageConfig.customSize
          );
        } else {
          // 단일 이미지 생성
          result = await nanoBananaService.generateImageWithReference(
            finalPrompt,
            attachedImages[0],
            imageConfig.customSize
          );
        }
        
        // 결과를 표준 형식으로 변환
        if (result) {
          result = { images: [result] };
        }
      } else {
        // 텍스트만으로 생성
        result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image',
          aspectRatio: settings.aspectRatio as any,
          quality: settings.quality as any,
          style: settings.style as any
        });
      }

      if (result) {
        // result가 string인 경우 (멀티 이미지 함수에서 반환)
        if (typeof result === 'string') {
          const newItem = {
            id: Date.now(),
            description: prompt,
            image: result,
            attachedImages: attachedImages,
            timestamp: new Date().toISOString(),
          };
          
          console.log('💾 이미지 생성 완료:', newItem);
          setResult(newItem);
          clearInput();
        }
        // result가 객체인 경우 (기존 generateImage 함수에서 반환)
        else if (result.images && result.images.length > 0) {
          const newItem = {
            id: Date.now(),
            description: prompt,
            image: result.images[0],
            attachedImages: attachedImages,
            timestamp: new Date().toISOString(),
          };
          
          console.log('💾 이미지 생성 완료:', newItem);
          setResult(newItem);
          clearInput();
        }
      }
    } catch (error) {
      console.error('❌ 이미지 생성 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 캐릭터 생성
  const handleGenerateCharacter = () => {
    generateImage(
      characterInput,
      attachedCharacterImages,
      setIsGeneratingCharacter,
      (newCharacter) => setGeneratedCharacters(prev => [...prev, newCharacter]),
      () => {
        setCharacterInput("");
        setAttachedCharacterImages([]);
      }
    );
  };

  // 배경 생성
  const handleGenerateBackground = () => {
    generateImage(
      backgroundInput,
      attachedBackgroundImages,
      setIsGeneratingBackground,
      (newBackground) => setGeneratedBackgrounds(prev => [...prev, newBackground]),
      () => {
        setBackgroundInput("");
        setAttachedBackgroundImages([]);
      }
    );
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = () => {
    generateImage(
      settingCut,
      attachedSettingImages,
      setIsGeneratingSettingCut,
      (newSettingCut) => setGeneratedSettingCuts(prev => [...prev, newSettingCut]),
      () => {
        setSettingCut("");
        setAttachedSettingImages([]);
      }
    );
  };

  // 고급 이미지 생성 완료 핸들러
  const handleAdvancedImageComplete = (result: { description: string; image: string; attachedImages: File[] }) => {
    const newImage = {
      id: Date.now(),
      description: result.description,
      image: result.image,
      attachedImages: result.attachedImages,
      timestamp: new Date().toISOString(),
    };
    
    console.log('💾 고급 이미지 최종 저장:', newImage);
    setGeneratedAdvancedImages(prev => [...prev, newImage]);
  };

  return (
    <div className="space-y-6">
      {/* 프로젝트 개요 연계 정보 표시 */}
      {story && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 프로젝트 개요 연계</h4>
          <div className="text-sm text-blue-700">
            <div><strong>스토리:</strong> {story}</div>
            {characterList.length > 0 && (
              <div><strong>캐릭터:</strong> {characterList.map(c => c.name).join(', ')}</div>
            )}
            {finalScenario && (
              <div><strong>시나리오:</strong> {finalScenario.substring(0, 100)}...</div>
            )}
          </div>
        </div>
      )}

      {/* TXT2IMG 연계 정보 표시 */}
      {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">🎨 TXT2IMG 연계</h4>
          <div className="text-sm text-green-700">
            {generatedCharacters.length > 0 && (
              <div><strong>캐릭터 이미지:</strong> {generatedCharacters.length}개 생성됨</div>
            )}
            {generatedBackgrounds.length > 0 && (
              <div><strong>배경 이미지:</strong> {generatedBackgrounds.length}개 생성됨</div>
            )}
            {generatedSettingCuts.length > 0 && (
              <div><strong>설정컷 이미지:</strong> {generatedSettingCuts.length}개 생성됨</div>
            )}
          </div>
        </div>
      )}

      {/* 나노 바나나 전용 헤더 */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-4">
        <h3 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
          <span className="text-xl">🍌</span>
          나노 바나나 이미지 생성
        </h3>
        <p className="text-sm text-yellow-700">
          Google Gemini 2.5 Flash Image Preview를 사용한 고급 이미지 생성
        </p>
        <div className="mt-3">
          <Button 
            onClick={() => hasAPIKey ? setShowAdvancedModal(true) : setShowAPIKeySetupModal(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            🎨 고급 이미지 생성
          </Button>
        </div>
      </div>

      {/* API 키 상태 안내 */}
      {!hasAPIKey && (
        <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔑</div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-2">API 키 설정 필요</h3>
              <p className="text-red-700 text-sm mb-3">
                IMG2IMG 기능을 사용하려면 Google AI API 키가 필요합니다. 
                아래 버튼을 클릭하여 API 키를 설정해주세요.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAPIKeySetupModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md"
                >
                  🔑 API 키 설정하기
                </Button>
                <Button
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                  variant="outline"
                  className="text-sm px-4 py-2 rounded-md"
                >
                  🌐 Google AI Studio 방문
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 분석 섹션 */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-purple-800">🔍 이미지 분석 [분석툴]</h4>
          <Button
            onClick={() => hasAPIKey ? setShowImageAnalysisModal(true) : setShowAPIKeySetupModal(true)}
            variant="outline"
            className="text-sm"
          >
            분석 도구 열기
          </Button>
        </div>
        <p className="text-sm text-purple-600">
          AI를 사용하여 이미지를 분석하고 텍스트로 변환합니다. 분석 결과를 복사하여 프롬프트에 활용할 수 있습니다.
        </p>
      </div>

      {/* 캐릭터 생성 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-800">캐릭터 생성</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              필수항목
            </span>
            {!hasAPIKey && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                API 키 필요
              </span>
            )}
          </div>
          <Button 
            onClick={handleGenerateCharacter}
            disabled={!hasAPIKey || (!characterInput.trim() && attachedCharacterImages.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            이미지 생성
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-sm">⚠️</span>
            <div className="text-sm text-yellow-700">
              <strong>필수 입력:</strong> 캐릭터 설명을 입력하거나 참조 이미지를 첨부해주세요.
            </div>
          </div>
        </div>
        
        {/* 설정 우선순위 안내 메시지 */}
        {globalImageSettings && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-sm text-blue-700">
                <strong>설정 우선순위 안내:</strong> 본문의 이미지 생성 옵션이 상단 기본 설정보다 우선 적용됩니다.
                <br />
                <span className="text-xs text-blue-600">
                  상단 기본 설정: 비율 {globalImageSettings.aspectRatio}, 품질 {globalImageSettings.quality}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {hasAPIKey ? (
          <ImageGenerationForm
            title=""
            placeholder="캐릭터 설명을 입력하세요 (예: 20대 남성, 검은 머리, 캐주얼한 옷차림)"
            inputValue={characterInput}
            onInputChange={setCharacterInput}
            attachedImages={attachedCharacterImages}
            onImagesChange={setAttachedCharacterImages}
            config={imageConfig}
            onConfigChange={setImageConfig}
            onGenerate={handleGenerateCharacter}
            isGenerating={isGeneratingCharacter}
            maxImages={5}
            showDownloadButtons={true}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm text-center">
              API 키를 설정하면 캐릭터 생성 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 배경 생성 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-800">배경 생성</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              필수항목
            </span>
            {!hasAPIKey && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                API 키 필요
              </span>
            )}
          </div>
          <Button 
            onClick={handleGenerateBackground}
            disabled={!hasAPIKey || (!backgroundInput.trim() && attachedBackgroundImages.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            이미지 생성
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-sm">⚠️</span>
            <div className="text-sm text-yellow-700">
              <strong>필수 입력:</strong> 배경 설명을 입력하거나 참조 이미지를 첨부해주세요.
            </div>
          </div>
        </div>
        {hasAPIKey ? (
          <ImageGenerationForm
            title=""
            placeholder="배경 설명을 입력하세요 (예: 도시의 밤거리, 네온사인이 반짝이는 거리)"
            inputValue={backgroundInput}
            onInputChange={setBackgroundInput}
            attachedImages={attachedBackgroundImages}
            onImagesChange={setAttachedBackgroundImages}
            config={imageConfig}
            onConfigChange={setImageConfig}
            onGenerate={handleGenerateBackground}
            isGenerating={isGeneratingBackground}
            maxImages={5}
            showDownloadButtons={true}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm text-center">
              API 키를 설정하면 배경 생성 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 설정 컷 생성 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-800">설정 컷</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              필수항목
            </span>
            {!hasAPIKey && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                API 키 필요
              </span>
            )}
          </div>
          <Button 
            onClick={handleGenerateSettingCut}
            disabled={!hasAPIKey || (!settingCut.trim() && attachedSettingImages.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            이미지 생성
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-sm">⚠️</span>
            <div className="text-sm text-yellow-700">
              <strong>필수 입력:</strong> 설정 컷 설명을 입력하거나 참조 이미지를 첨부해주세요.
            </div>
          </div>
        </div>
        {hasAPIKey ? (
          <ImageGenerationForm
            title=""
            placeholder="설정 컷 설명을 입력하세요 (예: 카페 내부, 따뜻한 조명의 분위기)"
            inputValue={settingCut}
            onInputChange={setSettingCut}
            attachedImages={attachedSettingImages}
            onImagesChange={setAttachedSettingImages}
            config={imageConfig}
            onConfigChange={setImageConfig}
            onGenerate={handleGenerateSettingCut}
            isGenerating={isGeneratingSettingCut}
            maxImages={5}
            showDownloadButtons={false}
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-500 text-sm text-center">
              API 키를 설정하면 설정 컷 생성 기능을 사용할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium mb-2">나노 바나나 이미지 생성 완료</h3>
              <p className="text-sm text-gray-600">
                생성된 항목: 캐릭터 {generatedCharacters.length}개, 
                배경 {generatedBackgrounds.length}개, 
                설정컷 {generatedSettingCuts.length}개
              </p>
              <p className="text-xs text-gray-500 mt-1">
                생성된 이미지는 오른쪽 본문에서 확인할 수 있습니다.
              </p>
            </div>
            <Button 
              onClick={onNext}
              className="bg-green-600 hover:bg-green-700"
            >
              다음
            </Button>
          </div>
        </div>
      )}

      {/* 고급 이미지 생성 모달 */}
      <AdvancedImageGenerationModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onComplete={handleAdvancedImageComplete}
        nanoBananaService={nanoBananaService}
      />

      {/* 이미지 분석 모달 */}
      <ImageAnalysisModal
        isOpen={showImageAnalysisModal}
        onClose={() => setShowImageAnalysisModal(false)}
      />

      {/* API 키 설정 모달 */}
      {showAPIKeySetupModal && (
        <APIKeySetupModal
          onClose={() => setShowAPIKeySetupModal(false)}
        />
      )}
    </div>
  );
};

