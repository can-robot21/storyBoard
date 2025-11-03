# txt2img 이미지 생성 API 응답 로깅 가이드

## 📊 현재 콘솔 로그 구조

### 1. 이미지 생성 시작 단계

**위치**: `useImageHandlers.ts`
```typescript
🎭 캐릭터 생성 시작: {
  characterInput: string,
  attachedImages: number,
  imageGenerationAPI: 'google'
}

📝 사용자 입력 사용: {prompt}
또는
📝 프로젝트 데이터에서 캐릭터 프롬프트 사용: {prompt}

🔄 이미지 생성 API 호출 시작...

🚀 generateMultipleImagesWithAPI 호출: {
  prompt: string,
  attachedImages: number,
  type: 'character' | 'background' | 'setting',
  imageGenerationAPI: 'google',
  aspectRatio: string,
  ...
}

🎨 최종 적용된 옵션: {
  prompt: string,
  numberOfImages: number,
  aspectRatio: string,
  imageSize: string,
  personGeneration: 'allow_adult' | 'allow_all' | 'dont_allow'
}
```

### 2. Google AI API 호출 단계

**위치**: `googleAIService.ts`
```typescript
🔍 Google AI 서비스 사용
📝 텍스트만으로 여러 이미지 생성
```

### 3. Imagen API 응답

**위치**: `googleAIService.ts:417`
```typescript
📊 Imagen API 응답: {
  generatedImages: number,  // 생성된 이미지 개수
  sdkHttpResponse: {
    status: number,
    statusText: string,
    headers: {...}
  },
  personGeneration: string,
  aspectRatio: string,
  numberOfImages: number,
  fullResponse: {...}  // 전체 응답 객체
}

📊 Imagen API 응답 요약 (캐릭터): {
  generatedImagesCount: number,
  hasResponse: boolean,
  personGeneration: string,
  aspectRatio: string,
  numberOfImages: number
}
```

### 4. 각 이미지의 안전 속성 (Safety Attributes)

**위치**: `googleAIService.ts:445`
```typescript
🛡️ 캐릭터 이미지 {index} 안전 속성: {
  blocked: boolean,  // 차단 여부
  categories: {...}, // 또는 harmCategories
  scores: {...},     // 또는 harmProbabilityScores
  personGeneration: string,
  fullSafetyAttributes: {...}  // 전체 안전 속성 객체
}

⚠️ 캐릭터 이미지 {index}: 안전 속성 정보 없음
📸 캐릭터 이미지 {index} 상세: {
  hasImage: boolean,
  hasImageBytes: boolean,
  imageSize: string,
  fullImageData: {...}
}
```

### 5. 이미지 처리 단계

**위치**: `googleAIService.ts:493`
```typescript
🔍 캐릭터 이미지 {index} 안전 속성 상세: {
  blocked: boolean,
  categories: {...},
  scores: {...},
  personGeneration: string,
  imageIndex: number,
  fullSafetyAttributes: {...}
}

✅ 캐릭터 이미지 {count}개 생성 성공: {
  personGeneration: string,
  aspectRatio: string,
  numberOfImages: number,
  actualGeneratedCount: number
}
```

### 6. 저장 및 상태 업데이트

**위치**: `useImageHandlers.ts`
```typescript
✅ 이미지 생성 완료: "{count}개 이미지 생성"

이미지 저장 완료: img_{timestamp}_{randomId} (실제 저장)

💾 캐릭터 상태 업데이트: [
  {
    id: number,
    description: string,
    image: string,  // Base64 데이터 URL
    imageStorageId: string,
    attachedImages: File[],
    timestamp: string
  },
  ...
]
```

## 🔍 성인 이미지 생성 시 확인 사항

### personGeneration 옵션에 따른 처리

1. **`allow_adult`** (기본값):
   - 성인 이미지만 생성
   - 미성년자 관련 표현 자동 필터링
   - `safetyAttributes.blocked`가 `false`인 경우에만 이미지 반환

2. **`allow_all`**:
   - 모든 연령 허용 (EU, 영국, 스위스, 중동, 북아프리카 제외)
   - `safetyAttributes`에서 차단 여부 확인 필요

3. **`dont_allow`**:
   - 사람 이미지 생성 차단
   - 프롬프트에 사람 관련 표현이 있으면 차단될 수 있음

### Safety Attributes 구조

```typescript
safetyAttributes: {
  blocked: boolean,
  categories: {
    hate: string,        // 'LOW' | 'MEDIUM' | 'HIGH'
    harassment: string,
    sexually_explicit: string,
    dangerous: string,
    // ...
  },
  scores: {
    hate: number,       // 0.0 ~ 1.0
    harassment: number,
    sexually_explicit: number,
    dangerous: number,
    // ...
  }
}
```

### 성인 이미지 생성 성공 시 로그 예시

```
📊 Imagen API 응답: {
  generatedImages: 2,
  sdkHttpResponse: {
    status: 200,
    statusText: "OK",
    headers: {...}
  },
  personGeneration: "allow_adult",
  aspectRatio: "9:16",
  numberOfImages: 2,
  fullResponse: {...}
}

🛡️ 캐릭터 이미지 1 안전 속성: {
  blocked: false,
  categories: {
    sexually_explicit: "LOW" | "MEDIUM",
    ...
  },
  scores: {
    sexually_explicit: 0.3,
    ...
  },
  personGeneration: "allow_adult",
  fullSafetyAttributes: {...}
}

✅ 캐릭터 이미지 2개 생성 성공: {
  personGeneration: "allow_adult",
  aspectRatio: "9:16",
  numberOfImages: 2,
  actualGeneratedCount: 2
}
```

## ⚠️ 빈 응답 처리

### personGeneration이 `allow_adult`인 경우:

```typescript
⚠️ 이미지 생성 API가 빈 응답을 반환했습니다: {
  hasResponse: boolean,
  generatedImagesLength: 0,
  personGeneration: "allow_adult",
  prompt: string (첫 100자)
}

에러 메시지:
"이미지 생성 결과가 없습니다. AI 서비스의 안전 정책에 의해 이미지가 생성되지 않았을 수 있습니다.

다음을 시도해보세요:
• 프롬프트를 더 명확하고 구체적으로 작성
• "사람 생성" 옵션에서 "모든 연령 허용" 선택
• 프롬프트에서 미성년자 관련 표현 제거하고 "성인 여성", "성인 남성" 등으로 명시
• 잠시 후 다시 시도"
```

## 📝 개발 환경에서만 출력

모든 상세 로그는 `process.env.NODE_ENV === 'development'` 조건에서만 출력됩니다.

**프로덕션 빌드**에서는 다음만 출력:
- 에러 메시지 (console.error)
- 기본적인 성공 메시지

**개발 환경**에서는:
- 전체 API 응답 구조
- Safety Attributes 상세 정보
- 이미지 메타데이터
- 디버깅 정보

---

**작성일**: 2025-01-27  
**마지막 업데이트**: 2025-01-27

