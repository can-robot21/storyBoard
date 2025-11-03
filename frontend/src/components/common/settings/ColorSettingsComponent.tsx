import React from 'react';
import { ColorSettings } from '../../../types/imageGeneration';

interface ColorSettingsProps {
  settings: ColorSettings;
  onChange: (key: keyof ColorSettings, value: any) => void;
  disabled?: boolean;
}

export const ColorSettingsComponent: React.FC<ColorSettingsProps> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const handleChange = (key: keyof ColorSettings, value: any) => {
    onChange(key, value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">색상 설정</h3>
      
      {/* 색상 옵션들을 한 줄씩 정리 */}
      <div className="space-y-3">
        {/* 색상 팔레트 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">팔레트</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.palette}
            onChange={(e) => handleChange('palette', e.target.value)}
            disabled={disabled}
          >
            <option value="natural">자연스러운</option>
            <option value="vibrant">생생한</option>
            <option value="muted">차분한</option>
            <option value="monochrome">단색</option>
          </select>
        </div>

        {/* 채도 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">채도</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.saturation}
            onChange={(e) => handleChange('saturation', e.target.value)}
            disabled={disabled}
          >
            <option value="low">낮음</option>
            <option value="medium">중간</option>
            <option value="high">높음</option>
          </select>
        </div>

        {/* 대비 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">대비</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.contrast}
            onChange={(e) => handleChange('contrast', e.target.value)}
            disabled={disabled}
          >
            <option value="low">낮음</option>
            <option value="medium">중간</option>
            <option value="high">높음</option>
          </select>
        </div>

        {/* 색온도 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">색온도</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.colorTemperature}
            onChange={(e) => handleChange('colorTemperature', e.target.value)}
            disabled={disabled}
          >
            <option value="warm">따뜻한</option>
            <option value="neutral">중성</option>
            <option value="cool">차가운</option>
          </select>
        </div>

        {/* 금색 액센트 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">금색액센트</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.goldenAccents ? 'on' : 'off'}
            onChange={(e) => handleChange('goldenAccents', e.target.value === 'on')}
            disabled={disabled}
          >
            <option value="off">끄기</option>
            <option value="on">켜기</option>
          </select>
        </div>

        {/* 시네마틱 그레이딩 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">시네마틱</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.cinematicGrading ? 'on' : 'off'}
            onChange={(e) => handleChange('cinematicGrading', e.target.value === 'on')}
            disabled={disabled}
          >
            <option value="off">끄기</option>
            <option value="on">켜기</option>
          </select>
        </div>
      </div>
    </div>
  );
};