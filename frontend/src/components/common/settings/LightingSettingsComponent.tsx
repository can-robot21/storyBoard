import React from 'react';
import { LightingSettings } from '../../../types/imageGeneration';

interface LightingSettingsProps {
  settings: LightingSettings;
  onChange: (key: keyof LightingSettings, value: any) => void;
  disabled?: boolean;
}

export const LightingSettingsComponent: React.FC<LightingSettingsProps> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const handleChange = (key: keyof LightingSettings, value: any) => {
    onChange(key, value);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">조명 설정</h3>
      
      {/* 조명 옵션들을 한 줄씩 정리 */}
      <div className="space-y-3">
        {/* 조명 방향 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">방향</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.direction}
            onChange={(e) => handleChange('direction', e.target.value)}
            disabled={disabled}
          >
            <option value="front">정면</option>
            <option value="back">후면</option>
            <option value="side">측면</option>
            <option value="top">상단</option>
            <option value="bottom">하단</option>
          </select>
        </div>

        {/* 조명 강도 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">강도</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.intensity}
            onChange={(e) => handleChange('intensity', e.target.value)}
            disabled={disabled}
          >
            <option value="low">낮음</option>
            <option value="medium">중간</option>
            <option value="high">높음</option>
          </select>
        </div>

        {/* 그림자 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">그림자</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.shadows}
            onChange={(e) => handleChange('shadows', e.target.value)}
            disabled={disabled}
          >
            <option value="soft">부드러운</option>
            <option value="medium">중간</option>
            <option value="hard">강한</option>
          </select>
        </div>

        {/* 조명 타입 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">타입</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.type}
            onChange={(e) => handleChange('type', e.target.value)}
            disabled={disabled}
          >
            <option value="natural">자연광</option>
            <option value="artificial">인공광</option>
            <option value="mixed">혼합</option>
          </select>
        </div>

        {/* 체적 조명 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">체적조명</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.volumetricLighting ? 'on' : 'off'}
            onChange={(e) => handleChange('volumetricLighting', e.target.value === 'on')}
            disabled={disabled}
          >
            <option value="off">끄기</option>
            <option value="on">켜기</option>
          </select>
        </div>

        {/* 림 라이팅 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">림라이팅</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.rimLighting ? 'on' : 'off'}
            onChange={(e) => handleChange('rimLighting', e.target.value === 'on')}
            disabled={disabled}
          >
            <option value="off">끄기</option>
            <option value="on">켜기</option>
          </select>
        </div>

        {/* 골든 아워 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">골든아워</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.goldenHour ? 'on' : 'off'}
            onChange={(e) => handleChange('goldenHour', e.target.value === 'on')}
            disabled={disabled}
          >
            <option value="off">끄기</option>
            <option value="on">켜기</option>
          </select>
        </div>

        {/* 공기 질감 */}
        <div className="flex items-center gap-4">
          <label className="w-20 text-sm font-medium text-gray-700">공기질감</label>
          <select
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={settings.haze}
            onChange={(e) => handleChange('haze', e.target.value)}
            disabled={disabled}
          >
            <option value="none">없음</option>
            <option value="light">약간</option>
            <option value="medium">중간</option>
            <option value="heavy">강함</option>
          </select>
        </div>
      </div>
    </div>
  );
};