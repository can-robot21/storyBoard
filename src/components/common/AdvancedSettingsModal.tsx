import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { apiUsageService } from '../../services/apiUsageService';

interface VideoSettings {
  model: 'veo-3.0-generate-001' | 'veo-3.0-fast' | 'veo-3.0-standard';
  aspectRatio: '16:9' | '1:1' | '9:16';
  duration: 1 | 2 | 4 | 8;
  resolution: '480p' | '720p' | '1080p';
  fps: 24 | 30 | 60;
  generateAudio: boolean;
  personGeneration: 'ALLOW_ALL' | 'ALLOW_NONE' | 'ALLOW_SPECIFIC';
}

interface ImageSettings {
  model: 'gemini-pro-vision' | 'dall-e-3' | 'nano-banana';
  style: 'realistic' | 'anime' | 'cartoon' | 'artistic';
  quality: 'standard' | 'hd';
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3';
  numberOfImages: 1 | 2 | 4;
}

interface TextSettings {
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gemini-pro';
  temperature: 0.1 | 0.3 | 0.5 | 0.7 | 0.9;
  maxTokens: 1000 | 2000 | 4000 | 8000;
  language: 'ko' | 'en' | 'ja' | 'zh';
}

interface ExportSettings {
  includeMetadata: boolean;
  includeImages: boolean;
  includeVideos: boolean;
  format: 'json' | 'txt' | 'pdf';
  compression: boolean;
}

interface AdvancedSettings {
  video: VideoSettings;
  image: ImageSettings;
  text: TextSettings;
  export: ExportSettings;
}

interface AdvancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AdvancedSettings) => void;
  currentSettings?: AdvancedSettings;
}

export const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'text' | 'export'>('video');
  const [settings, setSettings] = useState<AdvancedSettings>({
    video: {
      model: 'veo-3.0-generate-001',
      aspectRatio: '16:9',
      duration: 8,
      resolution: '720p',
      fps: 24,
      generateAudio: true,
      personGeneration: 'ALLOW_ALL',
    },
    image: {
      model: 'gemini-pro-vision',
      style: 'realistic',
      quality: 'standard',
      aspectRatio: '16:9',
      numberOfImages: 1,
    },
    text: {
      model: 'gemini-pro',
      temperature: 0.5,
      maxTokens: 2000,
      language: 'ko',
    },
    export: {
      includeMetadata: true,
      includeImages: true,
      includeVideos: true,
      format: 'txt',
      compression: false,
    },
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  // Google API 키 유무로 Nano Banana 옵션 노출 제어
  const hasGoogleKey = (() => {
    try {
      if (typeof window !== 'undefined') {
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const localKeysRaw = localStorage.getItem('user_api_keys');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};
        const envKey = process.env.REACT_APP_GEMINI_API_KEY || '';
        return !!(localKeys.google || currentUser?.apiKeys?.google || envKey);
      }
    } catch {}
    return !!(process.env.REACT_APP_GEMINI_API_KEY);
  })();

  const updateVideoSettings = (updates: Partial<VideoSettings>) => {
    setSettings(prev => ({
      ...prev,
      video: { ...prev.video, ...updates },
    }));
  };

  const updateImageSettings = (updates: Partial<ImageSettings>) => {
    setSettings(prev => ({
      ...prev,
      image: { ...prev.image, ...updates },
    }));
  };

  const updateTextSettings = (updates: Partial<TextSettings>) => {
    setSettings(prev => ({
      ...prev,
      text: { ...prev.text, ...updates },
    }));
  };

  const updateExportSettings = (updates: Partial<ExportSettings>) => {
    setSettings(prev => ({
      ...prev,
      export: { ...prev.export, ...updates },
    }));
  };

  const getModelInfo = (provider: string, model: string) => {
    const config = apiUsageService.getAPIConfig(provider, model);
    return config;
  };

  const tabs = [
    { id: 'video', label: '영상 설정', icon: '🎬' },
    { id: 'image', label: '이미지 설정', icon: '🖼️' },
    { id: 'text', label: '텍스트 설정', icon: '📝' },
    { id: 'export', label: '내보내기 설정', icon: '📤' },
  ] as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="고급 설정">
      <div className="space-y-6">
        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 영상 설정 */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">영상 생성 설정</h3>
            
            {/* 모델 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
              <select
                value={settings.video.model}
                onChange={(e) => updateVideoSettings({ model: e.target.value as VideoSettings['model'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="veo-3.0-generate-001">Veo 3.0 Generate (기본)</option>
                <option value="veo-3.0-fast">Veo 3.0 Fast (빠른 생성)</option>
                <option value="veo-3.0-standard">Veo 3.0 Standard (고품질)</option>
              </select>
              <div className="mt-1 text-xs text-gray-500">
                {getModelInfo('Google', settings.video.model)?.pricing.tier === 'free' ? '무료' : '유료'} 모델
              </div>
            </div>

            {/* 비율 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">영상 비율</label>
              <div className="grid grid-cols-3 gap-2">
                {(['16:9', '1:1', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => updateVideoSettings({ aspectRatio: ratio })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.video.aspectRatio === ratio
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* 길이 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">영상 길이</label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 4, 8] as const).map((duration) => (
                  <button
                    key={duration}
                    onClick={() => updateVideoSettings({ duration })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.video.duration === duration
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {duration}초
                  </button>
                ))}
              </div>
            </div>

            {/* 해상도 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">해상도</label>
              <select
                value={settings.video.resolution}
                onChange={(e) => updateVideoSettings({ resolution: e.target.value as VideoSettings['resolution'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="480p">480p (SD)</option>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </select>
            </div>

            {/* 프레임 레이트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">프레임 레이트</label>
              <div className="grid grid-cols-3 gap-2">
                {([24, 30, 60] as const).map((fps) => (
                  <button
                    key={fps}
                    onClick={() => updateVideoSettings({ fps })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.video.fps === fps
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            {/* 추가 옵션 */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="generateAudio"
                  checked={settings.video.generateAudio}
                  onChange={(e) => updateVideoSettings({ generateAudio: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="generateAudio" className="ml-2 text-sm text-gray-700">
                  오디오 생성
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">인물 생성</label>
                <select
                  value={settings.video.personGeneration}
                  onChange={(e) => updateVideoSettings({ personGeneration: e.target.value as VideoSettings['personGeneration'] })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALLOW_ALL">모든 인물 허용</option>
                  <option value="ALLOW_NONE">인물 생성 금지</option>
                  <option value="ALLOW_SPECIFIC">특정 인물만 허용</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 설정 */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">이미지 생성 설정</h3>
            
            {/* 모델 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
              <select
                value={settings.image.model}
                onChange={(e) => updateImageSettings({ model: e.target.value as ImageSettings['model'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gemini-pro-vision">Gemini Pro Vision (무료)</option>
                <option value="dall-e-3">DALL-E 3 (유료)</option>
                <option value="nano-banana">Nano Banana (무료)</option>
              </select>
            </div>

            {/* 스타일 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
              <div className="grid grid-cols-2 gap-2">
                {(['realistic', 'anime', 'cartoon', 'artistic'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateImageSettings({ style })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.image.style === style
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {style === 'realistic' ? '사실적' :
                     style === 'anime' ? '애니메이션' :
                     style === 'cartoon' ? '만화' : '예술적'}
                  </button>
                ))}
              </div>
            </div>

            {/* 품질 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
              <div className="grid grid-cols-2 gap-2">
                {(['standard', 'hd'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => updateImageSettings({ quality })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.image.quality === quality
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {quality === 'standard' ? '표준' : 'HD'}
                  </button>
                ))}
              </div>
            </div>

            {/* 이미지 개수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">생성할 이미지 개수</label>
              <div className="grid grid-cols-4 gap-2">
                {([1, 2, 4] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => updateImageSettings({ numberOfImages: count })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.image.numberOfImages === count
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {count}개
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 텍스트 설정 */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">텍스트 생성 설정</h3>
            
            {/* 모델 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모델</label>
              <select
                value={settings.text.model}
                onChange={(e) => updateTextSettings({ model: e.target.value as TextSettings['model'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gemini-pro">Gemini Pro (무료)</option>
                <option value="gpt-4o">GPT-4o (유료)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (유료)</option>
              </select>
            </div>

            {/* 온도 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                창의성 (Temperature): {settings.text.temperature}
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={settings.text.temperature}
                onChange={(e) => updateTextSettings({ temperature: parseFloat(e.target.value) as TextSettings['temperature'] })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>보수적</span>
                <span>창의적</span>
              </div>
            </div>

            {/* 최대 토큰 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">최대 토큰</label>
              <select
                value={settings.text.maxTokens}
                onChange={(e) => updateTextSettings({ maxTokens: parseInt(e.target.value) as TextSettings['maxTokens'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1000}>1,000 토큰</option>
                <option value={2000}>2,000 토큰</option>
                <option value={4000}>4,000 토큰</option>
                <option value={8000}>8,000 토큰</option>
              </select>
            </div>

            {/* 언어 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
              <select
                value={settings.text.language}
                onChange={(e) => updateTextSettings({ language: e.target.value as TextSettings['language'] })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        )}

        {/* 내보내기 설정 */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">내보내기 설정</h3>
            
            {/* 포함할 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">포함할 내용</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.export.includeMetadata}
                    onChange={(e) => updateExportSettings({ includeMetadata: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">메타데이터</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.export.includeImages}
                    onChange={(e) => updateExportSettings({ includeImages: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">이미지</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.export.includeVideos}
                    onChange={(e) => updateExportSettings({ includeVideos: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">영상</span>
                </label>
              </div>
            </div>

            {/* 파일 형식 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">파일 형식</label>
              <div className="grid grid-cols-3 gap-2">
                {(['json', 'txt', 'pdf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => updateExportSettings({ format })}
                    className={`p-2 text-sm rounded-md border ${
                      settings.export.format === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 압축 옵션 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compression"
                checked={settings.export.compression}
                onChange={(e) => updateExportSettings({ compression: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="compression" className="ml-2 text-sm text-gray-700">
                파일 압축
              </label>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="secondary"
            className="px-4 py-2"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="px-4 py-2"
          >
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedSettingsModal;
