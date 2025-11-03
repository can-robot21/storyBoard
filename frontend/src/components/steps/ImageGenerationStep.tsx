import React, { useState } from 'react';
import Button from '../common/Button';
import { useImageHandlers } from '../../hooks/useImageHandlers';
import { AIProvider } from '../../types/ai';
import { ImageAnalysisModal } from '../common/ImageAnalysisModal';
import { ImageFeedbackModal } from '../common/ImageFeedbackModal';
// 이미지 업로드는 txt2img에서 사용하지 않음
import { useUIStore } from '../../stores/uiStore';
import { ImageGenerationTabs } from './ImageGenerationTabs';
import { ErrorMessageModal } from '../common/ErrorMessageModal';
import { getFormattedErrorMessage } from '../../utils/contentPolicyValidator';

// 프로젝트 타입 사용
import type { GeneratedCharacter, GeneratedBackground, GeneratedSettingCut, Character } from '../../types/project';
import type { GeneratedProjectData } from '../../types/projectOverview';

// 이미지 생성 옵션 인터페이스
interface ImageGenerationOptions {
  style?: string;
  quality?: string;
  aspectRatio?: string;
  numberOfImages?: number;
  imageSize?: string;
  personGeneration?: string;
  cameraProximity?: string;
  cameraPosition?: string;
  lensType?: string;
  filmType?: string;
  customSize?: string;
  additionalPrompt?: string;
}

interface ImageGenerationStepProps {
  generatedCharacters: GeneratedCharacter[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<GeneratedCharacter[]>>;
  generatedBackgrounds: GeneratedBackground[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<GeneratedBackground[]>>;
  generatedSettingCuts: GeneratedSettingCut[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<GeneratedSettingCut[]>>;
  generatedProjectData: GeneratedProjectData | null;
  showTextResults: boolean;
  setShowTextResults: (show: boolean) => void;
  // 프로젝트 개요 데이터
  story: string;
  characterList: Character[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  onNext: () => void;
  canProceedToNext?: () => boolean;
}

export const ImageGenerationStep: React.FC<ImageGenerationStepProps> = ({
  generatedCharacters,
  setGeneratedCharacters,
  generatedBackgrounds,
  setGeneratedBackgrounds,
  generatedSettingCuts,
  setGeneratedSettingCuts,
  generatedProjectData,
  showTextResults,
  setShowTextResults,
  story,
  characterList,
  scenarioPrompt,
  storySummary,
  finalScenario,
  onNext,
  canProceedToNext
}) => {
  const { addNotification } = useUIStore();
  
  // 공통 입력 항목 표시 상태
  const [showCommonInputs, setShowCommonInputs] = useState(false);
  const [commonInputsCompleted, setCommonInputsCompleted] = useState(false);
  
  // 캐릭터 관련 상태
  const [characterInput, setCharacterInput] = useState('');
  
  // 배경 관련 상태
  const [backgroundInput, setBackgroundInput] = useState('');
  
  // 설정 컷 관련 상태
  const [settingCut, setSettingCut] = useState('');

  // 탭/옵션 상태 (img2img 스타일과 유사하게 유지)
  const [showCharacterIndividualOptions, setShowCharacterIndividualOptions] = useState(false);
  const [showBackgroundIndividualOptions, setShowBackgroundIndividualOptions] = useState(false);
  const [showSettingIndividualOptions, setShowSettingIndividualOptions] = useState(false);
  // 이미지 생성 옵션 - 최상단 블록과 동기화되는 기본 상태들을 먼저 선언
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageQuality, setImageQuality] = useState('high');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  // 탭 개별 옵션 기본값 (중복 항목은 undefined로 설정하여 공통 옵션 사용)
  const [characterOptions, setCharacterOptions] = useState<ImageGenerationOptions>({ 
    // style, quality, aspectRatio, numberOfImages는 undefined로 설정하여 공통 옵션 사용
    // personGeneration은 개별 옵션에만 있으므로 기본값 설정
    personGeneration: 'allow_adult' // 기본값
  });
  const [backgroundOptions, setBackgroundOptions] = useState<ImageGenerationOptions>({ 
    personGeneration: 'allow_adult' // 기본값
  });
  const [settingOptions, setSettingOptions] = useState<ImageGenerationOptions>({ 
    personGeneration: 'allow_adult' // 기본값
  });

  // 이미지 생성 API 선택 상태 (Google AI만 사용)
  const [imageGenerationAPI] = useState<AIProvider>('google');
  
  // 표시 토글 상태
  const [showImageOptions, setShowImageOptions] = useState<boolean>(true);
  const [showCommonView, setShowCommonView] = useState<boolean>(false);

  // 이미지 생성 옵션 설정 상태
  // const [imageStyle, setImageStyle] = useState('realistic'); // Moved up
  // const [imageQuality, setImageQuality] = useState('high'); // Moved up
  // const [numberOfImages, setNumberOfImages] = useState(1); // Moved up

  // 이미지 분석 모달 상태
  const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);

  // 이미지 피드백 모달 상태
  const [showImageFeedbackModal, setShowImageFeedbackModal] = useState(false);
  const [feedbackImageData, setFeedbackImageData] = useState<{
    imageUrl: string;
    prompt: string;
    type: 'character' | 'background' | 'settingCut';
  } | null>(null);

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

  // 이미지 생성 중 로딩 상태
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isGeneratingSettingCut, setIsGeneratingSettingCut] = useState(false);

  // useImageHandlers 훅 사용
  const imageHandlers = useImageHandlers(
    generatedCharacters,
    setGeneratedCharacters,
    generatedBackgrounds,
    setGeneratedBackgrounds,
    generatedSettingCuts,
    setGeneratedSettingCuts,
    generatedProjectData,
    imageGenerationAPI,
    aspectRatio,
    {
      imageStyle,
      imageQuality,
      numberOfImages
    },
    'current-project', // currentProjectId
    {
      characterOptions,
      backgroundOptions,
      settingOptions
    }
  );

  // 캐릭터 생성
  const handleGenerateCharacter = async () => {
    if (!characterInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력해주세요.',
      });
      return;
    }

    setIsGeneratingCharacter(true);
    try {
      const results = await imageHandlers.handleGenerateCharacter(characterInput, []);
      if (results && results.length > 0) {
        // 여러 이미지가 생성된 경우 피드백 모달을 표시하지 않고 바로 추가
        if (results.length > 1) {
          addNotification({
            type: 'success',
            title: '생성 완료',
            message: `${results.length}개의 캐릭터가 생성되어 바로 추가되었습니다.`,
          });
        } else {
          // 단일 이미지인 경우에만 피드백 모달 표시
          setFeedbackImageData({
            imageUrl: results[0].image,
            prompt: characterInput,
            type: 'character'
          });
          setShowImageFeedbackModal(true);
        }
      setCharacterInput('');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('캐릭터 생성 오류:', error);
    }
    const errorMessage = getFormattedErrorMessage(error, characterInput);
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '캐릭터 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingCharacter(false);
    }
  };

  // 배경 생성
  const handleGenerateBackground = async () => {
    if (!backgroundInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력해주세요.',
      });
      return;
    }

    setIsGeneratingBackground(true);
    try {
      const results = await imageHandlers.handleGenerateBackground(backgroundInput, []);
      if (results && results.length > 0) {
        // 여러 이미지가 생성된 경우 피드백 모달을 표시하지 않고 바로 추가
        if (results.length > 1) {
          addNotification({
            type: 'success',
            title: '생성 완료',
            message: `${results.length}개의 배경이 생성되어 바로 추가되었습니다.`,
          });
        } else {
          // 단일 이미지인 경우에만 피드백 모달 표시
          setFeedbackImageData({
            imageUrl: results[0].image,
            prompt: backgroundInput,
            type: 'background'
          });
          setShowImageFeedbackModal(true);
        }
        setBackgroundInput('');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('배경 생성 오류:', error);
      }
      const errorMessage = getFormattedErrorMessage(error, backgroundInput);
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '배경 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = async () => {
    if (!settingCut.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '설정 컷 설명을 입력해주세요.',
      });
      return;
    }

    setIsGeneratingSettingCut(true);
    try {
      const results = await imageHandlers.handleGenerateSettingCut(settingCut, []);
      if (results && results.length > 0) {
        // 여러 이미지가 생성된 경우 피드백 모달을 표시하지 않고 바로 추가
        if (results.length > 1) {
          addNotification({
            type: 'success',
            title: '생성 완료',
            message: `${results.length}개의 설정 컷이 생성되어 바로 추가되었습니다.`,
          });
        } else {
          // 단일 이미지인 경우에만 피드백 모달 표시
          setFeedbackImageData({
            imageUrl: results[0].image,
            prompt: settingCut,
            type: 'settingCut'
          });
          setShowImageFeedbackModal(true);
        }
        setSettingCut('');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('설정 컷 생성 오류:', error);
      }
      const errorMessage = getFormattedErrorMessage(error, settingCut);
      
      // 에러 모달 표시
      setErrorModal({
        isOpen: true,
        title: '설정 컷 생성 실패',
        message: errorMessage
      });
    } finally {
      setIsGeneratingSettingCut(false);
    }
  };


  // 공통 입력 완료 처리
  const handleCommonInputsComplete = () => {
    if (!story || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 입력해주세요.',
      });
      return;
    }

    setCommonInputsCompleted(true);
    setShowCommonInputs(false);
    
    addNotification({
      type: 'success',
      title: '공통 입력 완료',
      message: '기본 정보가 성공적으로 입력되었습니다.',
    });
  };

  // 공통 입력 초기화
  const handleCommonInputsReset = () => {
    setCommonInputsCompleted(false);
    
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '공통 입력 항목이 초기화되었습니다.',
    });
  };

  // 피드백 모달 핸들러들
  const handleUseImage = () => {
    if (!feedbackImageData) return;
    
    const baseItem = {
      id: Date.now(),
      description: feedbackImageData.prompt,
      image: feedbackImageData.imageUrl,
      attachedImages: [] as string[],
      timestamp: new Date().toISOString(),
    };

    switch (feedbackImageData.type) {
      case 'character':
        // 중복 확인
        const existingCharacter = generatedCharacters.find(char => 
          char.image === feedbackImageData.imageUrl || char.description === feedbackImageData.prompt
        );
        if (existingCharacter) {
          addNotification({
            type: 'warning',
            title: '중복 방지',
            message: '동일한 캐릭터 이미지가 이미 존재합니다.',
          });
          return;
        }
        const newCharacter: GeneratedCharacter = {
          ...baseItem,
          type: 'character'
        };
        setGeneratedCharacters(prev => [...prev, newCharacter]);
        break;
      case 'background':
        // 중복 확인
        const existingBackground = generatedBackgrounds.find(bg => 
          bg.image === feedbackImageData.imageUrl || bg.description === feedbackImageData.prompt
        );
        if (existingBackground) {
          addNotification({
            type: 'warning',
            title: '중복 방지',
            message: '동일한 배경 이미지가 이미 존재합니다.',
          });
          return;
        }
        const newBackground: GeneratedBackground = {
          ...baseItem,
          type: 'background'
        };
        setGeneratedBackgrounds(prev => [...prev, newBackground]);
        break;
      case 'settingCut':
        // 중복 확인
        const existingSettingCut = generatedSettingCuts.find(cut => 
          cut.image === feedbackImageData.imageUrl || cut.description === feedbackImageData.prompt
        );
        if (existingSettingCut) {
          addNotification({
            type: 'warning',
            title: '중복 방지',
            message: '동일한 설정 컷 이미지가 이미 존재합니다.',
          });
          return;
        }
        const newSettingCut: GeneratedSettingCut = {
          ...baseItem,
          type: 'setting'
        };
        setGeneratedSettingCuts(prev => [...prev, newSettingCut]);
        break;
    }
  };

  const handleRegenerateImage = () => {
    if (!feedbackImageData) return;
    
    switch (feedbackImageData.type) {
      case 'character':
        handleGenerateCharacter();
        break;
      case 'background':
        handleGenerateBackground();
        break;
      case 'settingCut':
        handleGenerateSettingCut();
        break;
    }
  };

  const handleRejectImage = () => {
    // 이미지를 거부하고 아무것도 하지 않음
    if (process.env.NODE_ENV === 'development') {
      console.log('이미지가 거부되었습니다.');
    }
  };

  // 재생성 및 삭제 함수들은 오른쪽 본문의 카드에서 처리됨

  return (
    <div className="space-y-6">
      {/* 이미지 생성 옵션 - 최상단으로 이동, 보기/감추기 토글 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🎨 이미지 생성 옵션</h3>
          <button
            onClick={() => setShowImageOptions(prev => !prev)}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
          >
            {showImageOptions ? '감추기' : '보이기'}
          </button>
        </div>
        {showImageOptions && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">생성 설정</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="realistic">Realistic</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="anime">Anime</option>
                    <option value="3d">3D</option>
                    <option value="watercolor">Watercolor</option>
                    <option value="oil_painting">Oil Painting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 품질</label>
                  <select
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="standard">Standard</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생성 이미지 개수</label>
                  <select
                    value={numberOfImages}
                    onChange={(e) => setNumberOfImages(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>1개</option>
                    <option value={2}>2개</option>
                    <option value={3}>3개</option>
                    <option value={4}>4개</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="16:9">16:9 (가로)</option>
                    <option value="9:16">9:16 (세로)</option>
                    <option value="1:1">1:1 (정사각형)</option>
                    <option value="4:3">4:3 (표준)</option>
                    <option value="3:4">3:4 (세로 표준)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* 공통 입력 항목 보기 전용 - 보이기/감추기(기본) */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">📋 공통 입력 항목</h3>
          <button
            onClick={() => setShowCommonView(prev => !prev)}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
          >
            {showCommonView ? '감추기(기본)' : '보이기(기본)'}
          </button>
        </div>
        {showCommonView && (
          <div className="space-y-2">
            <div className="text-sm"><b>스토리:</b> {story || '스토리 제목 없음'}</div>
            <div className="text-sm"><b>캐릭터:</b> {characterList?.length > 0 ? characterList.map(c => c.name).join(', ') : '없음'}</div>
            {storySummary && <div className="text-sm"><b>스토리 요약:</b> {storySummary}</div>}
          </div>
        )}
      </div>

      {/* 이미지 분석 도구 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">🔍 이미지 분석 도구</h3>
          <Button
            onClick={() => setShowImageAnalysisModal(true)}
            variant="outline"
            className="text-sm"
          >
            분석 도구 열기
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          AI를 사용하여 이미지를 분석하고 텍스트로 변환합니다. 분석 결과를 복사하여 프롬프트에 활용할 수 있습니다.
        </p>
      </div>

      {/* 탭 기반 생성 도구 (img2img 스타일 차용) */}
      <ImageGenerationTabs
        onGenerateCharacter={handleGenerateCharacter}
        onGenerateBackground={handleGenerateBackground}
        onGenerateSettingCut={handleGenerateSettingCut}
        characterInput={characterInput}
        setCharacterInput={setCharacterInput}
        backgroundInput={backgroundInput}
        setBackgroundInput={setBackgroundInput}
        settingCut={settingCut}
        setSettingCut={setSettingCut}
        imageStyle={imageStyle}
        imageQuality={imageQuality}
        numberOfImages={numberOfImages}
        aspectRatio={aspectRatio}
        showCharacterIndividualOptions={showCharacterIndividualOptions}
        setShowCharacterIndividualOptions={setShowCharacterIndividualOptions}
        showBackgroundIndividualOptions={showBackgroundIndividualOptions}
        setShowBackgroundIndividualOptions={setShowBackgroundIndividualOptions}
        showSettingIndividualOptions={showSettingIndividualOptions}
        setShowSettingIndividualOptions={setShowSettingIndividualOptions}
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
      />

      {/* 생성 결과는 탭 내부에서 렌더링되므로 여기서는 제거됨 */}

      {/* 이미지 분석 모달 */}
      <ImageAnalysisModal
        isOpen={showImageAnalysisModal}
        onClose={() => setShowImageAnalysisModal(false)}
      />

      {/* 이미지 피드백 모달 */}
      {feedbackImageData && (
        <ImageFeedbackModal
          isOpen={showImageFeedbackModal}
          onClose={() => setShowImageFeedbackModal(false)}
          imageUrl={feedbackImageData.imageUrl}
          prompt={feedbackImageData.prompt}
          onUseImage={handleUseImage}
          onRegenerate={handleRegenerateImage}
          onReject={handleRejectImage}
        />
      )}

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
