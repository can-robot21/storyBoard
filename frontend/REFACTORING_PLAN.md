# 전체 코드 리팩토링 계획서

## 📊 현재 상태 분석

### 1. 코드 규모 분석
- **총 파일 수**: 200+ 파일
- **큰 파일들** (1000줄 이상):
  - `ImageGenerator.tsx`: 1,778줄
  - `StoryboardGenerator.tsx`: 1,590줄  
  - `ImprovedMainLayout.tsx`: 761줄
  - `googleAIService.ts`: 1,791줄
  - `NanoBananaService.ts`: 1,019줄
  - `useImageHandlers.ts`: 1,000줄
  - `useVideoHandlers.ts`: 945줄

### 2. 코드 품질 이슈

#### 타입 안정성 문제
- **`any` 타입 사용**: 1,099건 발견
- **주요 위치**:
  - Props 인터페이스에 `any` 다수 사용
  - `ImprovedMainLayout.tsx`: `projectHandlers: any`, `imageHandlers: any`, `videoHandlers: any`
  - `ImageGenerator.tsx`: `characterList: any[]`, 프로젝트 참조 데이터들
  - 다양한 컴포넌트의 상태 관리에 `any` 사용

#### 중복 코드
- **API 키 가져오기 로직**: 여러 컴포넌트에 중복 구현
  - `ImageGenerator.tsx` (54-87줄)
  - `ImprovedMainLayout.tsx` (169-183줄)
  - `useProjectOverview.ts` (48-86줄)
- **에러 처리 패턴**: 서비스마다 다른 방식
- **로딩 상태 관리**: 컴포넌트마다 개별 구현
- **프롬프트 검증 로직**: 여러 곳에 분산

#### 백업/리팩토링 파일
- `AdvancedImageGenerationModal.tsx.backup.20251024_163844`
- `AdvancedImageGenerationModal.tsx.backup`
- `AdvancedImageGenerationModal.tsx.backup2`
- `AdvancedImageGenerationModal.refactored.tsx`
- `StoryboardGenerator.refactored.tsx`
- `ImageGenerationStep.new.tsx.backup`

#### 코드 주석/디버깅 코드
- **console.log**: 592건 (77개 파일)
- **TODO/FIXME**: 다수 존재
- **@ts-ignore**: 사용 확인 필요

### 3. 아키텍처 이슈

#### 컴포넌트 구조
- **거대 컴포넌트**: 단일 책임 원칙 위반
- **Props 드릴링**: 깊은 prop 전달 구조
- **상태 관리 복잡성**: 10개 이상의 useState 사용 컴포넌트 다수

#### 상태 관리
- **Zustand 사용**: `uiStore`, `projectStore`만 존재
- **로컬 상태 과다**: 많은 useState 사용
- **상태 동기화 문제**: localStorage와 상태 불일치 가능성

#### 서비스 레이어
- **싱글톤 패턴**: 일관성 있게 사용 (긍정적)
- **에러 처리**: 서비스마다 다른 방식
- **타입 정의**: 서비스 인터페이스 불일치

---

## 🎯 리팩토링 우선순위

### Phase 1: 긴급 (즉시 수정)
1. **백업 파일 정리**
2. **타입 안정성 개선 (핵심 부분)**
3. **중복 코드 통합 (API 키 관리)**

### Phase 2: 중요 (단기)
4. **거대 컴포넌트 분리**
5. **에러 처리 표준화**
6. **Props 타입 개선**

### Phase 3: 개선 (중기)
7. **상태 관리 최적화**
8. **코드 중복 제거**
9. **테스트 코드 추가**

### Phase 4: 최적화 (장기)
10. **성능 최적화**
11. **코드 구조 개선**
12. **문서화**

---

## 📋 상세 리팩토링 계획

### 1. 백업 파일 정리 (Priority: 🔴 High)

#### 작업 내용
```bash
# 삭제 대상 파일들
- AdvancedImageGenerationModal.tsx.backup.*
- StoryboardGenerator.refactored.tsx (작업 완료 시)
- ImageGenerationStep.new.tsx.backup
```

#### 실행 계획
1. 백업 파일 검토 및 필요 내용 추출
2. git history에 이미 저장되어 있으므로 삭제
3. `.gitignore`에 백업 파일 패턴 추가

---

### 2. 타입 안정성 개선 (Priority: 🔴 High)

#### 2.1 Props 인터페이스 개선

**문제 파일:**
- `ImprovedMainLayout.tsx`
  ```typescript
  // 현재
  projectHandlers: any;
  imageHandlers: any;
  videoHandlers: any;
  stepStatus: any;
  generatedProjectData: any;
  currentUser?: any;
  ```

**개선 방향:**
```typescript
// 개선 후
import type { ProjectHandlers, ImageHandlers, VideoHandlers } from '../types/handlers';
import type { StepStatus } from '../types/stepStatus';
import type { GeneratedProjectData } from '../types/project';
import type { User } from '../types/auth';

projectHandlers: ProjectHandlers;
imageHandlers: ImageHandlers;
videoHandlers: VideoHandlers;
stepStatus: StepStatus;
generatedProjectData: GeneratedProjectData;
currentUser?: User;
```

**작업 파일:**
- `types/handlers.ts` 생성
- `types/stepStatus.ts` 생성
- `ImprovedMainLayout.tsx` 수정
- 관련 컴포넌트 Props 타입 연쇄 수정

#### 2.2 any 배열 타입 개선

**문제:**
```typescript
// ImageGenerator.tsx
characterList: any[];
projectReferenceCharacters?: any[];
```

**개선:**
```typescript
// types/character.ts 생성
export interface Character {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt?: string;
}

characterList: Character[];
projectReferenceCharacters?: Character[];
```

#### 2.3 반환 타입 명시

**문제 파일:**
- `googleAIService.ts`: 많은 메서드의 반환 타입이 `any`
- `NanoBananaService.ts`: 동일 이슈

**개선 방향:**
- 모든 public 메서드에 명시적 반환 타입 추가
- 공통 응답 타입 정의

---

### 3. 중복 코드 통합 (Priority: 🔴 High)

#### 3.1 API 키 관리 통합

**현재 상태:**
- `ImageGenerator.tsx` (54-87줄)
- `ImprovedMainLayout.tsx` (169-183줄)
- `useProjectOverview.ts` (48-86줄)

**개선 방향:**
```typescript
// hooks/useAPIKey.ts 생성
export const useAPIKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  
  useEffect(() => {
    const key = getAPIKeyFromStorage();
    setApiKey(key);
  }, []);
  
  return { apiKey, hasAPIKey: !!apiKey };
};

// utils/apiKeyUtils.ts 생성
export const getAPIKeyFromStorage = (provider: 'google' | 'openai' = 'google'): string => {
  // 통합 로직
};
```

**수정 파일:**
- `hooks/useAPIKey.ts` 생성
- `utils/apiKeyUtils.ts` 생성
- 모든 컴포넌트에서 중복 코드 제거

#### 3.2 에러 처리 표준화

**현재 문제:**
- 각 서비스마다 다른 에러 처리 방식
- 중복된 에러 메시지 매핑

**개선 방향:**
```typescript
// utils/errorHandler.ts 생성
export class ErrorHandler {
  static parseError(error: unknown): AppError {
    // 통합 에러 파싱
  }
  
  static getErrorMessage(error: AppError): string {
    // 통합 에러 메시지 매핑
  }
}

// types/errors.ts 생성
export interface AppError {
  code: string;
  message: string;
  originalError?: Error;
}
```

---

### 4. 거대 컴포넌트 분리 (Priority: 🟡 Medium)

#### 4.1 ImageGenerator.tsx (1,778줄)

**분리 계획:**
```
ImageGenerator/
├── index.tsx (메인 컴포넌트, 200줄 이하)
├── ImageList.tsx (이미지 목록)
├── ImageItem.tsx (개별 이미지 아이템)
├── ProjectReferenceButton.tsx
├── ImageGenerationButton.tsx
├── hooks/
│   ├── useImageGeneration.ts
│   ├── useProjectReference.ts
│   └── useImageSelection.ts
└── types.ts
```

**작업 순서:**
1. 커스텀 훅 분리 (`useImageGeneration`, `useProjectReference`)
2. UI 컴포넌트 분리 (`ImageList`, `ImageItem`)
3. 메인 컴포넌트 리팩토링

#### 4.2 StoryboardGenerator.tsx (1,590줄)

**상태:**
- 이미 리팩토링 계획 존재 (`STORYBOARD_REFACTORING_PLAN.md`)
- 일부 분리 완료 (`HeaderSection.tsx`, `StoryBoardBody.tsx`)

**추가 작업:**
- `StoryboardGenerator.refactored.tsx`와 현재 버전 통합 검토
- 미완성 분리 작업 완료

#### 4.3 ImprovedMainLayout.tsx (761줄)

**분리 계획:**
```
ImprovedMainLayout/
├── index.tsx (메인, 300줄 이하)
├── StepContentRenderer.tsx
├── hooks/
│   ├── useStepContent.ts
│   └── useLayoutState.ts
└── types.ts
```

---

### 5. 에러 처리 표준화 (Priority: 🟡 Medium)

#### 5.1 공통 에러 타입 정의

```typescript
// types/errors.ts
export enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SAFETY_POLICY_VIOLATION = 'SAFETY_POLICY_VIOLATION',
  // ...
}

export interface AppError {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}
```

#### 5.2 에러 핸들러 서비스

```typescript
// services/errorHandlerService.ts
export class ErrorHandlerService {
  static handleError(error: unknown, context?: string): AppError {
    // 통합 에러 처리
  }
  
  static getUserMessage(error: AppError): string {
    // 사용자 친화적 메시지 변환
  }
  
  static shouldRetry(error: AppError): boolean {
    // 재시도 가능 여부 판단
  }
}
```

#### 5.3 React Error Boundary 추가

```typescript
// components/common/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<...> {
  // 에러 캐칭 및 표시
}
```

---

### 6. 상태 관리 최적화 (Priority: 🟢 Low)

#### 6.1 Zustand Store 확장

**현재:**
- `uiStore.ts`: 알림 관리
- `projectStore.ts`: 프로젝트 상태

**추가 필요:**
```typescript
// stores/apiKeyStore.ts
export const useAPIKeyStore = create<APIKeyState>((set) => ({
  apiKeys: {},
  setAPIKey: (provider, key) => set(...),
}));

// stores/imageStore.ts
export const useImageStore = create<ImageState>((set) => ({
  generatedImages: [],
  addImage: (image) => set(...),
}));
```

#### 6.2 React Query 도입 검토

**장점:**
- 서버 상태 캐싱
- 자동 재시도
- 로딩 상태 관리

**도입 검토 사항:**
- 현재 클라이언트 사이드만 사용 중
- 향후 백엔드 API 연동 시 활용 가능

---

### 7. 코드 중복 제거 (Priority: 🟢 Low)

#### 7.1 공통 유틸리티 함수

**현재 중복:**
- 이미지 변환 로직
- 데이터 포맷팅
- 유효성 검사

**개선:**
```typescript
// utils/common.ts 통합
export const imageUtils = {
  dataURLtoFile,
  fileToDataURL,
  // ...
};

export const validationUtils = {
  validatePrompt,
  validateAPIKey,
  // ...
};
```

#### 7.2 공통 컴포넌트 추출

**추출 가능한 컴포넌트:**
- `LoadingSpinner.tsx`
- `ErrorDisplay.tsx`
- `ConfirmDialog.tsx`
- `FormInput.tsx`

---

### 8. 성능 최적화 (Priority: 🟢 Low)

#### 8.1 React.memo 적용

**대상 컴포넌트:**
- 순수 컴포넌트
- 자주 리렌더링되는 컴포넌트
- Props가 많은 컴포넌트

#### 8.2 useMemo/useCallback 최적화

**확인 필요:**
- 복잡한 계산 함수
- 자식 컴포넌트에 전달하는 함수

#### 8.3 코드 스플리팅

**대상:**
- 큰 모달 컴포넌트
- 라우트별 페이지
- 스토리보드 생성기

---

### 9. 테스트 코드 추가 (Priority: 🟢 Low)

#### 9.1 단위 테스트

**우선순위:**
1. 유틸리티 함수
2. 커스텀 훅
3. 서비스 레이어
4. 컴포넌트

#### 9.2 테스트 커버리지 목표

- 현재: 테스트 파일 최소
- 목표: 90% 커버리지 (CLAUDE.md 기준)

---

## 🔧 구체적 수정 사항

### 즉시 수정 가능한 항목

#### 1. 타입 정의 파일 생성

**파일: `types/handlers.ts`**
```typescript
export interface ProjectHandlers {
  handleProjectReset: () => Promise<void>;
  handleProjectSave: () => Promise<void>;
  // ...
}

export interface ImageHandlers {
  handleGenerateCharacter: (input: string, images: File[]) => Promise<void>;
  handleGenerateBackground: (input: string, images: File[]) => Promise<void>;
  // ...
}

export interface VideoHandlers {
  handleGenerateVideo: (prompt: string, options: VideoOptions) => Promise<void>;
  // ...
}
```

**파일: `types/stepStatus.ts`**
```typescript
export interface StepStatus {
  projectOverviewSaved: boolean;
  imagesGenerated: boolean;
  videosGenerated: boolean;
  // ...
}
```

#### 2. API 키 관리 통합

**파일: `hooks/useAPIKey.ts`**
```typescript
import { useState, useEffect } from 'react';
import { getAPIKeyFromStorage } from '../utils/apiKeyUtils';

export const useAPIKey = (provider: 'google' | 'openai' = 'google') => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const key = getAPIKeyFromStorage(provider);
    setApiKey(key);
    setIsLoading(false);
  }, [provider]);

  return {
    apiKey,
    hasAPIKey: !!apiKey,
    isLoading
  };
};
```

**파일: `utils/apiKeyUtils.ts`**
```typescript
export const getAPIKeyFromStorage = (
  provider: 'google' | 'openai' = 'google'
): string => {
  try {
    if (typeof window === 'undefined') return '';
    
    const currentUserRaw = localStorage.getItem('storyboard_current_user');
    const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
    
    if (currentUser?.apiKeys?.[provider]) {
      return currentUser.apiKeys[provider];
    }
    
    const localKeysRaw = localStorage.getItem('user_api_keys');
    if (localKeysRaw) {
      const localKeys = JSON.parse(localKeysRaw);
      if (localKeys?.[provider]) {
        return localKeys[provider];
      }
    }
    
    return '';
  } catch (error) {
    console.error('API 키 로딩 오류:', error);
    return '';
  }
};
```

#### 3. 에러 처리 통합

**파일: `utils/errorHandler.ts`**
```typescript
export enum ErrorCode {
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SAFETY_POLICY_VIOLATION = 'SAFETY_POLICY_VIOLATION',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  originalError?: Error;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  static parseError(error: unknown): AppError {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('api key') || message.includes('api_key')) {
        return {
          code: ErrorCode.API_KEY_MISSING,
          message: 'Google AI API 키가 설정되지 않았습니다.',
          originalError: error
        };
      }
      
      if (message.includes('quota') || message.includes('한도')) {
        return {
          code: ErrorCode.QUOTA_EXCEEDED,
          message: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          originalError: error
        };
      }
      
      // ... 추가 매핑
    }
    
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: '알 수 없는 오류가 발생했습니다.',
      originalError: error instanceof Error ? error : new Error(String(error))
    };
  }
  
  static getUserMessage(error: AppError): string {
    return error.message;
  }
}
```

---

## 📈 리팩토링 진행 체크리스트

### Phase 1: 긴급 (1주)
- [ ] 백업 파일 삭제
- [ ] 핵심 타입 정의 생성 (`handlers.ts`, `stepStatus.ts`)
- [ ] API 키 관리 통합 (`useAPIKey` 훅 생성)
- [ ] `ImprovedMainLayout.tsx` 타입 개선

### Phase 2: 중요 (2-3주)
- [ ] 에러 처리 통합
- [ ] `ImageGenerator.tsx` 분리 시작
- [ ] Props 타입 연쇄 수정
- [ ] console.log 정리 (프로덕션용)

### Phase 3: 개선 (1-2개월)
- [ ] 거대 컴포넌트 분리 완료
- [ ] 상태 관리 최적화
- [ ] 코드 중복 제거
- [ ] 테스트 코드 작성 시작

### Phase 4: 최적화 (지속)
- [ ] 성능 최적화
- [ ] 코드 구조 개선
- [ ] 문서화
- [ ] 리팩토링 사례 정리

---

## 🚨 주의사항

### 리팩토링 시 주의할 점

1. **점진적 리팩토링**
   - 한 번에 많은 변경을 하지 않음
   - 단계별로 테스트 및 검증

2. **타입 변경 시 연쇄 영향**
   - Props 타입 변경 시 모든 사용처 확인 필요
   - 타입 호환성 검증

3. **기능 동작 보장**
   - 리팩토링 후 기존 기능 동작 확인
   - 사용자 테스트 권장

4. **Git 관리**
   - 각 단계별 커밋
   - 리팩토링 브랜치 관리

---

## 📚 참고 문서

- `CLAUDE.md`: 개발 규칙 및 가이드라인
- `REFACTORING_SUMMARY.md`: AdvancedImageGenerationModal 리팩토링 사례
- `STORYBOARD_REFACTORING_PLAN.md`: 스토리보드 생성기 리팩토링 계획

---

**작성일**: 2025-01-27  
**다음 검토**: Phase 1 완료 후

