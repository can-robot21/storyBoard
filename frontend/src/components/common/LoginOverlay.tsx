import React, { useState } from 'react';
import Button from './Button';
import { LogIn, UserPlus, Shield, Check } from 'lucide-react';

interface LoginOverlayProps {
  onLogin: () => void;
  onRegister: () => void;
  onDontShowToday?: () => void;
  onDontShowWeek?: () => void;
  onClose?: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin, onRegister, onDontShowToday, onDontShowWeek, onClose }) => {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [dontShowWeek, setDontShowWeek] = useState(false);

  const handleLoginClick = () => {
    // 첫 모달 닫기
    if (onClose) {
      onClose();
    }
    // 로그인 모달 열기
    setTimeout(() => {
      onLogin();
    }, 100);
  };

  const handleRegisterClick = () => {
    // 첫 모달 닫기
    if (onClose) {
      onClose();
    }
    // 회원가입 모달 열기
    setTimeout(() => {
      onRegister();
    }, 100);
  };

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

  const handleDontShowWeekChange = () => {
    setDontShowWeek(!dontShowWeek);
    if (onDontShowWeek) {
      onDontShowWeek();
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
            onClick={handleLoginClick}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            <LogIn className="w-5 h-5" />
            로그인
          </Button>
          
          <Button
            onClick={handleRegisterClick}
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            회원가입
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>로그인 후 AI API 키 입력 후 정상 사용할 수 있습니다.</p>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-6 space-y-3">
          {/* 체크박스 옵션들 */}
          <div className="flex flex-col gap-2">
            {/* 오늘은 그만보기 체크박스 */}
            <div className="flex items-center gap-2">
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
              <span className="text-xs text-gray-600">오늘은 그만보기</span>
            </div>

            {/* 일주일간 감추기 체크박스 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDontShowWeekChange}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  dontShowWeek 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {dontShowWeek && <Check className="w-3 h-3" />}
              </button>
              <span className="text-xs text-gray-600">일주일간 감추기</span>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
