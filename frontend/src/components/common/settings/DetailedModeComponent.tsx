import React, { useState } from 'react';
import { ThreeDCubePreview } from '../ThreeDCubePreview';
import { DetailedSettingsComponent } from './DetailedSettingsComponent';
import { DetailedSettings, ImageGenerationConfig, ImageOutputSize } from '../../../types/imageGeneration';
import { defaultDetailedSettings } from '../../../constants/imageGenerationOptions';

interface DetailedModeComponentProps {
  detailedSettings: DetailedSettings;
  setDetailedSettings: React.Dispatch<React.SetStateAction<DetailedSettings>>;
  config: ImageGenerationConfig;
  handleConfigChange: (key: string, value: string) => void;
  attachedImages: File[];
  imageRoles: Array<{ role: string; weight: number }>;
  isGenerating: boolean;
  selectedOutputSize?: ImageOutputSize | null;
}

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

export const DetailedModeComponent: React.FC<DetailedModeComponentProps> = ({
  detailedSettings,
  setDetailedSettings,
  config,
  handleConfigChange,
  attachedImages,
  imageRoles,
  isGenerating,
  selectedOutputSize
}) => {
  const [show3DPreview, setShow3DPreview] = useState(true);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 미리보기, 프롬프트, 썸네일 */}
        <div className="space-y-4">
          {/* 3D 미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-800">3D 미리보기</h4>
              <button
                onClick={() => setShow3DPreview(!show3DPreview)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                  show3DPreview 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="mr-1">{show3DPreview ? '👁️' : '👁️‍🗨️'}</span>
                {show3DPreview ? '감추기' : '보이기'}
              </button>
            </div>
            {show3DPreview && (
              <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ minHeight: '200px' }}>
                <ThreeDCubePreview
                  cameraPosition={detailedSettings.camera.position}
                  cameraAngle={parseFloat(detailedSettings.camera.angle)}
                  cameraDistance={detailedSettings.camera.distance}
                  lensType={detailedSettings.camera.lensType}
                  cameraRotationX={detailedSettings.camera.rotationX}
                  cameraRotationY={detailedSettings.camera.rotationY}
                  screenPositionX={detailedSettings.camera.screenPositionX}
                  screenPositionY={detailedSettings.camera.screenPositionY}
                  lightingDirection={detailedSettings.lighting.direction}
                  lightingIntensity={detailedSettings.lighting.intensity}
                  lightingShadows={detailedSettings.lighting.shadows}
                  aspectRatio={config.aspectRatio}
                  lensFocalLength={detailedSettings.camera.lensFocalLength}
                  compressionEffect={detailedSettings.camera.compressionEffect}
                  tiltAngle={detailedSettings.camera.tiltAngle}
                  panAngle={detailedSettings.camera.panAngle}
                  rollAngle={detailedSettings.camera.rollAngle}
                  gridPosition={detailedSettings.camera.gridPosition}
                  motionBlur={detailedSettings.camera.motionBlur}
                  depthOfField={detailedSettings.camera.depthOfField}
                />
              </div>
            )}
          </div>

          {/* 출력 사이즈 정보 */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">출력 사이즈</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              {selectedOutputSize ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">비율:</span>
                    <span className="text-sm text-gray-900">{selectedOutputSize.ratio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">해상도:</span>
                    <span className="text-sm text-gray-900">{selectedOutputSize.resolution}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">표시명:</span>
                    <span className="text-sm text-gray-900">{selectedOutputSize.displayName || selectedOutputSize.ratio}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs text-gray-600">{selectedOutputSize.description}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">출력 사이즈가 설정되지 않았습니다.</p>
              )}
            </div>
          </div>

          {/* 첨부 이미지 썸네일 */}
          {attachedImages.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">첨부 이미지</h4>
              <div className="grid grid-cols-2 gap-2">
                {attachedImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`첨부 이미지 ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {getRoleDisplayName(imageRoles[index]?.role || 'character')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우측: 상세 설정 */}
        <div className="space-y-4">
          {/* 상세 설정 헤더 */}
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-800">상세 설정</h4>
            <button
              onClick={() => setDetailedSettings(defaultDetailedSettings)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="기본 설정으로 초기화"
            >
              초기화
            </button>
          </div>
          
          {/* 상세 설정 컴포넌트 */}
          <DetailedSettingsComponent
            settings={detailedSettings}
            onChange={(key: string | number | symbol, value: any) => {
              setDetailedSettings(prev => ({
                ...prev,
                [key]: value
              }));
            }}
            disabled={isGenerating}
          />
        </div>
      </div>

    </>
  );
};
