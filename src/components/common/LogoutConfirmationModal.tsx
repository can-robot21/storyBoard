import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Save, Shield } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: LogoutOptions) => void;
  currentUser?: any;
}

export interface LogoutOptions {
  clearLocalData: boolean;
  clearProjectData: boolean;
  clearImageData: boolean;
  clearApiKeys: boolean;
  clearAccessLogs: boolean;
  backupData: boolean;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser
}) => {
  const [options, setOptions] = useState<LogoutOptions>({
    clearLocalData: false,
    clearProjectData: false,
    clearImageData: false,
    clearApiKeys: false,
    clearAccessLogs: false,
    backupData: true
  });

  const handleOptionChange = (option: keyof LogoutOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleConfirm = () => {
    onConfirm(options);
    onClose();
  };

  const handleSelectAll = () => {
    setOptions({
      clearLocalData: true,
      clearProjectData: true,
      clearImageData: true,
      clearApiKeys: true,
      clearAccessLogs: true,
      backupData: false
    });
  };

  const handleSelectNone = () => {
    setOptions({
      clearLocalData: false,
      clearProjectData: false,
      clearImageData: false,
      clearApiKeys: false,
      clearAccessLogs: false,
      backupData: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-800">로그아웃 확인</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 사용자 정보 */}
          {currentUser && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800">로그아웃 대상</h3>
                  <p className="text-sm text-blue-700">
                    {currentUser.name} ({currentUser.email})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 데이터 정리 옵션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">데이터 정리 옵션</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1 inline-block" />
                  모두 삭제
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-1 inline-block" />
                  모두 보존
                </button>
              </div>
            </div>

            {/* 백업 옵션 */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Save className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">데이터 백업</h4>
                  <p className="text-sm text-green-700">로그아웃 전에 데이터를 백업합니다</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.backupData}
                  onChange={(e) => handleOptionChange('backupData', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* 삭제 옵션들 */}
            <div className="space-y-3">
              {/* 로컬 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">로컬 저장소 데이터</h5>
                    <p className="text-sm text-gray-600">localStorage의 모든 데이터</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.clearLocalData}
                    onChange={(e) => handleOptionChange('clearLocalData', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 프로젝트 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">프로젝트 데이터</h5>
                    <p className="text-sm text-gray-600">생성된 모든 프로젝트</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.clearProjectData}
                    onChange={(e) => handleOptionChange('clearProjectData', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 이미지 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">이미지 데이터</h5>
                    <p className="text-sm text-gray-600">생성된 모든 이미지</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.clearImageData}
                    onChange={(e) => handleOptionChange('clearImageData', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* API 키 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">API 키</h5>
                    <p className="text-sm text-gray-600">저장된 API 키 정보</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.clearApiKeys}
                    onChange={(e) => handleOptionChange('clearApiKeys', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 접근 로그 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">접근 로그</h5>
                    <p className="text-sm text-gray-600">사용자 활동 로그</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.clearAccessLogs}
                    onChange={(e) => handleOptionChange('clearAccessLogs', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          {(options.clearLocalData || options.clearProjectData || options.clearImageData || options.clearApiKeys || options.clearAccessLogs) && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">⚠️ 주의사항</h4>
                  <p className="text-sm text-red-700">
                    선택한 데이터가 삭제되면 복구할 수 없습니다. 
                    {options.backupData && ' 백업 옵션이 활성화되어 있으므로 데이터가 백업됩니다.'}
                  </p>
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
              onClick={handleConfirm}
              className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
