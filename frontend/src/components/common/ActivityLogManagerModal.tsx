import React, { useState, useEffect } from 'react';
import { userActivityLogService } from '../../services/userActivityLogService';
import { useUIStore } from '../../stores/uiStore';
import { 
  X, 
  FileText, 
  Download, 
  Filter, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Trash2,
  RefreshCw,
  Calendar
} from 'lucide-react';

interface ActivityLogManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
}

export const ActivityLogManagerModal: React.FC<ActivityLogManagerModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [auditTrails, setAuditTrails] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [showAuditTrails, setShowAuditTrails] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    result: '',
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadActivityData();
    }
  }, [isOpen]);

  const loadActivityData = () => {
    try {
      // 활동 로그 로드
      const logs = userActivityLogService.getActivityLogs(currentUser?.id);
      setActivityLogs(logs);

      // 감사 추적 로드
      const trails = userActivityLogService.getAuditTrails(currentUser?.id);
      setAuditTrails(trails);

      // 활동 통계 로드
      const stats = userActivityLogService.getActivityStats(currentUser?.id);
      setActivityStats(stats);
    } catch (error) {
      console.error('활동 데이터 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '데이터 로드 실패',
        message: '활동 데이터를 불러오는 중 오류가 발생했습니다.'
      });
    }
  };

  const handleApplyFilters = () => {
    try {
      const filterOptions: any = {};
      
      if (filters.category) filterOptions.category = filters.category;
      if (filters.severity) filterOptions.severity = filters.severity;
      if (filters.startDate) filterOptions.startDate = new Date(filters.startDate).getTime();
      if (filters.endDate) filterOptions.endDate = new Date(filters.endDate).getTime();

      const filteredLogs = userActivityLogService.getActivityLogs(currentUser?.id, filterOptions);
      setActivityLogs(filteredLogs);

      addNotification({
        type: 'success',
        title: '필터 적용 완료',
        message: `${filteredLogs.length}개의 활동 로그가 표시됩니다.`
      });
    } catch (error) {
      console.error('필터 적용 실패:', error);
      addNotification({
        type: 'error',
        title: '필터 적용 실패',
        message: '필터 적용 중 오류가 발생했습니다.'
      });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      severity: '',
      result: '',
      startDate: '',
      endDate: ''
    });
    loadActivityData();
  };

  const handleExportLogs = (format: 'json' | 'csv') => {
    try {
      const exportData = userActivityLogService.exportActivityLogs(currentUser?.id, {
        format,
        startDate: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).getTime() : undefined
      });

      if (exportData) {
        const blob = new Blob([exportData], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        URL.revokeObjectURL(url);

        addNotification({
          type: 'success',
          title: '내보내기 완료',
          message: `활동 로그가 ${format.toUpperCase()} 형식으로 다운로드되었습니다.`
        });
      } else {
        addNotification({
          type: 'error',
          title: '내보내기 실패',
          message: '내보내기할 데이터가 없습니다.'
        });
      }
    } catch (error) {
      console.error('내보내기 실패:', error);
      addNotification({
        type: 'error',
        title: '내보내기 실패',
        message: '내보내기 중 오류가 발생했습니다.'
      });
    }
  };

  const handleExportAuditTrails = (format: 'json' | 'csv') => {
    try {
      const exportData = userActivityLogService.exportAuditTrails(currentUser?.id, {
        format,
        startDate: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
        endDate: filters.endDate ? new Date(filters.endDate).getTime() : undefined
      });

      if (exportData) {
        const blob = new Blob([exportData], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_trails_${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        URL.revokeObjectURL(url);

        addNotification({
          type: 'success',
          title: '내보내기 완료',
          message: `감사 추적이 ${format.toUpperCase()} 형식으로 다운로드되었습니다.`
        });
      } else {
        addNotification({
          type: 'error',
          title: '내보내기 실패',
          message: '내보내기할 데이터가 없습니다.'
        });
      }
    } catch (error) {
      console.error('내보내기 실패:', error);
      addNotification({
        type: 'error',
        title: '내보내기 실패',
        message: '내보내기 중 오류가 발생했습니다.'
      });
    }
  };

  const handleCleanupLogs = () => {
    if (!window.confirm('오래된 로그를 정리하시겠습니까? (30일 이상된 로그가 삭제됩니다)')) {
      return;
    }

    try {
      userActivityLogService.cleanupActivityLogs(30);
      userActivityLogService.cleanupAuditTrails(90);
      
      addNotification({
        type: 'success',
        title: '로그 정리 완료',
        message: '오래된 로그가 정리되었습니다.'
      });
      
      loadActivityData();
    } catch (error) {
      console.error('로그 정리 실패:', error);
      addNotification({
        type: 'error',
        title: '로그 정리 실패',
        message: '로그 정리 중 오류가 발생했습니다.'
      });
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return '🔐';
      case 'data': return '📊';
      case 'system': return '⚙️';
      case 'security': return '🛡️';
      case 'api': return '🔌';
      default: return '📝';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure': return <X className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">활동 로그 및 감사 추적</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 활동 통계 */}
          {activityStats && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">활동 통계</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{activityStats.totalActivities}</div>
                  <div className="text-sm text-blue-700">총 활동</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activityStats.activitiesByResult.success || 0}</div>
                  <div className="text-sm text-blue-700">성공</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{activityStats.activitiesByResult.failure || 0}</div>
                  <div className="text-sm text-blue-700">실패</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{activityStats.suspiciousActivities.length}</div>
                  <div className="text-sm text-blue-700">의심 활동</div>
                </div>
              </div>
            </div>
          )}

          {/* 필터 및 액션 */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">필터 및 액션</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAuditTrails(!showAuditTrails)}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1 inline-block" />
                  {showAuditTrails ? '활동 로그 보기' : '감사 추적 보기'}
                </button>
                <button
                  onClick={handleCleanupLogs}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1 inline-block" />
                  로그 정리
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="auth">인증</option>
                  <option value="data">데이터</option>
                  <option value="system">시스템</option>
                  <option value="security">보안</option>
                  <option value="api">API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">심각도</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체</option>
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">심각</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-1 inline-block" />
                  적용
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 활동 로그 또는 감사 추적 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {showAuditTrails ? '감사 추적' : '활동 로그'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportLogs('json')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1 inline-block" />
                  JSON 내보내기
                </button>
                <button
                  onClick={() => handleExportLogs('csv')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1 inline-block" />
                  CSV 내보내기
                </button>
                <button
                  onClick={loadActivityData}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1 inline-block" />
                  새로고침
                </button>
              </div>
            </div>

            {showAuditTrails ? (
              // 감사 추적 목록
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditTrails.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">감사 추적이 없습니다.</p>
                ) : (
                  auditTrails.slice(0, 50).map((trail) => (
                    <div key={trail.id} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔍</span>
                          <h4 className="font-medium text-gray-800">{trail.action}</h4>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(trail.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>사용자: {trail.userId}</p>
                        <p>변경사항: {trail.changes.length}개</p>
                        {trail.reason && (
                          <p>사유: {trail.reason}</p>
                        )}
                      </div>
                      {trail.changes.length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          {trail.changes.slice(0, 3).map((change: any, index: number) => (
                            <div key={index} className="text-gray-600">
                              • {change.field}: {JSON.stringify(change.oldValue)} → {JSON.stringify(change.newValue)}
                            </div>
                          ))}
                          {trail.changes.length > 3 && (
                            <div className="text-gray-500">... 외 {trail.changes.length - 3}개</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              // 활동 로그 목록
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">활동 로그가 없습니다.</p>
                ) : (
                  activityLogs.slice(0, 100).map((log) => (
                    <div key={log.id} className="p-3 bg-white border rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getCategoryIcon(log.category)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{log.action}</span>
                              <span className="text-sm text-gray-600">({log.resource})</span>
                              {getResultIcon(log.result)}
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </div>
                      </div>
                      {log.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      )}
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
