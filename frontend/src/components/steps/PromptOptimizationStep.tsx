import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { AIServiceSelector } from '../../shared/components/AIServiceSelector';
import { useAIService } from '../../shared/hooks/useAIService';
import { DetailedSettings } from '../../types/imageGeneration';
import { PromptOptimizationResult } from '../../types/aiService';

interface PromptOptimizationStepProps {
  prompt: string;
  settings: DetailedSettings;
  attachedImages: File[];
  onOptimized: (result: PromptOptimizationResult) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const PromptOptimizationStep: React.FC<PromptOptimizationStepProps> = ({
  prompt,
  settings,
  attachedImages,
  onOptimized,
  onNext,
  onPrevious
}) => {
  const {
    selectedProvider,
    availableProviders,
    optimizePrompt,
    getSupportedFeatures,
    isLoading,
    error,
    clearError,
    switchProvider
  } = useAIService();

  const [optimizationResult, setOptimizationResult] = useState<PromptOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const supportedFeatures = getSupportedFeatures();

  // 프롬프트 변경 시 최적화 결과 초기화
  useEffect(() => {
    setOptimizationResult(null);
  }, [prompt, settings]);

  // AI 서비스 변경 시 최적화 결과 초기화
  const handleProviderChange = async (provider: any) => {
    setOptimizationResult(null);
    clearError();
    await switchProvider(provider);
  };

  // 프롬프트 최적화 실행
  const handleOptimize = async () => {
    if (!prompt.trim()) {
      alert('프롬프트를 입력해주세요.');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizePrompt(prompt, settings);
      setOptimizationResult(result);
      onOptimized(result);
    } catch (error) {
      console.error('프롬프트 최적화 실패:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 다음 단계로 진행
  const handleNext = () => {
    if (!optimizationResult) {
      alert('프롬프트를 최적화해주세요.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">5. 프롬프트 최적화</h3>
        <p className="text-sm text-gray-600">
          AI 서비스를 선택하고 프롬프트를 최적화하여 더 나은 이미지를 생성하세요.
        </p>
      </div>

      {/* AI 서비스 선택 */}
      <AIServiceSelector
        selectedProvider={selectedProvider}
        onProviderChange={handleProviderChange}
        supportedFeatures={supportedFeatures}
        availableProviders={availableProviders}
        isLoading={isLoading}
      />

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-red-500">⚠️</div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            에러 닫기
          </button>
        </div>
      )}

      {/* 프롬프트 최적화 섹션 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">프롬프트 최적화</h4>
        
        <div className="space-y-4">
          {/* 원본 프롬프트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              원본 프롬프트
            </label>
            <div className="bg-white border border-gray-300 rounded-lg p-4 text-sm text-gray-800 min-h-[100px] max-h-[200px] overflow-y-auto">
              {prompt || '프롬프트가 입력되지 않았습니다.'}
            </div>
          </div>

          {/* 첨부된 이미지 정보 */}
          {attachedImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 이미지 ({attachedImages.length}개)
              </label>
              <div className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-600">
                {attachedImages.map((file, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 최적화 버튼 */}
          <Button
            onClick={handleOptimize}
            disabled={isOptimizing || !prompt.trim() || isLoading}
            className="w-full"
          >
            {isOptimizing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                최적화 중...
              </div>
            ) : (
              `${selectedProvider}로 프롬프트 최적화`
            )}
          </Button>

          {/* 최적화 결과 */}
          {optimizationResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-md font-medium text-gray-800">최적화된 프롬프트</h5>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showDetails ? '간단히 보기' : '상세 정보 보기'}
                </button>
              </div>
              
              <div className="bg-white border border-gray-300 rounded-lg p-4 text-sm text-gray-800 min-h-[100px] max-h-[300px] overflow-y-auto">
                {optimizationResult.optimizedPrompt}
              </div>

              {/* 상세 정보 */}
              {showDetails && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h6 className="text-sm font-medium text-blue-800 mb-2">최적화 상세 정보</h6>
                  <div className="space-y-2 text-xs text-blue-700">
                    <div className="flex justify-between">
                      <span>AI 서비스:</span>
                      <span>{optimizationResult.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>적용된 기법:</span>
                      <span>{optimizationResult.optimizationDetails.appliedTechniques.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>예상 토큰:</span>
                      <span>{optimizationResult.optimizationDetails.estimatedTokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>신뢰도:</span>
                      <span>{(optimizationResult.optimizationDetails.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>최적화 시간:</span>
                      <span>{optimizationResult.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex justify-between">
        <Button
          onClick={onPrevious}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!optimizationResult}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </Button>
      </div>
    </div>
  );
};

