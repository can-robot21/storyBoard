import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface VideoGenerationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onRetryWithoutImages: () => void;
  onGenerateStoryboard: () => void;
  onCancel: () => void;
  error: string;
  hasImages: boolean;
}

export const VideoGenerationErrorModal: React.FC<VideoGenerationErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onRetryWithoutImages,
  onGenerateStoryboard,
  onCancel,
  error,
  hasImages,
}) => {
  const isImageError = error.includes('Unable to process input image') || 
                      error.includes('input image');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="영상 생성 오류" size="lg">
      <div className="space-y-6">
        {/* 에러 메시지 */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                영상 생성 중 오류가 발생했습니다
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="break-words">{error}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 해결 방법 안내 */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">다음 중 하나를 선택하세요:</h4>
          
          <div className="space-y-3">
            {/* 1. 재시도 */}
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-lg">🔄</span>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-blue-800">다시 시도</h5>
                <p className="text-sm text-blue-600 mt-1">
                  동일한 설정으로 영상 생성을 다시 시도합니다.
                </p>
              </div>
              <Button
                onClick={onRetry}
                className="px-4 py-2 text-sm"
              >
                재시도
              </Button>
            </div>

            {/* 2. 이미지 없이 재시도 (이미지 에러인 경우만) */}
            {isImageError && hasImages && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="flex-shrink-0">
                  <span className="text-yellow-500 text-lg">🖼️</span>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-yellow-800">이미지 없이 재시도</h5>
                  <p className="text-sm text-yellow-600 mt-1">
                    참조 이미지를 제외하고 텍스트 설명만으로 영상을 생성합니다.
                  </p>
                </div>
                <Button
                  onClick={onRetryWithoutImages}
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                >
                  이미지 없이 재시도
                </Button>
              </div>
            )}

            {/* 3. 스토리보드 생성 */}
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-green-500 text-lg">📋</span>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-green-800">스토리보드 생성</h5>
                <p className="text-sm text-green-600 mt-1">
                  영상 대신 상세한 스토리보드를 생성합니다.
                </p>
              </div>
              <Button
                onClick={onGenerateStoryboard}
                variant="secondary"
                className="px-4 py-2 text-sm"
              >
                스토리보드 생성
              </Button>
            </div>

            {/* 4. 취소 */}
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <span className="text-gray-500 text-lg">❌</span>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-800">취소</h5>
                <p className="text-sm text-gray-600 mt-1">
                  영상 생성을 취소하고 이전 단계로 돌아갑니다.
                </p>
              </div>
              <Button
                onClick={onCancel}
                variant="secondary"
                className="px-4 py-2 text-sm"
              >
                취소
              </Button>
            </div>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">💡 팁</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 이미지 에러의 경우 참조 이미지 형식이나 크기를 확인해보세요</li>
            <li>• 프롬프트가 너무 길거나 복잡한 경우 간단하게 수정해보세요</li>
            <li>• 네트워크 연결 상태를 확인해보세요</li>
            <li>• 잠시 후 다시 시도해보세요</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default VideoGenerationErrorModal;
