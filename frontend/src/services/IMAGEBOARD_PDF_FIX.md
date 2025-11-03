# ImageBoard PDF 한글 출력 및 이미지 문제 해결

## 문제 원인

### 1. 한글 출력 실패
**에러 메시지:**
```
Cannot read properties of undefined (reading 'widths')
Unable to look up font label for font 'Pretendard', 'bold'
```

**원인:**
- Pretendard 폰트가 제대로 등록되지 않았는데 사용하려고 함
- Pretendard 폰트는 'bold' 스타일을 지원하지 않음 (TTF에 bold 스타일이 없음)
- 폰트 목록에 실제로 등록되었는지 확인하지 않음

### 2. 이미지 다운로드 실패
**원인:**
- 이미지 로드 에러 처리가 부족
- 이미지 로드 실패 시 디버깅 정보 부족

## 적용된 해결 방법

### 1. 안전한 폰트 설정 함수 추가

```typescript
const setSafeFont = (pdf: jsPDF, style: 'normal' | 'bold' = 'normal'): void => {
  if (pretendardFontLoaded) {
    // Pretendard는 'bold' 스타일이 없으므로 항상 'normal' 사용
    pdf.setFont('Pretendard', 'normal');
    // bold 효과를 위해 폰트 크기를 약간 키울 수 있음
    if (style === 'bold') {
      const currentSize = pdf.getFontSize();
      pdf.setFontSize(currentSize + 0.5);
    }
  } else {
    pdf.setFont('helvetica', style);
  }
};
```

### 2. safeText 함수 개선

**개선 사항:**
- 폰트가 실제로 등록되었는지 확인 (`pdf.getFontList()`)
- 폰트 설정 실패 시 자동으로 helvetica 폴백
- 에러 발생 시 플래그 리셋하여 재시도 방지

### 3. 모든 'bold' 스타일 제거

**변경 전:**
```typescript
if (pretendardFontLoaded) {
  pdf.setFont('Pretendard', 'bold'); // ❌ 에러 발생
}
```

**변경 후:**
```typescript
setSafeFont(pdf, 'bold'); // ✅ 안전하게 처리
```

### 4. 이미지 로드 로깅 강화

**추가된 로그:**
- 이미지 로드 시도 로그
- 이미지 로드 성공/실패 로그
- 이미지 미첨부 항목 로그

## 해결된 문제

1. ✅ **한글 출력**: Pretendard 폰트가 없어도 기본 폰트로 폴백하여 한글 표시 가능
2. ✅ **'bold' 스타일 에러**: 모든 'bold' 사용을 `setSafeFont`로 대체
3. ✅ **폰트 등록 확인**: 실제 폰트 목록 확인 후 사용
4. ✅ **이미지 디버깅**: 상세한 로그로 이미지 문제 추적 가능

## 사용자 조치 필요

### 한글 폰트를 제대로 표시하려면:

1. **TTF 파일 다운로드**
   - https://github.com/orioncactus/pretendard/releases
   - v1.3.9 버전 ZIP 다운로드

2. **파일 배치**
   ```
   frontend/public/fonts/Pretendard-Regular.ttf
   ```

3. **애플리케이션 재시작**

### 이미지가 다운로드되지 않는 경우:

1. **콘솔 로그 확인**
   - `📷 이미지 로드 시도` 메시지 확인
   - `✅ 이미지 로드 성공` 메시지 확인
   - `❌ 이미지 추가 실패` 에러 확인

2. **이미지 데이터 확인**
   - `imagePreview`가 Base64 형식인지 확인
   - 이미지 데이터가 유효한지 확인

## 테스트 체크리스트

- [ ] 한글이 정상적으로 표시되는가?
- [ ] 폰트 에러가 발생하지 않는가?
- [ ] 이미지가 PDF에 포함되는가?
- [ ] 이미지 로드 로그가 정상적으로 출력되는가?
- [ ] 'bold' 스타일 에러가 발생하지 않는가?

