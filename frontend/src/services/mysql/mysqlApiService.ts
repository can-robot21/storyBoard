/**
 * MySQL 백엔드 API 호출 서비스
 * 프론트엔드에서 백엔드 API를 호출하는 클라이언트 서비스
 */
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

class MySQLApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 요청 인터셉터: 토큰 추가
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터: 에러 처리
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 인증 실패 시 토큰 제거
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 인증 토큰 가져오기
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * 인증 토큰 저장
   */
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * 인증 토큰 제거
   */
  clearAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  // ==================== 인증 API ====================

  /**
   * 로그인
   */
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  /**
   * 회원가입
   */
  async register(data: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/register', data);
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.clearAuthToken();
    }
  }

  /**
   * 현재 사용자 정보 조회
   */
  async getCurrentUser(): Promise<any> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // ==================== API 키 API ====================

  /**
   * API 키 저장
   */
  async saveApiKey(
    provider: 'google' | 'chatgpt' | 'anthropic' | 'kling',
    apiKey: string
  ): Promise<boolean> {
    await this.api.post('/api-keys', { provider, apiKey });
    return true;
  }

  /**
   * API 키 조회
   */
  async getApiKey(provider: 'google' | 'chatgpt' | 'anthropic' | 'kling'): Promise<string | null> {
    try {
      const response = await this.api.get(`/api-keys/${provider}`);
      return response.data.apiKey || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 모든 API 키 조회
   */
  async getAllApiKeys(): Promise<Record<string, string>> {
    const response = await this.api.get('/api-keys');
    return response.data;
  }

  /**
   * API 키 삭제
   */
  async deleteApiKey(provider: 'google' | 'chatgpt' | 'anthropic' | 'kling'): Promise<boolean> {
    await this.api.delete(`/api-keys/${provider}`);
    return true;
  }

  // ==================== 텍스트 데이터 API ====================

  /**
   * 텍스트 데이터 생성
   */
  async createTextData(data: {
    category: string;
    title: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const response = await this.api.post('/text-data', data);
    return response.data.id;
  }

  /**
   * 텍스트 데이터 조회
   */
  async getTextData(textDataId: string): Promise<any> {
    const response = await this.api.get(`/text-data/${textDataId}`);
    return response.data;
  }

  /**
   * 텍스트 데이터 목록 조회
   */
  async getTextDataList(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any[]> {
    const response = await this.api.get('/text-data', { params: options });
    return response.data;
  }

  /**
   * 텍스트 데이터 수정
   */
  async updateTextData(
    textDataId: string,
    data: {
      title?: string;
      content?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    await this.api.put(`/text-data/${textDataId}`, data);
    return true;
  }

  /**
   * 텍스트 데이터 삭제
   */
  async deleteTextData(textDataId: string): Promise<boolean> {
    await this.api.delete(`/text-data/${textDataId}`);
    return true;
  }

  /**
   * 텍스트 데이터 검색
   */
  async searchTextData(
    searchTerm: string,
    category?: string,
    limit?: number
  ): Promise<any[]> {
    const response = await this.api.get('/text-data/search', {
      params: { q: searchTerm, category, limit }
    });
    return response.data;
  }
}

export const mysqlApiService = new MySQLApiService();

