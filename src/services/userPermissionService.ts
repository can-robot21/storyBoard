import { AuthService } from './authService';
import { dataAccessControlService } from './dataAccessControlService';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: string[];
}

export interface UserPermission {
  userId: string;
  roleId: string;
  permissions: Permission[];
  grantedAt: number;
  grantedBy: string;
  expiresAt?: number;
  isActive: boolean;
}

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  requiredRole?: string;
  requiredPermission?: string;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  result: 'allowed' | 'denied';
  reason?: string;
}

export class UserPermissionService {
  private static instance: UserPermissionService;
  private roles: Map<string, UserRole> = new Map();
  private userPermissions: Map<string, UserPermission> = new Map();
  private accessRequests: AccessRequest[] = [];
  private readonly MAX_ACCESS_REQUESTS = 1000;

  // 기본 역할 정의
  private readonly DEFAULT_ROLES: UserRole[] = [
    {
      id: 'admin',
      name: '관리자',
      description: '모든 권한을 가진 관리자 역할',
      permissions: [
        { id: 'admin.all', name: '모든 권한', description: '시스템의 모든 기능에 접근 가능', resource: '*', action: '*' },
        { id: 'user.manage', name: '사용자 관리', description: '사용자 계정 관리', resource: 'user', action: '*' },
        { id: 'project.manage', name: '프로젝트 관리', description: '모든 프로젝트 관리', resource: 'project', action: '*' },
        { id: 'system.manage', name: '시스템 관리', description: '시스템 설정 관리', resource: 'system', action: '*' }
      ],
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'user',
      name: '일반 사용자',
      description: '기본 사용자 역할',
      permissions: [
        { id: 'project.create', name: '프로젝트 생성', description: '새 프로젝트 생성', resource: 'project', action: 'create' },
        { id: 'project.read.own', name: '자신의 프로젝트 조회', description: '자신이 생성한 프로젝트 조회', resource: 'project', action: 'read' },
        { id: 'project.update.own', name: '자신의 프로젝트 수정', description: '자신이 생성한 프로젝트 수정', resource: 'project', action: 'update' },
        { id: 'project.delete.own', name: '자신의 프로젝트 삭제', description: '자신이 생성한 프로젝트 삭제', resource: 'project', action: 'delete' },
        { id: 'image.create', name: '이미지 생성', description: 'AI 이미지 생성', resource: 'image', action: 'create' },
        { id: 'image.read.own', name: '자신의 이미지 조회', description: '자신이 생성한 이미지 조회', resource: 'image', action: 'read' },
        { id: 'image.delete.own', name: '자신의 이미지 삭제', description: '자신이 생성한 이미지 삭제', resource: 'image', action: 'delete' },
        { id: 'template.create', name: '템플릿 생성', description: '프롬프트 템플릿 생성', resource: 'template', action: 'create' },
        { id: 'template.read.own', name: '자신의 템플릿 조회', description: '자신이 생성한 템플릿 조회', resource: 'template', action: 'read' },
        { id: 'template.update.own', name: '자신의 템플릿 수정', description: '자신이 생성한 템플릿 수정', resource: 'template', action: 'update' },
        { id: 'template.delete.own', name: '자신의 템플릿 삭제', description: '자신이 생성한 템플릿 삭제', resource: 'template', action: 'delete' }
      ],
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'premium',
      name: '프리미엄 사용자',
      description: '추가 기능을 사용할 수 있는 프리미엄 사용자',
      permissions: [
        { id: 'project.create', name: '프로젝트 생성', description: '새 프로젝트 생성', resource: 'project', action: 'create' },
        { id: 'project.read.own', name: '자신의 프로젝트 조회', description: '자신이 생성한 프로젝트 조회', resource: 'project', action: 'read' },
        { id: 'project.update.own', name: '자신의 프로젝트 수정', description: '자신이 생성한 프로젝트 수정', resource: 'project', action: 'update' },
        { id: 'project.delete.own', name: '자신의 프로젝트 삭제', description: '자신이 생성한 프로젝트 삭제', resource: 'project', action: 'delete' },
        { id: 'image.create', name: '이미지 생성', description: 'AI 이미지 생성', resource: 'image', action: 'create' },
        { id: 'image.read.own', name: '자신의 이미지 조회', description: '자신이 생성한 이미지 조회', resource: 'image', action: 'read' },
        { id: 'image.delete.own', name: '자신의 이미지 삭제', description: '자신이 생성한 이미지 삭제', resource: 'image', action: 'delete' },
        { id: 'template.create', name: '템플릿 생성', description: '프롬프트 템플릿 생성', resource: 'template', action: 'create' },
        { id: 'template.read.own', name: '자신의 템플릿 조회', description: '자신이 생성한 템플릿 조회', resource: 'template', action: 'read' },
        { id: 'template.update.own', name: '자신의 템플릿 수정', description: '자신이 생성한 템플릿 수정', resource: 'template', action: 'update' },
        { id: 'template.delete.own', name: '자신의 템플릿 삭제', description: '자신이 생성한 템플릿 삭제', resource: 'template', action: 'delete' },
        { id: 'video.create', name: '영상 생성', description: 'AI 영상 생성', resource: 'video', action: 'create' },
        { id: 'video.read.own', name: '자신의 영상 조회', description: '자신이 생성한 영상 조회', resource: 'video', action: 'read' },
        { id: 'export.advanced', name: '고급 내보내기', description: '고급 형식으로 데이터 내보내기', resource: 'export', action: 'advanced' }
      ],
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  static getInstance(): UserPermissionService {
    if (!UserPermissionService.instance) {
      UserPermissionService.instance = new UserPermissionService();
    }
    return UserPermissionService.instance;
  }

  constructor() {
    this.initializeDefaultRoles();
    this.loadUserPermissions();
    this.loadAccessRequests();
  }

  /**
   * 기본 역할 초기화
   */
  private initializeDefaultRoles(): void {
    this.DEFAULT_ROLES.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * 권한 확인
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<PermissionCheck> {
    try {
      // 사용자 권한 조회
      const userPermission = this.userPermissions.get(userId);
      if (!userPermission || !userPermission.isActive) {
        return {
          allowed: false,
          reason: '사용자 권한이 없습니다.',
          requiredPermission: `${resource}:${action}`
        };
      }

      // 권한 만료 확인
      if (userPermission.expiresAt && userPermission.expiresAt < Date.now()) {
        return {
          allowed: false,
          reason: '권한이 만료되었습니다.',
          requiredPermission: `${resource}:${action}`
        };
      }

      // 권한 확인
      const hasPermission = userPermission.permissions.some(permission => {
        // 와일드카드 권한 확인
        if (permission.resource === '*' && permission.action === '*') {
          return true;
        }

        // 리소스 권한 확인
        if (permission.resource === resource || permission.resource === '*') {
          // 액션 권한 확인
          if (permission.action === action || permission.action === '*') {
            return true;
          }
        }

        return false;
      });

      // 접근 요청 기록
      this.recordAccessRequest(userId, resource, action, hasPermission ? 'allowed' : 'denied');

      if (hasPermission) {
        return { allowed: true };
      } else {
        return {
          allowed: false,
          reason: '해당 리소스에 대한 권한이 없습니다.',
          requiredPermission: `${resource}:${action}`
        };
      }
    } catch (error) {
      console.error('권한 확인 실패:', error);
      return {
        allowed: false,
        reason: '권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자 역할 할당
   */
  async assignRole(
    userId: string,
    roleId: string,
    grantedBy: string,
    expiresAt?: number
  ): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('존재하지 않는 역할입니다.');
      }

      const userPermission: UserPermission = {
        userId,
        roleId,
        permissions: role.permissions,
        grantedAt: Date.now(),
        grantedBy,
        expiresAt,
        isActive: true
      };

      this.userPermissions.set(userId, userPermission);
      this.saveUserPermissions();

      console.log(`👤 역할 할당: ${userId} → ${roleId}`);
      return true;
    } catch (error) {
      console.error('역할 할당 실패:', error);
      return false;
    }
  }

  /**
   * 사용자 역할 제거
   */
  async revokeRole(userId: string): Promise<boolean> {
    try {
      this.userPermissions.delete(userId);
      this.saveUserPermissions();

      console.log(`🗑️ 역할 제거: ${userId}`);
      return true;
    } catch (error) {
      console.error('역할 제거 실패:', error);
      return false;
    }
  }

  /**
   * 사용자 권한 조회
   */
  getUserPermission(userId: string): UserPermission | null {
    return this.userPermissions.get(userId) || null;
  }

  /**
   * 사용자 역할 조회
   */
  getUserRole(userId: string): UserRole | null {
    const userPermission = this.userPermissions.get(userId);
    if (!userPermission) return null;

    return this.roles.get(userPermission.roleId) || null;
  }

  /**
   * 모든 역할 조회
   */
  getAllRoles(): UserRole[] {
    return Array.from(this.roles.values());
  }

  /**
   * 역할 생성
   */
  async createRole(role: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const roleId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newRole: UserRole = {
        ...role,
        id: roleId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.roles.set(roleId, newRole);
      this.saveRoles();

      console.log(`➕ 역할 생성: ${roleId} (${role.name})`);
      return roleId;
    } catch (error) {
      console.error('역할 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 역할 수정
   */
  async updateRole(roleId: string, updates: Partial<UserRole>): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('존재하지 않는 역할입니다.');
      }

      const updatedRole: UserRole = {
        ...role,
        ...updates,
        updatedAt: Date.now()
      };

      this.roles.set(roleId, updatedRole);
      this.saveRoles();

      console.log(`✏️ 역할 수정: ${roleId}`);
      return true;
    } catch (error) {
      console.error('역할 수정 실패:', error);
      return false;
    }
  }

  /**
   * 역할 삭제
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error('존재하지 않는 역할입니다.');
      }

      if (role.isDefault) {
        throw new Error('기본 역할은 삭제할 수 없습니다.');
      }

      // 해당 역할을 사용하는 사용자 확인
      const usersWithRole = Array.from(this.userPermissions.entries())
        .filter(([_, permission]) => permission.roleId === roleId);

      if (usersWithRole.length > 0) {
        throw new Error('해당 역할을 사용하는 사용자가 있습니다.');
      }

      this.roles.delete(roleId);
      this.saveRoles();

      console.log(`🗑️ 역할 삭제: ${roleId}`);
      return true;
    } catch (error) {
      console.error('역할 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 접근 요청 기록
   */
  private recordAccessRequest(
    userId: string,
    resource: string,
    action: string,
    result: 'allowed' | 'denied',
    reason?: string
  ): void {
    const request: AccessRequest = {
      userId,
      resource,
      action,
      timestamp: Date.now(),
      ipAddress: 'localhost', // 실제로는 클라이언트 IP
      userAgent: navigator.userAgent,
      result,
      reason
    };

    this.accessRequests.push(request);

    // 요청 목록 크기 제한
    if (this.accessRequests.length > this.MAX_ACCESS_REQUESTS) {
      this.accessRequests = this.accessRequests.slice(-this.MAX_ACCESS_REQUESTS);
    }

    this.saveAccessRequests();
  }

  /**
   * 접근 요청 조회
   */
  getAccessRequests(userId?: string): AccessRequest[] {
    if (userId) {
      return this.accessRequests.filter(request => request.userId === userId);
    }
    return [...this.accessRequests];
  }

  /**
   * 권한 통계 조회
   */
  getPermissionStats(): {
    totalUsers: number;
    usersByRole: { [roleId: string]: number };
    accessRequests: {
      total: number;
      allowed: number;
      denied: number;
      deniedByResource: { [resource: string]: number };
    };
  } {
    const usersByRole: { [roleId: string]: number } = {};
    let totalUsers = 0;
    let allowedRequests = 0;
    let deniedRequests = 0;
    const deniedByResource: { [resource: string]: number } = {};

    // 사용자별 역할 통계
    this.userPermissions.forEach(permission => {
      if (permission.isActive) {
        totalUsers++;
        usersByRole[permission.roleId] = (usersByRole[permission.roleId] || 0) + 1;
      }
    });

    // 접근 요청 통계
    this.accessRequests.forEach(request => {
      if (request.result === 'allowed') {
        allowedRequests++;
      } else {
        deniedRequests++;
        deniedByResource[request.resource] = (deniedByResource[request.resource] || 0) + 1;
      }
    });

    return {
      totalUsers,
      usersByRole,
      accessRequests: {
        total: this.accessRequests.length,
        allowed: allowedRequests,
        denied: deniedRequests,
        deniedByResource
      }
    };
  }

  /**
   * 사용자 권한 저장
   */
  private saveUserPermissions(): void {
    try {
      const permissionsData = Array.from(this.userPermissions.entries()).map(([userId, permission]) => ({
        userId,
        roleId: permission.roleId,
        permissions: permission.permissions,
        grantedAt: permission.grantedAt,
        grantedBy: permission.grantedBy,
        expiresAt: permission.expiresAt,
        isActive: permission.isActive
      }));
      localStorage.setItem('user_permissions', JSON.stringify(permissionsData));
    } catch (error) {
      console.error('사용자 권한 저장 실패:', error);
    }
  }

  /**
   * 사용자 권한 로드
   */
  private loadUserPermissions(): void {
    try {
      const permissionsData = localStorage.getItem('user_permissions');
      if (permissionsData) {
        const permissions = JSON.parse(permissionsData);
        this.userPermissions.clear();
        permissions.forEach((item: any) => {
          const { userId, ...permission } = item;
          this.userPermissions.set(userId, permission);
        });
      }
    } catch (error) {
      console.error('사용자 권한 로드 실패:', error);
    }
  }

  /**
   * 역할 저장
   */
  private saveRoles(): void {
    try {
      const rolesData = Array.from(this.roles.values());
      localStorage.setItem('user_roles', JSON.stringify(rolesData));
    } catch (error) {
      console.error('역할 저장 실패:', error);
    }
  }

  /**
   * 역할 로드
   */
  private loadRoles(): void {
    try {
      const rolesData = localStorage.getItem('user_roles');
      if (rolesData) {
        const roles = JSON.parse(rolesData);
        this.roles.clear();
        roles.forEach((role: UserRole) => {
          this.roles.set(role.id, role);
        });
      }
    } catch (error) {
      console.error('역할 로드 실패:', error);
    }
  }

  /**
   * 접근 요청 저장
   */
  private saveAccessRequests(): void {
    try {
      localStorage.setItem('access_requests', JSON.stringify(this.accessRequests));
    } catch (error) {
      console.error('접근 요청 저장 실패:', error);
    }
  }

  /**
   * 접근 요청 로드
   */
  private loadAccessRequests(): void {
    try {
      const requestsData = localStorage.getItem('access_requests');
      if (requestsData) {
        this.accessRequests = JSON.parse(requestsData);
      }
    } catch (error) {
      console.error('접근 요청 로드 실패:', error);
    }
  }

  /**
   * 권한 정리
   */
  cleanupPermissions(): void {
    try {
      // 만료된 권한 제거
      const now = Date.now();
      let cleanedCount = 0;

      this.userPermissions.forEach((permission, userId) => {
        if (permission.expiresAt && permission.expiresAt < now) {
          this.userPermissions.delete(userId);
          cleanedCount++;
        }
      });

      // 오래된 접근 요청 정리 (30일 이상)
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      this.accessRequests = this.accessRequests.filter(request => request.timestamp > thirtyDaysAgo);

      this.saveUserPermissions();
      this.saveAccessRequests();

      console.log(`🧹 권한 정리 완료: ${cleanedCount}개 만료된 권한 제거`);
    } catch (error) {
      console.error('권한 정리 실패:', error);
    }
  }
}

export const userPermissionService = UserPermissionService.getInstance();
