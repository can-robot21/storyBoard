import React, { useState, useEffect } from 'react';
import { backupManagementService } from '../../services/backupManagementService';
import { useUIStore } from '../../stores/uiStore';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  FileText,
  Plus,
  ArrowLeft
} from 'lucide-react';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  const [backupList, setBackupList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadBackupList();
    }
  }, [isOpen, currentUser]);

  const loadBackupList = async () => {
    if (!currentUser) return;
    
    try {
      const list = await backupManagementService.getBackupList(currentUser.id);
      setBackupList(list);
    } catch (error) {
      console.error('백업 목록 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '백업 목록 로드 실패',
        message: '백업 목록을 불러오는 중 오류가 발생했습니다.'
      });
    }
  };

  const handleCreateBackup = async () => {
    if (!currentUser) return;

    setIsCreatingBackup(true);
    try {
      const result = await backupManagementService.createManualBackup(currentUser.id);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: '백업 생성 완료',
          message: result.message || '백업이 성공적으로 생성되었습니다.',
        });
        loadBackupList();
      } else {
        addNotification({
          type: 'error',
          title: '백업 생성 실패',
          message: result.error || '백업 생성 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('백업 생성 실패:', error);
      addNotification({
        type: 'error',
        title: '백업 생성 실패',
        message: '백업 생성 중 오류가 발생했습니다.'
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!currentUser) return;

    if (!window.confirm('이 백업으로 데이터를 복원하시겠습니까? 현재 데이터는 덮어씌워집니다.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await backupManagementService.restoreBackup(currentUser.id, backupId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: '백업 복원 완료',
          message: result.message || '백업이 성공적으로 복원되었습니다.',
        });
      } else {
        addNotification({
          type: 'error',
          title: '백업 복원 실패',
          message: result.error || '백업 복원 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('백업 복원 실패:', error);
      addNotification({
        type: 'error',
        title: '백업 복원 실패',
        message: '백업 복원 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!currentUser) return;

    if (!window.confirm('이 백업을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const success = await backupManagementService.deleteBackup(currentUser.id, backupId);
      
      if (success) {
        addNotification({
          type: 'success',
          title: '백업 삭제 완료',
          message: '백업이 성공적으로 삭제되었습니다.'
        });
        loadBackupList();
      } else {
        addNotification({
          type: 'error',
          title: '백업 삭제 실패',
          message: '백업 삭제 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('백업 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '백업 삭제 실패',
        message: '백업 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  const handleExportBackup = async (backupId: string) => {
    if (!currentUser) return;

    try {
      const backupJson = await backupManagementService.exportBackup(currentUser.id, backupId);
      
      if (backupJson) {
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${backupId}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        addNotification({
          type: 'success',
          title: '백업 내보내기 완료',
          message: '백업 파일이 다운로드되었습니다.'
        });
      } else {
        addNotification({
          type: 'error',
          title: '백업 내보내기 실패',
          message: '백업 내보내기 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('백업 내보내기 실패:', error);
      addNotification({
        type: 'error',
        title: '백업 내보내기 실패',
        message: '백업 내보내기 중 오류가 발생했습니다.'
      });
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backupJson = e.target?.result as string;
        const success = await backupManagementService.importBackup(currentUser.id, backupJson);
        
        if (success) {
          addNotification({
            type: 'success',
            title: '백업 가져오기 완료',
            message: '백업이 성공적으로 가져와졌습니다.'
          });
          loadBackupList();
        } else {
          addNotification({
            type: 'error',
            title: '백업 가져오기 실패',
            message: '백업 가져오기 중 오류가 발생했습니다.'
          });
        }
      } catch (error) {
        console.error('백업 가져오기 실패:', error);
        addNotification({
          type: 'error',
          title: '백업 가져오기 실패',
          message: '백업 파일 형식이 올바르지 않습니다.'
        });
      }
    };
    reader.readAsText(file);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return <FileText className="w-4 h-4 text-blue-600" />;
      case 'automatic': return <Clock className="w-4 h-4 text-green-600" />;
      case 'scheduled': return <RefreshCw className="w-4 h-4 text-purple-600" />;
      default: return <HardDrive className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBackupTypeText = (type: string) => {
    switch (type) {
      case 'manual': return '수동';
      case 'automatic': return '자동';
      case 'scheduled': return '예약';
      default: return '알 수 없음';
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
              <HardDrive className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">백업 관리</h2>
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
          {/* 백업 생성 섹션 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800">새 백업 생성</h3>
              <button
                onClick={handleCreateBackup}
                disabled={isCreatingBackup}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isCreatingBackup
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 inline-block animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2 inline-block" />
                    백업 생성
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-blue-700">
              현재 프로젝트, 이미지, 템플릿, API 키 등의 데이터를 백업합니다.
            </p>
          </div>

          {/* 백업 가져오기 섹션 */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">백업 가져오기</h3>
              <label className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4 mr-2 inline-block" />
                파일 선택
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-green-700">
              이전에 내보낸 백업 파일을 가져와서 복원할 수 있습니다.
            </p>
          </div>

          {/* 백업 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">백업 목록</h3>
              <button
                onClick={loadBackupList}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1 inline-block" />
                새로고침
              </button>
            </div>

            {backupList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>백업이 없습니다.</p>
                <p className="text-sm">위의 '백업 생성' 버튼을 클릭하여 첫 번째 백업을 만들어보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backupList.map((backup) => (
                  <div
                    key={backup.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      selectedBackup === backup.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getBackupTypeIcon(backup.type)}
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {getBackupTypeText(backup.type)} 백업
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatTimestamp(backup.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{backup.itemCount}개 항목</span>
                        <span>•</span>
                        <span>{formatFileSize(backup.size)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={isLoading}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-1 inline-block" />
                        복원
                      </button>
                      <button
                        onClick={() => handleExportBackup(backup.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1 inline-block" />
                        내보내기
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1 inline-block" />
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
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