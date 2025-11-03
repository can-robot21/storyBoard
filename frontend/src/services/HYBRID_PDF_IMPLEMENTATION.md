# 하이브리드 PDF 생성 구현 완료

## 구현 내용

### 1. html2pdf.js 라이브러리 설치
```bash
npm install html2pdf.js --save --legacy-peer-deps
```

### 2. 새로운 하이브리드 PDF 서비스 생성
- 파일: `frontend/src/services/pdfGenerationServiceHybrid.ts`
- HTML/CSS로 스토리보드 렌더링 후 PDF 변환

### 3. 기존 PDF 서비스 수정
- `generatePDFBlob` 함수가 하이브리드 방식을 우선 사용
- 실패 시 기존 jsPDF 방식으로 폴백

## 한글 문제 해결 방법

### 1. Pretendard 폰트 CDN 로드
```html
<link rel="stylesheet" as="style" crossorigin 
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
```

### 2. CSS font-family 설정
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 
  'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
```

### 3. html2canvas 한글 렌더링 개선
```typescript
html2canvas: { 
  letterRendering: true,  // 한글 렌더링 개선
  scale: 2,  // 고해상도
  useCORS: true,
  backgroundColor: '#ffffff'
}
```

## 주요 개선 사항

### 1. 레이아웃 정확도 향상
- ✅ CSS 레이아웃 사용으로 정확한 위치 계산
- ✅ 페이지 브레이크 자동 처리 (`page-break-inside: avoid`)
- ✅ 이미지 비율 자동 유지 (`object-fit: contain`)

### 2. 한글 출력 문제 해결
- ✅ Pretendard 폰트 CDN 로드
- ✅ html2canvas의 `letterRendering: true` 옵션
- ✅ UTF-8 인코딩 명시 (`<meta charset="UTF-8">`)

### 3. 코드 유지보수성 향상
- ✅ HTML/CSS 기반으로 디버깅 용이
- ✅ 화면과 PDF 레이아웃 일치
- ✅ CSS 미디어 쿼리로 인쇄 스타일 제어

## 사용 방법

### 자동 전환
기존 코드 변경 없이 자동으로 하이브리드 방식 사용:
```typescript
const blob = await generatePDFBlob(pdfData);
```

### 폴백 동작
하이브리드 방식 실패 시 자동으로 jsPDF 방식 사용

## 테스트 체크리스트

- [ ] 한글 텍스트 정상 출력 확인
- [ ] 레이아웃이 일관되게 유지되는지 확인
- [ ] 이미지가 올바른 비율로 표시되는지 확인
- [ ] 페이지 브레이크가 적절한 위치에서 발생하는지 확인
- [ ] StoryBoard와 ImageBoard 모두 정상 작동하는지 확인

## 문제 발생 시

### 1. html2pdf.js 로드 실패
- 브라우저 콘솔 확인
- 자동으로 jsPDF 방식으로 폴백됨

### 2. 한글 깨짐
- 브라우저 개발자 도구에서 Pretendard 폰트 로드 확인
- 네트워크 탭에서 CDN 응답 확인

### 3. 레이아웃 깨짐
- 임시 컨테이너의 CSS 확인
- html2canvas 옵션 조정 필요 시 수정

## 참고 사항

- html2pdf.js는 html2canvas와 jsPDF를 내부적으로 사용
- 이미지 로드는 자동으로 대기하므로 안전함
- 임시 컨테이너는 PDF 생성 후 자동 제거됨

