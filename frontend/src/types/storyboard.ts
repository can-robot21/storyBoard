/**
 * 스토리보드 관련 타입 정의
 */

export type BoardFormat = 'storyBoard' | 'imageBoard';

export interface HeaderData {
  title: string;
  date: string;
  time: string;
  location: string;
  scene: string;
  cut: string;
  mainContent: string;
}

export interface StoryboardCut {
  id: string;
  cutNumber: string;
  sceneNum?: string; // 씬 번호 (씬별 컷 카운트용)
  imageFile: File | null;
  imagePreview: string | null;
  description: string;
  imageOnly?: boolean; // 이미지만 추가 항목 여부
}

export interface ImageBoardItem {
  id: string;
  number: number;
  imageFile: File | null;
  imagePreview: string | null;
  description: string;
  imageOnly?: boolean; // 이미지만 추가 항목 여부
}

export interface PDFBlob {
  page: number;
  blob: Blob;
  url: string;
}

export interface StoryboardGeneratorProps {
  onBack: () => void;
}

