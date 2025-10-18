import { useState, useEffect, useCallback } from 'react';
import { AIProvider, AIServiceConfig } from '../types/ai';
import { AIServiceFactoryImpl } from '../services/ai/AIServiceFactory';
import { useUIStore } from '../stores/uiStore';

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

  // 환경변수에서 API 키 로드
  const loadApiKeys = useCallback(() => {
  let googleApiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
  let openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
  let anthropicApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
  let nanoBananaApiKey = process.env.REACT_APP_GEMINI_API_KEY || '';

  try {
    if (typeof window !== 'undefined') {
      const currentUserRaw = localStorage.getItem('storyboard_current_user');
      const localKeysRaw = localStorage.getItem('user_api_keys');
      const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'star612.net@gmail.com';
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      const isAdmin = !!(currentUser && currentUser.email === adminEmail);
      const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};

      if (!isAdmin) {
        googleApiKey = (localKeys.google || currentUser?.apiKeys?.google || googleApiKey || '').toString();
        openaiApiKey = (localKeys.openai || currentUser?.apiKeys?.openai || openaiApiKey || '').toString();
        anthropicApiKey = (localKeys.anthropic || currentUser?.apiKeys?.anthropic || anthropicApiKey || '').toString();
        nanoBananaApiKey = googleApiKey;
      } else {
        nanoBananaApiKey = googleApiKey;
      }
    }
  } catch {}

  return {
    google: googleApiKey,
    openai: openaiApiKey,
    chatgpt: openaiApiKey,
    anthropic: anthropicApiKey,
    'nano-banana': nanoBananaApiKey
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
        baseUrl: (provider === 'openai' || provider === 'chatgpt')
          ? 'https://api.openai.com/v1'
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
      baseUrl: (state.selectedProvider === 'openai' || state.selectedProvider === 'chatgpt')
        ? 'https://api.openai.com/v1'
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
      if (availableProviders.length > 0) {
        await initializeAIService(availableProviders[0]);
      } else {
        // API 키가 없을 때는 조용히 처리 (경고 메시지 제거)
        console.info('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
        setState(prev => ({
          ...prev,
          error: null // 에러 상태를 null로 설정하여 조용히 처리
        }));
      }
    };

    initialize();
  }, [initializeAIService, getAvailableProviders]);

  return {
    selectedProvider: state.selectedProvider,
    isInitialized: state.isInitialized,
    error: state.error,
    changeAIService,
    getAvailableProviders,
    getCurrentAIService,
    initializeAIService
  };
};


