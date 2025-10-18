import React from 'react';
import Modal from './Modal';

interface PromptCopyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptCopyHelpModal: React.FC<PromptCopyHelpModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프롬프트 복사 기능 안내" size="lg">
      <div className="space-y-6">
        {/* 프롬프트 복사 */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            📋 프롬프트 복사
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>용도:</strong> 다른 이미지 생성에 바로 사용할 수 있는 텍스트 프롬프트</p>
            <p><strong>복사 내용:</strong> 이미지 생성에 사용된 프롬프트 텍스트만</p>
            <p><strong>사용 방법:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>다른 이미지 생성 입력 필드에 붙여넣기</li>
              <li>프롬프트 수정 후 재사용</li>
              <li>비슷한 스타일의 이미지 생성 시 참고</li>
            </ul>
          </div>
        </div>

        {/* 전체 데이터 복사 */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
            📊 전체 데이터 복사
          </h3>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>용도:</strong> 이미지 품질 분석, 프롬프트 개선, 데이터 저장</p>
            <p><strong>복사 내용:</strong> JSON 형태의 구조화된 데이터</p>
            <div className="bg-white p-3 rounded border text-xs font-mono">
              {`{
  "prompt": "생성에 사용된 프롬프트",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "quality": 4,
  "relevance": 5,
  "feedback": "사용자 피드백"
}`}
            </div>
            <p><strong>사용 방법:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>이미지 품질 분석 및 개선점 파악</li>
              <li>프롬프트 데이터베이스 구축</li>
              <li>AI 학습 데이터로 활용</li>
              <li>프로젝트 문서화</li>
            </ul>
          </div>
        </div>

        {/* 활용 팁 */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            💡 활용 팁
          </h3>
          <div className="space-y-2 text-sm text-yellow-700">
            <p><strong>프롬프트 개선:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>고품질 평가를 받은 프롬프트를 템플릿으로 활용</li>
              <li>낮은 품질 평가 시 프롬프트를 수정하여 재시도</li>
              <li>피드백을 바탕으로 프롬프트 스타일 개선</li>
            </ul>
            
            <p className="mt-3"><strong>데이터 관리:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>성공적인 프롬프트를 별도 문서에 저장</li>
              <li>프로젝트별 프롬프트 라이브러리 구축</li>
              <li>팀원과 프롬프트 공유 및 협업</li>
            </ul>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="text-center pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </Modal>
  );
};
