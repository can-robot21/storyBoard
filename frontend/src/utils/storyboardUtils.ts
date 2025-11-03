/**
 * 스토리보드 관련 유틸리티 함수
 */

import { StoryboardCut, ImageBoardItem } from '../types/storyboard';

/**
 * 컷 넘버 계산 (씬별로 독립적으로 카운트)
 */
export const getNextCutNumber = (sceneNum: string, cuts: StoryboardCut[]): string => {
  // 현재 씬에 속한 컷들만 필터링 (컷 넘버가 있고 같은 씬 번호인 것만)
  const sceneCuts = cuts.filter(cut => {
    if (!cut.cutNumber || cut.cutNumber === '') return false;
    // 같은 씬에 속한 컷인지 확인
    return cut.sceneNum === sceneNum;
  });
  const nextCutNum = sceneCuts.length + 1;
  return `컷${nextCutNum}`;
};

/**
 * 연속된 이미지만 추가 항목 개수 확인
 */
export const getConsecutiveImageOnlyCount = (cuts: StoryboardCut[]): number => {
  let count = 0;
  for (let i = cuts.length - 1; i >= 0; i--) {
    if (cuts[i].imageOnly === true) {
      count++;
    } else {
      break; // 연속이 끊기면 중단
    }
  }
  return count;
};

/**
 * Base64 DataURL을 Blob으로 변환
 */
export const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * 파일을 Base64 데이터 URL로 변환
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 스토리보드 컷 생성
 */
export const createStoryboardCut = (
  id: string,
  cutNumber: string = '',
  sceneNum?: string,
  imageOnly: boolean = false
): StoryboardCut => {
  return {
    id,
    cutNumber,
    sceneNum,
    imageFile: null,
    imagePreview: null,
    description: '',
    imageOnly
  };
};

/**
 * ImageBoard 항목 생성
 */
export const createImageBoardItem = (id: string, number: number): ImageBoardItem => {
  return {
    id,
    number,
    imageFile: null,
    imagePreview: null,
    description: '',
    imageOnly: false
  };
};

/**
 * 연속된 이미지만 추가 항목을 1개로 카운트하여 페이지네이션 계산
 */
export const getEffectivePageCount = (cuts: StoryboardCut[]): number => {
  let count = 0;
  let i = 0;
  while (i < cuts.length) {
    if (cuts[i].imageOnly) {
      // 연속된 이미지만 추가 항목들을 찾아서 1개로 카운트
      while (i < cuts.length && cuts[i].imageOnly) {
        i++;
      }
      count++; // 연속된 그룹을 1개로 카운트
    } else {
      count++; // 일반 항목은 1개씩 카운트
      i++;
    }
  }
  return count;
};

/**
 * 페이지네이션을 고려하여 표시할 컷들 결정
 */
export const getDisplayedCuts = (
  cuts: StoryboardCut[],
  currentPage: number,
  itemsPerPage: number
): StoryboardCut[] => {
  const effectivePageCount = getEffectivePageCount(cuts);
  const totalPages = Math.ceil(effectivePageCount / itemsPerPage);
  
  if (totalPages <= 1) {
    return cuts; // 페이지네이션 불필요
  }
  
  // 현재 페이지에 표시할 항목들 계산
  let pageCount = 0;
  let startIdx = -1;
  let endIdx = cuts.length;
  
  for (let i = 0; i < cuts.length; i++) {
    const targetStartCount = (currentPage - 1) * itemsPerPage;
    const targetEndCount = currentPage * itemsPerPage;
    
    if (cuts[i].imageOnly) {
      // 연속된 이미지만 추가 항목들의 시작 인덱스
      const groupStartIdx = i;
      // 연속된 이미지만 추가 항목들 건너뛰기
      while (i < cuts.length && cuts[i].imageOnly) {
        i++;
      }
      i--; // for 루프의 증가를 보정
      const groupEndIdx = i + 1;
      
      // 페이지 카운트 증가
      pageCount++;
      
      // 시작 인덱스 설정
      if (pageCount === targetStartCount + 1 && startIdx === -1) {
        startIdx = groupStartIdx;
      }
      
      // 끝 인덱스 설정
      if (pageCount === targetEndCount) {
        endIdx = groupEndIdx;
        break;
      }
    } else {
      // 일반 항목
      pageCount++;
      
      // 시작 인덱스 설정
      if (pageCount === targetStartCount + 1 && startIdx === -1) {
        startIdx = i;
      }
      
      // 끝 인덱스 설정
      if (pageCount === targetEndCount) {
        endIdx = i + 1;
        break;
      }
    }
  }
  
  return cuts.slice(startIdx, endIdx);
};

