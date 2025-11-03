/**
 * 스토리보드 핸들러 함수 커스텀 훅
 */

import { useCallback } from 'react';
import { BoardFormat, HeaderData, StoryboardCut, ImageBoardItem } from '../types/storyboard';
import { 
  getNextCutNumber, 
  getConsecutiveImageOnlyCount, 
  createStoryboardCut,
  createImageBoardItem,
  fileToDataURL
} from '../utils/storyboardUtils';

interface UseStoryboardHandlersProps {
  boardFormat: BoardFormat;
  headerData: HeaderData;
  storyboardCuts: StoryboardCut[];
  imageBoardItems: ImageBoardItem[];
  itemsPerPage: number;
  setStoryboardCuts: React.Dispatch<React.SetStateAction<StoryboardCut[]>>;
  setImageBoardItems: React.Dispatch<React.SetStateAction<ImageBoardItem[]>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export const useStoryboardHandlers = ({
  boardFormat,
  headerData,
  storyboardCuts,
  imageBoardItems,
  itemsPerPage,
  setStoryboardCuts,
  setImageBoardItems,
  setCurrentPage
}: UseStoryboardHandlersProps) => {
  
  // [컷] 추가 버튼 핸들러
  const handleAddCut = useCallback(() => {
    const sceneNum = headerData.scene || '1';
    const nextCutNumber = getNextCutNumber(sceneNum, storyboardCuts);
    const newCut = createStoryboardCut(
      `cut_${Date.now()}_${Math.random()}`,
      nextCutNumber,
      sceneNum,
      false
    );
    setStoryboardCuts(prev => [...prev, newCut]);
    // 새 컷이 추가되면 마지막 페이지로 이동
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  }, [headerData.scene, storyboardCuts, itemsPerPage, setStoryboardCuts, setCurrentPage]);

  // [이미지] 추가 버튼 핸들러
  const handleAddImage = useCallback(() => {
    const newCut = createStoryboardCut(
      `image_${Date.now()}_${Math.random()}`,
      '',
      undefined,
      false
    );
    setStoryboardCuts(prev => [...prev, newCut]);
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  }, [storyboardCuts.length, itemsPerPage, setStoryboardCuts, setCurrentPage]);

  // [이미지만 추가] 버튼 핸들러
  const handleAddImageOnly = useCallback(() => {
    const consecutiveImageOnlyCount = getConsecutiveImageOnlyCount(storyboardCuts);
    
    if (consecutiveImageOnlyCount >= 3) {
      alert('이미지만 추가 항목은 3개 연속으로 추가할 수 없습니다.\n\n다른 유형의 항목([컷] 추가 또는 [이미지] 추가)을 먼저 추가해주세요.');
      return;
    }
    
    const newCut = createStoryboardCut(
      `imageOnly_${Date.now()}_${Math.random()}`,
      '',
      undefined,
      true
    );
    setStoryboardCuts(prev => [...prev, newCut]);
    const totalPages = Math.ceil((storyboardCuts.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  }, [storyboardCuts, itemsPerPage, setStoryboardCuts, setCurrentPage]);

  // ImageBoard: [이미지] 추가 버튼 핸들러
  const handleAddImageBoardItem = useCallback(() => {
    const nextNumber = imageBoardItems.length + 1;
    const newItem = createImageBoardItem(
      `image_${Date.now()}_${Math.random()}`,
      nextNumber
    );
    setImageBoardItems(prev => [...prev, newItem]);
    const totalPages = Math.ceil((imageBoardItems.length + 1) / itemsPerPage);
    setCurrentPage(totalPages);
  }, [imageBoardItems.length, itemsPerPage, setImageBoardItems, setCurrentPage]);

  // 컷 삭제 핸들러
  const handleRemoveCut = useCallback((cutId: string) => {
    setStoryboardCuts(prev => prev.filter(cut => cut.id !== cutId));
  }, [setStoryboardCuts]);

  // ImageBoard 항목 삭제 핸들러
  const handleRemoveImageBoardItem = useCallback((itemId: string) => {
    setImageBoardItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      return filtered.map((item, index) => ({
        ...item,
        number: index + 1
      }));
    });
  }, [setImageBoardItems]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async (itemId: string, file: File) => {
    try {
      const preview = await fileToDataURL(file);
      
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
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
    }
  }, [boardFormat, setStoryboardCuts, setImageBoardItems]);

  // 이미지 제거 핸들러
  const handleImageRemove = useCallback((itemId: string) => {
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
  }, [boardFormat, setStoryboardCuts, setImageBoardItems]);

  // 설명 변경 핸들러
  const handleDescriptionChange = useCallback((itemId: string, description: string) => {
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
  }, [boardFormat, setStoryboardCuts, setImageBoardItems]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((itemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(itemId, file);
    }
  }, [handleImageUpload]);

  return {
    handleAddCut,
    handleAddImage,
    handleAddImageOnly,
    handleAddImageBoardItem,
    handleRemoveCut,
    handleRemoveImageBoardItem,
    handleImageUpload,
    handleImageRemove,
    handleDescriptionChange,
    handleFileSelect
  };
};

