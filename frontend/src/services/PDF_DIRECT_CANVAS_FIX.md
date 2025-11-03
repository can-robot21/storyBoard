# PDF 미리보기 문제 해결 - html2canvas + jsPDF 직접 사용

## 문제 원인

html2pdf.js를 사용할 때 컨테이너를 캡처 직전에 숨기면(`opacity: 0`), html2canvas가 제대로 캡처하지 못할 수 있습니다.

로그를 보면:
- ✅ 모든 이미지가 정상적으로 로드됨
- ✅ html2canvas가 클론된 문서에 20개의 이미지를 감지함
- ❌ 하지만 PDF에는 이미지와 텍스트가 없음

이는 html2pdf.js가 내부적으로 html2canvas를 호출할 때 컨테이너가 이미 숨겨진 상태였거나, 캡처 과정에서 문제가 발생했을 가능성이 있습니다.

## 해결 방법

html2pdf.js 대신 **html2canvas와 jsPDF를 직접 사용**하여 더 명확한 제어를 가능하게 했습니다.

### 주요 변경 사항

1. **html2canvas 직접 사용**
   ```typescript
   import html2canvas from 'html2canvas';
   import jsPDF from 'jspdf';
   ```

2. **컨테이너를 캡처하는 동안에도 보이게 유지**
   - html2canvas가 캡처하는 동안 `opacity: 1` 유지
   - 캡처 완료 후에만 숨김

3. **명시적인 캔버스 생성 및 검증**
   ```typescript
   const canvas = await html2canvas(container, { ... });
   console.log('✅ Canvas 생성 완료:', {
     width: canvas.width,
     height: canvas.height
   });
   ```

4. **jsPDF로 직접 PDF 생성**
   - Canvas를 이미지로 변환
   - A4 페이지 크기에 맞게 분할
   - 여러 페이지로 나누기

### 페이지 분할 로직

전체 캔버스를 각 페이지에 추가하되, Y 오프셋으로 위치를 조정하여 자연스러운 페이지 분할을 구현했습니다.

```typescript
// 첫 페이지
pdf.addImage(canvas, 'JPEG', margin, margin, imgWidth, firstPageHeight);

// 추가 페이지 (Y 오프셋으로 위로 이동)
pdf.addImage(canvas, 'JPEG', margin, margin + yOffset, imgWidth, imgHeight);
```

## 예상 효과

1. **이미지 반영**: html2canvas가 컨테이너를 보이는 상태에서 캡처하므로 이미지가 정상적으로 포함됨
2. **텍스트 반영**: 폰트가 로드된 상태에서 캡처하므로 텍스트가 정상적으로 렌더링됨
3. **디버깅 개선**: 각 단계별로 명확한 로그 출력

## 테스트 체크리스트

- [ ] `✅ Canvas 생성 완료` 로그에서 width와 height가 0이 아님
- [ ] `📐 PDF 레이아웃 계산` 로그에서 올바른 페이지 수 계산
- [ ] PDF 미리보기에서 이미지가 보임
- [ ] PDF 미리보기에서 텍스트가 보임
- [ ] 저장된 PDF 파일에도 이미지와 텍스트가 포함됨

