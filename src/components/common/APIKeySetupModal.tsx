import React from 'react';
import Button from './Button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface APIKeySetupProps {
  onClose?: () => void;
}

export const APIKeySetupModal: React.FC<APIKeySetupProps> = ({ onClose }) => {
  const handleOpenGeminiConsole = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-800">API 키 설정 필요</h2>
        </div>
        
        <div className="space-y-4 text-gray-700">
          <p className="text-lg">
            Google AI (Gemini) API 키가 설정되지 않아 이미지 생성 기능을 사용할 수 없습니다.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">설정 방법:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Google AI Studio에서 API 키를 발급받으세요</li>
              <li>프로젝트 루트에 <code className="bg-blue-100 px-1 rounded">.env</code> 파일을 생성하세요</li>
              <li>다음 내용을 추가하세요:</li>
            </ol>
            <div className="mt-3 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
              REACT_APP_GEMINI_API_KEY=your-api-key-here
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">주의사항:</h3>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>API 키는 절대 공개하지 마세요</li>
              <li>.env 파일은 .gitignore에 포함되어야 합니다</li>
              <li>설정 후 개발 서버를 재시작하세요</li>
            </ul>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={handleOpenGeminiConsole}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Google AI Studio 열기
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 rounded-lg"
            >
              닫기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
