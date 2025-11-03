# AI Provider 설정 및 프롬프트 생성 규칙 검토 보고서

## 📋 검토 결과 요약

### ✅ 구현 완료

1. **기능별 AI 선택 UI**
   - ✅ 이미지/영상 생성: API 키 확인 후 활성화
   - ✅ 텍스트 생성: API 키 확인 추가 완료

2. **기본 AI 선택 (AISelector)**
   - ✅ API 키 기반 활성화 추가 완료
   - ✅ API 키 없는 Provider 비활성화

3. **AI별 프롬프트 생성 규칙**
   - ✅ 통합 프롬프트 템플릿 생성 (`utils/promptTemplates.ts`)
   - ✅ Provider별 System Prompt 적용
   - ✅ 생성 타입별(텍스트/이미지/영상) 템플릿 분리
   - ✅ 각 서비스에 템플릿 적용 완료

---

## 🔍 상세 검토

### 1. API 키 기반 활성화 문제

#### 현재 상태

**AISelector.tsx:**
- 하드코딩된 `available` 플래그 사용
- API 키 상태를 확인하지 않음
- 모든 Provider가 항상 선택 가능 상태로 표시

```typescript
const aiProviders = [
  { id: 'google', available: true },  // 항상 true
  { id: 'chatgpt', available: true },  // 항상 true
  { id: 'anthropic', available: false }, // 하드코딩
  { id: 'kling', available: false }     // 하드코딩
];
```

**AISettingsModal.tsx - 기능별 선택:**
- ✅ 이미지 생성: API 키 확인 후 활성화
- ✅ 영상 생성: API 키 확인 후 활성화
- ❌ 텍스트 생성: API 키 확인 없음

#### 문제점
1. `AISelector`에서 API 키 없어도 모든 Provider 선택 가능
2. 텍스트 생성 선택 시 API 키 확인 없음
3. 실제 API 호출 시에만 에러 발생 (사용자 경험 나쁨)

---

### 2. AI별 프롬프트 생성 규칙 문제

#### 현재 상태

**Google AI (`googleAIService.ts`):**
```typescript
systemInstruction: "당신은 창의적인 스토리텔러이자 영상 제작 전문가입니다. 
주어진 요청에 따라 매력적이고 구체적인 콘텐츠를 생성해주세요."
```
- 고정된 systemInstruction 사용
- 모든 생성 작업에 동일한 규칙 적용

**ChatGPT (`ChatGPTService.ts`):**
```typescript
const systemPrompt = options.systemPrompt;
if (systemPrompt) {
  messages.push({
    role: 'system',
    content: systemPrompt
  });
}
```
- systemPrompt를 옵션으로 받음
- `getOptimizedPromptTemplate()` 메서드 존재하지만 미사용
- Provider별 다른 프롬프트 템플릿 미적용

**NanoBananaService:**
- Google AI와 동일한 systemInstruction 사용

#### 문제점
1. Provider별 프롬프트 생성 규칙이 다르지만 통합 관리 안됨
2. ChatGPT의 최적화 템플릿이 실제로 사용되지 않음
3. 생성 타입별(텍스트/이미지/영상) 프롬프트 규칙 구분 없음
4. 각 서비스마다 프롬프트 처리 방식이 다름 (일관성 부족)

---

## ✅ 완료된 수정 사항

### 수정 1: AISelector에 API 키 기반 활성화 추가 ✅

**파일**: `components/common/AISelector.tsx`

**수정 완료**:
- ✅ API 키 상태를 props로 받아서 확인
- ✅ API 키 없는 Provider는 비활성화
- ✅ "API 키 필요" 뱃지 표시

### 수정 2: 텍스트 생성 AI 선택에 API 키 확인 추가 ✅

**파일**: `components/common/AISettingsModal.tsx`

**수정 완료**:
- ✅ 텍스트 생성 AI 선택 버튼에도 API 키 확인 로직 추가
- ✅ API 키 없는 Provider 비활성화 및 안내 표시

### 수정 3: 통합 프롬프트 생성 규칙 구현 ✅

**새 파일**: `utils/promptTemplates.ts`

**구현 완료**:
- ✅ Provider별 프롬프트 템플릿 정의
- ✅ 생성 타입별(텍스트/이미지/영상) 템플릿 분리
- ✅ System Prompt 관리 함수 제공

### 수정 4: 각 서비스에서 통합 프롬프트 규칙 적용 ✅

**수정 완료 파일**:
- ✅ `services/ai/GoogleAIService.ts`: Provider별 System Prompt 적용
- ✅ `services/ai/ChatGPTService.ts`: Provider별 System Prompt 적용
- ✅ `services/ai/NanoBananaService.ts`: Provider별 System Prompt 적용
- ✅ `hooks/useAIService.ts`: 모든 생성 타입에 System Prompt 적용

---

## 📊 최종 검토 결과

### API 키 기반 활성화
- ✅ AISelector: API 키 확인 로직 추가
- ✅ AISettingsModal - 텍스트: API 키 확인 추가
- ✅ AISettingsModal - 이미지: API 키 확인 (기존 구현)
- ✅ AISettingsModal - 영상: API 키 확인 (기존 구현)

### AI별 프롬프트 생성 규칙
- ✅ Google AI: `getSystemPrompt('google', type)` 사용
- ✅ ChatGPT: `getSystemPrompt('chatgpt', type)` 사용
- ✅ 생성 타입별 다른 System Prompt 적용
- ✅ Provider별 최적화된 프롬프트 템플릿 정의

---

## 🔄 추가 개선 사항 (선택)

### 향후 개선 가능 사항
1. **프롬프트 최적화 로직 강화**
   - Provider별 프롬프트 전처리 규칙 추가
   - 한글→영문 번역 최적화

2. **에러 처리 개선**
   - Provider별 에러 메시지 커스터마이징

3. **프롬프트 템플릿 확장**
   - 사용자 정의 템플릿 지원
   - 템플릿 저장/불러오기 기능

