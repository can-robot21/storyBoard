import React, { useState, useEffect } from 'react';

interface IntroPageProps {
  onNext: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onNext }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [filteredSlides, setFilteredSlides] = useState<any[]>([]);

  // 원본 슬라이드 데이터 (순서상 이미지 7개까지, 가로형 이미지만 필터링됨)
  const originalSlides = [
    {
      id: 1,
      image: '/images/banner/a001.jpg',
      title: 'AI 기반 스토리보드 생성',
      description: '텍스트만 입력하면 전문가 수준의 스토리보드를 자동 생성합니다'
    },
    {
      id: 2,
      image: '/images/banner/a002.jpg',
      title: '다양한 캐릭터 생성',
      description: '상상 속의 캐릭터를 현실로 만들어보세요'
    },
    {
      id: 3,
      image: '/images/banner/a003.jpg',
      title: '배경 및 환경 생성',
      description: '스토리에 맞는 완벽한 배경을 AI가 생성합니다'
    },
    {
      id: 4,
      image: '/images/banner/a004.jpg',
      title: '영상 제작의 새로운 패러다임',
      description: 'AI가 생성한 이미지로 완성도 높은 영상을 제작하세요'
    },
    {
      id: 5,
      image: '/images/banner/a005.jpg',
      title: '고급 이미지 생성',
      description: '최신 AI 기술로 고품질 이미지를 생성합니다'
    },
    {
      id: 6,
      image: '/images/banner/a006.jpg',
      title: '프로젝트 관리 및 저장',
      description: '생성한 스토리보드를 체계적으로 관리하고 저장하세요'
    },
    {
      id: 7,
      image: '/images/banner/a007.jpg',
      title: 'PDF 및 이미지 출력',
      description: '완성된 스토리보드를 PDF나 이미지로 출력하여 공유하세요'
    }
  ];

  // 이미지 가로폭 필터링 함수
  const checkImageAspectRatio = (imageSrc: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // 가로폭이 세로폭보다 크거나 같은 경우만 통과 (가로형 이미지)
        const isLandscape = img.width >= img.height;
        resolve(isLandscape);
      };
      img.onerror = () => {
        // 이미지 로드 실패 시 스킵
        resolve(false);
      };
      img.src = imageSrc;
    });
  };

  // 이미지 필터링 및 슬라이드 설정
  useEffect(() => {
    const filterSlides = async () => {
      const validSlides = [];
      
      for (const slide of originalSlides) {
        const isValid = await checkImageAspectRatio(slide.image);
        if (isValid) {
          validSlides.push(slide);
        }
      }
      
      setFilteredSlides(validSlides);
    };

    filterSlides();
  }, []);

  // 자동 슬라이드 기능
  useEffect(() => {
    if (!isAutoPlay || filteredSlides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
    }, 4000); // 4초마다 슬라이드 변경

    return () => clearInterval(interval);
  }, [isAutoPlay, filteredSlides.length]);

  // 슬라이드 변경 함수
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 2000); // 2초 후 자동 재생 재개
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 2000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + filteredSlides.length) % filteredSlides.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 2000);
  };

  // 필터링된 슬라이드가 없으면 로딩 표시
  if (filteredSlides.length === 0) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-2xl">이미지를 로딩 중...</div>
      </div>
    );
  }

  const currentSlideData = filteredSlides[currentSlide];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* 슬라이드 컨테이너 */}
      <div className="relative w-full h-full">
        {/* 배경 이미지 */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{
            backgroundImage: `url(${currentSlideData.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* 이미지 오버레이 */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white z-10 max-w-4xl mx-auto px-6">
            {/* 메인 타이틀 */}
            <h1 className="text-6xl md:text-7xl font-bold mb-8 drop-shadow-lg">
              StoryBoard AI
            </h1>
            
            {/* 슬라이드별 콘텐츠 */}
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 drop-shadow-lg">
                {currentSlideData.title}
              </h2>
              <p className="text-2xl md:text-3xl opacity-90 drop-shadow-lg">
                {currentSlideData.description}
              </p>
            </div>


            {/* 시작하기 버튼 */}
            <button
              onClick={onNext}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-12 py-6 rounded-lg font-semibold text-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              시작하기 &gt;
            </button>
          </div>
        </div>

        {/* 네비게이션 화살표 */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all duration-300 z-20"
          aria-label="이전 슬라이드"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-4 rounded-full transition-all duration-300 z-20"
          aria-label="다음 슬라이드"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 슬라이드 인디케이터 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          {filteredSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
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
          className="absolute top-6 right-6 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-300 z-20"
          aria-label={isAutoPlay ? '자동 재생 일시 정지' : '자동 재생 시작'}
        >
          {isAutoPlay ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default IntroPage;
