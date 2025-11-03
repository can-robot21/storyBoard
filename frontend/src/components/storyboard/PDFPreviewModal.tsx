/**
 * PDF 미리보기 모달 컴포넌트
 */

import React from 'react';
import { X, Download } from 'lucide-react';
import { PDFBlob } from '../../types/storyboard';

interface PDFPreviewModalProps {
  isOpen: boolean;
  pdfBlob: PDFBlob | null;
  onClose: () => void;
  onSave: () => void;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  pdfBlob,
  onClose,
  onSave
}) => {
  if (!isOpen || !pdfBlob) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">PDF 미리보기</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl transition-colors"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* PDF 뷰어 */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-100">
          <div className="w-full h-full flex items-center justify-center">
            <iframe
              src={pdfBlob.url}
              className="w-full h-full min-h-[600px] border border-gray-300 rounded-lg bg-white"
              style={{ 
                minHeight: '600px',
                height: '100%',
                maxHeight: 'calc(100vh - 250px)'
              }}
              title="PDF Preview"
              onLoad={() => {
                console.log('✅ PDF 미리보기 로드 완료');
              }}
              onError={(e) => {
                console.error('❌ PDF 미리보기 로드 실패:', e);
              }}
            />
          </div>
        </div>

        {/* 모달 푸터 (저장 버튼) */}
        <div className="border-t bg-gray-50">
          <div className="flex justify-end gap-3 p-4 md:p-6">
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm md:text-base font-medium"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span>저장</span>
            </button>
            <button
              onClick={onClose}
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
  );
};

