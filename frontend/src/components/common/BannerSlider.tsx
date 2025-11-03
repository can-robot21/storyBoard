import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { BannerItem } from '../../types/banner';

interface BannerSliderProps {
  items: BannerItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const BannerSlider: React.FC<BannerSliderProps> = ({ 
  items, 
  autoPlay = true, 
  autoPlayInterval = 4000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 자동 재생 기능
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isPlaying, items.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setIsPlaying(false);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsPlaying(true);
    }, 2000);
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setIsPlaying(false);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsPlaying(true);
    }, 2000);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setIsPlaying(false);
    setTimeout(() => {
      setIsTransitioning(false);
      setIsPlaying(true);
    }, 2000);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (items.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">표시할 콘텐츠가 없습니다.</p>
      </div>
    );
  }

  // 현재 슬라이드와 앞뒤 슬라이드 계산
  const getSlideItems = () => {
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    const nextIndex = (currentIndex + 1) % items.length;
    
    return [
      { item: items[prevIndex], index: prevIndex, position: 'prev' },
      { item: items[currentIndex], index: currentIndex, position: 'current' },
      { item: items[nextIndex], index: nextIndex, position: 'next' }
    ];
  };

  const slideItems = getSlideItems();

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* 슬라이드 컨테이너 */}
      <div className="relative w-full h-full flex items-center justify-center">
        {slideItems.map(({ item, index, position }) => {
          const isCurrent = position === 'current';
          const heightClass = isCurrent ? 'h-[90%]' : 'h-[80%]';
          const opacityClass = isCurrent ? 'opacity-100' : 'opacity-60';
          const scaleClass = isCurrent ? 'scale-100' : 'scale-95';
          
          return (
            <div
              key={`${index}-${position}`}
              className={`absolute transition-all duration-1000 ease-in-out ${heightClass} ${opacityClass} ${scaleClass} ${
                position === 'prev' ? 'left-0' : position === 'next' ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
              }`}
              style={{
                width: position === 'current' ? '60%' : '20%',
                zIndex: isCurrent ? 20 : 10
              }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden"
                style={{
                  backgroundImage: `url(${item.src})`,
                  backgroundSize: isCurrent ? 'contain' : 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* 배경 오버레이 */}
                <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                
                {/* 텍스트 오버레이 - 센터에만 표시 */}
                {isCurrent && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '3px', paddingBottom: '3px' }}>
                    <div className="text-center text-white z-10 px-4">
                      <h3 className="font-bold drop-shadow-lg text-2xl md:text-3xl">
                        {item.title}
                      </h3>
                      <p className="opacity-90 drop-shadow-lg mt-2 text-sm md:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* YouTube 링크가 있는 경우 아이콘 표시 */}
                {item.type === 'youtube' && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full">
                    <Play className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 네비게이션 화살표 */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-30"
            aria-label="이전 슬라이드"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-30"
            aria-label="다음 슬라이드"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* 슬라이드 인디케이터 */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* 자동 재생 토글 */}
      {items.length > 1 && (
        <button
          onClick={togglePlayPause}
          className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-300 z-30"
          aria-label={isPlaying ? '자동 재생 일시 정지' : '자동 재생 시작'}
        >
          <Play className={`w-4 h-4 ${isPlaying ? 'opacity-50' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default BannerSlider;
