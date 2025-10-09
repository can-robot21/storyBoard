import React, { useState } from 'react';
import Button from './Button';
import ImageUpload from './ImageUpload';
import { ImageGenerationConfig } from './ImageGenerationForm';

export interface AdvancedImageGenerationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: { description: string; image: string; attachedImages: File[] }) => void;
  nanoBananaService: any;
}

export const AdvancedImageGenerationModal: React.FC<AdvancedImageGenerationProps> = ({
  isOpen,
  onClose,
  onComplete,
  nanoBananaService
}) => {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [config, setConfig] = useState<ImageGenerationConfig>({
    style: 'realistic',
    quality: 'high',
    aspectRatio: '1:1',
    customSize: '',
    additionalPrompt: ''
  });
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConfigChange = (key: keyof ImageGenerationConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async () => {
    if (!nanoBananaService) return;

    setIsGenerating(true);
    try {
      // 프롬프트 구성
      let finalPrompt = prompt;
      if (config.additionalPrompt.trim()) {
        finalPrompt = `${finalPrompt}\n\n추가 요청사항: ${config.additionalPrompt}`;
      }
      if (config.customSize.trim()) {
        finalPrompt = `${finalPrompt}\n\n사이즈 요청사항: ${config.customSize}`;
      }
      
      // 스타일과 품질 추가
      finalPrompt = `${finalPrompt}\n\n스타일: ${config.style}, 품질: ${config.quality}, 비율: ${config.aspectRatio}`;

      let imageResult = '';
      
      if (attachedImages.length > 0) {
        // 첨부 이미지가 있을 때 - 첫 번째 이미지만 사용
        imageResult = await nanoBananaService.generateImageWithReference(
          finalPrompt,
          attachedImages[0]
        );
      } else {
        // 첨부 이미지가 없을 때
        const result = await nanoBananaService.generateImage({
          prompt: finalPrompt,
          provider: 'nano-banana',
          model: 'gemini-2.5-flash-image-preview',
          aspectRatio: config.aspectRatio as any,
          quality: config.quality as any,
          style: config.style as any
        });
        imageResult = result.images[0] || '';
      }
      
      if (imageResult) {
        setGeneratedImage(imageResult);
        setStep(6); // 이미지 확인 단계로 이동
      }
    } catch (error) {
      console.error('❌ 고급 이미지 생성 오류:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (generatedImage) {
      onComplete({
        description: prompt,
        image: generatedImage,
        attachedImages: attachedImages
      });
      
      // 상태 초기화
      setStep(1);
      setPrompt('');
      setAttachedImages([]);
      setGeneratedImage('');
      onClose();
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `advanced-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRegenerate = () => {
    setStep(1);
    setGeneratedImage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 모달 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🎨</span>
              고급 이미지 생성
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 단계별 진행 표시 */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3, 4, 5, 6].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 6 && (
                    <div className={`w-8 h-1 mx-2 ${
                      stepNum < step ? 'bg-yellow-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {step === 1 && '프롬프트 입력'}
              {step === 2 && '이미지 첨부'}
              {step === 3 && '스타일 설정'}
              {step === 4 && '고급 옵션'}
              {step === 5 && '이미지 생성'}
              {step === 6 && '이미지 확인'}
            </div>
          </div>

          {/* 단계별 콘텐츠 */}
          <div className="space-y-6">
            {/* 1단계: 프롬프트 입력 */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">1. 이미지 설명 입력</h3>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="생성하고 싶은 이미지에 대해 자세히 설명해주세요..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!prompt.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* 2단계: 이미지 첨부 */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">2. 참고 이미지 첨부 (선택사항)</h3>
                <ImageUpload
                  onImagesChange={setAttachedImages}
                  attachedImages={attachedImages}
                  maxImages={3}
                />
                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(1)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* 3단계: 스타일 설정 */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">3. 이미지 스타일 설정</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 스타일</label>
                    <select
                      value={config.style}
                      onChange={(e) => handleConfigChange('style', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="realistic">사실적 (Realistic)</option>
                      <option value="cartoon">만화 (Cartoon)</option>
                      <option value="anime">애니메이션 (Anime)</option>
                      <option value="3d">3D 렌더링</option>
                      <option value="watercolor">수채화</option>
                      <option value="oil_painting">유화</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 품질</label>
                    <select
                      value={config.quality}
                      onChange={(e) => handleConfigChange('quality', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="high">고품질 (High)</option>
                      <option value="standard">표준 (Standard)</option>
                      <option value="ultra">최고품질 (Ultra)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
                    <select
                      value={config.aspectRatio}
                      onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="1:1">정사각형 (1:1)</option>
                      <option value="16:9">와이드 (16:9)</option>
                      <option value="9:16">세로 (9:16)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(2)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* 4단계: 고급 옵션 */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">4. 고급 옵션 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 사이즈</label>
                    <input
                      type="text"
                      value={config.customSize}
                      onChange={(e) => handleConfigChange('customSize', e.target.value)}
                      placeholder="예: 1920x1080, 4K, 세로형 등"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">추가 프롬프트</label>
                    <textarea
                      value={config.additionalPrompt}
                      onChange={(e) => handleConfigChange('additionalPrompt', e.target.value)}
                      placeholder="추가로 원하는 스타일이나 요구사항을 입력하세요"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={() => setStep(5)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* 5단계: 이미지 생성 */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">5. 이미지 생성</h3>
                
                {/* 첨부된 이미지 미리보기 */}
                {attachedImages.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-700 mb-3">📷 첨부된 이미지</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {attachedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-32 object-contain rounded-lg border border-gray-200 bg-white"
                          />
                          <button
                            onClick={() => {
                              const newImages = attachedImages.filter((_, i) => i !== index);
                              setAttachedImages(newImages);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 편집 가능한 프롬프트 */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-700 mb-2">✏️ 최종 프롬프트 (수정 가능)</h4>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    placeholder="프롬프트를 수정할 수 있습니다..."
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">⚙️ 생성 설정 요약</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>스타일:</strong> {config.style}</p>
                    <p><strong>품질:</strong> {config.quality}</p>
                    <p><strong>비율:</strong> {config.aspectRatio}</p>
                    {config.customSize && <p><strong>커스텀 사이즈:</strong> {config.customSize}</p>}
                    {attachedImages.length > 0 && <p><strong>참고 이미지:</strong> {attachedImages.length}개</p>}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    onClick={() => setStep(4)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                  >
                    이전
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    loading={isGenerating}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    🍌 이미지 생성
                  </Button>
                </div>
              </div>
            )}

            {/* 6단계: 이미지 확인 */}
            {step === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">6. 생성된 이미지 확인</h3>
                
                {/* 생성된 이미지 표시 */}
                {generatedImage && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">생성된 이미지</h4>
                    <div className="flex justify-center">
                      <img 
                        src={generatedImage} 
                        alt="Generated Advanced"
                        className="max-w-full max-h-96 rounded-lg shadow-md"
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>설명:</strong> {prompt}</p>
                      <p><strong>스타일:</strong> {config.style} | <strong>품질:</strong> {config.quality} | <strong>비율:</strong> {config.aspectRatio}</p>
                    </div>
                  </div>
                )}

                {/* 액션 버튼들 */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handleRegenerate}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
                  >
                    🔄 재생성
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                  >
                    💾 다운로드
                  </Button>
                  <Button
                    onClick={handleComplete}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                  >
                    ✅ 완료
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
