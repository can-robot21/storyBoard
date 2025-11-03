import React, { useState, useEffect } from 'react';
import { 
  ImageOutputSize, 
  ImageEditingStyle, 
  ImageGenerationConfig 
} from '../../../types/imageGeneration';
import { 
  outputSizeOptions, 
  editingStyleOptions 
} from '../../../constants/imageGenerationOptions';

export interface SizeStyleConfigData {
  selectedOutputSize: ImageOutputSize | null;
  selectedEditingStyle: ImageEditingStyle | null;
  config: ImageGenerationConfig;
  responseModality: 'text_image' | 'image_only';
}

interface SizeStyleConfigModuleProps {
  initialData?: SizeStyleConfigData;
  onDataChange: (data: SizeStyleConfigData) => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * 사이즈(비율)/수정 스타일 설정 모듈
 * 기본 설정(비율/품질/스타일) 포함 및 이전 옵션 반영
 */
export const SizeStyleConfigModule: React.FC<SizeStyleConfigModuleProps> = ({
  initialData,
  onDataChange,
  onPrev,
  onNext
}) => {
  const [selectedOutputSize, setSelectedOutputSize] = useState<ImageOutputSize | null>(
    initialData?.selectedOutputSize || null
  );
  const [selectedEditingStyle, setSelectedEditingStyle] = useState<ImageEditingStyle | null>(
    initialData?.selectedEditingStyle || null
  );
  const [config, setConfig] = useState<ImageGenerationConfig>(
    initialData?.config || {
      style: 'realistic',
      quality: 'high',
      aspectRatio: '16:9',
      customSize: '',
      additionalPrompt: ''
    }
  );
  const [responseModality, setResponseModality] = useState<'text_image' | 'image_only'>(
    initialData?.responseModality || 'text_image'
  );

  // 설정 변경 시 상위로 전달
  useEffect(() => {
    onDataChange({
      selectedOutputSize,
      selectedEditingStyle,
      config,
      responseModality
    });
  }, [selectedOutputSize, selectedEditingStyle, config, responseModality, onDataChange]);

  // 출력 사이즈 변경 시 config.aspectRatio도 동기화
  const handleOutputSizeChange = (size: ImageOutputSize | null) => {
    setSelectedOutputSize(size);
    if (size) {
      setConfig(prev => ({ ...prev, aspectRatio: size.ratio }));
    }
  };

  // config 변경 핸들러
  const handleConfigChange = (key: keyof ImageGenerationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    
    // aspectRatio 변경 시 selectedOutputSize도 업데이트
    if (key === 'aspectRatio' && value) {
      const matchingSize = outputSizeOptions.find(size => size.ratio === value);
      if (matchingSize) {
        setSelectedOutputSize(matchingSize);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          이미지 출력 사이즈 및 기본 설정
        </h3>
        <p className="text-sm text-gray-600">
          원하는 출력 사이즈, 기본 설정(비율/품질/스타일), 수정 스타일을 선택하세요.
        </p>
      </div>

      {/* 기본 설정 섹션 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">기본 설정</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
            <select
              value={config.style}
              onChange={(e) => handleConfigChange('style', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="realistic">사실적 (Realistic)</option>
              <option value="artistic">예술적 (Artistic)</option>
              <option value="cartoon">만화 (Cartoon)</option>
              <option value="anime">애니메이션 (Anime)</option>
              <option value="photographic">사진형 (Photographic)</option>
              <option value="illustration">일러스트레이션 (Illustration)</option>
              <option value="sketch">스케치 (Sketch)</option>
              <option value="pen_drawing">펜화 (Pen Drawing)</option>
              <option value="ink_wash">수묵화 (Ink Wash)</option>
              <option value="painting">회화 (Painting)</option>
              <option value="watercolor">수채화 (Watercolor)</option>
              <option value="oil_painting">유화 (Oil Painting)</option>
              <option value="digital_art">디지털 아트 (Digital Art)</option>
              <option value="concept_art">컨셉 아트 (Concept Art)</option>
              <option value="fantasy">판타지 (Fantasy)</option>
              <option value="sci_fi">사이언스 픽션 (Sci-Fi)</option>
              <option value="vintage">빈티지 (Vintage)</option>
              <option value="modern">모던 (Modern)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
            <select
              value={config.quality}
              onChange={(e) => handleConfigChange('quality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">표준 (Standard)</option>
              <option value="high">고품질 (High)</option>
              <option value="ultra">초고품질 (Ultra)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
            <select
              value={config.aspectRatio}
              onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {outputSizeOptions.map((size) => (
                <option key={size.ratio} value={size.ratio}>
                  {size.displayName || size.ratio} ({size.resolution})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {selectedOutputSize?.description || '비율을 선택하세요'}
            </p>
          </div>
        </div>
      </div>

      {/* 출력 사이즈 선택 */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">출력 사이즈</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이미지 비율 선택</label>
          <select
            value={selectedOutputSize?.ratio || config.aspectRatio || ''}
            onChange={(e) => {
              const selectedSize = outputSizeOptions.find(size => size.ratio === e.target.value);
              if (selectedSize) {
                handleOutputSizeChange(selectedSize);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">사이즈를 선택하세요</option>
            {outputSizeOptions.map((size) => (
              <option key={size.ratio} value={size.ratio}>
                {size.displayName || size.ratio} ({size.resolution}) - {size.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 수정 스타일 선택 */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">수정 스타일 (선택사항)</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">수정 스타일 선택</label>
          <select
            value={selectedEditingStyle?.id || ''}
            onChange={(e) => {
              const selectedStyle = editingStyleOptions.find(style => style.id === e.target.value);
              if (selectedStyle) {
                setSelectedEditingStyle(selectedStyle);
              } else {
                setSelectedEditingStyle(null);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">수정 스타일을 선택하세요 (선택사항)</option>
            {editingStyleOptions.map((style) => (
              <option key={style.id} value={style.id}>
                {style.displayName || style.name} - {style.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 선택된 옵션 요약 */}
      {(selectedOutputSize || selectedEditingStyle) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">선택된 옵션</h4>
          <div className="space-y-1">
            {selectedOutputSize && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">출력 사이즈:</span>
                <span className="text-sm font-medium">
                  {selectedOutputSize.displayName || selectedOutputSize.ratio} ({selectedOutputSize.resolution})
                </span>
              </div>
            )}
            {selectedEditingStyle && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">수정 스타일:</span>
                <span className="text-sm font-medium">
                  {selectedEditingStyle.displayName || selectedEditingStyle.name} - {selectedEditingStyle.description}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">기본 스타일:</span>
              <span className="text-sm font-medium">{config.style}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">품질:</span>
              <span className="text-sm font-medium">{config.quality}</span>
            </div>
          </div>
        </div>
      )}

      {/* 커스텀 사이즈 및 추가 프롬프트 (하단) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-3">커스텀 옵션 (최우선 반영)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 사이즈</label>
            <input
              type="text"
              value={config.customSize}
              onChange={(e) => handleConfigChange('customSize', e.target.value)}
              placeholder="예: 1920x1080, 4K, 세로형 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              커스텀 사이즈가 입력되면 상단 비율 설정보다 우선 적용됩니다
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">추가 프롬프트</label>
            <textarea
              value={config.additionalPrompt}
              onChange={(e) => handleConfigChange('additionalPrompt', e.target.value)}
              placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* 나노바나나 공통 설정 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">나노바나나 공통 설정</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">응답 모달리티</label>
            <select
              value={responseModality}
              onChange={(e) => setResponseModality(e.target.value as 'text_image' | 'image_only')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text_image">텍스트 + 이미지</option>
              <option value="image_only">이미지만</option>
            </select>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          <p>• 텍스트 + 이미지: 생성된 이미지와 함께 설명 텍스트를 제공합니다</p>
          <p>• 이미지만: 생성된 이미지만 반환합니다 (더 빠른 처리)</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          이전
        </button>
        <button
          onClick={onNext}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          다음
        </button>
      </div>
    </div>
  );
};

