import React, { useState } from 'react';
import Button from './Button';
import { LogIn, UserPlus, Shield, Key, Check } from 'lucide-react';

interface LoginOverlayProps {
  onLogin: () => void;
  onRegister: () => void;
  onDontShowToday?: () => void;
  onClose?: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin, onRegister, onDontShowToday, onClose }) => {
  const [dontShowToday, setDontShowToday] = useState(false);

  const handleDontShowTodayChange = () => {
    setDontShowToday(!dontShowToday);
    if (onDontShowToday) {
      onDontShowToday();
    }
    // 체크박스 클릭 시 모달 닫기
    if (onClose) {
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">스토리보드 AI</h2>
          <p className="text-gray-600">
            AI 기반 스토리보드 생성 도구에 오신 것을 환영합니다
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={onLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            <LogIn className="w-5 h-5" />
            로그인
          </Button>
          
          <Button
            onClick={onRegister}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            회원가입
          </Button>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Key className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-800">API 키 설정 안내</h3>
            </div>
            <p className="text-sm text-green-700 mb-2">
              개인 Google AI API 키를 설정하면 모든 기능을 사용할 수 있습니다.
            </p>
            <div className="text-xs text-green-600">
              <p>• 이미지 생성, 텍스트 생성, 영상 생성 등 모든 AI 기능 사용 가능</p>
              <p>• 로그인 후 우측 상단 설정 버튼에서 API 키 입력</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>로그인 후 AI API 키 입력 후 정상 사용할 수 있습니다.</p>
        </div>

        {/* 오늘 그만보기 체크박스 */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={handleDontShowTodayChange}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              dontShowToday 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {dontShowToday && <Check className="w-3 h-3" />}
          </button>
          <span className="text-xs text-gray-600">오늘 그만보기</span>
        </div>
      </div>
    </div>
  );
};
