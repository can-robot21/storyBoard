/**
 * 스토리보드 상태 관리 커스텀 훅
 */

import { useState, useRef, useEffect } from 'react';
import { BoardFormat, HeaderData, StoryboardCut, ImageBoardItem, PDFBlob } from '../types/storyboard';

export const useStoryboard = () => {
  // 양식 선택
  const [boardFormat, setBoardFormat] = useState<BoardFormat>('storyBoard');
  const [isEditing, setIsEditing] = useState(false);
  
  // 상단 입력 필드
  const [headerData, setHeaderData] = useState<HeaderData>({
    title: '',
    date: '',
    time: '',
    location: '',
    scene: '',
    cut: '',
    mainContent: ''
  });

  // 상단 입력 섹션 보이기/감추기
  const [showHeaderSection, setShowHeaderSection] = useState(true);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // StoryBoard 페이지당 표시할 항목 수 (5개 기준)
  const imageBoardItemsPerPage = 9; // ImageBoard 페이지당 표시할 항목 수 (9개 기준)

  // storyBoard용: 수동으로 추가되는 컷들
  const [storyboardCuts, setStoryboardCuts] = useState<StoryboardCut[]>([]);

  // imageBoard용: 수동으로 추가되는 항목들
  const [imageBoardItems, setImageBoardItems] = useState<ImageBoardItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 저장 상태 및 PDF 목록
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlobs, setPdfBlobs] = useState<PDFBlob[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // PDF 미리보기 모달 상태
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<PDFBlob | null>(null);

  // 상단 입력 필드 변경
  const handleHeaderChange = (field: keyof HeaderData, value: string) => {
    setHeaderData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 양식 선택
  const handleFormatChange = (format: BoardFormat) => {
    setBoardFormat(format);
    setIsEditing(false);
    setCurrentPage(1); // 페이지 초기화
    if (format === 'storyBoard') {
      setImageBoardItems([]);
      setStoryboardCuts([]); // 빈 배열로 시작
    } else {
      setStoryboardCuts([]);
      setImageBoardItems([]); // 빈 배열로 시작
    }
  };

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      pdfBlobs.forEach(pdf => URL.revokeObjectURL(pdf.url));
    };
  }, [pdfBlobs]);

  return {
    // 상태
    boardFormat,
    isEditing,
    headerData,
    showHeaderSection,
    currentPage,
    itemsPerPage,
    imageBoardItemsPerPage,
    storyboardCuts,
    imageBoardItems,
    fileInputRef,
    isSaved,
    pdfBlobs,
    isGeneratingPDF,
    showPDFPreview,
    previewPDFBlob,
    
    // 상태 업데이트 함수
    setBoardFormat,
    setIsEditing,
    setHeaderData,
    setShowHeaderSection,
    setCurrentPage,
    setStoryboardCuts,
    setImageBoardItems,
    setIsSaved,
    setPdfBlobs,
    setIsGeneratingPDF,
    setShowPDFPreview,
    setPreviewPDFBlob,
    
    // 핸들러
    handleHeaderChange,
    handleFormatChange
  };
};

