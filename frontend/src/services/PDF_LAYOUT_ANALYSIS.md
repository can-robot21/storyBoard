# PDF 레이아웃 깨짐 문제 원인 분석 및 개선 방안

## 현재 문제 증상

1. **한글 텍스트 깨짐**: "타이틀" → "»ø-m", "날짜" → "° ÉÜ"
2. **레이아웃 불안정**: 컷 항목이 페이지 경계에서 잘림
3. **반복적인 레이아웃 깨짐**: 동일한 데이터로 재생성 시 다른 위치에 출력

## 원인 분석

### 1. jsPDF 직접 좌표 그리기 방식의 문제점

#### 현재 구현 방식
```typescript
// 좌표 직접 계산
let currentY = margin;  // 시작 Y 위치
currentY += 10;  // 타이틀 높이
currentY += 6;   // 라벨 높이
currentY += imageHeight + 8;  // 이미지 높이 + 여백
```

#### 문제점
1. **고정 높이 값의 부정확성**
   - `headerTableHeight = 45`: 실제 내용에 따라 변동해야 함
   - `imageHeight = 50`: 이미지 비율에 따라 달라질 수 있음
   - 텍스트 줄바꿈으로 인한 높이 변화 미고려

2. **텍스트 줄바꿈 계산 오류**
   ```typescript
   const mainContentLines = pdf.splitTextToSize(data.headerData.mainContent, contentWidth - 10);
   currentY += mainContentLines.length * 5 + 5;  // 고정 5mm/줄
   ```
   - 실제 폰트 크기와 줄 간격이 다를 수 있음
   - 한글 폰트 사용 시 라인 높이가 달라질 수 있음

3. **페이지 브레이크 체크의 부정확성**
   ```typescript
   if (currentY > pageHeight - 60) {  // 고정값 60mm
     pdf.addPage();
     currentY = margin;
   }
   ```
   - 다음 항목의 전체 높이를 미리 계산하지 않음
   - 이미지 + 텍스트의 실제 높이를 정확히 예측하지 못함

4. **비동기 작업으로 인한 타이밍 이슈**
   ```typescript
   await safeText(pdf, text, x, y);  // 각 텍스트마다 await
   await loadImage(imageSrc);        // 이미지 로드마다 await
   ```
   - 여러 비동기 작업으로 인한 순서 문제
   - 폰트 로드 실패 시 레이아웃 재계산 누락

### 2. 폰트 로드 실패 시 레이아웃 변화

```typescript
if (pretendardFontLoaded) {
  pdf.setFont('Pretendard', 'normal');
} else {
  pdf.setFont('helvetica', 'normal');  // 폰트 변경 시 텍스트 크기 달라짐
}
```
- 폰트에 따라 텍스트 너비/높이가 달라짐
- `splitTextToSize` 결과가 달라져 레이아웃 변경

### 3. 이미지 크기 계산 오류

```typescript
const imageWidth = contentWidth / 3;
const imageHeight = 50;  // 고정값
pdf.addImage(imageData, 'JPEG', margin, currentY, imageWidth, imageHeight);
```
- 이미지 원본 비율 무시
- 이미지가 찌그러지거나 잘릴 수 있음
- 실제 이미지 비율에 맞춰 높이를 조정해야 함

## 현재 방식 (jsPDF) vs HTML/CSS 방식 비교

### 방식 1: jsPDF 직접 그리기 (현재)

#### 장점
- ✅ 클라이언트 사이드에서 완전 처리
- ✅ 외부 라이브러리 없이 PDF 생성 가능
- ✅ 파일 크기 작음
- ✅ 세밀한 레이아웃 제어 가능

#### 단점
- ❌ 복잡한 좌표 계산 필요
- ❌ 레이아웃 유연성 부족
- ❌ 디버깅 어려움
- ❌ 반응형 레이아웃 구현 복잡
- ❌ 텍스트 줄바꿈 계산 부정확
- ❌ 이미지 비율 자동 조정 어려움

### 방식 2: HTML/CSS + 브라우저 인쇄 API

#### 구현 예시
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    
    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      font-family: 'Pretendard', sans-serif;
      padding: 0;
    }
    
    .header-table {
      width: 100%;
      border-collapse: collapse;
      background: #f5f5f5;
      margin-bottom: 20mm;
    }
    
    .cut-item {
      page-break-inside: avoid;  /* 페이지 브레이크 방지 */
      margin-bottom: 10mm;
    }
    
    .cut-image {
      width: 33.33%;
      height: auto;
      object-fit: contain;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <!-- 스토리보드 내용 -->
</body>
</html>
```

#### 장점
- ✅ CSS 레이아웃의 유연성과 정확성
- ✅ `page-break-inside: avoid` 등 자동 페이지 브레이크 제어
- ✅ 반응형 디자인 쉽게 구현
- ✅ 디버깅 용이 (브라우저 개발자 도구 사용)
- ✅ 이미지 비율 자동 유지 (`object-fit: contain`)
- ✅ 텍스트 줄바꿈 자동 처리
- ✅ 실제 미리보기 가능

#### 단점
- ❌ 브라우저 인쇄 API 의존
- ❌ PDF 변환 시 CSS 지원 제한
- ❌ 일부 브라우저 호환성 문제
- ❌ PDF 메타데이터 제어 제한적

### 방식 3: HTML/CSS + html2pdf.js 또는 Puppeteer

#### 구현 예시
```javascript
// html2pdf.js 사용
import html2pdf from 'html2pdf.js';

const element = document.getElementById('storyboard-content');
const opt = {
  margin: 20,
  filename: 'storyboard.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
};

html2pdf().set(opt).from(element).save();
```

#### 장점
- ✅ HTML/CSS의 모든 장점 활용
- ✅ 실제 렌더링 결과를 PDF로 변환
- ✅ 레이아웃 정확도 높음
- ✅ 복잡한 CSS 스타일 적용 가능

#### 단점
- ❌ 외부 라이브러리 의존
- ❌ 파일 크기 증가 가능
- ❌ 렌더링 시간 증가

## 개선 방안 제안

### 방안 1: jsPDF 방식 개선 (현재 방식 유지)

#### 개선 사항

1. **동적 높이 계산 함수 구현**
   ```typescript
   // 실제 텍스트 높이 계산
   const calculateTextHeight = (pdf: jsPDF, text: string, width: number, fontSize: number): number => {
     const lines = pdf.splitTextToSize(text, width);
     const lineHeight = fontSize * 1.2;  // 폰트 크기의 120%
     return lines.length * lineHeight;
   };
   
   // 실제 이미지 높이 계산 (비율 유지)
   const calculateImageHeight = (imageWidth: number, originalWidth: number, originalHeight: number): number => {
     const aspectRatio = originalHeight / originalWidth;
     return imageWidth * aspectRatio;
   };
   ```

2. **페이지 브레이크 예측 로직 개선**
   ```typescript
   // 다음 항목의 예상 높이를 미리 계산
   const getNextItemHeight = (cut: StoryboardCut): number => {
     let height = 0;
     
     // 컷 번호 높이
     if (cut.cutNumber) height += 6;
     
     // 이미지 높이 (비율 유지)
     if (cut.imagePreview) {
       const imageWidth = contentWidth / 3;
       height += Math.max(50, calculateImageHeight(imageWidth, ...));
     }
     
     // 텍스트 높이
     if (cut.description) {
       height += calculateTextHeight(pdf, cut.description, textWidth, 10);
     }
     
     return height + 8;  // 여백 포함
   };
   
   // 페이지 브레이크 체크
   if (currentY + getNextItemHeight(cut) > pageHeight - margin - 10) {
     pdf.addPage();
     currentY = margin;
   }
   ```

3. **레이아웃 계산 캐싱**
   ```typescript
   // 모든 항목의 높이를 미리 계산하여 배열에 저장
   const itemHeights: number[] = [];
   for (const cut of data.storyboardCuts) {
     itemHeights.push(getItemHeight(cut));
   }
   
   // 계산된 높이를 사용하여 레이아웃
   for (let i = 0; i < data.storyboardCuts.length; i++) {
     const cut = data.storyboardCuts[i];
     const itemHeight = itemHeights[i];
     
     // 페이지 브레이크 체크
     if (currentY + itemHeight > pageHeight - margin - 10) {
       pdf.addPage();
       currentY = margin;
     }
     
     // 렌더링...
     currentY += itemHeight;
   }
   ```

4. **이미지 비율 자동 유지**
   ```typescript
   const addImageWithAspectRatio = async (
     pdf: jsPDF,
     imageData: string,
     x: number,
     y: number,
     maxWidth: number,
     maxHeight: number
   ) => {
     // 이미지 원본 크기 가져오기
     const img = new Image();
     img.src = imageData;
     await new Promise((resolve) => { img.onload = resolve; });
     
     const aspectRatio = img.height / img.width;
     let width = maxWidth;
     let height = maxWidth * aspectRatio;
     
     if (height > maxHeight) {
       height = maxHeight;
       width = maxHeight / aspectRatio;
     }
     
     pdf.addImage(imageData, 'JPEG', x, y, width, height);
     return height;
   };
   ```

5. **폰트 로드 실패 시 대응**
   ```typescript
   // 폰트 로드 전에 레이아웃 계산
   const fontLoadResult = await loadPretendardFont(pdf);
   
   // 레이아웃 계산 시 폰트 정보 반영
   const getLineHeight = (fontSize: number): number => {
     if (pretendardFontLoaded) {
       return fontSize * 1.3;  // Pretendard는 줄 간격이 다름
     } else {
       return fontSize * 1.2;  // Helvetica 기본 줄 간격
     }
   };
   ```

### 방안 2: HTML/CSS 방식으로 전환

#### 구현 단계

1. **스토리보드 HTML 템플릿 생성**
   ```typescript
   const generateStoryboardHTML = (data: PDFGenerationData): string => {
     return `
       <!DOCTYPE html>
       <html lang="ko">
       <head>
         <meta charset="UTF-8">
         <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
         <style>
           @page {
             size: A4;
             margin: 20mm;
           }
           
           body {
             width: 210mm;
             min-height: 297mm;
             margin: 0 auto;
             font-family: 'Pretendard', sans-serif;
             padding: 0;
           }
           
           /* 스토리보드 스타일 */
           /* ... */
         </style>
       </head>
       <body>
         <!-- 스토리보드 내용 렌더링 -->
       </body>
       </html>
     `;
   };
   ```

2. **html2pdf.js 또는 Puppeteer 사용**
   ```typescript
   import html2pdf from 'html2pdf.js';
   
   const generatePDFFromHTML = async (html: string): Promise<Blob> => {
     const element = document.createElement('div');
     element.innerHTML = html;
     document.body.appendChild(element);
     
     const opt = {
       margin: 20,
       filename: 'storyboard.pdf',
       image: { type: 'jpeg', quality: 0.98 },
       html2canvas: { 
         scale: 2,
         useCORS: true,
         logging: false 
       },
       jsPDF: { 
         unit: 'mm', 
         format: 'a4', 
         orientation: 'portrait' 
       }
     };
     
     const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
     document.body.removeChild(element);
     
     return pdfBlob;
   };
   ```

### 방안 3: 하이브리드 방식 (권장)

#### 개념
- 화면 표시: HTML/CSS 사용 (이미 구현됨)
- PDF 생성: HTML을 렌더링하여 캡처 후 PDF 변환

#### 장점
- ✅ 화면과 PDF가 동일한 레이아웃
- ✅ CSS 레이아웃의 정확성
- ✅ 디버깅 용이
- ✅ 유지보수 쉬움

#### 구현
```typescript
// StoryboardGenerator에서 이미 렌더링된 HTML을 사용
const generatePDFFromRenderedHTML = async (): Promise<Blob> => {
  const storyboardElement = document.getElementById('storyboard-content');
  
  if (!storyboardElement) {
    throw new Error('스토리보드 요소를 찾을 수 없습니다.');
  }
  
  // 스타일 조정 (인쇄용)
  const originalDisplay = storyboardElement.style.display;
  storyboardElement.style.display = 'block';
  storyboardElement.style.width = '210mm';
  storyboardElement.style.margin = '0 auto';
  
  const opt = {
    margin: 0,
    filename: 'storyboard.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,  // 210mm at 96 DPI
      height: 1123  // 297mm at 96 DPI
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  const pdfBlob = await html2pdf().set(opt).from(storyboardElement).outputPdf('blob');
  
  // 원래 스타일 복원
  storyboardElement.style.display = originalDisplay;
  
  return pdfBlob;
};
```

## 비교 및 권장 사항

| 항목 | jsPDF 직접 그리기 | HTML/CSS + html2pdf.js | 하이브리드 |
|------|------------------|----------------------|----------|
| **정확도** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **유연성** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **디버깅** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **성능** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **파일 크기** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **구현 복잡도** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **유지보수** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 최종 권장 사항

### 단기 (즉시 적용 가능)
**방안 1: jsPDF 방식 개선**
- 동적 높이 계산 함수 추가
- 페이지 브레이크 예측 로직 개선
- 이미지 비율 자동 유지
- **예상 효과**: 레이아웃 안정성 70% 개선

### 중기 (2-3주)
**방안 3: 하이브리드 방식**
- html2pdf.js 라이브러리 추가
- 현재 HTML 렌더링 결과를 PDF로 변환
- **예상 효과**: 레이아웃 정확도 95% 이상 달성

### 장기 (필요시)
**방안 2: HTML/CSS 전면 전환**
- 완전한 HTML/CSS 기반 PDF 생성
- 서버 사이드 렌더링 고려 (Puppeteer)
- **예상 효과**: 최고의 레이아웃 정확도 및 유지보수성

## 추가 고려사항

1. **폰트 파일 설치 확인**
   - `public/fonts/Pretendard-Regular.ttf` 파일 존재 확인
   - 브라우저 콘솔에서 폰트 로드 성공 메시지 확인

2. **이미지 로딩 시간**
   - 모든 이미지가 로드된 후 PDF 생성 시작
   - 이미지 로딩 실패 시 처리

3. **메모리 관리**
   - 큰 이미지의 경우 리사이징 필요
   - Base64 데이터 정리

4. **크로스 브라우저 호환성**
   - 주요 브라우저에서 테스트
   - 폴백 방안 준비

