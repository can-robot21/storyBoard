import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import { GeneratedImage } from '../../types/videoGeneration';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';
import { Trash2, Edit3, Check, X, Download } from 'lucide-react';

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
  
  // 텍스트 편집 상태
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  
  // 프롬프트 입력 모달 상태
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalType, setPromptModalType] = useState<'character' | 'background' | 'settingCut' | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // 프로젝트 참조 데이터 상태
  const [projectReferenceData, setProjectReferenceData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  // 프로젝트 참조 데이터 로드
  useEffect(() => {
    const loadProjectReferenceData = () => {
      try {
        const savedData = localStorage.getItem('projectReferenceData');
        if (savedData) {
          const data = JSON.parse(savedData);
          setProjectReferenceData(data);
          console.log('프로젝트 참조 데이터 로드됨:', data);
        }
      } catch (error) {
        console.error('프로젝트 참조 데이터 로드 오류:', error);
      }
    };

    loadProjectReferenceData();
  }, []);

  // 텍스트 편집 시작
  const handleStartEdit = (imageId: number, currentText: string) => {
    setEditingImageId(imageId);
    setEditingText(currentText);
  };

  // 텍스트 편집 완료
  const handleSaveEdit = (imageType: 'character' | 'background' | 'settingCut') => {
    if (!editingImageId || !editingText.trim()) return;

    const updateImage = (images: GeneratedImage[], setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>) => {
      setImages(prev => prev.map(img => 
        img.id === editingImageId 
          ? { ...img, description: editingText.trim() }
          : img
      ));
    };

    switch (imageType) {
      case 'character':
        updateImage(generatedCharacterImages, setGeneratedCharacterImages);
        break;
      case 'background':
        updateImage(generatedVideoBackgrounds, setGeneratedVideoBackgrounds);
        break;
      case 'settingCut':
        if (setGeneratedSettingCutImages) {
          updateImage(generatedSettingCutImages, setGeneratedSettingCutImages);
        }
        break;
    }

    setEditingImageId(null);
    setEditingText('');
    
    addNotification({
      type: 'success',
      title: '수정 완료',
      message: '이미지 설명이 수정되었습니다.',
    });
  };

  // 텍스트 편집 취소
  const handleCancelEdit = () => {
    setEditingImageId(null);
    setEditingText('');
  };

  // 이미지 삭제
  const handleDeleteImage = (imageId: number, imageType: 'character' | 'background' | 'settingCut') => {
    const deleteImage = (images: GeneratedImage[], setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>) => {
      setImages(prev => prev.filter(img => img.id !== imageId));
    };

    switch (imageType) {
      case 'character':
        deleteImage(generatedCharacterImages, setGeneratedCharacterImages);
        setSelectedCharacterImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
        break;
      case 'background':
        deleteImage(generatedVideoBackgrounds, setGeneratedVideoBackgrounds);
        setSelectedVideoBackgrounds(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
        break;
      case 'settingCut':
        if (setGeneratedSettingCutImages && setSelectedSettingCutImages) {
          deleteImage(generatedSettingCutImages, setGeneratedSettingCutImages);
          setSelectedSettingCutImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(imageId);
            return newSet;
          });
        }
        break;
    }

    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '이미지가 삭제되었습니다.',
    });
  };

  // 이미지 다운로드
  const handleDownloadImage = (imageUrl: string, description: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${description.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        type: 'success',
        title: '다운로드 완료',
        message: '이미지가 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      addNotification({
        type: 'error',
        title: '다운로드 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  // 프롬프트 확인 및 이미지 생성
  const handleConfirmPromptAndGenerate = () => {
    if (!customPrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '프롬프트를 입력해주세요.',
      });
      return;
    }

    setShowPromptModal(false);
    
    switch (promptModalType) {
      case 'character':
        handleGenerateCharacterImage(customPrompt);
        break;
      case 'background':
        handleGenerateVideoBackground(customPrompt);
        break;
      case 'settingCut':
        handleGenerateSettingCutImage(customPrompt);
        break;
    }
    
    setPromptModalType(null);
    setCustomPrompt('');
  };

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
      type: type,
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

  // 캐릭터 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenCharacterPromptModal = () => {
    setPromptModalType('character');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 캐릭터 이미지 생성
  const handleGenerateCharacterImage = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 캐릭터 이미지를 생성해주세요:

스토리: ${story}
캐릭터 정보: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

요구사항:
1. 캐릭터의 외모와 성격을 정확히 반영
2. 스토리의 분위기에 맞는 스타일
3. 영상 제작에 적합한 고품질 이미지
4. 다양한 각도와 표정 포함`;

    setIsGeneratingCharacterImage(true);
    try {
      const result = await googleAIService.generateCharacterImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: `캐릭터 이미지 - ${characterList.map(c => c.name).join(', ')}`,
          type: 'character',
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

  // 설정 컷 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenSettingCutPromptModal = () => {
    setPromptModalType('settingCut');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 설정 컷 이미지 생성
  const handleGenerateSettingCutImage = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 설정 컷 이미지를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
시나리오: ${finalScenario}

요구사항:
1. 스토리의 핵심 설정과 분위기를 반영
2. 캐릭터들의 특징을 잘 드러내는 설정
3. 영상 제작에 적합한 구체적인 설정 컷
4. 고품질, 상세한 이미지`;

    setIsGeneratingSettingCutImage(true);

    try {
      const result = await googleAIService.generateSettingCutImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          description: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          type: 'settingCut',
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

  // 배경 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenBackgroundPromptModal = () => {
    setPromptModalType('background');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 배경 이미지 생성
  const handleGenerateVideoBackground = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 배경 이미지를 생성해주세요:

스토리: ${story}
시나리오: ${finalScenario}

요구사항:
1. 시나리오의 배경과 분위기를 정확히 반영
2. 영상 제작에 적합한 고품질 이미지
3. 다양한 장소와 시간대 포함
4. 캐릭터가 자연스럽게 배치될 수 있는 환경`;

    setIsGeneratingBackgroundImage(true);
    try {
      const result = await googleAIService.generateCharacterImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: '배경 이미지',
          type: 'background',
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
        type: type,
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
            onClick={handleOpenCharacterPromptModal}
            disabled={isGeneratingCharacterImage}
            className={`px-4 py-2 ${
              isGeneratingCharacterImage
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '캐릭터 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'character')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('character')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
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
            onClick={handleOpenBackgroundPromptModal}
            disabled={isGeneratingBackgroundImage}
            className={`px-4 py-2 ${
              isGeneratingBackgroundImage
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '배경 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'background')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('background')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
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
            onClick={handleOpenSettingCutPromptModal}
            disabled={isGeneratingSettingCutImage}
            className={`px-4 py-2 ${
              isGeneratingSettingCutImage
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
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSettingCutImages?.has(image.id) || false}
                      onChange={() => handleToggleImageSelection(image.id, 'settingCut')}
                      className="rounded"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '설정 컷 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'settingCut')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-32 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('settingCut')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
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
                프로젝트 참조에서 이미지 선택
              </h2>
              <button
                onClick={() => setShowProjectReferenceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 프로젝트 참조 데이터에서 이미지 표시 */}
              <div className="space-y-4">
                {projectReferenceData ? (
                  <>
                    {/* 캐릭터 이미지 */}
                    {projectReferenceData.characterImages && projectReferenceData.characterImages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">캐릭터 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {projectReferenceData.characterImages.map((image: any, index: number) => (
                            <div key={`char-${index}`} className="bg-gray-50 p-3 rounded border hover:bg-gray-100">
                              <div className="relative">
                                <img
                                  src={image.image}
                                  alt={image.description || image.prompt}
                                  className="w-full h-32 object-cover rounded cursor-pointer"
                                  onClick={() => handleProjectReferenceImageSelect(image, 'character')}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '캐릭터 이미지');
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                                  title="다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 배경 이미지 */}
                    {projectReferenceData.backgroundImages && projectReferenceData.backgroundImages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">배경 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {projectReferenceData.backgroundImages.map((image: any, index: number) => (
                            <div key={`bg-${index}`} className="bg-gray-50 p-3 rounded border hover:bg-gray-100">
                              <div className="relative">
                                <img
                                  src={image.image}
                                  alt={image.description || image.prompt}
                                  className="w-full h-32 object-cover rounded cursor-pointer"
                                  onClick={() => handleProjectReferenceImageSelect(image, 'background')}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '배경 이미지');
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                                  title="다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 설정 컷 이미지 */}
                    {projectReferenceData.settingCutImages && projectReferenceData.settingCutImages.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">설정 컷 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {projectReferenceData.settingCutImages.map((image: any, index: number) => (
                            <div key={`cut-${index}`} className="bg-gray-50 p-3 rounded border hover:bg-gray-100">
                              <div className="relative">
                                <img
                                  src={image.image}
                                  alt={image.description || image.prompt}
                                  className="w-full h-32 object-cover rounded cursor-pointer"
                                  onClick={() => handleProjectReferenceImageSelect(image, 'settingCut')}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '설정 컷 이미지');
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                                  title="다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 전체 이미지가 없는 경우 */}
                    {(!projectReferenceData.characterImages || projectReferenceData.characterImages.length === 0) && 
                     (!projectReferenceData.backgroundImages || projectReferenceData.backgroundImages.length === 0) && 
                     (!projectReferenceData.settingCutImages || projectReferenceData.settingCutImages.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        프로젝트 참조에 저장된 이미지가 없습니다.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    프로젝트 참조 데이터를 로드하는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 입력 모달 */}
      {showPromptModal && promptModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {promptModalType === 'character' ? '캐릭터' : promptModalType === 'background' ? '배경' : '설정 컷'} 이미지 생성 프롬프트
              </h2>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프롬프트 입력
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${promptModalType === 'character' ? '캐릭터' : promptModalType === 'background' ? '배경' : '설정 컷'} 이미지 생성을 위한 프롬프트를 입력하세요...`}
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 프롬프트 작성 팁</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 구체적인 외모, 의상, 표정을 명시하세요</li>
                    <li>• 색상, 스타일, 분위기를 표현하세요</li>
                    <li>• 카메라 앵글과 구도를 지정하세요</li>
                    <li>• 배경과 조명을 설명하세요</li>
                    <li>• 영상 제작에 적합한 고품질 이미지로 요청하세요</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmPromptAndGenerate}
                disabled={!customPrompt.trim()}
                className={`px-4 py-2 rounded ${
                  !customPrompt.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
