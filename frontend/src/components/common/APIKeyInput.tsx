import React, { useState } from 'react';
import Button from './Button';
import { Key, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';

interface APIKeyInputProps {
  currentUser: any;
  onSave: (apiKeys: any) => void;
  onRefresh: () => void;
}

export const APIKeyInput: React.FC<APIKeyInputProps> = ({ 
  currentUser, 
  onSave, 
  onRefresh 
}) => {
  const [apiKeys, setApiKeys] = useState({
    google: currentUser?.apiKeys?.google || '',
    openai: currentUser?.apiKeys?.openai || '',
    midjourney: currentUser?.apiKeys?.midjourney || '',
    anthropic: currentUser?.apiKeys?.anthropic || ''
  });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(apiKeys);
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser?.email === 'star612.net@gmail.com';

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
          <Key className="w-5 h-5" />
          API 키 설정
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-700">
            🎉 관리자 계정으로 로그인했습니다. 환경 변수의 API 키가 자동으로 적용됩니다.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Google AI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google AI (Gemini)
          </label>
          <div className="relative">
            <input
              type={showKeys.google ? 'text' : 'password'}
              value={apiKeys.google}
              onChange={(e) => handleKeyChange('google', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="Google AI API 키를 입력하세요"
            />
            <button
              type="button"
              onClick={() => toggleKeyVisibility('google')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isAdmin && apiKeys.google && (
            <p className="text-xs text-green-600 mt-1">✅ 환경 변수에서 자동 로드됨</p>
          )}
        </div>

        {/* OpenAI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            OpenAI
          </label>
          <div className="relative">
            <input
              type={showKeys.openai ? 'text' : 'password'}
              value={apiKeys.openai}
              onChange={(e) => handleKeyChange('openai', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="OpenAI API 키를 입력하세요"
            />
            <button
              type="button"
              onClick={() => toggleKeyVisibility('openai')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isAdmin && apiKeys.openai && (
            <p className="text-xs text-green-600 mt-1">✅ 환경 변수에서 자동 로드됨</p>
          )}
        </div>

        {/* Midjourney */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Midjourney
          </label>
          <div className="relative">
            <input
              type={showKeys.midjourney ? 'text' : 'password'}
              value={apiKeys.midjourney}
              onChange={(e) => handleKeyChange('midjourney', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="Midjourney API 키를 입력하세요"
            />
            <button
              type="button"
              onClick={() => toggleKeyVisibility('midjourney')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKeys.midjourney ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Anthropic */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anthropic
          </label>
          <div className="relative">
            <input
              type={showKeys.anthropic ? 'text' : 'password'}
              value={apiKeys.anthropic}
              onChange={(e) => handleKeyChange('anthropic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="Anthropic API 키를 입력하세요"
            />
            <button
              type="button"
              onClick={() => toggleKeyVisibility('anthropic')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {isAdmin && apiKeys.anthropic && (
            <p className="text-xs text-green-600 mt-1">✅ 환경 변수에서 자동 로드됨</p>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 API 키는 안전하게 암호화되어 저장됩니다.</p>
        <p>🔒 관리자 계정은 환경 변수의 키값이 자동으로 적용됩니다.</p>
      </div>
    </div>
  );
};
