import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database/DatabaseService';
import { useUIStore } from '../../stores/uiStore';
import Button from './Button';
import Modal from './Modal';

interface APIKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const APIKeyManager: React.FC<APIKeyManagerProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const { addNotification } = useUIStore();
  const [apiKeys, setApiKeys] = useState<{[provider: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newKeys, setNewKeys] = useState<{[provider: string]: string}>({});

  const providers = [
    { key: 'google', name: 'Google AI', placeholder: 'Google AI API 키' },
    { key: 'openai', name: 'OpenAI', placeholder: 'OpenAI API 키' },
    { key: 'anthropic', name: 'Anthropic', placeholder: 'Anthropic API 키' },
    { key: 'midjourney', name: 'Midjourney', placeholder: 'Midjourney API 키' }
  ];

  // API 키 로드
  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await databaseService.getUserApiKeys(userId);
      setApiKeys(keys);
      setNewKeys({});
    } catch (error) {
      console.error('API 키 로드 실패:', error);
      addNotification({ 
        title: 'API 키 로드 실패', 
        message: 'API 키를 불러오는데 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // API 키 저장
  const saveApiKeys = async () => {
    try {
      setSaving(true);
      let hasChanges = false;

      for (const [provider, key] of Object.entries(newKeys)) {
        if (key.trim()) {
          await databaseService.saveUserApiKey(userId, provider, key.trim());
          hasChanges = true;
        }
      }

      if (hasChanges) {
      addNotification({ 
        title: 'API 키 저장 성공', 
        message: 'API 키가 성공적으로 저장되었습니다.', 
        type: 'success' 
      });
        loadApiKeys();
      } else {
        addNotification({ 
          title: '변경사항 없음', 
          message: '변경된 API 키가 없습니다.', 
          type: 'info' 
        });
      }
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      addNotification({ 
        title: 'API 키 저장 실패', 
        message: 'API 키 저장에 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // API 키 삭제
  const deleteApiKey = async (provider: string) => {
    if (!confirm(`정말로 ${providers.find(p => p.key === provider)?.name} API 키를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await databaseService.deleteUserApiKey(userId, provider);
      addNotification({ 
        title: 'API 키 삭제 성공', 
        message: 'API 키가 성공적으로 삭제되었습니다.', 
        type: 'success' 
      });
      loadApiKeys();
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      addNotification({ 
        title: 'API 키 삭제 실패', 
        message: 'API 키 삭제에 실패했습니다.', 
        type: 'error' 
      });
    }
  };

  // API 키 입력 변경
  const handleKeyChange = (provider: string, value: string) => {
    setNewKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  // API 키 상태 확인
  const getKeyStatus = (provider: string) => {
    const hasExistingKey = !!apiKeys[provider];
    const hasNewKey = !!newKeys[provider]?.trim();
    
    if (hasNewKey) return 'new';
    if (hasExistingKey) return 'existing';
    return 'none';
  };

  // API 키 마스킹
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadApiKeys();
    }
  }, [isOpen, userId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="API 키 관리">
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                보안 안내
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  API 키는 암호화되어 안전하게 저장됩니다. 
                  키를 입력할 때는 정확한 값을 입력해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">API 키를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => {
              const status = getKeyStatus(provider.key);
              const currentValue = newKeys[provider.key] || '';
              const existingKey = apiKeys[provider.key];

              return (
                <div key={provider.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <div className="flex items-center space-x-2">
                      {status === 'existing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          설정됨
                        </span>
                      )}
                      {status === 'new' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          새로 입력됨
                        </span>
                      )}
                      {existingKey && (
                        <Button
                          onClick={() => deleteApiKey(provider.key)}
                          size="sm"
                          variant="danger"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {existingKey && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">현재 키:</span> {maskApiKey(existingKey)}
                      </div>
                    )}
                    
                    <div>
                      <input
                        type="password"
                        value={currentValue}
                        onChange={(e) => handleKeyChange(provider.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={provider.placeholder}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            취소
          </Button>
          <Button
            onClick={saveApiKeys}
            disabled={saving || Object.keys(newKeys).length === 0}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
