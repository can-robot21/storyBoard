/**
 * MySQL 기반 API 키 관리 서비스
 */
import { getConnectionPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// 간단한 암호화/복호화 (실제로는 더 강력한 방법 사용 권장)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface ApiKey {
  id: string;
  userId: string;
  provider: 'google' | 'chatgpt' | 'anthropic' | 'kling';
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}

export class MySQLApiKeyService {
  private pool = getConnectionPool();

  /**
   * API 키 저장
   */
  async saveApiKey(
    userId: string,
    provider: 'google' | 'chatgpt' | 'anthropic' | 'kling',
    apiKey: string
  ): Promise<boolean> {
    try {
      const encryptedKey = encrypt(apiKey);
      const keyId = uuidv4();

      // 기존 키가 있으면 업데이트, 없으면 생성
      await this.pool.execute(
        `INSERT INTO api_keys (id, user_id, provider, api_key_encrypted, is_active)
         VALUES (?, ?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE
           api_key_encrypted = VALUES(api_key_encrypted),
           updated_at = NOW(),
           is_active = TRUE`,
        [keyId, userId, provider, encryptedKey]
      );

      return true;
    } catch (error) {
      console.error('API 키 저장 오류:', error);
      throw error;
    }
  }

  /**
   * API 키 조회 (복호화)
   */
  async getApiKey(
    userId: string,
    provider: 'google' | 'chatgpt' | 'anthropic' | 'kling'
  ): Promise<string | null> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT api_key_encrypted 
         FROM api_keys 
         WHERE user_id = ? AND provider = ? AND is_active = TRUE`,
        [userId, provider]
      ) as [any[], any];

      if (rows.length === 0) {
        return null;
      }

      const encryptedKey = rows[0].api_key_encrypted;
      return decrypt(encryptedKey);
    } catch (error) {
      console.error('API 키 조회 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자의 모든 API 키 조회
   */
  async getAllApiKeys(userId: string): Promise<Record<string, string>> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT provider, api_key_encrypted 
         FROM api_keys 
         WHERE user_id = ? AND is_active = TRUE`,
        [userId]
      ) as [any[], any];

      const keys: Record<string, string> = {};

      for (const row of rows) {
        try {
          keys[row.provider] = decrypt(row.api_key_encrypted);
        } catch (error) {
          console.error(`API 키 복호화 실패 (${row.provider}):`, error);
        }
      }

      return keys;
    } catch (error) {
      console.error('API 키 조회 오류:', error);
      throw error;
    }
  }

  /**
   * API 키 사용 기록 업데이트
   */
  async recordApiKeyUsage(
    userId: string,
    provider: 'google' | 'chatgpt' | 'anthropic' | 'kling'
  ): Promise<void> {
    try {
      await this.pool.execute(
        `UPDATE api_keys 
         SET last_used_at = NOW()
         WHERE user_id = ? AND provider = ?`,
        [userId, provider]
      );
    } catch (error) {
      console.error('API 키 사용 기록 오류:', error);
      // 중요하지 않은 오류이므로 throw하지 않음
    }
  }

  /**
   * API 키 삭제 (소프트 삭제)
   */
  async deleteApiKey(
    userId: string,
    provider: 'google' | 'chatgpt' | 'anthropic' | 'kling'
  ): Promise<boolean> {
    try {
      await this.pool.execute(
        `UPDATE api_keys 
         SET is_active = FALSE, updated_at = NOW()
         WHERE user_id = ? AND provider = ?`,
        [userId, provider]
      );

      return true;
    } catch (error) {
      console.error('API 키 삭제 오류:', error);
      throw error;
    }
  }

  /**
   * API 키 목록 조회 (메타데이터만)
   */
  async getApiKeyList(userId: string): Promise<ApiKey[]> {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, user_id, provider, created_at, updated_at, last_used_at, is_active
         FROM api_keys 
         WHERE user_id = ? AND is_active = TRUE`,
        [userId]
      ) as [any[], any];

      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        provider: row.provider,
        apiKey: '', // 보안을 위해 실제 키는 반환하지 않음
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastUsedAt: row.last_used_at || undefined,
        isActive: row.is_active
      }));
    } catch (error) {
      console.error('API 키 목록 조회 오류:', error);
      throw error;
    }
  }
}

export const mysqlApiKeyService = new MySQLApiKeyService();

