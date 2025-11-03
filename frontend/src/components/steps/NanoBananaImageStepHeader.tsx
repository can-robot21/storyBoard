import React, { useState } from 'react';
import Button from '../common/Button';
import { ImageGenerationConfig } from '../common/ImageGenerationForm';
import { Settings, Info, Key, Image, Camera, Zap, Sparkles } from 'lucide-react';

interface NanoBananaImageStepHeaderProps {
  story: string;
  characterList: any[];
  storySummary: string;
  finalScenario: string;
  
  showCommonOptions: boolean;
  setShowCommonOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  imageConfig: ImageGenerationConfig;
  setImageConfig: (config: ImageGenerationConfig | ((prev: ImageGenerationConfig) => ImageGenerationConfig)) => void;
  
  showCommonInputs: boolean;
  setShowCommonInputs: (show: boolean | ((prev: boolean) => boolean)) => void;
  commonInputsCompleted: boolean;
  onCommonInputsComplete: () => void;
  onCommonInputsReset: () => void;
  
  onOpenImageAnalysis: () => void;
  onOpenAPIKeySetup: () => void;
  onOpenAdvancedImageGeneration: () => void;
  onOpenStyleReference: () => void;
}

export const NanoBananaImageStepHeader: React.FC<NanoBananaImageStepHeaderProps> = ({
  story,
  characterList,
  storySummary,
  finalScenario,
  showCommonOptions,
  setShowCommonOptions,
  imageConfig,
  setImageConfig,
  showCommonInputs,
  setShowCommonInputs,
  commonInputsCompleted,
  onCommonInputsComplete,
  onCommonInputsReset,
  onOpenImageAnalysis,
  onOpenAPIKeySetup,
  onOpenAdvancedImageGeneration,
  onOpenStyleReference
}) => {
  const [showNanoBananaInfo, setShowNanoBananaInfo] = useState(false);

  return (
    <div className="space-y-6">

      {/* 나노바나나 공통 설정 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">🎨 나노바나나 공통 설정</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNanoBananaInfo(true)}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              ℹ️ 나노바나나 가이드
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 스타일</label>
                <select
                  value={imageConfig.style}
                  onChange={(e) => setImageConfig((prev: ImageGenerationConfig) => ({ ...prev, style: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="photographic">사진형 (Photographic)</option>
                  <option value="artistic">아티스틱 (Artistic)</option>
                  <option value="cartoon">카툰 (Cartoon)</option>
                  <option value="anime">애니메이션 (Anime)</option>
                  <option value="realistic">리얼리스틱 (Realistic)</option>
                  <option value="illustration">일러스트레이션 (Illustration)</option>
                  <option value="sketch">스케치 (Sketch)</option>
                  <option value="pen_drawing">펜화 (Pen Drawing)</option>
                  <option value="ink_wash">수묵화 (Ink Wash)</option>
                  <option value="painting">회화 (Painting)</option>
                  <option value="watercolor">수채화 (Watercolor)</option>
                  <option value="oil_painting">유화 (Oil Painting)</option>
                  <option value="digital_art">디지털 아트 (Digital Art)</option>
                  <option value="concept_art">컨셉 아트 (Concept Art)</option>
                  <option value="fantasy">판타지 (Fantasy)</option>
                  <option value="sci_fi">사이언스 픽션 (Sci-Fi)</option>
                  <option value="vintage">빈티지 (Vintage)</option>
                  <option value="modern">모던 (Modern)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 품질</label>
                <select
                  value={imageConfig.quality}
                  onChange={(e) => setImageConfig((prev: ImageGenerationConfig) => ({ ...prev, quality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="standard">표준 (Standard)</option>
                  <option value="high">고품질 (High)</option>
                  <option value="ultra">초고품질 (Ultra)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">생성 이미지 개수</label>
                <select
                  value={imageConfig.numberOfImages}
                  onChange={(e) => setImageConfig((prev: ImageGenerationConfig) => ({ ...prev, numberOfImages: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={1}>1개</option>
                  <option value={2}>2개</option>
                  <option value={3}>3개</option>
                  <option value={4}>4개</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 공통 입력 항목 - 보기 전용 + 토글 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">📋 공통 입력 항목</h3>
          <button
            onClick={() => setShowCommonInputs((prev: boolean) => !prev)}
            className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
          >
            {showCommonInputs ? '감추기(기본)' : '보이기(기본)'}
          </button>
        </div>
        {showCommonInputs && (
          <div className="space-y-2 text-sm">
            <div><b>스토리:</b> {story || '스토리 제목이 없습니다'}</div>
            <div><b>캐릭터:</b> {characterList.length > 0 ? characterList.map(c => c.name || c.description).join(', ') : '없음'}</div>
            {storySummary && (<div><b>스토리 요약:</b> {storySummary}</div>)}
          </div>
        )}
      </div>

      {/* 이미지 분석 도구 및 고급 이미지 생성 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 이미지 분석 도구 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              이미지 분석 도구
            </h3>
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

        {/* 고급 이미지 생성 */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              고급 이미지 생성
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={onOpenAdvancedImageGeneration}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white"
              >
                고급 생성
              </Button>
              <Button
                onClick={onOpenAPIKeySetup}
                variant="outline"
                className="text-sm"
              >
                API 설정
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            고급 설정과 API 키 설정을 통해 더욱 정교한 이미지를 생성할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 나노바나나 가이드 모달 */}
      {showNanoBananaInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-purple-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                나노바나나 (Nano Banana) 가이드
              </h3>
              <button
                onClick={() => setShowNanoBananaInfo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">🎯 나노바나나란?</h4>
                <p className="text-gray-700">
                  Google의 Gemini 2.5 Flash Image 모델을 사용한 고급 이미지 생성 도구입니다. 
                  텍스트와 이미지를 조합하여 창의적이고 정확한 이미지를 생성할 수 있습니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">✨ 주요 기능</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>Text-to-Image:</strong> 텍스트 설명으로 고품질 이미지 생성</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>이미지 수정:</strong> 기존 이미지에 요소 추가, 삭제, 수정</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>스타일 전이:</strong> 한 이미지의 스타일을 다른 이미지에 적용</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span><strong>고화질 텍스트 렌더링:</strong> 로고, 다이어그램, 포스터 제작</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📝 효과적인 프롬프트 작성법</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>장면을 구체적으로 설명하고 키워드만 나열하지 마세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>카메라 각도, 렌즈 유형, 조명, 세부사항을 포함하세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>이미지의 목적과 맥락을 명확히 설명하세요</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>반복적인 수정을 통해 점진적으로 개선하세요</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• 생성된 모든 이미지에는 SynthID 워터마크가 포함됩니다</li>
                  <li>• 최대 3개의 이미지를 입력으로 사용할 때 가장 잘 작동합니다</li>
                  <li>• 다른 사람의 권리를 침해하는 콘텐츠 생성은 금지됩니다</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowNanoBananaInfo(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};