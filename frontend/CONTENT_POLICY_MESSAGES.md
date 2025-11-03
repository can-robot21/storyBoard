# 콘텐츠 정책 메시지 가이드

## 개요

금지 항목(소녀, 꼬마 등 미성년자 관련 표현)이 포함된 프롬프트에 대해 명확하고 사용자 친화적인 에러 메시지를 제공합니다.

## 금지 항목 카테고리

### 1. 미성년자 관련 (최우선 검사)
- **한글**: 소녀, 소년, 꼬마, 아이, 어린이, 유아, 아기, 초등학생, 중학생, 고등학생, 학생
- **영문**: child, minor, kid, baby, toddler, infant, young girl, young boy, little girl, little boy, school girl, school boy, student, teenager, teen

### 2. 성인 콘텐츠
- nude, naked, explicit, adult, nsfw, pornographic, sexual, sexually

### 3. 폭력 관련
- violence, blood, weapon, gun, knife, fight, kill, murder

### 4. 기타 부적절한 내용
- hate, discrimination, harassment, abuse

## 에러 메시지 유형

### 1. 미성년자 관련 표현 감지 시

```
미성년자 관련 표현이 포함된 프롬프트는 안전 정책상 생성할 수 없습니다.

다음과 같은 표현은 사용할 수 없습니다:
- 소녀, 소년, 꼬마, 아이, 어린이
- child, minor, kid, baby 등

성인 캐릭터나 일반적인 인물 표현으로 변경해주세요.
```

### 2. API 안전 정책 위반 시

```
안전 정책에 위배되는 내용이 감지되었습니다.

입력하신 내용이 AI 서비스의 안전 정책에 위배되어 이미지를 생성할 수 없습니다.

다음을 확인해주세요:
• 미성년자 관련 표현(소녀, 소년, 꼬마, 아이 등) 제거
• 성인 콘텐츠 관련 표현 제거
• 폭력적인 표현 제거

다른 내용으로 프롬프트를 수정해주세요.
```

### 3. 다른 이미지가 생성된 경우

```
요청하신 내용과 다른 이미지가 생성되었습니다.

안전 정책에 따라 프롬프트의 일부 내용이 변경되거나 다른 이미지가 생성될 수 있습니다.

다음을 시도해보세요:
• 프롬프트를 더 명확하고 구체적으로 작성
• 미성년자 관련 표현 제거
• 성인, 전문인, 일반 캐릭터 등으로 대체

프롬프트를 수정한 후 다시 시도해주세요.
```

## 권장 표현 대체

### 금지된 표현 → 권장 표현

| 금지된 표현 | 권장 표현 |
|------------|----------|
| 소녀 | 여성, 성인 여성, 전문가 여성 |
| 소년 | 남성, 성인 남성, 전문가 남성 |
| 꼬마 | 인물, 성인 |
| 아이 | 인물, 성인 |
| child | adult person |
| minor | adult |
| kid | person |
| little girl | woman |
| little boy | man |
| young girl | woman |
| young boy | man |
| school girl | professional woman |
| school boy | professional man |

## 적용 위치

### 검증 시점

1. **프롬프트 입력 시**: `imageGenerationService.ts`에서 검증
2. **이미지 생성 전**: `googleAIService.ts`, `NanoBananaService.ts`에서 검증
3. **API 응답 시**: 에러 응답에서 정책 위반 확인

### 에러 메시지 표시 위치

1. **고급 이미지 생성 모달**: `AdvancedImageGenerationModal.tsx`
2. **이미지 핸들러**: `useImageHandlers.ts`
3. **영상 핸들러**: `useVideoHandlers.ts`
4. **이미지 분석**: `ImageAnalysisModal.tsx`

## 사용 예시

```typescript
import { validateContentPolicy, getFormattedErrorMessage } from '../utils/contentPolicyValidator';

// 프롬프트 검증
const validation = validateContentPolicy(userPrompt);
if (!validation.isValid) {
  alert(validation.message);
  return;
}

// 에러 처리
try {
  await generateImage(prompt);
} catch (error) {
  const message = getFormattedErrorMessage(error, prompt);
  alert(message);
}
```

## 주의사항

1. **미성년자 관련 표현은 절대 허용하지 않음**
   - 명시적으로 검사하고 차단
   - 사용자에게 명확한 안내 메시지 제공

2. **API 응답도 확인**
   - API가 다른 이미지를 생성한 경우 감지
   - 사용자에게 원인과 해결 방법 안내

3. **일관된 메시지**
   - 모든 위치에서 동일한 메시지 사용
   - 사용자가 쉽게 이해할 수 있는 표현

4. **대체 표현 제안**
   - 금지된 표현에 대한 대체 표현 제안
   - 사용자가 쉽게 수정할 수 있도록 안내

---

**최종 업데이트**: 2025-01-27

