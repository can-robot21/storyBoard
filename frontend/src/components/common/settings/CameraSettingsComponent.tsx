import React from 'react';
import { CameraSettings } from '../../../types/imageGeneration';

interface CameraSettingsProps {
  settings: CameraSettings;
  onChange: (key: keyof CameraSettings, value: any) => void;
  disabled?: boolean;
}

export const CameraSettingsComponent: React.FC<CameraSettingsProps> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const handleChange = (key: keyof CameraSettings, value: any) => {
    onChange(key, value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">카메라 설정</h3>
      
      {/* 카메라 옵션들을 한 줄씩 정리 */}
      <div className="space-y-3">
        {/* 카메라 위치 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">위치</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.position}
            onChange={(e) => handleChange('position', e.target.value)}
            disabled={disabled}
          >
            <option value="front">정면</option>
            <option value="back">후면</option>
            <option value="right-side">우측면</option>
            <option value="left-side">좌측면</option>
            <option value="top">상단</option>
            <option value="bottom">하단</option>
          </select>
        </div>

        {/* 카메라 거리 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">거리</label>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={settings.distance}
              onChange={(e) => handleChange('distance', parseFloat(e.target.value))}
              disabled={disabled}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12">{settings.distance}m</span>
          </div>
        </div>

        {/* 렌즈 타입 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">렌즈</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.lensType}
            onChange={(e) => handleChange('lensType', e.target.value)}
            disabled={disabled}
          >
            <option value="standard">표준</option>
            <option value="wide">와이드</option>
            <option value="telephoto">망원</option>
            <option value="macro">매크로</option>
          </select>
        </div>

        {/* 카메라 회전 */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">카메라 회전</h4>
          
          {/* 팬 각도 (좌우 회전) */}
          <div className="flex items-center gap-4 mb-3">
            <label className="w-20 text-sm font-medium text-gray-700">좌/우 (트렉)</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="-180"
                max="180"
                step="10"
                value={settings.panAngle}
                onChange={(e) => handleChange('panAngle', parseInt(e.target.value))}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{settings.panAngle}°</span>
            </div>
          </div>

          {/* 틸트 각도 (위아래 회전) */}
          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700">위/아래(크레인)</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={settings.tiltAngle}
                onChange={(e) => handleChange('tiltAngle', parseInt(e.target.value))}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{settings.tiltAngle}°</span>
            </div>
          </div>
        </div>

        {/* 화면상 위치 (절대값) */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">화면상 위치 (절대값)</h4>
          
          {/* 화면 가로 위치 */}
          <div className="flex items-center gap-4 mb-3">
            <label className="w-20 text-sm font-medium text-gray-700">가로 위치</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={settings.screenPositionX}
                onChange={(e) => handleChange('screenPositionX', parseInt(e.target.value))}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{settings.screenPositionX}</span>
            </div>
          </div>

          {/* 화면 세로 위치 */}
          <div className="flex items-center gap-4">
            <label className="w-20 text-sm font-medium text-gray-700">세로 위치</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={settings.screenPositionY}
                onChange={(e) => handleChange('screenPositionY', parseInt(e.target.value))}
                disabled={disabled}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{settings.screenPositionY}</span>
            </div>
          </div>
        </div>

        {/* 깊이 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">깊이</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.depthOfField}
            onChange={(e) => handleChange('depthOfField', e.target.value)}
            disabled={disabled}
          >
            <option value="shallow">얕은</option>
            <option value="medium">중간</option>
            <option value="deep">깊은</option>
          </select>
        </div>

        {/* 모션 블러 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">모션블러</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.motionBlur}
            onChange={(e) => handleChange('motionBlur', e.target.value)}
            disabled={disabled}
          >
            <option value="none">없음</option>
            <option value="light">약간</option>
            <option value="medium">중간</option>
            <option value="strong">강함</option>
          </select>
        </div>
      </div>
    </div>
  );
};