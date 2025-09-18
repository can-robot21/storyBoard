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
    aspectRatio
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
      {/* 이미지 생성 설정 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-800 mb-3">이미지 생성 설정</h3>
        <div className="space-y-4">
          {/* API 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">생성 API</label>
            <div className="flex items-center p-3 bg-blue-50 rounded-md border border-blue-200">
              <span className="text-sm font-medium text-blue-800">Google AI (Imagen)</span>
            </div>
          </div>
          
          {/* 비율 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이미지 비율</label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="16:9"
                  checked={aspectRatio === '16:9'}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">16:9 (가로)</div>
                  <div className="text-xs text-gray-500">일반적인 영상 비율</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="9:16"
                  checked={aspectRatio === '9:16'}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">9:16 (세로)</div>
                  <div className="text-xs text-gray-500">모바일/소셜미디어용</div>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="aspectRatio"
                  value="1:1"
                  checked={aspectRatio === '1:1'}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">1:1 (정사각형)</div>
                  <div className="text-xs text-gray-500">SNS용 정사각형</div>
                </div>
              </label>
            </div>
          </div>
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
