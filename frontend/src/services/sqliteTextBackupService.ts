/**
 * SQLite 데이터 백업 및 복원 서비스
 * 프로젝트 참조의 텍스트 항목만 처리 (이미지, 영상 제외)
 */

interface TextBackupData {
  id: string;
  timestamp: number;
  type: 'project_reference_text';
  data: {
    story?: string;
    characterList?: any[];
    scenarioPrompt?: string;
    storySummary?: string;
    finalScenario?: string;
    generatedProjectData?: {
      koreanCards?: Record<string, string>;
      koreanCardDraft?: Record<string, string>;
      englishCards?: Record<string, string>;
    };
    episodes?: any[];
    generatedTextCards?: any[];
    generatedSceneTextCards?: any[];
  };
  metadata: {
    version: string;
    description: string;
    size: number;
  };
}

interface BackupResult {
  success: boolean;
  backupId?: string;
  error?: string;
  message?: string;
}

interface RestoreResult {
  success: boolean;
  restoredData?: any;
  error?: string;
  message?: string;
}

export class SQLiteTextBackupService {
  private static instance: SQLiteTextBackupService;
  private readonly DB_NAME = 'StoryBoardTextBackup';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'textBackups';

  private constructor() {
    this.initDatabase();
  }

  static getInstance(): SQLiteTextBackupService {
    if (!SQLiteTextBackupService.instance) {
      SQLiteTextBackupService.instance = new SQLiteTextBackupService();
    }
    return SQLiteTextBackupService.instance;
  }

  /**
   * IndexedDB 초기화
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ SQLite 백업 데이터베이스 초기화 실패:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('✅ SQLite 백업 데이터베이스 초기화 완료');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          console.log('✅ 백업 저장소 생성 완료');
        }
      };
    });
  }

  /**
   * 텍스트 데이터 백업 생성
   */
  async createTextBackup(description: string = '수동 백업'): Promise<BackupResult> {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 텍스트 데이터만 수집 (이미지, 영상 제외)
      const textData = await this.collectTextData();
      
      const backupData: TextBackupData = {
        id: backupId,
        timestamp: Date.now(),
        type: 'project_reference_text',
        data: textData,
        metadata: {
          version: '1.0.0',
          description,
          size: JSON.stringify(textData).length
        }
      };

      await this.saveBackupToIndexedDB(backupData);

      return {
        success: true,
        backupId,
        message: `텍스트 백업이 생성되었습니다. (${backupData.metadata.size} bytes)`
      };
    } catch (error) {
      console.error('❌ 텍스트 백업 생성 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 텍스트 데이터 수집 (localStorage에서)
   */
  private async collectTextData(): Promise<any> {
    const textData: any = {};

    try {
      // 프로젝트 개요 관련 텍스트 데이터
      const story = localStorage.getItem('story');
      if (story) textData.story = story;

      const characterList = localStorage.getItem('characterList');
      if (characterList) textData.characterList = JSON.parse(characterList);

      const scenarioPrompt = localStorage.getItem('scenarioPrompt');
      if (scenarioPrompt) textData.scenarioPrompt = scenarioPrompt;

      const storySummary = localStorage.getItem('storySummary');
      if (storySummary) textData.storySummary = storySummary;

      const finalScenario = localStorage.getItem('finalScenario');
      if (finalScenario) textData.finalScenario = finalScenario;

      // 생성된 프로젝트 데이터
      const generatedProjectData = localStorage.getItem('generatedProjectData');
      if (generatedProjectData) {
        const parsed = JSON.parse(generatedProjectData);
        textData.generatedProjectData = {
          koreanCards: parsed.koreanCards,
          koreanCardDraft: parsed.koreanCardDraft,
          englishCards: parsed.englishCards
        };
      }

      // 에피소드 구조 데이터
      const episodes = localStorage.getItem('episodeStructureData');
      if (episodes) textData.episodes = JSON.parse(episodes);

      // 텍스트 카드 데이터
      const generatedTextCards = localStorage.getItem('generatedTextCards');
      if (generatedTextCards) textData.generatedTextCards = JSON.parse(generatedTextCards);

      const generatedSceneTextCards = localStorage.getItem('generatedSceneTextCards');
      if (generatedSceneTextCards) textData.generatedSceneTextCards = JSON.parse(generatedSceneTextCards);

      console.log('📝 텍스트 데이터 수집 완료:', Object.keys(textData));
      return textData;
    } catch (error) {
      console.error('❌ 텍스트 데이터 수집 실패:', error);
      return textData;
    }
  }

  /**
   * IndexedDB에 백업 저장
   */
  private async saveBackupToIndexedDB(backupData: TextBackupData): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const addRequest = store.add(backupData);
        
        addRequest.onsuccess = () => {
          console.log('✅ 백업 데이터 저장 완료:', backupData.id);
          resolve();
        };
        
        addRequest.onerror = () => {
          console.error('❌ 백업 데이터 저장 실패:', addRequest.error);
          reject(addRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('❌ 데이터베이스 열기 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 백업 목록 조회
   */
  async getBackupList(): Promise<TextBackupData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('timestamp');
        
        const getAllRequest = index.getAll();
        
        getAllRequest.onsuccess = () => {
          const backups = getAllRequest.result.sort((a, b) => b.timestamp - a.timestamp);
          resolve(backups);
        };
        
        getAllRequest.onerror = () => {
          console.error('❌ 백업 목록 조회 실패:', getAllRequest.error);
          reject(getAllRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('❌ 데이터베이스 열기 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 특정 백업 복원
   */
  async restoreBackup(backupId: string): Promise<RestoreResult> {
    try {
      const backupData = await this.getBackupById(backupId);
      
      if (!backupData) {
        return {
          success: false,
          error: '백업을 찾을 수 없습니다.'
        };
      }

      // 텍스트 데이터 복원
      await this.restoreTextData(backupData.data);

      return {
        success: true,
        restoredData: backupData.data,
        message: `백업이 복원되었습니다. (${backupData.metadata.description})`
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
   * 특정 백업 조회
   */
  private async getBackupById(backupId: string): Promise<TextBackupData | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const getRequest = store.get(backupId);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result || null);
        };
        
        getRequest.onerror = () => {
          console.error('❌ 백업 조회 실패:', getRequest.error);
          reject(getRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('❌ 데이터베이스 열기 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 텍스트 데이터 복원
   */
  private async restoreTextData(data: any): Promise<void> {
    try {
      // 프로젝트 개요 데이터 복원
      if (data.story) localStorage.setItem('story', data.story);
      if (data.characterList) localStorage.setItem('characterList', JSON.stringify(data.characterList));
      if (data.scenarioPrompt) localStorage.setItem('scenarioPrompt', data.scenarioPrompt);
      if (data.storySummary) localStorage.setItem('storySummary', data.storySummary);
      if (data.finalScenario) localStorage.setItem('finalScenario', data.finalScenario);

      // 생성된 프로젝트 데이터 복원
      if (data.generatedProjectData) {
        localStorage.setItem('generatedProjectData', JSON.stringify(data.generatedProjectData));
      }

      // 에피소드 구조 데이터 복원
      if (data.episodes) {
        localStorage.setItem('episodeStructureData', JSON.stringify(data.episodes));
      }

      // 텍스트 카드 데이터 복원
      if (data.generatedTextCards) {
        localStorage.setItem('generatedTextCards', JSON.stringify(data.generatedTextCards));
      }

      if (data.generatedSceneTextCards) {
        localStorage.setItem('generatedSceneTextCards', JSON.stringify(data.generatedSceneTextCards));
      }

      console.log('✅ 텍스트 데이터 복원 완료');
    } catch (error) {
      console.error('❌ 텍스트 데이터 복원 실패:', error);
      throw error;
    }
  }

  /**
   * 백업 삭제
   */
  async deleteBackup(backupId: string): Promise<BackupResult> {
    try {
      await this.deleteBackupFromIndexedDB(backupId);
      
      return {
        success: true,
        message: '백업이 삭제되었습니다.'
      };
    } catch (error) {
      console.error('❌ 백업 삭제 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * IndexedDB에서 백업 삭제
   */
  private async deleteBackupFromIndexedDB(backupId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const deleteRequest = store.delete(backupId);
        
        deleteRequest.onsuccess = () => {
          console.log('✅ 백업 삭제 완료:', backupId);
          resolve();
        };
        
        deleteRequest.onerror = () => {
          console.error('❌ 백업 삭제 실패:', deleteRequest.error);
          reject(deleteRequest.error);
        };
      };
      
      request.onerror = () => {
        console.error('❌ 데이터베이스 열기 실패:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 백업 다운로드 (JSON 파일)
   */
  async downloadBackup(backupId: string): Promise<BackupResult> {
    try {
      const backupData = await this.getBackupById(backupId);
      
      if (!backupData) {
        return {
          success: false,
          error: '백업을 찾을 수 없습니다.'
        };
      }

      // JSON 파일로 다운로드
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard-text-backup-${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: '백업 파일이 다운로드되었습니다.'
      };
    } catch (error) {
      console.error('❌ 백업 다운로드 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * 백업 통계 조회
   */
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: TextBackupData;
    newestBackup?: TextBackupData;
  }> {
    try {
      const backups = await this.getBackupList();
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.metadata.size, 0);
      const oldestBackup = backups[backups.length - 1];
      const newestBackup = backups[0];

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup,
        newestBackup
      };
    } catch (error) {
      console.error('❌ 백업 통계 조회 실패:', error);
      return {
        totalBackups: 0,
        totalSize: 0
      };
    }
  }
}

export const sqliteTextBackupService = SQLiteTextBackupService.getInstance();
