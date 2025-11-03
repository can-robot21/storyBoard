import React, { useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister
}) => {
  const [hideForWeek, setHideForWeek] = useState(false);

  const handleClose = () => {
    if (hideForWeek) {
      // 일주일간 감추기 로직
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 7);
      localStorage.setItem('welcomeModalHideUntil', hideUntil.toISOString());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        {/* 닫기 버튼 */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 웰컴 메시지 */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">스토리보드 AI</h2>
          <p className="text-gray-700 leading-relaxed">
            AI 기반 스토리보드 생성 도구에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 로그인/회원가입 버튼 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            로그인
          </button>
          <button
            onClick={onRegister}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            회원가입
          </button>
        </div>

        {/* 하단 옵션 */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={hideForWeek}
              onChange={(e) => setHideForWeek(e.target.checked)}
              className="mr-2"
            />
            일주일간 감추기
          </label>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
