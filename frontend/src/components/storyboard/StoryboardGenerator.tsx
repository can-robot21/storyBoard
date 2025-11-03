import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, FileDown, Edit, RotateCcw, Eye, Download } from 'lucide-react';
import { generatePDFBlob, PDFGenerationData } from '../../services/pdfGenerationService';
import { saveCompressedImagesAndText } from '../../services/pdfGenerationServiceHybrid';

interface StoryboardGeneratorProps {
  onBack: () => void;
}

type BoardFormat = 'storyBoard' | 'imageBoard';

interface StoryboardCut {
  id: string;
  cutNumber: string;
  sceneNum?: string; // 씬 번호 (씬별 컷 카운트용)
  imageFile: File | null;
  imagePreview: string | null;
  description: string;
  imageOnly?: boolean; // 이미지만 추가 항목 여부
}

interface ImageBoardItem {
  id: string;
  number: number;
  imageFile: File | null;
  imagePreview: string | null;
  description: string;
  imageOnly?: boolean; // 이미지만 추가 항목 여부
}

const StoryboardGenerator: React.FC<StoryboardGeneratorProps> = ({ onBack }) => {
  const [boardFormat, setBoardFormat] = useState<BoardFormat>('storyBoard');
  const [isEditing, setIsEditing] = useState(false);
  
  // 상단 입력 필드
  const [headerData, setHeaderData] = useState({
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

  // 상단 입력 필드 변경
  const handleHeaderChange = (field: string, value: string) => {
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

  // 컷 넘버 계산 (씬별로 독립적으로 카운트)
  const getNextCutNumber = (sceneNum: string): string => {
    // 현재 씬에 속한 컷들만 필터링 (컷 넘버가 있고 같은 씬 번호인 것만)
    const sceneCuts = storyboardCuts.filter(cut => {
      if (!cut.cutNumber || cut.cutNumber === '') return false;
      // 같은 씬에 속한 컷인지 확인
      return cut.sceneNum === sceneNum;
    });
    const nextCutNum = sceneCuts.length + 1;
    return `컷${nextCutNum}`;
  };

  // [컷] 추가 버튼 핸들러 (컷 넘버 자동 추가)
  const handleAddCut = () => {
    const sceneNum = headerData.scene || '1';
    const nextCutNumber = getNextCutNumber(sceneNum);
    const newCut: StoryboardCut = {
      id: `cut_${Date.now()}_${Math.random()}`,
      cutNumber: nextCutNumber,
      sceneNum: sceneNum, // 씬 번호 저장
      imageFile: null,
      imagePreview: null,
      description: ''
    };
    setStoryboardCuts(prev => [...prev, newCut]);
    // 새 컷이 추가되면 마지막 페이지로 이동
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  };

  // [이미지] 추가 버튼 핸들러 (컷 넘버 없음)
  const handleAddImage = () => {
    const newCut: StoryboardCut = {
      id: `image_${Date.now()}_${Math.random()}`,
      cutNumber: '', // 컷 넘버 없음
      imageFile: null,
      imagePreview: null,
      description: '',
      imageOnly: false // 텍스트 입력란 포함
    };
    setStoryboardCuts(prev => [...prev, newCut]);
    // 새 이미지가 추가되면 마지막 페이지로 이동
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  };

  // [이미지만 추가] 버튼 핸들러 (텍스트 입력란 없음, 최대 3개 연속)
  const handleAddImageOnly = () => {
    // 마지막 항목부터 역순으로 연속된 이미지만 추가 항목 개수 확인
    let consecutiveImageOnlyCount = 0;
    for (let i = storyboardCuts.length - 1; i >= 0; i--) {
      if (storyboardCuts[i].imageOnly === true) {
        consecutiveImageOnlyCount++;
      } else {
        break; // 연속이 끊기면 중단
      }
    }
    
    // 연속으로 3개 이상인 경우 제한
    if (consecutiveImageOnlyCount >= 3) {
      alert('이미지만 추가 항목은 3개 연속으로 추가할 수 없습니다.\n\n다른 유형의 항목([컷] 추가 또는 [이미지] 추가)을 먼저 추가해주세요.');
      return;
    }
    
    const newCut: StoryboardCut = {
      id: `imageOnly_${Date.now()}_${Math.random()}`,
      cutNumber: '', // 컷 넘버 없음
      imageFile: null,
      imagePreview: null,
      description: '',
      imageOnly: true // 이미지만 추가
    };
    setStoryboardCuts(prev => [...prev, newCut]);
    // 새 이미지가 추가되면 마지막 페이지로 이동
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  };

  // ImageBoard: [이미지] 추가 버튼 핸들러
  const handleAddImageBoardItem = () => {
    const nextNumber = imageBoardItems.length + 1;
    const newItem: ImageBoardItem = {
      id: `image_${Date.now()}_${Math.random()}`,
      number: nextNumber,
      imageFile: null,
      imagePreview: null,
      description: '',
      imageOnly: false // 텍스트 입력란 포함
    };
    setImageBoardItems(prev => [...prev, newItem]);
    // 새 항목이 추가되면 마지막 페이지로 이동
    const totalPages = Math.ceil((imageBoardItems.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  };


  // 컷 삭제 핸들러
  const handleRemoveCut = (cutId: string) => {
    setStoryboardCuts(prev => prev.filter(cut => cut.id !== cutId));
  };

  // ImageBoard 항목 삭제 핸들러
  const handleRemoveImageBoardItem = (itemId: string) => {
    setImageBoardItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      // 번호 재정렬
      return filtered.map((item, index) => ({
        ...item,
        number: index + 1
      }));
    });
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (itemId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      
      if (boardFormat === 'storyBoard') {
        setStoryboardCuts(prev =>
      prev.map(item => 
            item.id === itemId
              ? { ...item, imageFile: file, imagePreview: preview }
              : item
          )
        );
      } else {
        setImageBoardItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, imageFile: file, imagePreview: preview }
              : item
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // 이미지 제거
  const handleImageRemove = (itemId: string) => {
    if (boardFormat === 'storyBoard') {
      setStoryboardCuts(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, imageFile: null, imagePreview: null }
            : item
        )
      );
    } else {
      setImageBoardItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, imageFile: null, imagePreview: null }
            : item
        )
      );
    }
  };

  // 설명 변경
  const handleDescriptionChange = (itemId: string, description: string) => {
    if (boardFormat === 'storyBoard') {
      setStoryboardCuts(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, description } : item
        )
      );
    } else {
      setImageBoardItems(prev =>
      prev.map(item => 
          item.id === itemId ? { ...item, description } : item
        )
      );
    }
  };

  // 저장 상태 및 PDF 목록
  const [isSaved, setIsSaved] = useState(false);
  const [pdfBlobs, setPdfBlobs] = useState<Array<{ page: number; blob: Blob; url: string }>>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // PDF 미리보기 모달 상태
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<{ page: number; blob: Blob; url: string } | null>(null);

  // 입력/수정 버튼 클릭 (저장만, PDF 생성 안 함)
  const handleSave = () => {
    if (!isEditing) {
      // 수정 모드 진입
      setIsEditing(true);
      return;
    }

    // 저장 모드: 데이터만 저장 (PDF 생성 안 함)
    setIsSaved(true);
    setIsEditing(false);
    alert('저장 완료!\n\n샘플 미리보기 하단의 [PDF 미리보기] 버튼을 클릭하여 PDF를 생성하고 미리보기할 수 있습니다.');
  };

  // PDF 미리보기 생성 및 모달 표시
  const handlePDFPreview = async () => {
    setIsGeneratingPDF(true);
    try {
      // 데이터 검증 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 PDF 미리보기 데이터 준비:', {
        format: boardFormat,
          storyboardCuts: storyboardCuts.length,
          imageBoardItems: imageBoardItems.length,
          cutsWithImages: storyboardCuts.filter(c => c.imagePreview).length,
          cutsWithDescription: storyboardCuts.filter(c => c.description).length
        });
      }
      
      const pdfData: PDFGenerationData = {
        headerData,
        boardFormat,
        storyboardCuts: boardFormat === 'storyBoard' ? storyboardCuts.map(cut => ({
          id: cut.id,
          cutNumber: cut.cutNumber,
          imagePreview: cut.imagePreview, // Base64 데이터 URL이어야 함
          description: cut.description || '',
          imageOnly: cut.imageOnly || false
        })) : undefined,
        imageBoardItems: boardFormat === 'imageBoard' ? imageBoardItems.map(item => ({
          id: item.id,
          number: item.number,
          imagePreview: item.imagePreview, // Base64 데이터 URL이어야 함
          description: item.description || '',
          imageOnly: item.imageOnly || false
        })) : undefined
      };

      // 데이터 전달 전 최종 확인 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development' && boardFormat === 'storyBoard' && pdfData.storyboardCuts) {
        const firstCutWithImage = pdfData.storyboardCuts.find(c => c.imagePreview);
        if (firstCutWithImage) {
          console.log('🖼️ 첫 번째 이미지 샘플:', {
            previewType: firstCutWithImage.imagePreview?.substring(0, 30),
            hasData: !!firstCutWithImage.imagePreview,
            description: firstCutWithImage.description?.substring(0, 50)
          });
        }
      }

      const blob = await generatePDFBlob(pdfData);
      const url = URL.createObjectURL(blob);
      
      const pdfBlob = { page: 1, blob, url };
      setPreviewPDFBlob(pdfBlob);
      setPdfBlobs([pdfBlob]);
      setShowPDFPreview(true);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('PDF 생성 오류:', error);
      }
      alert('PDF 생성 중 오류가 발생했습니다.\n\n' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 이미지+내용 저장 핸들러
  const handleSaveImagesAndText = async () => {
    if (!isSaved) {
      alert('먼저 저장 버튼을 클릭하여 데이터를 저장해주세요.');
      return;
    }

    // 씬 넘버 확인
    const sceneNum = headerData.scene || '1';
    const formatPrefix = boardFormat === 'storyBoard' ? 'storyboard' : 'imageboard';
    const fileNamePrefix = `${formatPrefix}_씬${sceneNum}`;

    setIsGeneratingPDF(true);
    try {
      const pdfData: PDFGenerationData = {
        headerData,
        boardFormat,
        storyboardCuts: boardFormat === 'storyBoard' ? storyboardCuts.map(cut => ({
          id: cut.id,
          cutNumber: cut.cutNumber,
          imagePreview: cut.imagePreview,
          description: cut.description || '',
          imageOnly: cut.imageOnly || false
        })) : undefined,
        imageBoardItems: boardFormat === 'imageBoard' ? imageBoardItems.map(item => ({
          id: item.id,
          number: item.number,
          imagePreview: item.imagePreview,
          description: item.description || '',
          imageOnly: item.imageOnly || false
        })) : undefined
      };

      const { images, text } = await saveCompressedImagesAndText(pdfData);
      
      // 텍스트 파일로 저장
      const textBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `${fileNamePrefix}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);

      // 이미지들을 ZIP으로 저장하는 대신, 개별 이미지로 저장하거나 하나의 파일로 저장
      // 여기서는 각 이미지를 개별적으로 저장
      images.forEach((imgData, index) => {
        const imgBlob = dataURLtoBlob(imgData);
        const imgUrl = URL.createObjectURL(imgBlob);
        const imgLink = document.createElement('a');
        imgLink.href = imgUrl;
        imgLink.download = `${fileNamePrefix}_이미지${index + 1}.jpg`;
        document.body.appendChild(imgLink);
        imgLink.click();
        document.body.removeChild(imgLink);
        URL.revokeObjectURL(imgUrl);
      });

      alert(`저장 완료!\n\n이미지 ${images.length}개와 텍스트 파일이 다운로드되었습니다.`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('이미지+내용 저장 오류:', error);
      }
      alert('이미지+내용 저장 중 오류가 발생했습니다.\n\n' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Base64 DataURL을 Blob으로 변환
  const dataURLtoBlob = (dataURL: string): Blob => {
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

  // PDF 출력 (인쇄)
  const handlePDFPrint = () => {
    if (previewPDFBlob) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = previewPDFBlob.url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      };
    }
  };

  // PDF 저장 (다운로드)
  const handlePDFSave = () => {
    if (previewPDFBlob) {
      handlePDFDownload(previewPDFBlob);
    }
  };

  // PDF 미리보기 모달 닫기
  const handleClosePDFPreview = () => {
    setShowPDFPreview(false);
    if (previewPDFBlob) {
      URL.revokeObjectURL(previewPDFBlob.url);
      setPreviewPDFBlob(null);
    }
  };

  // 수정 버튼 클릭
  const handleEdit = () => {
    setIsEditing(true);
    setIsSaved(false);
  };

  // 초기화 버튼 클릭
  const handleReset = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) {
      // 모든 상태 초기화
      setHeaderData({
        title: '',
        date: '',
        time: '',
        location: '',
        scene: '',
        cut: '',
        mainContent: ''
      });
      setStoryboardCuts([]);
      setImageBoardItems([]);
      setIsEditing(false);
      setIsSaved(false);
      setPdfBlobs([]);
      setCurrentPage(1);
      
      // PDF URL 정리
      pdfBlobs.forEach(pdf => URL.revokeObjectURL(pdf.url));
      
      alert('모든 데이터가 초기화되었습니다.');
    }
  };

  // 컴포넌트 언마운트 시 URL 정리
  // 컷 수 자동 카운트 및 headerData.cut 업데이트
  useEffect(() => {
    if (boardFormat === 'storyBoard') {
      // StoryBoard: 컷 번호가 있는 컷들만 카운트
      const cutsWithNumber = storyboardCuts.filter(cut => cut.cutNumber && cut.cutNumber !== '');
      setHeaderData(prev => ({
        ...prev,
        cut: cutsWithNumber.length.toString()
      }));
    } else if (boardFormat === 'imageBoard') {
      // ImageBoard: 전체 항목 개수 카운트
      setHeaderData(prev => ({
        ...prev,
        cut: imageBoardItems.length.toString()
      }));
    }
  }, [boardFormat, storyboardCuts, imageBoardItems]);

  useEffect(() => {
    return () => {
      pdfBlobs.forEach(pdf => URL.revokeObjectURL(pdf.url));
    };
  }, [pdfBlobs]);

  // PDF 다운로드
  const handlePDFDownload = (pdfBlob: { page: number; blob: Blob; url: string }) => {
    // 씬 넘버 확인
    const sceneNum = headerData.scene || '1';
    const formatPrefix = boardFormat === 'storyBoard' ? 'storyboard' : 'imageboard';
    const fileName = pdfBlobs.length > 1 
      ? `${formatPrefix}_씬${sceneNum}_${pdfBlob.page}page.pdf`
      : `${formatPrefix}_씬${sceneNum}.pdf`;
    
    const link = document.createElement('a');
    link.href = pdfBlob.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(itemId, file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full">
        {/* 상단 네비게이션 */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-3 md:mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            스토리보드 생성기 종료
          </button>

          {/* 양식 선택 */}
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-md">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">스토리보드 양식 선택</label>
            <div className="flex gap-2 md:gap-4">
              <button
                onClick={() => handleFormatChange('storyBoard')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg text-xs md:text-base font-medium transition-colors ${
                  boardFormat === 'storyBoard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                StoryBoard
              </button>
              <button
                onClick={() => handleFormatChange('imageBoard')}
                className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-3 rounded-lg text-xs md:text-base font-medium transition-colors ${
                  boardFormat === 'imageBoard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ImageBoard
          </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 lg:p-8">
          {/* 상단 입력 섹션 */}
          <div className="mb-4 md:mb-6 lg:mb-8 border-b pb-4 md:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">상단 정보</h2>
                <button
                  onClick={() => setShowHeaderSection(!showHeaderSection)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-xs md:text-sm flex items-center gap-1"
                >
                  <span>{showHeaderSection ? '👁️' : '👁️‍🗨️'}</span>
                  <span>{showHeaderSection ? '감추기' : '보이기'}</span>
                </button>
              </div>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
              >
                {isEditing ? '수정 완료' : '입력/수정'}
              </button>
            </div>

            {showHeaderSection && (
              <div className="space-y-4">
                {/* 2열 그리드: 타이틀, 날짜, 시간, 씬, 컷 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {boardFormat === 'storyBoard' && (
                    <>
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">타이틀 (Title)</label>
                <input
                  type="text"
                          value={headerData.title}
                          onChange={(e) => handleHeaderChange('title', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="프로젝트 타이틀"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">날짜 (Date)</label>
                <input
                  type="date"
                          value={headerData.date}
                          onChange={(e) => handleHeaderChange('date', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">시간 (Time)</label>
                        <input
                          type="time"
                          value={headerData.time}
                          onChange={(e) => handleHeaderChange('time', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">장소 (Location)</label>
                <input
                  type="text"
                          value={headerData.location}
                          onChange={(e) => handleHeaderChange('location', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="촬영 장소"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">씬 (Scene)</label>
                <input
                  type="text"
                          value={headerData.scene}
                          onChange={(e) => handleHeaderChange('scene', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="씬 번호"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">컷 (Cut)</label>
                <input
                  type="text"
                          value={headerData.cut}
                          onChange={(e) => handleHeaderChange('cut', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="컷 번호"
                          disabled={!isEditing}
                />
              </div>
                    </>
                  )}

                  {/* imageBoard: 날짜, 장소 제외 */}
                  {boardFormat === 'imageBoard' && (
                    <>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">타이틀 (Title)</label>
                        <input
                          type="text"
                          value={headerData.title}
                          onChange={(e) => handleHeaderChange('title', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="프로젝트 타이틀"
                          disabled={!isEditing}
                        />
            </div>

                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">시간 (Time)</label>
                        <input
                          type="time"
                          value={headerData.time}
                          onChange={(e) => handleHeaderChange('time', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={!isEditing}
                />
          </div>

              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">씬 (Scene)</label>
                <input
                  type="text"
                          value={headerData.scene}
                          onChange={(e) => handleHeaderChange('scene', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="씬 번호"
                          disabled={!isEditing}
                />
              </div>
              
              <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">컷 (Cut)</label>
                <input
                  type="text"
                          value={headerData.cut}
                          onChange={(e) => handleHeaderChange('cut', e.target.value)}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="컷 번호"
                          disabled={!isEditing}
                />
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* 본문 섹션 */}
          <div>
            {boardFormat === 'storyBoard' ? (
              // StoryBoard 양식
              <div className="h-full flex flex-col">
                {/* 샘플 미리보기 : 본문 영역 = 1:3 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 flex-shrink-0">
                  {/* 샘플 미리보기 영역 (1/4) */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3">샘플 미리보기</h3>
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">
                          <p className="font-medium mb-1">프로젝트 정보</p>
                          <p className="text-xs">{headerData.title || '타이틀 미입력'}</p>
                          <p className="text-xs">{headerData.date || '날짜 미입력'}</p>
                          <p className="text-xs">{headerData.scene || '씬 미입력'}</p>
                        </div>
                        {storyboardCuts.filter(cut => cut.imagePreview).length > 0 && (
                          <div className="text-xs text-gray-600 mt-3">
                            <p className="font-medium mb-1">첨부된 이미지</p>
                            <p className="text-xs">{storyboardCuts.filter(cut => cut.imagePreview).length}개</p>
                          </div>
                        )}
                        
                        {/* PDF 미리보기 버튼 (항상 표시, 상태에 따라 활성/비활성) */}
                        <div className="mt-4 pt-3 border-t border-gray-300 space-y-2">
              <button
                            onClick={handlePDFPreview}
                            disabled={!isSaved || isGeneratingPDF}
                            className={`
                              w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs md:text-sm transition-colors font-medium
                              ${!isSaved 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : isGeneratingPDF
                                ? 'bg-gray-400 text-white cursor-wait'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                              }
                            `}
                            title={!isSaved ? '먼저 저장해주세요' : 'PDF 미리보기'}
                          >
                            <Eye className={`w-4 h-4 ${!isSaved ? 'opacity-50' : ''}`} />
                            <span>
                              {!isSaved 
                                ? '저장 후 미리보기' 
                                : isGeneratingPDF 
                                ? 'PDF 생성 중...' 
                                : 'PDF 미리보기'
                              }
                            </span>
                          </button>
                          
                          {/* 이미지+내용 저장 버튼 */}
                          <button
                            onClick={handleSaveImagesAndText}
                            disabled={!isSaved || isGeneratingPDF}
                            className={`
                              w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs md:text-sm transition-colors font-medium
                              ${!isSaved 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : isGeneratingPDF
                                ? 'bg-gray-400 text-white cursor-wait'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }
                            `}
                            title={!isSaved ? '먼저 저장해주세요' : '이미지 압축 및 텍스트 저장'}
                          >
                            <FileDown className={`w-4 h-4 ${!isSaved ? 'opacity-50' : ''}`} />
                            <span>
                              {!isSaved 
                                ? '저장 후 다운로드' 
                                : isGeneratingPDF 
                                ? '처리 중...' 
                                : '[이미지+내용]'
                              }
                            </span>
              </button>
                        </div>
                      </div>
                    </div>
            </div>

                  {/* 본문 영역 (3/4) */}
                  <div className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">StoryBoard 본문</h2>
                      <div className="text-xs md:text-sm text-gray-600">
                        씬: {headerData.scene || '미입력'}
                      </div>
                    </div>

                    {/* 주요내용 */}
                    <div className="mb-4 md:mb-6">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">주요내용</label>
                      <textarea
                        value={headerData.mainContent}
                        onChange={(e) => handleHeaderChange('mainContent', e.target.value)}
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        rows={3}
                        placeholder="주요 내용을 입력하세요"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* 컷 추가 버튼들 */}
                    <div className="mb-4 md:mb-6 flex flex-wrap gap-2 md:gap-3">
                    <button
                        onClick={handleAddCut}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base flex items-center gap-2"
                      >
                        <span>+</span>
                        <span>[컷] 추가</span>
                      </button>
                      <button
                        onClick={handleAddImage}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>[이미지] 추가</span>
                      </button>
              <button
                        onClick={handleAddImageOnly}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>[이미지만 추가]</span>
                        <span className="text-xs bg-purple-800 px-1.5 py-0.5 rounded">
                          (최대 3개)
                        </span>
                    </button>
                  </div>
                  
                    {/* 컷 목록 - 세로 배치 */}
                    <div className="space-y-4 md:space-y-6">
                      {(() => {
                        // 연속된 이미지만 추가 항목을 1개로 카운트하여 페이지네이션 계산
                        const getPageCount = (cuts: typeof storyboardCuts): number => {
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
                        
                        // 표시할 컷들을 결정 (연속된 이미지만 추가 항목을 고려)
                        const getDisplayedCuts = (): typeof storyboardCuts => {
                          const totalPages = Math.ceil(getPageCount(storyboardCuts) / itemsPerPage);
                          if (totalPages <= 1) {
                            return storyboardCuts; // 페이지네이션 불필요
                          }
                          
                          // 현재 페이지에 표시할 항목들 계산
                          let pageCount = 0;
                          let startIdx = -1;
                          let endIdx = storyboardCuts.length;
                          
                          for (let i = 0; i < storyboardCuts.length; i++) {
                            const targetStartCount = (currentPage - 1) * itemsPerPage;
                            const targetEndCount = currentPage * itemsPerPage;
                            
                            if (storyboardCuts[i].imageOnly) {
                              // 연속된 이미지만 추가 항목들의 시작 인덱스
                              const groupStartIdx = i;
                              // 연속된 이미지만 추가 항목들 건너뛰기
                              while (i < storyboardCuts.length && storyboardCuts[i].imageOnly) {
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
                          
                          return storyboardCuts.slice(startIdx, endIdx);
                        };
                        
                        const effectivePageCount = getPageCount(storyboardCuts);
                        const displayedCuts = effectivePageCount > itemsPerPage 
                          ? getDisplayedCuts()
                          : storyboardCuts;
                        
                        if (displayedCuts.length === 0) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              <p className="text-sm md:text-base">컷을 추가해주세요.</p>
                              <p className="text-xs md:text-sm mt-2">[컷] 추가 또는 [이미지] 추가 버튼을 클릭하세요.</p>
                            </div>
                          );
                        }
                        
                        // 이미지만 추가 항목들을 그룹화하여 가로로 배치
                        const result: React.ReactElement[] = [];
                        let currentImageOnlyGroup: typeof displayedCuts = [];
                        
                        displayedCuts.forEach((cut, index) => {
                          if (cut.imageOnly) {
                            // 이미지만 추가 항목: 그룹에 추가
                            currentImageOnlyGroup.push(cut);
                            
                            // 마지막 항목이거나 다음 항목이 이미지만 추가가 아니면 그룹 렌더링
                            if (index === displayedCuts.length - 1 || !displayedCuts[index + 1]?.imageOnly) {
                              // 그룹을 3개씩 가로 배치
                              for (let i = 0; i < currentImageOnlyGroup.length; i += 3) {
                                const group = currentImageOnlyGroup.slice(i, i + 3);
                                result.push(
                                  <div key={`imageOnly-group-${index}-${i}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                                    {group.map((cutItem) => (
                                      <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative">
                                        {/* 삭제 버튼 */}
                                        <button
                                          onClick={() => handleRemoveCut(cutItem.id)}
                                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                                          title="삭제"
                                        >
                                          <X className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>
                                        
                                        {/* 이미지만 추가: 이미지만 표시 (텍스트 입력 없음) */}
                                        <div className="w-full">
                                          {cutItem.imagePreview ? (
                                            <div className="relative group">
                                              <img
                                                src={cutItem.imagePreview}
                                                alt="이미지만 추가"
                                                className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                                              />
                                              <button
                                                onClick={() => handleImageRemove(cutItem.id)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3 md:w-4 md:h-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 lg:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                              <Upload className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-1" />
                                              <span className="text-xs text-gray-600">이미지</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileSelect(cutItem.id, e)}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              // 그룹 초기화
                              currentImageOnlyGroup = [];
                            }
                          } else {
                            // 일반 항목: 세로 배치
                            // 먼저 이미지만 추가 그룹이 있다면 렌더링
                            if (currentImageOnlyGroup.length > 0) {
                              for (let i = 0; i < currentImageOnlyGroup.length; i += 3) {
                                const group = currentImageOnlyGroup.slice(i, i + 3);
                                result.push(
                                  <div key={`imageOnly-group-${index}-${i}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                                    {group.map((cutItem) => (
                                      <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative">
                                        <button
                                          onClick={() => handleRemoveCut(cutItem.id)}
                                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                                          title="삭제"
                                        >
                                          <X className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>
                                        {/* 이미지만 추가: 이미지만 표시 (텍스트 입력 없음) */}
                                        <div className="w-full">
                                          {cutItem.imagePreview ? (
                                            <div className="relative group">
                                              <img
                                                src={cutItem.imagePreview}
                                                alt="이미지만 추가"
                                                className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                                              />
                                              <button
                                                onClick={() => handleImageRemove(cutItem.id)}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="w-3 h-3 md:w-4 md:h-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 lg:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                              <Upload className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-1" />
                                              <span className="text-xs text-gray-600">이미지</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileSelect(cutItem.id, e)}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              currentImageOnlyGroup = [];
                            }
                            
                            // 일반 항목 렌더링
                            result.push(
                              <div key={cut.id} className="flex flex-col gap-3 md:gap-4 rounded-lg border border-gray-200 p-3 md:p-4 bg-gray-50 relative">
                                {/* 삭제 버튼 */}
                                <button
                                  onClick={() => handleRemoveCut(cut.id)}
                                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                                  title="삭제"
                                >
                                  <X className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                                
                                {/* 컷넘버 표시 (있는 경우만) */}
                                {cut.cutNumber && (
                    <div>
                                    <span className="text-xs md:text-sm font-medium text-gray-700">{cut.cutNumber}</span>
                                  </div>
                                )}

                                {/* 일반 항목: 이미지 + 텍스트 입력란 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                                  {/* 이미지 업로드 영역 (1/3) */}
                                  <div className="md:col-span-1">
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">이미지</label>
                                    {cut.imagePreview ? (
                                      <div className="relative group">
                                        <img
                                          src={cut.imagePreview}
                                          alt={cut.cutNumber || '이미지'}
                                          className="w-full h-40 md:h-48 lg:h-56 object-cover rounded-lg border"
                                        />
                                        <button
                                          onClick={() => handleImageRemove(cut.id)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="w-3 h-3 md:w-4 md:h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 lg:h-56 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                        <Upload className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-1" />
                                        <span className="text-xs text-gray-600">이미지</span>
                      <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleFileSelect(cut.id, e)}
                                        />
                                      </label>
                                    )}
                    </div>
                    
                                  {/* 텍스트 입력란 (2/3) */}
                                  <div className="md:col-span-2">
                                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">텍스트 입력</label>
                                    <textarea
                                      value={cut.description}
                                      onChange={(e) => handleDescriptionChange(cut.id, e.target.value)}
                                      className="w-full min-h-[160px] md:min-h-[192px] lg:min-h-[224px] px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm resize-none"
                                      placeholder="카메라이동/설명/대사를 입력하세요."
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        });
                        
                        // 마지막에 남은 이미지만 추가 그룹이 있다면 렌더링
                        if (currentImageOnlyGroup.length > 0) {
                          for (let i = 0; i < currentImageOnlyGroup.length; i += 3) {
                            const group = currentImageOnlyGroup.slice(i, i + 3);
                            result.push(
                              <div key={`imageOnly-group-final-${i}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                                {group.map((cutItem) => (
                                  <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative">
                                    <button
                                      onClick={() => handleRemoveCut(cutItem.id)}
                                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                                      title="삭제"
                                    >
                                      <X className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                    {/* 이미지만 추가: 이미지만 표시 (텍스트 입력 없음) */}
                                    <div className="w-full">
                                      {cutItem.imagePreview ? (
                                        <div className="relative group">
                                          <img
                                            src={cutItem.imagePreview}
                                            alt="이미지만 추가"
                                            className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                                          />
                                          <button
                                            onClick={() => handleImageRemove(cutItem.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <X className="w-3 h-3 md:w-4 md:h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 lg:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                          <Upload className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-1" />
                                          <span className="text-xs text-gray-600">이미지</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(cutItem.id, e)}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }
                        
                        return result;
                      })()}
                    </div>

                    {/* 페이지네이션 - 5개 기준 (연속된 이미지만 추가 항목은 1개로 카운트) */}
                    {(() => {
                      // 연속된 이미지만 추가 항목을 1개로 카운트
                      const getPageCount = (cuts: typeof storyboardCuts): number => {
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
                      
                      const effectivePageCount = getPageCount(storyboardCuts);
                      const totalPages = Math.ceil(effectivePageCount / itemsPerPage);
                      
                      if (effectivePageCount <= itemsPerPage) {
                        return null; // 페이지네이션 불필요
                      }
                      
                      return (
                        <div className="mt-6 flex flex-col items-center gap-4">
                          {/* 페이지네이션 컨트롤 */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
                            >
                              이전
                            </button>
                            <span className="text-sm text-gray-700">
                              {currentPage} / {totalPages}
                            </span>
                    <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage >= totalPages}
                              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
                    >
                              다음
                    </button>
                          </div>
                          <div className="text-xs text-gray-500">
                            전체 {effectivePageCount}개 항목(연속 이미지만 추가 그룹은 1개로 계산) 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, effectivePageCount)}번째 항목 표시
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              // ImageBoard 양식 (3x3 그리드)
              <div className="h-full flex flex-col">
                {/* 샘플 미리보기 : 본문 영역 = 1:3 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4 flex-shrink-0">
                  {/* 샘플 미리보기 영역 (1/4) */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3">샘플 미리보기</h3>
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">
                          <p className="font-medium mb-1">프로젝트 정보</p>
                          <p className="text-xs">{headerData.title || '타이틀 미입력'}</p>
                          <p className="text-xs">{headerData.time || '시간 미입력'}</p>
                          <p className="text-xs">{headerData.scene || '씬 미입력'}</p>
                        </div>
                        {imageBoardItems.filter(item => item.imagePreview).length > 0 && (
                          <div className="text-xs text-gray-600 mt-3">
                            <p className="font-medium mb-1">첨부된 이미지</p>
                            <p className="text-xs">{imageBoardItems.filter(item => item.imagePreview).length}/9</p>
                          </div>
                        )}
                        
                        {/* PDF 미리보기 버튼 (항상 표시, 상태에 따라 활성/비활성) */}
                        <div className="mt-4 pt-3 border-t border-gray-300 space-y-2">
                          <button
                            onClick={handlePDFPreview}
                            disabled={!isSaved || isGeneratingPDF}
                            className={`
                              w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs md:text-sm transition-colors font-medium
                              ${!isSaved 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : isGeneratingPDF
                                ? 'bg-gray-400 text-white cursor-wait'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                              }
                            `}
                            title={!isSaved ? '먼저 저장해주세요' : 'PDF 미리보기'}
                          >
                            <Eye className={`w-4 h-4 ${!isSaved ? 'opacity-50' : ''}`} />
                            <span>
                              {!isSaved 
                                ? '저장 후 미리보기' 
                                : isGeneratingPDF 
                                ? 'PDF 생성 중...' 
                                : 'PDF 미리보기'
                              }
                            </span>
                          </button>
                          
                          {/* 이미지+내용 저장 버튼 */}
                          <button
                            onClick={handleSaveImagesAndText}
                            disabled={!isSaved || isGeneratingPDF}
                            className={`
                              w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs md:text-sm transition-colors font-medium
                              ${!isSaved 
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                                : isGeneratingPDF
                                ? 'bg-gray-400 text-white cursor-wait'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }
                            `}
                            title={!isSaved ? '먼저 저장해주세요' : '이미지 압축 및 텍스트 저장'}
                          >
                            <FileDown className={`w-4 h-4 ${!isSaved ? 'opacity-50' : ''}`} />
                            <span>
                              {!isSaved 
                                ? '저장 후 다운로드' 
                                : isGeneratingPDF 
                                ? '처리 중...' 
                                : '[이미지+내용]'
                              }
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 본문 영역 (3/4) - 현재 구성 유지 */}
                  <div className="lg:col-span-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">ImageBoard 본문 (3x3)</h2>
                      <div className="text-xs md:text-sm text-gray-600">
                        씬: {headerData.scene || '미입력'}
                      </div>
                    </div>
                    
                    {/* 주요내용 */}
                    <div className="mb-4 md:mb-6">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">주요내용</label>
                      <textarea
                        value={headerData.mainContent}
                        onChange={(e) => handleHeaderChange('mainContent', e.target.value)}
                        className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        rows={3}
                        placeholder="주요 내용을 입력하세요"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* 이미지 추가 버튼 */}
                    <div className="mb-4 md:mb-6 flex flex-wrap gap-2 md:gap-3">
                      <button
                        onClick={handleAddImageBoardItem}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>[이미지] 추가</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {(() => {
                        // 페이지네이션 적용 (9개 기준)
                        const totalItems = imageBoardItems.length;
                        const startIndex = (currentPage - 1) * imageBoardItemsPerPage;
                        const endIndex = startIndex + imageBoardItemsPerPage;
                        
                        const displayedItems = totalItems > imageBoardItemsPerPage 
                          ? imageBoardItems.slice(startIndex, endIndex)
                          : imageBoardItems;
                        
                        if (displayedItems.length === 0) {
                          return (
                            <div className="col-span-full text-center py-8 text-gray-500">
                              <p className="text-sm md:text-base">이미지를 추가해주세요.</p>
                              <p className="text-xs md:text-sm mt-2">[이미지] 추가 버튼을 클릭하세요.</p>
                            </div>
                          );
                        }
                        
                        return displayedItems.map((item) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-2 md:p-3 lg:p-4 relative">
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => handleRemoveImageBoardItem(item.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                              title="삭제"
                            >
                              <X className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            
                            <div className="mb-2">
                              <span className="text-xs md:text-sm font-medium text-gray-700">컷{item.number}</span>
                            </div>

                            {/* 이미지 업로드 영역 */}
                            <div className="mb-2 md:mb-3">
                              {item.imagePreview ? (
                                <div className="relative group">
                                  <img
                                    src={item.imagePreview}
                                    alt={`이미지 ${item.number}`}
                                    className="w-full h-32 md:h-36 lg:h-40 object-cover rounded-lg border"
                                  />
                                  <button
                                    onClick={() => handleImageRemove(item.id)}
                                    className="absolute top-1 right-1 md:top-2 md:right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3 md:w-4 md:h-4" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 md:h-36 lg:h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mb-1 md:mb-2" />
                                  <span className="text-xs md:text-sm text-gray-600">이미지 업로드</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(item.id, e)}
                                  />
                                </label>
                              )}
                            </div>

                            {/* 설명 텍스트 폼 (imageOnly가 아닌 경우만 표시) */}
                            {!item.imageOnly && (
                    <div>
                                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">설명</label>
                      <textarea
                        value={item.description}
                                  onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
                                  className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm resize-none"
                                  rows={2}
                                  placeholder="순서대로 설명 입력"
                      />
                    </div>
                            )}
                  </div>
                        ));
                      })()}
                </div>

                    {/* 페이지네이션 - 9개 기준 */}
                    {imageBoardItems.length > imageBoardItemsPerPage && (
                      <div className="mt-6 flex flex-col items-center gap-4">
                        {/* 페이지네이션 컨트롤 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
                          >
                            이전
                          </button>
                          <span className="text-sm text-gray-700">
                            {currentPage} / {Math.ceil(imageBoardItems.length / imageBoardItemsPerPage)}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(imageBoardItems.length / imageBoardItemsPerPage), prev + 1))}
                            disabled={currentPage >= Math.ceil(imageBoardItems.length / imageBoardItemsPerPage)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
                          >
                            다음
                          </button>
                        </div>
                        <div className="text-xs text-gray-500">
                          전체 {imageBoardItems.length}개 항목 중 {(currentPage - 1) * imageBoardItemsPerPage + 1}-{Math.min(currentPage * imageBoardItemsPerPage, imageBoardItems.length)}번째 항목 표시
                        </div>
                </div>
              )}
            </div>
                </div>
                </div>
              )}
          </div>

          {/* 저장 버튼 - 고정 */}
          <div className="mt-4 md:mt-6 lg:mt-8 flex-shrink-0 pt-4 border-t flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-4 md:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
            >
              취소
            </button>
            {isSaved ? (
              <>
                <button
                  onClick={handleEdit}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm md:text-base flex items-center gap-2"
                  disabled={isGeneratingPDF}
                >
                  <Edit className="w-4 h-4" />
                  <span>수정</span>
                </button>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base flex items-center gap-2"
                  disabled={isGeneratingPDF}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>초기화</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSave}
                className="w-full sm:w-auto px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? 'PDF 생성 중...' : isEditing ? '저장' : '입력/수정'}
              </button>
            )}
            </div>
          </div>
        </div>

      {/* PDF 미리보기 모달 */}
      {showPDFPreview && previewPDFBlob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">PDF 미리보기</h2>
              <button
                onClick={handleClosePDFPreview}
                className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl transition-colors"
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
      </div>

            {/* PDF 뷰어 */}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-100">
              <iframe
                src={previewPDFBlob.url}
                className="w-full h-full min-h-[500px] border border-gray-300 rounded-lg bg-white"
                title="PDF Preview"
              />
          </div>

            {/* 모달 푸터 (저장 버튼) */}
            <div className="border-t bg-gray-50">
              <div className="flex justify-end gap-3 p-4 md:p-6">
                <button
                  onClick={handlePDFSave}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm md:text-base font-medium"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  <span>저장</span>
                </button>
                <button
                  onClick={handleClosePDFPreview}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm md:text-base font-medium"
                >
                  닫기
                </button>
              </div>
              {/* 워터마크 */}
              <div className="text-center py-2 border-t border-gray-200">
                <span className="text-[0.9em] text-gray-400">storyboard.ai.kr</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGenerator;

