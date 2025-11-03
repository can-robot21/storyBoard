/**
 * MySQL 관련 타입 정의
 */

// 인증 관련
export interface MySQLAuthResponse {
  success: boolean;
  token?: string;
  user?: MySQLUser;
  message?: string;
}

export interface MySQLUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'premium' | 'admin';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

// API 키 관련
export interface MySQLApiKey {
  id: string;
  userId: string;
  provider: 'google' | 'chatgpt' | 'anthropic' | 'kling';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export type TextCategory = 
  | 'project' 
  | 'story' 
  | 'character' 
  | 'scenario' 
  | 'dialogue' 
  | 'prompt' 
  | 'template'
  | 'other';

// 텍스트 데이터 관련
export interface MySQLTextData {
  id: string;
  userId: string;
  category: TextCategory;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface MySQLTextDataCreateInput {
  category: TextCategory;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface MySQLTextDataUpdateInput {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface MySQLTextDataListOptions {
  category?: TextCategory;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'title';
  orderDirection?: 'ASC' | 'DESC';
}

