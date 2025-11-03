/**
 * API 키 관리 유틸리티 함수
 * 중복된 API 키 가져오기 로직을 통합
 */

export type APIProvider = 'google' | 'openai' | 'chatgpt' | 'anthropic' | 'kling';

/**
 * localStorage에서 API 키 가져오기
 * @param provider API 제공자 ('google' | 'openai' | 'chatgpt' | 'anthropic' | 'kling')
 * @returns API 키 문자열 (없으면 빈 문자열)
 */
export const getAPIKeyFromStorage = (provider: APIProvider = 'google'): string => {
  try {
    if (typeof window === 'undefined') return '';
    
    // 현재 사용자 확인
    const currentUserRaw = localStorage.getItem('storyboard_current_user');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    
    // 1순위: localStorage의 user_api_keys에서 직접 확인 (로그인 여부와 무관)
    const localKeysRaw = localStorage.getItem('user_api_keys');
    if (localKeysRaw) {
      const localKeys = JSON.parse(localKeysRaw);
      const key = localKeys[provider] || localKeys[provider === 'openai' ? 'chatgpt' : provider];
      if (key && key.trim() !== '' && 
          !key.includes('your-') && 
          !key.includes('-here') &&
          !key.includes('your-gemini-api-key')) {
        return key;
      }
    }
    
    // 2순위: 로그인한 사용자의 API 키
    if (currentUser?.apiKeys) {
      const userKey = currentUser.apiKeys[provider] || 
                      currentUser.apiKeys[provider === 'chatgpt' ? 'openai' : provider] ||
                      currentUser.apiKeys[provider === 'openai' ? 'chatgpt' : provider];
      if (userKey && userKey.trim() !== '' && 
          !userKey.includes('your-') && 
          !userKey.includes('-here') &&
          !userKey.includes('your-gemini-api-key')) {
        return userKey;
      }
    }
    
    return '';
  } catch (error) {
    console.error('API 키 로딩 오류:', error);
    return '';
  }
};

/**
 * API 키 유효성 검증
 * @param apiKey API 키 문자열
 * @returns 유효한 키인지 여부
 */
export const isValidAPIKey = (apiKey: string): boolean => {
  if (!apiKey || !apiKey.trim()) return false;
  
  // 플레이스홀더 문자열 체크
  const invalidPatterns = [
    'your-',
    '-here',
    'your-gemini-api-key',
    'your-openai-api-key',
    'your-api-key',
    'placeholder'
  ];
  
  return !invalidPatterns.some(pattern => apiKey.toLowerCase().includes(pattern));
};

/**
 * 모든 API 키 상태 확인
 * @returns 각 제공자별 API 키 존재 여부
 */
export const getAllAPIKeyStatus = (): Record<APIProvider, boolean> => {
  return {
    google: isValidAPIKey(getAPIKeyFromStorage('google')),
    openai: isValidAPIKey(getAPIKeyFromStorage('openai')),
    chatgpt: isValidAPIKey(getAPIKeyFromStorage('chatgpt')),
    anthropic: isValidAPIKey(getAPIKeyFromStorage('anthropic')),
    kling: isValidAPIKey(getAPIKeyFromStorage('kling'))
  };
};

