import React, { useState, useEffect } from 'react';
import { sessionManagementService } from '../../services/sessionManagementService';
import { useUIStore } from '../../stores/uiStore';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  Shield, 
  BarChart3, 
  Settings,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  const [sessionStatus, setSessionStatus] = useState<any>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [sessionEvents, setSessionEvents] = useState<any[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [showEvents, setShowEvents] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessionData();
      setupSessionListener();
    }
    return () => {
      removeSessionListener();
    };
  }, [isOpen]);

  const loadSessionData = () => {
    try {
      // 세션 상태 확인
      const status = sessionManagementService.checkSessionStatus();
      setSessionStatus(status);

      // 세션 설정 로드
      const config = sessionManagementService.getSessionConfig();
      setSessionConfig(config);

      // 세션 이벤트 로드
      const events = sessionManagementService.getSessionEvents();
      setSessionEvents(events);

      // 세션 통계 로드
      const stats = sessionManagementService.getSessionStats();
      setSessionStats(stats);
    } catch (error) {
      console.error('세션 데이터 로드 실패:', error);
    }
  };

  const setupSessionListener = () => {
    const handleSessionEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      if (type === 'warning') {
        addNotification({
          type: 'warning',
          title: '세션 경고',
          message: data.message
        });
      } else if (type === 'expired') {
        addNotification({
          type: 'error',
          title: '세션 만료',
          message: data.message
        });
      } else if (type === 'logout') {
        addNotification({
          type: 'info',
          title: '자동 로그아웃',
          message: data.message
        });
      }
      
      // 세션 데이터 새로고침
      loadSessionData();
    };

    window.addEventListener('sessionEvent', handleSessionEvent as EventListener);
  };

  const removeSessionListener = () => {
    window.removeEventListener('sessionEvent', () => {});
  };

  const handleExtendSession = () => {
    try {
      const extended = sessionManagementService.extendSession();
      if (extended) {
        addNotification({
          type: 'success',
          title: '세션 연장',
          message: '세션이 연장되었습니다.'
        });
        loadSessionData();
      } else {
        addNotification({
          type: 'error',
          title: '세션 연장 실패',
          message: '세션을 연장할 수 없습니다.'
        });
      }
    } catch (error) {
      console.error('세션 연장 실패:', error);
      addNotification({
        type: 'error',
        title: '세션 연장 실패',
        message: '세션 연장 중 오류가 발생했습니다.'
      });
    }
  };

  const handleUpdateConfig = (key: string, value: any) => {
    try {
      const newConfig = { ...sessionConfig, [key]: value };
      sessionManagementService.updateSessionConfig(newConfig);
      setSessionConfig(newConfig);
      
      addNotification({
        type: 'success',
        title: '설정 업데이트',
        message: '세션 설정이 업데이트되었습니다.'
      });
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      addNotification({
        type: 'error',
        title: '설정 업데이트 실패',
        message: '설정 업데이트 중 오류가 발생했습니다.'
      });
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}분 ${seconds}초`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return '🔐';
      case 'logout': return '🔓';
      case 'activity': return '👆';
      case 'warning': return '⚠️';
      case 'expired': return '⏰';
      case 'extended': return '⏰';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'login': return 'text-green-600';
      case 'logout': return 'text-red-600';
      case 'activity': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      case 'extended': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">세션 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 현재 세션 상태 */}
          {sessionStatus && (
            <div className={`p-4 rounded-lg border ${
              sessionStatus.isValid 
                ? sessionStatus.isWarning 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sessionStatus.isValid ? (
                    sessionStatus.isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Shield className="w-5 h-5 text-green-600" />
                    )
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-medium ${
                      sessionStatus.isValid 
                        ? sessionStatus.isWarning 
                          ? 'text-yellow-800' 
                          : 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {sessionStatus.isValid 
                        ? sessionStatus.isWarning 
                          ? '세션 경고' 
                          : '세션 활성'
                        : '세션 만료'
                      }
                    </h3>
                    <p className={`text-sm ${
                      sessionStatus.isValid 
                        ? sessionStatus.isWarning 
                          ? 'text-yellow-700' 
                          : 'text-green-700'
                        : 'text-red-700'
                    }`}>
                      {sessionStatus.isValid 
                        ? `남은 시간: ${formatTime(sessionStatus.timeRemaining)}`
                        : '세션이 만료되었습니다.'
                      }
                    </p>
                  </div>
                </div>
                {sessionStatus.isValid && (
                  <button
                    onClick={handleExtendSession}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 inline-block" />
                    세션 연장
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 세션 설정 */}
          {sessionConfig && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">세션 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    세션 타임아웃 (분)
                  </label>
                  <input
                    type="number"
                    value={sessionConfig.timeoutMinutes}
                    onChange={(e) => handleUpdateConfig('timeoutMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="5"
                    max="480"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    경고 시간 (분)
                  </label>
                  <input
                    type="number"
                    value={sessionConfig.warningMinutes}
                    onChange={(e) => handleUpdateConfig('warningMinutes', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 세션 수
                  </label>
                  <input
                    type="number"
                    value={sessionConfig.maxSessions}
                    onChange={(e) => handleUpdateConfig('maxSessions', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sessionConfig.autoLogout}
                      onChange={(e) => handleUpdateConfig('autoLogout', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">자동 로그아웃</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 세션 통계 */}
          {sessionStats && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">세션 통계</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.totalSessions}</div>
                  <div className="text-sm text-blue-700">총 세션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(sessionStats.averageSessionDuration)}
                  </div>
                  <div className="text-sm text-blue-700">평균 지속시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(sessionStats.longestSession)}
                  </div>
                  <div className="text-sm text-blue-700">최장 세션</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.totalActivity}</div>
                  <div className="text-sm text-blue-700">총 활동</div>
                </div>
              </div>
            </div>
          )}

          {/* 세션 이벤트 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">세션 이벤트</h3>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                {showEvents ? <EyeOff className="w-4 h-4 mr-1 inline-block" /> : <Eye className="w-4 h-4 mr-1 inline-block" />}
                {showEvents ? '숨기기' : '보기'}
              </button>
            </div>

            {showEvents && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessionEvents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">세션 이벤트가 없습니다.</p>
                ) : (
                  sessionEvents.slice(-20).reverse().map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border rounded">
                      <span className="text-lg">{getEventIcon(event.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getEventColor(event.type)}`}>
                            {event.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {event.details && (
                          <p className="text-xs text-gray-600 mt-1">
                            {JSON.stringify(event.details)}
                          </p>
                        )}
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
