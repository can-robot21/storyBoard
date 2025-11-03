import React from 'react';
import Button from '../Button';
import { translateKoreanToEnglish } from '../../../utils/translationUtils';
import { downloadImage } from '../../../utils/imageUtils';

interface ImageGenerationStepProps {
  prompt: string;
  generatedImage: {
    imageUrl: string;
    prompt: string;
    settings: any;
    timestamp: Date;
  } | null;
  optimizationResult: {
    aiOptimizedKorean: string;
    translatedEnglish: string;
    geminiOptimized: string;
    model?: string;
    ratio?: string;
    upscale?: string;
    settings?: string;
  } | null;
  isGenerating: boolean;
  showPromptDetails: boolean;
  onGenerate: () => void;
  onShowPromptDetailsChange: (show: boolean) => void;
  onSave: (imageData: {
    imageUrl: string;
    prompt: string;
    timestamp: string;
    settings: any;
  }) => void;
  onReset: () => void;
  onPrev: () => void;
}

/**
 * 이미지 생성 단계 컴포넌트
 */
export const ImageGenerationStep: React.FC<ImageGenerationStepProps> = ({
  prompt,
  generatedImage,
  optimizationResult,
  isGenerating,
  showPromptDetails,
  onGenerate,
  onShowPromptDetailsChange,
  onSave,
  onReset,
  onPrev
}) => {
  const handleDownload = () => {
    if (generatedImage) {
      downloadImage(generatedImage.imageUrl, `generated-image-${Date.now()}.png`);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      onSave({
        imageUrl: generatedImage.imageUrl,
        prompt: optimizationResult ? optimizationResult.geminiOptimized : (prompt ? translateKoreanToEnglish(prompt) : prompt),
        timestamp: new Date().toISOString(),
        settings: generatedImage.settings
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">이미지 생성</h3>
        <p className="text-sm text-gray-600">설정이 완료되었습니다. 이미지를 생성하거나 이전 단계로 돌아가서 수정할 수 있습니다.</p>
      </div>

      {/* 이미지 생성 버튼 (상단) */}
      <div className="text-center">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50 flex items-center mx-auto"
        >
          <span className="mr-2">🎨</span>
          {isGenerating ? '이미지 생성 중...' : '이미지 생성하기'}
        </Button>
      </div>

      {/* 생성된 이미지 표시 */}
      {generatedImage && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-lg font-medium text-gray-800 mb-2">생성된 이미지</h4>
          </div>
          
          <div className="flex justify-center">
            <img
              src={generatedImage.imageUrl}
              alt="Generated"
              className="max-w-full max-h-96 rounded-lg shadow-lg"
            />
          </div>

          {/* 최종 JSON 프롬프트 보이기 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">사용된 최종 JSON 프롬프트</h4>
              <button
                onClick={() => onShowPromptDetailsChange(!showPromptDetails)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <span className="mr-1">{showPromptDetails ? '👁️' : '👁️‍🗨️'}</span>
                {showPromptDetails ? '프롬프트 감추기' : '프롬프트 보이기'}
              </button>
            </div>
            
            {showPromptDetails && (
              <div className="bg-white p-3 rounded border">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
{JSON.stringify({
  "model": "nano-banana",
  "prompt": optimizationResult ? optimizationResult.geminiOptimized : (prompt ? translateKoreanToEnglish(prompt) : '프롬프트가 입력되지 않았습니다.'),
  "ratio": optimizationResult?.ratio || "4:3",
  "upscale": optimizationResult?.upscale || "Upscale photos to high resolution x2",
  "settings": optimizationResult?.settings || `--no text --no logo --no watermark --no captions --no artifacts --ar ${optimizationResult?.ratio || "4:3"}`
}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하단 버튼들 */}
      <div className="flex justify-between items-center mt-6">
        {/* 이전 버튼 */}
        <Button
          onClick={onPrev}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          이전
        </Button>
        
        {/* 중앙 액션 버튼들 */}
        <div className="flex gap-3">
          {generatedImage ? (
            <>
              {/* 재생성 버튼 */}
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">🔄</span>
                재생성
              </Button>
              
              {/* 다운로드 버튼 */}
              <Button
                onClick={handleDownload}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">💾</span>
                다운로드
              </Button>
              
              {/* 저장 버튼 */}
              <Button
                onClick={handleSave}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">💾</span>
                저장
              </Button>
            </>
          ) : null}
          
          {/* 초기화 버튼 */}
          <Button
            onClick={onReset}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <span className="mr-2">🔄</span>
            초기화
          </Button>
        </div>
      </div>
    </div>
  );
};

