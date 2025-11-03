/**
 * API 키 관리 통합 훅
 * 중복된 API 키 가져오기 로직을 통합하여 재사용 가능한 훅으로 제공
 */

import { useState, useEffect } from 'react';
import { getAPIKeyFromStorage, isValidAPIKey, type APIProvider } from '../utils/apiKeyUtils';

interface UseAPIKeyReturn {
  apiKey: string;
  hasAPIKey: boolean;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * API 키를 가져오고 관리하는 커스텀 훅
 * @param provider API 제공자 (기본값: 'google')
 * @returns API 키 정보 및 상태
 */
export const useAPIKey = (provider: APIProvider = 'google'): UseAPIKeyReturn => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAPIKey = () => {
    setIsLoading(true);
    try {
      const key = getAPIKeyFromStorage(provider);
      setApiKey(key);
    } catch (error) {
      console.error('API 키 로딩 오류:', error);
      setApiKey('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAPIKey();
  }, [provider]);

  return {
    apiKey,
    hasAPIKey: isValidAPIKey(apiKey),
    isLoading,
    refresh: loadAPIKey
  };
};

/**
 * 여러 API 키를 한 번에 가져오는 훅
 * @param providers API 제공자 배열
 * @returns 각 제공자별 API 키 정보
 */
export const useMultipleAPIKeys = (providers: APIProvider[] = ['google', 'chatgpt']) => {
  const [apiKeys, setApiKeys] = useState<Record<APIProvider, string>>({
    google: '',
    openai: '',
    chatgpt: '',
    anthropic: '',
    kling: ''
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const keys: Record<APIProvider, string> = {
        google: '',
        openai: '',
        chatgpt: '',
        anthropic: '',
        kling: ''
      };
      
      providers.forEach(provider => {
        keys[provider] = getAPIKeyFromStorage(provider);
      });
      
      setApiKeys(keys);
    } catch (error) {
      console.error('API 키 로딩 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [providers.join(',')]);

  const hasAnyKey = providers.some(provider => isValidAPIKey(apiKeys[provider]));

  return {
    apiKeys,
    hasAnyKey,
    isLoading
  };
};

