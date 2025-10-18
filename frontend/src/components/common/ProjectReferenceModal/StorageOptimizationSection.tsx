import React, { useState } from 'react';
import { Settings, RefreshCw, Trash2, HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';
import { storageOptimizationService } from '../../../services/storageOptimizationService';

interface StorageOptimizationSectionProps {
  storageOptimization: any;
  showOptimization: boolean;
  setShowOptimization: (show: boolean) => void;
  onStorageOptimization: () => void;
}

export const StorageOptimizationSection: React.FC<StorageOptimizationSectionProps> = ({
  storageOptimization,
  showOptimization,
  setShowOptimization,
  onStorageOptimization
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimization = async () => {
    setIsOptimizing(true);
    try {
      await onStorageOptimization();
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 저장 최적화 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          저장 최적화
        </h3>
        <button
          onClick={() => setShowOptimization(!showOptimization)}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          <HardDrive className="w-4 h-4" />
          {showOptimization ? '최적화 숨기기' : '최적화 보기'}
        </button>
      </div>

      {/* 최적화 요약 */}
      {storageOptimization && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">압축 비율:</span>
              <span className="ml-2 font-medium">
                {(storageOptimization.compressionRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">중복 제거:</span>
              <span className="ml-2 font-medium">
                {(storageOptimization.deduplicationRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">총 절약 가능:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatSize(storageOptimization.totalSavings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 최적화 상세 */}
      {showOptimization && storageOptimization && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">최적화 권장사항</h4>
          
          {/* 권장사항 목록 */}
          <div className="space-y-2 mb-4">
            {storageOptimization.recommendations?.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-blue-800">{rec}</span>
              </div>
            ))}
          </div>

          {/* 최적화 실행 */}
          <div className="flex gap-2">
            <button
              onClick={handleOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  최적화 중...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  최적화 실행
                </>
              )}
            </button>
            
            <button
              onClick={() => storageOptimizationService.executeCompression()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              압축 실행
            </button>
            
            <button
              onClick={() => storageOptimizationService.executeDeduplication()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              <Trash2 className="w-4 h-4" />
              중복 제거
            </button>
          </div>
        </div>
      )}

      {/* 최적화 결과 */}
      {storageOptimization && storageOptimization.totalSavings > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-900">최적화 가능</h4>
          </div>
          <p className="text-sm text-green-800">
            최적화를 통해 <strong>{formatSize(storageOptimization.totalSavings)}</strong>의 저장 공간을 절약할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};
