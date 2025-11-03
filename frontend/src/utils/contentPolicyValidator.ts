/**
 * 콘텐츠 정책 검증 유틸리티
 * 금지된 키워드 및 안전 정책 위반 내용을 검사
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  message: string;
  category?: 'safety' | 'policy' | 'content' | 'age_restricted';
}

/**
 * 금지된 키워드 목록 (한글 및 영문)
 */
const FORBIDDEN_KEYWORDS = {
  // 성인 콘텐츠
  explicit: ['nude', 'naked', 'explicit', 'adult', 'nsfw', 'pornographic', 'sexual', 'sexually'],
  
  // 미성년자 관련 (주요 금지 항목)
  minor: [
    // 한글
    '소녀', '소년', '꼬마', '아이', '어린이', '유아', '아기',
    '초등학생', '중학생', '고등학생', '학생',
    // 영문
    'child', 'minor', 'kid', 'baby', 'toddler', 'infant',
    'young girl', 'young boy', 'little girl', 'little boy',
    'school girl', 'school boy', 'student', 'teenager', 'teen'
  ],
  
  // 폭력 관련
  violence: ['violence', 'blood', 'weapon', 'gun', 'knife', 'fight', 'kill', 'murder'],
  
  // 기타 부적절한 내용
  inappropriate: ['hate', 'discrimination', 'harassment', 'abuse']
};

/**
 * 콘텐츠 정책 검증
 * @param prompt 프롬프트
 * @param personGeneration personGeneration 옵션 ('allow_adult', 'allow_all', 'dont_allow') - 옵션이 있으면 미성년자 표현 허용 가능
 */
export const validateContentPolicy = (prompt: string, personGeneration?: string): ValidationResult => {
  if (!prompt || prompt.trim().length === 0) {
    return {
      isValid: false,
      reason: 'empty',
      message: '프롬프트를 입력해주세요.',
      category: 'content'
    };
  }

  const lowerPrompt = prompt.toLowerCase();
  const normalizedPrompt = prompt;

  // 미성년자 관련 키워드 검사 (최우선)
  // personGeneration이 'allow_all'이고 프롬프트에 미성년자 관련 표현이 있을 때는 경고만
  const hasMinorKeyword = FORBIDDEN_KEYWORDS.minor.some(keyword => {
    const keywordLower = keyword.toLowerCase();
    return lowerPrompt.includes(keywordLower) || normalizedPrompt.includes(keyword);
  });

  if (hasMinorKeyword) {
    // personGeneration이 'allow_all'이면 허용하되, API가 자동으로 필터링할 수 있음을 알림
    if (personGeneration === 'allow_all') {
      return {
        isValid: true,
        message: '미성년자 관련 표현이 포함되어 있지만 "모든 연령 허용" 옵션이 설정되어 있습니다. API가 안전하게 처리합니다.',
        category: 'age_restricted'
      };
    }
    // personGeneration이 'allow_adult'일 때는 클라이언트 측 검증을 건너뛰고 API에 위임
    // API의 personGeneration 설정이 'allow_adult'이면 미성년자 이미지는 생성하지 않으므로 안전함
    if (personGeneration === 'allow_adult') {
      return {
        isValid: true,
        message: '미성년자 관련 표현이 포함되어 있지만 "성인만 허용" 옵션이 설정되어 있습니다. API가 성인 이미지만 생성하도록 필터링합니다.',
        category: 'age_restricted'
      };
    }
    // personGeneration이 설정되지 않았거나 'dont_allow'일 때는 차단
    return {
      isValid: false,
      reason: 'minor_restricted',
      message: '미성년자 관련 표현이 포함된 프롬프트는 안전 정책상 생성할 수 없습니다.\n\n다음과 같은 표현은 사용할 수 없습니다:\n- 소녀, 소년, 꼬마, 아이, 어린이\n- child, minor, kid, baby 등\n\n성인 캐릭터나 일반적인 인물 표현으로 변경해주세요.\n\n또는 "사람 생성" 옵션에서 "성인만 허용" 또는 "모든 연령 허용"을 선택하여 사용할 수 있습니다.',
      category: 'age_restricted'
    };
  }

  // 성인 콘텐츠 키워드 검사
  for (const keyword of FORBIDDEN_KEYWORDS.explicit) {
    if (lowerPrompt.includes(keyword)) {
      return {
        isValid: false,
        reason: 'explicit_content',
        message: '부적절한 내용이 포함되어 있습니다.\n\n성인 콘텐츠 관련 표현은 사용할 수 없습니다.\n다른 내용으로 시도해주세요.',
        category: 'safety'
      };
    }
  }

  // 폭력 관련 키워드 검사
  for (const keyword of FORBIDDEN_KEYWORDS.violence) {
    if (lowerPrompt.includes(keyword)) {
      return {
        isValid: false,
        reason: 'violence',
        message: '폭력적인 내용이 포함되어 있습니다.\n\n폭력 관련 표현은 사용할 수 없습니다.\n다른 내용으로 시도해주세요.',
        category: 'safety'
      };
    }
  }

  // 기타 부적절한 내용 검사
  for (const keyword of FORBIDDEN_KEYWORDS.inappropriate) {
    if (lowerPrompt.includes(keyword)) {
      return {
        isValid: false,
        reason: 'inappropriate',
        message: '부적절한 내용이 포함되어 있습니다.\n\n다른 내용으로 시도해주세요.',
        category: 'policy'
      };
    }
  }

  return {
    isValid: true,
    message: ''
  };
};

/**
 * API 응답에서 안전 정책 위반 확인
 */
export const checkAPIResponseForPolicyViolation = (error: any): ValidationResult | null => {
  if (!error) return null;

  const errorMessage = error.message || String(error) || '';
  const errorString = errorMessage.toLowerCase();

  // Google AI 안전 정책 관련 에러
  if (
    errorString.includes('safety') ||
    errorString.includes('policy') ||
    errorString.includes('blocked') ||
    errorString.includes('violation') ||
    errorString.includes('content policy') ||
    errorString.includes('safety filter')
  ) {
    return {
      isValid: false,
      reason: 'api_safety_policy',
      message: '안전 정책에 위배되는 내용이 감지되었습니다.\n\n입력하신 내용이 AI 서비스의 안전 정책에 위배되어 이미지를 생성할 수 없습니다.\n\n다음을 확인해주세요:\n• 미성년자 관련 표현 제거\n• 성인 콘텐츠 관련 표현 제거\n• 폭력적인 표현 제거\n\n다른 내용으로 프롬프트를 수정해주세요.',
      category: 'safety'
    };
  }

  // 다른 이미지가 생성된 경우 (프롬프트와 다른 결과)
  if (
    errorString.includes('different image') ||
    errorString.includes('unexpected result') ||
    errorString.includes('content mismatch')
  ) {
    return {
      isValid: false,
      reason: 'content_mismatch',
      message: '요청하신 내용과 다른 이미지가 생성되었습니다.\n\n안전 정책에 따라 프롬프트의 일부 내용이 변경되거나 다른 이미지가 생성될 수 있습니다.\n\n다음을 시도해보세요:\n• 프롬프트를 더 명확하고 구체적으로 작성\n• 미성년자 관련 표현 제거\n• 성인, 전문인, 일반 캐릭터 등으로 대체\n\n프롬프트를 수정한 후 다시 시도해주세요.',
      category: 'policy'
    };
  }

  return null;
};

/**
 * 에러 메시지 정리 및 사용자 친화적 메시지 제공
 */
export const getFormattedErrorMessage = (error: any, originalPrompt?: string): string => {
  // API 응답에서 정책 위반 확인
  const policyViolation = checkAPIResponseForPolicyViolation(error);
  if (policyViolation) {
    return policyViolation.message;
  }

  const errorMessage = error?.message || String(error) || '알 수 없는 오류';
  const errorString = errorMessage.toLowerCase();

  // 이미지 생성 결과 없음
  if (errorString.includes('이미지 생성 결과가 없습니다') || errorString.includes('빈 응답')) {
    return errorMessage; // 이미 상세한 메시지가 있으면 그대로 사용
  }

  // 안전 정책 관련 메시지
  if (errorString.includes('안전 정책') || errorString.includes('safety')) {
    return '안전 정책에 위배되는 내용이 감지되었습니다.\n\n입력하신 프롬프트가 AI 서비스의 안전 정책에 위배되어 이미지를 생성할 수 없습니다.\n\n다음을 확인해주세요:\n• 미성년자 관련 표현(소녀, 소년, 꼬마, 아이 등) 제거\n• 성인 콘텐츠 관련 표현 제거\n• 폭력적인 표현 제거\n\n프롬프트를 수정한 후 다시 시도해주세요.';
  }

  // 다른 이미지가 생성된 경우
  if (errorString.includes('different') || errorString.includes('unexpected')) {
    return '요청하신 내용과 다른 이미지가 생성되었습니다.\n\n안전 정책에 따라 프롬프트의 일부 내용이 자동으로 변경되거나 다른 이미지가 생성될 수 있습니다.\n\n프롬프트를 더 명확하게 작성하거나, 다른 표현으로 변경해주세요.';
  }

  // 기본 에러 메시지
  return errorMessage;
};

/**
 * 프롬프트에서 금지 키워드가 포함되어 있는지 확인
 */
export const hasForbiddenKeywords = (prompt: string): boolean => {
  const validation = validateContentPolicy(prompt);
  return !validation.isValid;
};

/**
 * 프롬프트를 안전한 버전으로 변환 (권장 표현 제안)
 */
export const suggestSafePrompt = (prompt: string): string => {
  let safePrompt = prompt;

  // 미성년자 관련 표현을 성인 표현으로 변경
  const replacements: { [key: string]: string } = {
    '소녀': '여성',
    '소년': '남성',
    '꼬마': '인물',
    '아이': '인물',
    '어린이': '인물',
    'child': 'adult person',
    'minor': 'adult',
    'kid': 'person',
    'little girl': 'woman',
    'little boy': 'man',
    'young girl': 'woman',
    'young boy': 'man',
    'school girl': 'professional woman',
    'school boy': 'professional man'
  };

  for (const [forbidden, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(forbidden, 'gi');
    safePrompt = safePrompt.replace(regex, replacement);
  }

  return safePrompt;
};

