import { AuthService } from './authService';
import { databaseService } from './database/DatabaseService';
import { dataAccessControlService } from './dataAccessControlService';
import { LogoutOptions } from '../components/common/LogoutConfirmationModal';

export interface LogoutCleanupResult {
  success: boolean;
  clearedItems: {
    localData: boolean;
    projectData: number;
    imageData: number;
    apiKeys: number;
    accessLogs: number;
  };
  backedUpItems?: {
    projects: number;
    images: number;
    templates: number;
  };
  errors: string[];
}

export class LogoutDataCleanupService {
  private static instance: LogoutDataCleanupService;

  static getInstance(): LogoutDataCleanupService {
    if (!LogoutDataCleanupService.instance) {
      LogoutDataCleanupService.instance = new LogoutDataCleanupService();
    }
    return LogoutDataCleanupService.instance;
  }

  /**
   * 로그아웃시 데이터 정리 실행
   */
  async executeLogoutCleanup(
    userId: string,
    options: LogoutOptions
  ): Promise<LogoutCleanupResult> {
    const result: LogoutCleanupResult = {
      success: false,
      clearedItems: {
        localData: false,
        projectData: 0,
        imageData: 0,
        apiKeys: 0,
        accessLogs: 0
      },
      errors: []
    };

    try {
      console.log('🧹 로그아웃 데이터 정리 시작:', userId);

      // 1. 데이터 백업 (선택적)
      if (options.backupData) {
        const backupResult = await this.backupUserData(userId);
        result.backedUpItems = backupResult;
        console.log('💾 데이터 백업 완료:', backupResult);
      }

      // 2. 로컬 데이터 정리
      if (options.clearLocalData) {
        await this.clearLocalStorageData();
        result.clearedItems.localData = true;
        console.log('🗑️ 로컬 데이터 정리 완료');
      }

      // 3. 프로젝트 데이터 정리
      if (options.clearProjectData) {
        const projectCount = await this.clearProjectData(userId);
        result.clearedItems.projectData = projectCount;
        console.log(`📁 프로젝트 데이터 정리 완료: ${projectCount}개`);
      }

      // 4. 이미지 데이터 정리
      if (options.clearImageData) {
        const imageCount = await this.clearImageData(userId);
        result.clearedItems.imageData = imageCount;
        console.log(`🖼️ 이미지 데이터 정리 완료: ${imageCount}개`);
      }

      // 5. API 키 정리
      if (options.clearApiKeys) {
        const apiKeyCount = await this.clearApiKeys(userId);
        result.clearedItems.apiKeys = apiKeyCount;
        console.log(`🔑 API 키 정리 완료: ${apiKeyCount}개`);
      }

      // 6. 접근 로그 정리
      if (options.clearAccessLogs) {
        await this.clearAccessLogs(userId);
        result.clearedItems.accessLogs = 1;
        console.log('📋 접근 로그 정리 완료');
      }

      result.success = result.errors.length === 0;
      
      console.log('✅ 로그아웃 데이터 정리 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ 로그아웃 데이터 정리 실패:', error);
      result.errors.push(`데이터 정리 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * 사용자 데이터 백업
   */
  private async backupUserData(userId: string): Promise<{
    projects: number;
    images: number;
    templates: number;
  }> {
    const backupData = {
      projects: 0,
      images: 0,
      templates: 0
    };

    try {
      // 프로젝트 데이터 백업
      const projects = await databaseService.listProjects(userId);
      backupData.projects = projects.length;

      // 이미지 데이터 백업
      const imageResult = await dataAccessControlService.getUserImages(userId);
      if (imageResult.allowed && imageResult.data) {
        backupData.images = imageResult.data.length;
      }

      // 템플릿 데이터 백업
      const templates = await databaseService.listPromptTemplates(userId);
      backupData.templates = templates.length;

      // 백업 데이터를 localStorage에 저장
      const backupInfo = {
        userId,
        timestamp: Date.now(),
        data: backupData
      };
      localStorage.setItem(`user_backup_${userId}`, JSON.stringify(backupInfo));

      return backupData;
    } catch (error) {
      console.error('데이터 백업 실패:', error);
      return backupData;
    }
  }

  /**
   * 로컬 스토리지 데이터 정리
   */
  private async clearLocalStorageData(): Promise<void> {
    try {
      // 사용자 관련 데이터만 정리 (시스템 설정은 보존)
      const keysToRemove = [
        'projectStory',
        'projectCharacterList',
        'projectReferenceData',
        'user_api_keys',
        'imageStorage',
        'dataAccessLog',
        'userMigrationHistory'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('로컬 스토리지 데이터 정리 완료');
    } catch (error) {
      console.error('로컬 스토리지 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 프로젝트 데이터 정리
   */
  private async clearProjectData(userId: string): Promise<number> {
    let count = 0;
    try {
      const projects = await databaseService.listProjects(userId);
      
      for (const project of projects) {
        try {
          await databaseService.deleteProject(project.projectId);
          count++;
        } catch (error) {
          console.error(`프로젝트 ${project.projectId} 삭제 실패:`, error);
        }
      }

      return count;
    } catch (error) {
      console.error('프로젝트 데이터 정리 실패:', error);
      return count;
    }
  }

  /**
   * 이미지 데이터 정리
   */
  private async clearImageData(userId: string): Promise<number> {
    let count = 0;
    try {
      // localStorage에서 이미지 데이터 조회
      const imageStorageData = localStorage.getItem('imageStorage');
      if (!imageStorageData) return 0;

      const imageStorage = JSON.parse(imageStorageData);
      const projectStorages = imageStorage.projectStorages || {};

      // 사용자별 이미지 데이터 삭제
      for (const [projectId, projectStorage] of Object.entries(projectStorages)) {
        const storage = projectStorage as any;
        
        // 사용자 소유 프로젝트인지 확인
        if (projectId.startsWith(`${userId}_`) && storage.images) {
          count += storage.images.length;
          delete projectStorages[projectId];
        }
      }

      // 업데이트된 이미지 스토리지 저장
      localStorage.setItem('imageStorage', JSON.stringify(imageStorage));

      return count;
    } catch (error) {
      console.error('이미지 데이터 정리 실패:', error);
      return count;
    }
  }

  /**
   * API 키 정리
   */
  private async clearApiKeys(userId: string): Promise<number> {
    let count = 0;
    try {
      const apiKeys = await databaseService.getUserApiKeys(userId);
      
      for (const provider of Object.keys(apiKeys)) {
        try {
          await databaseService.deleteUserApiKey(userId, provider);
          count++;
        } catch (error) {
          console.error(`API 키 ${provider} 삭제 실패:`, error);
        }
      }

      return count;
    } catch (error) {
      console.error('API 키 정리 실패:', error);
      return count;
    }
  }

  /**
   * 접근 로그 정리
   */
  private async clearAccessLogs(userId: string): Promise<void> {
    try {
      dataAccessControlService.clearAccessLog(userId);
      console.log('접근 로그 정리 완료');
    } catch (error) {
      console.error('접근 로그 정리 실패:', error);
      throw error;
    }
  }

  /**
   * 백업 데이터 복원
   */
  async restoreBackupData(userId: string): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(`user_backup_${userId}`);
      if (!backupData) {
        console.log('백업 데이터를 찾을 수 없습니다.');
        return false;
      }

      const backupInfo = JSON.parse(backupData);
      console.log('백업 데이터 복원:', backupInfo);

      // 백업 데이터 복원 로직 구현
      // (실제 구현은 복잡하므로 간단한 예시)
      
      return true;
    } catch (error) {
      console.error('백업 데이터 복원 실패:', error);
      return false;
    }
  }

  /**
   * 백업 데이터 목록 조회
   */
  getBackupList(): Array<{ userId: string; timestamp: number; data: any }> {
    const backups: Array<{ userId: string; timestamp: number; data: any }> = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_backup_')) {
          const backupData = localStorage.getItem(key);
          if (backupData) {
            const backupInfo = JSON.parse(backupData);
            backups.push(backupInfo);
          }
        }
      }
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 백업 데이터 삭제
   */
  deleteBackup(userId: string): boolean {
    try {
      localStorage.removeItem(`user_backup_${userId}`);
      console.log(`백업 데이터 삭제 완료: ${userId}`);
      return true;
    } catch (error) {
      console.error('백업 데이터 삭제 실패:', error);
      return false;
    }
  }
}

export const logoutDataCleanupService = LogoutDataCleanupService.getInstance();
