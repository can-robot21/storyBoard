import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Star, Users, Clock, Zap } from 'lucide-react';

interface DescriptionPageProps {
  onBack: () => void;
  onNext: () => void;
}

const DescriptionPage: React.FC<DescriptionPageProps> = ({ onBack, onNext }) => {
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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              이전으로
            </button>
            <h1 className="text-2xl font-bold text-gray-800">StoryBoard AI 소개</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* 메인 소개 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            AI로 만드는 스토리보드
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            복잡한 영상 제작 과정을 AI가 대신해드립니다. 
            텍스트만 입력하면 전문가 수준의 스토리보드와 영상을 자동으로 생성합니다.
          </p>
        </div>

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
                <h4 className="text-xl font-semibold mb-3">고급 스토리보드 편집</h4>
                <p className="text-blue-100">
                  드래그 앤 드롭으로 스토리보드를 자유롭게 편집하고 재배치할 수 있습니다
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
            왜 StoryBoard AI를 선택해야 할까요?
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
              <h4 className="text-lg font-semibold text-gray-800 mb-2">빠른 결과</h4>
              <p className="text-gray-600">몇 분 안에 완성된 영상을 확인할 수 있습니다</p>
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
        <div className="text-center">
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
  );
};

export default DescriptionPage;
