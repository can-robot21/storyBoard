import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle } from 'lucide-react';
import { AISelector } from './AISelector';
import Modal from './Modal';
import Button from './Button';
import { AIProvider } from '../../types/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  onSave: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  selectedProvider,
  onProviderChange,
  onSave
}) => {
  const [apiKeys, setApiKeys] = useState({
    google: process.env.REACT_APP_GEMINI_API_KEY || '',
    openai: process.env.REACT_APP_OPENAI_API_KEY || '',
    chatgpt: process.env.REACT_APP_OPENAI_API_KEY || '',
    anthropic: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
    'nano-banana': process.env.REACT_APP_GEMINI_API_KEY || '' // 나노 바나나는 Google AI 키 사용
  });

  const [showApiKeys, setShowApiKeys] = useState(false);
  // Prefill from localStorage for non-admin users
  try {
    // lightweight guard to avoid SSR issues
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_api_keys');
      if (saved && !apiKeys.google && !apiKeys.openai && !apiKeys.chatgpt && !apiKeys.anthropic) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // prefill from saved keys without overriding env defaults if already present
          apiKeys.google = apiKeys.google || parsed.google || '';
          apiKeys.openai = apiKeys.openai || parsed.openai || '';
          (apiKeys as any)['nano-banana'] = (apiKeys as any)['nano-banana'] || parsed['nano-banana'] || '';
          apiKeys.chatgpt = apiKeys.chatgpt || parsed.chatgpt || '';
          apiKeys.anthropic = apiKeys.anthropic || parsed.anthropic || '';
        }
      }
    }
  } catch {}

  // Save to localStorage on change
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_api_keys', JSON.stringify(apiKeys));
    }
  } catch {}

  const handleApiKeyChange = (provider: AIProvider, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSave = () => {
    // 실제로는 환경변수를 직접 수정할 수 없으므로
    // 사용자에게 .env 파일을 수정하도록 안내
    onSave();
    onClose();
  };

  const getApiKeyStatus = (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (!key || key.trim() === '') {
      return { status: 'missing', text: 'API 키 없음', color: 'text-red-500' };
    }
    if (key.includes('your-') || key.includes('-here')) {
      return { status: 'placeholder', text: '플레이스홀더', color: 'text-yellow-500' };
    }
    return { status: 'valid', text: '설정됨', color: 'text-green-500' };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 서비스 설정"
      size="lg"
    >
      <div className="space-y-6">
        {/* AI 서비스 선택 */}
        <div>
          <AISelector
            selectedProvider={selectedProvider}
            onProviderChange={onProviderChange}
          />
        </div>

        {/* API 키 설정 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API 키 설정
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? '숨기기' : '보기'}
            </Button>
          </div>

          {showApiKeys && (
            <div className="space-y-4">
              {(['google', 'openai', 'chatgpt', 'anthropic', 'nano-banana'] as AIProvider[]).map((provider) => {
                const keyStatus = getApiKeyStatus(provider);
                const isSelected = selectedProvider === provider;
                
                return (
                  <div
                    key={provider}
                    className={`p-4 rounded-lg border-2 ${
                      isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 capitalize">
                          {provider === 'google' ? 'Google AI' :
                           provider === 'openai' ? 'OpenAI' :
                           provider === 'chatgpt' ? 'ChatGPT' :
                           provider === 'anthropic' ? 'Anthropic' : '나노 바나나'}
                        </h4>
                        <div className={`flex items-center gap-1 ${keyStatus.color}`}>
                          {keyStatus.status === 'valid' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span className="text-sm">{keyStatus.text}</span>
                        </div>
                      </div>
                    </div>
                    
                    <input
                      type="password"
                      value={apiKeys[provider]}
                      onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                      placeholder={`${provider.toUpperCase()} API 키를 입력하세요`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">API 키 설정 방법:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>프로젝트 루트에 <code>.env</code> 파일을 생성하세요</li>
                  <li><code>env.example</code> 파일을 참고하여 API 키를 설정하세요</li>
                  <li>개발 서버를 재시작하세요</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>
            설정 저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AISettingsModal;
