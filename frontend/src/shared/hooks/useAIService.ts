import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AIServiceState, 
  AIServiceAdapter, 
  PromptOptimizationResult, 
  ImageGenerationResponse, 
  ImageGenerationOptions,
  AIServiceFeatures 
} from '../../types/aiService';
import { DetailedSettings } from '../../types/imageGeneration';
import { AIProvider } from '../../types/ai';
import { getAIServiceFactory } from '../services/aiServiceFactory';

/**
 * AI 서비스 관리 훅
 * AI 서비스 선택, 전환, 프롬프트 최적화, 이미지 생성을 관리
 */
export const useAIService = () => {
  const [state, setState] = useState<AIServiceState>({
    selectedProvider: 'google',
    availableProviders: ['google'],
    currentAdapter: null,
    isLoading: false,
    error: null,
    lastUsed: null
  });

  const factoryRef = useRef(getAIServiceFactory());

  /**
   * AI 서비스 초기화
   */
  const initializeService = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const factory = factoryRef.current;
      const availableProviders = factory.getAvailableProviders();
      
      // 사용 가능한 서비스 확인
      const availability = await factory.checkAllProvidersAvailability();
      const workingProviders = Array.from(availability.entries())
        .filter(([_, isAvailable]) => isAvailable)
        .map(([provider, _]) => provider);
      
      if (workingProviders.length === 0) {
        throw new Error('사용 가능한 AI 서비스가 없습니다');
      }
      
      // 첫 번째 사용 가능한 서비스로 설정
      const defaultProvider = workingProviders[0];
      const adapter = factory.createAdapter(defaultProvider);
      
      setState(prev => ({
        ...prev,
        selectedProvider: defaultProvider,
        availableProviders: workingProviders,
        currentAdapter: adapter,
        isLoading: false,
        lastUsed: new Date()
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'AI 서비스 초기화 실패'
      }));
    }
  }, []);

  /**
   * AI 서비스 전환
   */
  const switchProvider = useCallback(async (provider: AIProvider) => {
    if (provider === state.selectedProvider) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const factory = factoryRef.current;
      const adapter = factory.createAdapter(provider);
      
      // 서비스 사용 가능 여부 확인
      const isAvailable = await adapter.isAvailable();
      if (!isAvailable) {
        throw new Error(`${provider} 서비스가 현재 사용할 수 없습니다`);
      }
      
      setState(prev => ({
        ...prev,
        selectedProvider: provider,
        currentAdapter: adapter,
        isLoading: false,
        lastUsed: new Date()
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'AI 서비스 전환 실패'
      }));
    }
  }, [state.selectedProvider]);

  /**
   * 프롬프트 최적화
   */
  const optimizePrompt = useCallback(async (
    prompt: string, 
    settings: DetailedSettings
  ): Promise<PromptOptimizationResult> => {
    if (!state.currentAdapter) {
      throw new Error('AI 서비스가 초기화되지 않았습니다');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await state.currentAdapter.optimizePrompt(prompt, settings);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUsed: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '프롬프트 최적화 실패'
      }));
      throw error;
    }
  }, [state.currentAdapter]);

  /**
   * 이미지 생성
   */
  const generateImage = useCallback(async (
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> => {
    if (!state.currentAdapter) {
      throw new Error('AI 서비스가 초기화되지 않았습니다');
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await state.currentAdapter.generateImage(options);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastUsed: new Date()
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '이미지 생성 실패'
      }));
      throw error;
    }
  }, [state.currentAdapter]);

  /**
   * 설정 유효성 검증
   */
  const validateSettings = useCallback((settings: DetailedSettings): boolean => {
    if (!state.currentAdapter) return false;
    return state.currentAdapter.validateSettings(settings);
  }, [state.currentAdapter]);

  /**
   * 지원 기능 조회
   */
  const getSupportedFeatures = useCallback((): AIServiceFeatures | null => {
    if (!state.currentAdapter) return null;
    return state.currentAdapter.getSupportedFeatures();
  }, [state.currentAdapter]);

  /**
   * 모든 AI 서비스의 지원 기능 조회
   */
  const getAllSupportedFeatures = useCallback(() => {
    const factory = factoryRef.current;
    return factory.getAllProviderFeatures();
  }, []);

  /**
   * 에러 상태 초기화
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 서비스 상태 새로고침
   */
  const refreshService = useCallback(async () => {
    await initializeService();
  }, [initializeService]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initializeService();
  }, [initializeService]);

  return {
    // 상태
    selectedProvider: state.selectedProvider,
    availableProviders: state.availableProviders,
    currentAdapter: state.currentAdapter,
    isLoading: state.isLoading,
    error: state.error,
    lastUsed: state.lastUsed,
    
    // 기능
    switchProvider,
    optimizePrompt,
    generateImage,
    validateSettings,
    getSupportedFeatures,
    getAllSupportedFeatures,
    
    // 유틸리티
    clearError,
    refreshService,
    
    // 편의 속성
    isReady: !!state.currentAdapter && !state.isLoading && !state.error,
    hasError: !!state.error,
    canSwitchProvider: state.availableProviders.length > 1
  };
};

