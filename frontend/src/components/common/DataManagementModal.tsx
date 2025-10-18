// components/common/DataManagementModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  HardDrive,
  Cloud,
  Settings
} from 'lucide-react';
import { dataStatusChecker, DataStatusReport } from '../../utils/DataStatusChecker';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const [report, setReport] = useState<DataStatusReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      checkDataStatus();
    }
  }, [isOpen]);

  const checkDataStatus = async () => {
    setIsLoading(true);
    try {
      const statusReport = await dataStatusChecker.checkDataStatus();
      setReport(statusReport);
    } catch (error) {
      console.error('데이터 상태 점검 실패:', error);
      setMessage('데이터 상태 점검에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const result = await dataStatusChecker.cleanupData();
      setMessage(`${result.cleaned}개의 항목이 정리되었습니다.`);
      if (result.errors.length > 0) {
        setMessage(prev => prev + ` 오류: ${result.errors.length}개`);
      }
      await checkDataStatus(); // 상태 재점검
    } catch (error) {
      setMessage('데이터 정리에 실패했습니다.');
    } finally {
      setIsCleaning(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await dataStatusChecker.createBackup();
      setMessage(result);
    } catch (error) {
      setMessage('백업 생성에 실패했습니다.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">데이터베이스 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {/* 상태 점검 버튼 */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={checkDataStatus}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              상태 점검
            </button>
            <button
              onClick={handleCleanup}
              disabled={isCleaning}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
            >
              <Trash2 className={`w-4 h-4 ${isCleaning ? 'animate-pulse' : ''}`} />
              데이터 정리
            </button>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <Download className={`w-4 h-4 ${isBackingUp ? 'animate-pulse' : ''}`} />
              백업 생성
            </button>
          </div>

          {/* 메시지 */}
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">데이터 상태를 점검하고 있습니다...</span>
            </div>
          )}

          {/* 리포트 표시 */}
          {report && !isLoading && (
            <div className="space-y-6">
              {/* IndexedDB 상태 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">IndexedDB 상태</h3>
                  {report.indexedDB.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">상태:</span>
                    <span className={`ml-2 ${report.indexedDB.exists ? 'text-green-600' : 'text-red-600'}`}>
                      {report.indexedDB.exists ? '정상' : '초기화 필요'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">버전:</span>
                    <span className="ml-2 text-gray-800">{report.indexedDB.version}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Object Stores:</span>
                    <span className="ml-2 text-gray-800">{report.indexedDB.objectStores.length}개</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">총 레코드:</span>
                    <span className="ml-2 text-gray-800">
                      {Object.values(report.indexedDB.recordCounts).reduce((a, b) => a + b, 0)}개
                    </span>
                  </div>
                </div>

                {/* Object Store별 레코드 수 */}
                {report.indexedDB.objectStores.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Object Store별 레코드 수:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {report.indexedDB.objectStores.map(store => (
                        <div key={store} className="flex justify-between">
                          <span className="text-gray-600">{store}:</span>
                          <span className="text-gray-800">{report.indexedDB.recordCounts[store] || 0}개</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* localStorage 상태 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">localStorage 상태</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">총 키 수:</span>
                    <span className="ml-2 text-gray-800">{report.localStorage.totalKeys}개</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">총 용량:</span>
                    <span className="ml-2 text-gray-800">{formatBytes(report.localStorage.totalSize)}</span>
                  </div>
                </div>

                {/* 주요 키별 용량 */}
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">주요 키별 용량:</h4>
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
                    {Object.entries(report.localStorage.keyDetails)
                      .sort(([,a], [,b]) => b.size - a.size)
                      .slice(0, 10)
                      .map(([key, details]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 truncate max-w-[200px]">{key}:</span>
                          <span className="text-gray-800">{formatBytes(details.size)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* 데이터 일관성 */}
              {(report.dataConsistency.conflicts.length > 0 || 
                report.dataConsistency.duplicates.length > 0 || 
                report.dataConsistency.missingData.length > 0) && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-800">데이터 일관성 문제</h3>
                  </div>
                  
                  {report.dataConsistency.conflicts.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-yellow-700">충돌:</span>
                      <span className="ml-2 text-sm text-yellow-600">{report.dataConsistency.conflicts.length}개</span>
                    </div>
                  )}
                  
                  {report.dataConsistency.duplicates.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-yellow-700">중복:</span>
                      <span className="ml-2 text-sm text-yellow-600">{report.dataConsistency.duplicates.length}개</span>
                    </div>
                  )}
                  
                  {report.dataConsistency.missingData.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-yellow-700">누락:</span>
                      <span className="ml-2 text-sm text-yellow-600">{report.dataConsistency.missingData.length}개</span>
                    </div>
                  )}
                </div>
              )}

              {/* 권장사항 */}
              {report.recommendations.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Cloud className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-800">권장사항</h3>
                  </div>
                  
                  <ul className="space-y-2">
                    {report.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
