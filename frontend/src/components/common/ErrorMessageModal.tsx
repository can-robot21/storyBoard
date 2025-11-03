import React from 'react';
import Button from './Button';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: {
    title: string;
    message: string;
    details?: string;
    type: 'error' | 'warning' | 'info';
  };
  isLoading?: boolean;
}

export const ErrorMessageModal: React.FC<ErrorMessageModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  error,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <AlertTriangle className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getBorderColor = () => {
    switch (error.type) {
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
      default:
        return 'border-red-200';
    }
  };

  const getBgColor = () => {
    switch (error.type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-red-50';
    }
  };

  const getTextColor = () => {
    switch (error.type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl font-semibold text-gray-800">
              {error.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-4">
          <div className={`rounded-lg p-4 border ${getBorderColor()} ${getBgColor()}`}>
            <p className={`text-sm font-medium ${getTextColor()} mb-2`}>
              {error.message}
            </p>
            {error.details && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">상세 정보:</p>
                <div className="text-xs text-gray-700 bg-white rounded p-2 max-h-32 overflow-y-auto">
                  {error.details}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">해결 방법:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>프롬프트를 수정하여 다시 시도해보세요</li>
                <li>API 키가 올바르게 설정되었는지 확인해주세요</li>
                <li>인터넷 연결 상태를 확인해주세요</li>
                <li>잠시 후 다시 시도해보세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            닫기
          </Button>
          {onRetry && (
            <Button
              onClick={onRetry}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  재시도 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  다시 시도
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
