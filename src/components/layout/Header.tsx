import React from 'react';
import { Settings, Bot } from 'lucide-react';

interface HeaderProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onAISettingsClick?: () => void;
  selectedAIProvider?: string;
}

const mainSteps = [
  "프로젝트 개요",
  "이미지 생성", 
  "이미지 생성/나노 바나나",
  "영상 생성",
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onStepChange,
  isLoggedIn,
  onLogin,
  onLogout,
  onAISettingsClick,
  selectedAIProvider = 'google'
}) => {
  return (
    <header className="w-full bg-white shadow-md px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">🎬 AI 영상 프로젝트</h1>

      <nav className="flex gap-2">
        {mainSteps.map((step) => (
          <button
            key={step}
            onClick={() => onStepChange(step)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentStep === step
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {step}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* AI 서비스 표시 및 설정 버튼 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
            <Bot className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {selectedAIProvider === 'google' ? 'Google AI' : 
               selectedAIProvider === 'openai' ? 'OpenAI' : selectedAIProvider}
            </span>
          </div>
          {onAISettingsClick && (
            <button
              onClick={onAISettingsClick}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title="AI 서비스 설정"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 로그인/로그아웃 버튼 */}
        {isLoggedIn ? (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            로그아웃
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
};
