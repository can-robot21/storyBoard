/**
 * StoryBoard 본문 컴포넌트
 */

import React from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { StoryboardCut, HeaderData } from '../../types/storyboard';
import { getEffectivePageCount, getDisplayedCuts } from '../../utils/storyboardUtils';

interface StoryBoardBodyProps {
  headerData: HeaderData;
  storyboardCuts: StoryboardCut[];
  currentPage: number;
  itemsPerPage: number;
  isEditing: boolean;
  onAddCut: () => void;
  onAddImage: () => void;
  onAddImageOnly: () => void;
  onRemoveCut: (cutId: string) => void;
  onImageUpload: (itemId: string, file: File) => void;
  onImageRemove: (itemId: string) => void;
  onDescriptionChange: (itemId: string, description: string) => void;
  onFileSelect: (itemId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onHeaderChange: (field: keyof HeaderData, value: string) => void;
  onPageChange: (page: number) => void;
}

export const StoryBoardBody: React.FC<StoryBoardBodyProps> = ({
  headerData,
  storyboardCuts,
  currentPage,
  itemsPerPage,
  isEditing,
  onAddCut,
  onAddImage,
  onAddImageOnly,
  onRemoveCut,
  onImageUpload,
  onImageRemove,
  onDescriptionChange,
  onFileSelect,
  onHeaderChange,
  onPageChange
}) => {
  // 페이지네이션 계산
  const effectivePageCount = getEffectivePageCount(storyboardCuts);
  const totalPages = Math.ceil(effectivePageCount / itemsPerPage);
  const displayedCuts = effectivePageCount > itemsPerPage
    ? getDisplayedCuts(storyboardCuts, currentPage, itemsPerPage)
    : storyboardCuts;

  // 이미지만 추가 항목들을 그룹화하여 가로로 배치
  const renderCuts = (): React.ReactElement[] => {
    const result: React.ReactElement[] = [];
    let currentImageOnlyGroup: StoryboardCut[] = [];

    displayedCuts.forEach((cut, index) => {
      if (cut.imageOnly) {
        currentImageOnlyGroup.push(cut);

        if (index === displayedCuts.length - 1 || !displayedCuts[index + 1]?.imageOnly) {
          // 그룹을 3개씩 가로 배치
          for (let i = 0; i < currentImageOnlyGroup.length; i += 3) {
            const group = currentImageOnlyGroup.slice(i, i + 3);
            // 이미지만 추가 그룹 - 일반 컷 이미지와 동일한 시작/끝 위치로 정렬
            result.push(
              <div key={`imageOnly-group-${index}-${i}`} className="flex gap-3 md:gap-4 mb-4 ml-20 md:ml-24 w-[calc(100%-5rem)] md:w-[calc(100%-6rem)]">
                {group.map((cutItem) => (
                  <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative flex-1">
                    <button
                      onClick={() => onRemoveCut(cutItem.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                      title="삭제"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    
                    <div className="w-full">
                      {cutItem.imagePreview ? (
                        <div className="relative group">
                          <img
                            src={cutItem.imagePreview}
                            alt="이미지만 추가"
                            className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => onImageRemove(cutItem.id)}
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
                            onChange={(e) => onFileSelect(cutItem.id, e)}
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
      } else {
        // 먼저 이미지만 추가 그룹이 있다면 렌더링
        if (currentImageOnlyGroup.length > 0) {
          for (let i = 0; i < currentImageOnlyGroup.length; i += 3) {
            const group = currentImageOnlyGroup.slice(i, i + 3);
            // 이미지만 추가 그룹 - 일반 컷 이미지와 동일한 시작/끝 위치로 정렬
            result.push(
              <div key={`imageOnly-group-${index}-${i}`} className="flex gap-3 md:gap-4 mb-4 ml-20 md:ml-24 w-[calc(100%-5rem)] md:w-[calc(100%-6rem)]">
                {group.map((cutItem) => (
                  <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative flex-1">
                    <button
                      onClick={() => onRemoveCut(cutItem.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                      title="삭제"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                    <div className="w-full">
                      {cutItem.imagePreview ? (
                        <div className="relative group">
                          <img
                            src={cutItem.imagePreview}
                            alt="이미지만 추가"
                            className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => onImageRemove(cutItem.id)}
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
                            onChange={(e) => onFileSelect(cutItem.id, e)}
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
          <div key={cut.id} className="flex gap-3 md:gap-4 rounded-lg border border-gray-200 p-3 md:p-4 bg-gray-50 relative">
            <button
              onClick={() => onRemoveCut(cut.id)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
              title="삭제"
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            
            {/* 컷 번호 영역 (외곽선 없는 박스) - 오른쪽 5mm 여백 추가 */}
            <div className="w-20 md:w-24 flex-shrink-0 pt-1">
              {cut.cutNumber ? (
                <span className="text-xs md:text-sm font-medium text-gray-700">{cut.cutNumber}</span>
              ) : (
                <span className="text-xs md:text-sm text-transparent">-</span>
              )}
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
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
                      onClick={() => onImageRemove(cut.id)}
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
                      onChange={(e) => onFileSelect(cut.id, e)}
                    />
                  </label>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">텍스트 입력</label>
                <textarea
                  value={cut.description}
                  onChange={(e) => onDescriptionChange(cut.id, e.target.value)}
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
        // 이미지만 추가 그룹 - 일반 컷 이미지와 동일한 시작/끝 위치로 정렬
        result.push(
          <div key={`imageOnly-group-final-${i}`} className="flex gap-3 md:gap-4 mb-4 ml-20 md:ml-24 w-[calc(100%-5rem)] md:w-[calc(100%-6rem)]">
            {group.map((cutItem) => (
              <div key={cutItem.id} className="flex flex-col gap-2 md:gap-3 rounded-lg border border-gray-200 p-2 md:p-3 bg-gray-50 relative flex-1">
                <button
                  onClick={() => onRemoveCut(cutItem.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100 transition-opacity z-10"
                  title="삭제"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <div className="w-full">
                  {cutItem.imagePreview ? (
                    <div className="relative group">
                      <img
                        src={cutItem.imagePreview}
                        alt="이미지만 추가"
                        className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => onImageRemove(cutItem.id)}
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
                        onChange={(e) => onFileSelect(cutItem.id, e)}
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
  };

  return (
    <div className="h-full flex flex-col">
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
          onChange={(e) => onHeaderChange('mainContent', e.target.value)}
          className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          rows={3}
          placeholder="주요 내용을 입력하세요"
          disabled={!isEditing}
        />
      </div>

      {/* 컷 추가 버튼들 */}
      <div className="mb-4 md:mb-6 flex flex-wrap gap-2 md:gap-3">
        <button
          onClick={onAddCut}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base flex items-center gap-2"
        >
          <span>+</span>
          <span>[컷] 추가</span>
        </button>
        <button
          onClick={onAddImage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>[이미지] 추가</span>
        </button>
        <button
          onClick={onAddImageOnly}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>[이미지만 추가]</span>
          <span className="text-xs bg-purple-800 px-1.5 py-0.5 rounded">
            (최대 3개)
          </span>
        </button>
      </div>

      {/* 컷 목록 */}
      <div className="space-y-4 md:space-y-6">
        {displayedCuts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm md:text-base">컷을 추가해주세요.</p>
            <p className="text-xs md:text-sm mt-2">[컷] 추가 또는 [이미지] 추가 버튼을 클릭하세요.</p>
          </div>
        ) : (
          renderCuts()
        )}
      </div>

      {/* 페이지네이션 */}
      {effectivePageCount > itemsPerPage && (
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
            전체 {effectivePageCount}개 항목(연속 이미지만 추가 그룹은 1개로 계산) 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, effectivePageCount)}번째 항목 표시
          </div>
        </div>
      )}
    </div>
  );
};

