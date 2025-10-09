import React from 'react';
import Button from './Button';
import { LogIn, UserPlus, Shield } from 'lucide-react';

interface LoginOverlayProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin, onRegister }) => {
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">관리자 계정</h3>
            <p className="text-sm text-blue-700">
              관리자로 로그인하면 환경 변수의 API 키가 자동으로 적용됩니다.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              <p>관리자 계정으로 로그인하시면 별도의 API 키 설정 없이 모든 기능을 사용할 수 있습니다.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>로그인 후 AI API 키 입력 후 정상 사용할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};
