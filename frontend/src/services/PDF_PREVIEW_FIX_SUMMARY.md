# PDF 미리보기 문제 해결 요약

## 문제 원인 분석

로그를 보면 모든 데이터와 이미지 로드는 정상적으로 완료되었지만, PDF 미리보기에서 이미지와 텍스트가 반영되지 않습니다.

### 주요 원인

1. **컨테이너 렌더링 문제**
   - `opacity: 0` 또는 `z-index: -1`로 설정된 컨테이너는 html2canvas가 제대로 캡처하지 못할 수 있음
   - 브라우저 최적화로 보이지 않는 요소의 이미지를 로드하지 않을 수 있음

2. **캡처 타이밍 문제**
   - 이미지 로드 완료 후에도 실제 DOM 렌더링이 완료되지 않았을 수 있음
   - requestAnimationFrame을 통한 렌더링 사이클 대기가 필요

3. **html2canvas 설정 문제**
   - `onclone` 콜백으로 클론된 문서에서 이미지 상태 확인 필요
   - `logging: true`로 디버깅 정보 확인

## 적용된 해결 방법

### 1. 컨테이너 렌더링 방식 개선

```typescript
// 변경 전: opacity: 0, z-index: -1
container.style.opacity = '0';
container.style.zIndex = '-1';

// 변경 후: 렌더링 시에는 보이게, 캡처 직전에 숨김
container.style.zIndex = '9999'; // html2canvas가 캡처할 수 있도록
container.style.opacity = '1'; // 렌더링을 위해 1로 설정
// ... (렌더링 완료 후)
container.style.opacity = '0'; // 캡처 직전에 숨김
container.style.position = 'absolute';
container.style.left = '-9999px';
```

### 2. 렌더링 완료 대기 강화

```typescript
// DOM 삽입 후 브라우저 렌더링 완료 대기
await new Promise(resolve => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resolve(void 0);
    });
  });
});

// 이미지 로드 후 추가 대기
await new Promise(resolve => setTimeout(resolve, 500));
```

### 3. 렌더링 상태 검증

```typescript
// 컨테이너 렌더링 상태 확인
const renderedImages = container.querySelectorAll('img');
const imagesRendered = Array.from(renderedImages).filter((img: HTMLImageElement) => 
  img.complete && img.naturalWidth > 0
).length;
console.log('🔍 렌더링 상태 확인:', {
  imagesInDOM: renderedImages.length,
  imagesRendered: imagesRendered,
  containerHeight: container.offsetHeight
});
```

### 4. html2canvas 옵션 개선

```typescript
html2canvas: {
  logging: true, // 디버깅 정보 활성화
  onclone: (clonedDoc, element) => {
    // 클론된 문서에서 이미지 상태 확인
    const clonedImages = clonedDoc.querySelectorAll('img');
    // 각 이미지 로드 상태 확인 및 로그
  }
}
```

### 5. 데이터 전달 검증

```typescript
// PDF 생성 전 데이터 검증
console.log('📋 PDF 미리보기 데이터 준비:', {
  format: boardFormat,
  cutsWithImages: storyboardCuts.filter(c => c.imagePreview).length
});

// 첫 번째 이미지 샘플 확인
const firstCutWithImage = pdfData.storyboardCuts.find(c => c.imagePreview);
console.log('🖼️ 첫 번째 이미지 샘플:', {
  previewType: firstCutWithImage.imagePreview?.substring(0, 30)
});
```

## 예상 효과

1. **이미지 반영**: 컨테이너가 실제로 렌더링되어 이미지가 정상적으로 캡처됨
2. **텍스트 반영**: 렌더링 완료 대기로 텍스트가 올바르게 표시됨
3. **디버깅 개선**: 상세한 로그로 문제 지점 파악 가능

## 테스트 체크리스트

PDF 미리보기 테스트 시 다음 로그를 확인하세요:

- [ ] `📋 PDF 미리보기 데이터 준비` - 데이터 전달 확인
- [ ] `📋 StoryBoard HTML 생성` - HTML 생성 확인
- [ ] `📄 PDF 생성 데이터` - PDF 서비스 데이터 확인
- [ ] `✅ 폰트 로드 완료` - 폰트 로드 확인
- [ ] `✅ 모든 이미지 로드 완료` - 이미지 로드 확인
- [ ] `🔍 렌더링 상태 확인` - DOM 렌더링 상태 확인
- [ ] `📋 클론된 문서 이미지 수` - html2canvas 클론 확인
- [ ] `✅ 클론 이미지 N` - 각 이미지 캡처 확인

## 다음 단계

1. **테스트 실행**: PDF 미리보기 버튼 클릭 후 콘솔 로그 확인
2. **문제 지점 파악**: 로그에서 어느 단계에서 문제가 발생하는지 확인
3. **추가 조치**: 필요 시 추가 수정 사항 적용

