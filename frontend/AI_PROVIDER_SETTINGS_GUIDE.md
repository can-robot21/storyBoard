# 기능별 AI Provider 설정 가이드

## 개요

이제 각 생성 기능(텍스트/이미지/영상)별로 다른 AI 서비스를 선택할 수 있습니다.

## 주요 변경 사항

### 1. 타입 정의 추가 (`types/ai.ts`)
- `GenerationType`: 'text' | 'image' | 'video'
- `FunctionBasedAIProviders`: 기능별 AI Provider 설정 인터페이스
- `DEFAULT_FUNCTION_AI_PROVIDERS`: 기본 설정값

### 2. 설정 관리 유틸리티 (`utils/aiProviderSettings.ts`)
- `AIProviderSettings.load()`: localStorage에서 설정 로드
- `AIProviderSettings.save()`: localStorage에 설정 저장
- `AIProviderSettings.getProviderForFunction()`: 특정 기능의 Provider 가져오기

### 3. UI 수정
- `AISettingsModal`: 기능별 AI 선택 UI 추가
  - 텍스트 생성: Google AI, ChatGPT, Anthropic
  - 이미지 생성: Google AI, ChatGPT
  - 영상 생성: Google AI, Kling (준비중)

### 4. Hook 확장
- `useAIServiceManager`: 
  - `getProviderForFunction(type)`: 기능별 Provider 가져오기
  - `getAIServiceForFunction(type)`: 기능별 AI Service 인스턴스 가져오기

## 사용 방법

### 설정 변경
1. AI 설정 모달 열기 (상단 AI 서비스 표시 영역 클릭)
2. "기능별 AI 서비스 설정" 섹션 열기
3. 각 기능별로 원하는 AI 서비스 선택
4. "설정 저장" 버튼 클릭

### 코드에서 사용

```typescript
import { useAIServiceManager } from '../hooks/useAIServiceManager';
import { AIProviderSettings } from '../utils/aiProviderSettings';

// 방법 1: Hook 사용
const { getProviderForFunction, getAIServiceForFunction } = useAIServiceManager();
const textProvider = getProviderForFunction('text');
const textService = getAIServiceForFunction('text');

// 방법 2: 유틸리티 직접 사용
const imageProvider = AIProviderSettings.getProviderForFunction('image');
```

## 다음 단계 (구현 필요)

### 텍스트 생성 기능 수정
- `useProjectHandlers.ts`: 텍스트 생성 시 `getProviderForFunction('text')` 사용
- `googleAIService.ts`: Provider에 따라 다른 서비스 사용하도록 수정

### 이미지 생성 기능 수정
- `useImageHandlers.ts`: 이미지 생성 시 `getProviderForFunction('image')` 사용
- `NanoBananaService.ts`: Provider에 따라 다른 서비스 사용하도록 수정

### 영상 생성 기능 수정
- `useVideoHandlers.ts`: 영상 생성 시 `getProviderForFunction('video')` 사용
- `VideoGenerationService.ts`: Provider에 따라 다른 서비스 사용하도록 수정

## 지원 가능한 조합

| 기능 | Google AI | ChatGPT | Anthropic | Kling |
|------|-----------|---------|-----------|-------|
| 텍스트 | ✅ | ✅ | ✅ | ❌ |
| 이미지 | ✅ | ✅ | ❌ | ❌ |
| 영상 | ✅ | ❌ | ❌ | 준비중 |

## 주의사항

1. API 키가 없는 Provider는 선택할 수 없습니다
2. Kling AI는 현재 준비 중입니다
3. 설정은 localStorage에 저장되며, 로그인한 사용자에게만 적용됩니다

