import React, { useState } from 'react';
import Button from '../common/Button';
import ImageUpload from '../common/ImageUpload';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

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
  const { addNotification } = useUIStore();
  
  // 캐릭터 관련 상태
  const [characterInput, setCharacterInput] = useState('');
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  
  // 배경 관련 상태
  const [backgroundInput, setBackgroundInput] = useState('');
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  
  // 설정 컷 관련 상태
  const [settingCut, setSettingCut] = useState('');
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);

  // 캐릭터 생성 (직접적인 이미지 생성)
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
      // 프로젝트 데이터에서 캐릭터 프롬프트가 있으면 사용, 없으면 사용자 입력 사용
      let imagePrompt = characterInput;
      if (generatedProjectData?.imagePrompts?.character) {
        imagePrompt = generatedProjectData.imagePrompts.character;
      } else if (generatedProjectData?.characterPrompt) {
        imagePrompt = generatedProjectData.characterPrompt;
      }
      
      // 첨부된 이미지가 있으면 멀티모달 처리
      let imageResult;
      if (attachedCharacterImages.length > 0) {
        // 첫 번째 첨부 이미지와 텍스트를 함께 사용
        imageResult = await googleAIService.generateWithImage(attachedCharacterImages[0], imagePrompt);
      } else {
        // 텍스트만으로 이미지 생성
        imageResult = await googleAIService.generateCharacterImage(imagePrompt);
      }
      
      const newCharacter = {
        id: Date.now(),
        description: characterInput,
        image: imageResult,
        attachedImages: attachedCharacterImages,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedCharacters([...generatedCharacters, newCharacter]);
      setCharacterInput("");
      setAttachedCharacterImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 이미지가 생성되었습니다.',
      });
    } catch (error) {
      console.error('캐릭터 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `캐릭터 이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 배경 생성 (직접적인 이미지 생성)
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
      // 프로젝트 데이터에서 배경 프롬프트가 있으면 사용, 없으면 사용자 입력 사용
      let imagePrompt = backgroundInput;
      if (generatedProjectData?.imagePrompts?.background) {
        imagePrompt = generatedProjectData.imagePrompts.background;
      } else if (generatedProjectData?.scenarioPrompt) {
        imagePrompt = generatedProjectData.scenarioPrompt;
      }
      
      // 첨부된 이미지가 있으면 멀티모달 처리
      let imageResult;
      if (attachedBackgroundImages.length > 0) {
        // 첫 번째 첨부 이미지와 텍스트를 함께 사용
        imageResult = await googleAIService.generateBackgroundWithImage(attachedBackgroundImages[0], imagePrompt);
      } else {
        // 텍스트만으로 이미지 생성
        imageResult = await googleAIService.generateBackgroundImage(imagePrompt);
      }
      
      const newBackground = {
        id: Date.now(),
        description: backgroundInput,
        image: imageResult,
        attachedImages: attachedBackgroundImages,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedBackgrounds([...generatedBackgrounds, newBackground]);
      setBackgroundInput("");
      setAttachedBackgroundImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '배경 이미지가 생성되었습니다.',
      });
    } catch (error) {
      console.error('배경 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `배경 이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 설정 컷 생성 (직접적인 이미지 생성)
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
      // 프로젝트 데이터에서 설정 컷 프롬프트가 있으면 사용, 없으면 사용자 입력 사용
      let imagePrompt = settingCut;
      if (generatedProjectData?.imagePrompts?.setting) {
        imagePrompt = generatedProjectData.imagePrompts.setting;
      } else if (generatedProjectData?.scenarioPrompt) {
        imagePrompt = generatedProjectData.scenarioPrompt;
      }
      
      // 첨부된 이미지가 있으면 멀티모달 처리
      let imageResult;
      if (attachedSettingImages.length > 0) {
        // 첫 번째 첨부 이미지와 텍스트를 함께 사용
        imageResult = await googleAIService.generateSettingCutWithImage(attachedSettingImages[0], imagePrompt);
      } else {
        // 텍스트만으로 이미지 생성
        imageResult = await googleAIService.generateSettingCutImage(imagePrompt);
      }
      
      const newSettingCut = {
        id: Date.now(),
        description: settingCut,
        image: imageResult,
        attachedImages: attachedSettingImages,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedSettingCuts([...generatedSettingCuts, newSettingCut]);
      setSettingCut("");
      setAttachedSettingImages([]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '설정 컷 이미지가 생성되었습니다.',
      });
    } catch (error) {
      console.error('설정 컷 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `설정 컷 이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // 재생성 및 삭제 함수들은 오른쪽 본문의 카드에서 처리됨

  return (
    <div className="space-y-6">
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
