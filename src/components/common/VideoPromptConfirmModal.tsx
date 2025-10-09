import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface VideoPromptConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prompt: string;
  optimizedPrompt: string;
  modelConfig: {
    displayName: string;
    model: string;
  };
  videoConfig: any;
  hasImages: boolean;
  imageCount: number;
}

export const VideoPromptConfirmModal: React.FC<VideoPromptConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  prompt,
  optimizedPrompt,
  modelConfig,
  videoConfig,
  hasImages,
  imageCount,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="영상 생성 최종 확인" size="xl">
      <div className="space-y-6">
        {/* 모델 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">🎬 영상 생성 모델</h3>
          <div className="text-sm text-blue-700">
            <p><strong>모델:</strong> {modelConfig.displayName}</p>
            <p><strong>모델 코드:</strong> {modelConfig.model}</p>
            <p><strong>오디오:</strong> {modelConfig.model.includes('veo-3.0') ? '포함' : '미포함'}</p>
          </div>
        </div>

        {/* 영상 설정 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">⚙️ 영상 설정</h3>
          <div className="text-sm text-green-700">
            <p><strong>비율:</strong> {videoConfig.aspectRatio}</p>
            <p><strong>길이:</strong> {videoConfig.durationSeconds}초</p>
            <p><strong>개수:</strong> {videoConfig.numberOfVideos}개</p>
            {videoConfig.personGeneration && (
              <p><strong>인물 생성:</strong> {videoConfig.personGeneration}</p>
            )}
          </div>
        </div>

        {/* 참조 이미지 정보 */}
        {hasImages && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🖼️ 참조 이미지</h3>
            <div className="text-sm text-purple-700">
              <p><strong>이미지 개수:</strong> {imageCount}개</p>
              <p><strong>상태:</strong> 이미지 참조가 영상 생성에 사용됩니다</p>
            </div>
          </div>
        )}

        {/* 원본 프롬프트 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 원본 프롬프트</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="max-h-40 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
              {prompt}
            </div>
          </div>
        </div>

        {/* 최적화된 프롬프트 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">✨ 최적화된 프롬프트</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="max-h-40 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
              {optimizedPrompt}
            </div>
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">⚠️ 주의사항</h3>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• 영상 생성에는 시간이 소요될 수 있습니다 (보통 1-3분)</li>
            <li>• 생성된 영상은 서버에 2일간 저장됩니다</li>
            <li>• AI 생성 콘텐츠에는 워터마크가 포함됩니다</li>
            <li>• 안전 필터에 의해 일부 콘텐츠가 차단될 수 있습니다</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            영상 생성 시작
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VideoPromptConfirmModal;
