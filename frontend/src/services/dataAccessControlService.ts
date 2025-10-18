import { AuthService } from './authService';
import { databaseService } from './database/DatabaseService';

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  data?: any;
}

export interface UserDataAccess {
  userId: string;
  resourceType: 'project' | 'image' | 'template' | 'apiKey';
  resourceId: string;
  action: 'read' | 'write' | 'delete';
  timestamp: number;
  allowed: boolean;
}

export class DataAccessControlService {
  private static instance: DataAccessControlService;
  private accessLog: UserDataAccess[] = [];
  private readonly MAX_ACCESS_LOG_SIZE = 1000;

  static getInstance(): DataAccessControlService {
    if (!DataAccessControlService.instance) {
      DataAccessControlService.instance = new DataAccessControlService();
    }
    return DataAccessControlService.instance;
  }

  /**
   * 프로젝트 데이터 접근 권한 확인
   */
  async checkProjectAccess(
    projectId: string,
    action: 'read' | 'write' | 'delete',
    userId?: string
  ): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      // 프로젝트 소유권 확인
      const project = await databaseService.loadProject(projectId);
      if (!project) {
        return {
          allowed: false,
          reason: '프로젝트를 찾을 수 없습니다.'
        };
      }

      // 프로젝트 소유자 확인 (projectData에서 userId 추출)
      const projectOwnerId = this.extractUserIdFromProject(project.projectData);
      
      if (projectOwnerId !== targetUserId) {
        this.logAccess(targetUserId, 'project', projectId, action, false);
        return {
          allowed: false,
          reason: '이 프로젝트에 대한 접근 권한이 없습니다.'
        };
      }

      this.logAccess(targetUserId, 'project', projectId, action, true);
      return {
        allowed: true,
        data: project
      };
    } catch (error) {
      console.error('프로젝트 접근 권한 확인 실패:', error);
      return {
        allowed: false,
        reason: '접근 권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 이미지 데이터 접근 권한 확인
   */
  async checkImageAccess(
    imageId: string,
    action: 'read' | 'write' | 'delete',
    userId?: string
  ): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      // localStorage에서 이미지 데이터 확인
      const imageStorageData = localStorage.getItem('imageStorage');
      if (!imageStorageData) {
        return {
          allowed: false,
          reason: '이미지 데이터를 찾을 수 없습니다.'
        };
      }

      const imageStorage = JSON.parse(imageStorageData);
      const imageItem = this.findImageInStorage(imageStorage, imageId);

      if (!imageItem) {
        return {
          allowed: false,
          reason: '이미지를 찾을 수 없습니다.'
        };
      }

      // 이미지 소유권 확인
      if (!this.isImageOwnedByUser(imageItem, targetUserId)) {
        this.logAccess(targetUserId, 'image', imageId, action, false);
        return {
          allowed: false,
          reason: '이 이미지에 대한 접근 권한이 없습니다.'
        };
      }

      this.logAccess(targetUserId, 'image', imageId, action, true);
      return {
        allowed: true,
        data: imageItem
      };
    } catch (error) {
      console.error('이미지 접근 권한 확인 실패:', error);
      return {
        allowed: false,
        reason: '접근 권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 템플릿 데이터 접근 권한 확인
   */
  async checkTemplateAccess(
    templateId: string,
    action: 'read' | 'write' | 'delete',
    userId?: string
  ): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      // 템플릿 소유권 확인
      const template = await databaseService.loadPromptTemplate(templateId);
      if (!template) {
        return {
          allowed: false,
          reason: '템플릿을 찾을 수 없습니다.'
        };
      }

      // 템플릿 소유자 확인
      if (template.userId !== targetUserId) {
        this.logAccess(targetUserId, 'template', templateId, action, false);
        return {
          allowed: false,
          reason: '이 템플릿에 대한 접근 권한이 없습니다.'
        };
      }

      this.logAccess(targetUserId, 'template', templateId, action, true);
      return {
        allowed: true,
        data: template
      };
    } catch (error) {
      console.error('템플릿 접근 권한 확인 실패:', error);
      return {
        allowed: false,
        reason: '접근 권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * API 키 접근 권한 확인
   */
  async checkApiKeyAccess(
    provider: string,
    action: 'read' | 'write' | 'delete',
    userId?: string
  ): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      // API 키 소유권 확인
      const apiKey = await databaseService.getUserApiKey(targetUserId, provider);
      
      if (!apiKey && action !== 'write') {
        return {
          allowed: false,
          reason: 'API 키를 찾을 수 없습니다.'
        };
      }

      this.logAccess(targetUserId, 'apiKey', provider, action, true);
      return {
        allowed: true,
        data: { provider, apiKey }
      };
    } catch (error) {
      console.error('API 키 접근 권한 확인 실패:', error);
      return {
        allowed: false,
        reason: '접근 권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자별 데이터 목록 조회 (권한 확인 포함)
   */
  async getUserProjects(userId?: string): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      const projects = await databaseService.listProjects(targetUserId);
      
      this.logAccess(targetUserId, 'project', 'list', 'read', true);
      return {
        allowed: true,
        data: projects
      };
    } catch (error) {
      console.error('사용자 프로젝트 조회 실패:', error);
      return {
        allowed: false,
        reason: '프로젝트 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 사용자별 이미지 목록 조회 (권한 확인 포함)
   */
  async getUserImages(userId?: string): Promise<AccessControlResult> {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) {
        return {
          allowed: false,
          reason: '사용자가 로그인되지 않았습니다.'
        };
      }

      // localStorage에서 사용자별 이미지 조회
      const imageStorageData = localStorage.getItem('imageStorage');
      if (!imageStorageData) {
        return {
          allowed: true,
          data: []
        };
      }

      const imageStorage = JSON.parse(imageStorageData);
      const userImages = this.getUserImagesFromStorage(imageStorage, targetUserId);
      
      this.logAccess(targetUserId, 'image', 'list', 'read', true);
      return {
        allowed: true,
        data: userImages
      };
    } catch (error) {
      console.error('사용자 이미지 조회 실패:', error);
      return {
        allowed: false,
        reason: '이미지 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 접근 로그 기록
   */
  private logAccess(
    userId: string,
    resourceType: 'project' | 'image' | 'template' | 'apiKey',
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    allowed: boolean
  ): void {
    const accessLog: UserDataAccess = {
      userId,
      resourceType,
      resourceId,
      action,
      timestamp: Date.now(),
      allowed
    };

    this.accessLog.push(accessLog);

    // 로그 크기 제한
    if (this.accessLog.length > this.MAX_ACCESS_LOG_SIZE) {
      this.accessLog = this.accessLog.slice(-this.MAX_ACCESS_LOG_SIZE);
    }

    // localStorage에 저장
    try {
      localStorage.setItem('dataAccessLog', JSON.stringify(this.accessLog));
    } catch (error) {
      console.error('접근 로그 저장 실패:', error);
    }

    if (!allowed) {
      console.warn('🚫 접근 거부:', {
        userId,
        resourceType,
        resourceId,
        action
      });
    }
  }

  /**
   * 프로젝트 데이터에서 사용자 ID 추출
   */
  private extractUserIdFromProject(projectData: any): string | null {
    try {
      // 프로젝트 데이터 구조에 따라 사용자 ID 추출
      if (projectData.userId) return projectData.userId;
      if (projectData.user_id) return projectData.user_id;
      if (projectData.ownerId) return projectData.ownerId;
      
      // 기본값으로 현재 사용자 ID 반환
      const currentUser = AuthService.getCurrentUser();
      return currentUser?.id || null;
    } catch (error) {
      console.error('프로젝트 사용자 ID 추출 실패:', error);
      return null;
    }
  }

  /**
   * 이미지 스토리지에서 이미지 찾기
   */
  private findImageInStorage(imageStorage: any, imageId: string): any | null {
    try {
      const projectStorages = imageStorage.projectStorages || {};
      
      for (const [projectId, projectStorage] of Object.entries(projectStorages)) {
        const storage = projectStorage as any;
        if (storage.images) {
          const image = storage.images.find((img: any) => img.id === imageId);
          if (image) return image;
        }
      }
      
      return null;
    } catch (error) {
      console.error('이미지 검색 실패:', error);
      return null;
    }
  }

  /**
   * 이미지 소유권 확인
   */
  private isImageOwnedByUser(imageItem: any, userId: string): boolean {
    try {
      // 이미지 아이템에서 프로젝트 ID 추출
      const projectId = imageItem.projectId;
      if (!projectId) return false;

      // 프로젝트 ID에서 사용자 ID 추출 (형식: userId_projectId)
      const parts = projectId.split('_');
      if (parts.length >= 2) {
        return parts[0] === userId;
      }

      return false;
    } catch (error) {
      console.error('이미지 소유권 확인 실패:', error);
      return false;
    }
  }

  /**
   * 사용자별 이미지 목록 조회
   */
  private getUserImagesFromStorage(imageStorage: any, userId: string): any[] {
    try {
      const projectStorages = imageStorage.projectStorages || {};
      const userImages: any[] = [];

      for (const [projectId, projectStorage] of Object.entries(projectStorages)) {
        const storage = projectStorage as any;
        
        // 사용자 소유 프로젝트인지 확인
        if (projectId.startsWith(`${userId}_`) && storage.images) {
          userImages.push(...storage.images);
        }
      }

      return userImages;
    } catch (error) {
      console.error('사용자 이미지 조회 실패:', error);
      return [];
    }
  }

  /**
   * 접근 로그 조회
   */
  getAccessLog(userId?: string): UserDataAccess[] {
    try {
      const currentUser = AuthService.getCurrentUser();
      const targetUserId = userId || currentUser?.id;

      if (!targetUserId) return [];

      // localStorage에서 로그 로드
      const logData = localStorage.getItem('dataAccessLog');
      if (!logData) return [];

      const allLogs: UserDataAccess[] = JSON.parse(logData);
      
      // 사용자별 로그 필터링
      return allLogs.filter(log => log.userId === targetUserId);
    } catch (error) {
      console.error('접근 로그 조회 실패:', error);
      return [];
    }
  }

  /**
   * 접근 로그 초기화
   */
  clearAccessLog(userId?: string): void {
    try {
      if (userId) {
        // 특정 사용자 로그만 삭제
        const currentLogs = this.getAccessLog();
        const filteredLogs = currentLogs.filter(log => log.userId !== userId);
        localStorage.setItem('dataAccessLog', JSON.stringify(filteredLogs));
      } else {
        // 전체 로그 삭제
        localStorage.removeItem('dataAccessLog');
      }
      
      this.accessLog = [];
    } catch (error) {
      console.error('접근 로그 초기화 실패:', error);
    }
  }

  /**
   * 보안 검사 실행
   */
  async runSecurityCheck(): Promise<{
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        issues.push('사용자가 로그인되지 않았습니다.');
        recommendations.push('로그인 후 사용하세요.');
        return { passed: false, issues, recommendations };
      }

      // 1. API 키 보안 검사
      const apiKeys = await databaseService.getUserApiKeys(currentUser.id);
      const hasApiKeys = Object.values(apiKeys).some(key => key && key.trim() !== '');
      
      if (!hasApiKeys) {
        issues.push('API 키가 설정되지 않았습니다.');
        recommendations.push('AI 서비스 설정에서 API 키를 등록하세요.');
      }

      // 2. 데이터 접근 로그 검사
      const accessLogs = this.getAccessLog(currentUser.id);
      const recentFailedAccess = accessLogs.filter(
        log => !log.allowed && (Date.now() - log.timestamp) < 24 * 60 * 60 * 1000
      );

      if (recentFailedAccess.length > 10) {
        issues.push('최근 24시간 동안 10회 이상의 접근 거부가 발생했습니다.');
        recommendations.push('계정 보안을 확인하고 필요시 비밀번호를 변경하세요.');
      }

      // 3. 프로젝트 데이터 무결성 검사
      const projects = await databaseService.listProjects(currentUser.id);
      const orphanedProjects = projects.filter(project => {
        const ownerId = this.extractUserIdFromProject(project.projectData);
        return ownerId !== currentUser.id;
      });

      if (orphanedProjects.length > 0) {
        issues.push(`${orphanedProjects.length}개의 소유권이 불분명한 프로젝트가 있습니다.`);
        recommendations.push('프로젝트 데이터를 정리하고 필요시 마이그레이션을 실행하세요.');
      }

      return {
        passed: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('보안 검사 실패:', error);
      return {
        passed: false,
        issues: ['보안 검사 중 오류가 발생했습니다.'],
        recommendations: ['시스템 관리자에게 문의하세요.']
      };
    }
  }
}

export const dataAccessControlService = DataAccessControlService.getInstance();
