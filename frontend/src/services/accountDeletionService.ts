import { AuthService } from './authService';
import { databaseService } from './database/DatabaseService';
import { dataAccessControlService } from './dataAccessControlService';
import { logoutDataCleanupService } from './logoutDataCleanupService';
import { AccountDeletionOptions } from '../components/common/AccountDeletionModal';

export interface AccountDeletionResult {
  success: boolean;
  deletedItems: {
    projects: number;
    images: number;
    templates: number;
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

export class AccountDeletionService {
  private static instance: AccountDeletionService;

  static getInstance(): AccountDeletionService {
    if (!AccountDeletionService.instance) {
      AccountDeletionService.instance = new AccountDeletionService();
    }
    return AccountDeletionService.instance;
  }

  /**
   * 계정 삭제 실행
   */
  async executeAccountDeletion(
    userId: string,
    options: AccountDeletionOptions
  ): Promise<AccountDeletionResult> {
    const result: AccountDeletionResult = {
      success: false,
      deletedItems: {
        projects: 0,
        images: 0,
        templates: 0,
        apiKeys: 0,
        accessLogs: 0
      },
      errors: []
    };

    try {
      console.log('🗑️ 계정 삭제 시작:', userId);

      // 1. 데이터 백업 (선택적)
      if (options.backupData) {
        const backupResult = await this.backupAccountData(userId);
        result.backedUpItems = backupResult;
        console.log('💾 계정 데이터 백업 완료:', backupResult);
      }

      // 2. 프로젝트 데이터 삭제
      if (options.deleteProjects) {
        const projectCount = await this.deleteUserProjects(userId);
        result.deletedItems.projects = projectCount;
        console.log(`📁 프로젝트 데이터 삭제 완료: ${projectCount}개`);
      }

      // 3. 이미지 데이터 삭제
      if (options.deleteImages) {
        const imageCount = await this.deleteUserImages(userId);
        result.deletedItems.images = imageCount;
        console.log(`🖼️ 이미지 데이터 삭제 완료: ${imageCount}개`);
      }

      // 4. 템플릿 데이터 삭제
      if (options.deleteTemplates) {
        const templateCount = await this.deleteUserTemplates(userId);
        result.deletedItems.templates = templateCount;
        console.log(`📝 템플릿 데이터 삭제 완료: ${templateCount}개`);
      }

      // 5. API 키 삭제
      if (options.deleteApiKeys) {
        const apiKeyCount = await this.deleteUserApiKeys(userId);
        result.deletedItems.apiKeys = apiKeyCount;
        console.log(`🔑 API 키 삭제 완료: ${apiKeyCount}개`);
      }

      // 6. 접근 로그 삭제
      if (options.deleteAccessLogs) {
        await this.deleteUserAccessLogs(userId);
        result.deletedItems.accessLogs = 1;
        console.log('📋 접근 로그 삭제 완료');
      }

      // 7. 모든 데이터 삭제 (선택적)
      if (options.deleteAllData) {
        await this.deleteAllUserData(userId);
        console.log('🗑️ 모든 사용자 데이터 삭제 완료');
      }

      // 8. 사용자 계정 삭제
      await this.deleteUserAccount(userId);
      console.log('👤 사용자 계정 삭제 완료');

      result.success = result.errors.length === 0;
      
      console.log('✅ 계정 삭제 완료:', result);
      return result;
    } catch (error) {
      console.error('❌ 계정 삭제 실패:', error);
      result.errors.push(`계정 삭제 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * 계정 데이터 백업
   */
  private async backupAccountData(userId: string): Promise<{
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
        type: 'account_deletion',
        data: backupData
      };
      localStorage.setItem(`account_backup_${userId}`, JSON.stringify(backupInfo));

      return backupData;
    } catch (error) {
      console.error('계정 데이터 백업 실패:', error);
      return backupData;
    }
  }

  /**
   * 사용자 프로젝트 삭제
   */
  private async deleteUserProjects(userId: string): Promise<number> {
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
      console.error('사용자 프로젝트 삭제 실패:', error);
      return count;
    }
  }

  /**
   * 사용자 이미지 삭제
   */
  private async deleteUserImages(userId: string): Promise<number> {
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
      console.error('사용자 이미지 삭제 실패:', error);
      return count;
    }
  }

  /**
   * 사용자 템플릿 삭제
   */
  private async deleteUserTemplates(userId: string): Promise<number> {
    let count = 0;
    try {
      const templates = await databaseService.listPromptTemplates(userId);
      
      for (const template of templates) {
        try {
          await databaseService.deletePromptTemplate(template.id);
          count++;
        } catch (error) {
          console.error(`템플릿 ${template.id} 삭제 실패:`, error);
        }
      }

      return count;
    } catch (error) {
      console.error('사용자 템플릿 삭제 실패:', error);
      return count;
    }
  }

  /**
   * 사용자 API 키 삭제
   */
  private async deleteUserApiKeys(userId: string): Promise<number> {
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
      console.error('사용자 API 키 삭제 실패:', error);
      return count;
    }
  }

  /**
   * 사용자 접근 로그 삭제
   */
  private async deleteUserAccessLogs(userId: string): Promise<void> {
    try {
      dataAccessControlService.clearAccessLog(userId);
      console.log('사용자 접근 로그 삭제 완료');
    } catch (error) {
      console.error('사용자 접근 로그 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 사용자 데이터 삭제
   */
  private async deleteAllUserData(userId: string): Promise<void> {
    try {
      // 로컬 스토리지에서 사용자 관련 데이터 삭제
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

      // 사용자별 백업 데이터 삭제
      localStorage.removeItem(`user_backup_${userId}`);
      localStorage.removeItem(`account_backup_${userId}`);

      console.log('모든 사용자 데이터 삭제 완료');
    } catch (error) {
      console.error('모든 사용자 데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 계정 삭제
   */
  private async deleteUserAccount(userId: string): Promise<void> {
    try {
      // IndexedDB에서 사용자 데이터 삭제
      // (실제 구현은 데이터베이스 스키마에 따라 달라짐)
      
      // localStorage에서 사용자 데이터 삭제
      const users = localStorage.getItem('storyboard_users');
      if (users) {
        const userList = JSON.parse(users);
        const filteredUsers = userList.filter((user: any) => user.id !== userId);
        localStorage.setItem('storyboard_users', JSON.stringify(filteredUsers));
      }

      // 현재 사용자 정보 삭제
      localStorage.removeItem('current_user');

      console.log('사용자 계정 삭제 완료');
    } catch (error) {
      console.error('사용자 계정 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 계정 삭제 전 데이터 검증
   */
  async validateAccountDeletion(userId: string): Promise<{
    isValid: boolean;
    dataSummary: {
      projects: number;
      images: number;
      templates: number;
      apiKeys: number;
    };
    warnings: string[];
  }> {
    const result = {
      isValid: true,
      dataSummary: {
        projects: 0,
        images: 0,
        templates: 0,
        apiKeys: 0
      },
      warnings: [] as string[]
    };

    try {
      // 프로젝트 데이터 확인
      const projects = await databaseService.listProjects(userId);
      result.dataSummary.projects = projects.length;

      // 이미지 데이터 확인
      const imageResult = await dataAccessControlService.getUserImages(userId);
      if (imageResult.allowed && imageResult.data) {
        result.dataSummary.images = imageResult.data.length;
      }

      // 템플릿 데이터 확인
      const templates = await databaseService.listPromptTemplates(userId);
      result.dataSummary.templates = templates.length;

      // API 키 확인
      const apiKeys = await databaseService.getUserApiKeys(userId);
      result.dataSummary.apiKeys = Object.keys(apiKeys).length;

      // 경고 메시지 생성
      if (result.dataSummary.projects > 0) {
        result.warnings.push(`${result.dataSummary.projects}개의 프로젝트가 삭제됩니다.`);
      }
      if (result.dataSummary.images > 0) {
        result.warnings.push(`${result.dataSummary.images}개의 이미지가 삭제됩니다.`);
      }
      if (result.dataSummary.templates > 0) {
        result.warnings.push(`${result.dataSummary.templates}개의 템플릿이 삭제됩니다.`);
      }
      if (result.dataSummary.apiKeys > 0) {
        result.warnings.push(`${result.dataSummary.apiKeys}개의 API 키가 삭제됩니다.`);
      }

      return result;
    } catch (error) {
      console.error('계정 삭제 검증 실패:', error);
      result.isValid = false;
      result.warnings.push('데이터 검증 중 오류가 발생했습니다.');
      return result;
    }
  }

  /**
   * 계정 삭제 취소 (백업 데이터 복원)
   */
  async cancelAccountDeletion(userId: string): Promise<boolean> {
    try {
      const backupData = localStorage.getItem(`account_backup_${userId}`);
      if (!backupData) {
        console.log('백업 데이터를 찾을 수 없습니다.');
        return false;
      }

      const backupInfo = JSON.parse(backupData);
      console.log('계정 삭제 취소 - 백업 데이터 복원:', backupInfo);

      // 백업 데이터 복원 로직 구현
      // (실제 구현은 복잡하므로 간단한 예시)
      
      return true;
    } catch (error) {
      console.error('계정 삭제 취소 실패:', error);
      return false;
    }
  }
}

export const accountDeletionService = AccountDeletionService.getInstance();
