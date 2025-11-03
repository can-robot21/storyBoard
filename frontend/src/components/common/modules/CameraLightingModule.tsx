import React, { useState } from 'react';
import { DetailedSettings, ImageGenerationConfig, ImageOutputSize } from '../../../types/imageGeneration';
import { DetailedModeComponent } from '../settings/DetailedModeComponent';
import { SimpleModeComponent } from '../settings/SimpleModeComponent';
import { ModeToggle } from '../settings/ModeToggle';

export interface CameraLightingData {
  detailedSettings: DetailedSettings;
  config: ImageGenerationConfig;
  isDetailedMode: boolean;
}

interface CameraLightingModuleProps {
  initialData?: CameraLightingData;
  onDataChange: (data: CameraLightingData) => void;
  attachedImages: File[];
  imageRoles: Array<{ role: string; weight: number }>;
  isGenerating: boolean;
  selectedOutputSize?: ImageOutputSize | null;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * 카메라 및 조명 설정 모듈
 * 고급 설정을 포함한 재사용 가능한 컴포넌트
 */
export const CameraLightingModule: React.FC<CameraLightingModuleProps> = ({
  initialData,
  onDataChange,
  attachedImages,
  imageRoles,
  isGenerating,
  selectedOutputSize,
  onPrev,
  onNext
}) => {
  const [detailedSettings, setDetailedSettings] = useState<DetailedSettings>(
    initialData?.detailedSettings || {
      camera: {
        position: 'front',
        distance: 5,
        angle: '0',
        panAngle: 0,
        tiltAngle: 0,
        rollAngle: 0,
        screenPositionX: 0,
        screenPositionY: 0,
        lensType: 'standard',
        rotationX: 0,
        rotationY: 0,
        lensFocalLength: 50,
        compressionEffect: 'normal',
        gridPosition: { x: 0, y: 0 },
        motionBlur: 'none',
        depthOfField: 'medium'
      },
      lighting: {
        type: 'natural',
        direction: 'front',
        intensity: 'medium',
        shadows: 'soft',
        volumetricLighting: false,
        rimLighting: false,
        goldenHour: false,
        haze: 'none'
      },
      color: {
        palette: 'natural',
        saturation: 'medium',
        contrast: 'medium',
        colorTemperature: 'neutral',
        goldenAccents: false,
        cinematicGrading: false
      }
    }
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
  const [isDetailedMode, setIsDetailedMode] = useState(initialData?.isDetailedMode || false);

  // 설정 변경 핸들러
  const handleConfigChange = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onDataChange({
      detailedSettings,
      config: newConfig,
      isDetailedMode
    });
  };

  // 상세 설정 변경 핸들러 (SetStateAction 지원)
  const handleDetailedSettingsChange: React.Dispatch<React.SetStateAction<DetailedSettings>> = (
    newSettings
  ) => {
    if (typeof newSettings === 'function') {
      setDetailedSettings(prev => {
        const updated = newSettings(prev);
        onDataChange({
          detailedSettings: updated,
          config,
          isDetailedMode
        });
        return updated;
      });
    } else {
      setDetailedSettings(newSettings);
      onDataChange({
        detailedSettings: newSettings,
        config,
        isDetailedMode
      });
    }
  };

  // 모드 전환 핸들러
  const handleModeToggle = (mode: boolean) => {
    setIsDetailedMode(mode);
    onDataChange({
      detailedSettings,
      config,
      isDetailedMode: mode
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">카메라 및 조명 설정</h3>
      <p className="text-sm text-gray-600 mb-4">
        일반 보드는 미리보기 없이 공통 요소 옵션을 반영하고, 상세 설정은 미리보기 위주의 카메라 조절로 효과적인 화면 구성을 제공합니다.
      </p>
      
      {/* 모드 전환 토글 */}
      <ModeToggle 
        isDetailedMode={isDetailedMode} 
        setIsDetailedMode={handleModeToggle} 
      />
      
      {/* 모드별 컴포넌트 렌더링 */}
      {isDetailedMode ? (
        <DetailedModeComponent
          detailedSettings={detailedSettings}
          setDetailedSettings={handleDetailedSettingsChange}
          config={config}
          handleConfigChange={handleConfigChange}
          attachedImages={attachedImages}
          imageRoles={imageRoles}
          isGenerating={isGenerating}
          selectedOutputSize={selectedOutputSize}
        />
      ) : (
        <SimpleModeComponent
          config={config}
          handleConfigChange={handleConfigChange}
          selectedOutputSize={selectedOutputSize}
        />
      )}

      {/* 커스텀 사이즈 및 추가 프롬프트 (하단) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
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

      <div className="flex justify-between mt-4">
        <button
          onClick={onPrev}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          이전
        </button>
        <button
          onClick={onNext}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
        >
          다음
        </button>
      </div>
    </div>
  );
};

