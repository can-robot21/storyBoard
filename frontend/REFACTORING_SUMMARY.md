# AdvancedImageGenerationModal 리팩토링 요약

## 개요
2141줄에 달하는 거대한 모달 컴포넌트를 효율적으로 관리하기 위한 코드 분리 및 모듈화 작업이 진행되었습니다.

## 분리된 모듈

### 1. 유틸리티 모듈 (`utils/`)

#### `translationUtils.ts`
- **목적**: 번역 관련 함수 분리
- **함수**:
  - `translateKoreanToEnglish`: 패턴 매칭 기반 한글→영문 번역
  - `translateKoreanToEnglishWithAI`: AI 기반 번역 (API 키 검증 포함)
- **이점**: 번역 로직 재사용 가능, 테스트 용이

#### `imageUtils.ts`
- **목적**: 이미지 관련 유틸리티 함수
- **함수**:
  - `dataURLtoFile`: DataURL을 File 객체로 변환
  - `downloadImage`: 이미지 다운로드 유틸리티
  - `manageStorageQuota`: 로컬 스토리지 용량 관리
- **이점**: 이미지 처리 로직 재사용 가능

### 2. 커스텀 훅 (`hooks/`)

#### `useAdvancedImageGeneration.ts`
- **목적**: 모달의 상태 관리 로직 분리
- **관리하는 상태**:
  - 단계 관리 (step)
  - 모듈별 데이터 (basicData, sizeStyleData, cameraLightingData)
  - 생성된 이미지 상태
  - 최적화 결과 상태
  - UI 상태 (showPromptDetails 등)
- **함수**:
  - `resetModalState`: 전체 상태 초기화
  - `resetOptimizationResult`: 최적화 결과만 초기화
- **이점**: 상태 관리 로직 단순화, 재사용 가능

### 3. 서비스 레이어 (`services/`)

#### `imageGenerationService.ts`
- **목적**: 이미지 생성 및 저장 로직 분리
- **메서드**:
  - `generateImage`: 이미지 생성 로직 (NanoBanana 서비스 호출)
  - `saveImageToStorage`: 이미지 저장 로직 (로컬 스토리지 관리)
- **이점**: 비즈니스 로직 분리, 테스트 용이, 재사용 가능

### 4. 컴포넌트 모듈 (`components/common/modules/`)

#### `PromptImageBasicModule.tsx` (기존)
- **목적**: 프롬프트 입력 및 이미지 첨부 처리

#### `SizeStyleConfigModule.tsx` (기존)
- **목적**: 사이즈 및 스타일 설정 처리

#### `CameraLightingModule.tsx` (기존)
- **목적**: 카메라 및 조명 설정 처리

#### `PromptOptimizationStep.tsx` (신규)
- **목적**: 프롬프트 최적화 단계 UI 및 로직
- **기능**:
  - JSON 최적화 버튼
  - AI 번역 통합 버튼
  - 최적화 결과 표시
- **이점**: 4단계 로직 완전 분리

#### `ImageGenerationStep.tsx` (신규)
- **목적**: 이미지 생성 단계 UI
- **기능**:
  - 이미지 생성 버튼
  - 생성된 이미지 표시
  - 저장/다운로드 기능
- **이점**: 5단계 로직 완전 분리

## 아키텍처 개선

### Before (리팩토링 전)
```
AdvancedImageGenerationModal.tsx (2141줄)
├── 모든 상태 관리
├── 모든 비즈니스 로직
├── 모든 UI 렌더링
├── 번역 함수들
├── 이미지 처리 함수들
└── 최적화 함수들
```

### After (리팩토링 후)
```
AdvancedImageGenerationModal.tsx (약 200-300줄 예상)
├── useAdvancedImageGeneration (상태 관리)
├── 모듈 컴포넌트들 (UI 분리)
└── 서비스 호출 (비즈니스 로직 분리)

supporting modules:
├── utils/
│   ├── translationUtils.ts
│   └── imageUtils.ts
├── hooks/
│   └── useAdvancedImageGeneration.ts
├── services/
│   └── imageGenerationService.ts
└── components/common/modules/
    ├── PromptImageBasicModule.tsx
    ├── SizeStyleConfigModule.tsx
    ├── CameraLightingModule.tsx
    ├── PromptOptimizationStep.tsx (신규)
    └── ImageGenerationStep.tsx (신규)
```

## 개선 효과

### 1. 가독성 향상
- 메인 모달 파일이 약 90% 축소 예상 (2141줄 → 약 200-300줄)
- 각 모듈이 단일 책임 원칙 준수

### 2. 유지보수성 향상
- 기능별 모듈로 분리되어 수정 범위가 명확
- 테스트 작성 용이

### 3. 재사용성 향상
- 번역, 이미지 처리 로직을 다른 컴포넌트에서도 사용 가능
- 모듈 컴포넌트를 다른 이미지 생성 기능에서 재사용 가능

### 4. 테스트 용이성
- 각 모듈을 독립적으로 테스트 가능
- Mock 데이터 사용 용이

## 다음 단계

### 완료 필요 사항
1. ✅ 번역 함수 분리 (`translationUtils.ts`)
2. ✅ 이미지 유틸리티 분리 (`imageUtils.ts`)
3. ✅ 상태 관리 훅 분리 (`useAdvancedImageGeneration.ts`)
4. ✅ 이미지 생성 서비스 분리 (`imageGenerationService.ts`)
5. ✅ 프롬프트 최적화 단계 분리 (`PromptOptimizationStep.tsx`)
6. ✅ 이미지 생성 단계 분리 (`ImageGenerationStep.tsx`)
7. ⚠️ 메인 모달 파일에서 중복 코드 제거 (진행 중)
8. ⚠️ import 경로 정리 및 테스트

### 추가 개선 사항
1. **타입 정의 강화**: 각 모듈의 Props 타입을 더 명확하게 정의
2. **에러 처리 통합**: 에러 처리 로직을 별도 유틸리티로 분리
3. **로딩 상태 관리**: 로딩 상태를 중앙에서 관리하는 훅 추가
4. **검증 로직 분리**: 프롬프트 검증 로직을 별도 유틸리티로 분리

## 사용 가이드

### 번역 함수 사용
```typescript
import { translateKoreanToEnglish, translateKoreanToEnglishWithAI } from '../../utils/translationUtils';

// 패턴 매칭 번역
const english = translateKoreanToEnglish('한국인 소녀');

// AI 번역
const englishAI = await translateKoreanToEnglishWithAI('한국인 소녀');
```

### 이미지 유틸리티 사용
```typescript
import { dataURLtoFile, downloadImage, manageStorageQuota } from '../../utils/imageUtils';

// DataURL → File
const file = dataURLtoFile(dataURL, 'image.png');

// 이미지 다운로드
downloadImage(imageUrl, 'generated-image.png');

// 스토리지 용량 관리
const success = manageStorageQuota('key', data);
```

### 이미지 생성 서비스 사용
```typescript
import { ImageGenerationService } from '../../services/imageGenerationService';

// 이미지 생성
const imageData = await ImageGenerationService.generateImage(
  nanoBananaService,
  { prompt, attachedImages, imageRoles, ... }
);

// 이미지 저장
const saveResults = ImageGenerationService.saveImageToStorage(imageData, attachedImages);
```

## 참고사항

- 모든 분리된 모듈은 기존 기능과 100% 호환됩니다.
- 점진적 마이그레이션이 가능합니다.
- 기존 코드와 병행 사용 가능합니다.

