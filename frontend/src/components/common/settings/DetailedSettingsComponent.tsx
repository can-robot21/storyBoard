import React, { useState } from 'react';
import { DetailedSettings } from '../../../types/imageGeneration';
import { CameraSettingsComponent } from './CameraSettingsComponent';
import { LightingSettingsComponent } from './LightingSettingsComponent';
import { ColorSettingsComponent } from './ColorSettingsComponent';

interface DetailedSettingsComponentProps {
  settings: DetailedSettings;
  onChange: (key: string | number | symbol, value: any) => void;
  disabled?: boolean;
}

export const DetailedSettingsComponent: React.FC<DetailedSettingsComponentProps> = ({
  settings,
  onChange,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'lighting' | 'color'>('camera');

  const handleCameraChange = (key: string | number | symbol, value: any) => {
    onChange('camera', { ...settings.camera, [key]: value });
  };

  const handleLightingChange = (key: string | number | symbol, value: any) => {
    onChange('lighting', { ...settings.lighting, [key]: value });
  };

  const handleColorChange = (key: string | number | symbol, value: any) => {
    onChange('color', { ...settings.color, [key]: value });
  };

  const tabs = [
    { id: 'camera', label: '카메라', icon: '📷' },
    { id: 'lighting', label: '조명', icon: '💡' },
    { id: 'color', label: '색상', icon: '🎨' }
  ] as const;

  return (
    <div className="bg-white rounded-lg border">
      {/* 탭 네비게이션 - 상단으로 이동 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={disabled}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'camera' && (
          <CameraSettingsComponent
            settings={settings.camera}
            onChange={handleCameraChange}
            disabled={disabled}
          />
        )}
        {activeTab === 'lighting' && (
          <LightingSettingsComponent
            settings={settings.lighting}
            onChange={handleLightingChange}
            disabled={disabled}
          />
        )}
        {activeTab === 'color' && (
          <ColorSettingsComponent
            settings={settings.color}
            onChange={handleColorChange}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
