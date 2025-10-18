import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, Sliders } from 'lucide-react';

interface StepSettingsPanelProps {
  currentStep: string;
  promptLengthSettings: {
    video: number;
    scenario: number;
  };
  setPromptLengthSettings: (settings: Partial<{ video: number; scenario: number }>) => void;
  sceneCutSettings: {
    sceneCount: number;
    cutCount: number;
  };
  setSceneCutSettings: (settings: Partial<{ sceneCount: number; cutCount: number }>) => void;
  imageSettings?: {
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: '16:9' | '9:16' | '2:3' | '1:1' | 'free';
  };
  setImageSettings?: (settings: Partial<{ quality: 'standard' | 'high' | 'ultra'; aspectRatio: '16:9' | '9:16' | '2:3' | '1:1' | 'free' }>) => void;
  videoSettings?: {
    quality: '720p' | '1080p' | '4k';
    duration: 'short' | 'medium' | 'long';
  };
  setVideoSettings?: (settings: Partial<{ quality: '720p' | '1080p' | '4k'; duration: 'short' | 'medium' | 'long' }>) => void;
  selectedAIProvider?: string;
  onAISettingsClick?: () => void;
  onTogglePanel?: () => void;
}

export const StepSettingsPanel: React.FC<StepSettingsPanelProps> = ({
  currentStep,
  promptLengthSettings,
  setPromptLengthSettings,
  sceneCutSettings,
  setSceneCutSettings,
  imageSettings,
  setImageSettings,
  videoSettings,
  setVideoSettings,
  selectedAIProvider = 'google',
  onAISettingsClick,
  onTogglePanel
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStepSpecificSettings = () => {
    switch (currentStep) {
      case "프로젝트 개요":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 프롬프트 길이 설정 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                영상 프롬프트 길이
              </label>
              <select
                value={promptLengthSettings.video}
                onChange={(e) => setPromptLengthSettings({
                  video: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={50}>짧음 (50자)</option>
                <option value={100}>보통 (100자)</option>
                <option value={200}>김 (200자)</option>
                <option value={0}>free (제약없음)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                시나리오 프롬프트 길이
              </label>
              <select
                value={promptLengthSettings.scenario}
                onChange={(e) => setPromptLengthSettings({
                  scenario: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={100}>짧음 (100자)</option>
                <option value={200}>보통 (200자)</option>
                <option value={300}>김 (300자)</option>
                <option value={0}>free (제약없음)</option>
              </select>
            </div>
          </div>
        );

      case "TXT2IMG":
      case "IMG2IMG":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">이미지 품질</label>
              <select
                value={imageSettings?.quality || 'standard'}
                onChange={(e) => setImageSettings?.({ quality: e.target.value as 'standard' | 'high' | 'ultra' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">표준</option>
                <option value="high">고품질</option>
                <option value="ultra">초고품질</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">이미지 비율</label>
              <select
                value={imageSettings?.aspectRatio || '16:9'}
                onChange={(e) => setImageSettings?.({ aspectRatio: e.target.value as '16:9' | '9:16' | '2:3' | '1:1' | 'free' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="16:9">16:9 (가로)</option>
                <option value="9:16">9:16 (세로)</option>
                <option value="2:3">2:3 (세로)</option>
                <option value="1:1">1:1 (정사각형)</option>
                <option value="free">free (제약없음)</option>
              </select>
            </div>
          </div>
        );

      case "영상 생성":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">영상 품질</label>
              <select
                value={videoSettings?.quality || '720p'}
                onChange={(e) => setVideoSettings?.({ quality: e.target.value as '720p' | '1080p' | '4k' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="4k">4K</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">영상 길이</label>
              <select
                value={videoSettings?.duration || 'medium'}
                onChange={(e) => setVideoSettings?.({ duration: e.target.value as 'short' | 'medium' | 'long' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="short">짧음 (3-5초)</option>
                <option value="medium">보통 (5-10초)</option>
                <option value="long">김 (10-15초)</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* 헤더 영역 */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">{currentStep} 설정</h3>
            </div>

            {/* AI 서비스 표시 */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-sm text-gray-600">AI:</span>
              <span className="text-sm font-medium text-gray-800 capitalize">
                {selectedAIProvider === 'google' ? 'Google AI' : selectedAIProvider}
              </span>
              {onAISettingsClick && (
                <button
                  onClick={onAISettingsClick}
                  className="ml-1 p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                  title="AI 설정 변경"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* 펼치기/접기 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isExpanded ? (
                <>
                  <span>설정 숨기기</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>설정 표시</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            {/* 패널 닫기 버튼 */}
            {onTogglePanel && (
              <button
                onClick={onTogglePanel}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="설정 패널 숨기기"
              >
                패널 숨기기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 설정 내용 영역 */}
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="pt-4">
            {getStepSpecificSettings()}
          </div>
        </div>
      )}
    </div>
  );
};