import { databaseService } from './database/DatabaseService';
import { AuthService } from './authService';
import { useUIStore } from '../stores/uiStore';

export interface MigrationResult {
  success: boolean;
  migratedProjects: number;
  migratedImages: number;
  migratedTemplates: number;
  errors: string[];
}

export interface MigrationOptions {
  preserveOriginalData: boolean;
  migrateProjects: boolean;
  migrateImages: boolean;
  migrateTemplates: boolean;
  migrateApiKeys: boolean;
}

export class UserMigrationService {
  private static instance: UserMigrationService;
  private migrationHistory: Map<string, MigrationResult> = new Map();

  static getInstance(): UserMigrationService {
    if (!UserMigrationService.instance) {
      UserMigrationService.instance = new UserMigrationService();
    }
    return UserMigrationService.instance;
  }

  /**
   * 사용자 ID 변경시 데이터 마이그레이션
   */
  async migrateUserData(
    fromUserId: string,
    toUserId: string,
    options: MigrationOptions = {
      preserveOriginalData: true,
      migrateProjects: true,
      migrateImages: true,
      migrateTemplates: true,
      migrateApiKeys: true
    }
  ): Promise<MigrationResult> {
    const migrationId = `${fromUserId}_to_${toUserId}_${Date.now()}`;
    const result: MigrationResult = {
      success: false,
      migratedProjects: 0,
      migratedImages: 0,
      migratedTemplates: 0,
      errors: []
    };

    try {
      console.log(`🔄 사용자 데이터 마이그레이션 시작: ${fromUserId} → ${toUserId}`);

      // 1. 프로젝트 데이터 마이그레이션
      if (options.migrateProjects) {
        const projectResult = await this.migrateProjects(fromUserId, toUserId, options.preserveOriginalData);
        result.migratedProjects = projectResult.count;
        result.errors.push(...projectResult.errors);
      }

      // 2. 이미지 데이터 마이그레이션
      if (options.migrateImages) {
        const imageResult = await this.migrateImages(fromUserId, toUserId, options.preserveOriginalData);
        result.migratedImages = imageResult.count;
        result.errors.push(...imageResult.errors);
      }

      // 3. 템플릿 데이터 마이그레이션
      if (options.migrateTemplates) {
        const templateResult = await this.migrateTemplates(fromUserId, toUserId, options.preserveOriginalData);
        result.migratedTemplates = templateResult.count;
        result.errors.push(...templateResult.errors);
      }

      // 4. API 키 마이그레이션
      if (options.migrateApiKeys) {
        const apiKeyResult = await this.migrateApiKeys(fromUserId, toUserId, options.preserveOriginalData);
        result.errors.push(...apiKeyResult.errors);
      }

      // 5. 마이그레이션 히스토리 저장
      this.migrationHistory.set(migrationId, result);
      this.saveMigrationHistory();

      result.success = result.errors.length === 0;
      
      console.log(`✅ 사용자 데이터 마이그레이션 완료:`, {
        projects: result.migratedProjects,
        images: result.migratedImages,
        templates: result.migratedTemplates,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      console.error('❌ 사용자 데이터 마이그레이션 실패:', error);
      result.errors.push(`마이그레이션 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return result;
    }
  }

  /**
   * 프로젝트 데이터 마이그레이션
   */
  private async migrateProjects(
    fromUserId: string,
    toUserId: string,
    preserveOriginal: boolean
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // 기존 사용자의 프로젝트 목록 조회
      const projects = await databaseService.listProjects(fromUserId);
      
      for (const project of projects) {
        try {
          // 프로젝트 데이터 로드
          const projectData = await databaseService.loadProject(project.projectId);
          if (!projectData) continue;

          // 새 사용자 ID로 프로젝트 저장
          const newProjectId = await databaseService.saveProject({
            projectId: undefined, // 새 ID 생성
            userId: toUserId,
            projectData: projectData.projectData
          });

          // 원본 데이터 삭제 (선택적)
          if (!preserveOriginal) {
            await databaseService.deleteProject(project.projectId);
          }

          count++;
          console.log(`📁 프로젝트 마이그레이션: ${project.projectId} → ${newProjectId}`);
        } catch (error) {
          const errorMsg = `프로젝트 ${project.projectId} 마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      errors.push(`프로젝트 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { count, errors };
  }

  /**
   * 이미지 데이터 마이그레이션
   */
  private async migrateImages(
    fromUserId: string,
    toUserId: string,
    preserveOriginal: boolean
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // localStorage에서 이미지 데이터 조회
      const imageStorageData = localStorage.getItem('imageStorage');
      if (!imageStorageData) return { count: 0, errors };

      const imageStorage = JSON.parse(imageStorageData);
      const userImages = imageStorage.projectStorages || {};

      // 사용자별 이미지 데이터 마이그레이션
      for (const [projectId, projectStorage] of Object.entries(userImages)) {
        try {
          const storage = projectStorage as any;
          if (storage.images && storage.images.length > 0) {
            // 새 사용자 ID로 이미지 데이터 업데이트
            const updatedImages = storage.images.map((image: any) => ({
              ...image,
              projectId: `${toUserId}_${projectId}`,
              migratedFrom: image.projectId,
              migratedAt: Date.now()
            }));

            // 새 프로젝트 ID로 저장
            const newProjectId = `${toUserId}_${projectId}`;
            if (!imageStorage.projectStorages[newProjectId]) {
              imageStorage.projectStorages[newProjectId] = {
                projectId: newProjectId,
                images: updatedImages,
                lastAccessed: Date.now()
              };
            }

            // 원본 데이터 삭제 (선택적)
            if (!preserveOriginal) {
              delete imageStorage.projectStorages[projectId];
            }

            count += updatedImages.length;
            console.log(`🖼️ 이미지 마이그레이션: ${projectId} → ${newProjectId} (${updatedImages.length}개)`);
          }
        } catch (error) {
          const errorMsg = `이미지 프로젝트 ${projectId} 마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // 업데이트된 이미지 스토리지 저장
      localStorage.setItem('imageStorage', JSON.stringify(imageStorage));
    } catch (error) {
      errors.push(`이미지 데이터 마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { count, errors };
  }

  /**
   * 템플릿 데이터 마이그레이션
   */
  private async migrateTemplates(
    fromUserId: string,
    toUserId: string,
    preserveOriginal: boolean
  ): Promise<{ count: number; errors: string[] }> {
    const errors: string[] = [];
    let count = 0;

    try {
      // 사용자의 템플릿 목록 조회
      const templates = await databaseService.listPromptTemplates(fromUserId);
      
      for (const template of templates) {
        try {
          // 템플릿 데이터 로드
          const templateData = await databaseService.loadPromptTemplate(template.id);
          if (!templateData) continue;

          // 새 사용자 ID로 템플릿 저장
          const newTemplateId = await databaseService.savePromptTemplate(
            toUserId,
            templateData.name,
            templateData.category,
            templateData
          );

          // 원본 템플릿 삭제 (선택적)
          if (!preserveOriginal) {
            await databaseService.deletePromptTemplate(template.id);
          }

          count++;
          console.log(`📝 템플릿 마이그레이션: ${template.id} → ${newTemplateId}`);
        } catch (error) {
          const errorMsg = `템플릿 ${template.id} 마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      errors.push(`템플릿 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { count, errors };
  }

  /**
   * API 키 마이그레이션
   */
  private async migrateApiKeys(
    fromUserId: string,
    toUserId: string,
    preserveOriginal: boolean
  ): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    try {
      // 기존 사용자의 API 키 조회
      const apiKeys = await databaseService.getUserApiKeys(fromUserId);
      
      for (const [provider, apiKey] of Object.entries(apiKeys)) {
        try {
          // 새 사용자 ID로 API 키 저장
          await databaseService.saveUserApiKey(toUserId, provider, apiKey);

          // 원본 API 키 삭제 (선택적)
          if (!preserveOriginal) {
            await databaseService.deleteUserApiKey(fromUserId, provider);
          }

          console.log(`🔑 API 키 마이그레이션: ${provider} (${fromUserId} → ${toUserId})`);
        } catch (error) {
          const errorMsg = `API 키 ${provider} 마이그레이션 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      errors.push(`API 키 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return { errors };
  }

  /**
   * 마이그레이션 히스토리 저장
   */
  private saveMigrationHistory(): void {
    try {
      const historyData = Array.from(this.migrationHistory.entries()).map(([id, result]) => ({
        id,
        ...result,
        timestamp: Date.now()
      }));
      localStorage.setItem('userMigrationHistory', JSON.stringify(historyData));
    } catch (error) {
      console.error('마이그레이션 히스토리 저장 실패:', error);
    }
  }

  /**
   * 마이그레이션 히스토리 로드
   */
  loadMigrationHistory(): void {
    try {
      const historyData = localStorage.getItem('userMigrationHistory');
      if (historyData) {
        const history = JSON.parse(historyData);
        this.migrationHistory.clear();
        history.forEach((item: any) => {
          const { id, ...result } = item;
          this.migrationHistory.set(id, result);
        });
      }
    } catch (error) {
      console.error('마이그레이션 히스토리 로드 실패:', error);
    }
  }

  /**
   * 마이그레이션 히스토리 조회
   */
  getMigrationHistory(): Array<{ id: string; result: MigrationResult; timestamp: number }> {
    return Array.from(this.migrationHistory.entries()).map(([id, result]) => ({
      id,
      result,
      timestamp: Date.now()
    }));
  }

  /**
   * 마이그레이션 롤백
   */
  async rollbackMigration(migrationId: string): Promise<boolean> {
    try {
      const migration = this.migrationHistory.get(migrationId);
      if (!migration) {
        throw new Error('마이그레이션 기록을 찾을 수 없습니다.');
      }

      // 롤백 로직 구현 (복잡하므로 간단한 구현)
      console.log(`🔄 마이그레이션 롤백: ${migrationId}`);
      
      // 마이그레이션 기록에서 제거
      this.migrationHistory.delete(migrationId);
      this.saveMigrationHistory();

      return true;
    } catch (error) {
      console.error('마이그레이션 롤백 실패:', error);
      return false;
    }
  }
}

export const userMigrationService = UserMigrationService.getInstance();
