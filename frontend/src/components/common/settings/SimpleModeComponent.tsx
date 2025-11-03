import React from 'react';
import { ImageGenerationConfig, ImageOutputSize } from '../../../types/imageGeneration';

interface SimpleModeComponentProps {
  config: ImageGenerationConfig;
  handleConfigChange: (key: string, value: string) => void;
  selectedOutputSize?: ImageOutputSize | null;
}

export const SimpleModeComponent: React.FC<SimpleModeComponentProps> = ({
  config,
  handleConfigChange,
  selectedOutputSize
}) => {
  // 스타일 표시명 변환
  const getStyleDisplayName = (style: string) => {
    const styleMap: { [key: string]: string } = {
      'realistic': '사실적',
      'artistic': '예술적',
      'cartoon': '만화',
      'anime': '애니메이션',
      'photographic': '사진형',
      'illustration': '일러스트레이션',
      'sketch': '스케치',
      'pen_drawing': '펜화',
      'ink_wash': '수묵화',
      'painting': '회화',
      'watercolor': '수채화',
      'oil_painting': '유화',
      'digital_art': '디지털 아트',
      'concept_art': '컨셉 아트',
      'fantasy': '판타지',
      'sci_fi': '사이언스 픽션',
      'vintage': '빈티지',
      'modern': '모던'
    };
    return styleMap[style] || style;
  };

  // 품질 표시명 변환
  const getQualityDisplayName = (quality: string) => {
    const qualityMap: { [key: string]: string } = {
      'standard': '표준',
      'high': '고품질',
      'ultra': '초고품질'
    };
    return qualityMap[quality] || quality;
  };

  return (
    <div className="space-y-6">
      {/* 일반 보드 모드 - 읽기 전용 */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">기본 설정</h4>
        
        <div className="space-y-4">
          {/* 스타일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {getStyleDisplayName(config.style)}
            </div>
          </div>

          {/* 품질 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {getQualityDisplayName(config.quality)}
            </div>
          </div>

          {/* 화면 사이즈 (출력 사이즈 정보 사용) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">화면 사이즈</label>
            {selectedOutputSize ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">비율:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedOutputSize.ratio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">해상도:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedOutputSize.resolution}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">표시명:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedOutputSize.displayName || selectedOutputSize.ratio}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {config.aspectRatio || '설정되지 않음'}
              </div>
            )}
          </div>

          {/* 커스텀 사이즈 */}
          {config.customSize && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 사이즈</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {config.customSize}
              </div>
            </div>
          )}

          {/* 추가 요구사항 */}
          {config.additionalPrompt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">추가 요구사항</label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 min-h-[80px]">
                {config.additionalPrompt}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
