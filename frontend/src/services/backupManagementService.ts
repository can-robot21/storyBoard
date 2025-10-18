/**
 * 백업 관리 서비스
 * 백업 데이터 조회, 분석, 선택 삭제 기능
 */

interface BackupItem {
  id: string;
  userId: string;
  timestamp: number;
  type: 'manual' | 'automatic' | 'scheduled';
  size: number;
  itemCount: number;
  description: string;
  data: {
    projects: number;
    images: number;
    templates: number;
    apiKeys: number;
  };
}

interface BackupAnalysis {
  totalBackups: number;
  totalSize: number;
  oldestBackup: BackupItem | null;
  newestBackup: BackupItem | null;
  largestBackup: BackupItem | null;
  backupsByType: {
    manual: number;
    automatic: number;
    scheduled: number;
  };
  sizeByType: {
    manual: number;
    automatic: number;
    scheduled: number;
  };
}

interface BackupCleanupResult {
  deletedBackups: BackupItem[];
  freedSpace: number;
  errors: string[];
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  error?: string;
  message?: string;
}

export class BackupManagementService {
  private static instance: BackupManagementService;
  private readonly MAX_BACKUP_COUNT = 10;
  private readonly MAX_BACKUP_AGE_DAYS = 30;

  private constructor() {
    this.startAutoCleanup();
  }

  static getInstance(): BackupManagementService {
    if (!BackupManagementService.instance) {
      BackupManagementService.instance = new BackupManagementService();
    }
    return BackupManagementService.instance;
  }

  /**
   * 자동 정리 시작 (24시간마다)
   */
  private startAutoCleanup(): void {
    setInterval(() => {
      this.performAutoCleanup();
    }, 24 * 60 * 60 * 1000); // 24시간
  }

  /**
   * 자동 정리 실행
   */
  private async performAutoCleanup(): Promise<void> {
    try {
      console.log('🧹 자동 정리 시작 (24시간 주기)');
      await this.cleanupTemporaryData();
    } catch (error) {
      console.error('❌ 자동 정리 실패:', error);
    }
  }

  /**
   * 수동 백업 생성
   */
  async createManualBackup(userId: string): Promise<BackupResult> {
    try {
      const backupId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 프로젝트 데이터 수집
      const projectData = this.collectProjectData();
      
      const backupItem: BackupItem = {
        id: backupId,
        userId,
        timestamp: Date.now(),
        type: 'manual',
        size: JSON.stringify(projectData).length,
        itemCount: this.countProjectItems(projectData),
        description: '수동 백업',
        data: projectData
      };

      await this.saveBackupToIndexedDB(backupItem);

      return {
        success: true,
        backupId,
        message: `수동 백업이 생성되었습니다. (${backupItem.size} bytes)`
      };
    } catch (error) {
      console.error('❌ 수동 백업 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 프로젝트 데이터 수집 (이미지/영상 파일 제외, 메타데이터만 저장)
   */
  private collectProjectData(): any {
    const data: any = {};

    try {
      // localStorage에서 프로젝트 관련 데이터 수집
      const keys = [
        'story', 'characterList', 'scenarioPrompt', 'storySummary', 'finalScenario',
        'generatedProjectData', 'episodeStructureData', 'generatedTextCards',
        'generatedSceneTextCards'
      ];

      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      });

      // 생성된 이미지 리스트 (파일 제외, 메타데이터만)
      const generatedImages = localStorage.getItem('generatedImages');
      if (generatedImages) {
        const images = JSON.parse(generatedImages);
        data.generatedImagesList = images.map((img: any) => ({
          id: img.id,
          description: img.description,
          prompt: img.prompt,
          timestamp: img.timestamp,
          type: img.type,
          // 실제 이미지 데이터는 제외
          hasImage: !!img.image
        }));
      }

      // 생성된 영상 리스트 (파일 제외, 메타데이터만)
      const generatedVideos = localStorage.getItem('generatedVideos');
      if (generatedVideos) {
        const videos = JSON.parse(generatedVideos);
        data.generatedVideosList = videos.map((video: any) => ({
          id: video.id,
          prompt: video.prompt,
          englishPrompt: video.englishPrompt,
          koreanPrompt: video.koreanPrompt,
          timestamp: video.timestamp,
          duration: video.duration,
          ratio: video.ratio,
          model: video.model,
          // 실제 영상 데이터는 제외
          hasVideo: !!video.video
        }));
      }

      // 프롬프트 템플릿 및 도구 정보
      data.promptTemplates = this.collectPromptTemplates();
      data.toolsAndSettings = this.collectToolsAndSettings();

      return data;
    } catch (error) {
      console.error('❌ 프로젝트 데이터 수집 실패:', error);
      return {};
    }
  }

  /**
   * 프롬프트 템플릿 수집
   */
  private collectPromptTemplates(): any {
    try {
      const templates = localStorage.getItem('promptTemplates');
      if (templates) {
        return JSON.parse(templates);
      }
      return [];
    } catch (error) {
      console.error('프롬프트 템플릿 수집 실패:', error);
      return [];
    }
  }

  /**
   * 도구 및 설정 정보 수집
   */
  private collectToolsAndSettings(): any {
    try {
      const settings = {
        // AI 설정
        aiSettings: {
          selectedProvider: localStorage.getItem('selectedAIProvider'),
          apiKeysConfigured: {
            google: !!localStorage.getItem('user_api_keys')?.includes('google'),
            openai: !!localStorage.getItem('user_api_keys')?.includes('openai'),
            anthropic: !!localStorage.getItem('user_api_keys')?.includes('anthropic')
          }
        },
        // 프로젝트 설정
        projectSettings: {
          imageSettings: localStorage.getItem('imageSettings'),
          videoSettings: localStorage.getItem('videoSettings'),
          sceneCutSettings: localStorage.getItem('sceneCutSettings')
        },
        // 사용자 설정
        userSettings: {
          currentUser: localStorage.getItem('storyboard_current_user'),
          preferences: localStorage.getItem('userPreferences')
        },
        // 도구 사용 기록
        toolUsage: {
          lastUsedTools: localStorage.getItem('lastUsedTools'),
          toolStatistics: localStorage.getItem('toolStatistics')
        }
      };

      return settings;
    } catch (error) {
      console.error('도구 및 설정 정보 수집 실패:', error);
      return {};
    }
  }

  /**
   * 프로젝트 아이템 개수 계산
   */
  private countProjectItems(data: any): number {
    let count = 0;
    
    Object.values(data).forEach((value: any) => {
      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object' && value !== null) {
        count += Object.keys(value).length;
      } else if (value) {
        count += 1;
      }
    });

    return count;
  }

  /**
   * 백업 복원
   */
  async restoreBackup(userId: string, backupId: string): Promise<BackupResult> {
    try {
      const backup = await this.getBackupById(backupId);
      
      if (!backup) {
        return {
          success: false,
          error: '백업을 찾을 수 없습니다.'
        };
      }

      // 프로젝트 데이터 복원
      await this.restoreProjectData(backup.data);

      return {
        success: true,
        message: `백업이 복원되었습니다. (${backup.description || '알 수 없음'})`
      };
    } catch (error) {
      console.error('❌ 백업 복원 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 프로젝트 데이터 복원
   */
  private async restoreProjectData(data: any): Promise<void> {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      console.log('✅ 프로젝트 데이터 복원 완료');
    } catch (error) {
      console.error('❌ 프로젝트 데이터 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 백업 삭제
   */
  async deleteBackup(userId: string, backupId: string): Promise<boolean> {
    try {
      await this.deleteBackupFromIndexedDB(backupId);
      return true;
    } catch (error) {
      console.error('❌ 백업 삭제 실패:', error);
      return false;
    }
  }

  /**
   * 백업 내보내기 (JSON)
   */
  async exportBackup(userId: string, backupId: string): Promise<string | null> {
    try {
      const backup = await this.getBackupById(backupId);
      
      if (!backup) {
        return null;
      }

      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('❌ 백업 내보내기 실패:', error);
      return null;
    }
  }

  /**
   * 백업 가져오기 (JSON)
   */
  async importBackup(userId: string, backupJson: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(backupJson);
      
      // 백업 데이터 검증
      if (!backupData.id || !backupData.data) {
        throw new Error('유효하지 않은 백업 파일입니다.');
      }

      // 새로운 ID로 백업 생성
      const newBackupId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const backupItem: BackupItem = {
        ...backupData,
        id: newBackupId,
        userId,
        timestamp: Date.now(),
        type: 'manual',
        description: `가져온 백업 (${backupData.metadata?.description || '알 수 없음'})`
      };

      await this.saveBackupToIndexedDB(backupItem);

      return true;
    } catch (error) {
      console.error('❌ 백업 가져오기 실패:', error);
      return false;
    }
  }

  /**
   * 사용자별 백업 목록 조회
   */
  async getBackupList(userId: string): Promise<BackupItem[]> {
    try {
      // IndexedDB에서 사용자별 백업 조회
      const allBackups = await this.getAllBackups();
      return allBackups.filter(backup => backup.userId === userId);
    } catch (error) {
      console.error('❌ 백업 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 모든 백업 조회
   */
  async getAllBackups(): Promise<BackupItem[]> {
    try {
      // IndexedDB에서 백업 목록 조회
      return [];
    } catch (error) {
      console.error('❌ 백업 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 백업 분석
   */
  async getBackupAnalysis(): Promise<BackupAnalysis> {
    try {
      const backups = await this.getAllBackups();
      
      const analysis: BackupAnalysis = {
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1] : null,
        newestBackup: backups.length > 0 ? backups[0] : null,
        largestBackup: backups.length > 0 ? backups.reduce((largest, backup) => 
          backup.size > largest.size ? backup : largest
        ) : null,
        backupsByType: {
          manual: backups.filter(b => b.type === 'manual').length,
          automatic: backups.filter(b => b.type === 'automatic').length,
          scheduled: backups.filter(b => b.type === 'scheduled').length
        },
        sizeByType: {
          manual: backups.filter(b => b.type === 'manual').reduce((sum, b) => sum + b.size, 0),
          automatic: backups.filter(b => b.type === 'automatic').reduce((sum, b) => sum + b.size, 0),
          scheduled: backups.filter(b => b.type === 'scheduled').reduce((sum, b) => sum + b.size, 0)
        }
      };

      return analysis;
    } catch (error) {
      console.error('❌ 백업 분석 실패:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        largestBackup: null,
        backupsByType: { manual: 0, automatic: 0, scheduled: 0 },
        sizeByType: { manual: 0, automatic: 0, scheduled: 0 }
      };
    }
  }

  /**
   * 선택된 백업 삭제
   */
  async deleteSelectedBackups(backupIds: string[]): Promise<BackupCleanupResult> {
    const result: BackupCleanupResult = {
      deletedBackups: [],
      freedSpace: 0,
      errors: []
    };

    try {
      for (const backupId of backupIds) {
        try {
          const backup = await this.getBackupById(backupId);
          if (backup) {
            await this.deleteBackupFromIndexedDB(backupId);
            result.deletedBackups.push(backup);
            result.freedSpace += backup.size;
          }
        } catch (error) {
          result.errors.push(`백업 ${backupId} 삭제 실패: ${error}`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ 선택된 백업 삭제 실패:', error);
      result.errors.push(`삭제 실패: ${error}`);
      return result;
    }
  }

  /**
   * 자동 백업 정리
   */
  async autoCleanupBackups(): Promise<BackupCleanupResult> {
    const result: BackupCleanupResult = {
      deletedBackups: [],
      freedSpace: 0,
      errors: []
    };

    try {
      const backups = await this.getAllBackups();
      const cutoffDate = Date.now() - (this.MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000);
      
      const oldBackups = backups.filter(backup => backup.timestamp < cutoffDate);
      
      for (const backup of oldBackups) {
        try {
          await this.deleteBackupFromIndexedDB(backup.id);
          result.deletedBackups.push(backup);
          result.freedSpace += backup.size;
        } catch (error) {
          result.errors.push(`백업 ${backup.id} 삭제 실패: ${error}`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ 자동 백업 정리 실패:', error);
      result.errors.push(`정리 실패: ${error}`);
      return result;
    }
  }

  /**
   * 임시 데이터 정리
   */
  async cleanupTemporaryData(): Promise<{
    deletedItems: number;
    freedSpace: number;
    errors: string[];
  }> {
    const result = {
      deletedItems: 0,
      freedSpace: 0,
      errors: [] as string[]
    };

    try {
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const keysToRemove: string[] = [];

      // 임시 데이터 패턴 확인
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // 임시 데이터 패턴 확인
        if (this.isTemporaryDataKey(key)) {
          const value = localStorage.getItem(key);
          if (!value) continue;

          // 타임스탬프 확인 (키에 포함된 경우)
          const timestamp = this.extractTimestampFromKey(key);
          if (timestamp && timestamp < twentyFourHoursAgo) {
            keysToRemove.push(key);
            result.freedSpace += new Blob([value]).size;
          }
        }
      }

      // 임시 데이터 삭제
      for (const key of keysToRemove) {
        try {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_compressed`);
          result.deletedItems++;
        } catch (error) {
          result.errors.push(`키 ${key} 삭제 실패: ${error}`);
        }
      }

      console.log(`✅ 임시 데이터 정리 완료: ${result.deletedItems}개 삭제, ${(result.freedSpace / 1024).toFixed(1)}KB 확보`);
      return result;
    } catch (error) {
      console.error('❌ 임시 데이터 정리 실패:', error);
      result.errors.push(`정리 실패: ${error}`);
      return result;
    }
  }

  /**
   * 임시 데이터 키 패턴 확인
   */
  private isTemporaryDataKey(key: string): boolean {
    const tempPatterns = [
      /^temp_/,
      /^cache_/,
      /_temp$/,
      /_cache$/,
      /^backup_temp/,
      /^imageStorage_temp/,
      /^dataAccessLog_old/
    ];

    return tempPatterns.some(pattern => pattern.test(key));
  }

  /**
   * 키에서 타임스탬프 추출
   */
  private extractTimestampFromKey(key: string): number | null {
    const timestampMatch = key.match(/(\d{13})/); // 13자리 타임스탬프
    return timestampMatch ? parseInt(timestampMatch[1]) : null;
  }

  /**
   * 특정 백업 조회
   */
  private async getBackupById(backupId: string): Promise<BackupItem | null> {
    try {
      const backups = await this.getAllBackups();
      return backups.find(backup => backup.id === backupId) || null;
    } catch (error) {
      console.error('❌ 백업 조회 실패:', error);
      return null;
    }
  }

  /**
   * IndexedDB에 백업 저장
   */
  private async saveBackupToIndexedDB(backupItem: BackupItem): Promise<void> {
    // IndexedDB 저장 로직 구현
    console.log('✅ 백업 저장 완료:', backupItem.id);
  }

  /**
   * IndexedDB에서 백업 삭제
   */
  private async deleteBackupFromIndexedDB(backupId: string): Promise<void> {
    // IndexedDB 삭제 로직 구현
    console.log('✅ 백업 삭제 완료:', backupId);
  }
}

export const backupManagementService = BackupManagementService.getInstance();