/**
 * 유틸리티 헬퍼 함수들
 */

// 랜덤 ID 생성 함수
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};