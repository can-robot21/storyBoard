# 기능별 AI Provider 구현 리스트

## ✅ 완료된 작업

### 1. 타입 정의
- ✅ `types/ai.ts`: `GenerationType`, `FunctionBasedAIProviders` 타입 추가
- ✅ `DEFAULT_FUNCTION_AI_PROVIDERS` 기본값 정의

### 2. 설정 관리
- ✅ `utils/aiProviderSettings.ts`: 설정 저장/로드 유틸리티 생성

### 3. UI 구현
- ✅ `components/common/AISettingsModal.tsx`: 기능별 AI 선택 UI 추가
  - 텍스트 생성 AI 선택
  - 이미지 생성 AI 선택
  - 영상 생성 AI 선택

### 4. Hook 확장
- ✅ `hooks/useAIServiceManager.ts`: 
  - `getProviderForFunction()` 추가
  - `getAIServiceForFunction()` 추가

### 5. 상태 관리
- ✅ `App.tsx`: `functionBasedProviders` 상태 추가
- ✅ `components/layout/ImprovedMainLayout.tsx`: props 추가

## 🔄 수정 필요한 파일 리스트

### 텍스트 생성 기능 수정

#### 1. `hooks/useProjectHandlers.ts`
**위치**: 텍스트 생성 함수들
**수정 내용**:
```typescript
// 현재: GoogleAIService만 사용
const googleAIService = GoogleAIService.getInstance();

// 변경: 기능별 provider 사용
import { useAIServiceManager } from './useAIServiceManager';
const { getAIServiceForFunction } = useAIServiceManager();
const textService = getAIServiceForFunction('text');
```

**수정 함수**:
- `handleGenerateStory()` (약 70줄)
- `handleGenerateCharacters()` (약 150줄)
- `handleGenerateScenario()` (약 200줄)

#### 2. `services/googleAIService.ts`
**위치**: `generateText()` 메서드
**수정 내용**: Provider 체크 로직 추가 (현재는 그대로 유지 가능)

---

### 이미지 생성 기능 수정

#### 3. `hooks/useImageHandlers.ts`
**위치**: 이미지 생성 함수들
**수정 내용**:
```typescript
// 현재: GoogleAIService만 사용
const createGoogleAIService = (): GoogleAIService => { ... }

// 변경: 기능별 provider 사용
const { getAIServiceForFunction } = useAIServiceManager();
const imageService = getAIServiceForFunction('image');
```

**수정 함수**:
- `handleGenerateCharacter()` (약 260줄)
- `handleGenerateBackground()` (약 400줄)
- `handleGenerateSettingCut()` (약 550줄)
- `generateImageWithAPI()` (약 81줄)

#### 4. `services/imageGenerationService.ts`
**위치**: `generateImage()` 메서드
**수정 내용**: Provider에 따라 다른 서비스 사용하도록 수정

#### 5. `services/ai/NanoBananaService.ts`
**위치**: `generateImage()` 메서드
**수정 내용**: Provider 체크 로직 추가

---

### 영상 생성 기능 수정

#### 6. `hooks/useVideoHandlers.ts`
**위치**: 영상 생성 함수들
**수정 내용**:
```typescript
// 현재: GoogleAIService만 사용
const googleAIService = GoogleAIService.getInstance();

// 변경: 기능별 provider 사용
const { getAIServiceForFunction } = useAIServiceManager();
const videoService = getAIServiceForFunction('video');
```

**수정 함수**:
- `handleGenerateVideo()` (약 200줄)
- 기타 영상 생성 관련 함수들

#### 7. `services/ai/VideoGenerationService.ts`
**위치**: `generateVideo()` 메서드
**수정 내용**: Provider에 따라 다른 서비스 사용하도록 수정

#### 8. `components/videoGeneration/VideoGenerator.tsx`
**위치**: `generateVideoWithModel()` 함수
**수정 내용**: 기능별 provider 사용

---

## 📋 수정 우선순위

### Phase 1: 핵심 기능 (즉시)
1. ✅ 타입 정의 및 설정 관리 (완료)
2. ✅ UI 구현 (완료)
3. ⏳ 텍스트 생성 기능 수정
   - `useProjectHandlers.ts` - `handleGenerateStory()`
   - `useProjectHandlers.ts` - `handleGenerateCharacters()`
   - `useProjectHandlers.ts` - `handleGenerateScenario()`

### Phase 2: 이미지 생성 (단기)
4. ⏳ 이미지 생성 기능 수정
   - `useImageHandlers.ts` - `handleGenerateCharacter()`
   - `useImageHandlers.ts` - `handleGenerateBackground()`
   - `useImageHandlers.ts` - `generateImageWithAPI()`

### Phase 3: 영상 생성 (단기)
5. ⏳ 영상 생성 기능 수정
   - `useVideoHandlers.ts` - `handleGenerateVideo()`
   - `VideoGenerator.tsx` - `generateVideoWithModel()`

---

## 🔧 수정 패턴 예시

### 예시 1: 텍스트 생성 수정

**Before:**
```typescript
const handleGenerateStory = async () => {
  const googleAIService = GoogleAIService.getInstance();
  const result = await googleAIService.generateText(prompt);
  // ...
}
```

**After:**
```typescript
const { getAIServiceForFunction } = useAIServiceManager();

const handleGenerateStory = async () => {
  const textService = getAIServiceForFunction('text');
  if (!textService) {
    throw new Error('텍스트 생성 AI 서비스를 사용할 수 없습니다.');
  }
  
  const result = await textService.generateText({
    prompt,
    provider: AIProviderSettings.getProviderForFunction('text'),
    model: 'gemini-2.5-flash' // 기본값
  });
  // ...
}
```

### 예시 2: 이미지 생성 수정

**Before:**
```typescript
const generateImageWithAPI = async (prompt: string, ...) => {
  const googleAIService = createGoogleAIService();
  const result = await googleAIService.generateCharacterImage(prompt);
  // ...
}
```

**After:**
```typescript
const { getAIServiceForFunction } = useAIServiceManager();

const generateImageWithAPI = async (prompt: string, ...) => {
  const imageService = getAIServiceForFunction('image');
  if (!imageService) {
    throw new Error('이미지 생성 AI 서비스를 사용할 수 없습니다.');
  }
  
  const provider = AIProviderSettings.getProviderForFunction('image');
  if (provider === 'google') {
    const googleAIService = GoogleAIService.getInstance();
    const result = await googleAIService.generateCharacterImage(prompt);
    // ...
  } else if (provider === 'chatgpt') {
    // OpenAI DALL-E 사용
    const result = await imageService.generateImage({
      prompt,
      provider: 'chatgpt',
      model: 'dall-e-3',
      aspectRatio: '1:1',
      quality: 'standard'
    });
    // ...
  }
}
```

---

## ⚠️ 주의사항

1. **Provider별 지원 기능 확인 필요**
   - ChatGPT: 텍스트, 이미지 (DALL-E)
   - Anthropic: 텍스트만
   - Google AI: 텍스트, 이미지, 영상 모두 지원
   - Kling: 영상만 (준비중)

2. **에러 처리**
   - Provider가 없는 경우 fallback 로직 필요
   - 기본값은 Google AI로 설정

3. **타입 안정성**
   - 모든 Provider가 모든 기능을 지원하지 않으므로 타입 체크 필요

---

## 테스트 체크리스트

- [ ] 텍스트 생성 시 설정된 Provider 사용 확인
- [ ] 이미지 생성 시 설정된 Provider 사용 확인
- [ ] 영상 생성 시 설정된 Provider 사용 확인
- [ ] Provider 변경 시 즉시 반영 확인
- [ ] API 키 없는 Provider 선택 불가 확인
- [ ] 설정 저장/로드 확인

