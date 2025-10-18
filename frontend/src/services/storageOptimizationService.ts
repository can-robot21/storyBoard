/**
 * 저장 상태 개선 서비스
 * 데이터 압축, 중복 제거, 효율적 저장 관리
 */

import { dataCacheService } from './dataCacheService';

interface StorageOptimization {
  compressionRatio: number;
  deduplicationRatio: number;
  totalSavings: number;
  recommendations: string[];
}

interface StorageStatus {
  localStorage: {
    used: number;
    available: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  indexedDB: {
    connected: boolean;
    databaseName: string;
    version: number;
    objectStores: string[];
    estimatedSize: number;
  };
  recommendations: string[];
}


export class StorageOptimizationService {
  private static instance: StorageOptimizationService;
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private readonly DEDUPLICATION_THRESHOLD = 0.8; // 80% 유사도
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한
  private readonly CLEANUP_THRESHOLD = 0.8; // 80% 사용 시 정리
  private readonly WARNING_THRESHOLD = 0.7; // 70%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%

  private constructor() {}

  static getInstance(): StorageOptimizationService {
    if (!StorageOptimizationService.instance) {
      StorageOptimizationService.instance = new StorageOptimizationService();
    }
    return StorageOptimizationService.instance;
  }

  /**
   * 안전한 데이터 저장 (용량 체크 및 압축)
   */
  async setItem(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      const dataSize = new Blob([serializedData]).size;

      // 용량 체크
      await this.checkStorageCapacity(dataSize);

      // 큰 데이터는 압축
      if (dataSize > this.COMPRESSION_THRESHOLD) {
        const compressedData = await this.compressData(data);
        const compressedSize = new Blob([compressedData]).size;
        
        if (compressedSize < dataSize) {
          localStorage.setItem(key, compressedData);
          localStorage.setItem(`${key}_compressed`, 'true');
          console.log(`📦 데이터 압축 저장: ${key} (${dataSize} → ${compressedSize} bytes)`);
          return;
        }
      }

      // 일반 저장
      localStorage.setItem(key, serializedData);
      localStorage.removeItem(`${key}_compressed`);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('🚨 스토리지 용량 초과, 정리 시작');
        await this.cleanupStorage();
        
        // 재시도
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (retryError) {
          console.error('❌ 스토리지 정리 후에도 저장 실패:', retryError);
          throw new Error('스토리지 용량이 부족합니다. 불필요한 데이터를 삭제해주세요.');
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * 안전한 데이터 로드 (압축 해제)
   */
  getItem(key: string): any {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const isCompressed = localStorage.getItem(`${key}_compressed`) === 'true';
      
      if (isCompressed) {
        return this.decompressData(data);
      }
      
      return JSON.parse(data);
    } catch (error) {
      console.error(`데이터 로드 실패: ${key}`, error);
      return null;
    }
  }

  /**
   * 스토리지 용량 체크
   */
  private async checkStorageCapacity(requiredSize: number): Promise<void> {
    const stats = this.getStorageStats();
    
    if (stats.totalSize + requiredSize > this.MAX_STORAGE_SIZE * this.CLEANUP_THRESHOLD) {
      await this.cleanupStorage();
    }
  }

  /**
   * 스토리지 통계 조회
   */
  getStorageStats(): { totalSize: number; availableSpace: number; itemCount: number; largestItems: Array<{ key: string; size: number }> } {
    const items: Array<{ key: string; size: number }> = [];
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      const size = new Blob([value]).size;
      totalSize += size;

      items.push({ key, size });
    }

    // 크기순 정렬
    const largestItems = items
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalSize,
      availableSpace: this.MAX_STORAGE_SIZE - totalSize,
      itemCount: items.length,
      largestItems
    };
  }

  /**
   * 전체 스토리지 초기화
   */
  clearAllStorage(): void {
    try {
      localStorage.clear();
      console.log('🗑️ 전체 스토리지 초기화 완료');
    } catch (error) {
      console.error('❌ 스토리지 초기화 실패:', error);
    }
  }

  /**
   * 에피소드 구조 데이터 최적화 저장 (캐싱 적용)
   */
  async saveEpisodeStructure(episodes: any[]): Promise<void> {
    try {
      // 데이터 최적화
      const optimizedEpisodes = episodes.map(episode => ({
        id: episode.id,
        title: episode.title?.trim() || '',
        description: episode.description?.trim() || '',
        scenes: episode.scenes?.map((scene: any) => ({
          id: scene.id,
          title: scene.title?.trim() || '',
          description: scene.description?.trim() || '',
          cuts: scene.cuts || 1
        })) || []
      }));

      // 캐시와 localStorage에 동시 저장
      dataCacheService.setToStorage('episodeStructureData', optimizedEpisodes, 10 * 60 * 1000); // 10분 TTL
      
      console.log('✅ 에피소드 구조 데이터 저장 완료 (캐싱 적용)');
    } catch (error) {
      console.error('❌ 에피소드 구조 데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 에피소드 구조 데이터 로드 (캐싱 적용)
   */
  loadEpisodeStructure(): any[] {
    try {
      // 캐시에서 먼저 조회
      const cachedData = dataCacheService.getFromStorage('episodeStructureData', []);
      return Array.isArray(cachedData) ? cachedData : [];
    } catch (error) {
      console.error('❌ 에피소드 구조 데이터 로드 실패:', error);
      return [];
    }
  }

  /**
   * 상세 사용량 조회
   */
  async getDetailedUsage(): Promise<any[]> {
    try {
      const usage: any[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const size = new Blob([value]).size;
        let type = 'string';
        let itemCount = 0;

        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            type = 'array';
            itemCount = parsed.length;
          } else if (typeof parsed === 'object') {
            type = 'object';
            itemCount = Object.keys(parsed).length;
          }
        } catch {
          type = 'string';
        }

        usage.push({
          key,
          size,
          type,
          itemCount
        });
      }

      return usage.sort((a, b) => b.size - a.size);
    } catch (error) {
      console.error('상세 사용량 조회 실패:', error);
      return [];
    }
  }

  /**
   * 저장 상태 건강도 조회
   */
  async getStorageHealth(): Promise<any> {
    try {
      const status = await this.getStorageStatus();
      return status;
    } catch (error) {
      console.error('저장 상태 건강도 조회 실패:', error);
      return null;
    }
  }

  /**
   * 스토리지 정리 실행
   */
  async cleanupStorage(): Promise<{ cleanedItems: number; freedSpace: number; errors: string[] }> {
    try {
      let cleanedItems = 0;
      let freedSpace = 0;
      const errors: string[] = [];

      // 임시 데이터 정리
      const tempKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp_') || key.includes('cache_'))) {
          const value = localStorage.getItem(key);
          if (value) {
            freedSpace += new Blob([value]).size;
            tempKeys.push(key);
          }
        }
      }

      tempKeys.forEach(key => {
        localStorage.removeItem(key);
        cleanedItems++;
      });

      return {
        cleanedItems,
        freedSpace,
        errors
      };
    } catch (error) {
      console.error('스토리지 정리 실패:', error);
      return {
        cleanedItems: 0,
        freedSpace: 0,
        errors: [error instanceof Error ? error.message : '알 수 없는 오류']
      };
    }
  }
  async getStorageStatus(): Promise<StorageStatus> {
    const localStorageStatus = this.getLocalStorageStatus();
    const indexedDBStatus = await this.getIndexedDBStatus();
    const recommendations = this.generateRecommendations(localStorageStatus, indexedDBStatus);

    return {
      localStorage: localStorageStatus,
      indexedDB: indexedDBStatus,
      recommendations
    };
  }

  /**
   * localStorage 상태 조회
   */
  private getLocalStorageStatus() {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          used += new Blob([value]).size;
        }
      }
    }

    const percentage = used / this.MAX_STORAGE_SIZE;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (percentage >= this.CRITICAL_THRESHOLD) {
      status = 'critical';
    } else if (percentage >= this.WARNING_THRESHOLD) {
      status = 'warning';
    }

    return {
      used,
      available: this.MAX_STORAGE_SIZE - used,
      percentage,
      status
    };
  }

  /**
   * IndexedDB 상태 조회
   */
  private async getIndexedDBStatus() {
    try {
      const databases = await indexedDB.databases();
      const db = databases.find(db => db.name?.includes('storyboard'));
      
      if (!db) {
        return {
          connected: false,
          databaseName: '',
          version: 0,
          objectStores: [],
          estimatedSize: 0
        };
      }

      return {
        connected: true,
        databaseName: db.name || '',
        version: db.version || 0,
        objectStores: [], // 실제 구현에서는 object store 목록 가져오기
        estimatedSize: 0 // 실제 구현에서는 크기 계산
      };
    } catch (error) {
      return {
        connected: false,
        databaseName: '',
        version: 0,
        objectStores: [],
        estimatedSize: 0
      };
    }
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(localStorageStatus: any, indexedDBStatus: any): string[] {
    const recommendations: string[] = [];

    if (localStorageStatus.status === 'critical') {
      recommendations.push('🚨 저장 공간이 부족합니다. 즉시 정리가 필요합니다.');
    } else if (localStorageStatus.status === 'warning') {
      recommendations.push('⚠️ 저장 공간이 부족해지고 있습니다. 정리를 권장합니다.');
    }

    if (localStorageStatus.percentage > 0.5) {
      recommendations.push('💾 데이터 압축을 고려해보세요.');
    }

    if (!indexedDBStatus.connected) {
      recommendations.push('🗄️ IndexedDB 연결을 확인해주세요.');
    }

    return recommendations;
  }

  /**
   * 특정 키의 상세 정보 조회
   */
  getKeyDetails(key: string) {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      const size = new Blob([value]).size;
      let itemCount = 0;
      let preview = '';

      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
          preview = JSON.stringify(parsed.slice(0, 2), null, 2);
        } else if (typeof parsed === 'object') {
          itemCount = Object.keys(parsed).length;
          preview = JSON.stringify(parsed, null, 2).substring(0, 200);
        } else {
          preview = value.substring(0, 200);
        }
      } catch {
        preview = value.substring(0, 200);
      }

      return {
        key,
        size,
        type: Array.isArray(JSON.parse(value)) ? 'array' : typeof JSON.parse(value),
        itemCount,
        preview
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 특정 키 삭제
   */
  deleteKey(key: string): boolean {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_compressed`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 배열 항목 선택적 삭제
   */
  deleteArrayItems(key: string, indices: number[]): boolean {
    try {
      const value = localStorage.getItem(key);
      if (!value) return false;

      const data = JSON.parse(value);
      if (!Array.isArray(data)) return false;

      // 역순으로 정렬하여 삭제 (인덱스 변경 방지)
      const sortedIndices = indices.sort((a, b) => b - a);
      sortedIndices.forEach(index => {
        if (index >= 0 && index < data.length) {
          data.splice(index, 1);
        }
      });

      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 데이터 압축 (간단한 압축)
   */
  private async compressData(data: any): Promise<string> {
    try {
      // JSON 압축을 위한 간단한 최적화
      const optimizedData = this.optimizeDataStructure(data);
      return JSON.stringify(optimizedData);
    } catch (error) {
      console.error('데이터 압축 실패:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * 압축 해제
   */
  private decompressData(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('데이터 압축 해제 실패:', error);
      return null;
    }
  }

  /**
   * 저장 상태 분석 및 최적화 제안
   */
  async analyzeStorageOptimization(): Promise<StorageOptimization> {
    const recommendations: string[] = [];
    let compressionRatio = 0;
    let deduplicationRatio = 0;
    let totalSavings = 0;

    try {
      // 1. 압축 가능한 데이터 분석
      const compressionAnalysis = await this.analyzeCompressionOpportunities();
      compressionRatio = compressionAnalysis.ratio;
      totalSavings += compressionAnalysis.savings;

      if (compressionAnalysis.ratio > 0.1) {
        recommendations.push(`📦 ${(compressionAnalysis.ratio * 100).toFixed(1)}% 압축 가능 (${(compressionAnalysis.savings / 1024).toFixed(1)}KB 절약)`);
      }

      // 2. 중복 데이터 분석
      const deduplicationAnalysis = await this.analyzeDuplicates();
      deduplicationRatio = deduplicationAnalysis.ratio;
      totalSavings += deduplicationAnalysis.savings;

      if (deduplicationAnalysis.ratio > 0.05) {
        recommendations.push(`🔄 ${(deduplicationAnalysis.ratio * 100).toFixed(1)}% 중복 제거 가능 (${(deduplicationAnalysis.savings / 1024).toFixed(1)}KB 절약)`);
      }

      // 3. 오래된 데이터 분석
      const oldDataAnalysis = await this.analyzeOldData();
      if (oldDataAnalysis.size > 0) {
        recommendations.push(`🗑️ ${(oldDataAnalysis.size / 1024).toFixed(1)}KB 오래된 데이터 정리 가능`);
        totalSavings += oldDataAnalysis.size;
      }

      // 4. 구조 최적화 분석
      const structureAnalysis = await this.analyzeStructureOptimization();
      if (structureAnalysis.savings > 0) {
        recommendations.push(`🏗️ 구조 최적화로 ${(structureAnalysis.savings / 1024).toFixed(1)}KB 절약 가능`);
        totalSavings += structureAnalysis.savings;
      }

      // 5. 일반적인 권장사항
      if (recommendations.length === 0) {
        recommendations.push('✅ 저장 상태가 최적화되어 있습니다.');
        recommendations.push('💡 정기적인 백업을 권장합니다.');
      } else {
        recommendations.push('🚀 위 최적화를 적용하면 상당한 용량을 절약할 수 있습니다.');
      }

    } catch (error) {
      console.error('저장 상태 분석 실패:', error);
      recommendations.push('❌ 분석 중 오류가 발생했습니다.');
    }

    return {
      compressionRatio,
      deduplicationRatio,
      totalSavings,
      recommendations
    };
  }

  /**
   * 압축 가능한 데이터 분석
   */
  private async analyzeCompressionOpportunities(): Promise<{ ratio: number; savings: number }> {
    let totalSize = 0;
    let compressibleSize = 0;
    let potentialSavings = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const size = new Blob([value]).size;
        totalSize += size;

        // 압축 가능한 데이터 확인
        if (size > this.COMPRESSION_THRESHOLD && !key.includes('_compressed')) {
          compressibleSize += size;
          
          // 간단한 압축률 추정 (실제로는 더 복잡한 알고리즘 사용)
          const estimatedCompressedSize = size * 0.7; // 30% 압축 가정
          potentialSavings += (size - estimatedCompressedSize);
        }
      }

      const ratio = totalSize > 0 ? compressibleSize / totalSize : 0;
      return { ratio, savings: potentialSavings };
    } catch (error) {
      console.error('압축 분석 실패:', error);
      return { ratio: 0, savings: 0 };
    }
  }

  /**
   * 중복 데이터 분석
   */
  private async analyzeDuplicates(): Promise<{ ratio: number; savings: number }> {
    const dataMap = new Map<string, { keys: string[]; size: number }>();
    let totalSize = 0;
    let duplicateSize = 0;

    try {
      // 데이터 해시 기반 중복 검사
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const size = new Blob([value]).size;
        totalSize += size;

        // 간단한 해시 생성 (실제로는 더 정교한 해시 사용)
        const hash = this.simpleHash(value);
        
        if (dataMap.has(hash)) {
          const existing = dataMap.get(hash)!;
          existing.keys.push(key);
          duplicateSize += size;
        } else {
          dataMap.set(hash, { keys: [key], size });
        }
      }

      const ratio = totalSize > 0 ? duplicateSize / totalSize : 0;
      return { ratio, savings: duplicateSize };
    } catch (error) {
      console.error('중복 분석 실패:', error);
      return { ratio: 0, savings: 0 };
    }
  }

  /**
   * 오래된 데이터 분석
   */
  private async analyzeOldData(): Promise<{ size: number; count: number }> {
    let oldDataSize = 0;
    let oldDataCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // 오래된 데이터 패턴 확인
        if (this.isOldDataKey(key)) {
          const value = localStorage.getItem(key);
          if (!value) continue;

          const size = new Blob([value]).size;
          oldDataSize += size;
          oldDataCount++;
        }
      }

      return { size: oldDataSize, count: oldDataCount };
    } catch (error) {
      console.error('오래된 데이터 분석 실패:', error);
      return { size: 0, count: 0 };
    }
  }

  /**
   * 구조 최적화 분석
   */
  private async analyzeStructureOptimization(): Promise<{ savings: number }> {
    let potentialSavings = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        try {
          const data = JSON.parse(value);
          const optimizedData = this.optimizeDataStructure(data);
          const originalSize = new Blob([value]).size;
          const optimizedSize = new Blob([JSON.stringify(optimizedData)]).size;
          
          if (optimizedSize < originalSize) {
            potentialSavings += (originalSize - optimizedSize);
          }
        } catch (error) {
          // JSON이 아닌 데이터는 무시
        }
      }

      return { savings: potentialSavings };
    } catch (error) {
      console.error('구조 최적화 분석 실패:', error);
      return { savings: 0 };
    }
  }

  /**
   * 간단한 해시 함수
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString();
  }

  /**
   * 오래된 데이터 키 패턴 확인
   */
  private isOldDataKey(key: string): boolean {
    const oldPatterns = [
      '_old',
      '_temp',
      '_backup_old',
      '_cache_old',
      '_log_old'
    ];
    
    return oldPatterns.some(pattern => key.includes(pattern));
  }

  /**
   * 데이터 구조 최적화
   */
  private optimizeDataStructure(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeDataStructure(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const optimized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // 빈 값 제거
        if (value !== null && value !== undefined && value !== '') {
          optimized[key] = this.optimizeDataStructure(value);
        }
      }
      return optimized;
    }
    
    return data;
  }

  /**
   * 저장 최적화 실행
   */
  async executeOptimization(): Promise<{
    compressed: number;
    deduplicated: number;
    cleaned: number;
    totalSavings: number;
    errors: string[];
  }> {
    const result = {
      compressed: 0,
      deduplicated: 0,
      cleaned: 0,
      totalSavings: 0,
      errors: [] as string[]
    };

    try {
      // 1. 압축 실행
      const compressionResult = await this.executeCompression();
      result.compressed = compressionResult.count;
      result.totalSavings += compressionResult.savings;

      // 2. 중복 제거 실행
      const deduplicationResult = await this.executeDeduplication();
      result.deduplicated = deduplicationResult.count;
      result.totalSavings += deduplicationResult.savings;

      // 3. 오래된 데이터 정리
      const cleanupResult = await this.executeCleanup();
      result.cleaned = cleanupResult.count;
      result.totalSavings += cleanupResult.savings;

    } catch (error) {
      result.errors.push(`최적화 실행 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * 압축 실행 (public)
   */
  public async executeCompression(): Promise<{ count: number; savings: number }> {
    let compressedCount = 0;
    let totalSavings = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || key.includes('_compressed')) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const size = new Blob([value]).size;
        if (size > this.COMPRESSION_THRESHOLD) {
          try {
            const data = JSON.parse(value);
            const optimizedData = this.optimizeDataStructure(data);
            const compressedValue = JSON.stringify(optimizedData);
            const compressedSize = new Blob([compressedValue]).size;

            if (compressedSize < size) {
              localStorage.setItem(key, compressedValue);
              localStorage.setItem(`${key}_compressed`, 'true');
              compressedCount++;
              totalSavings += (size - compressedSize);
            }
          } catch (error) {
            // JSON이 아닌 데이터는 압축하지 않음
          }
        }
      }
    } catch (error) {
      console.error('압축 실행 실패:', error);
    }

    return { count: compressedCount, savings: totalSavings };
  }

  /**
   * 중복 제거 실행 (public)
   */
  public async executeDeduplication(): Promise<{ count: number; savings: number }> {
    const dataMap = new Map<string, { keys: string[]; size: number }>();
    let deduplicatedCount = 0;
    let totalSavings = 0;

    try {
      // 중복 데이터 식별
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const value = localStorage.getItem(key);
        if (!value) continue;

        const hash = this.simpleHash(value);
        
        if (dataMap.has(hash)) {
          const existing = dataMap.get(hash)!;
          existing.keys.push(key);
        } else {
          dataMap.set(hash, { keys: [key], size: new Blob([value]).size });
        }
      }

      // 중복 데이터 제거
      for (const [, data] of dataMap) {
        if (data.keys.length > 1) {
          // 첫 번째 키는 유지하고 나머지는 제거
          const keysToRemove = data.keys.slice(1);
          
          for (const key of keysToRemove) {
            localStorage.removeItem(key);
            deduplicatedCount++;
            totalSavings += data.size;
          }
        }
      }
    } catch (error) {
      console.error('중복 제거 실행 실패:', error);
    }

    return { count: deduplicatedCount, savings: totalSavings };
  }

  /**
   * 정리 실행
   */
  private async executeCleanup(): Promise<{ count: number; savings: number }> {
    let cleanedCount = 0;
    let totalSavings = 0;

    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (this.isOldDataKey(key)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSavings += new Blob([value]).size;
          }
          keysToRemove.push(key);
        }
      }

      // 오래된 데이터 삭제
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_compressed`);
        cleanedCount++;
      }
    } catch (error) {
      console.error('정리 실행 실패:', error);
    }

    return { count: cleanedCount, savings: totalSavings };
  }

  /**
   * 저장 상태 리포트 생성
   */
  generateStorageReport(optimization: StorageOptimization): string {
    let report = `📊 저장 상태 최적화 리포트\n\n`;
    
    report += `💾 총 절약 가능 용량: ${(optimization.totalSavings / 1024).toFixed(1)}KB\n`;
    report += `📦 압축 가능 비율: ${(optimization.compressionRatio * 100).toFixed(1)}%\n`;
    report += `🔄 중복 제거 가능 비율: ${(optimization.deduplicationRatio * 100).toFixed(1)}%\n\n`;
    
    report += `💡 권장사항:\n`;
    optimization.recommendations.forEach(rec => {
      report += `   ${rec}\n`;
    });
    
    return report;
  }
}

export const storageOptimizationService = StorageOptimizationService.getInstance();