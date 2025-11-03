import React from 'react';
import { Bot, Zap, Sparkles, MessageCircle, Video } from 'lucide-react';
import { AIProvider } from '../../types/ai';

interface AISelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
  className?: string;
  apiKeys?: {
    google?: string;
    chatgpt?: string;
    anthropic?: string;
    kling?: string;
  };
}

const aiProviders = [
  {
    id: 'google' as AIProvider,
    name: 'Google AI',
    description: 'Gemini API를 통한 텍스트, 이미지, 영상 생성',
    icon: Bot,
    color: 'bg-blue-500',
    available: true
  },
  {
    id: 'chatgpt' as AIProvider,
    name: 'ChatGPT',
    description: 'ChatGPT API를 통한 고품질 텍스트 및 이미지 생성',
    icon: MessageCircle,
    color: 'bg-emerald-500',
    available: true
  },
  {
    id: 'anthropic' as AIProvider,
    name: 'Anthropic',
    description: 'Claude API를 통한 고급 텍스트 생성',
    icon: Sparkles,
    color: 'bg-purple-500',
    available: false
  },
  {
    id: 'kling' as AIProvider,
    name: 'Kling AI',
    description: 'Kling AI를 통한 고품질 영상 생성',
    icon: Video,
    color: 'bg-orange-500',
    available: false
  }
];

export const AISelector: React.FC<AISelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  className = '',
  apiKeys = {}
}) => {
  // API 키 기반 활성화 확인
  const checkApiKeyAvailability = (providerId: AIProvider): boolean => {
    if (providerId === 'anthropic' || providerId === 'kling') {
      return false; // 준비중
    }
    
    if (providerId === 'google') {
      return !!(apiKeys.google && apiKeys.google.trim() !== '' && 
                !apiKeys.google.includes('your-') && 
                !apiKeys.google.includes('-here'));
    }
    
    if (providerId === 'chatgpt') {
      return !!(apiKeys.chatgpt && apiKeys.chatgpt.trim() !== '' && 
                !apiKeys.chatgpt.includes('your-') && 
                !apiKeys.chatgpt.includes('-here'));
    }
    
    return false;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI 서비스 선택</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {aiProviders.map((provider) => {
          const Icon = provider.icon;
          const isSelected = selectedProvider === provider.id;
          const hasApiKey = checkApiKeyAvailability(provider.id);
          const isDisabled = disabled || !provider.available || !hasApiKey;
          
          return (
            <button
              key={provider.id}
              onClick={() => !isDisabled && onProviderChange(provider.id)}
              disabled={isDisabled}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                ${isSelected ? 'ring-2 ring-blue-200' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                <div className={`
                  p-1 rounded-lg ${provider.color} text-white flex-shrink-0
                  ${isDisabled ? 'opacity-50' : ''}
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">{provider.name}</h4>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <div className="mt-0.5">
                    {!provider.available && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded block">
                        준비중
                      </span>
                    )}
                    {provider.available && !hasApiKey && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded block">
                        API 키 필요
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>현재 선택:</strong> {aiProviders.find(p => p.id === selectedProvider)?.name}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          AI 서비스를 변경하면 생성된 콘텐츠의 품질과 스타일이 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default AISelector;
