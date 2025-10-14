import React, { useState } from 'react';
import Button from '../common/Button';
import { useImageHandlers } from '../../hooks/useImageHandlers';
import { AIProvider } from '../../types/ai';
import { ImageAnalysisModal } from '../common/ImageAnalysisModal';
import { ImageFeedbackModal } from '../common/ImageFeedbackModal';
import ImageUpload from '../common/ImageUpload';
import { useUIStore } from '../../stores/uiStore';

interface GeneratedItem {
  id: number;
  description: string;
  image: string;
  timestamp: string;
}

interface ImageGenerationStepProps {
  generatedCharacters: GeneratedItem[];
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedBackgrounds: GeneratedItem[];
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
  generatedSettingCuts: GeneratedItem[];
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<GeneratedItem[]>>;
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
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  
  // 배경 관련 상태
  const [backgroundInput, setBackgroundInput] = useState('');
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  
  // 설정 컷 관련 상태
  const [settingCut, setSettingCut] = useState('');
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);

  // 이미지 생성 API 선택 상태 (Google AI만 사용)
  const [imageGenerationAPI] = useState<AIProvider>('google');
  
  // 이미지 비율 선택 상태
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');

  // 이미지 생성 옵션 설정 상태
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageQuality, setImageQuality] = useState('high');
  const [numberOfImages, setNumberOfImages] = useState(1);

  // 이미지 분석 모달 상태
  const [showImageAnalysisModal, setShowImageAnalysisModal] = useState(false);

  // 이미지 피드백 모달 상태
  const [showImageFeedbackModal, setShowImageFeedbackModal] = useState(false);
  const [feedbackImageData, setFeedbackImageData] = useState<{
    imageUrl: string;
    prompt: string;
    type: 'character' | 'background' | 'settingCut';
  } | null>(null);

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
    'current-project' // currentProjectId
  );

  // 캐릭터 생성
  const handleGenerateCharacter = async () => {
    if (!characterInput.trim() && attachedCharacterImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }

    try {
      const results = await imageHandlers.handleGenerateCharacter(characterInput, attachedCharacterImages);
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
        setAttachedCharacterImages([]);
      }
    } catch (error) {
      console.error('캐릭터 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성에 실패했습니다.',
      });
    }
  };

  // 배경 생성
  const handleGenerateBackground = async () => {
    if (!backgroundInput.trim() && attachedBackgroundImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }

    try {
      const results = await imageHandlers.handleGenerateBackground(backgroundInput, attachedBackgroundImages);
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
        setAttachedBackgroundImages([]);
      }
    } catch (error) {
      console.error('배경 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 이미지 생성에 실패했습니다.',
      });
    }
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = async () => {
    if (!settingCut.trim() && attachedSettingImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '설정 컷 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }

    try {
      const results = await imageHandlers.handleGenerateSettingCut(settingCut, attachedSettingImages);
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
        setAttachedSettingImages([]);
      }
    } catch (error) {
      console.error('설정 컷 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '설정 컷 이미지 생성에 실패했습니다.',
      });
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
    
    const newItem = {
      id: Date.now(),
      description: feedbackImageData.prompt,
      image: feedbackImageData.imageUrl,
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
        setGeneratedCharacters(prev => [...prev, newItem]);
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
        setGeneratedBackgrounds(prev => [...prev, newItem]);
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
        setGeneratedSettingCuts(prev => [...prev, newItem]);
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
    console.log('이미지가 거부되었습니다.');
  };

  // 재생성 및 삭제 함수들은 오른쪽 본문의 카드에서 처리됨

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

      {/* 공통 입력 항목 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">📋 공통 입력 항목</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {commonInputsCompleted ? 
                '✅ 기본 정보 입력 완료' : 
                story && characterList.length > 0 ? 
                  '✅ 입력 준비 완료' : 
                  '⏳ 스토리와 캐릭터 정보를 입력해주세요'
              }
            </div>
            {!commonInputsCompleted ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCommonInputs(prev => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showCommonInputs ? '입력 숨기기' : '입력 보기-수정'}
                </button>
                {showCommonInputs && (
                  <button
                    onClick={handleCommonInputsComplete}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    입력 완료
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCommonInputs(prev => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showCommonInputs ? '감추기' : '보이기'}
                </button>
                <button
                  onClick={() => {
                    setShowCommonInputs(true);
                    handleCommonInputsReset();
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  수정-초기화
                </button>
              </div>
            )}
          </div>
        </div>
        
        {showCommonInputs && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">📝 기본 정보</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스토리 제목 <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {story || '스토리 제목이 없습니다'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  캐릭터 정보 <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {characterList.length > 0 ? 
                    characterList.map(c => `${c.name}: ${c.description}`).join(', ') : 
                    '캐릭터 정보가 없습니다'
                  }
                </div>
              </div>
              
              {storySummary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    스토리 요약
                  </label>
                  <div className="text-sm text-gray-600 bg-white p-2 rounded border">{storySummary}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 공통 입력 완료 상태 요약 */}
        {commonInputsCompleted && !showCommonInputs && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-3">✅ 입력 완료된 기본 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-1">스토리 제목</div>
                <div className="text-gray-600 bg-white p-2 rounded border">{story}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">캐릭터 정보</div>
                <div className="text-gray-600 bg-white p-2 rounded border">
                  {characterList.length > 0 ? 
                    characterList.map(c => `${c.name}: ${c.description}`).join(', ') : 
                    '캐릭터 정보 없음'
                  }
                </div>
              </div>
              {storySummary && (
                <div className="md:col-span-2">
                  <div className="font-medium text-gray-700 mb-1">스토리 요약</div>
                  <div className="text-gray-600 bg-white p-2 rounded border">{storySummary}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 생성 옵션 설정 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🎨 이미지 생성 옵션</h3>
        </div>
        
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

      {/* 캐릭터 생성 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">캐릭터 생성</h3>
        <textarea
          value={characterInput}
          onChange={(e) => setCharacterInput(e.target.value)}
          placeholder="캐릭터 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">참조 이미지 첨부 (선택사항)</label>
          <ImageUpload
            attachedImages={attachedCharacterImages}
            onImagesChange={setAttachedCharacterImages}
            accept="image/*"
            maxImages={5}
            className="w-full"
          />
          {attachedCharacterImages.length > 0 && (
            <div className="text-xs text-gray-500">
              {attachedCharacterImages.length}개 이미지 첨부됨
            </div>
          )}
        </div>
        
        <Button className="w-full" onClick={handleGenerateCharacter}>
          캐릭터 생성
        </Button>
      </div>
      
      {/* 배경 설정 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">배경 설정</h3>
        <textarea
          value={backgroundInput}
          onChange={(e) => setBackgroundInput(e.target.value)}
          placeholder="배경 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">참조 이미지 첨부 (선택사항)</label>
          <ImageUpload
            attachedImages={attachedBackgroundImages}
            onImagesChange={setAttachedBackgroundImages}
            accept="image/*"
            maxImages={5}
            className="w-full"
          />
          {attachedBackgroundImages.length > 0 && (
            <div className="text-xs text-gray-500">
              {attachedBackgroundImages.length}개 이미지 첨부됨
            </div>
          )}
        </div>
        
        <Button className="w-full" onClick={handleGenerateBackground}>
          배경 생성
        </Button>
      </div>
      
      {/* 설정 컷 */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">설정 컷</h3>
        <textarea
          value={settingCut}
          onChange={(e) => setSettingCut(e.target.value)}
          placeholder="설정 컷 설명을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">참조 이미지 첨부 (선택사항)</label>
          <ImageUpload
            attachedImages={attachedSettingImages}
            onImagesChange={setAttachedSettingImages}
            accept="image/*"
            maxImages={5}
            className="w-full"
          />
          {attachedSettingImages.length > 0 && (
            <div className="text-xs text-gray-500">
              {attachedSettingImages.length}개 이미지 첨부됨
            </div>
          )}
        </div>
        
        <Button className="w-full" onClick={handleGenerateSettingCut}>
          설정 컷 생성
        </Button>
      </div>

      {/* 생성 결과는 오른쪽 본문에 표시되므로 왼쪽에서는 제거 */}

      {/* 다음 버튼 */}
      {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium mb-2">이미지 생성 완료</h3>
              <p className="text-sm text-gray-600">
                생성된 항목: 캐릭터 {generatedCharacters.length}개, 
                배경 {generatedBackgrounds.length}개, 
                설정컷 {generatedSettingCuts.length}개
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

    </div>
  );
};
