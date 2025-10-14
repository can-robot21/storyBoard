import React, { useState } from 'react';
import { X, Shield, HardDrive, Key, Clock, RefreshCw, FileText, Settings, ArrowLeft } from 'lucide-react';
import Button from './Button';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
  // 각 기능별 핸들러들
  onSecurityCheck: () => void;
  onBackupManager: () => void;
  onEnhancedApiKeyManager: () => void;
  onSessionManager: () => void;
  onPermissionManager: () => void;
  onActivityLogManager: () => void;
}

type TabType = 'security' | 'data' | 'api';

export const ManagementModal: React.FC<ManagementModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser,
  onSecurityCheck,
  onBackupManager,
  onEnhancedApiKeyManager,
  onSessionManager,
  onPermissionManager,
  onActivityLogManager
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('security');

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'security' as TabType,
      label: '보안',
      icon: Shield,
      description: '보안 검사 및 권한 관리'
    },
    {
      id: 'data' as TabType,
      label: '데이터',
      icon: HardDrive,
      description: '백업, 동기화 및 활동 로그'
    },
    {
      id: 'api' as TabType,
      label: 'API',
      icon: Key,
      description: 'API 키 및 세션 관리'
    }
  ];

  const securityFeatures = [
    {
      id: 'security-check',
      title: '보안 검사',
      description: '시스템 보안 상태 점검 및 권장사항 확인',
      icon: Shield,
      action: onSecurityCheck,
      color: 'bg-red-50 hover:bg-red-100 border-red-200'
    },
    {
      id: 'permission-manager',
      title: '권한 관리',
      description: '사용자 권한 및 역할 관리',
      icon: Settings,
      action: onPermissionManager,
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    }
  ];

  const dataFeatures = [
    {
      id: 'backup-manager',
      title: '백업 관리',
      description: '프로젝트 데이터 백업 및 복원',
      icon: HardDrive,
      action: onBackupManager,
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      id: 'activity-log',
      title: '활동 로그',
      description: '사용자 활동 기록 및 감사 추적',
      icon: FileText,
      action: onActivityLogManager,
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
    }
  ];

  const apiFeatures = [
    {
      id: 'api-key-manager',
      title: 'API 키 관리',
      description: '암호화된 API 키 저장 및 관리',
      icon: Key,
      action: onEnhancedApiKeyManager,
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
    },
    {
      id: 'session-manager',
      title: '세션 관리',
      description: '사용자 세션 추적 및 자동 로그아웃',
      icon: Clock,
      action: onSessionManager,
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
    }
  ];

  const getCurrentFeatures = () => {
    switch (activeTab) {
      case 'security':
        return securityFeatures;
      case 'data':
        return dataFeatures;
      case 'api':
        return apiFeatures;
      default:
        return [];
    }
  };

  const handleFeatureClick = (action: () => void) => {
    onClose(); // 모달 닫기
    action(); // 해당 기능 실행
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="이전 단계로 돌아가기"
              >
                <ArrowLeft className="w-6 h-6 text-gray-500" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">관리 도구</h2>
              <p className="text-gray-600 mt-1">
                시스템 관리 및 보안 기능에 접근하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="모달 닫기"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="text-left">
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getCurrentFeatures().map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${feature.color}`}
                  onClick={() => handleFeatureClick(feature.action)}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {currentUser ? `현재 사용자: ${currentUser.username || currentUser.email}` : '게스트 모드'}
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              닫기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
