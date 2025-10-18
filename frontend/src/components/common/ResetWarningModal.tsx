import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface ResetWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ResetWarningModal: React.FC<ResetWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '초기화 경고',
  message = '모든 프로젝트 텍스트가 초기화됩니다. 계속하시겠습니까?',
  confirmText = '초기화',
  cancelText = '취소'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {/* 경고 아이콘 및 메시지 */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              주의사항
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                초기화될 항목:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 헤딩 정보 (영상 제목, 설명, 노트)</li>
                <li>• 공통 입력 항목 (스토리, 캐릭터, 스토리 요약)</li>
                <li>• 에피소드/씬 구조 관리</li>
                <li>• 생성된 텍스트 카드</li>
                <li>• 프로젝트 참조 데이터</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResetWarningModal;
