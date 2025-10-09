import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { X, Upload, FileText, Copy, Download } from 'lucide-react';
import { NanoBananaService } from '../../services/ai/NanoBananaService';

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (result: string) => void;
  currentUser?: any; // currentUser를 props로 받도록 수정
}

export const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAnalysisComplete,
  currentUser
}) => {
  const [analysisImage, setAnalysisImage] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // API 키 확인 (사용자별 또는 환경 변수)
  const getAPIKey = () => {
    try {
      if (currentUser?.apiKeys?.google) return currentUser.apiKeys.google;
      if (typeof window !== 'undefined') {
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google) return localKeys.google as string;
        }
      }
    } catch {}
    return process.env.REACT_APP_GEMINI_API_KEY || '';
  };

  const hasAPIKey = getAPIKey().trim() !== '';

  // 나노 바나나 서비스 동적 인스턴스화
  const nanoBananaService = useMemo(() => {
    try {
      const apiKey = getAPIKey().trim();
      if (!apiKey || apiKey.length < 20 || !apiKey.startsWith('AIza')) {
        return null;
      }
      return new NanoBananaService({ apiKey });
    } catch (error) {
      console.error('⚠ 나노 바나나 서비스 초기화 실패:', error);
      return null;
    }
  }, [getAPIKey]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalysisImage(file);
      setError('');
      setAnalysisResult('');
    }
  };

  const handleAnalysis = async () => {
    if (!analysisImage) {
      setError('분석할 이미지를 선택해주세요.');
      return;
    }

    if (!hasAPIKey) {
      setError('Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      return;
    }

    if (!nanoBananaService) {
      setError('이미지 분석 서비스를 초기화할 수 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult('');

    try {
      const result = await nanoBananaService.analyzeImage(analysisImage);
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      console.error('Image analysis error:', err);
      
      let errorMessage = '이미지 분석 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        if (err.message.includes('API 키')) {
          errorMessage = 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
        } else if (err.message.includes('사용량 한도')) {
          errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (err.message.includes('안전 정책')) {
          errorMessage = '이미지가 안전 정책에 위배됩니다. 다른 이미지로 시도해주세요.';
        } else if (err.message.includes('503') || err.message.includes('UNAVAILABLE')) {
          errorMessage = 'Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (err.message.includes('네트워크')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        } else {
          errorMessage = `이미지 분석 중 오류가 발생했습니다: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyResult = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
    }
  };

  const handleDownloadResult = () => {
    if (analysisResult) {
      const blob = new Blob([analysisResult], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `이미지분석결과_${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setAnalysisImage(null);
    setAnalysisResult('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">이미지 분석 [분석 툴]</h2>
              <p className="text-sm text-gray-600">AI를 사용하여 이미지를 분석하고 텍스트로 변환합니다</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 이미지 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            분석할 이미지 선택
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">이미지 선택</span>
            </label>
            {analysisImage && (
              <span className="text-sm text-gray-600">
                선택됨: {analysisImage.name}
              </span>
            )}
          </div>
        </div>

        {/* 분석 버튼 */}
        <div className="mb-6">
          {!hasAPIKey ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Google AI API 키가 설정되지 않았습니다. 
                <br />
                설정에서 API 키를 입력한 후 이미지 분석을 사용할 수 있습니다.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleAnalysis}
              disabled={!analysisImage || isAnalyzing}
              className="w-full"
              variant="primary"
            >
              {isAnalyzing ? '분석 중...' : '이미지 분석 시작'}
            </Button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">분석 결과</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  복사
                </button>
                <button
                  onClick={handleDownloadResult}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {analysisResult}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

