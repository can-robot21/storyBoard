import React, { useState } from 'react';
import Button from './Button';
import { BatchImageService, BatchImageRequest, BatchImageResponse } from '../../services/batchImageService';

interface BatchImageGeneratorProps {
  onImagesGenerated: (images: Array<{ prompt: string; imageUrl: string }>) => void;
  className?: string;
}

export const BatchImageGenerator: React.FC<BatchImageGeneratorProps> = ({
  onImagesGenerated,
  className = '',
}) => {
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BatchImageResponse | null>(null);
  const [settings, setSettings] = useState({
    model: 'imagen-4.0-ultra-generate-001',
    aspectRatio: '16:9' as '16:9' | '1:1' | '9:16',
    numberOfImages: 1 as 1 | 2 | 4,
    style: 'realistic' as 'realistic' | 'anime' | 'cartoon' | 'artistic',
    quality: 'standard' as 'standard' | 'hd',
  });

  const addPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const updatePrompt = (index: number, value: string) => {
    const newPrompts = [...prompts];
    newPrompts[index] = value;
    setPrompts(newPrompts);
  };

  const handleGenerate = async () => {
    const validPrompts = prompts.filter(p => p.trim() !== '');
    if (validPrompts.length === 0) {
      alert('최소 하나의 프롬프트를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResults(null);

    try {
      const request: BatchImageRequest = {
        prompts: validPrompts,
        model: settings.model,
        aspectRatio: settings.aspectRatio,
        numberOfImages: settings.numberOfImages,
        style: settings.style,
        quality: settings.quality,
      };

      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // 사용자 API 키로 서비스 인스턴스 생성
      const getAPIKey = () => {
        try {
          if (typeof window !== 'undefined') {
            const currentUserRaw = localStorage.getItem('storyboard_current_user');
            const localKeysRaw = localStorage.getItem('user_api_keys');
            const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
            const localKeys = localKeysRaw ? JSON.parse(localKeysRaw) : {};
            
            return localKeys.google || currentUser?.apiKeys?.google || '';
          }
        } catch {}
        return '';
      };

      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      }

      const batchService = new BatchImageService(apiKey);
      const response = await batchService.generateBatchImages(request);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setResults(response);
      
      // 성공한 이미지들만 부모 컴포넌트로 전달
      const successfulImages = response.images
        .filter(img => img.success)
        .map(img => ({ prompt: img.prompt, imageUrl: img.imageUrl }));
      
      onImagesGenerated(successfulImages);
      
    } catch (error) {
      console.error('배치 이미지 생성 실패:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">배치 이미지 생성</h3>
        
        {/* 설정 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모델</label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="imagen-4.0-ultra-generate-001">Imagen 4.0 Ultra</option>
              <option value="imagen-3.0-generate-001">Imagen 3.0</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비율</label>
            <select
              value={settings.aspectRatio}
              onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="16:9">16:9 (와이드)</option>
              <option value="1:1">1:1 (정사각형)</option>
              <option value="9:16">9:16 (세로)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">스타일</label>
            <select
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="realistic">사실적</option>
              <option value="anime">애니메이션</option>
              <option value="cartoon">만화</option>
              <option value="artistic">예술적</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품질</label>
            <select
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="standard">표준</option>
              <option value="hd">HD</option>
            </select>
          </div>
        </div>

        {/* 프롬프트 입력 */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-gray-700">프롬프트</label>
          {prompts.map((prompt, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => updatePrompt(index, e.target.value)}
                placeholder={`프롬프트 ${index + 1}을 입력하세요...`}
                className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isGenerating}
              />
              {prompts.length > 1 && (
                <Button
                  onClick={() => removePrompt(index)}
                  variant="secondary"
                  className="px-3 py-2 text-sm"
                  disabled={isGenerating}
                >
                  삭제
                </Button>
              )}
            </div>
          ))}
          
          <Button
            onClick={addPrompt}
            variant="secondary"
            className="w-full py-2 text-sm"
            disabled={isGenerating}
          >
            + 프롬프트 추가
          </Button>
        </div>

        {/* 생성 버튼 */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || prompts.every(p => p.trim() === '')}
          className="w-full py-2"
        >
          {isGenerating ? '생성 중...' : `🖼️ ${prompts.filter(p => p.trim() !== '').length}개 이미지 생성`}
        </Button>

        {/* 진행률 */}
        {isGenerating && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>진행률</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 결과 */}
        {results && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">생성 결과</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>✅ 성공: {results.totalGenerated}개</div>
              <div>❌ 실패: {results.totalFailed}개</div>
              <div>🎯 토큰: {results.estimatedTokens.toLocaleString()}</div>
              <div>💰 비용: ${results.estimatedCost.toFixed(4)}</div>
            </div>
            
            {results.totalFailed > 0 && (
              <div className="mt-2">
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-600">실패한 프롬프트 보기</summary>
                  <ul className="mt-1 space-y-1">
                    {results.images
                      .filter(img => !img.success)
                      .map((img, index) => (
                        <li key={index} className="text-red-600">
                          • {img.prompt}: {img.error}
                        </li>
                      ))}
                  </ul>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchImageGenerator;
