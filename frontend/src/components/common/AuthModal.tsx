import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User as UserIcon, Mail, Lock, Key } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { User, LoginCredentials, RegisterData } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register' | 'profile';
  onSuccess: (user: User, needsMigration?: boolean) => void;
  currentUser?: User | null;
  onAccountDeletion?: () => void;
  onModeChange?: (mode: 'login' | 'register' | 'profile') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSuccess,
  currentUser,
  onAccountDeletion,
  onModeChange
}) => {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    apiKeys: {
      google: '',
      openai: '',
      midjourney: '',
      anthropic: ''
    }
  });
  const [loginData, setLoginData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 모달이 열릴 때 현재 사용자 정보로 폼 초기화
  useEffect(() => {
    if (isOpen && mode === 'profile' && currentUser) {
      setFormData({
        name: currentUser.name,
        email: currentUser.email,
        password: '', // 비밀번호는 빈 문자열로 유지
        apiKeys: { ...currentUser.apiKeys }
      });
    } else if (isOpen && mode !== 'profile') {
      // 로그인/회원가입 모드일 때 폼 초기화
      setFormData({
        name: '',
        email: '',
        password: '',
        apiKeys: {
          google: '',
          openai: '',
          midjourney: '',
          anthropic: ''
        }
      });
      setLoginData({
        email: '',
        password: ''
      });
    }
    setError('');
    setSuccess('');
  }, [isOpen, mode, currentUser]);

  const handleInputChange = (field: string, value: string) => {
    if (mode === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      if (field.startsWith('apiKeys.')) {
        const key = field.split('.')[1];
        setFormData(prev => ({
          ...prev,
          apiKeys: {
            ...prev.apiKeys,
            [key]: value
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    }
    setError('');
  };

  const validateForm = (): boolean => {
    if (mode === 'login') {
      if (!loginData.email || !loginData.password) {
        setError('이메일과 비밀번호를 입력해주세요.');
        return false;
      }
      if (!AuthService.validateEmail(loginData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return false;
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setError('이름, 이메일, 비밀번호는 필수 입력 항목입니다.');
        return false;
      }
      if (!AuthService.validateEmail(formData.email)) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return false;
      }
      if (!AuthService.validatePassword(formData.password)) {
        setError('비밀번호는 6자 이상 입력해주세요.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      let result: { success: boolean; user?: User; message?: string };
      if (mode === 'login') {
        result = await AuthService.login(loginData);
      } else if (mode === 'register') {
        result = await AuthService.register(formData);
      } else {
        // 프로필 수정
        result = await AuthService.updateUser(currentUser!.id, formData);
      }

      if (result.success && result.user) {
        setSuccess(mode === 'login' ? '로그인되었습니다.' : 
                  mode === 'register' ? '회원가입이 완료되었습니다.' : 
                  '회원정보가 수정되었습니다.');
        setTimeout(() => {
          onSuccess(result.user!, (result as any).needsMigration);
          onClose();
        }, 1000);
      } else {
        setError(result.message || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return '로그인';
      case 'register': return '회원가입';
      case 'profile': return '회원정보 수정';
      default: return '';
    }
  };

  const getSubmitText = () => {
    switch (mode) {
      case 'login': return '로그인';
      case 'register': return '회원가입';
      case 'profile': return '수정하기';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // 모든 모드에서 배경 클릭으로 닫기 허용
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
          {/* 모든 모드에서 닫기 버튼 표시 */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 로그인 폼 */}
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 회원가입/프로필 수정 폼 */}
          {(mode === 'register' || mode === 'profile') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={mode === 'profile' ? '새 비밀번호 (변경하지 않으려면 비워두세요)' : '비밀번호를 입력하세요'}
                    required={mode === 'register'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* API 키 섹션 */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API 키 (선택사항)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Google AI</label>
                    <input
                      type="password"
                      value={formData.apiKeys.google || ''}
                      onChange={(e) => handleInputChange('apiKeys.google', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Google AI API 키"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">ChatGPT</label>
                    <input
                      type="password"
                      value={formData.apiKeys.openai || ''}
                      onChange={(e) => handleInputChange('apiKeys.openai', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="ChatGPT API 키"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Midjourney</label>
                    <input
                      type="password"
                      value={formData.apiKeys.midjourney || ''}
                      onChange={(e) => handleInputChange('apiKeys.midjourney', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Midjourney API 키"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Anthropic</label>
                    <input
                      type="password"
                      value={formData.apiKeys.anthropic || ''}
                      onChange={(e) => handleInputChange('apiKeys.anthropic', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Anthropic API 키"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 오류/성공 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '처리 중...' : getSubmitText()}
          </button>

          {/* 회원가입 링크 (로그인 모드일 때만) */}
          {mode === 'login' && (
            <div className="text-center text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => {
                  onModeChange?.('register');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                회원가입
              </button>
            </div>
          )}

          {/* 로그인 링크 (회원가입 모드일 때만) */}
          {mode === 'register' && (
            <div className="text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => {
                  onModeChange?.('login');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                로그인
              </button>
            </div>
          )}

          {/* 계정 삭제 버튼 (프로필 모드일 때만) */}
          {mode === 'profile' && onAccountDeletion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onAccountDeletion}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                계정 삭제
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
