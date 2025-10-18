import React, { useState, useEffect, useCallback } from 'react';
import { enhancedApiKeyService } from '../../services/enhancedApiKeyService';
import { useUIStore } from '../../stores/uiStore';
import { 
  X, 
  Key, 
  Trash2, 
  RefreshCw, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Save,
  XCircle,
  ArrowLeft
} from 'lucide-react';

interface EnhancedApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
}

export const EnhancedApiKeyManagerModal: React.FC<EnhancedApiKeyManagerModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  const [apiKeyList, setApiKeyList] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [securityCheck, setSecurityCheck] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    provider: '',
    apiKey: '',
    password: '',
    confirmPassword: '',
    expiresAt: '',
    isActive: true
  });

  const loadApiKeyData = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      // 배치 처리로 API 호출 최적화
      const [listResult, statsResult, securityResult] = await Promise.all([
        enhancedApiKeyService.getApiKeyList(currentUser.id),
        enhancedApiKeyService.getApiKeyUsageStats(currentUser.id),
        enhancedApiKeyService.performSecurityCheck(currentUser.id)
      ]);

      // 결과 처리
      if (listResult.success) {
        setApiKeyList(listResult.data || []);
      }

      if (statsResult.success) {
        setUsageStats(statsResult.data || []);
      }

      if (securityResult.success) {
        setSecurityCheck(securityResult.data);
      }

    } catch (error) {
      console.error('API 키 데이터 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '데이터 로드 실패',
        message: 'API 키 데이터를 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addNotification]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadApiKeyData();
    }
  }, [isOpen, currentUser, loadApiKeyData]);

  const handleAddApiKey = async () => {
    if (!currentUser) return;

    // 유효성 검사
    if (!formData.provider || !formData.apiKey || !formData.password) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '모든 필드를 입력해주세요.'
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification({
        type: 'error',
        title: '비밀번호 오류',
        message: '비밀번호가 일치하지 않습니다.'
      });
      return;
    }

    // API 키 형식 검증
    const isValidFormat = enhancedApiKeyService.validateApiKeyFormat(formData.provider, formData.apiKey);
    if (!isValidFormat) {
      addNotification({
        type: 'error',
        title: 'API 키 형식 오류',
        message: '올바른 API 키 형식이 아닙니다.'
      });
      return;
    }

    try {
      const expiresAt = formData.expiresAt ? new Date(formData.expiresAt).getTime() : undefined;
      
      const result = await enhancedApiKeyService.saveApiKey(
        currentUser.id,
        formData.provider,
        formData.apiKey,
        formData.password,
        {
          expiresAt,
          isActive: formData.isActive
        }
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'API 키 저장 완료',
          message: result.message
        });
        
        // 폼 초기화
        setFormData({
          provider: '',
          apiKey: '',
          password: '',
          confirmPassword: '',
          expiresAt: '',
          isActive: true
        });
        setShowAddForm(false);
        loadApiKeyData();
      } else {
        addNotification({
          type: 'error',
          title: 'API 키 저장 실패',
          message: result.errors.join(', ')
        });
      }
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      addNotification({
        type: 'error',
        title: 'API 키 저장 실패',
        message: 'API 키 저장 중 오류가 발생했습니다.'
      });
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    if (!currentUser) return;

    if (!window.confirm(`${provider} API 키를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await enhancedApiKeyService.deleteApiKey(currentUser.id, provider);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'API 키 삭제 완료',
          message: result.message
        });
        loadApiKeyData();
      } else {
        addNotification({
          type: 'error',
          title: 'API 키 삭제 실패',
          message: result.errors.join(', ')
        });
      }
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: 'API 키 삭제 실패',
        message: 'API 키 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  const handleToggleApiKeyStatus = async (provider: string) => {
    if (!currentUser) return;

    try {
      const result = await enhancedApiKeyService.toggleApiKeyStatus(currentUser.id, provider);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: '상태 변경 완료',
          message: result.message
        });
        loadApiKeyData();
      } else {
        addNotification({
          type: 'error',
          title: '상태 변경 실패',
          message: result.errors.join(', ')
        });
      }
    } catch (error) {
      console.error('API 키 상태 변경 실패:', error);
      addNotification({
        type: 'error',
        title: '상태 변경 실패',
        message: 'API 키 상태 변경 중 오류가 발생했습니다.'
      });
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: string } = {
      'google': '🔍',
      'openai': '🤖',
      'anthropic': '🧠',
      'midjourney': '🎨',
      'nano-banana': '🍌'
    };
    return icons[provider] || '🔑';
  };

  const getStatusColor = (isActive: boolean, isExpired: boolean) => {
    if (isExpired) return 'text-red-600';
    if (isActive) return 'text-green-600';
    return 'text-gray-600';
  };

  const getStatusText = (isActive: boolean, isExpired: boolean) => {
    if (isExpired) return '만료됨';
    if (isActive) return '활성';
    return '비활성';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
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
              <h2 className="text-xl font-semibold text-gray-800">강화된 API 키 관리</h2>
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
          {/* 보안 검사 결과 */}
          {securityCheck && (
            <div className={`p-4 rounded-lg border ${
              securityCheck.issues.length === 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {securityCheck.issues.length === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium mb-2 ${
                    securityCheck.issues.length === 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    보안 검사 결과
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>총 API 키: {securityCheck.totalApiKeys}개</p>
                    <p>활성 API 키: {securityCheck.activeApiKeys}개</p>
                    <p>만료된 API 키: {securityCheck.expiredApiKeys}개</p>
                    {securityCheck.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700">발견된 이슈:</p>
                        <ul className="list-disc list-inside text-red-600">
                          {securityCheck.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API 키 추가 폼 */}
          {showAddForm && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">새 API 키 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">프로바이더</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택하세요</option>
                    {enhancedApiKeyService.getSupportedProviders().map(provider => (
                      <option key={provider} value={provider}>
                        {getProviderIcon(provider)} {provider}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API 키</label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="API 키를 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">암호화 비밀번호</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="API 키 암호화용 비밀번호"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">만료일 (선택사항)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">활성 상태로 저장</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2 inline-block" />
                  저장
                </button>
              </div>
            </div>
          )}

          {/* API 키 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">API 키 목록</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1 inline-block" />
                  추가
                </button>
                <button
                  onClick={loadApiKeyData}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 inline-block ${isLoading ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
              </div>
            </div>

            {apiKeyList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>저장된 API 키가 없습니다.</p>
                <p className="text-sm">위의 '추가' 버튼을 클릭하여 API 키를 추가하세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiKeyList.map((apiKey) => (
                  <div
                    key={apiKey.provider}
                    className="p-4 border rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getProviderIcon(apiKey.provider)}</span>
                        <h4 className="font-medium text-gray-800">{apiKey.provider}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getStatusColor(apiKey.isActive, apiKey.isExpired)}`}>
                          {getStatusText(apiKey.isActive, apiKey.isExpired)}
                        </span>
                        <button
                          onClick={() => handleToggleApiKeyStatus(apiKey.provider)}
                          className={`p-1 rounded ${
                            apiKey.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {apiKey.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>키 ID: {apiKey.keyId}</p>
                      <p>생성일: {formatTimestamp(apiKey.createdAt)}</p>
                      {apiKey.lastUsed > 0 && (
                        <p>마지막 사용: {formatTimestamp(apiKey.lastUsed)}</p>
                      )}
                      <p>사용 횟수: {apiKey.usageCount}회</p>
                      {apiKey.expiresAt && (
                        <p>만료일: {formatTimestamp(apiKey.expiresAt)}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.provider)}
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

          {/* 사용 통계 */}
          {usageStats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">사용 통계</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usageStats.map((stat) => (
                  <div key={stat.provider} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getProviderIcon(stat.provider)}</span>
                      <h4 className="font-medium text-gray-800">{stat.provider}</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>총 사용: {stat.totalUsage}회</p>
                      <p>일평균: {stat.averageUsagePerDay.toFixed(1)}회</p>
                      {stat.lastUsed > 0 && (
                        <p>마지막 사용: {formatTimestamp(stat.lastUsed)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
