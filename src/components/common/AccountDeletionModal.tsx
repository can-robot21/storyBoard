import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: AccountDeletionOptions) => void;
  currentUser?: any;
}

export interface AccountDeletionOptions {
  confirmDeletion: boolean;
  backupData: boolean;
  deleteProjects: boolean;
  deleteImages: boolean;
  deleteTemplates: boolean;
  deleteApiKeys: boolean;
  deleteAccessLogs: boolean;
  deleteAllData: boolean;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentUser
}) => {
  const [options, setOptions] = useState<AccountDeletionOptions>({
    confirmDeletion: false,
    backupData: true,
    deleteProjects: true,
    deleteImages: true,
    deleteTemplates: true,
    deleteApiKeys: true,
    deleteAccessLogs: true,
    deleteAllData: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const handleOptionChange = (option: keyof AccountDeletionOptions, value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleConfirm = () => {
    if (!options.confirmDeletion) {
      alert('계정 삭제 확인을 체크해주세요.');
      return;
    }

    if (confirmText !== 'DELETE') {
      alert('확인 텍스트를 정확히 입력해주세요.');
      return;
    }

    onConfirm(options);
    onClose();
  };

  const handleSelectAll = () => {
    setOptions({
      confirmDeletion: true,
      backupData: false,
      deleteProjects: true,
      deleteImages: true,
      deleteTemplates: true,
      deleteApiKeys: true,
      deleteAccessLogs: true,
      deleteAllData: true
    });
  };

  const handleSelectNone = () => {
    setOptions({
      confirmDeletion: false,
      backupData: true,
      deleteProjects: false,
      deleteImages: false,
      deleteTemplates: false,
      deleteApiKeys: false,
      deleteAccessLogs: false,
      deleteAllData: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-800">계정 삭제</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 경고 메시지 */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 mb-2">⚠️ 주의사항</h3>
                <p className="text-sm text-red-700">
                  계정 삭제는 <strong>되돌릴 수 없는 작업</strong>입니다. 
                  모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 사용자 정보 */}
          {currentUser && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">삭제 대상 계정</h3>
                  <p className="text-sm text-gray-700">
                    {currentUser.name} ({currentUser.email})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 삭제 확인 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">삭제 확인</h3>
            
            {/* 계정 삭제 확인 */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-800">계정 삭제 확인</h4>
                  <p className="text-sm text-red-700">계정을 삭제하시겠습니까?</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.confirmDeletion}
                  onChange={(e) => handleOptionChange('confirmDeletion', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* 확인 텍스트 입력 */}
            {options.confirmDeletion && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <label className="block text-sm font-medium text-yellow-800 mb-2">
                  확인을 위해 <strong>"DELETE"</strong>를 입력하세요:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* 데이터 삭제 옵션 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">삭제할 데이터</h3>
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
                  <Shield className="w-4 h-4 mr-1 inline-block" />
                  모두 보존
                </button>
              </div>
            </div>

            {/* 백업 옵션 */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <h5 className="font-medium text-gray-800">데이터 백업</h5>
                  <p className="text-sm text-gray-600">삭제 전에 데이터를 백업합니다</p>
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
                    checked={options.deleteProjects}
                    onChange={(e) => handleOptionChange('deleteProjects', e.target.checked)}
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
                    checked={options.deleteImages}
                    onChange={(e) => handleOptionChange('deleteImages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 템플릿 데이터 */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-gray-800">템플릿 데이터</h5>
                    <p className="text-sm text-gray-600">저장된 프롬프트 템플릿</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.deleteTemplates}
                    onChange={(e) => handleOptionChange('deleteTemplates', e.target.checked)}
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
                    checked={options.deleteApiKeys}
                    onChange={(e) => handleOptionChange('deleteApiKeys', e.target.checked)}
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
                    checked={options.deleteAccessLogs}
                    onChange={(e) => handleOptionChange('deleteAccessLogs', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* 모든 데이터 */}
              <div className="flex items-center justify-between p-3 border-2 border-red-300 rounded-lg bg-red-50">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-medium text-red-800">모든 데이터</h5>
                    <p className="text-sm text-red-700">계정과 관련된 모든 데이터</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.deleteAllData}
                    onChange={(e) => handleOptionChange('deleteAllData', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

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
              disabled={!options.confirmDeletion || confirmText !== 'DELETE'}
              className={`px-6 py-2 rounded font-medium transition-colors ${
                !options.confirmDeletion || confirmText !== 'DELETE'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2 inline-block" />
              계정 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
