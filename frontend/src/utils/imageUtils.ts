/**
 * 이미지 관련 유틸리티 함수
 */

/**
 * DataURL을 File 객체로 변환하는 유틸리티 함수
 */
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * 이미지 다운로드 유틸리티
 */
export const downloadImage = (imageUrl: string, filename: string = `generated-image-${Date.now()}.png`): void => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 로컬 스토리지 용량 관리 함수
 */
export const manageStorageQuota = (key: string, data: any[]): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`⚠️ ${key} 저장소 용량 초과, 오래된 데이터 정리 중...`);
      
      // 오래된 데이터 제거 (최신 50개만 유지)
      const sortedData = data.sort((a: any, b: any) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });
      const trimmedData = sortedData.slice(0, 50);
      
      try {
        localStorage.setItem(key, JSON.stringify(trimmedData));
        console.log(`✅ ${key} 저장소 정리 완료 (${trimmedData.length}개 항목 유지)`);
        return true;
      } catch (retryError) {
        console.error(`❌ ${key} 저장소 정리 후에도 용량 부족:`, retryError);
        return false;
      }
    }
    throw error;
  }
};

