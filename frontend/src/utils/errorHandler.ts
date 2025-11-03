/**
 * 통합 에러 처리 유틸리티
 * 모든 서비스에서 일관된 에러 처리를 위한 중앙화된 에러 핸들러
 */

export enum ErrorCode {
  // API 키 관련
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  
  // 할당량 관련
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 네트워크 관련
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // 정책 위반 관련
  SAFETY_POLICY_VIOLATION = 'SAFETY_POLICY_VIOLATION',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  
  // 서비스 관련
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_ERROR = 'SERVICE_ERROR',
  
  // 유효성 검사 관련
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // 저장소 관련
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  
  // 알 수 없는 오류
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
  userMessage?: string; // 사용자에게 표시할 친화적인 메시지
  retryable?: boolean; // 재시도 가능 여부
}

/**
 * 에러를 파싱하여 표준화된 AppError로 변환
 */
export class ErrorHandler {
  /**
   * 에러를 파싱하여 AppError로 변환
   */
  static parseError(error: unknown, context?: Record<string, unknown>): AppError {
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    const errorString = errorMessage.toLowerCase();

    // API 키 관련 에러
    if (errorString.includes('api key') || 
        errorString.includes('api_key') ||
        errorString.includes('api 키') ||
        errorString.includes('apikey')) {
      return {
        code: ErrorCode.API_KEY_MISSING,
        message: 'API 키가 설정되지 않았습니다.',
        originalError: error,
        context,
        userMessage: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
        retryable: false
      };
    }

    // 할당량 관련 에러
    if (errorString.includes('quota') || 
        errorString.includes('한도') ||
        errorString.includes('limit') ||
        errorString.includes('exceeded')) {
      return {
        code: ErrorCode.QUOTA_EXCEEDED,
        message: 'API 사용량 한도를 초과했습니다.',
        originalError: error,
        context,
        userMessage: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true
      };
    }

    // 안전 정책 위반
    if (errorString.includes('safety') ||
        errorString.includes('안전') ||
        errorString.includes('policy') ||
        errorString.includes('정책') ||
        errorString.includes('미성년자')) {
      return {
        code: ErrorCode.SAFETY_POLICY_VIOLATION,
        message: '안전 정책에 위배되는 내용이 감지되었습니다.',
        originalError: error,
        context,
        userMessage: '입력하신 프롬프트가 AI 서비스의 안전 정책에 위배되어 생성할 수 없습니다. 프롬프트를 수정한 후 다시 시도해주세요.',
        retryable: false
      };
    }

    // 네트워크 에러
    if (errorString.includes('network') ||
        errorString.includes('fetch') ||
        errorString.includes('connection') ||
        errorString.includes('네트워크')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: '네트워크 연결에 문제가 발생했습니다.',
        originalError: error,
        context,
        userMessage: '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인한 후 다시 시도해주세요.',
        retryable: true
      };
    }

    // 타임아웃 에러
    if (errorString.includes('timeout') ||
        errorString.includes('시간 초과')) {
      return {
        code: ErrorCode.TIMEOUT_ERROR,
        message: '요청 시간이 초과되었습니다.',
        originalError: error,
        context,
        userMessage: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        retryable: true
      };
    }

    // 저장소 용량 초과
    if (errorString.includes('quotaexceedederror') ||
        errorString.includes('quota exceeded') ||
        errorString.includes('저장소 용량') ||
        errorString.includes('storage quota')) {
      return {
        code: ErrorCode.STORAGE_QUOTA_EXCEEDED,
        message: '저장소 용량이 부족합니다.',
        originalError: error,
        context,
        userMessage: '브라우저 저장소 용량이 부족합니다. 오래된 데이터를 삭제하거나 브라우저 저장소를 정리해주세요.',
        retryable: false
      };
    }

    // 서비스 에러
    if (errorString.includes('service unavailable') ||
        errorString.includes('503') ||
        errorString.includes('502') ||
        errorString.includes('500')) {
      return {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: '서비스가 일시적으로 사용할 수 없습니다.',
        originalError: error,
        context,
        userMessage: '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
        retryable: true
      };
    }

    // 알 수 없는 에러
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: '알 수 없는 오류가 발생했습니다.',
      originalError: error,
      context,
      userMessage: '예상치 못한 오류가 발생했습니다. 문제가 계속되면 고객 지원팀에 문의해주세요.',
      retryable: false
    };
  }

  /**
   * 사용자 친화적인 에러 메시지 반환
   */
  static getUserMessage(error: AppError): string {
    return error.userMessage || error.message;
  }

  /**
   * 에러가 재시도 가능한지 확인
   */
  static shouldRetry(error: AppError): boolean {
    return error.retryable === true;
  }

  /**
   * 에러 코드에 따른 재시도 권장 여부
   */
  static getRetryDelay(error: AppError): number {
    switch (error.code) {
      case ErrorCode.QUOTA_EXCEEDED:
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 60000; // 1분
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.TIMEOUT_ERROR:
        return 3000; // 3초
      case ErrorCode.SERVICE_UNAVAILABLE:
        return 10000; // 10초
      default:
        return 0;
    }
  }

  /**
   * 에러를 콘솔에 로깅
   */
  static logError(error: AppError): void {
    console.error(`[${error.code}] ${error.message}`, {
      originalError: error.originalError,
      context: error.context
    });
  }
}

/**
 * 에러를 간편하게 처리하는 헬퍼 함수
 */
export const handleError = (
  error: unknown,
  context?: Record<string, unknown>
): AppError => {
  const appError = ErrorHandler.parseError(error, context);
  ErrorHandler.logError(appError);
  return appError;
};

/**
 * 에러로부터 사용자 메시지를 바로 가져오는 헬퍼 함수
 */
export const getUserErrorMessage = (
  error: unknown,
  context?: Record<string, unknown>
): string => {
  const appError = handleError(error, context);
  return ErrorHandler.getUserMessage(appError);
};

