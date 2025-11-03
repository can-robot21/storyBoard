import React from 'react';
import { Bot, Zap, Sparkles, MessageCircle, Video, CheckCircle, AlertCircle } from 'lucide-react';
import { AIProvider } from '../../types/ai';
import { AIServiceFeatures } from '../../types/aiService';

interface AIServiceSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  supportedFeatures?: AIServiceFeatures | null;
  availableProviders?: AIProvider[];
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

const aiProviders = [
  {
    id: 'google' as AIProvider,
    name: 'Google AI (NanoBanana)',
    description: 'Gemini API를 통한 고품질 이미지 생성',
    icon: Bot,
    color: 'bg-blue-500',
    badge: '추천'
  },
  {
    id: 'chatgpt' as AIProvider,
    name: 'ChatGPT (DALL-E 3)',
    description: 'DALL-E 3를 통한 창의적 이미지 생성',
    icon: MessageCircle,
    color: 'bg-emerald-500',
    badge: '사용 가능'
  },
  {
    id: 'anthropic' as AIProvider,
    name: 'Anthropic (Claude)',
    description: 'Claude API를 통한 고급 텍스트 분석',
    icon: Sparkles,
    color: 'bg-purple-500',
    badge: '분석 전용'
  },
  {
    id: 'kling' as AIProvider,
    name: 'Kling AI',
    description: 'Kling AI를 통한 고품질 이미지 생성',
    icon: Video,
    color: 'bg-orange-500',
    badge: '사용 가능'
  }
];

export const AIServiceSelector: React.FC<AIServiceSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  supportedFeatures,
  availableProviders = ['google'],
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const isProviderAvailable = (provider: AIProvider) => {
    return availableProviders.includes(provider);
  };

  const getProviderInfo = (provider: AIProvider) => {
    return aiProviders.find(p => p.id === provider) || aiProviders[0];
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'promptOptimization':
        return '🎯';
      case 'imageGeneration':
        return '🖼️';
      case 'imageAnalysis':
        return '🔍';
      default:
        return '✨';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI 서비스 선택</h3>
        {isLoading && (
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            로딩 중...
          </div>
        )}
      </div>
      
      {/* AI 서비스 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {aiProviders.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const isAvailable = isProviderAvailable(provider.id);
          const isDisabled = disabled || !isAvailable || isLoading;
          const Icon = provider.icon;
          
          return (
            <button
              key={provider.id}
              onClick={() => !isDisabled && onProviderChange(provider.id)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
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
              <div className="flex items-start gap-3">
                {/* 아이콘 */}
                <div className={`
                  p-2 rounded-lg ${provider.color} text-white
                  ${isDisabled ? 'opacity-50' : ''}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                
                {/* 정보 */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                    {!isAvailable && (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  {/* 배지 */}
                  <div className="flex items-center gap-2 mb-2">
                    {provider.badge && (
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${provider.badge === '추천' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                        }
                      `}>
                        {provider.badge}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {provider.description}
                  </p>
                </div>
              </div>
              
              {/* 선택 표시 */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* 현재 선택된 서비스 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">
            현재 선택: {getProviderInfo(selectedProvider).name}
          </p>
          {supportedFeatures && (
            <span className="text-xs text-gray-500">
              토큰 한도: {supportedFeatures.maxPromptLength?.toLocaleString() || 'N/A'}
            </span>
          )}
        </div>
        
        {/* 지원 기능 표시 */}
        {supportedFeatures && (
          <div className="flex flex-wrap gap-2 mt-2">
            {supportedFeatures.promptOptimization && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {getFeatureIcon('promptOptimization')} 프롬프트 최적화
              </span>
            )}
            {supportedFeatures.imageGeneration && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {getFeatureIcon('imageGeneration')} 이미지 생성
              </span>
            )}
            {supportedFeatures.imageAnalysis && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {getFeatureIcon('imageAnalysis')} 이미지 분석
              </span>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">
          💡 AI 서비스를 변경하면 생성된 콘텐츠의 품질과 스타일이 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
};

