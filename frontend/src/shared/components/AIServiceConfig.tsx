import React, { useState } from 'react';
import { AIProvider } from '../../types/ai';
import { Bot, MessageCircle, Sparkles, Video, Settings, Key } from 'lucide-react';

interface AIServiceConfigProps {
  onApiKeySet: (provider: AIProvider, credentials: { accessKey?: string; secretKey?: string; apiKey?: string }) => void;
  className?: string;
}

const aiProviders = [
  {
    id: 'google' as AIProvider,
    name: 'Google AI (NanoBanana)',
    description: 'Gemini API를 통한 고품질 이미지 생성',
    icon: Bot,
    color: 'bg-blue-500',
    badge: '추천',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'AIza...' }
    ]
  },
  {
    id: 'chatgpt' as AIProvider,
    name: 'ChatGPT (DALL-E 3)',
    description: 'DALL-E 3를 통한 창의적 이미지 생성',
    icon: MessageCircle,
    color: 'bg-emerald-500',
    badge: '사용 가능',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'sk-...' }
    ]
  },
  {
    id: 'anthropic' as AIProvider,
    name: 'Anthropic (Claude)',
    description: 'Claude API를 통한 고급 텍스트 분석',
    icon: Sparkles,
    color: 'bg-purple-500',
    badge: '분석 전용',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'sk-ant-...' }
    ]
  },
  {
    id: 'kling' as AIProvider,
    name: 'Kling AI',
    description: 'Kling AI를 통한 고품질 이미지 생성',
    icon: Video,
    color: 'bg-orange-500',
    badge: '사용 가능',
    fields: [
      { key: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'Access Key' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Secret Key' }
    ]
  }
];

export const AIServiceConfig: React.FC<AIServiceConfigProps> = ({
  onApiKeySet,
  className = ''
}) => {
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>(null);
  const [credentials, setCredentials] = useState<Record<AIProvider, Record<string, string>>>({
    google: {},
    chatgpt: {},
    anthropic: {},
    kling: {}
  });

  const handleInputChange = (provider: AIProvider, field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSave = (provider: AIProvider) => {
    const providerCredentials = credentials[provider];
    onApiKeySet(provider, providerCredentials);
    setExpandedProvider(null);
  };

  const handleCancel = () => {
    setExpandedProvider(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">AI 서비스 설정</h3>
      </div>

      <div className="space-y-3">
        {aiProviders.map((provider) => {
          const Icon = provider.icon;
          const providerCredentials = credentials[provider.id];
          const hasCredentials = Object.values(providerCredentials).some(value => value.trim() !== '');

          return (
            <div
              key={provider.id}
              className="border rounded-lg p-3 transition-all duration-200 border-gray-200 hover:border-gray-300"
            >
              {/* 상단: AI 아이콘 + 이름을 한 줄로 */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${provider.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-medium text-gray-800 text-sm">{provider.name}</h4>
                {hasCredentials && (
                  <div className="flex items-center gap-1 text-green-600 ml-auto">
                    <Key className="w-3 h-3" />
                    <span className="text-xs">설정됨</span>
                  </div>
                )}
              </div>

              {/* 준비중 표기를 버튼 밑으로 이동 */}
              <div className="text-xs text-gray-500 mb-3">
                {provider.badge === '추천' && '✅ 추천 서비스'}
                {provider.badge === '사용 가능' && '✅ 사용 가능'}
                {provider.badge === '분석 전용' && '⚠️ 텍스트 분석 전용 (이미지 생성 불가)'}
                {provider.badge === '준비중' && '⏳ 준비중'}
              </div>

              {/* AI 명 + 입력폼을 한 줄로 */}
              <div className="space-y-2">
                {provider.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={providerCredentials[field.key] || ''}
                      onChange={(e) => handleInputChange(provider.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                
                <button
                  onClick={() => handleSave(provider.id)}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ 보안 안내</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• API 키는 브라우저에 저장되며 서버로 전송되지 않습니다.</li>
          <li>• 각 AI 서비스의 사용량 제한과 요금 정책을 확인하세요.</li>
          <li>• API 키는 안전하게 보관하고 공유하지 마세요.</li>
        </ul>
      </div>
    </div>
  );
};

