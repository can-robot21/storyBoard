import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  attachedImages: File[];
  maxImages?: number;
  accept?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesChange,
  attachedImages,
  maxImages = 5,
  accept = "image/*",
  className = ""
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const currentImages = attachedImages || [];
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && 
      currentImages.length + Array.from(files).length <= maxImages
    );

    if (newFiles.length === 0) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (currentImages.length + newFiles.length > maxImages) {
      alert(`최대 ${maxImages}개의 이미지만 업로드 가능합니다.`);
      return;
    }

    onImagesChange([...currentImages, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const currentImages = attachedImages || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 업로드 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          이미지를 드래그하거나 클릭하여 업로드
        </p>
        <p className="text-xs text-gray-500">
          최대 {maxImages}개, JPG, PNG, GIF, WebP 지원
        </p>
      </div>

      {/* 첨부된 이미지 목록 */}
      {attachedImages && attachedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            첨부된 이미지 ({attachedImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {attachedImages.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추가 업로드 버튼 */}
      {attachedImages && attachedImages.length < maxImages && (
        <button
          onClick={openFileDialog}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <ImageIcon className="h-4 w-4" />
          이미지 추가 ({(attachedImages || []).length}/{maxImages})
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
