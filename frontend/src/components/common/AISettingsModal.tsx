import React, { useState, useEffect } from 'react';
import { Key, AlertCircle, CheckCircle, BarChart3, Eye, EyeOff, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { AISelector } from './AISelector';
import Modal from './Modal';
import Button from './Button';
import { AIProvider, FunctionBasedAIProviders, GenerationType } from '../../types/ai';
import { AIProviderSettings } from '../../utils/aiProviderSettings';
import TokenCalculator from '../../utils/tokenCalculator';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  onSave: () => void;
  functionBasedProviders?: FunctionBasedAIProviders;
  onFunctionBasedProvidersChange?: (providers: FunctionBasedAIProviders) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  selectedProvider,
  onProviderChange,
  onSave,
  functionBasedProviders,
  onFunctionBasedProvidersChange
}) => {
  const [apiKeys, setApiKeys] = useState({
    google: '',
    chatgpt: '',
    anthropic: '',
    kling: '',
    klingSecret: '' // Kling AI Secret Key
  });

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showApiUsage, setShowApiUsage] = useState(false);
  
  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 기능별 AI Provider 설정
  const [functionProviders, setFunctionProviders] = useState<FunctionBasedAIProviders>(
    functionBasedProviders || AIProviderSettings.load()
  );
  
  const [showFunctionBasedSettings, setShowFunctionBasedSettings] = useState(false);
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
  // 로그인 상태 확인 및 API 키 로드
  useEffect(() => {
    const loadApiKeys = () => {
      try {
        if (typeof window !== 'undefined') {
          // 현재 사용자 확인
          const currentUserRaw = localStorage.getItem('storyboard_current_user');
          const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
          
          // 로그인 상태 업데이트
          setIsLoggedIn(!!currentUser);
          
          // 로그인하지 않은 경우 API 키 로드 안함 및 입력창 숨김
          if (!currentUser) {
            console.log('🔑 AI 설정: 로그인하지 않은 사용자 - API 키 로드 안함');
            setShowApiKeys(false); // 입력창 숨김
            return;
          }
          
          // 로그인한 사용자만 API 키 로드
          const saved = localStorage.getItem('user_api_keys');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
              setApiKeys(prev => ({
                ...prev,
                google: prev.google || parsed.google || currentUser?.apiKeys?.google || '',
                chatgpt: prev.chatgpt || parsed.chatgpt || currentUser?.apiKeys?.openai || '',
                anthropic: prev.anthropic || parsed.anthropic || currentUser?.apiKeys?.anthropic || '',
                kling: prev.kling || parsed.kling || currentUser?.apiKeys?.kling || '',
                klingSecret: prev.klingSecret || parsed.klingSecret || currentUser?.apiKeys?.klingSecret || ''
              }));
            }
          } else if (currentUser?.apiKeys) {
            // localStorage에 없으면 사용자 DB에서 로드
            setApiKeys(prev => ({
              ...prev,
              google: prev.google || currentUser.apiKeys.google || '',
              chatgpt: prev.chatgpt || currentUser.apiKeys.openai || '',
              anthropic: prev.anthropic || currentUser.apiKeys.anthropic || '',
              kling: prev.kling || currentUser.apiKeys.kling || '',
              klingSecret: prev.klingSecret || currentUser.apiKeys.klingSecret || ''
            }));
          }
        }
      } catch (error) {
        console.error('API 키 로드 오류:', error);
      }
    };
    
    loadApiKeys();
  }, [isOpen]); // 모달이 열릴 때만 실행

  // 로그인한 사용자만 localStorage에 저장
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // 현재 사용자 확인
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        
        // 로그인한 사용자만 저장
        if (currentUser) {
          localStorage.setItem('user_api_keys', JSON.stringify(apiKeys));
        }
      }
    } catch (error) {
      console.error('API 키 저장 오류:', error);
    }
  }, [apiKeys]);

  const handleApiKeyChange = (provider: AIProvider | 'klingSecret', value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const handleSave = () => {
    // 기능별 AI Provider 설정 저장
    if (onFunctionBasedProvidersChange) {
      AIProviderSettings.save(functionProviders);
      onFunctionBasedProvidersChange(functionProviders);
    }
    
    // 실제로는 환경변수를 직접 수정할 수 없으므로
    // 사용자에게 .env 파일을 수정하도록 안내
    onSave();
    onClose();
  };

  const handleFunctionProviderChange = (type: GenerationType, provider: AIProvider) => {
    setFunctionProviders(prev => ({
      ...prev,
      [type]: provider
    }));
  };

  const getProviderDisplayName = (provider: AIProvider): string => {
    switch (provider) {
      case 'google': return 'Google AI';
      case 'chatgpt': return 'ChatGPT (OpenAI)';
      case 'anthropic': return 'Anthropic (Claude)';
      case 'kling': return 'Kling AI';
      default: return provider;
    }
  };

  const getApiKeyStatus = (provider: AIProvider) => {
    const key = apiKeys[provider];
    if (!key || key.trim() === '') {
      return { status: 'missing', text: 'API 키 없음', color: 'text-red-500' };
    }
    if (key.includes('your-') || key.includes('-here')) {
      return { status: 'placeholder', text: '플레이스홀더', color: 'text-yellow-500' };
    }
    
    // Kling AI의 경우 Access Key와 Secret Key 모두 확인
    if (provider === 'kling') {
      const secretKey = apiKeys.klingSecret;
      if (!secretKey || secretKey.trim() === '') {
        return { status: 'incomplete', text: 'Secret Key 필요', color: 'text-yellow-500' };
      }
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
            apiKeys={apiKeys}
          />
        </div>

        {/* 기능별 AI Provider 설정 */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Key className="w-5 h-5" />
              기능별 AI 서비스 설정
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFunctionBasedSettings(!showFunctionBasedSettings)}
            >
              {showFunctionBasedSettings ? '숨기기' : '보기'}
            </Button>
          </div>

          {showFunctionBasedSettings && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  각 생성 기능(텍스트/이미지/영상)에 사용할 AI 서비스를 개별적으로 선택할 수 있습니다.
                </p>
              </div>

              {/* 텍스트 생성 AI */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">텍스트 생성</h4>
                    <p className="text-xs text-gray-500">프로젝트 개요, 캐릭터 설명 등 텍스트 생성에 사용</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['google', 'chatgpt', 'anthropic'] as AIProvider[]).map((provider) => {
                    const isSelected = functionProviders.text === provider;
                    const hasApiKey = provider === 'anthropic' 
                      ? false // 준비중
                      : !!(apiKeys[provider] && apiKeys[provider].trim() !== '' && 
                           !apiKeys[provider].includes('your-') && 
                           !apiKeys[provider].includes('-here'));
                    return (
                      <button
                        key={provider}
                        onClick={() => hasApiKey && handleFunctionProviderChange('text', provider)}
                        disabled={!hasApiKey}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          !hasApiKey
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={!hasApiKey ? `${getProviderDisplayName(provider)} API 키가 필요합니다` : ''}
                      >
                        {getProviderDisplayName(provider)}
                        {!hasApiKey && ' (키 필요)'}
                        {provider === 'anthropic' && ' (준비중)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 이미지 생성 AI */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">이미지 생성</h4>
                    <p className="text-xs text-gray-500">캐릭터, 배경 등 이미지 생성에 사용</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['google', 'chatgpt'] as AIProvider[]).map((provider) => {
                    const isSelected = functionProviders.image === provider;
                    const hasApiKey = !!apiKeys[provider];
                    return (
                      <button
                        key={provider}
                        onClick={() => hasApiKey && handleFunctionProviderChange('image', provider)}
                        disabled={!hasApiKey}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          !hasApiKey
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={!hasApiKey ? `${getProviderDisplayName(provider)} API 키가 필요합니다` : ''}
                      >
                        {getProviderDisplayName(provider)}
                        {!hasApiKey && ' (키 필요)'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 영상 생성 AI */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">영상 생성</h4>
                    <p className="text-xs text-gray-500">동영상 생성에 사용</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['google', 'kling'] as AIProvider[]).map((provider) => {
                    const isSelected = functionProviders.video === provider;
                    const hasApiKey = provider === 'google' ? !!apiKeys.google : !!apiKeys.kling;
                    return (
                      <button
                        key={provider}
                        onClick={() => hasApiKey && handleFunctionProviderChange('video', provider)}
                        disabled={!hasApiKey || provider === 'kling'} // Kling은 아직 준비중
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          !hasApiKey || provider === 'kling'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={
                          provider === 'kling' 
                            ? 'Kling AI는 준비 중입니다' 
                            : !hasApiKey 
                            ? `${getProviderDisplayName(provider)} API 키가 필요합니다` 
                            : ''
                        }
                      >
                        {getProviderDisplayName(provider)}
                        {provider === 'kling' && ' (준비중)'}
                        {!hasApiKey && provider !== 'kling' && ' (키 필요)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
              disabled={!isLoggedIn}
              title={!isLoggedIn ? '로그인이 필요합니다' : ''}
            >
              {showApiKeys ? '숨기기' : '보기'}
            </Button>
          </div>

          {!isLoggedIn && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">로그인이 필요합니다</p>
                  <p className="text-xs text-gray-600">
                    API 키를 설정하려면 먼저 로그인해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showApiKeys && isLoggedIn && (
            <div className="space-y-4">
              {(['google', 'chatgpt', 'anthropic', 'kling'] as AIProvider[]).map((provider) => {
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
                           provider === 'chatgpt' ? 'ChatGPT' :
                           provider === 'anthropic' ? 'Anthropic' : 'Kling AI'}
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
                    
                    {/* Kling AI의 경우 Secret Key 추가 입력 필드 */}
                    {provider === 'kling' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secret Key (준비중)
                        </label>
                        <input
                          type="password"
                          value={apiKeys.klingSecret}
                          onChange={(e) => handleApiKeyChange('klingSecret', e.target.value)}
                          placeholder="Kling AI Secret Key를 입력하세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={true}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Kling AI는 현재 준비 중입니다.
                        </p>
                      </div>
                    )}
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

        {/* 안내 링크 & 액션 버튼 */}
        <div className="pt-4 border-t">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-600">
              참고 링크: 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">Google AI API 키 발급</a>
              <span className="mx-2">|</span>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">ChatGPT(OpenAI) API 키 발급</a>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleSave}>
                설정 저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AISettingsModal;
