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
  renderMode?: string;
  // Imagen 3/4 옵션들 (txt2img용)
  numberOfImages?: number; // 생성할 이미지 수 (1-4)
  imageSize?: string; // 이미지 크기 (1K, 2K)
  personGeneration?: string; // 사람 이미지 생성 허용 (dont_allow, allow_adult, allow_all)
  // Gemini 2.5 Flash Image 옵션들 (img2img용)
  responseModalities?: string; // 응답 모달리티 (Image, Text,Image)
  styleEnhancement?: string; // 스타일 프롬프트 강화
  editMode?: string; // 편집 모드 (modify, inpainting, style_transfer, composition)
  detailPreservation?: number; // 세부정보 보존 강도 (0-100)
  editIntensity?: number; // 편집 강도 (0-100)
  cameraControl?: string; // 카메라 제어
  // 나노바나나 카메라 설정 옵션들
  cameraPosition?: string; // 카메라 위치 (front, side, back, top, low_angle, high_angle, bird_eye, worm_eye)
  lensType?: string; // 렌즈 타입 (wide_angle, standard, telephoto, macro, fisheye, tilt_shift)
  focalDistance?: string; // 초점 거리 (close_up, medium, long_shot, extreme_long_shot)
  cameraFilter?: string; // 카메라 필터 (none, vintage, cinematic, dramatic, soft_focus, sharp, warm, cool)
  // 기존 옵션들 (호환성 유지)
  creativity?: number; // 자유도 (0-100)
  referenceStrength?: number; // 첨부 이미지 참조 강도 (0-100)
  compositionDetail?: string; // 합성 디테일 레벨
  lightingStyle?: string; // 조명 스타일
  colorTemperature?: string; // 색온도
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
  showGenerateButton?: boolean;
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
  showDownloadButtons = true,
  showGenerateButton = true
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
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-6 h-6 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* img2img 기본 옵션 블록 - 커스텀 사이즈와 추가 프롬프트만 */}
      {attachedImages.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-3">🎨 img2img 기본 옵션</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 커스텀 사이즈 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
              <input
                type="text"
                value={config.customSize}
                onChange={(e) => onConfigChange({ ...config, customSize: e.target.value })}
                placeholder="예: 1920x1080, 4K, 세로형 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 추가 프롬프트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
              <textarea
                value={config.additionalPrompt}
                onChange={(e) => onConfigChange({ ...config, additionalPrompt: e.target.value })}
                placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}


      {/* 생성 버튼 */}
      {showGenerateButton && (
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !inputValue.trim()}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '생성 중...' : '생성하기'}
        </Button>
      )}

    </div>
  );
};