import React, { useState } from 'react';
import ImageUpload from '../ImageUpload';
import { ImageRole } from '../../../types/imageGeneration';

export interface PromptImageBasicData {
  prompt: string;
  attachedImages: File[];
  imageRoles: ImageRole[];
}

interface PromptImageBasicModuleProps {
  initialData?: PromptImageBasicData;
  onDataChange: (data: PromptImageBasicData) => void;
  onNext: () => void;
}

/**
 * 프롬프트 + 이미지 + 기본 조합 모듈
 * 재사용 가능한 컴포넌트로 분리
 */
export const PromptImageBasicModule: React.FC<PromptImageBasicModuleProps> = ({
  initialData,
  onDataChange,
  onNext
}) => {
  const [prompt, setPrompt] = useState(initialData?.prompt || '');
  const [attachedImages, setAttachedImages] = useState<File[]>(initialData?.attachedImages || []);
  const [imageRoles, setImageRoles] = useState<ImageRole[]>(initialData?.imageRoles || []);

  // 역할을 한글로 변환하는 함수
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'character': '캐릭터 참조',
      'background': '배경 참조',
      'style': '스타일 참조',
      'camera': '카메라 각도 참조',
      'element': '요소 참조'
    };
    return roleMap[role] || '참조';
  };

  // 프롬프트 변경 시 상위로 전달
  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    onDataChange({
      prompt: newPrompt,
      attachedImages,
      imageRoles
    });
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (files: File[]) => {
    setAttachedImages(files);
    
    // 기본 역할 설정
    const newRoles = files.map((file, index) => ({
      id: `role_${Date.now()}_${index}`,
      file: file,
      role: 'character' as const,
      description: `참조 이미지 ${index + 1}`,
      weight: 5
    }));
    setImageRoles(newRoles);
    
    onDataChange({
      prompt,
      attachedImages: files,
      imageRoles: newRoles
    });
  };

  // 이미지 역할 변경 핸들러
  const handleRoleChange = (index: number, role: string, weight?: number) => {
    const newRoles = [...imageRoles];
    if (weight !== undefined) {
      newRoles[index] = { ...newRoles[index], role: role as any, weight };
    } else {
      newRoles[index] = { ...newRoles[index], role: role as any };
    }
    setImageRoles(newRoles);
    
    onDataChange({
      prompt,
      attachedImages,
      imageRoles: newRoles
    });
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index: number) => {
    const newImages = attachedImages.filter((_, i) => i !== index);
    const newRoles = imageRoles.filter((_, i) => i !== index);
    setAttachedImages(newImages);
    setImageRoles(newRoles);
    
    onDataChange({
      prompt,
      attachedImages: newImages,
      imageRoles: newRoles
    });
  };

  return (
    <div className="space-y-6">
      {/* 1단계: 프롬프트 입력 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">1. 프롬프트 입력</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이미지 설명을 입력하세요
          </label>
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="예: 한국인 소녀, 전신, 웨딩드레스, 성당 주변 공원에서 둘러보는 중"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 2단계: 이미지 첨부 */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">참조 이미지 첨부</h3>
          <p className="text-sm text-gray-600">이미지 생성을 위한 참조 이미지를 업로드하세요. (선택사항)</p>
        </div>

        {/* 이미지 업로드 섹션 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">이미지 업로드</h4>
          <ImageUpload
            onImagesChange={handleImageUpload}
            attachedImages={attachedImages}
          />
          <div className="mt-2 text-xs text-gray-500">
            <p>• 최대 5개 이미지까지 업로드 가능</p>
            <p>• 지원 형식: JPEG, PNG, WebP</p>
            <p>• 각 이미지는 참조 역할을 설정할 수 있습니다</p>
          </div>
        </div>
        
        {/* 첨부된 이미지 목록 */}
        {attachedImages.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">첨부된 이미지 ({attachedImages.length}개)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {attachedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <div 
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    {getRoleDisplayName(imageRoles[index]?.role || 'character')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 이미지 역할 설정 */}
        {attachedImages.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-800 mb-3">이미지 역할 설정</h4>
            <div className="space-y-3">
              {imageRoles.map((role, index) => (
                <div key={role.id || index} className="flex items-center space-x-4 bg-white p-3 rounded border">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={URL.createObjectURL(attachedImages[index])}
                      alt={`이미지 ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이미지 {index + 1} 역할
                    </label>
                    <select
                      value={role.role}
                      onChange={(e) => handleRoleChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="character">캐릭터 참조</option>
                      <option value="background">배경 참조</option>
                      <option value="style">스타일 참조</option>
                      <option value="camera">카메라 각도 참조</option>
                      <option value="element">요소 참조</option>
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      가중치
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={role.weight}
                      onChange={(e) => handleRoleChange(index, role.role, parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-blue-600">
              <p>• 캐릭터 참조: 인물이나 캐릭터의 외모를 참조합니다</p>
              <p>• 배경 참조: 배경이나 환경을 참조합니다</p>
              <p>• 스타일 참조: 전체적인 스타일이나 분위기를 참조합니다</p>
              <p>• 가중치: 참조 강도를 조절합니다 (1-10)</p>
            </div>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!prompt.trim()}
          className={`px-6 py-2 rounded-lg font-medium ${
            prompt.trim()
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          다음
        </button>
      </div>
    </div>
  );
};

