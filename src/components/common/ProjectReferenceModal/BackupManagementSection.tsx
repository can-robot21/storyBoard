import React, { useState } from 'react';
import { Download, Upload, Trash2, RefreshCw, Clock, HardDrive, FileText, AlertTriangle, CheckCircle, Plus, ArrowLeft } from 'lucide-react';
import { backupManagementService } from '../../../services/backupManagementService';

interface BackupManagementSectionProps {
  backups: any[];
  backupAnalysis: any;
  selectedBackups: Set<string>;
  setSelectedBackups: (backups: Set<string>) => void;
  showBackupManager: boolean;
  setShowBackupManager: (show: boolean) => void;
  onBackupSelection: (backupId: string, selected: boolean) => void;
  onSelectAllBackups: () => void;
  onDeselectAllBackups: () => void;
  onDeleteSelectedBackups: () => void;
  onAutoCleanupBackups: () => void;
  onCleanupTemporaryData: () => void;
}

export const BackupManagementSection: React.FC<BackupManagementSectionProps> = ({
  backups,
  backupAnalysis,
  selectedBackups,
  setSelectedBackups,
  showBackupManager,
  setShowBackupManager,
  onBackupSelection,
  onSelectAllBackups,
  onDeselectAllBackups,
  onDeleteSelectedBackups,
  onAutoCleanupBackups,
  onCleanupTemporaryData
}) => {
  const [showBackupDetails, setShowBackupDetails] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
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
      {/* 백업 관리 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          백업 관리
        </h3>
        <button
          onClick={() => setShowBackupManager(!showBackupManager)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <FileText className="w-4 h-4" />
          {showBackupManager ? '백업 관리 숨기기' : '백업 관리 보기'}
        </button>
      </div>

      {/* 백업 요약 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">총 백업 수:</span>
            <span className="ml-2 font-medium">{backups.length}개</span>
          </div>
          <div>
            <span className="text-gray-600">총 크기:</span>
            <span className="ml-2 font-medium">
              {formatSize(backups.reduce((sum, backup) => sum + backup.size, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* 백업 관리 상세 */}
      {showBackupManager && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">백업 목록</h4>
            <div className="flex gap-2">
              <button
                onClick={onSelectAllBackups}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                모두 선택
              </button>
              <button
                onClick={onDeselectAllBackups}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                선택 해제
              </button>
            </div>
          </div>

          {/* 백업 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBackups.has(backup.id)}
                    onChange={(e) => onBackupSelection(backup.id, e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <div className="font-medium text-sm">{backup.name}</div>
                    <div className="text-xs text-gray-600">
                      {formatDate(backup.timestamp)} • {formatSize(backup.size)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => backupManagementService.restoreBackup('currentUser', backup.id)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="복원"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => backupManagementService.exportBackup('currentUser', backup.id)}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 백업 액션 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onDeleteSelectedBackups}
              disabled={selectedBackups.size === 0}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              선택된 백업 삭제 ({selectedBackups.size})
            </button>
            <button
              onClick={onAutoCleanupBackups}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              자동 정리 (24시간 이상)
            </button>
            <button
              onClick={onCleanupTemporaryData}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              임시 데이터 정리
            </button>
          </div>
        </div>
      )}

      {/* 백업 분석 */}
      {backupAnalysis && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">백업 분석</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>• 총 백업 크기: {formatSize(backupAnalysis.totalSize)}</div>
            <div>• 오래된 백업: {backupAnalysis.oldBackups}개</div>
            <div>• 중복 데이터: {formatSize(backupAnalysis.duplicateSize)}</div>
            <div>• 정리 가능한 공간: {formatSize(backupAnalysis.cleanupSavings)}</div>
          </div>
        </div>
      )}
    </div>
  );
};
