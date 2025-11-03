/**
 * 스토리보드 헤더 섹션 컴포넌트
 */

import React from 'react';
import { BoardFormat, HeaderData } from '../../types/storyboard';

interface HeaderSectionProps {
  boardFormat: BoardFormat;
  headerData: HeaderData;
  isEditing: boolean;
  showHeaderSection: boolean;
  onHeaderChange: (field: keyof HeaderData, value: string) => void;
  onToggleShowHeader: () => void;
  onSave: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  boardFormat,
  headerData,
  isEditing,
  showHeaderSection,
  onHeaderChange,
  onToggleShowHeader,
  onSave
}) => {
  return (
    <div className="mb-4 md:mb-6 lg:mb-8 border-b pb-4 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">상단 정보</h2>
          <button
            onClick={onToggleShowHeader}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-xs md:text-sm flex items-center gap-1"
          >
            <span>{showHeaderSection ? '👁️' : '👁️‍🗨️'}</span>
            <span>{showHeaderSection ? '감추기' : '보이기'}</span>
          </button>
        </div>
        <button
          onClick={onSave}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
        >
          {isEditing ? '수정 완료' : '입력/수정'}
        </button>
      </div>

      {showHeaderSection && (
        <div className="space-y-4">
          {/* 2열 그리드: 타이틀, 날짜, 시간, 씬, 컷 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {boardFormat === 'storyBoard' ? (
              <>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">타이틀 (Title)</label>
                  <input
                    type="text"
                    value={headerData.title}
                    onChange={(e) => onHeaderChange('title', e.target.value)}
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
                    onChange={(e) => onHeaderChange('date', e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">시간 (Time)</label>
                  <input
                    type="time"
                    value={headerData.time}
                    onChange={(e) => onHeaderChange('time', e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">장소 (Location)</label>
                  <input
                    type="text"
                    value={headerData.location}
                    onChange={(e) => onHeaderChange('location', e.target.value)}
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
                    onChange={(e) => onHeaderChange('scene', e.target.value)}
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
                    onChange={(e) => onHeaderChange('cut', e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-100 cursor-not-allowed"
                    placeholder="컷 추가 시 자동 카운트"
                    disabled={true}
                    readOnly
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">타이틀 (Title)</label>
                  <input
                    type="text"
                    value={headerData.title}
                    onChange={(e) => onHeaderChange('title', e.target.value)}
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
                    onChange={(e) => onHeaderChange('time', e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">씬 (Scene)</label>
                  <input
                    type="text"
                    value={headerData.scene}
                    onChange={(e) => onHeaderChange('scene', e.target.value)}
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
                    onChange={(e) => onHeaderChange('cut', e.target.value)}
                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-100 cursor-not-allowed"
                    placeholder="컷 추가 시 자동 카운트"
                    disabled={true}
                    readOnly
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

