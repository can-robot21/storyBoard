import React, { useState } from 'react';
import { GeneratedVideo } from '../../types/videoGeneration';
import { Download, Play, Maximize2, X, Copy, Share2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface VideoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: GeneratedVideo | null;
  onDelete?: (videoId: number) => void;
}

const VideoCardModal: React.FC<VideoCardModalProps> = ({
  isOpen,
  onClose,
  video,
  onDelete
}) => {
  const { addNotification } = useUIStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !video) return null;

  const handleDownload = async () => {
    try {
      if (!video.videoUrl) {
        addNotification({
          type: 'error',
          title: '다운로드 실패',
          message: '영상 URL이 없습니다.',
        });
        return;
      }

      // 영상 다운로드
      const response = await fetch(video.videoUrl);
      if (!response.ok) {
        throw new Error('영상 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video_${video.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: '다운로드 완료',
        message: '영상이 성공적으로 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('영상 다운로드 오류:', error);
      addNotification({
        type: 'error',
        title: '다운로드 실패',
        message: '영상 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  const handleCopyUrl = () => {
    if (video.videoUrl) {
      navigator.clipboard.writeText(video.videoUrl);
      addNotification({
        type: 'success',
        title: 'URL 복사 완료',
        message: '영상 URL이 클립보드에 복사되었습니다.',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && video.videoUrl) {
      try {
        await navigator.share({
          title: '생성된 영상',
          text: 'AI로 생성된 영상을 확인해보세요!',
          url: video.videoUrl,
        });
      } catch (error) {
        console.error('공유 실패:', error);
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('이 영상을 삭제하시겠습니까?')) {
      onDelete(video.id);
      onClose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'} flex flex-col`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">생성된 영상</h2>
            <p className="text-sm text-gray-500">
              생성 시간: {new Date(video.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 영상 플레이어 - 화면에 맞게 출력 */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-full h-full max-h-[calc(100vh-200px)]">
            {video.videoUrl ? (
              <video
                className="w-full h-full object-contain"
                controls
                poster={video.thumbnail}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(e) => setIsMuted(e.currentTarget.muted)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
              >
                <source src={video.videoUrl} type="video/mp4" />
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            ) : (
              <div className="flex items-center justify-center h-64 text-white">
                <div className="text-center">
                  <p className="text-lg mb-2">영상을 불러올 수 없습니다</p>
                  <p className="text-sm text-gray-400">영상 URL이 유효하지 않습니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 영상 정보 */}
        <div className="p-4 border-t bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 기본 정보 */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">영상 정보</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">비율:</span>
                  <span className="text-gray-800">{video.videoRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">길이:</span>
                  <span className="text-gray-800">{video.duration || '8초'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">타입:</span>
                  <span className="text-gray-800">{video.type}</span>
                </div>
              </div>
            </div>

            {/* 프롬프트 정보 */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">생성 프롬프트</h3>
              <div className="bg-white p-3 rounded border text-sm max-h-32 overflow-y-auto">
                {video.projectTexts && video.projectTexts.length > 0 ? (
                  <p className="text-gray-700">{video.projectTexts[0]}</p>
                ) : (
                  <p className="text-gray-500">프롬프트 정보가 없습니다.</p>
                )}
              </div>
            </div>
          </div>

          {/* 참조 이미지 정보 */}
          {((video.characterImages?.length || 0) > 0 || (video.backgrounds?.length || 0) > 0) && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-800 mb-2">참조 이미지</h3>
              <div className="flex gap-2 overflow-x-auto">
                {video.characterImages?.map((img, index) => (
                  <img
                    key={index}
                    src={img.image}
                    alt={`캐릭터 ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
                {video.backgrounds?.map((img, index) => (
                  <img
                    key={index}
                    src={img.image}
                    alt={`배경 ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              URL 복사
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              공유
            </button>
          </div>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCardModal;
