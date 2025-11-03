/**
 * MySQL 데이터베이스 연결 설정
 */
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit?: number;
  waitForConnections?: boolean;
  queueLimit?: number;
}

/**
 * 데이터베이스 연결 설정 가져오기
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'storyboard_db',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10', 10),
    waitForConnections: true,
    queueLimit: 0
  };
};

/**
 * 데이터베이스 연결 풀 생성
 */
let pool: mysql.Pool | null = null;

export const getConnectionPool = (): mysql.Pool => {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = mysql.createPool({
      ...config,
      charset: 'utf8mb4',
      timezone: '+00:00'
    });

    // 연결 테스트
    pool.getConnection()
      .then((connection) => {
        console.log('✅ MySQL 연결 성공');
        connection.release();
      })
      .catch((error) => {
        console.error('❌ MySQL 연결 실패:', error);
      });
  }

  return pool;
};

/**
 * 연결 풀 종료
 */
export const closeConnectionPool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL 연결 풀 종료');
  }
};

