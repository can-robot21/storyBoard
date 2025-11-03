/**
 * 샘플 미리보기 컴포넌트
 */

import React from 'react';
import { Eye, FileDown } from 'lucide-react';
import { HeaderData, StoryboardCut, ImageBoardItem } from '../../types/storyboard';

interface SamplePreviewProps {
  boardFormat: 'storyBoard' | 'imageBoard';
  headerData: HeaderData;
  storyboardCuts: StoryboardCut[];
  imageBoardItems: ImageBoardItem[];
  isSaved: boolean;
  isGeneratingPDF: boolean;
  onPDFPreview: () => void;
  onSaveImagesAndText: () => void;
}

export const SamplePreview: React.FC<SamplePreviewProps> = ({
  boardFormat,
  headerData,
  storyboardCuts,
  imageBoardItems,
  isSaved,
  isGeneratingPDF,
  onPDFPreview,
  onSaveImagesAndText
}) => {
  const imageCount = boardFormat === 'storyBoard'
    ? storyboardCuts.filter(cut => cut.imagePreview).length
    : imageBoardItems.filter(item => item.imagePreview).length;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
      <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-3">샘플 미리보기</h3>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">프로젝트 정보</p>
          <p className="text-xs">{headerData.title || '타이틀 미입력'}</p>
          {boardFormat === 'storyBoard' && (
            <p className="text-xs">{headerData.date || '날짜 미입력'}</p>
          )}
          <p className="text-xs">{headerData.scene || '씬 미입력'}</p>
        </div>
        {imageCount > 0 && (
          <div className="text-xs text-gray-600 mt-3">
            <p className="font-medium mb-1">첨부된 이미지</p>
            <p className="text-xs">{imageCount}{boardFormat === 'imageBoard' ? '/9' : '개'}</p>
          </div>
        )}
        
        {/* PDF 미리보기 버튼 */}
        <div className="mt-4 pt-3 border-t border-gray-300 space-y-2">
          <button
            onClick={onPDFPreview}
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
            onClick={onSaveImagesAndText}
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
  );
};

