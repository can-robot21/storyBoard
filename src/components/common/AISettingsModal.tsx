import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, BarChart3, Eye, EyeOff } from 'lucide-react';
import { AISelector } from './AISelector';
import Modal from './Modal';
import Button from './Button';
import { AIProvider } from '../../types/ai';
import TokenCalculator from '../../utils/tokenCalculator';

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
  const [showApiUsage, setShowApiUsage] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    callsByType: {} as { [key: string]: number },
    callsByModel: {} as { [key: string]: number }
  });

  const tokenCalculator = TokenCalculator.getInstance();

  // API 사용량 통계 업데이트 (이벤트 기반으로 변경)
  useEffect(() => {
    const updateStats = () => {
      setSessionStats(tokenCalculator.getCurrentSessionStats());
    };

    // 초기 로드
    updateStats();

    // 이벤트 기반 업데이트로 변경 (주기적 호출 제거)
    const handleApiCall = () => {
      updateStats();
    };

    // API 호출 시에만 업데이트
    window.addEventListener('apiCallCompleted', handleApiCall);
    window.addEventListener('apiCallFailed', handleApiCall);

    return () => {
      window.removeEventListener('apiCallCompleted', handleApiCall);
      window.removeEventListener('apiCallFailed', handleApiCall);
    };
  }, [tokenCalculator]);

  const formatCost = (cost: number): string => {
    if (cost < 0.001) return '< $0.001';
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const handleClearSession = () => {
    tokenCalculator.clearSession();
    setSessionStats({
      totalCalls: 0,
      totalTokens: 0,
      totalCost: 0,
      callsByType: {},
      callsByModel: {}
    });
  };
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

        {/* API 사용량 통계 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              API 사용량 통계
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiUsage(!showApiUsage)}
            >
              {showApiUsage ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  감추기
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  보이기
                </>
              )}
            </Button>
          </div>

          {showApiUsage && (
            <div className="space-y-4">
              {/* 요약 통계 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 font-medium text-sm">총 호출</div>
                  <div className="text-blue-800 text-xl font-bold">{sessionStats.totalCalls}회</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 font-medium text-sm">총 토큰</div>
                  <div className="text-green-800 text-xl font-bold">{formatTokens(sessionStats.totalTokens)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 font-medium text-sm">총 비용</div>
                  <div className="text-purple-800 text-xl font-bold">{formatCost(sessionStats.totalCost)}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-orange-600 font-medium text-sm">평균 토큰</div>
                  <div className="text-orange-800 text-xl font-bold">
                    {sessionStats.totalCalls > 0 
                      ? formatTokens(Math.round(sessionStats.totalTokens / sessionStats.totalCalls))
                      : '0'
                    }
                  </div>
                </div>
              </div>

              {/* 타입별 통계 */}
              {Object.keys(sessionStats.callsByType).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">타입별 호출</h4>
                  <div className="space-y-2">
                    {Object.entries(sessionStats.callsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">
                          {type === 'text' ? '📝 텍스트' : 
                           type === 'image' ? '🖼️ 이미지' : 
                           type === 'video' ? '🎬 영상' : type}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 모델별 통계 */}
              {Object.keys(sessionStats.callsByModel).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">모델별 호출</h4>
                  <div className="space-y-2">
                    {Object.entries(sessionStats.callsByModel).map(([model, count]) => (
                      <div key={model} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600 truncate">{model}</span>
                        <span className="text-sm font-medium text-gray-800">{count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSession}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  세션 초기화
                </Button>
              </div>
            </div>
          )}
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
