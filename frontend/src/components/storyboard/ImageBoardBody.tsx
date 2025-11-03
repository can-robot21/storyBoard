/**
 * ImageBoard 본문 컴포넌트
 */

import React from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { ImageBoardItem, HeaderData } from '../../types/storyboard';

interface ImageBoardBodyProps {
  headerData: HeaderData;
  imageBoardItems: ImageBoardItem[];
  currentPage: number;
  itemsPerPage: number;
  isEditing: boolean;
  onAddImage: () => void;
  onRemoveItem: (itemId: string) => void;
  onImageUpload: (itemId: string, file: File) => void;
  onImageRemove: (itemId: string) => void;
  onDescriptionChange: (itemId: string, description: string) => void;
  onFileSelect: (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (field: keyof HeaderData, value: string) => void;
  onPageChange: (page: number) => void;
}

export const ImageBoardBody: React.FC<ImageBoardBodyProps> = ({
  headerData,
  imageBoardItems,
  currentPage,
  itemsPerPage,
  isEditing,
  onAddImage,
  onRemoveItem,
  onImageUpload,
  onImageRemove,
  onDescriptionChange,
  onFileSelect,
  onHeaderChange,
  onPageChange
}) => {
  const totalItems = imageBoardItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const displayedItems = totalItems > itemsPerPage
    ? imageBoardItems.slice(startIndex, endIndex)
    : imageBoardItems;

  return (
    <div className="h-full flex flex-col">
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
          onChange={(e) => onHeaderChange('mainContent', e.target.value)}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          rows={3}
          placeholder="주요 내용을 입력하세요"
          disabled={!isEditing}
        />
      </div>

      {/* 이미지 추가 버튼 */}
      <div className="mb-4 md:mb-6 flex flex-wrap gap-2 md:gap-3">
        <button
          onClick={onAddImage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>[이미지] 추가</span>
        </button>
      </div>

      {/* 3x3 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {displayedItems.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p className="text-sm md:text-base">이미지를 추가해주세요.</p>
            <p className="text-xs md:text-sm mt-2">[이미지] 추가 버튼을 클릭하세요.</p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-2 md:p-3 lg:p-4 relative">
              {/* 삭제 버튼 */}
              <button
                onClick={() => onRemoveItem(item.id)}
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
                      onClick={() => onImageRemove(item.id)}
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
                      onChange={(e) => onFileSelect(item.id, e)}
                    />
                  </label>
                )}
              </div>

              {/* 설명 텍스트 폼 */}
              {!item.imageOnly && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={item.description}
                    onChange={(e) => onDescriptionChange(item.id, e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm resize-none"
                    rows={2}
                    placeholder="순서대로 설명 입력"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalItems > itemsPerPage && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
            >
              이전
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm transition-colors"
            >
              다음
            </button>
          </div>
          <div className="text-xs text-gray-500">
            전체 {totalItems}개 항목 중 {startIndex + 1}-{Math.min(endIndex, totalItems)}번째 항목 표시
          </div>
        </div>
      )}
    </div>
  );
};

