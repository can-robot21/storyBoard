import React from 'react';
import Button from './Button';
import ImageUpload from './ImageUpload';
import { Download } from 'lucide-react';

export interface ImageGenerationConfig {
  style: string;
  quality: string;
  aspectRatio: string;
  customSize: string;
  additionalPrompt: string;
}

export interface ImageGenerationResult {
  id: number;
  description: string;
  image: string;
  attachedImages: File[];
  timestamp: string;
}

interface ImageGenerationFormProps {
  title: string;
  placeholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  attachedImages: File[];
  onImagesChange: (images: File[]) => void;
  config: ImageGenerationConfig;
  onConfigChange: (config: ImageGenerationConfig) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  maxImages?: number;
  showDownloadButtons?: boolean;
}

export const ImageGenerationForm: React.FC<ImageGenerationFormProps> = ({
  title,
  placeholder,
  inputValue,
  onInputChange,
  attachedImages,
  onImagesChange,
  config,
  onConfigChange,
  onGenerate,
  isGenerating = false,
  maxImages = 5,
  showDownloadButtons = true
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">{title}</h3>
      
      {/* 입력 필드 */}
      <textarea
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      />
      
      {/* 이미지 업로드 */}
      <ImageUpload
        onImagesChange={onImagesChange}
        attachedImages={attachedImages}
        maxImages={maxImages}
        className="mt-3"
      />
      
      {/* 첨부된 이미지 다운로드 버튼들 */}
      {showDownloadButtons && attachedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">첨부된 이미지</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {attachedImages.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(image);
                    link.download = `attached-image-${index + 1}.png`;
                    link.click();
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 생성 버튼 */}
      <Button 
        className="w-full" 
        onClick={onGenerate}
        disabled={isGenerating}
        loading={isGenerating}
      >
        {isGenerating ? '생성 중...' : '이미지 생성'}
      </Button>
    </div>
  );
};

// 고급 옵션 설정 컴포넌트
interface AdvancedOptionsProps {
  config: ImageGenerationConfig;
  onConfigChange: (config: ImageGenerationConfig) => void;
}

export const AdvancedOptions: React.FC<AdvancedOptionsProps> = ({
  config,
  onConfigChange
}) => {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-medium text-gray-800 mb-3">고급 옵션</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 이미지 스타일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
          <select
            value={config.style}
            onChange={(e) => onConfigChange({ ...config, style: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="realistic">사실적 (Realistic)</option>
            <option value="cartoon">만화 (Cartoon)</option>
            <option value="anime">애니메이션 (Anime)</option>
            <option value="3d">3D 렌더링</option>
            <option value="watercolor">수채화</option>
            <option value="oil_painting">유화</option>
          </select>
        </div>

        {/* 이미지 품질 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이미지 품질</label>
          <select
            value={config.quality}
            onChange={(e) => onConfigChange({ ...config, quality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="high">고품질 (High)</option>
            <option value="medium">중품질 (Medium)</option>
            <option value="low">저품질 (Low)</option>
          </select>
        </div>

        {/* 화면 비율 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
          <select
            value={config.aspectRatio}
            onChange={(e) => onConfigChange({ ...config, aspectRatio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="1:1">정사각형 (1:1)</option>
            <option value="16:9">와이드 (16:9)</option>
            <option value="9:16">세로 (9:16)</option>
            <option value="4:3">표준 (4:3)</option>
            <option value="3:4">세로 표준 (3:4)</option>
          </select>
        </div>

        {/* 커스텀 사이즈 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
          <input
            type="text"
            value={config.customSize}
            onChange={(e) => onConfigChange({ ...config, customSize: e.target.value })}
            placeholder="예: 1920x1080, 4K, 세로형 등"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* 추가 프롬프트 */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
        <textarea
          value={config.additionalPrompt}
          onChange={(e) => onConfigChange({ ...config, additionalPrompt: e.target.value })}
          placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    </div>
  );
};
