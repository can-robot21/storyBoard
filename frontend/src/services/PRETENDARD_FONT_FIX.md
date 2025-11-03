# Pretendard 폰트 적용 문제 해결 방안

## 현재 문제점

### 1. jsPDF에서 한글 폰트 미적용
- **원인**: `public/fonts/Pretendard-Regular.ttf` 파일이 없음
- **증상**: 한글이 깨져서 표시됨 (예: "미국출장기" → "»ø-m ÍœÇ¥®0")
- **영향**: PDF 텍스트가 제대로 표시되지 않음

### 2. 하이브리드 PDF 생성 시 폰트 로드
- HTML/CSS 렌더링은 CDN 폰트 사용
- `html2canvas` 캡처 시 폰트가 제대로 렌더링되어야 함
- 폰트 로드 대기 시간 필요

## 해결 방안

### 1. TTF 폰트 파일 다운로드 및 설치

**필수 단계:**
1. Pretendard GitHub 릴리스 페이지 방문
   - https://github.com/orioncactus/pretendard/releases
   - v1.3.9 버전 다운로드

2. TTF 파일 추출
   - 다운로드한 ZIP 파일 압축 해제
   - `public/fonts/Pretendard-Regular.ttf` 파일 복사

3. 파일 구조
   ```
   frontend/
   └── public/
       └── fonts/
           └── Pretendard-Regular.ttf  ← 필수
   ```

### 2. 폰트 로드 개선

**jsPDF 방식 (pdfGenerationService.ts):**
- TTF 파일을 Base64로 변환하여 jsPDF에 임베드
- `addFileToVFS` 및 `addFont` 메서드 사용
- 로드 실패 시 상세한 에러 메시지 및 해결 방법 안내

**하이브리드 방식 (pdfGenerationServiceHybrid.ts):**
- HTML/CSS에서 CDN Pretendard 폰트 사용
- `@font-face` 선언으로 명시적 폰트 로드
- `font-display: swap`으로 빠른 렌더링
- `html2canvas` 캡처 전 폰트 로드 대기

### 3. 폰트 로드 대기 시간 확보

**현재 구현:**
- `requestAnimationFrame` 두 번 호출로 렌더링 대기
- 추가 `setTimeout`으로 이미지/폰트 로드 대기

**개선 제안:**
- `document.fonts.ready` Promise 사용
- 폰트 로드 완료 확인 후 캡처

## 적용된 개선 사항

### 1. 에러 메시지 개선
- 폰트 파일 미존재 시 상세한 안내 메시지
- 해결 방법 단계별 설명

### 2. 폰트 로드 로깅 강화
- 로드 단계별 콘솔 로그 추가
- 성공/실패 명확히 표시

### 3. 하이브리드 방식 폰트 선언 개선
- `@font-face` 명시적 선언 추가
- `font-display: swap` 적용
- `preload` 링크 추가

## 사용자 조치 필요

1. **TTF 파일 다운로드**
   ```
   https://github.com/orioncactus/pretendard/releases/download/v1.3.9/Pretendard-1.3.9.zip
   ```

2. **파일 추출 및 배치**
   - ZIP 파일 압축 해제
   - TTF 파일을 `frontend/public/fonts/` 폴더에 복사
   - 파일명: `Pretendard-Regular.ttf`

3. **애플리케이션 재시작**
   - 개발 서버 재시작
   - 브라우저 캐시 클리어

## 확인 방법

1. **콘솔 로그 확인**
   - `✅ Pretendard 폰트 로드 성공` 메시지 확인
   - `✅ Pretendard 폰트 jsPDF에 추가 성공` 메시지 확인

2. **PDF 미리보기 확인**
   - 한글이 정상적으로 표시되는지 확인
   - 폰트 스타일이 적용되었는지 확인

3. **폰트 파일 확인**
   ```
   파일 존재 여부: public/fonts/Pretendard-Regular.ttf
   파일 크기: 약 2-3MB (TTF 파일)
   ```

