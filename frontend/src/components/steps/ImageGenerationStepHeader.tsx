import React, { useState } from 'react';
import Button from '../common/Button';
import { ImagenPromptSampleModal } from '../common/ImagenPromptSampleModal';

interface ImageGenerationStepHeaderProps {
  // 프로젝트 개요 데이터
  story: string;
  characterList: any[];
  storySummary: string;
  finalScenario: string;
  
  // 공통 옵션 상태
  showCommonOptions: boolean;
  setShowCommonOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  imageStyle: string;
  setImageStyle: (style: string) => void;
  imageQuality: string;
  setImageQuality: (quality: string) => void;
  numberOfImages: number;
  setNumberOfImages: (count: number) => void;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  
  // 공통 입력 항목 상태
  showCommonInputs: boolean;
  setShowCommonInputs: (show: boolean | ((prev: boolean) => boolean)) => void;
  commonInputsCompleted: boolean;
  onCommonInputsComplete: () => void;
  onCommonInputsReset: () => void;
  
  // 이미지 분석 모달
  onOpenImageAnalysis: () => void;
}

export const ImageGenerationStepHeader: React.FC<ImageGenerationStepHeaderProps> = ({
  story,
  characterList,
  storySummary,
  finalScenario,
  showCommonOptions,
  setShowCommonOptions,
  imageStyle,
  setImageStyle,
  imageQuality,
  setImageQuality,
  numberOfImages,
  setNumberOfImages,
  aspectRatio,
  setAspectRatio,
  showCommonInputs,
  setShowCommonInputs,
  commonInputsCompleted,
  onCommonInputsComplete,
  onCommonInputsReset,
  onOpenImageAnalysis
}) => {
  const [showImagenPromptSampleModal, setShowImagenPromptSampleModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* 프로젝트 개요 연계 정보 표시 */}
      {story && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 프로젝트 개요 연계</h4>
          <div className="text-sm text-blue-700">
            <div><strong>스토리:</strong> {story}</div>
            {characterList.length > 0 && (
              <div><strong>캐릭터:</strong> {characterList.map(c => c.name).join(', ')}</div>
            )}
            {finalScenario && (
              <div><strong>시나리오:</strong> {finalScenario.substring(0, 100)}...</div>
            )}
          </div>
        </div>
      )}

      {/* 이미지 생성 옵션 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🎨 이미지 생성 옵션</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImagenPromptSampleModal(true)}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              📚 프롬프트 샘플
            </button>
            <button
              onClick={() => setShowCommonOptions((prev: boolean) => !prev)}
              className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
            >
              {showCommonOptions ? '옵션 감추기' : '옵션 보이기'}
              <span className="text-xs ml-1">{showCommonOptions ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>
        
        {showCommonOptions && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">공통 설정</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="realistic">실사</option>
                  <option value="illustration">일러스트</option>
                  <option value="anime">애니메이션</option>
                  <option value="cartoon">카툰</option>
                  <option value="sketch">스케치</option>
                  <option value="painting">회화</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 품질</label>
                <select
                  value={imageQuality}
                  onChange={(e) => setImageQuality(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high">고품질</option>
                  <option value="medium">중품질</option>
                  <option value="standard">표준</option>
                  <option value="low">저품질</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">생성 이미지 개수</label>
                <select
                  value={numberOfImages}
                  onChange={(e) => setNumberOfImages(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1개</option>
                  <option value={2}>2개</option>
                  <option value={3}>3개</option>
                  <option value={4}>4개</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1:1">정사각형 (1:1)</option>
                  <option value="4:3">전체 화면 (4:3)</option>
                  <option value="3:4">세로 전체 화면 (3:4)</option>
                  <option value="16:9">와이드스크린 (16:9)</option>
                  <option value="9:16">세로 모드 (9:16)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 공통 입력 항목 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">📋 공통 입력 항목</h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              {commonInputsCompleted ? 
                '✅ 기본 정보 입력 완료' : 
                story && characterList.length > 0 ? 
                  '✅ 입력 준비 완료' : 
                  '⏳ 스토리와 캐릭터 정보를 입력해주세요'
              }
            </div>
            {!commonInputsCompleted ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCommonInputs((prev: boolean) => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showCommonInputs ? '입력 숨기기' : '입력 보기-수정'}
                </button>
                {showCommonInputs && (
                  <button
                    onClick={onCommonInputsComplete}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    입력 완료
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCommonInputs((prev: boolean) => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showCommonInputs ? '감추기' : '보이기'}
                </button>
                <button
                  onClick={() => {
                    setShowCommonInputs(true);
                    onCommonInputsReset();
                  }}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  수정-초기화
                </button>
              </div>
            )}
          </div>
        </div>
        
        {showCommonInputs && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">📝 기본 정보</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스토리 제목 <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {story || '스토리 제목이 없습니다'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  캐릭터 정보 <span className="text-red-500">*</span>
                </label>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {characterList.length > 0 ? 
                    characterList.map(c => `${c.name}: ${c.description}`).join(', ') : 
                    '캐릭터 정보가 없습니다'
                  }
                </div>
              </div>
              
              {storySummary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    스토리 요약
                  </label>
                  <div className="text-sm text-gray-600 bg-white p-2 rounded border">{storySummary}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 공통 입력 완료 상태 요약 */}
        {commonInputsCompleted && !showCommonInputs && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-3">✅ 입력 완료된 기본 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-1">스토리 제목</div>
                <div className="text-gray-600 bg-white p-2 rounded border">{story}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">캐릭터 정보</div>
                <div className="text-gray-600 bg-white p-2 rounded border">
                  {characterList.length > 0 ? 
                    characterList.map(c => `${c.name}: ${c.description}`).join(', ') : 
                    '캐릭터 정보 없음'
                  }
                </div>
              </div>
              {storySummary && (
                <div className="md:col-span-2">
                  <div className="font-medium text-gray-700 mb-1">스토리 요약</div>
                  <div className="text-gray-600 bg-white p-2 rounded border">{storySummary}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 이미지 분석 도구 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">🔍 이미지 분석 도구</h3>
          <Button
            onClick={onOpenImageAnalysis}
            variant="outline"
            className="text-sm"
          >
            분석 도구 열기
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          AI를 사용하여 이미지를 분석하고 텍스트로 변환합니다. 분석 결과를 복사하여 프롬프트에 활용할 수 있습니다.
        </p>
      </div>

      {/* Imagen 프롬프트 샘플 모달 */}
      <ImagenPromptSampleModal
        isOpen={showImagenPromptSampleModal}
        onClose={() => setShowImagenPromptSampleModal(false)}
      />
    </div>
  );
};
