import React, { useState, useEffect } from 'react';
import { dataAccessControlService } from '../../services/dataAccessControlService';
import { useUIStore } from '../../stores/uiStore';
import { Shield, AlertTriangle, CheckCircle, X, RefreshCw, Eye, Trash2, ArrowLeft } from 'lucide-react';

interface SecurityCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
}

export const SecurityCheckModal: React.FC<SecurityCheckModalProps> = ({
  isOpen,
  onClose,
  onGoBack
}) => {
  const { addNotification } = useUIStore();
  const [isRunning, setIsRunning] = useState(false);
  const [securityResult, setSecurityResult] = useState<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [showAccessLogs, setShowAccessLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAccessLogs();
    }
  }, [isOpen]);

  const runSecurityCheck = async () => {
    setIsRunning(true);
    setSecurityResult(null);

    try {
      const result = await dataAccessControlService.runSecurityCheck();
      setSecurityResult(result);
      
      if (result.passed) {
        addNotification({
          type: 'success',
          title: '보안 검사 완료',
          message: '모든 보안 검사를 통과했습니다.'
        });
      } else {
        addNotification({
          type: 'warning',
          title: '보안 검사 완료',
          message: `${result.issues.length}개의 보안 이슈가 발견되었습니다.`
        });
      }
    } catch (error) {
      console.error('보안 검사 실패:', error);
      addNotification({
        type: 'error',
        title: '보안 검사 실패',
        message: '보안 검사 중 오류가 발생했습니다.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const loadAccessLogs = () => {
    try {
      const logs = dataAccessControlService.getAccessLog();
      setAccessLogs(logs);
    } catch (error) {
      console.error('접근 로그 로드 실패:', error);
    }
  };

  const clearAccessLogs = () => {
    if (window.confirm('접근 로그를 모두 삭제하시겠습니까?')) {
      dataAccessControlService.clearAccessLog();
      setAccessLogs([]);
      addNotification({
        type: 'success',
        title: '로그 삭제 완료',
        message: '접근 로그가 삭제되었습니다.'
      });
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read': return '👁️';
      case 'write': return '✏️';
      case 'delete': return '🗑️';
      default: return '❓';
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'project': return '📁';
      case 'image': return '🖼️';
      case 'template': return '📝';
      case 'apiKey': return '🔑';
      default: return '📄';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="관리 도구로 돌아가기"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">보안 검사 및 접근 로그</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="모달 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 보안 검사 섹션 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800">보안 검사</h3>
              <button
                onClick={runSecurityCheck}
                disabled={isRunning}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isRunning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 inline-block animate-spin" />
                    검사 중...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2 inline-block" />
                    보안 검사 실행
                  </>
                )}
              </button>
            </div>

            {securityResult && (
              <div className={`p-4 rounded-lg border ${
                securityResult.passed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-3">
                  {securityResult.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium mb-2 ${
                      securityResult.passed ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {securityResult.passed ? '보안 검사 통과' : '보안 이슈 발견'}
                    </h4>
                    
                    {securityResult.issues.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-red-700 mb-2">발견된 이슈:</h5>
                        <ul className="list-disc list-inside text-red-600 space-y-1">
                          {securityResult.issues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {securityResult.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">권장사항:</h5>
                        <ul className="list-disc list-inside text-blue-600 space-y-1">
                          {securityResult.recommendations.map((recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 접근 로그 섹션 */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">접근 로그</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAccessLogs(!showAccessLogs)}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1 inline-block" />
                  {showAccessLogs ? '숨기기' : '보기'}
                </button>
                <button
                  onClick={clearAccessLogs}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1 inline-block" />
                  로그 삭제
                </button>
              </div>
            </div>

            {showAccessLogs && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {accessLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">접근 로그가 없습니다.</p>
                ) : (
                  accessLogs.map((log, index) => (
                    <div key={index} className="bg-white p-3 rounded border text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{getResourceIcon(log.resourceType)}</span>
                          <span className="font-medium">{log.resourceType}</span>
                          <span>{getActionIcon(log.action)}</span>
                          <span className="text-gray-600">{log.action}</span>
                          <span className="text-gray-500">-</span>
                          <span className="text-gray-600">{log.resourceId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.allowed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {log.allowed ? '허용' : '거부'}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
