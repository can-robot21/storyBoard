import { useState, useEffect, useCallback } from 'react';
import { AIProvider, AIServiceConfig, GenerationType, FunctionBasedAIProviders } from '../types/ai';
import { AIServiceFactoryImpl } from '../services/ai/AIServiceFactory';
import { useUIStore } from '../stores/uiStore';
import { AIProviderSettings } from '../utils/aiProviderSettings';

interface AIServiceManagerState {
  selectedProvider: AIProvider;
  isInitialized: boolean;
  error: string | null;
}

export const useAIServiceManager = () => {
  const { addNotification } = useUIStore();
  const [state, setState] = useState<AIServiceManagerState>({
    selectedProvider: 'google',
    isInitialized: false,
    error: null
  });

  // AI 서비스 팩토리 인스턴스
  const aiFactory = AIServiceFactoryImpl.getInstance();

  // 로그인한 사용자만 API 키 로드
  const loadApiKeys = useCallback(() => {
    let googleApiKey = '';
    let chatgptApiKey = '';
    let anthropicApiKey = '';
    let klingApiKey = '';
    let klingSecretKey = '';

    try {
      if (typeof window !== 'undefined') {
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const localKeysRaw = localStorage.getItem('user_api_keys');
        const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
        
        console.log('🔍 API 키 로드 시도:', {
          hasCurrentUser: !!currentUser,
          currentUserEmail: currentUser?.email,
          hasLocalKeys: !!localKeysRaw
        });

        const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};

        // 로그인한 사용자만 개인 API 키 사용
        if (currentUser) {
          googleApiKey = (localKeys.google || currentUser?.apiKeys?.google || '').toString();
          chatgptApiKey = (localKeys.chatgpt || currentUser?.apiKeys?.openai || '').toString();
          anthropicApiKey = (localKeys.anthropic || currentUser?.apiKeys?.anthropic || '').toString();
          klingApiKey = (localKeys.kling || currentUser?.apiKeys?.kling || '').toString();
          
          console.log('🔑 로드된 API 키 상태:', {
            google: googleApiKey ? `${googleApiKey.substring(0, 8)}...` : '없음',
            chatgpt: chatgptApiKey ? `${chatgptApiKey.substring(0, 8)}...` : '없음',
            anthropic: anthropicApiKey ? `${anthropicApiKey.substring(0, 8)}...` : '없음',
            kling: klingApiKey ? `${klingApiKey.substring(0, 8)}...` : '없음'
          });
        } else {
          console.log('⚠️ 로그인하지 않은 사용자 - API 키 사용 안함');
        }
      }
    } catch (error) {
      console.error('❌ API 키 로드 오류:', error);
    }

    return {
      google: googleApiKey,
      chatgpt: chatgptApiKey,
      anthropic: anthropicApiKey,
      kling: klingApiKey
    };
  }, []);

  // AI 서비스 초기화
  const initializeAIService = useCallback(async (provider: AIProvider) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const apiKeys = loadApiKeys();
      const apiKey = apiKeys[provider];
      
      if (!apiKey) {
        throw new Error(`${provider} API 키가 설정되지 않았습니다.`);
      }

      const config: AIServiceConfig = {
        apiKey,
        baseUrl: (provider === 'chatgpt')
          ? 'https://api.openai.com/v1'
          : provider === 'kling'
          ? 'https://api.kling.ai/v1'
          : 'https://generativelanguage.googleapis.com/v1beta'
      };

      const service = aiFactory.createService(provider, config);
      
      if (!service.isAvailable()) {
        throw new Error(`${provider} 서비스를 사용할 수 없습니다.`);
      }

      setState(prev => ({
        ...prev,
        selectedProvider: provider,
        isInitialized: true,
        error: null
      }));

      addNotification({
        type: 'success',
        title: 'AI 서비스 연결 성공',
        message: `${provider.toUpperCase()} 서비스가 성공적으로 연결되었습니다.`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isInitialized: false
      }));

      addNotification({
        type: 'error',
        title: 'AI 서비스 연결 실패',
        message: errorMessage
      });
    }
  }, [aiFactory, loadApiKeys, addNotification]);

  // AI 서비스 변경
  const changeAIService = useCallback(async (provider: AIProvider) => {
    if (provider === state.selectedProvider) return;
    
    await initializeAIService(provider);
  }, [state.selectedProvider, initializeAIService]);

  // 사용 가능한 AI 서비스 목록
  const getAvailableProviders = useCallback(() => {
    const apiKeys = loadApiKeys();
    return aiFactory.getAvailableProviders().filter(provider => {
      const apiKey = apiKeys[provider];
      return apiKey && apiKey.trim() !== '';
    });
  }, [aiFactory, loadApiKeys]);

  // 현재 AI 서비스 인스턴스 가져오기
  const getCurrentAIService = useCallback(() => {
    const apiKeys = loadApiKeys();
    const apiKey = apiKeys[state.selectedProvider];
    
    if (!apiKey) {
      console.warn(`${state.selectedProvider} API 키가 설정되지 않았습니다.`);
      return null;
    }

    const config: AIServiceConfig = {
      apiKey,
      baseUrl: (state.selectedProvider === 'chatgpt')
        ? 'https://api.openai.com/v1'
        : state.selectedProvider === 'kling'
        ? 'https://api.kling.ai/v1'
        : 'https://generativelanguage.googleapis.com/v1beta'
    };

    try {
      const service = aiFactory.createService(state.selectedProvider, config);
      if (!service.isAvailable()) {
        console.warn(`${state.selectedProvider} 서비스를 사용할 수 없습니다.`);
        return null;
      }
      return service;
    } catch (error) {
      console.error(`${state.selectedProvider} 서비스 생성 실패:`, error);
      return null;
    }
  }, [state.selectedProvider, aiFactory, loadApiKeys]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    const initialize = async () => {
      const availableProviders = getAvailableProviders();
      console.log('🔍 사용 가능한 AI 서비스:', availableProviders);
      
      if (availableProviders.length > 0) {
        await initializeAIService(availableProviders[0]);
      } else {
        // API 키가 없어도 기본적으로 Google 서비스 시도
        const apiKeys = loadApiKeys();
        const hasGoogleKey = !!apiKeys.google;
        
        if (hasGoogleKey) {
          console.log('🔑 Google API 키는 있지만 서비스 초기화 실패');
          setState(prev => ({
            ...prev,
            error: 'Google AI 서비스 초기화에 실패했습니다. API 키를 확인해주세요.'
          }));
        } else {
          console.info('🔑 AI 설정: 로그인하지 않은 사용자 - API 키 로드 안함');
          console.info('💡 사용자 API 키를 설정하면 더 많은 AI 서비스를 이용할 수 있습니다.');
          setState(prev => ({
            ...prev,
            error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
          }));
        }
      }
    };

    initialize();
  }, [initializeAIService, getAvailableProviders]);

  /**
   * 기능별 AI Provider 가져오기
   */
  const getProviderForFunction = useCallback((type: GenerationType): AIProvider => {
    return AIProviderSettings.getProviderForFunction(type);
  }, []);

  /**
   * 기능별 AI Service 가져오기
   */
  const getAIServiceForFunction = useCallback((type: GenerationType) => {
    const provider = AIProviderSettings.getProviderForFunction(type);
    const apiKeys = loadApiKeys();
    const apiKey = apiKeys[provider];
    
    if (!apiKey) {
      console.warn(`${provider} API 키가 설정되지 않았습니다.`);
      return null;
    }

    const config: AIServiceConfig = {
      apiKey,
      baseUrl: (provider === 'chatgpt')
        ? 'https://api.openai.com/v1'
        : provider === 'kling'
        ? 'https://api.kling.ai/v1'
        : 'https://generativelanguage.googleapis.com/v1beta'
    };

    try {
      const service = aiFactory.createService(provider, config);
      if (!service.isAvailable()) {
        console.warn(`${provider} 서비스를 사용할 수 없습니다.`);
        return null;
      }
      return service;
    } catch (error) {
      console.error(`${provider} 서비스 생성 실패:`, error);
      return null;
    }
  }, [aiFactory, loadApiKeys]);

  return {
    selectedProvider: state.selectedProvider,
    isInitialized: state.isInitialized,
    error: state.error,
    changeAIService,
    getAvailableProviders,
    getCurrentAIService,
    initializeAIService,
    getProviderForFunction,
    getAIServiceForFunction
  };
};


