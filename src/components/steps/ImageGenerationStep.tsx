import React, { useState } from 'react';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';
import { useImageHandlers } from '../../hooks/useImageHandlers';
import { AIProvider } from '../../types/ai';

interface GeneratedItem {
  id: number;
  description: string;
  image: string;
  attachedImages: File[];
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
  onNext
}) => {
  
  // 캐릭터 관련 상태
  const [characterInput, setCharacterInput] = useState('');
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  
  // 배경 관련 상태
  const [backgroundInput, setBackgroundInput] = useState('');
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  
  // 설정 컷 관련 상태
  const [settingCut, setSettingCut] = useState('');
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);

  // 이미지 생성 API 선택 상태
  const [imageGenerationAPI, setImageGenerationAPI] = useState<AIProvider>('google');
  
  // 나노 바나나 전용 옵션
  const [customSize, setCustomSize] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

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
    customSize,
    additionalPrompt
  );

  // 캐릭터 생성
  const handleGenerateCharacter = async () => {
    await imageHandlers.handleGenerateCharacter(characterInput, attachedCharacterImages);
    setCharacterInput("");
    setAttachedCharacterImages([]);
  };

  // 배경 생성
  const handleGenerateBackground = async () => {
    await imageHandlers.handleGenerateBackground(backgroundInput, attachedBackgroundImages);
    setBackgroundInput("");
    setAttachedBackgroundImages([]);
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = async () => {
    await imageHandlers.handleGenerateSettingCut(settingCut, attachedSettingImages);
    setSettingCut("");
    setAttachedSettingImages([]);
  };

  // 재생성 및 삭제 함수들은 오른쪽 본문의 카드에서 처리됨

  return (
    <div className="space-y-6">
      {/* 이미지 생성 API 선택 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-800 mb-3">이미지 생성 API</h3>
        <div className="space-y-3">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="imageAPI"
                value="google"
                checked={imageGenerationAPI === 'google'}
                onChange={(e) => setImageGenerationAPI(e.target.value as AIProvider)}
                className="mr-2"
              />
              <span className="text-sm">Google AI (Imagen)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="imageAPI"
                value="nano-banana"
                checked={imageGenerationAPI === 'nano-banana'}
                onChange={(e) => setImageGenerationAPI(e.target.value as AIProvider)}
                className="mr-2"
              />
              <span className="text-sm">나노 바나나 (Gemini 2.5 Flash Image)</span>
            </label>
          </div>
          
          {/* 나노 바나나 전용 옵션 */}
          {imageGenerationAPI === 'nano-banana' && (
            <div className="space-y-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <h4 className="font-medium text-yellow-800 text-sm">나노 바나나 전용 옵션</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">기타 사이즈 요청사항</label>
                  <input
                    type="text"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="예: 1920x1080, 4K, 세로형 등"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">추가 프롬프트</label>
                  <textarea
                    value={additionalPrompt}
                    onChange={(e) => setAdditionalPrompt(e.target.value)}
                    placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
                    rows={2}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
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
        
        <ImageUpload
          onImagesChange={setAttachedCharacterImages}
          attachedImages={attachedCharacterImages}
          maxImages={5}
          className="mt-3"
        />
        
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
        
        <ImageUpload
          onImagesChange={setAttachedBackgroundImages}
          attachedImages={attachedBackgroundImages}
          maxImages={5}
          className="mt-3"
        />
        
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
        
        <ImageUpload
          onImagesChange={setAttachedSettingImages}
          attachedImages={attachedSettingImages}
          maxImages={5}
          className="mt-3"
        />
        
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

    </div>
  );
};
