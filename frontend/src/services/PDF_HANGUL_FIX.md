# PDF 한글 출력 오류 원인 분석 및 해결 방법

## 오류 증상

PDF 생성 시 한글 텍스트가 깨져서 출력됩니다:
- 예: "łm  ¥0", " Ü: 2025-11-02", "¥: LAım"
- 정상: "타이틀", "날짜: 2025-11-02", "장소: LA임"

## 원인 분석

### 1. jsPDF의 한글 미지원
- jsPDF는 기본적으로 **라틴 문자만 지원**합니다 (Helvetica, Times 등)
- 한글 문자를 렌더링하려면 **한글 폰트를 명시적으로 추가**해야 합니다

### 2. Pretendard 폰트 미설치
- 현재 코드는 `public/fonts/Pretendard-Regular.ttf` 파일을 찾아 로드합니다
- 폰트 파일이 없으면 기본 폰트(helvetica)를 사용하여 한글이 깨집니다

### 3. 폰트 로드 실패 시 폴백
- 폰트 로드가 실패하면 기본 폰트로 폴백하지만, 한글은 표시되지 않습니다

## 해결 방법

### 방법 1: Pretendard 폰트 설치 (권장)

1. **Pretendard 폰트 다운로드**
   - https://github.com/orioncactus/pretendard/releases
   - 또는 https://cactus.tistory.com/232

2. **TTF 파일 설치**
   ```
   frontend/public/fonts/Pretendard-Regular.ttf
   ```
   - 폴더가 없으면 생성: `mkdir -p frontend/public/fonts`

3. **폰트 로드 확인**
   - 브라우저 콘솔에서 `✅ Pretendard 폰트 로드 성공` 메시지 확인
   - 없다면 `⚠️ Pretendard 폰트 파일을 찾을 수 없습니다` 메시지 확인

### 방법 2: 다른 한글 폰트 사용

Pretendard 대신 다른 한글 폰트를 사용할 수 있습니다:

1. **Noto Sans CJK**
   - Google Fonts에서 제공
   - `public/fonts/NotoSansCJK-Regular.ttf` 경로에 설치
   - `pdfGenerationService.ts`의 폰트 경로 수정

2. **나눔고딕**
   - 네이버에서 제공
   - `public/fonts/NanumGothic-Regular.ttf` 경로에 설치

### 방법 3: 폰트 파일 확인 및 디버깅

1. **브라우저 개발자 도구**
   - Network 탭에서 `/fonts/Pretendard-Regular.ttf` 요청 확인
   - 404 에러인 경우 파일이 없는 것

2. **콘솔 로그 확인**
   ```javascript
   // 성공 시
   ✅ Pretendard 폰트 로드 성공
   
   // 실패 시
   ⚠️ Pretendard 폰트 파일을 찾을 수 없습니다. 기본 폰트를 사용합니다.
   폰트 파일 경로: public/fonts/Pretendard-Regular.ttf
   ```

## 코드 개선 사항

### 현재 구현
- `loadPretendardFont`: 폰트 파일을 로드하여 jsPDF에 추가
- `safeText`: Pretendard 폰트가 있으면 사용, 없으면 기본 폰트 사용

### 개선 가능한 부분
1. **폰트 로드 실패 시 사용자 알림**
   - 폰트 로드 실패 시 모달이나 알림 표시
   
2. **폰트 파일 검증**
   - 폰트 파일 크기 및 형식 검증
   
3. **다중 폰트 지원**
   - Bold, Light 등 다양한 굵기 지원

## 참고 자료

- jsPDF 폰트 추가: https://github.com/parallax/jsPDF#use-of-utf-8--ttf
- Pretendard 프로젝트: https://github.com/orioncactus/pretendard
- WOFF2 to TTF 변환: https://cloudconvert.com/woff2-to-ttf

