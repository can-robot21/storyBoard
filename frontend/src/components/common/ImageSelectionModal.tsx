import React, { useState, useEffect } from 'react';
import { Check, Image as ImageIcon } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ImageItem {
  id: string;
  image: string;
  description?: string;
  type: 'character' | 'background' | 'settingCut';
  timestamp: string;
}

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImages: (images: string[]) => void;
  title?: string;
  // 프로젝트 참조 이미지들 추가
  projectReferenceCharacters?: any[];
  projectReferenceBackgrounds?: any[];
  projectReferenceSettingCuts?: any[];
}

export const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectImages,
  title = '이미지 선택',
  projectReferenceCharacters = [],
  projectReferenceBackgrounds = [],
  projectReferenceSettingCuts = []
}) => {
  const [availableImages, setAvailableImages] = useState<ImageItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'character' | 'background' | 'settingCut'>('all');

  // 저장된 이미지 로드
  useEffect(() => {
    if (isOpen) {
      loadStoredImages();
    }
  }, [isOpen, projectReferenceCharacters, projectReferenceBackgrounds, projectReferenceSettingCuts]);

  const loadStoredImages = () => {
    try {
      const images: ImageItem[] = [];
      
      // localStorage에서 이미지 데이터 로드
      const characterImages = JSON.parse(localStorage.getItem('generatedCharacters') || '[]');
      const backgroundImages = JSON.parse(localStorage.getItem('generatedBackgrounds') || '[]');
      const settingCutImages = JSON.parse(localStorage.getItem('generatedSettingCuts') || '[]');

      // 프로젝트 참조 이미지들도 추가
      const allCharacterImages = [...characterImages, ...projectReferenceCharacters];
      const allBackgroundImages = [...backgroundImages, ...projectReferenceBackgrounds];
      const allSettingCutImages = [...settingCutImages, ...projectReferenceSettingCuts];

      // 중복 제거를 위한 Set 사용
      const seenImages = new Set<string>();

      // 캐릭터 이미지 추가
      allCharacterImages.forEach((img: any, index: number) => {
        if (img.image && !seenImages.has(img.image)) {
          seenImages.add(img.image);
          images.push({
            id: `character_${index}`,
            image: img.image,
            description: img.description || `캐릭터 이미지 ${index + 1}`,
            type: 'character',
            timestamp: img.timestamp || new Date().toISOString()
          });
        }
      });

      // 배경 이미지 추가
      allBackgroundImages.forEach((img: any, index: number) => {
        if (img.image && !seenImages.has(img.image)) {
          seenImages.add(img.image);
          images.push({
            id: `background_${index}`,
            image: img.image,
            description: img.description || `배경 이미지 ${index + 1}`,
            type: 'background',
            timestamp: img.timestamp || new Date().toISOString()
          });
        }
      });

      // 설정 컷 이미지 추가
      allSettingCutImages.forEach((img: any, index: number) => {
        if (img.image && !seenImages.has(img.image)) {
          seenImages.add(img.image);
          images.push({
            id: `settingCut_${index}`,
            image: img.image,
            description: img.description || `설정 컷 이미지 ${index + 1}`,
            type: 'settingCut',
            timestamp: img.timestamp || new Date().toISOString()
          });
        }
      });

      // 최신순으로 정렬
      images.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setAvailableImages(images);
      console.log('📸 로드된 이미지 개수:', images.length);
    } catch (error) {
      console.error('이미지 로드 오류:', error);
      setAvailableImages([]);
    }
  };

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedImageUrls = Array.from(selectedImages).map(id => {
      const image = availableImages.find(img => img.id === id);
      return image?.image || '';
    }).filter(url => url);

    onSelectImages(selectedImageUrls);
    onClose();
  };

  const filteredImages = availableImages.filter(img => 
    filterType === 'all' || img.type === filterType
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'character': return '캐릭터';
      case 'background': return '배경';
      case 'settingCut': return '설정 컷';
      default: return '전체';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'character': return 'bg-purple-100 text-purple-800';
      case 'background': return 'bg-green-100 text-green-800';
      case 'settingCut': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="space-y-4">
        {/* 필터 옵션 */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'character', 'background', 'settingCut'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* 이미지 그리드 */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {filteredImages.map(image => (
              <div
                key={image.id}
                onClick={() => handleImageSelect(image.id)}
                className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                  selectedImages.has(image.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.image}
                  alt={image.description}
                  className="w-full h-24 object-cover rounded-t-lg"
                />
                
                {/* 선택 표시 */}
                {selectedImages.has(image.id) && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* 이미지 정보 */}
                <div className="p-2">
                  <div className={`inline-block px-2 py-1 rounded text-xs ${getTypeColor(image.type)}`}>
                    {getTypeLabel(image.type)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {image.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium mb-2">선택 가능한 이미지가 없습니다.</p>
            <p className="text-sm mb-1">다음 단계를 확인해주세요:</p>
            <ul className="text-xs text-left max-w-sm mx-auto space-y-1">
              <li>• 프로젝트 개요에서 캐릭터/배경/설정 생성</li>
              <li>• 이미지 생성 단계에서 이미지 생성</li>
              <li>• 영상 생성에서 이미지 업로드</li>
            </ul>
          </div>
        )}

        {/* 선택된 이미지 수 표시 */}
        {selectedImages.size > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedImages.size}개의 이미지가 선택되었습니다.
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedImages.size === 0}
          >
            선택 완료 ({selectedImages.size})
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageSelectionModal;
