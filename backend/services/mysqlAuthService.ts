/**
 * MySQL 기반 인증 서비스
 */
import { getConnectionPool } from '../config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'premium' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  message?: string;
}

export class MySQLAuthService {
  private pool = getConnectionPool();

  /**
   * 사용자 인증
   */
  async authenticate(email: string, password: string): Promise<string | null> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, password_hash, is_active 
         FROM users 
         WHERE email = ? AND is_active = TRUE`,
        [email]
      ) as [any[], any];

      if (rows.length === 0) {
        return null;
      }

      const user = rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return null;
      }

      // 마지막 로그인 시간 업데이트
      await this.pool.execute(
        `UPDATE users 
         SET last_login_at = NOW() 
         WHERE id = ?`,
        [user.id]
      );

      return user.id;
    } catch (error) {
      console.error('인증 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 조회
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, email, name, role, created_at, updated_at, last_login_at, is_active
         FROM users 
         WHERE id = ? AND is_active = TRUE`,
        [userId]
      ) as [any[], any];

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at || undefined,
        isActive: row.is_active
      };
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 이메일로 사용자 조회
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, email, name, role, created_at, updated_at, last_login_at, is_active
         FROM users 
         WHERE email = ? AND is_active = TRUE`,
        [email]
      ) as [any[], any];

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at || undefined,
        isActive: row.is_active
      };
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 생성
   */
  async createUser(
    email: string,
    name: string,
    password: string,
    role: 'user' | 'premium' | 'admin' = 'user'
  ): Promise<string> {
    try {
      // 이메일 중복 확인
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        throw new Error('이미 사용 중인 이메일입니다.');
      }

      // 비밀번호 해시화
      const passwordHash = await bcrypt.hash(password, 10);

      // 사용자 ID 생성
      const userId = uuidv4();

      // 사용자 생성
      await this.pool.execute(
        `INSERT INTO users (id, email, name, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, email, name, passwordHash, role]
      );

      return userId;
    } catch (error: any) {
      console.error('사용자 생성 오류:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 사용 중인 이메일입니다.');
      }
      throw error;
    }
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(userId: string, data: {
    name?: string;
    email?: string;
    role?: 'user' | 'premium' | 'admin';
  }): Promise<boolean> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.email) {
        updates.push('email = ?');
        values.push(data.email);
      }
      if (data.role) {
        updates.push('role = ?');
        values.push(data.role);
      }

      if (updates.length === 0) {
        return false;
      }

      updates.push('updated_at = NOW()');
      values.push(userId);

      await this.pool.execute(
        `UPDATE users 
         SET ${updates.join(', ')}
         WHERE id = ?`,
        values
      );

      return true;
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      throw error;
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);

      await this.pool.execute(
        `UPDATE users 
         SET password_hash = ?, updated_at = NOW()
         WHERE id = ?`,
        [passwordHash, userId]
      );

      return true;
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자 삭제 (소프트 삭제)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.pool.execute(
        `UPDATE users 
         SET is_active = FALSE, updated_at = NOW()
         WHERE id = ?`,
        [userId]
      );

      return true;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      throw error;
    }
  }
}

export const mysqlAuthService = new MySQLAuthService();

