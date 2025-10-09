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
 * SQLite 데이터베이스 서비스 구현체
 * 브라우저 환경에서 SQLite를 사용하여 데이터 저장
 */
export class SQLiteDatabaseService implements IDatabaseService {
  private db: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeDatabase();
  }

  /**
   * 데이터베이스 초기화
   */
  async initializeDatabase(): Promise<void> {
    try {
      // SQLite 대신 localStorage만 사용
      this.isInitialized = true;
      console.log('LocalStorage 데이터베이스 초기화 완료');
    } catch (error) {
      console.error('데이터베이스 초기화 실패:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 테이블 생성 (localStorage용)
   */
  private createTables(): void {
    // localStorage는 테이블 구조가 필요 없으므로 빈 메서드로 유지
    console.log('LocalStorage 테이블 초기화 완료');
  }

  /**
   * 프로젝트 저장
   */
  async saveProject(request: ProjectSaveRequest): Promise<string> {
    if (!this.isInitialized) {
      return this.saveToLocalStorage(request);
    }

    try {
      const projectId = request.projectId || this.generateProjectId();
      const userId = request.userId || 'anonymous';
      const now = Date.now();

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO projects (id, user_id, name, description, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        projectId,
        userId,
        request.projectData.story || 'Untitled Project',
        request.projectData.story || 'No description',
        JSON.stringify(request.projectData),
        now,
        now
      ]);

      // 히스토리에 저장
      this.addToHistory(projectId, userId, 'save', request.projectData);
      this.saveDatabase();

      return projectId;
    } catch (error) {
      console.error('프로젝트 저장 실패:', error);
      throw new Error('프로젝트 저장에 실패했습니다.');
    }
  }

  /**
   * 프로젝트 로드
   */
  async loadProject(projectId: string): Promise<ProjectLoadResponse | null> {
    if (!this.isInitialized) {
      return this.loadFromLocalStorage(projectId);
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
      const result = stmt.get([projectId]);
      
      if (!result) {
        return null;
      }
      
      return {
        projectId: result.id,
        projectData: JSON.parse(result.data),
        createdAt: new Date(result.created_at).toISOString(),
        updatedAt: new Date(result.updated_at).toISOString()
      };
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      throw new Error('프로젝트 로드에 실패했습니다.');
    }
  }

  /**
   * 프로젝트 목록 조회
   */
  async listProjects(userId?: string): Promise<ProjectLoadResponse[]> {
    if (!this.isInitialized) {
      return this.listFromLocalStorage();
    }

    try {
      let sql = `
        SELECT p.*, u.name as user_name
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
      `;

      const params: string[] = [];

      if (userId) {
        sql += ' WHERE p.user_id = ? OR p.is_shared = 1';
        params.push(userId);
      }

      sql += ' ORDER BY p.updated_at DESC';

      const stmt = this.db.prepare(sql);
      const results = stmt.all(params);

      return results.map((row: any) => ({
        projectId: row.id,
        projectData: JSON.parse(row.data),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        userName: row.user_name,
        isShared: row.is_shared === 1
      }));
    } catch (error) {
      console.error('프로젝트 목록 조회 실패:', error);
      throw new Error('프로젝트 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 프로젝트 삭제
   */
  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.isInitialized) {
      return this.deleteFromLocalStorage(projectId);
    }

    try {
      const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
      const result = stmt.run([projectId]);
      
      // 히스토리도 삭제
      const historyStmt = this.db.prepare('DELETE FROM project_history WHERE project_id = ?');
      historyStmt.run([projectId]);
      
      return result.changes > 0;
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      throw new Error('프로젝트 삭제에 실패했습니다.');
    }
  }

  /**
   * 프로젝트 내보내기
   */
  async exportProject(projectId: string): Promise<string> {
    const project = await this.loadProject(projectId);
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    
    return JSON.stringify(project, null, 2);
  }

  /**
   * 프로젝트 가져오기
   */
  async importProject(projectData: string): Promise<string> {
    try {
      const project = JSON.parse(projectData);
      const projectId = this.generateProjectId();
      
      await this.saveProject({
        projectId,
        projectData: project.projectData
      });
      
      return projectId;
    } catch (error) {
      console.error('프로젝트 가져오기 실패:', error);
      throw new Error('프로젝트 가져오기에 실패했습니다.');
    }
  }

  /**
   * 히스토리에 추가 (localStorage용)
   */
  private addToHistory(projectId: string, userId: string, action: string, data: any): void {
    try {
      const historyKey = `storyboard-history-${projectId}`;
      const historyData = {
        projectId,
        userId,
        action,
        data,
        timestamp: Date.now()
      };
      
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      existingHistory.push(historyData);
      localStorage.setItem(historyKey, JSON.stringify(existingHistory));
    } catch (error) {
      console.error('히스토리 추가 실패:', error);
    }
  }

  /**
   * 인덱스 생성 (localStorage용)
   */
  private createIndexes(): void {
    // localStorage는 인덱스가 필요 없으므로 빈 메서드로 유지
    console.log('LocalStorage 인덱스 초기화 완료');
  }

  /**
   * 데이터베이스를 로컬스토리지에 저장 (localStorage용)
   */
  public saveDatabase(): void {
    // localStorage는 자동으로 저장되므로 빈 메서드로 유지
    console.log('LocalStorage 데이터 저장 완료');
  }

  /**
   * 프로젝트 ID 생성
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 사용자 ID 생성
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 템플릿 ID 생성
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // localStorage 폴백 메서드들
  private async saveToLocalStorage(request: ProjectSaveRequest): Promise<string> {
    const projectId = request.projectId || this.generateProjectId();
    const projectData = {
      ...request.projectData,
      id: projectId,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`storyboard-project-${projectId}`, JSON.stringify(projectData));
    return projectId;
  }

  private async loadFromLocalStorage(projectId: string): Promise<ProjectLoadResponse | null> {
    const data = localStorage.getItem(`storyboard-project-${projectId}`);
    if (!data) return null;
    
    const project = JSON.parse(data);
    return {
      projectId: project.id,
      projectData: project,
      createdAt: project.savedAt,
      updatedAt: project.savedAt
    };
  }

  private async listFromLocalStorage(): Promise<ProjectLoadResponse[]> {
    const projects: ProjectLoadResponse[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('storyboard-project-')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const project = JSON.parse(data);
            projects.push({
              projectId: project.id,
              projectData: project,
              createdAt: project.savedAt,
              updatedAt: project.savedAt
            });
          } catch (error) {
            console.error('프로젝트 파싱 실패:', key, error);
          }
        }
      }
    }
    
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  private async deleteFromLocalStorage(projectId: string): Promise<boolean> {
    const key = `storyboard-project-${projectId}`;
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  }

  // ===== 사용자 관리 메서드 =====

  /**
   * 사용자 생성
   */
  async createUser(email: string, name: string, password: string): Promise<string> {
    // 데이터베이스가 초기화되지 않은 경우 자동 초기화 시도
    if (!this.isInitialized) {
      console.warn('데이터베이스가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      try {
        await this.initializeDatabase();
        if (!this.isInitialized) {
          throw new Error('데이터베이스 자동 초기화에 실패했습니다.');
        }
      } catch (error) {
        console.error('데이터베이스 초기화 실패:', error);
        throw new Error('데이터베이스 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
      }
    }

    try {
      const userId = this.generateUserId();
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(password, salt);
      const now = Date.now();

      // localStorage에 사용자 저장
      const userData = {
        id: userId,
        email,
        name,
        password_hash: passwordHash,
        salt,
        created_at: now,
        updated_at: now
      };

      // 기존 사용자 목록 가져오기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      
      // 이메일 중복 확인
      const existingUser = existingUsers.find((u: any) => u.email === email);
      if (existingUser) {
        throw new Error('이미 존재하는 이메일입니다.');
      }

      // 새 사용자 추가
      existingUsers.push(userData);
      localStorage.setItem('storyboard_users', JSON.stringify(existingUsers));

      return userId;
    } catch (error) {
      console.error('사용자 생성 실패:', error);
      throw new Error('사용자 생성에 실패했습니다.');
    }
  }

  /**
   * 사용자 인증
   */
  async authenticateUser(email: string, password: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const user = existingUsers.find((u: any) => u.email === email);

      if (!user) {
        return null;
      }

      const passwordHash = await this.hashPassword(password, user.salt);
      if (passwordHash === user.password_hash) {
        return user.id;
      }

      return null;
    } catch (error) {
      console.error('사용자 인증 실패:', error);
      throw new Error('사용자 인증에 실패했습니다.');
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserById(userId: string): Promise<any | null> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const user = existingUsers.find((u: any) => u.id === userId);

      if (!user) {
        return null;
      }

      // 민감한 정보 제외하고 반환
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      throw new Error('사용자 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  async updateUser(userId: string, data: any): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return false;
      }

      const user = existingUsers[userIndex];
      const updatedUser = { ...user };

      // 업데이트할 필드들 처리
      if (data.name) {
        updatedUser.name = data.name;
      }

      if (data.email) {
        updatedUser.email = data.email;
      }

      if (data.password) {
        const salt = this.generateSalt();
        const passwordHash = await this.hashPassword(data.password, salt);
        updatedUser.password_hash = passwordHash;
        updatedUser.salt = salt;
      }

      if (data.apiKeys) {
        updatedUser.apiKeys = data.apiKeys;
      }

      updatedUser.updated_at = Date.now();

      // 사용자 정보 업데이트
      existingUsers[userIndex] = updatedUser;
      localStorage.setItem('storyboard_users', JSON.stringify(existingUsers));

      return true;
    } catch (error) {
      console.error('사용자 업데이트 실패:', error);
      throw new Error('사용자 업데이트에 실패했습니다.');
    }
  }

  // ===== API 키 관리 메서드 =====

  /**
   * 사용자 API 키 저장
   */
  async saveUserApiKey(userId: string, provider: string, apiKey: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return false;
      }

      const user = existingUsers[userIndex];
      
      // API 키 저장 (암호화 없이 간단하게 저장)
      if (!user.apiKeys) {
        user.apiKeys = {};
      }
      user.apiKeys[provider] = apiKey;
      user.updated_at = Date.now();

      // 사용자 정보 업데이트
      existingUsers[userIndex] = user;
      localStorage.setItem('storyboard_users', JSON.stringify(existingUsers));

      return true;
    } catch (error) {
      console.error('API 키 저장 실패:', error);
      throw new Error('API 키 저장에 실패했습니다.');
    }
  }

  /**
   * 사용자 API 키 조회
   */
  async getUserApiKey(userId: string, provider: string): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const user = existingUsers.find((u: any) => u.id === userId);

      if (!user || !user.apiKeys) {
        return null;
      }

      return user.apiKeys[provider] || null;
    } catch (error) {
      console.error('API 키 조회 실패:', error);
      throw new Error('API 키 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자의 모든 API 키 조회
   */
  async getUserApiKeys(userId: string): Promise<{[provider: string]: string}> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const user = existingUsers.find((u: any) => u.id === userId);

      if (!user || !user.apiKeys) {
        return {};
      }

      return user.apiKeys;
    } catch (error) {
      console.error('API 키 목록 조회 실패:', error);
      throw new Error('API 키 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 사용자 API 키 삭제
   */
  async deleteUserApiKey(userId: string, provider: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      // localStorage에서 사용자 찾기
      const existingUsers = JSON.parse(localStorage.getItem('storyboard_users') || '[]');
      const userIndex = existingUsers.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return false;
      }

      const user = existingUsers[userIndex];
      
      if (!user.apiKeys || !user.apiKeys[provider]) {
        return false;
      }

      // API 키 삭제
      delete user.apiKeys[provider];
      user.updated_at = Date.now();

      // 사용자 정보 업데이트
      existingUsers[userIndex] = user;
      localStorage.setItem('storyboard_users', JSON.stringify(existingUsers));

      return true;
    } catch (error) {
      console.error('API 키 삭제 실패:', error);
      throw new Error('API 키 삭제에 실패했습니다.');
    }
  }

  // ===== 템플릿 관리 메서드 =====

  /**
   * 프롬프트 템플릿 저장
   */
  async savePromptTemplate(userId: string, name: string, category: string, templateData: any): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const templateId = this.generateTemplateId();
      const now = Date.now();

      const stmt = this.db.prepare(`
        INSERT INTO prompt_templates
        (id, user_id, name, category, template_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        templateId,
        userId,
        name,
        category,
        JSON.stringify(templateData),
        now,
        now
      ]);

      this.saveDatabase();
      return templateId;
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      throw new Error('템플릿 저장에 실패했습니다.');
    }
  }

  /**
   * 프롬프트 템플릿 로드
   */
  async loadPromptTemplate(templateId: string): Promise<any | null> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const stmt = this.db.prepare(`
        SELECT t.*, u.name as user_name
        FROM prompt_templates t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = ?
      `);
      const result = stmt.get([templateId]);

      if (!result) {
        return null;
      }

      return {
        ...result,
        template_data: JSON.parse(result.template_data)
      };
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      throw new Error('템플릿 로드에 실패했습니다.');
    }
  }

  /**
   * 프롬프트 템플릿 목록 조회
   */
  async listPromptTemplates(userId: string, category?: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      let sql = `
        SELECT t.*, u.name as user_name
        FROM prompt_templates t
        JOIN users u ON t.user_id = u.id
        WHERE (t.user_id = ? OR t.is_public = 1)
      `;

      const params = [userId];

      if (category) {
        sql += ' AND t.category = ?';
        params.push(category);
      }

      sql += ' ORDER BY t.created_at DESC';

      const stmt = this.db.prepare(sql);
      const results = stmt.all(params);

      return results.map((row: any) => ({
        ...row,
        template_data: JSON.parse(row.template_data)
      }));
    } catch (error) {
      console.error('템플릿 목록 조회 실패:', error);
      throw new Error('템플릿 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 프롬프트 템플릿 삭제
   */
  async deletePromptTemplate(templateId: string): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const stmt = this.db.prepare('DELETE FROM prompt_templates WHERE id = ?');
      const result = stmt.run([templateId]);
      this.saveDatabase();

      return result.changes > 0;
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      throw new Error('템플릿 삭제에 실패했습니다.');
    }
  }

  // ===== 사용량 통계 메서드 =====

  /**
   * 사용량 기록
   */
  async recordUsage(userId: string, actionType: string, aiProvider?: string, tokenCount?: number, cost?: number): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO usage_stats
        (user_id, action_type, ai_provider, token_count, cost, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        userId,
        actionType,
        aiProvider || null,
        tokenCount || 0,
        cost || 0.0,
        Date.now()
      ]);

      this.saveDatabase();
      return true;
    } catch (error) {
      console.error('사용량 기록 실패:', error);
      throw new Error('사용량 기록에 실패했습니다.');
    }
  }

  /**
   * 사용량 통계 조회
   */
  async getUserUsageStats(userId: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('데이터베이스가 초기화되지 않았습니다.');
    }

    try {
      let sql = 'SELECT * FROM usage_stats WHERE user_id = ?';
      const params = [userId];

      if (startDate) {
        sql += ' AND timestamp >= ?';
        params.push(startDate.getTime().toString());
      }

      if (endDate) {
        sql += ' AND timestamp <= ?';
        params.push(endDate.getTime().toString());
      }

      sql += ' ORDER BY timestamp DESC';

      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      console.error('사용량 통계 조회 실패:', error);
      throw new Error('사용량 통계 조회에 실패했습니다.');
    }
  }

  // ===== 유틸리티 메서드 =====

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
   * API 키 암호화 (간단한 Base64 인코딩)
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
}

// 싱글톤 인스턴스
export const databaseService = new SQLiteDatabaseService();
