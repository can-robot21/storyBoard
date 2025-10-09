import React, { useState } from 'react';
import Modal from './Modal';
import { PromptCopyHelpModal } from './PromptCopyHelpModal';
import { useUIStore } from '../../stores/uiStore';

interface ImageFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  onUseImage: () => void;
  onRegenerate: () => void;
  onReject: () => void;
}

export const ImageFeedbackModal: React.FC<ImageFeedbackModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  onUseImage,
  onRegenerate,
  onReject
}) => {
  const { addNotification } = useUIStore();
  const [feedback, setFeedback] = useState('');
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [relevanceRating, setRelevanceRating] = useState<number | null>(null);
  const [isUsed, setIsUsed] = useState(false); // 이미지 사용 여부 상태
  const [showHelpModal, setShowHelpModal] = useState(false); // 도움말 모달 상태

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      addNotification({
        type: 'info',
        title: '피드백 제출',
        message: '피드백이 제출되었습니다. 감사합니다!',
      });
    }
    onClose();
  };

  const handleUseImage = () => {
    if (isUsed) {
      addNotification({
        type: 'warning',
        title: '이미 사용됨',
        message: '이 이미지는 이미 프로젝트에 추가되었습니다.',
      });
      return;
    }

    addNotification({
      type: 'success',
      title: '이미지 사용',
      message: '이미지가 프로젝트에 추가되었습니다.',
    });
    setIsUsed(true);
    onUseImage();
    onClose();
  };

  const handleRegenerate = () => {
    addNotification({
      type: 'info',
      title: '재생성 요청',
      message: '새로운 이미지를 생성합니다.',
    });
    onRegenerate();
    onClose();
  };

  const handleReject = () => {
    addNotification({
      type: 'warning',
      title: '이미지 거부',
      message: '이미지가 거부되었습니다.',
    });
    onReject();
    onClose();
  };

  const handleCopyPrompt = () => {
    const promptData = {
      prompt: prompt,
      timestamp: new Date().toISOString(),
      quality: qualityRating,
      relevance: relevanceRating,
      feedback: feedback.trim()
    };

    const jsonString = JSON.stringify(promptData, null, 2);
    
    navigator.clipboard.writeText(jsonString).then(() => {
      addNotification({
        type: 'success',
        title: '프롬프트 복사',
        message: '프롬프트 데이터가 클립보드에 복사되었습니다.',
      });
    }).catch(() => {
      // 클립보드 API 실패 시 텍스트 영역으로 대체
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addNotification({
        type: 'success',
        title: '프롬프트 복사',
        message: '프롬프트 데이터가 클립보드에 복사되었습니다.',
      });
    });
  };

  const handleCopySimplePrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      addNotification({
        type: 'success',
        title: '프롬프트 복사',
        message: '프롬프트가 클립보드에 복사되었습니다.',
      });
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = prompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      addNotification({
        type: 'success',
        title: '프롬프트 복사',
        message: '프롬프트가 클립보드에 복사되었습니다.',
      });
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="이미지 생성 결과 확인">
      <div className="space-y-6">
        {/* 생성된 이미지 */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">생성된 이미지</h3>
          <div className="bg-gray-100 rounded-lg p-4">
            <img
              src={imageUrl}
              alt="Generated"
              className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
            />
          </div>
        </div>

        {/* 프롬프트 정보 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">사용된 프롬프트</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                title="프롬프트 복사 기능 안내"
              >
                ❓ 도움말
              </button>
              <button
                onClick={handleCopySimplePrompt}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="프롬프트만 복사"
              >
                📋 프롬프트 복사
              </button>
              <button
                onClick={handleCopyPrompt}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="평가 및 피드백 포함한 전체 데이터 복사"
              >
                📊 전체 데이터 복사
              </button>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            {prompt}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            💡 <strong>프롬프트 복사:</strong> 텍스트만 복사합니다. 다른 이미지 생성에 바로 사용 가능합니다.<br/>
            💡 <strong>전체 데이터 복사:</strong> 평가, 피드백, 타임스탬프가 포함된 JSON 데이터를 복사합니다.
          </div>
        </div>

        {/* 품질 평가 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">이미지 품질 평가</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">전체적인 품질 (1-5점)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setQualityRating(rating)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      qualityRating === rating
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">프롬프트 일치도 (1-5점)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setRelevanceRating(rating)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      relevanceRating === rating
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 피드백 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            피드백 (선택사항)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="이미지에 대한 피드백이나 개선사항을 입력해주세요..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleUseImage}
            disabled={isUsed}
            className={`flex-1 px-4 py-2 rounded-md transition-colors font-medium ${
              isUsed 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isUsed ? '✅ 이미 사용됨' : '✅ 사용하기'}
          </button>
          <button
            onClick={handleRegenerate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            🔄 재생성
          </button>
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            ❌ 거부
          </button>
        </div>

        {/* 피드백 제출 버튼 */}
        {(feedback.trim() || qualityRating || relevanceRating) && (
          <div className="text-center">
            <button
              onClick={handleSubmitFeedback}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              피드백 제출
            </button>
          </div>
        )}
      </div>

      {/* 프롬프트 복사 도움말 모달 */}
      <PromptCopyHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </Modal>
  );
};
