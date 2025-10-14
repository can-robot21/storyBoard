/**
 * 데이터 캐싱 서비스
 * 중복 로드 방지 및 성능 최적화
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live (밀리초)
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class DataCacheService {
  private static instance: DataCacheService;
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0
  };

  private constructor() {}

  static getInstance(): DataCacheService {
    if (!DataCacheService.instance) {
      DataCacheService.instance = new DataCacheService();
    }
    return DataCacheService.instance;
  }

  /**
   * 데이터 캐시에 저장
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 기본 5분 TTL
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, item);
    this.updateStats();
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    this.updateStats();
    return item.data as T;
  }

  /**
   * 캐시에서 데이터 제거
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.updateStats();
    return deleted;
  }

  /**
   * 캐시 전체 초기화
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0
    };
  }

  /**
   * 만료된 캐시 항목 정리
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.updateStats();
    return cleanedCount;
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 캐시 크기 조회
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * 통계 업데이트
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * localStorage와 연동된 캐시 조회
   */
  getFromStorage<T>(key: string, defaultValue: T, ttl: number = 5 * 60 * 1000): T {
    // 먼저 메모리 캐시 확인
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // localStorage에서 조회
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        this.set(key, data, ttl); // 메모리 캐시에 저장
        return data;
      }
    } catch (error) {
      console.error(`캐시 로드 실패: ${key}`, error);
    }

    return defaultValue;
  }

  /**
   * localStorage와 연동된 캐시 저장
   */
  setToStorage<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 메모리 캐시에 저장
    this.set(key, data, ttl);

    // localStorage에도 저장
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`캐시 저장 실패: ${key}`, error);
    }
  }
}

export const dataCacheService = DataCacheService.getInstance();
