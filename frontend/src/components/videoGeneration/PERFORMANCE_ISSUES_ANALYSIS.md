# 영상 생성 - 프로젝트 참조 모달 성능 이슈 분석 및 개선 방안

## 📊 현재 상태 분석

### 1. 무한 렌더링 루프 문제

**증상:**
- `ImageGenerator.tsx:275`의 로그가 수십~수백 번 반복 출력
- 콘솔에 동일한 메시지가 계속 반복됨
- 브라우저 성능 저하 및 메모리 사용량 증가

**원인:**
```typescript
// 문제 코드
useEffect(() => {
  loadProjectReferenceData();
}, [showProjectReferenceModal, projectReferenceCharacters, projectReferenceBackgrounds, projectReferenceSettingCuts]);
```

1. **Props 참조 불일치**: `VideoGenerationStep`에서 props를 전달할 때마다 새로운 배열 참조가 생성됨
   ```typescript
   // VideoGenerationStep.tsx:377-379
   projectReferenceCharacters={generatedCharacters}  // 매 렌더링마다 새 참조
   projectReferenceBackgrounds={generatedBackgrounds}  // 매 렌더링마다 새 참조
   projectReferenceSettingCuts={[...generatedSettingCuts, ...(generatedSettingCutImages || [])]}  // 항상 새 배열
   ```

2. **상태 업데이트 체인**: `setProjectReferenceData` 호출 → 리렌더링 → 새 props 참조 → 다시 `useEffect` 실행 → 무한 루프

### 2. 렌더링 중 setState 에러

**증상:**
```
Cannot update a component (`App`) while rendering a different component (`ImageGenerator`).
To locate the bad setState() call inside `ImageGenerator`, follow the stack trace...
```

**원인:**
- `setProjectReferenceData`가 렌더링 중에 직접 호출됨
- `useEffect` 내부에서 상태 업데이트가 즉시 실행되어 React의 렌더링 사이클을 위반

### 3. 불필요한 API 키 체크 반복

**증상:**
- `useAIServiceManager.ts`의 로그가 여러 번 반복됨
- `Google API 키는 있지만 서비스 초기화 실패` 메시지 반복

**원인:**
- 컴포넌트가 무한 렌더링되면서 하위 컴포넌트들도 계속 재생성됨
- API 키 체크 로직이 매번 실행됨

## 🛠️ 개선 방안

### 1. useEffect 의존성 배열 최적화

**문제점:**
- Props의 참조가 아닌 값 변경을 감지해야 함
- 매 렌더링마다 새로운 배열 참조로 인한 무한 루프

**해결 방법:**
```typescript
// 개선된 코드
useEffect(() => {
  if (showProjectReferenceModal) {
    loadProjectReferenceData();
  }
}, [showProjectReferenceModal]); // 모달 열림 상태만 의존

// Props 변경은 별도로 감지 (JSON.stringify로 값 비교)
useEffect(() => {
  if (!showProjectReferenceModal) return;
  
  // debounce 적용 및 값 기반 비교
  const timeoutId = setTimeout(() => {
    // 실제 데이터 변경이 있을 때만 재로드
  }, 300);
  
  return () => clearTimeout(timeoutId);
}, [showProjectReferenceModal, 
    JSON.stringify(projectReferenceCharacters), 
    JSON.stringify(projectReferenceBackgrounds), 
    JSON.stringify(projectReferenceSettingCuts)]);
```

### 2. startTransition으로 렌더링 중 setState 방지

**문제점:**
- 렌더링 중 상태 업데이트로 인한 React 경고

**해결 방법:**
```typescript
// 기존 데이터와 비교하여 실제 변경이 있을 때만 업데이트
const currentDataStr = JSON.stringify(projectReferenceData);
const newDataStr = JSON.stringify(data);

if (currentDataStr !== newDataStr) {
  startTransition(() => {
    setProjectReferenceData(data); // 렌더링 후 업데이트
  });
}
```

### 3. Debounce 적용

**문제점:**
- 빠른 연속 업데이트로 인한 불필요한 처리

**해결 방법:**
```typescript
// 300ms debounce로 빠른 연속 업데이트 방지
const timeoutId = setTimeout(() => {
  // 데이터 로드 로직
}, 300);

return () => clearTimeout(timeoutId);
```

### 4. 개발 환경 로그 최적화

**문제점:**
- 프로덕션 환경에서도 불필요한 로그 출력

**해결 방법:**
```typescript
// 개발 환경에서만 로그 출력
if (process.env.NODE_ENV === 'development') {
  console.log('✅ 프로젝트 참조 데이터 로드됨:', data);
}
```

### 5. useMemo를 활용한 Props 최적화 (부모 컴포넌트)

**VideoGenerationStep.tsx 개선:**
```typescript
// Props를 메모이제이션하여 불필요한 참조 변경 방지
const memoizedProjectReferenceSettingCuts = useMemo(() => 
  [...generatedSettingCuts, ...(generatedSettingCutImages || [])],
  [generatedSettingCuts, generatedSettingCutImages]
);

<ImageGenerator
  projectReferenceCharacters={generatedCharacters}
  projectReferenceBackgrounds={generatedBackgrounds}
  projectReferenceSettingCuts={memoizedProjectReferenceSettingCuts}
  // ...
/>
```

## 📈 예상 개선 효과

### 성능 개선
- **렌더링 횟수**: 수십~수백 회 → 모달 열릴 때 1회 + 실제 변경 시에만
- **콘솔 로그**: 무한 반복 → 실제 변경 시에만 (개발 환경)
- **메모리 사용량**: 불필요한 상태 업데이트 제거로 안정화

### 사용자 경험 개선
- **응답 속도**: 무한 루프 제거로 UI 응답성 향상
- **에러 제거**: 렌더링 중 setState 에러 해결
- **콘솔 정리**: 불필요한 로그 제거로 디버깅 용이

## 🔍 추가 개선 제안

### 1. React.memo 활용
```typescript
export const ImageGenerator: React.FC<ImageGeneratorProps> = React.memo(({
  // props
}) => {
  // 컴포넌트 로직
}, (prevProps, nextProps) => {
  // 커스텀 비교 로직
  return JSON.stringify(prevProps.projectReferenceCharacters) === 
         JSON.stringify(nextProps.projectReferenceCharacters) &&
         // ... 다른 props 비교
});
```

### 2. useCallback으로 핸들러 최적화
```typescript
const loadProjectReferenceData = useCallback(() => {
  // 로직
}, [/* 최소한의 의존성 */]);
```

### 3. 가상화(Virtualization) 적용
- 이미지 목록이 많을 경우 `react-window` 등을 사용하여 화면에 보이는 항목만 렌더링

## ✅ 구현 완료 사항

- [x] useEffect 의존성 배열 최적화
- [x] startTransition으로 렌더링 중 setState 방지
- [x] 데이터 비교를 통한 불필요한 상태 업데이트 방지
- [x] Debounce 적용
- [x] 개발 환경 로그 최적화
- [ ] 부모 컴포넌트의 useMemo 적용 (추가 개선 필요)

---

**작성일**: 2025-01-27  
**분석 기준**: 콘솔 로그 및 트래픽 분석  
**상태**: 개선 완료 (추가 최적화 가능)

