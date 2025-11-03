import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Star, Users, Clock, Zap, Play, Sparkles, Film, Image } from 'lucide-react';
import BannerSlider from './BannerSlider';
import { BannerItem } from '../../types/banner';
import SEO from './SEO';

interface DescriptionPageProps {
  onBack: () => void;
  onNext: () => void;
}

const DescriptionPage: React.FC<DescriptionPageProps> = ({ onBack, onNext }) => {
  // 배너 데이터 상태
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([
    {
      id: '1',
      type: 'image' as const,
      src: '/images/banner/a001.jpg',
      alt: 'AI 스토리보드 통합 플랫폼',
      title: '🎬 AI 스토리보드 통합 플랫폼',
      description: '스토리 입력부터 최종 영상까지, 전체 제작 과정을 AI가 통합 관리합니다'
    },
    {
      id: '2', 
      type: 'image' as const,
      src: '/images/banner/a002.jpg',
      alt: '지능형 프로젝트 관리',
      title: '🧠 지능형 프로젝트 관리',
      description: '에피소드 구조, 씬별 컷 구성, 캐릭터 설정을 AI가 자동으로 최적화합니다'
    },
    {
      id: '3',
      type: 'image' as const,
      src: '/images/banner/a003.jpg',
      alt: '멀티모달 콘텐츠 생성',
      title: '🎨 멀티모달 콘텐츠 생성',
      description: '텍스트, 이미지, 영상을 하나의 워크플로우로 연결하여 통합 제작합니다'
    },
    {
      id: '4',
      type: 'image' as const,
      src: '/images/banner/a004.jpg',
      alt: '프로페셔널 영상 제작',
      title: '🎥 프로페셔널 영상 제작',
      description: '컷별 시간 정보와 프롬프트를 연동하여 영화 수준의 정밀한 영상을 제작합니다'
    },
    {
      id: '5',
      type: 'image' as const,
      src: '/images/banner/a005.jpg',
      alt: '실시간 협업 도구',
      title: '⚡ 실시간 협업 도구',
      description: '프로젝트 참조, 백업 관리, 권한 제어까지 완벽한 제작 환경을 제공합니다'
    }
  ]);

  // 이미지 폴더 존재 여부 확인 및 배너 아이템 업데이트
  useEffect(() => {
    const checkBannerImages = async () => {
      const availableItems: BannerItem[] = [];
      
      // 실제 이미지 파일들
      const imageFiles = [
        { src: '/images/banner/a001.jpg', title: 'AI가 만드는 스토리보드', description: '텍스트만 입력하면 전문가 수준의 스토리보드를 자동 생성합니다' },
        { src: '/images/banner/a002.jpg', title: '다양한 캐릭터 생성', description: 'AI가 상상하는 캐릭터를 실시간으로 생성해보세요' },
        { src: '/images/banner/a003.jpg', title: '배경 이미지 생성', description: '스토리에 맞는 다양한 배경을 AI로 생성합니다' },
        { src: '/images/banner/a004.jpg', title: '설정 컷 생성', description: '핵심 장면을 설정 컷으로 만들어 영상의 흐름을 만듭니다' },
        { src: '/images/banner/a005.jpg', title: '고급 이미지 생성', description: '최신 AI 기술로 고품질 이미지를 생성합니다' },
        { src: '/images/banner/a006.jpg', title: '창의적 콘텐츠', description: '무한한 상상력을 현실로 만드는 AI 기술' },
        { src: '/images/banner/a007.jpg', title: '프로페셔널 결과', description: '전문가 수준의 고품질 결과물을 제공합니다' },
        { src: '/images/banner/a008.jpg', title: '혁신적인 기술', description: '최첨단 AI 기술로 새로운 경험을 제공합니다' },
        { src: '/images/banner/a009.jpg', title: '완성된 영상', description: '모든 요소가 조화롭게 어우러진 완성된 영상' },
        { src: '/images/banner/d03.jpg', title: '디자인 예시', description: '아름다운 디자인과 함께하는 스토리보드' }
      ];

      // YouTube Shorts 아이템들
      const youtubeItems = [
        { 
          videoId: 'bSvy6KDy7oE', 
          title: 'AI 스토리보드 데모', 
          description: 'YouTube에서 AI 스토리보드 생성 과정을 확인하세요',
          youtubeUrl: 'https://youtube.com/shorts/bSvy6KDy7oE?si=eZIAvkrrpbj58qm-'
        },
        { 
          videoId: 'XqNSj57iGU4', 
          title: '캐릭터 생성 과정', 
          description: 'AI가 캐릭터를 생성하는 과정을 YouTube에서 보세요',
          youtubeUrl: 'https://youtube.com/shorts/XqNSj57iGU4?si=jLqzJXjUj-ZQSFEM'
        },
        { 
          videoId: 'ahPzbn7hcYw', 
          title: '영상 제작 완성', 
          description: '최종 영상 제작 결과를 YouTube에서 확인하세요',
          youtubeUrl: 'https://youtube.com/shorts/ahPzbn7hcYw?si=qxw1RzAgjyBLf7YZ'
        }
      ];

      // 이미지 파일들 추가
      imageFiles.forEach((file, index) => {
        availableItems.push({
          id: `img-${index + 1}`,
          type: 'image' as const,
          src: file.src,
          alt: file.title,
          title: file.title,
          description: file.description
        });
      });

      // YouTube 아이템들 추가
      youtubeItems.forEach((item, index) => {
        availableItems.push({
          id: `youtube-${index + 1}`,
          type: 'youtube' as const,
          src: `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`,
          alt: `YouTube Shorts 영상 ${index + 1}`,
          title: item.title,
          description: item.description,
          youtubeUrl: item.youtubeUrl
        });
      });

      setBannerItems(availableItems);
    };

    checkBannerImages();
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI 기반 자동 생성",
      description: "텍스트만 입력하면 AI가 캐릭터, 배경, 영상을 자동으로 생성합니다"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "다양한 캐릭터",
      description: "다양한 스타일과 설정의 캐릭터를 무제한으로 생성할 수 있습니다"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "빠른 제작",
      description: "기존 영상 제작 시간의 1/10로 빠르게 스토리보드를 완성합니다"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "고품질 결과",
      description: "최신 AI 기술로 전문가 수준의 고품질 영상을 생성합니다"
    }
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "프로젝트 개요 작성",
      description: "스토리, 캐릭터, 배경에 대한 기본 정보를 입력합니다"
    },
    {
      step: "02", 
      title: "캐릭터 이미지 생성",
      description: "AI가 텍스트 설명을 바탕으로 캐릭터 이미지를 생성합니다"
    },
    {
      step: "03",
      title: "배경 및 설정 생성", 
      description: "스토리에 맞는 배경과 핵심 장면을 생성합니다"
    },
    {
      step: "04",
      title: "영상 제작",
      description: "생성된 모든 요소를 조합하여 완성된 영상을 만듭니다"
    },
    {
      step: "05",
      title: "스토리보드 생성",
      description: "AI 활용으로 이미지 및 시나리오 생성과 함께 스토리보드 문서편집 및 PDF 출력"
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <SEO 
        title="AI 소개 - 스토리보드 AI"
        description="StoryBoard AI의 주요 기능과 제작 과정을 소개합니다. AI 기반 자동 생성, 다양한 캐릭터 생성, 빠른 제작, 고품질 결과를 제공합니다."
        keywords="스토리보드AI소개, AI기능, 제작과정, 캐릭터생성, 배경생성, 영상제작, AI자동생성"
      />
      
      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto">
        {/* 메인 소개 텍스트 - 슬라이드 위에 위치 */}
        <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 py-16">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              AI로 만드는 스토리보드
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              복잡한 영상 제작 과정을 AI가 대신해드립니다. 
              텍스트만 입력하면 전문가 수준의 스토리보드와 영상을 자동으로 생성합니다.
          </p>
        </div>
      </div>

        {/* 배너 슬라이더 - 브라우저 100% 너비, 높이 1.3배 확대 */}
        <div className="w-full mb-16" style={{ height: 'calc(400px * 1.3)' }}>
          <BannerSlider 
            items={bannerItems}
            autoPlay={true}
            autoPlayInterval={4000}
          />
        </div>

        {/* 나머지 콘텐츠는 기존 컨테이너 사용 */}
        <div className="max-w-6xl mx-auto px-8 py-12">

          {/* 주요 기능 */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">
              주요 기능
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 text-blue-600">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-800">{feature.title}</h4>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
                                </div>
                              </div>

          {/* 워크플로우 */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">
              제작 과정
            </h3>
            <div className="space-y-8">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-8">
                    {step.step}
                                        </div>
                  <div className="flex-grow">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h4>
                    <p className="text-gray-600">{step.description}</p>
                                      </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="flex-shrink-0 ml-8">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                </div>
              ))}
            </div>
          </div>

          {/* 스토리보드 제작 기능 추가 예정 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-16">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-6">
                🚀 새로운 기능 추가 예정
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold mb-3">스토리보드 기반 AI영상</h4>
                  <p className="text-blue-100">
                    생성된 스토리보드를 기반으로 AI가 자동으로 영상을 제작하고, 고급 편집 기능으로 완성도를 높입니다
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold mb-3">협업 기능</h4>
                  <p className="text-blue-100">
                    팀원들과 실시간으로 스토리보드를 공유하고 함께 편집할 수 있습니다
                </p>
              </div>
                <div className="bg-white/20 rounded-xl p-6">
                  <h4 className="text-xl font-semibold mb-3">템플릿 라이브러리</h4>
                  <p className="text-blue-100">
                    다양한 장르와 스타일의 스토리보드 템플릿을 제공합니다
                </p>
              </div>
            </div>
              <p className="text-blue-100 text-lg">
                더 많은 기능이 곧 추가될 예정입니다!
              </p>
            </div>
          </div>

          {/* 장점 */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-800 text-center mb-12">
              왜 StoryBoard AI를 사용해야 할까요?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">간편한 사용법</h4>
                <p className="text-gray-600">복잡한 설정 없이 텍스트만 입력하면 됩니다</p>
        </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">셀프 코드</h4>
                <p className="text-gray-600">자신의 API Key 로 최적화된 AI 생성 기능을 사용합니다.</p>
                  </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">고품질</h4>
                <p className="text-gray-600">최신 AI 기술로 전문가 수준의 결과를 제공합니다</p>
            </div>
          </div>
        </div>

          {/* 하단 버튼 */}
          <div className="text-center mb-12">
            <button
              onClick={onNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl text-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center mx-auto"
            >
              시작하기
              <ArrowRight className="w-6 h-6 ml-3" />
            </button>
          </div>

          </div>
        </div>

      {/* 하단 고정 카피라이트 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-sm text-gray-500">
            영상 제작을 위한 스토리보드 AI 서비스입니다. © 2025{' '}
            <a 
              href="https://star612.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
              작은별612
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescriptionPage;