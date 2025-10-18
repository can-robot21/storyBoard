import React, { useState, useEffect } from 'react';
import { userPermissionService } from '../../services/userPermissionService';
import { useUIStore } from '../../stores/uiStore';
import { 
  X, 
  Shield, 
  Users, 
  Key, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Clock
} from 'lucide-react';

interface PermissionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack?: () => void;
  currentUser?: any;
}

export const PermissionManagerModal: React.FC<PermissionManagerModalProps> = ({
  isOpen,
  onClose,
  onGoBack,
  currentUser
}) => {
  const { addNotification } = useUIStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [permissionStats, setPermissionStats] = useState<any>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showAccessRequests, setShowAccessRequests] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // 폼 상태
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    if (isOpen) {
      loadPermissionData();
    }
  }, [isOpen]);

  const loadPermissionData = () => {
    try {
      // 역할 목록 로드
      const rolesList = userPermissionService.getAllRoles();
      setRoles(rolesList);

      // 사용자 권한 로드
      const permissionsList = Array.from(userPermissionService['userPermissions'].values());
      setUserPermissions(permissionsList);

      // 접근 요청 로드
      const requestsList = userPermissionService.getAccessRequests();
      setAccessRequests(requestsList);

      // 권한 통계 로드
      const stats = userPermissionService.getPermissionStats();
      setPermissionStats(stats);
    } catch (error) {
      console.error('권한 데이터 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '데이터 로드 실패',
        message: '권한 데이터를 불러오는 중 오류가 발생했습니다.'
      });
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '역할 이름을 입력해주세요.'
      });
      return;
    }

    try {
      const roleId = await userPermissionService.createRole({
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions.map(permissionId => ({
          id: permissionId,
          name: permissionId,
          description: permissionId,
          resource: permissionId.split(':')[0],
          action: permissionId.split(':')[1]
        })),
        isDefault: false
      });

      addNotification({
        type: 'success',
        title: '역할 생성 완료',
        message: '새 역할이 생성되었습니다.'
      });

      // 폼 초기화
      setRoleForm({
        name: '',
        description: '',
        permissions: []
      });
      setShowRoleForm(false);
      loadPermissionData();
    } catch (error) {
      console.error('역할 생성 실패:', error);
      addNotification({
        type: 'error',
        title: '역할 생성 실패',
        message: '역할 생성 중 오류가 발생했습니다.'
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('이 역할을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const success = await userPermissionService.deleteRole(roleId);
      
      if (success) {
        addNotification({
          type: 'success',
          title: '역할 삭제 완료',
          message: '역할이 삭제되었습니다.'
        });
        loadPermissionData();
      } else {
        addNotification({
          type: 'error',
          title: '역할 삭제 실패',
          message: '역할 삭제 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('역할 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '역할 삭제 실패',
        message: '역할 삭제 중 오류가 발생했습니다.'
      });
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!currentUser) return;

    try {
      const success = await userPermissionService.assignRole(userId, roleId, currentUser.id);
      
      if (success) {
        addNotification({
          type: 'success',
          title: '역할 할당 완료',
          message: '역할이 할당되었습니다.'
        });
        loadPermissionData();
      } else {
        addNotification({
          type: 'error',
          title: '역할 할당 실패',
          message: '역할 할당 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('역할 할당 실패:', error);
      addNotification({
        type: 'error',
        title: '역할 할당 실패',
        message: '역할 할당 중 오류가 발생했습니다.'
      });
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return '👑';
      case 'premium': return '⭐';
      case 'user': return '👤';
      default: return '🔑';
    }
  };

  const getResultColor = (result: string) => {
    return result === 'allowed' ? 'text-green-600' : 'text-red-600';
  };

  const getResultIcon = (result: string) => {
    return result === 'allowed' ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">권한 관리</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 권한 통계 */}
          {permissionStats && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">권한 통계</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{permissionStats.totalUsers}</div>
                  <div className="text-sm text-blue-700">총 사용자</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
                  <div className="text-sm text-blue-700">총 역할</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{permissionStats.accessRequests.allowed}</div>
                  <div className="text-sm text-blue-700">허용된 요청</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{permissionStats.accessRequests.denied}</div>
                  <div className="text-sm text-blue-700">거부된 요청</div>
                </div>
              </div>
            </div>
          )}

          {/* 역할 관리 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">역할 관리</h3>
              <button
                onClick={() => setShowRoleForm(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1 inline-block" />
                역할 추가
              </button>
            </div>

            {/* 역할 생성 폼 */}
            {showRoleForm && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-4">새 역할 생성</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">역할 이름</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="역할 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <input
                      type="text"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="역할 설명을 입력하세요"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowRoleForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    생성
                  </button>
                </div>
              </div>
            )}

            {/* 역할 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRoleIcon(role.id)}</span>
                      <h4 className="font-medium text-gray-800">{role.name}</h4>
                    </div>
                    {!role.isDefault && (
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">권한 ({role.permissions.length}개):</p>
                    <div className="max-h-20 overflow-y-auto">
                      {role.permissions.slice(0, 3).map((permission: any) => (
                        <div key={permission.id} className="text-xs text-gray-600">
                          • {permission.name}
                        </div>
                      ))}
                      {role.permissions.length > 3 && (
                        <div className="text-xs text-gray-500">
                          ... 외 {role.permissions.length - 3}개
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 사용자 권한 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">사용자 권한</h3>
              <button
                onClick={() => setShowAccessRequests(!showAccessRequests)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-1 inline-block" />
                {showAccessRequests ? '접근 요청 숨기기' : '접근 요청 보기'}
              </button>
            </div>

            {userPermissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>할당된 사용자 권한이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userPermissions.map((permission) => {
                  const role = roles.find(r => r.id === permission.roleId);
                  return (
                    <div key={permission.userId} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getRoleIcon(permission.roleId)}</span>
                          <div>
                            <h4 className="font-medium text-gray-800">사용자 ID: {permission.userId}</h4>
                            <p className="text-sm text-gray-600">역할: {role?.name || '알 수 없음'}</p>
                            <p className="text-xs text-gray-500">
                              할당일: {formatTimestamp(permission.grantedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            permission.isActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {permission.isActive ? '활성' : '비활성'}
                          </span>
                          {permission.expiresAt && (
                            <span className="text-xs text-gray-500">
                              만료: {formatTimestamp(permission.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 접근 요청 로그 */}
          {showAccessRequests && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">접근 요청 로그</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {accessRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">접근 요청 로그가 없습니다.</p>
                ) : (
                  accessRequests.slice(-20).reverse().map((request, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white border rounded">
                      {getResultIcon(request.result)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {request.resource}:{request.action}
                          </span>
                          <span className={`text-sm font-medium ${getResultColor(request.result)}`}>
                            {request.result === 'allowed' ? '허용' : '거부'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          사용자: {request.userId} | {formatTimestamp(request.timestamp)}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-red-600 mt-1">{request.reason}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
