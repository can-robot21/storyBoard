import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';

const VOICEOVER_OPTIONS = [
  { value: 'ko-female', label: '한국어 여성' },
  { value: 'ko-male', label: '한국어 남성' },
  { value: 'en-female', label: '영어 여성' },
  { value: 'en-male', label: '영어 남성' },
] as const;

const BACKGROUND_MUSIC_OPTIONS = [
  { value: 'calm', label: '차분한' },
  { value: 'energetic', label: '활기찬' },
  { value: 'mysterious', label: '신비로운' },
  { value: 'romantic', label: '로맨틱한' },
  { value: 'none', label: '없음' },
] as const;

const VideoStep: React.FC = () => {
  const { currentProject, updateStep } = useProjectStore();
  const { addNotification } = useUIStore();
  
  const [formData, setFormData] = useState({
    voiceover: 'ko-female',
    background_music: 'calm',
    resolution: '1080p',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateVideo = async () => {
    if (!currentProject?.data.generatedVideos.length) {
      addNotification({
        type: 'error',
        title: '컷 필요',
        message: '영상 생성 전에 컷을 먼저 생성해주세요.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate long API call
      
      const mockVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
      setGeneratedVideo(mockVideoUrl);
      
      const currentCuts = currentProject.data.generatedVideos || [];
      updateStep('영상 생성', {
        generatedVideos: [...currentCuts, {
          id: Date.now(),
          textCards: [],
          characterImages: [],
          backgrounds: [],
          projectTexts: [],
          aiReviewTexts: [],
          video: mockVideoUrl,
          videoRatio: '16:9',
          timestamp: new Date().toISOString()
        }]
      });

      addNotification({
        type: 'success',
        title: '영상 생성 완료',
        message: 'AI가 영상을 성공적으로 생성했습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '영상 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const link = document.createElement('a');
      link.href = generatedVideo;
      link.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">영상 생성</h1>
        <p className="text-gray-600">AI를 활용하여 최종 영상을 생성하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">영상 설정</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                음성 합성
              </label>
              <select
                name="voiceover"
                value={formData.voiceover}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {VOICEOVER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배경음악
              </label>
              <select
                name="background_music"
                value={formData.background_music}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {BACKGROUND_MUSIC_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                해상도
              </label>
              <select
                name="resolution"
                value={formData.resolution}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="4k">4K (Ultra HD)</option>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateVideo}
              loading={isGenerating}
              className="w-full"
            >
              {isGenerating ? '영상 생성 중...' : '영상 생성'}
            </Button>
          </div>
        </div>

        {/* Generated Video */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">생성된 영상</h2>
            {generatedVideo && (
              <Button
                variant="outline"
                onClick={handleDownload}
                size="sm"
              >
                다운로드
              </Button>
            )}
          </div>
          
          {generatedVideo ? (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  src={generatedVideo}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="text-sm text-gray-600">
                <p>해상도: {formData.resolution}</p>
                <p>음성: {VOICEOVER_OPTIONS.find(v => v.value === formData.voiceover)?.label}</p>
                <p>배경음악: {BACKGROUND_MUSIC_OPTIONS.find(m => m.value === formData.background_music)?.label}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎞️</span>
              </div>
              <p className="text-gray-500">영상을 생성해보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isGenerating && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-900">영상 생성 중...</p>
              <p className="text-sm text-blue-700">이 과정은 몇 분 정도 소요될 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 고해상도 영상은 생성 시간이 더 오래 걸립니다</li>
          <li>• 배경음악을 선택하면 영상의 분위기가 달라집니다</li>
          <li>• 생성된 영상은 언제든지 다시 다운로드할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoStep;
