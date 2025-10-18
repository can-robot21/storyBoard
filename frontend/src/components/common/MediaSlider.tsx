import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  url?: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  timestamp?: string;
}

interface MediaSliderProps {
  images: MediaItem[];
  videos: MediaItem[];
  onImageClick?: (item: MediaItem) => void;
  onVideoClick?: (item: MediaItem) => void;
  className?: string;
}

export const MediaSlider: React.FC<MediaSliderProps> = ({
  images,
  videos,
  onImageClick,
  onVideoClick,
  className = ''
}) => {
  const [imageScrollPosition, setImageScrollPosition] = useState(0);
  const [videoScrollPosition, setVideoScrollPosition] = useState(0);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const videoScrollRef = useRef<HTMLDivElement>(null);

  const itemWidth = 200; // 각 아이템의 너비
  const visibleItems = 7; // 보이는 아이템 수
  const scrollAmount = itemWidth * 3; // 한 번에 스크롤되는 양

  // 이미지 스크롤 함수
  const scrollImages = (direction: 'left' | 'right') => {
    if (!imageScrollRef.current) return;
    
    const container = imageScrollRef.current;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    
    if (direction === 'left') {
      const newPosition = Math.max(0, imageScrollPosition - scrollAmount);
      setImageScrollPosition(newPosition);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    } else {
      const newPosition = Math.min(maxScroll, imageScrollPosition + scrollAmount);
      setImageScrollPosition(newPosition);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  // 영상 스크롤 함수
  const scrollVideos = (direction: 'left' | 'right') => {
    if (!videoScrollRef.current) return;
    
    const container = videoScrollRef.current;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    
    if (direction === 'left') {
      const newPosition = Math.max(0, videoScrollPosition - scrollAmount);
      setVideoScrollPosition(newPosition);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    } else {
      const newPosition = Math.min(maxScroll, videoScrollPosition + scrollAmount);
      setVideoScrollPosition(newPosition);
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
    }
  };

  // 스크롤 위치 업데이트
  useEffect(() => {
    const handleImageScroll = () => {
      if (imageScrollRef.current) {
        setImageScrollPosition(imageScrollRef.current.scrollLeft);
      }
    };

    const handleVideoScroll = () => {
      if (videoScrollRef.current) {
        setVideoScrollPosition(videoScrollRef.current.scrollLeft);
      }
    };

    const imageContainer = imageScrollRef.current;
    const videoContainer = videoScrollRef.current;

    if (imageContainer) {
      imageContainer.addEventListener('scroll', handleImageScroll);
    }
    if (videoContainer) {
      videoContainer.addEventListener('scroll', handleVideoScroll);
    }

    return () => {
      if (imageContainer) {
        imageContainer.removeEventListener('scroll', handleImageScroll);
      }
      if (videoContainer) {
        videoContainer.removeEventListener('scroll', handleVideoScroll);
      }
    };
  }, []);

  // No Thumbnail 컴포넌트
  const NoThumbnail = ({ type }: { type: 'image' | 'video' }) => (
    <div className="w-[200px] h-[150px] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 flex-shrink-0">
      <div className="text-center text-gray-500">
        <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
          {type === 'image' ? (
            <ImageIcon className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </div>
        <p className="text-xs font-medium">No Thumbnail</p>
        <p className="text-xs text-gray-400">15:9</p>
      </div>
    </div>
  );

  // 미디어 아이템 렌더링
  const renderMediaItem = (item: MediaItem, onClick?: (item: MediaItem) => void) => {
    const hasThumbnail = item.url || item.thumbnail;
    
    if (!hasThumbnail) {
      return <NoThumbnail type={item.type} />;
    }

    return (
      <div
        key={item.id}
        className="w-[200px] h-[150px] rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 flex-shrink-0 relative group"
        onClick={() => onClick?.(item)}
      >
        <img
          src={item.thumbnail || item.url}
          alt={item.title || `${item.type} thumbnail`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 No Thumbnail로 대체
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '';
              parent.appendChild(document.createElement('div')).outerHTML = 
                '<div class="w-[200px] h-[150px] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"><div class="text-center text-gray-500"><div class="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><p class="text-xs font-medium">No Thumbnail</p><p class="text-xs text-gray-400">15:9</p></div></div>';
            }
          }}
        />
        
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          {item.type === 'video' && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Play className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* 제목 (선택사항) */}
        {item.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <p className="text-white text-xs font-medium truncate">{item.title}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 이미지 슬라이더 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            이미지 ({images.length}개)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => scrollImages('left')}
              disabled={imageScrollPosition === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollImages('right')}
              disabled={imageScrollPosition >= (imageScrollRef.current?.scrollWidth || 0) - (imageScrollRef.current?.clientWidth || 0)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div
            ref={imageScrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.length > 0 ? (
              images.map(item => renderMediaItem(item, onImageClick))
            ) : (
              <NoThumbnail type="image" />
            )}
          </div>
        </div>
      </div>

      {/* 영상 슬라이더 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Play className="w-5 h-5" />
            영상 ({videos.length}개)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => scrollVideos('left')}
              disabled={videoScrollPosition === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollVideos('right')}
              disabled={videoScrollPosition >= (videoScrollRef.current?.scrollWidth || 0) - (videoScrollRef.current?.clientWidth || 0)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div
            ref={videoScrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {videos.length > 0 ? (
              videos.map(item => renderMediaItem(item, onVideoClick))
            ) : (
              <NoThumbnail type="video" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSlider;
