import React from 'react';

interface PromptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prompt: string;
  title: string;
  type?: 'character' | 'background' | 'settingCut';
  isLoading?: boolean;
  attachedImages?: File[];
  settings?: any;
  appliedOptions?: any;
  isNanoBanana?: boolean; // 나노 바나나 API 사용 여부
}

export const PromptConfirmationModal: React.FC<PromptConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  prompt,
  title,
  isLoading = false,
  attachedImages = [],
  settings,
  isNanoBanana = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 첨부된 이미지 미리보기 */}
          {attachedImages.length > 0 && (
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">참조 이미지 ({attachedImages.length}개)</h3>
              <div className="flex gap-3 overflow-x-auto">
                {attachedImages.map((file, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`참조 이미지 ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center truncate w-20">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 설정 정보 */}
          {settings && (
            <div className="p-6 border-b bg-blue-50">
              <h3 className="text-sm font-medium text-blue-700 mb-3">생성 설정</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-600">스타일:</span>
                  <span className="ml-2 text-blue-800">{settings.style || '기본'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">품질:</span>
                  <span className="ml-2 text-blue-800">{settings.quality || '기본'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">비율:</span>
                  <span className="ml-2 text-blue-800">{settings.aspectRatio || '기본'}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">이미지 수:</span>
                  {isNanoBanana ? (
                    <span className="ml-2 text-blue-800">
                      1개 <span className="text-xs text-gray-500">(나노 바나나 API는 항상 1개만 생성)</span>
                    </span>
                  ) : (
                    <span className="ml-2 text-blue-800">{settings.numberOfImages || 1}개</span>
                  )}
                </div>
                {settings.personGeneration && (
                  <div>
                    <span className="font-medium text-blue-600">사람 생성:</span>
                    <span className="ml-2 text-blue-800">
                      {settings.personGeneration === 'allow_all' ? '모든 연령 허용' :
                       settings.personGeneration === 'allow_adult' ? '성인만 허용' :
                       settings.personGeneration === 'dont_allow' ? '사람 생성 차단' :
                       settings.personGeneration}
                    </span>
                  </div>
                )}
                {settings.editMode && (
                  <div className="col-span-2">
                    <span className="font-medium text-blue-600">편집 모드:</span>
                    <span className="ml-2 text-blue-800">{settings.editMode}</span>
                  </div>
                )}
                {settings.detailPreservation && (
                  <div>
                    <span className="font-medium text-blue-600">세부사항 보존:</span>
                    <span className="ml-2 text-blue-800">{settings.detailPreservation}%</span>
                  </div>
                )}
                {settings.editIntensity && (
                  <div>
                    <span className="font-medium text-blue-600">편집 강도:</span>
                    <span className="ml-2 text-blue-800">{settings.editIntensity}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 프롬프트 내용 */}
          <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium text-gray-700 mb-3">최종 프롬프트</h3>
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {prompt}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              '이미지 생성'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};