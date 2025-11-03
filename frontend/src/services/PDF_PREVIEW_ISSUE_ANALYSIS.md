# PDF 미리보기 이미지/텍스트 미반영 문제 원인 분석

## 문제 증상

PDF 미리보기에서 이미지와 텍스트 등 정보가 제대로 반영되지 않음

## 원인 분석

### 1. 이미지 로드 문제

#### 현재 이미지 처리 방식
```typescript
// StoryboardGenerator에서 이미지 업로드
reader.readAsDataURL(file);  // Base64 데이터 URL 생성
// 결과: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

#### 문제점
1. **컨테이너가 숨겨져 있어 이미지가 실제로 로드되지 않을 수 있음**
   ```typescript
   container.style.position = 'absolute';
   container.style.left = '-9999px';  // 화면 밖으로 이동
   ```
   - 브라우저가 최적화를 위해 보이지 않는 이미지를 로드하지 않을 수 있음
   - 이미지가 완전히 렌더링되기 전에 캡처될 수 있음

2. **이미지 로드 대기 로직 부족**
   ```typescript
   if (img.complete) {
     resolve();  // 이미 완료된 것으로 판단하지만, 실제로는 로드 안 됐을 수 있음
   }
   ```

3. **Base64 데이터가 너무 길어서 잘릴 수 있음**

### 2. 텍스트 렌더링 문제

#### 현재 텍스트 처리
```typescript
escapeHtml(cut.description).replace(/\n/g, '<br>')
```

#### 문제점
1. **한글 폰트 로드 타이밍**
   - Pretendard 폰트가 CDN에서 로드되는데, 로드 전에 캡처될 수 있음
   - 폰트가 로드되지 않으면 텍스트가 깨지거나 보이지 않을 수 있음

2. **텍스트 이스케이프 문제**
   - 특수문자 처리 시 문제 발생 가능

### 3. html2canvas 설정 문제

```typescript
html2canvas: { 
  useCORS: true,  // CORS 허용
  allowTaint: false,  // Taint 허용 안 함 (Base64는 문제 없어야 함)
  letterRendering: true,  // 한글 렌더링
}
```

#### 문제점
1. **Base64 이미지 처리**
   - `allowTaint: false`와 Base64 조합이 문제를 일으킬 수 있음
   - Base64는 CORS 문제가 없으므로 `allowTaint: true`로 변경 가능

2. **폰트 렌더링 타이밍**
   - 폰트 로드를 기다리지 않음

## 해결 방법

### 방법 1: 이미지 로드 강화 (즉시 적용)

```typescript
// 이미지 로드 대기 개선
const images = container.querySelectorAll('img');
await Promise.all(
  Array.from(images).map((img: HTMLImageElement) => {
    return new Promise<void>((resolve) => {
      // 이미 Base64 데이터인 경우 즉시 확인
      if (img.src.startsWith('data:')) {
        // Base64 데이터가 올바른지 확인
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('이미지 로드 실패:', img.src.substring(0, 50));
            resolve(); // 실패해도 계속 진행
          };
          // 타임아웃 추가 (5초)
          setTimeout(() => resolve(), 5000);
        }
      } else {
        // 외부 URL인 경우
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('이미지 로드 실패:', img.src);
            resolve();
          };
          setTimeout(() => resolve(), 5000);
        }
      }
    });
  })
);
```

### 방법 2: 컨테이너 표시 방식 개선

```typescript
// 숨기지 않고 화면 밖으로 이동하되, 실제로는 렌더링되도록
container.style.position = 'fixed';
container.style.top = '0';
container.style.left = '0';
container.style.width = '210mm';
container.style.height = 'auto';
container.style.zIndex = '-1';
container.style.opacity = '0';
container.style.pointerEvents = 'none';
// 실제로는 DOM에 존재하므로 이미지가 로드됨
```

### 방법 3: 폰트 로드 대기

```typescript
// 폰트 로드 대기 함수
const waitForFonts = async (): Promise<void> => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  } else {
    // 폰트 로드 대기 (최대 3초)
    await new Promise(resolve => {
      let checkCount = 0;
      const checkFont = () => {
        checkCount++;
        // Pretendard 폰트 로드 확인
        if (checkCount > 30 || document.fonts?.check('1em Pretendard')) {
          resolve(void 0);
        } else {
          setTimeout(checkFont, 100);
        }
      };
      checkFont();
    });
  }
};
```

### 방법 4: html2canvas 옵션 개선

```typescript
html2canvas: { 
  scale: 2,
  useCORS: true,
  logging: true,  // 디버깅을 위해 임시로 활성화
  letterRendering: true,
  allowTaint: true,  // Base64 이미지를 위해 true로 변경
  backgroundColor: '#ffffff',
  width: 794,
  height: 1123,
  onclone: (clonedDoc) => {
    // 클론된 문서에서 추가 확인
    console.log('클론된 문서 확인:', clonedDoc);
  }
}
```

### 방법 5: 데이터 검증 및 로깅

```typescript
// PDF 생성 전 데이터 검증
console.log('PDF 생성 데이터:', {
  headerData: data.headerData,
  cutsCount: data.storyboardCuts?.length || 0,
  imagesWithPreview: data.storyboardCuts?.filter(c => c.imagePreview).length || 0,
  firstCutImage: data.storyboardCuts?.[0]?.imagePreview?.substring(0, 50)
});

// HTML 생성 후 검증
console.log('생성된 HTML 길이:', html.length);
console.log('이미지 태그 수:', (html.match(/<img/g) || []).length);
```

## 권장 해결 순서

1. **즉시 적용**: 이미지 로드 대기 개선 + 데이터 검증 로그 추가
2. **단기**: 컨테이너 표시 방식 개선 (opacity: 0 사용)
3. **중기**: 폰트 로드 대기 추가
4. **장기**: html2canvas 옵션 최적화

