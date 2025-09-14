import { ProjectState, ProjectSaveRequest, ProjectLoadResponse } from '../../types/project';

/**
 * 데이터베이스 서비스 인터페이스
 */
export interface IDatabaseService {
  saveProject(request: ProjectSaveRequest): Promise<string>;
  loadProject(projectId: string): Promise<ProjectLoadResponse | null>;
  listProjects(): Promise<ProjectLoadResponse[]>;
  deleteProject(projectId: string): Promise<boolean>;
  exportProject(projectId: string): Promise<string>;
  importProject(projectData: string): Promise<string>;
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
  private async initializeDatabase(): Promise<void> {
    try {
      // SQLite WASM 모듈 동적 로드
      const SQL = await import('sql.js');
      const response = await fetch('/sql-wasm.wasm');
      const wasmBinary = await response.arrayBuffer();
      
      this.db = new (SQL.default as any).Database(wasmBinary);
      this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('SQLite 초기화 실패:', error);
      // SQLite 사용 불가 시 localStorage로 폴백
      this.isInitialized = false;
    }
  }

  /**
   * 테이블 생성
   */
  private createTables(): void {
    if (!this.db) return;

    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `;

    const createProjectHistoryTable = `
      CREATE TABLE IF NOT EXISTS project_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id)
      )
    `;

    this.db.exec(createProjectsTable);
    this.db.exec(createProjectHistoryTable);
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
      const now = Date.now();
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, description, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        projectId,
        request.projectData.story || 'Untitled Project',
        request.projectData.story || 'No description',
        JSON.stringify(request.projectData),
        now,
        now
      ]);
      
      // 히스토리에 저장
      this.addToHistory(projectId, 'save', request.projectData);
      
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
  async listProjects(): Promise<ProjectLoadResponse[]> {
    if (!this.isInitialized) {
      return this.listFromLocalStorage();
    }

    try {
      const stmt = this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
      const results = stmt.all();
      
      return results.map((row: any) => ({
        projectId: row.id,
        projectData: JSON.parse(row.data),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString()
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
   * 히스토리에 추가
   */
  private addToHistory(projectId: string, action: string, data: any): void {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO project_history (project_id, action, data, timestamp)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        projectId,
        action,
        JSON.stringify(data),
        Date.now()
      ]);
    } catch (error) {
      console.error('히스토리 추가 실패:', error);
    }
  }

  /**
   * 프로젝트 ID 생성
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
}

// 싱글톤 인스턴스
export const databaseService = new SQLiteDatabaseService();
