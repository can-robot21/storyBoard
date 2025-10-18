# 📊 데이터베이스 상태 검토 및 개선 방안

## 🔍 현재 상태 분석

### 데이터 저장 방식
- **주요 DB**: IndexedDB (`StoryBoardDB`)
- **캐시**: localStorage (압축 및 최적화 포함)
- **백업**: IndexedDB (`StoryBoardTextBackup`)
- **SQLite 파일**: ❌ 존재하지 않음

### 저장된 데이터 유형
```typescript
// IndexedDB Object Stores
- users: 사용자 정보
- projects: 프로젝트 데이터  
- project_history: 프로젝트 히스토리
- prompt_templates: 프롬프트 템플릿
- usage_stats: 사용량 통계

// localStorage 키들
- storyboard_current_user: 현재 사용자
- user_api_keys: API 키
- projectStory: 프로젝트 스토리
- projectCharacterList: 캐릭터 목록
- imageStorage: 이미지 저장소
- dataAccessLog: 접근 로그
```

## 🚨 발견된 문제점

### 1. 데이터 일관성 문제
- IndexedDB와 localStorage에 중복 저장
- 동기화 메커니즘 부재
- 데이터 불일치 가능성

### 2. 백업 및 복구 제한
- 브라우저별 데이터 분리
- 브라우저 삭제 시 데이터 손실
- 크로스 플랫폼 데이터 공유 불가

### 3. 확장성 제한
- 브라우저 저장소 용량 제한
- 대용량 데이터 처리 어려움
- 서버 연동 시 마이그레이션 복잡

## 💡 개선 방안

### Phase 1: 데이터 일관성 개선 (1주일)

#### 1. 통합 데이터 관리 서비스
```typescript
// services/UnifiedDataService.ts
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  
  // 단일 진실 소스 (Single Source of Truth)
  async saveProject(project: Project): Promise<void> {
    // IndexedDB에 저장 (주 저장소)
    await this.indexedDB.saveProject(project);
    
    // localStorage에 캐시 (성능 향상)
    await this.localStorage.cacheProject(project);
  }
  
  async loadProject(id: string): Promise<Project | null> {
    // 캐시에서 먼저 확인
    const cached = this.localStorage.getProject(id);
    if (cached) return cached;
    
    // IndexedDB에서 로드
    const project = await this.indexedDB.loadProject(id);
    if (project) {
      // 캐시에 저장
      this.localStorage.cacheProject(project);
    }
    
    return project;
  }
}
```

#### 2. 데이터 동기화 메커니즘
```typescript
// services/DataSyncService.ts
export class DataSyncService {
  async syncUserData(userId: string): Promise<void> {
    // IndexedDB와 localStorage 동기화
    const indexedData = await this.getIndexedDBData(userId);
    const localData = this.getLocalStorageData(userId);
    
    // 충돌 해결
    const mergedData = this.resolveConflicts(indexedData, localData);
    
    // 양쪽 저장소에 저장
    await this.saveToIndexedDB(mergedData);
    this.saveToLocalStorage(mergedData);
  }
}
```

### Phase 2: 백업 시스템 강화 (2주일)

#### 1. 자동 백업 시스템
```typescript
// services/AutoBackupService.ts
export class AutoBackupService {
  private backupInterval = 30 * 60 * 1000; // 30분마다
  
  startAutoBackup(): void {
    setInterval(async () => {
      await this.createBackup();
    }, this.backupInterval);
  }
  
  async createBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString();
    const backupData = await this.exportAllData();
    
    // IndexedDB에 백업 저장
    await this.saveBackup(timestamp, backupData);
    
    // 사용자에게 다운로드 옵션 제공
    this.offerDownload(backupData, `backup_${timestamp}.json`);
    
    return { success: true, timestamp };
  }
}
```

#### 2. 클라우드 백업 연동
```typescript
// services/CloudBackupService.ts
export class CloudBackupService {
  async uploadToCloud(backupData: any): Promise<string> {
    // Google Drive, Dropbox 등 연동
    const cloudUrl = await this.uploadToProvider(backupData);
    
    // 백업 URL을 로컬에 저장
    localStorage.setItem('lastCloudBackup', cloudUrl);
    
    return cloudUrl;
  }
  
  async restoreFromCloud(backupUrl: string): Promise<void> {
    const backupData = await this.downloadFromProvider(backupUrl);
    await this.restoreData(backupData);
  }
}
```

### Phase 3: 서버 연동 준비 (1개월)

#### 1. 하이브리드 저장소 아키텍처
```typescript
// services/HybridStorageService.ts
export class HybridStorageService {
  async saveProject(project: Project): Promise<void> {
    // 로컬 저장 (즉시 반응)
    await this.localStorage.saveProject(project);
    
    // 서버 동기화 (백그라운드)
    if (this.isOnline()) {
      this.syncToServer(project);
    } else {
      this.queueForSync(project);
    }
  }
  
  private async syncToServer(project: Project): Promise<void> {
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
    } catch (error) {
      // 오프라인 큐에 추가
      this.addToOfflineQueue(project);
    }
  }
}
```

## 📋 구현 우선순위

### 즉시 적용 (1주일)
1. ✅ 데이터 일관성 검사 도구 개발
2. ✅ 중복 데이터 정리 스크립트
3. ✅ 통합 데이터 서비스 구현

### 단기 개선 (2주일)
1. 🔄 자동 백업 시스템
2. 🔄 데이터 동기화 메커니즘
3. 🔄 백업 복구 도구

### 중기 개선 (1개월)
1. 🔄 클라우드 백업 연동
2. 🔄 서버 연동 준비
3. 🔄 하이브리드 저장소

## 🛠️ 데이터 상태 점검 도구

### 1. 데이터 무결성 검사
```typescript
// utils/DataIntegrityChecker.ts
export class DataIntegrityChecker {
  async checkDataConsistency(): Promise<IntegrityReport> {
    const report = {
      indexedDB: await this.checkIndexedDB(),
      localStorage: await this.checkLocalStorage(),
      conflicts: await this.findConflicts(),
      recommendations: []
    };
    
    return report;
  }
}
```

### 2. 데이터 정리 도구
```typescript
// utils/DataCleanupTool.ts
export class DataCleanupTool {
  async cleanupDuplicateData(): Promise<CleanupResult> {
    // 중복 데이터 식별
    const duplicates = await this.findDuplicates();
    
    // 충돌 해결
    const resolved = await this.resolveConflicts(duplicates);
    
    // 정리된 데이터 저장
    await this.saveCleanedData(resolved);
    
    return { cleaned: duplicates.length, conflicts: resolved.length };
  }
}
```

## ⚠️ 주의사항

### 데이터 손실 방지
- 백업 생성 전 데이터 검증
- 점진적 마이그레이션
- 롤백 계획 수립

### 성능 고려사항
- 대용량 데이터 처리 최적화
- 백그라운드 동기화
- 캐시 전략 개선

---

**검토 일시**: 2025년 1월 27일  
**현재 상태**: 브라우저 저장소 기반  
**권장 방향**: 하이브리드 저장소 아키텍처
