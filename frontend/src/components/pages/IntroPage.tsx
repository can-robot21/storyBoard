import React from 'react';
import { Play, Sparkles, Film, Image, Zap } from 'lucide-react';

interface IntroPageProps {
  onStart: () => void;
}

const IntroPage: React.FC<IntroPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-8">
      {/* 메인 타이틀 */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <Film className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StoryBoard AI
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          AI 기반 스토리보드 생성 및 영상 제작 플랫폼
        </p>
        <p className="text-lg text-gray-500 max-w-3xl">
          텍스트만으로 캐릭터, 배경, 설정을 생성하고 완성된 영상을 만들어보세요
        </p>
      </div>

      {/* 2x2 기능 박스 */}
      <div className="grid grid-cols-2 gap-8 mb-12 max-w-4xl">
        {/* 캐릭터 생성 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">캐릭터 생성</h3>
          </div>
          <p className="text-gray-600 mb-4">
            AI가 텍스트 설명을 바탕으로 캐릭터 이미지를 자동 생성합니다
          </p>
          <div className="flex items-center text-sm text-blue-600">
            <Sparkles className="w-4 h-4 mr-2" />
            TXT2IMG 기술
          </div>
        </div>

        {/* 배경 생성 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <Image className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">배경 생성</h3>
          </div>
          <p className="text-gray-600 mb-4">
            다양한 배경 이미지를 AI로 생성하여 스토리에 맞는 환경을 만듭니다
          </p>
          <div className="flex items-center text-sm text-green-600">
            <Sparkles className="w-4 h-4 mr-2" />
            고품질 이미지 생성
          </div>
        </div>

        {/* 설정 컷 생성 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
              <Image className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">설정 컷 생성</h3>
          </div>
          <p className="text-gray-600 mb-4">
            스토리의 핵심 장면을 설정 컷으로 생성하여 영상의 흐름을 만듭니다
          </p>
          <div className="flex items-center text-sm text-purple-600">
            <Sparkles className="w-4 h-4 mr-2" />
            장면별 최적화
          </div>
        </div>

        {/* 영상 생성 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mr-4">
              <Film className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">영상 생성</h3>
          </div>
          <p className="text-gray-600 mb-4">
            생성된 이미지들을 조합하여 완성된 영상을 자동으로 제작합니다
          </p>
          <div className="flex items-center text-sm text-orange-600">
            <Zap className="w-4 h-4 mr-2" />
            AI 영상 생성
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl text-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center mx-auto"
        >
          <Play className="w-6 h-6 mr-3" />
          바로 시작하기
        </button>
        <p className="text-sm text-gray-500 mt-4">
          로그인 없이 바로 체험해보세요
        </p>
      </div>

      {/* 하단 정보 */}
      <div className="mt-16 text-center">
        <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-6">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            무료 체험
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            AI 기반
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            실시간 생성
          </div>
        </div>
        
        {/* 서비스 정보 */}
        <div className="text-sm text-gray-400">
          <p className="mb-2">작은별 612의 스토리보드 AI 서비스입니다.</p>
          <p>
            <a 
              href="https://star612.net" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors underline"
            >
              star612.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
