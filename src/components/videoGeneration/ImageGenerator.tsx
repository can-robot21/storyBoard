import React, { useState, useRef } from 'react';
import Button from '../common/Button';
import { GeneratedImage } from '../../types/videoGeneration';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

interface ImageGeneratorProps {
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  story: string;
  characterList: any[];
  finalScenario: string;
  // 프로젝트 참조에서 가져올 이미지들
  projectReferenceCharacters?: any[];
  projectReferenceBackgrounds?: any[];
  projectReferenceSettingCuts?: any[];
  // 설정 컷 이미지 관련 (새로 추가)
  generatedSettingCutImages?: GeneratedImage[];
  setGeneratedSettingCutImages?: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectedSettingCutImages?: Set<number>;
  setSelectedSettingCutImages?: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  generatedCharacterImages,
  setGeneratedCharacterImages,
  generatedVideoBackgrounds,
  setGeneratedVideoBackgrounds,
  selectedCharacterImages,
  setSelectedCharacterImages,
  selectedVideoBackgrounds,
  setSelectedVideoBackgrounds,
  story,
  characterList,
  finalScenario,
  projectReferenceCharacters = [],
  projectReferenceBackgrounds = [],
  projectReferenceSettingCuts = [],
  generatedSettingCutImages = [],
  setGeneratedSettingCutImages,
  selectedSettingCutImages = new Set(),
  setSelectedSettingCutImages
}) => {
  const { addNotification } = useUIStore();
  
  // 상태 관리
  const [isGeneratingCharacterImage, setIsGeneratingCharacterImage] = useState(false);
  const [isGeneratingBackgroundImage, setIsGeneratingBackgroundImage] = useState(false);
  const [isGeneratingSettingCutImage, setIsGeneratingSettingCutImage] = useState(false);
  
  // 프로젝트 참조 모달 상태
  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);
  const [referenceModalType, setReferenceModalType] = useState<'character' | 'background' | 'settingCut' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  // 프로젝트 참조에서 이미지 선택 핸들러
  const handleSelectFromProjectReference = (type: 'character' | 'background' | 'settingCut') => {
    setReferenceModalType(type);
    setShowProjectReferenceModal(true);
  };

  const handleProjectReferenceImageSelect = (image: any, type: 'character' | 'background' | 'settingCut') => {
    const newImage: GeneratedImage = {
      id: Date.now(),
      input: image.description || image.prompt || '프로젝트 참조에서 선택된 이미지',
      description: image.description || image.prompt || '프로젝트 참조에서 선택된 이미지',
      image: image.image,
      timestamp: new Date().toISOString(),
      source: 'project_reference'
    };

    if (type === 'character') {
      setGeneratedCharacterImages(prev => [...prev, newImage]);
      addNotification({
        type: 'success',
        title: '캐릭터 이미지 추가',
        message: '프로젝트 참조에서 캐릭터 이미지를 선택했습니다.',
      });
    } else if (type === 'background') {
      setGeneratedVideoBackgrounds(prev => [...prev, newImage]);
      addNotification({
        type: 'success',
        title: '배경 이미지 추가',
        message: '프로젝트 참조에서 배경 이미지를 선택했습니다.',
      });
    } else if (type === 'settingCut') {
      // 설정 컷 이미지도 추가
      if (setGeneratedSettingCutImages) {
        setGeneratedSettingCutImages(prev => [...prev, newImage]);
        addNotification({
          type: 'success',
          title: '설정 컷 이미지 추가',
          message: '프로젝트 참조에서 설정 컷 이미지를 선택했습니다.',
        });
      }
    }

    setShowProjectReferenceModal(false);
    setReferenceModalType(null);
  };

  // 캐릭터 이미지 생성
  const handleGenerateCharacterImage = async () => {
    if (!story || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGeneratingCharacterImage(true);
    try {
      const prompt = `다음 정보를 바탕으로 캐릭터 이미지를 생성해주세요:

스토리: ${story}
캐릭터 정보: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

요구사항:
1. 캐릭터의 외모와 성격을 정확히 반영
2. 스토리의 분위기에 맞는 스타일
3. 영상 제작에 적합한 고품질 이미지
4. 다양한 각도와 표정 포함`;

      const result = await googleAIService.generateCharacterImage(prompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: prompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: `캐릭터 이미지 - ${characterList.map(c => c.name).join(', ')}`,
          source: 'generated'
        };

        setGeneratedCharacterImages(prev => [...prev, newImage]);
        
        addNotification({
          type: 'success',
          title: '캐릭터 이미지 생성 완료',
          message: '캐릭터 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('캐릭터 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingCharacterImage(false);
    }
  };

  // 설정 컷 이미지 생성
  const handleGenerateSettingCutImage = async () => {
    if (!story || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGeneratingSettingCutImage(true);

    try {
      const prompt = `다음 정보를 바탕으로 설정 컷 이미지를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
시나리오: ${finalScenario}

요구사항:
1. 스토리의 핵심 설정과 분위기를 반영
2. 캐릭터들의 특징을 잘 드러내는 설정
3. 영상 제작에 적합한 구체적인 설정 컷
4. 고품질, 상세한 이미지`;

      const result = await googleAIService.generateSettingCutImage(prompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: prompt,
          description: prompt,
          image: result,
          timestamp: new Date().toISOString(),
          source: 'ai_generated'
        };

        if (setGeneratedSettingCutImages) {
          setGeneratedSettingCutImages(prev => [...prev, newImage]);
        }

        addNotification({
          type: 'success',
          title: '설정 컷 이미지 생성 완료',
          message: '설정 컷 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('설정 컷 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '설정 컷 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingSettingCutImage(false);
    }
  };

  // 배경 이미지 생성
  const handleGenerateVideoBackground = async () => {
    if (!story || !finalScenario) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 시나리오를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGeneratingBackgroundImage(true);
    try {
      const prompt = `다음 정보를 바탕으로 배경 이미지를 생성해주세요:

스토리: ${story}
시나리오: ${finalScenario}

요구사항:
1. 시나리오의 배경과 분위기를 정확히 반영
2. 영상 제작에 적합한 고품질 이미지
3. 다양한 장소와 시간대 포함
4. 캐릭터가 자연스럽게 배치될 수 있는 환경`;

      const result = await googleAIService.generateCharacterImage(prompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: prompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: '배경 이미지',
          source: 'generated'
        };

        setGeneratedVideoBackgrounds(prev => [...prev, newImage]);
        
        addNotification({
          type: 'success',
          title: '배경 이미지 생성 완료',
          message: '배경 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('배경 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingBackgroundImage(false);
    }
  };

  // 파일에서 이미지 추가
  const handleAddCharacterImageFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleAddBackgroundImageFromFile = () => {
    backgroundFileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'character' | 'background' | 'settingCut') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const newImage: GeneratedImage = {
        id: Date.now(),
        input: `업로드된 ${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지`,
        image: imageData,
        timestamp: new Date().toISOString(),
        description: `업로드된 ${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지`,
        source: 'uploaded'
      };

      if (type === 'character') {
        setGeneratedCharacterImages(prev => [...prev, newImage]);
      } else if (type === 'background') {
        setGeneratedVideoBackgrounds(prev => [...prev, newImage]);
      } else if (type === 'settingCut' && setGeneratedSettingCutImages) {
        setGeneratedSettingCutImages(prev => [...prev, newImage]);
      }

      addNotification({
        type: 'success',
        title: '이미지 업로드 완료',
        message: `${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지가 업로드되었습니다.`,
      });
    };
    reader.readAsDataURL(file);
  };

  // 이미지 선택 토글
  const handleToggleImageSelection = (imageId: number, type: 'character' | 'background' | 'settingCut') => {
    if (type === 'character') {
      setSelectedCharacterImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    } else if (type === 'background') {
      setSelectedVideoBackgrounds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    } else if (type === 'settingCut' && setSelectedSettingCutImages) {
      setSelectedSettingCutImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 캐릭터 이미지 생성 */}
      <div className="bg-purple-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-purple-800 mb-4">👤 캐릭터 이미지 생성</h3>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleGenerateCharacterImage}
            disabled={isGeneratingCharacterImage || !story || characterList.length === 0}
            className={`px-4 py-2 ${
              isGeneratingCharacterImage || !story || characterList.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isGeneratingCharacterImage ? '생성 중...' : 'AI로 캐릭터 이미지 생성'}
          </Button>
          
          <Button
            onClick={handleAddCharacterImageFromFile}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            파일에서 추가
          </Button>

          <Button
            onClick={() => handleSelectFromProjectReference('character')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            📋 프로젝트 참조에서 선택
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'character')}
          className="hidden"
        />

        {/* 생성된 캐릭터 이미지 목록 */}
        {generatedCharacterImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-purple-800">
              생성된 캐릭터 이미지 ({generatedCharacterImages.length}개)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedCharacterImages.map((image) => (
                <div key={image.id} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedCharacterImages.has(image.id)}
                      onChange={() => handleToggleImageSelection(image.id, 'character')}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(image.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 배경 이미지 생성 */}
      <div className="bg-orange-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">🏞️ 배경 이미지 생성</h3>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleGenerateVideoBackground}
            disabled={isGeneratingBackgroundImage || !story || !finalScenario}
            className={`px-4 py-2 ${
              isGeneratingBackgroundImage || !story || !finalScenario
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {isGeneratingBackgroundImage ? '생성 중...' : 'AI로 배경 이미지 생성'}
          </Button>
          
          <Button
            onClick={handleAddBackgroundImageFromFile}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            파일에서 추가
          </Button>

          <Button
            onClick={() => handleSelectFromProjectReference('background')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            📋 프로젝트 참조에서 선택
          </Button>
        </div>

        <input
          ref={backgroundFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'background')}
          className="hidden"
        />

        {/* 생성된 배경 이미지 목록 */}
        {generatedVideoBackgrounds.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-orange-800">
              생성된 배경 이미지 ({generatedVideoBackgrounds.length}개)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedVideoBackgrounds.map((image) => (
                <div key={image.id} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedVideoBackgrounds.has(image.id)}
                      onChange={() => handleToggleImageSelection(image.id, 'background')}
                      className="rounded"
                    />
                    <span className="text-xs text-gray-500">
                      {new Date(image.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 설정 컷 이미지 생성 */}
      <div className="bg-green-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold text-green-800 mb-4">🎬 설정 컷 이미지 생성</h3>
        
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleGenerateSettingCutImage}
            disabled={isGeneratingSettingCutImage || !story || characterList.length === 0}
            className={`px-4 py-2 ${
              isGeneratingSettingCutImage || !story || characterList.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isGeneratingSettingCutImage ? '생성 중...' : 'AI로 설정 컷 이미지 생성'}
          </Button>

          <Button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  handleFileUpload({ target: { files: [file] } } as any, 'settingCut');
                }
              };
              input.click();
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
          >
            파일에서 추가
          </Button>

          <Button
            onClick={() => handleSelectFromProjectReference('settingCut')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            📋 프로젝트 참조에서 선택
          </Button>
        </div>

        {/* 설정 컷 이미지 목록 */}
        {generatedSettingCutImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-green-700 mb-2">생성된 설정 컷 이미지</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedSettingCutImages.map((image) => (
                <div key={image.id} className="bg-white p-3 rounded border">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSettingCutImages?.has(image.id) || false}
                      onChange={() => handleToggleImageSelection(image.id, 'settingCut')}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-500">{image.source}</span>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 프로젝트 참조 모달 */}
      {showProjectReferenceModal && referenceModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                프로젝트 참조에서 {referenceModalType === 'character' ? '캐릭터' : referenceModalType === 'background' ? '배경' : '설정 컷'} 이미지 선택
              </h2>
              <button
                onClick={() => setShowProjectReferenceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {referenceModalType === 'character' && projectReferenceCharacters.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectReferenceCharacters.map((image, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border cursor-pointer hover:bg-gray-100"
                         onClick={() => handleProjectReferenceImageSelect(image, 'character')}>
                      <img
                        src={image.image}
                        alt={image.description || image.prompt}
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                    </div>
                  ))}
                </div>
              )}
              {referenceModalType === 'background' && projectReferenceBackgrounds.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectReferenceBackgrounds.map((image, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border cursor-pointer hover:bg-gray-100"
                         onClick={() => handleProjectReferenceImageSelect(image, 'background')}>
                      <img
                        src={image.image}
                        alt={image.description || image.prompt}
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                    </div>
                  ))}
                </div>
              )}
              {referenceModalType === 'settingCut' && projectReferenceSettingCuts.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectReferenceSettingCuts.map((image, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded border cursor-pointer hover:bg-gray-100"
                         onClick={() => handleProjectReferenceImageSelect(image, 'settingCut')}>
                      <img
                        src={image.image}
                        alt={image.description || image.prompt}
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                    </div>
                  ))}
                </div>
              )}
              {((referenceModalType === 'character' && projectReferenceCharacters.length === 0) ||
                (referenceModalType === 'background' && projectReferenceBackgrounds.length === 0) ||
                (referenceModalType === 'settingCut' && projectReferenceSettingCuts.length === 0)) && (
                <div className="text-center text-gray-500 py-8">
                  해당 타입의 이미지가 프로젝트 참조에 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
