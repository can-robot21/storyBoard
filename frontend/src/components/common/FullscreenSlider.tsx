import React, { useState, useEffect } from 'react';

interface SlideItem {
  id: string;
  type: 'image' | 'youtube';
  src?: string;
  title: string;
  description: string;
  youtubeId?: string;
}

interface FullscreenSliderProps {
  onStartClick: () => void;
}

const FullscreenSlider: React.FC<FullscreenSliderProps> = ({ onStartClick }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // 슬라이드 데이터
  const slides: SlideItem[] = [
    {
      id: '1',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1489599808082-2b0b0a8b8b8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: 'AI 기반 스토리보드 생성',
      description: '텍스트만 입력하면 전문가 수준의 스토리보드를 자동 생성합니다'
    },
    {
      id: '2',
      type: 'youtube',
      youtubeId: 'dQw4w9WgXcQ', // 예시 YouTube ID
      title: '영상 제작의 새로운 패러다임',
      description: 'AI가 생성한 이미지로 완성도 높은 영상을 제작하세요'
    },
    {
      id: '3',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: '다양한 캐릭터 생성',
      description: '상상 속의 캐릭터를 현실로 만들어보세요'
    },
    {
      id: '4',
      type: 'image',
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      title: '배경 및 환경 생성',
      description: '스토리에 맞는 완벽한 배경을 AI가 생성합니다'
    }
  ];

  // 자동 슬라이드 기능
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5초마다 슬라이드 변경

    return () => clearInterval(interval);
  }, [isAutoPlay, slides.length]);

  // 슬라이드 변경 함수
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false); // 수동 조작 시 자동 재생 일시 정지
  };

  // 다음 슬라이드
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  // 이전 슬라이드
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  // 현재 슬라이드 데이터
  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 슬라이드 컨테이너 */}
      <div className="relative w-full h-full">
        {/* 배경 이미지/비디오 */}
        <div className="absolute inset-0">
          {currentSlideData.type === 'image' ? (
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${currentSlideData.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* 이미지 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            </div>
          ) : (
            <div className="w-full h-full">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${currentSlideData.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${currentSlideData.youtubeId}&controls=0&showinfo=0&rel=0`}
                title={currentSlideData.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              {/* YouTube 오버레이 */}
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            </div>
          )}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white z-10 max-w-4xl mx-auto px-6">
            {/* 메인 타이틀 */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              StoryBoard AI
            </h1>
            
            {/* 슬라이드별 콘텐츠 */}
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 drop-shadow-lg">
                {currentSlideData.title}
              </h2>
              <p className="text-xl md:text-2xl opacity-90 drop-shadow-lg">
                {currentSlideData.description}
              </p>
            </div>

            {/* 바로 시작하기 배너 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 inline-block">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-3">바로 시작하기</h3>
                <p className="text-lg mb-4 opacity-90">사용자 AI API 키로 사용하는 사이트 입니다.</p>
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                  <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">무료 체험</span>
                  <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">AI 기반</span>
                  <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">실시간 생성</span>
                </div>
              </div>
            </div>

            {/* 시작하기 버튼 */}
            <button
              onClick={onStartClick}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              시작하기 &gt;
            </button>
          </div>
        </div>

        {/* 네비게이션 화살표 */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-20"
          aria-label="이전 슬라이드"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-20"
          aria-label="다음 슬라이드"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 슬라이드 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>

        {/* 자동 재생 토글 */}
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-300 z-20"
          aria-label={isAutoPlay ? '자동 재생 일시 정지' : '자동 재생 시작'}
        >
          {isAutoPlay ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default FullscreenSlider;
