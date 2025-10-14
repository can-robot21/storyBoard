import { ProjectSaveRequest, ProjectLoadResponse } from '../../types/project';

/**
 * 데이터베이스 서비스 인터페이스
 */
export interface IDatabaseService {
  // 프로젝트 관리
  saveProject(request: ProjectSaveRequest): Promise<string>;
  loadProject(projectId: string): Promise<ProjectLoadResponse | null>;
  listProjects(userId?: string): Promise<ProjectLoadResponse[]>;
  deleteProject(projectId: string): Promise<boolean>;
  exportProject(projectId: string): Promise<string>;
  importProject(projectData: string): Promise<string>;

  // 사용자 관리
  createUser(email: string, name: string, password: string): Promise<string>;
  authenticateUser(email: string, password: string): Promise<string | null>;
  getUserById(userId: string): Promise<any | null>;
  updateUser(userId: string, data: any): Promise<boolean>;

  // API 키 관리
  saveUserApiKey(userId: string, provider: string, apiKey: string): Promise<boolean>;
  getUserApiKey(userId: string, provider: string): Promise<string | null>;
  getUserApiKeys(userId: string): Promise<{[provider: string]: string}>;
  deleteUserApiKey(userId: string, provider: string): Promise<boolean>;

  // 템플릿 관리
  savePromptTemplate(userId: string, name: string, category: string, templateData: any): Promise<string>;
  loadPromptTemplate(templateId: string): Promise<any | null>;
  listPromptTemplates(userId: string, category?: string): Promise<any[]>;
  deletePromptTemplate(templateId: string): Promise<boolean>;

  // 사용량 통계
  recordUsage(userId: string, actionType: string, aiProvider?: string, tokenCount?: number, cost?: number): Promise<boolean>;
  getUserUsageStats(userId: string, startDate?: Date, endDate?: Date): Promise<any[]>;
}

/**
 * 브라우저 환경용 데이터베이스 서비스 구현체
 * IndexedDB를 사용하여 데이터 저장
 */
export class BrowserDatabaseService implements IDatabaseService {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;
  private dbName = 'StoryBoardDB';
  private dbVersion = 1;

  constructor() {
    this.initializeDatabase();
  }

  /**
   * 데이터베이스 초기화
   */
  async initializeDatabase(): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.error('IndexedDB 초기화 실패:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.isInitialized = true;
          console.log('IndexedDB 초기화 완료');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          this.createObjectStores(db);
        };
      });
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Object Store 생성
   */
  private createObjectStores(db: IDBDatabase): void {
    // 사용자 테이블
    if (!db.objectStoreNames.contains('users')) {
      const userStore = db.createObjectStore('users', { keyPath: 'id' });
      userStore.createIndex('email', 'email', { unique: true });
      userStore.createIndex('created_at', 'created_at');
    }

    // 프로젝트 테이블
    if (!db.objectStoreNames.contains('projects')) {
      const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
      projectStore.createIndex('user_id', 'user_id');
      projectStore.createIndex('updated_at', 'updated_at');
    }

    // 프로젝트 히스토리 테이블
    if (!db.objectStoreNames.contains('project_history')) {
      const historyStore = db.createObjectStore('project_history', { keyPath: 'id', autoIncrement: true });
      historyStore.createIndex('project_id', 'project_id');
      historyStore.createIndex('timestamp', 'timestamp');
    }

    // 프롬프트 템플릿 테이블
    if (!db.objectStoreNames.contains('prompt_templates')) {
      const templateStore = db.createObjectStore('prompt_templates', { keyPath: 'id' });
      templateStore.createIndex('user_id', 'user_id');
      templateStore.createIndex('category', 'category');
      templateStore.createIndex('created_at', 'created_at');
    }

    // 사용량 통계 테이블
    if (!db.objectStoreNames.contains('usage_stats')) {
      const usageStore = db.createObjectStore('usage_stats', { keyPath: 'id', autoIncrement: true });
      usageStore.createIndex('user_id', 'user_id');
      usageStore.createIndex('timestamp', 'timestamp');
    }

    console.log('IndexedDB Object Stores 생성 완료');
  }

  /**
   * 프로젝트 저장
   */
  async saveProject(request: ProjectSaveRequest): Promise<string> {
    if (!this.isInitialized || !this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const projectId = request.projectId || this.generateProjectId();
      const userId = request.userId || 'anonymous';
      const now = Date.now();

      // 프로젝트 데이터에 사용자 ID 포함
      const projectDataWithUserId = {
        ...request.projectData,
        userId: userId,
        user_id: userId,
        ownerId: userId
      };

      const projectData = {
        id: projectId,
        user_id: userId,
        name: request.projectData.story || 'Untitled Project',
        description: request.projectData.story || 'No description',
        data: JSON.stringify(projectDataWithUserId),
        created_at: now,
        updated_at: now
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.put(projectData);

        request.onsuccess = () => {
          this.addToHistory(projectId, userId, 'save', projectData);
          resolve(projectId);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('프로젝트 저장 실패:', error);
      throw new Error('프로젝트 저장에 실패했습니다.');
    }
  }

  /**
   * 프로젝트 로드
   */
  async loadProject(projectId: string): Promise<ProjectLoadResponse | null> {
    if (!this.isInitialized || !this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const request = store.get(projectId);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          resolve({
            projectId: result.id,
            projectData: JSON.parse(result.data),
            createdAt: new Date(result.created_at).toISOString(),
            updatedAt: new Date(result.updated_at).toISOString()
          });
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      throw new Error('프로젝트 로드에 실패했습니다.');
    }
  }

  /**
   * 히스토리에 추가
   */
  private addToHistory(projectId: string, userId: string, action: string, data: any): void {
    if (!this.db) return;
    
    try {
      const historyData = {
        project_id: projectId,
        user_id: userId,
        action,
        data: JSON.stringify(data),
        timestamp: Date.now()
      };

      const transaction = this.db.transaction(['project_history'], 'readwrite');
      const store = transaction.objectStore('project_history');
      store.add(historyData);
    } catch (error) {
      console.error('히스토리 추가 실패:', error);
    }
  }

  /**
   * 프로젝트 ID 생성
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 사용자 ID 생성
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 템플릿 ID 생성
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 비밀번호 해시
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 솔트 생성
   */
  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * API 키 암호화 (Base64 인코딩)
   */
  private encryptApiKey(apiKey: string): string {
    return btoa(apiKey);
  }

  /**
   * API 키 복호화
   */
  private decryptApiKey(encryptedKey: string): string {
    return atob(encryptedKey);
  }

  /**
   * 데이터베이스 연결 종료
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * 데이터베이스 상태 확인
   */
  isConnected() {
    return this.db !== null && this.isInitialized;
  }

  // 나머지 메서드들은 간단한 구현으로 대체
  async listProjects(userId?: string): Promise<ProjectLoadResponse[]> {
    if (!this.isInitialized || !this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        const request = store.getAll();

        request.onsuccess = () => {
          const projects = request.result || [];
          
          // 사용자별 필터링
          const filteredProjects = userId 
            ? projects.filter((project: any) => project.user_id === userId)
            : projects;

          const projectList: ProjectLoadResponse[] = filteredProjects.map((project: any) => ({
            projectId: project.id,
            projectData: JSON.parse(project.data),
            createdAt: new Date(project.created_at).toISOString(),
            updatedAt: new Date(project.updated_at).toISOString(),
            userName: project.user_id,
            isShared: false
          }));

          resolve(projectList);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.isInitialized || !this.db) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.delete(projectId);

        request.onsuccess = () => {
          console.log(`프로젝트 삭제 완료: ${projectId}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('프로젝트 삭제 실패:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      return false;
    }
  }

  async exportProject(projectId: string): Promise<string> {
    return '';
  }

  async importProject(projectData: string): Promise<string> {
    return '';
  }

  async createUser(email: string, name: string, password: string): Promise<string> {
    return this.generateUserId();
  }

  async authenticateUser(email: string, password: string): Promise<string | null> {
    return null;
  }

  async getUserById(userId: string): Promise<any | null> {
    return null;
  }

  async updateUser(userId: string, data: any): Promise<boolean> {
    return true;
  }

  async saveUserApiKey(userId: string, provider: string, apiKey: string): Promise<boolean> {
    return true;
  }

  async getUserApiKey(userId: string, provider: string): Promise<string | null> {
    return null;
  }

  async getUserApiKeys(userId: string): Promise<{[provider: string]: string}> {
    return {};
  }

  async deleteUserApiKey(userId: string, provider: string): Promise<boolean> {
    return true;
  }

  async savePromptTemplate(userId: string, name: string, category: string, templateData: any): Promise<string> {
    return this.generateTemplateId();
  }

  async loadPromptTemplate(templateId: string): Promise<any | null> {
    return null;
  }

  async listPromptTemplates(userId: string, category?: string): Promise<any[]> {
    return [];
  }

  async deletePromptTemplate(templateId: string): Promise<boolean> {
    return true;
  }

  async recordUsage(userId: string, actionType: string, aiProvider?: string, tokenCount?: number, cost?: number): Promise<boolean> {
    return true;
  }

  async getUserUsageStats(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    return [];
  }
}

// 싱글톤 인스턴스
export const databaseService = new BrowserDatabaseService();