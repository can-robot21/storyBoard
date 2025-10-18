import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onProfileClick?: () => void;
  onRegister?: () => void;
  onTitleClick?: () => void;
  currentUser?: {
    name: string;
    email: string;
  } | null;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  onLogin,
  onLogout,
  onProfileClick,
  onRegister,
  onTitleClick,
  currentUser
}) => {
  return (
    <header className="w-full bg-gradient-to-r from-blue-50 to-purple-50 shadow-md px-6 py-3 flex justify-between items-center border-b border-gray-200">
      <button
        onClick={onTitleClick}
        className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors cursor-pointer"
      >
        🎬 영상/스토리보드 AI
      </button>

      <div className="flex items-center gap-3">
        {/* 로그인/로그아웃 버튼 */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">{currentUser?.name || '사용자'}</span>
            </div>
            {onProfileClick && (
              <button
                onClick={onProfileClick}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                프로필
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              로그인
            </button>
            <button
              onClick={onRegister}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              회원가입
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
