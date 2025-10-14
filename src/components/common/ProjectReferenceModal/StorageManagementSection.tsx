import React, { useState } from 'react';
import { HardDrive, Trash2, RefreshCw, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { storageOptimizationService } from '../../../services/storageOptimizationService';

interface StorageManagementSectionProps {
  storageHealth: any;
  detailedUsage: any;
  showStorageDetails: boolean;
  setShowStorageDetails: (show: boolean) => void;
  onStorageCleanup: () => void;
}

export const StorageManagementSection: React.FC<StorageManagementSectionProps> = ({
  storageHealth,
  detailedUsage,
  showStorageDetails,
  setShowStorageDetails,
  onStorageCleanup
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<any>(null);
  const [showKeyDetails, setShowKeyDetails] = useState(false);

  const handleViewKeyDetails = (key: string) => {
    const details = storageOptimizationService.getKeyDetails(key);
    if (details) {
      setSelectedKey(key);
      setKeyDetails(details);
      setShowKeyDetails(true);
    }
  };

  const handleDeleteKey = (key: string) => {
    if (window.confirm(`'${key}' 키를 삭제하시겠습니까?`)) {
      const success = storageOptimizationService.deleteKey(key);
      if (success) {
        onStorageCleanup();
        setShowKeyDetails(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <HardDrive className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 스토리지 상태 요약 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            저장 공간 상태
          </h3>
          <div className="flex items-center gap-2">
            {getStatusIcon(storageHealth?.localStorage?.status)}
            <span className={`font-medium ${getStatusColor(storageHealth?.localStorage?.status)}`}>
              {storageHealth?.localStorage?.status === 'healthy' ? '정상' : 
               storageHealth?.localStorage?.status === 'warning' ? '주의' : '위험'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">사용량:</span>
            <span className="ml-2 font-medium">
              {(storageHealth?.localStorage?.used / 1024 / 1024).toFixed(1)}MB
            </span>
          </div>
          <div>
            <span className="text-gray-600">사용률:</span>
            <span className="ml-2 font-medium">
              {(storageHealth?.localStorage?.percentage * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                storageHealth?.localStorage?.percentage > 0.9 ? 'bg-red-500' :
                storageHealth?.localStorage?.percentage > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageHealth?.localStorage?.percentage * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 권장사항 */}
      {storageHealth?.recommendations?.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">권장사항</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {storageHealth.recommendations.map((rec: string, index: number) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 상세 정보 토글 */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowStorageDetails(!showStorageDetails)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <Eye className="w-4 h-4" />
          {showStorageDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
        </button>
        
        <button
          onClick={onStorageCleanup}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          정리 실행
        </button>
      </div>

      {/* 상세 사용량 */}
      {showStorageDetails && detailedUsage && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">상세 사용량</h4>
          <div className="space-y-2 text-sm">
            {detailedUsage.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{item.key}</span>
                  <span className="text-gray-600 ml-2">({item.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {(item.size / 1024).toFixed(1)}KB
                  </span>
                  <button
                    onClick={() => handleViewKeyDetails(item.key)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 키 상세 정보 모달 */}
      {showKeyDetails && keyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">키 상세 정보</h3>
              <button
                onClick={() => setShowKeyDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">키:</span>
                <span className="ml-2">{keyDetails.key}</span>
              </div>
              <div>
                <span className="font-medium">크기:</span>
                <span className="ml-2">{(keyDetails.size / 1024).toFixed(1)}KB</span>
              </div>
              <div>
                <span className="font-medium">타입:</span>
                <span className="ml-2">{keyDetails.type}</span>
              </div>
              <div>
                <span className="font-medium">항목 수:</span>
                <span className="ml-2">{keyDetails.itemCount}</span>
              </div>
              <div>
                <span className="font-medium">미리보기:</span>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {keyDetails.preview}
                </pre>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleDeleteKey(selectedKey!)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
              <button
                onClick={() => setShowKeyDetails(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
