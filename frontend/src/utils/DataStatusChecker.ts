// utils/DataStatusChecker.ts
import { BrowserDatabaseService } from '../services/database/DatabaseService';

export interface DataStatusReport {
  indexedDB: {
    exists: boolean;
    version: number;
    objectStores: string[];
    recordCounts: { [store: string]: number };
  };
  localStorage: {
    totalKeys: number;
    totalSize: number;
    keyDetails: { [key: string]: { size: number; lastModified: string } };
  };
  dataConsistency: {
    conflicts: string[];
    duplicates: string[];
    missingData: string[];
  };
  recommendations: string[];
}

export class DataStatusChecker {
  private dbService: BrowserDatabaseService;

  constructor() {
    this.dbService = new BrowserDatabaseService();
  }

  /**
   * 전체 데이터 상태 점검
   */
  async checkDataStatus(): Promise<DataStatusReport> {
    const report: DataStatusReport = {
      indexedDB: await this.checkIndexedDB(),
      localStorage: await this.checkLocalStorage(),
      dataConsistency: await this.checkDataConsistency(),
      recommendations: []
    };

    // 권장사항 생성
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * IndexedDB 상태 점검
   */
  private async checkIndexedDB(): Promise<DataStatusReport['indexedDB']> {
    try {
      const db = await this.openIndexedDB();
      const objectStores = Array.from(db.objectStoreNames);
      const recordCounts: { [store: string]: number } = {};

      // 각 Object Store의 레코드 수 확인
      for (const storeName of objectStores) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();
        
        recordCounts[storeName] = await new Promise((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = () => reject(countRequest.error);
        });
      }

      return {
        exists: true,
        version: db.version,
        objectStores,
        recordCounts
      };
    } catch (error) {
      console.error('IndexedDB 점검 실패:', error);
      return {
        exists: false,
        version: 0,
        objectStores: [],
        recordCounts: {}
      };
    }
  }

  /**
   * localStorage 상태 점검
   */
  private async checkLocalStorage(): Promise<DataStatusReport['localStorage']> {
    const keys = Object.keys(localStorage);
    const keyDetails: { [key: string]: { size: number; lastModified: string } } = {};
    let totalSize = 0;

    for (const key of keys) {
      const value = localStorage.getItem(key) || '';
      const size = new Blob([value]).size;
      totalSize += size;

      keyDetails[key] = {
        size,
        lastModified: new Date().toISOString() // localStorage는 수정 시간을 제공하지 않음
      };
    }

    return {
      totalKeys: keys.length,
      totalSize,
      keyDetails
    };
  }

  /**
   * 데이터 일관성 점검
   */
  private async checkDataConsistency(): Promise<DataStatusReport['dataConsistency']> {
    const conflicts: string[] = [];
    const duplicates: string[] = [];
    const missingData: string[] = [];

    try {
      // 프로젝트 데이터 일관성 확인
      const indexedProjects = await this.getIndexedDBProjects();
      const localProjects = this.getLocalStorageProjects();

      // 충돌 확인
      for (const project of indexedProjects) {
        const localProject = localProjects.find(p => p.id === project.id);
        if (localProject && JSON.stringify(project) !== JSON.stringify(localProject)) {
          conflicts.push(`프로젝트 ${project.id}: IndexedDB와 localStorage 데이터 불일치`);
        }
      }

      // 중복 확인
      const projectIds = indexedProjects.map(p => p.id);
      const duplicateIds = projectIds.filter((id, index) => projectIds.indexOf(id) !== index);
      duplicateIds.forEach(id => {
        duplicates.push(`프로젝트 ${id}: 중복 데이터 발견`);
      });

      // 누락 데이터 확인
      const localProjectIds = localProjects.map(p => p.id);
      const missingIds = localProjectIds.filter(id => !projectIds.includes(id));
      missingIds.forEach(id => {
        missingData.push(`프로젝트 ${id}: IndexedDB에 누락`);
      });

    } catch (error) {
      console.error('데이터 일관성 점검 실패:', error);
    }

    return { conflicts, duplicates, missingData };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(report: DataStatusReport): string[] {
    const recommendations: string[] = [];

    // IndexedDB 관련 권장사항
    if (!report.indexedDB.exists) {
      recommendations.push('IndexedDB가 초기화되지 않았습니다. 데이터베이스를 초기화해주세요.');
    }

    if (report.indexedDB.objectStores.length === 0) {
      recommendations.push('Object Store가 생성되지 않았습니다. 데이터베이스 스키마를 확인해주세요.');
    }

    // localStorage 관련 권장사항
    if (report.localStorage.totalSize > 5 * 1024 * 1024) { // 5MB
      recommendations.push('localStorage 용량이 5MB를 초과했습니다. 불필요한 데이터를 정리해주세요.');
    }

    // 데이터 일관성 관련 권장사항
    if (report.dataConsistency.conflicts.length > 0) {
      recommendations.push(`${report.dataConsistency.conflicts.length}개의 데이터 충돌이 발견되었습니다. 동기화가 필요합니다.`);
    }

    if (report.dataConsistency.duplicates.length > 0) {
      recommendations.push(`${report.dataConsistency.duplicates.length}개의 중복 데이터가 발견되었습니다. 정리가 필요합니다.`);
    }

    if (report.dataConsistency.missingData.length > 0) {
      recommendations.push(`${report.dataConsistency.missingData.length}개의 누락 데이터가 발견되었습니다. 복구가 필요합니다.`);
    }

    return recommendations;
  }

  /**
   * 데이터 정리 실행
   */
  async cleanupData(): Promise<{ cleaned: number; errors: string[] }> {
    let cleaned = 0;
    const errors: string[] = [];

    try {
      // 중복 데이터 정리
      const duplicates = await this.findDuplicates();
      for (const duplicate of duplicates) {
        try {
          await this.removeDuplicate(duplicate);
          cleaned++;
        } catch (error) {
          errors.push(`중복 데이터 정리 실패: ${duplicate} - ${error}`);
        }
      }

      // 오래된 캐시 데이터 정리
      const oldCacheKeys = this.findOldCacheKeys();
      for (const key of oldCacheKeys) {
        try {
          localStorage.removeItem(key);
          cleaned++;
        } catch (error) {
          errors.push(`캐시 정리 실패: ${key} - ${error}`);
        }
      }

    } catch (error) {
      errors.push(`데이터 정리 중 오류 발생: ${error}`);
    }

    return { cleaned, errors };
  }

  /**
   * 백업 생성
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      indexedDB: await this.exportIndexedDBData(),
      localStorage: this.exportLocalStorageData(),
      metadata: {
        version: '1.0',
        totalSize: this.calculateTotalSize()
      }
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 자동 다운로드
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return `백업 파일이 다운로드되었습니다: storyboard-backup-${timestamp}.json`;
  }

  // 헬퍼 메서드들
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StoryBoardDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDBProjects(): Promise<any[]> {
    // IndexedDB에서 프로젝트 데이터 조회 구현
    return [];
  }

  private getLocalStorageProjects(): any[] {
    const projectData = localStorage.getItem('projects');
    return projectData ? JSON.parse(projectData) : [];
  }

  private async findDuplicates(): Promise<string[]> {
    // 중복 데이터 찾기 구현
    return [];
  }

  private async removeDuplicate(duplicateId: string): Promise<void> {
    // 중복 데이터 제거 구현
  }

  private findOldCacheKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys.filter(key => key.includes('_cache_') || key.includes('_temp_'));
  }

  private async exportIndexedDBData(): Promise<any> {
    // IndexedDB 데이터 내보내기 구현
    return {};
  }

  private exportLocalStorageData(): any {
    const data: any = {};
    for (const key of Object.keys(localStorage)) {
      data[key] = localStorage.getItem(key);
    }
    return data;
  }

  private calculateTotalSize(): number {
    let totalSize = 0;
    for (const key of Object.keys(localStorage)) {
      const value = localStorage.getItem(key) || '';
      totalSize += new Blob([value]).size;
    }
    return totalSize;
  }
}

export const dataStatusChecker = new DataStatusChecker();
