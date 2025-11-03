/**
 * MySQL 기반 텍스트 데이터 관리 서비스
 */
import { getConnectionPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type TextCategory = 
  | 'project' 
  | 'story' 
  | 'character' 
  | 'scenario' 
  | 'dialogue' 
  | 'prompt' 
  | 'template'
  | 'other';

export interface TextData {
  id: string;
  userId: string;
  category: TextCategory;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface TextDataCreateInput {
  userId: string;
  category: TextCategory;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface TextDataUpdateInput {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export class MySQLTextDataService {
  private pool = getConnectionPool();

  /**
   * 텍스트 데이터 생성
   */
  async createTextData(input: TextDataCreateInput): Promise<string> {
    try {
      const id = uuidv4();
      const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

      await this.pool.execute(
        `INSERT INTO text_data (id, user_id, category, title, content, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.userId, input.category, input.title, input.content, metadataJson]
      );

      return id;
    } catch (error) {
      console.error('텍스트 데이터 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 텍스트 데이터 조회
   */
  async getTextDataById(textDataId: string): Promise<TextData | null> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, user_id, category, title, content, metadata, created_at, updated_at, is_deleted
         FROM text_data 
         WHERE id = ? AND is_deleted = FALSE`,
        [textDataId]
      ) as [any[], any];

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        category: row.category,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted
      };
    } catch (error) {
      console.error('텍스트 데이터 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자별 텍스트 데이터 목록 조회
   */
  async getTextDataList(
    userId: string,
    options?: {
      category?: TextCategory;
      search?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'title';
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<TextData[]> {
    try {
      let query = `
        SELECT id, user_id, category, title, content, metadata, created_at, updated_at, is_deleted
        FROM text_data 
        WHERE user_id = ? AND is_deleted = FALSE
      `;
      const params: any[] = [userId];

      if (options?.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      if (options?.search) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm);
      }

      const orderBy = options?.orderBy || 'created_at';
      const orderDirection = options?.orderDirection || 'DESC';
      query += ` ORDER BY ${orderBy} ${orderDirection}`;

      if (options?.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);

        if (options?.offset) {
          query += ' OFFSET ?';
          params.push(options.offset);
        }
      }

      const [rows] = await this.pool.execute(query, params) as [any[], any];

      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted
      }));
    } catch (error) {
      console.error('텍스트 데이터 목록 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 텍스트 데이터 수정
   */
  async updateTextData(
    textDataId: string,
    userId: string,
    input: TextDataUpdateInput
  ): Promise<boolean> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (input.title !== undefined) {
        updates.push('title = ?');
        params.push(input.title);
      }

      if (input.content !== undefined) {
        updates.push('content = ?');
        params.push(input.content);
      }

      if (input.metadata !== undefined) {
        updates.push('metadata = ?');
        params.push(JSON.stringify(input.metadata));
      }

      if (updates.length === 0) {
        return false;
      }

      updates.push('updated_at = NOW()');
      params.push(textDataId, userId);

      const result = await this.pool.execute(
        `UPDATE text_data 
         SET ${updates.join(', ')}
         WHERE id = ? AND user_id = ? AND is_deleted = FALSE`,
        params
      ) as any;

      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('텍스트 데이터 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 텍스트 데이터 삭제 (소프트 삭제)
   */
  async deleteTextData(textDataId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.pool.execute(
        `UPDATE text_data 
         SET is_deleted = TRUE, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [textDataId, userId]
      ) as any;

      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('텍스트 데이터 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * 텍스트 데이터 검색 (전체 텍스트 검색)
   */
  async searchTextData(
    userId: string,
    searchTerm: string,
    category?: TextCategory,
    limit: number = 20
  ): Promise<TextData[]> {
    try {
      let query = `
        SELECT id, user_id, category, title, content, metadata, created_at, updated_at, is_deleted
        FROM text_data 
        WHERE user_id = ? AND is_deleted = FALSE
          AND MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
      `;
      const params: any[] = [userId, searchTerm];

      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const [rows] = await this.pool.execute(query, params) as [any[], any];

      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        title: row.title,
        content: row.content,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted
      }));
    } catch (error) {
      console.error('텍스트 데이터 검색 오류:', error);
      throw error;
    }
  }

  /**
   * 카테고리별 텍스트 데이터 개수 조회
   */
  async getTextDataCountByCategory(userId: string): Promise<Record<TextCategory, number>> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT category, COUNT(*) as count
         FROM text_data 
         WHERE user_id = ? AND is_deleted = FALSE
         GROUP BY category`,
        [userId]
      ) as [any[], any];

      const counts: Record<string, number> = {};
      rows.forEach((row: any) => {
        counts[row.category] = row.count;
      });

      return counts as Record<TextCategory, number>;
    } catch (error) {
      console.error('텍스트 데이터 개수 조회 오류:', error);
      throw error;
    }
  }
}

export const mysqlTextDataService = new MySQLTextDataService();

