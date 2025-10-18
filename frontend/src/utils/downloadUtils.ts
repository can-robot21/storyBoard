// 파일 다운로드 유틸리티 함수들

/**
 * Base64 이미지를 파일로 다운로드
 * @param base64Data - Base64 인코딩된 이미지 데이터
 * @param filename - 다운로드할 파일명
 * @param mimeType - MIME 타입 (기본값: image/jpeg)
 */
export const downloadBase64Image = (base64Data: string, filename: string, mimeType: string = 'image/jpeg') => {
  try {
    // Base64 데이터에서 실제 데이터 부분만 추출
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Base64를 Blob으로 변환
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // 다운로드 링크 생성 및 클릭
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('이미지 다운로드 오류:', error);
    return false;
  }
};

/**
 * 비디오 URL을 파일로 다운로드
 * @param videoUrl - 비디오 URL
 * @param filename - 다운로드할 파일명
 */
export const downloadVideo = async (videoUrl: string, filename: string) => {
  try {
    // 비디오 URL에서 실제 파일을 가져옴
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    // 다운로드 링크 생성 및 클릭
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('비디오 다운로드 오류:', error);
    return false;
  }
};

/**
 * 텍스트를 파일로 다운로드
 * @param text - 다운로드할 텍스트
 * @param filename - 다운로드할 파일명
 * @param mimeType - MIME 타입 (기본값: text/plain)
 */
export const downloadText = (text: string, filename: string, mimeType: string = 'text/plain') => {
  try {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('텍스트 다운로드 오류:', error);
    return false;
  }
};

/**
 * 파일 확장자를 MIME 타입으로 변환
 * @param filename - 파일명
 * @returns MIME 타입
 */
export const getMimeTypeFromFilename = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'txt':
      return 'text/plain';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
};
