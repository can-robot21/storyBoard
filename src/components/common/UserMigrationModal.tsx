import React, { useState, useEffect } from 'react';
import { User } from '../../types/auth';
import { userMigrationService, MigrationOptions, MigrationResult } from '../../services/userMigrationService';
import { useUIStore } from '../../stores/uiStore';
import { X, AlertTriangle, CheckCircle, Info, Database, Image, FileText, Key } from 'lucide-react';

interface UserMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetUser: User;
  onMigrationComplete: (result: MigrationResult) => void;
}

export const UserMigrationModal: React.FC<UserMigrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
  onMigrationComplete
}) => {
  const { addNotification } = useUIStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [migrationOptions, setMigrationOptions] = useState<MigrationOptions>({
    preserveOriginalData: true,
    migrateProjects: true,
    migrateImages: true,
    migrateTemplates: true,
    migrateApiKeys: true
  });

  useEffect(() => {
    if (isOpen) {
      setMigrationResult(null);
      setIsMigrating(false);
    }
  }, [isOpen]);

  const handleMigration = async () => {
    if (!currentUser || !targetUser) {
      addNotification({
        type: 'error',
        title: '마이그레이션 오류',
        message: '사용자 정보가 올바르지 않습니다.',
      });
      return;
    }

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await userMigrationService.migrateUserData(
        currentUser.id,
        targetUser.id,
        migrationOptions
      );

      setMigrationResult(result);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: '마이그레이션 완료',
          message: `데이터 마이그레이션이 성공적으로 완료되었습니다.`,
        });
        onMigrationComplete(result);
      } else {
        addNotification({
          type: 'warning',
          title: '마이그레이션 부분 완료',
          message: `마이그레이션이 완료되었지만 일부 오류가 발생했습니다.`,
        });
      }
    } catch (error) {
      console.error('마이그레이션 실패:', error);
      addNotification({
        type: 'error',
        title: '마이그레이션 실패',
        message: '데이터 마이그레이션 중 오류가 발생했습니다.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleOptionChange = (option: keyof MigrationOptions, value: boolean) => {
    setMigrationOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">사용자 데이터 마이그레이션</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 마이그레이션 정보 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-2">마이그레이션 정보</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><span className="font-medium">현재 사용자:</span> {currentUser.name} ({currentUser.email})</p>
                  <p><span className="font-medium">대상 사용자:</span> {targetUser.name} ({targetUser.email})</p>
                  <p className="mt-2 text-blue-600">
                    선택한 데이터가 현재 사용자에서 대상 사용자로 이동됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 마이그레이션 옵션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">마이그레이션 옵션</h3>
            
            {/* 원본 데이터 보존 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <h4 className="font-medium text-gray-800">원본 데이터 보존</h4>
                  <p className="text-sm text-gray-600">원본 데이터를 삭제하지 않고 보존합니다</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={migrationOptions.preserveOriginalData}
                  onChange={(e) => handleOptionChange('preserveOriginalData', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 마이그레이션할 데이터 타입 */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">마이그레이션할 데이터</h4>
              
              {/* 프로젝트 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">프로젝트 데이터</h5>
                    <p className="text-sm text-gray-600">생성된 모든 프로젝트</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={migrationOptions.migrateProjects}
                    onChange={(e) => handleOptionChange('migrateProjects', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 이미지 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-purple-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">이미지 데이터</h5>
                    <p className="text-sm text-gray-600">생성된 모든 이미지</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={migrationOptions.migrateImages}
                    onChange={(e) => handleOptionChange('migrateImages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 템플릿 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">템플릿 데이터</h5>
                    <p className="text-sm text-gray-600">저장된 프롬프트 템플릿</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={migrationOptions.migrateTemplates}
                    onChange={(e) => handleOptionChange('migrateTemplates', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* API 키 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">API 키</h5>
                    <p className="text-sm text-gray-600">저장된 API 키 정보</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={migrationOptions.migrateApiKeys}
                    onChange={(e) => handleOptionChange('migrateApiKeys', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 마이그레이션 결과 */}
          {migrationResult && (
            <div className={`p-4 rounded-lg border ${
              migrationResult.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {migrationResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium mb-2 ${
                    migrationResult.success ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {migrationResult.success ? '마이그레이션 완료' : '마이그레이션 부분 완료'}
                  </h3>
                  <div className="text-sm space-y-1">
                    <p className={migrationResult.success ? 'text-green-700' : 'text-yellow-700'}>
                      프로젝트: {migrationResult.migratedProjects}개
                    </p>
                    <p className={migrationResult.success ? 'text-green-700' : 'text-yellow-700'}>
                      이미지: {migrationResult.migratedImages}개
                    </p>
                    <p className={migrationResult.success ? 'text-green-700' : 'text-yellow-700'}>
                      템플릿: {migrationResult.migratedTemplates}개
                    </p>
                    {migrationResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700">오류:</p>
                        <ul className="list-disc list-inside text-red-600">
                          {migrationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                isMigrating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  마이그레이션 중...
                </>
              ) : (
                '마이그레이션 시작'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
