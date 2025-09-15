// Base64 인코딩/디코딩 유틸리티 함수
// UTF-8 문자를 안전하게 처리하기 위한 헬퍼 함수들

/**
 * UTF-8 문자열을 안전하게 Base64로 인코딩
 * @param str 인코딩할 문자열
 * @returns Base64로 인코딩된 문자열
 */
export const safeBtoa = (str: string): string => {
  try {
    // UTF-8 문자를 안전하게 처리
    const utf8String = unescape(encodeURIComponent(str));
    return btoa(utf8String);
  } catch (error) {
    console.error('Base64 인코딩 오류:', error);
    // 폴백: 원본 문자열을 그대로 반환
    return str;
  }
};

/**
 * Base64로 인코딩된 문자열을 UTF-8로 안전하게 디코딩
 * @param base64String 디코딩할 Base64 문자열
 * @returns UTF-8로 디코딩된 문자열
 */
export const safeAtob = (base64String: string): string => {
  try {
    const decoded = atob(base64String);
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error('Base64 디코딩 오류:', error);
    // 폴백: 원본 문자열을 그대로 반환
    return base64String;
  }
};

/**
 * 객체를 안전하게 Base64로 인코딩
 * @param obj 인코딩할 객체
 * @returns Base64로 인코딩된 문자열
 */
export const safeObjectToBase64 = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj);
    return safeBtoa(jsonString);
  } catch (error) {
    console.error('객체 Base64 인코딩 오류:', error);
    return '';
  }
};

/**
 * Base64 문자열을 안전하게 객체로 디코딩
 * @param base64String 디코딩할 Base64 문자열
 * @returns 디코딩된 객체
 */
export const safeBase64ToObject = (base64String: string): any => {
  try {
    const jsonString = safeAtob(base64String);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Base64 객체 디코딩 오류:', error);
    return null;
  }
};

/**
 * 데이터 URL을 생성 (Base64 인코딩 포함)
 * @param data 인코딩할 데이터
 * @param mimeType MIME 타입 (기본값: 'application/json')
 * @returns 데이터 URL
 */
export const createDataUrl = (data: any, mimeType: string = 'application/json'): string => {
  try {
    const base64String = safeObjectToBase64(data);
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('데이터 URL 생성 오류:', error);
    return '';
  }
};
