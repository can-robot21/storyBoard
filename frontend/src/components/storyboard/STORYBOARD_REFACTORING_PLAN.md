# 스토리보드 생성기 리팩토링 계획

## 현재 상태 분석

- **파일 크기**: 1565줄
- **상태 관리**: 10개 이상의 useState
- **핸들러 함수**: 20개 이상
- **JSX 렌더링**: 500줄 이상
- **타입 정의**: 파일 내부에 정의됨

## 리팩토링 목표

1. 코드 가독성 향상
2. 재사용성 증대
3. 유지보수성 개선
4. 테스트 용이성 향상
5. 단일 책임 원칙 준수

## 분리 계획

### 1. 타입 정의 분리 ✅
**파일**: `types/storyboard.ts`
- `BoardFormat`
- `HeaderData`
- `StoryboardCut`
- `ImageBoardItem`
- `PDFBlob`
- `StoryboardGeneratorProps`

### 2. 커스텀 훅 분리 ✅
**파일**: `hooks/useStoryboard.ts`
- 모든 상태 관리 통합
- 기본 핸들러 함수 포함

### 3. 유틸리티 함수 분리 ✅
**파일**: `utils/storyboardUtils.ts`
- `getNextCutNumber`: 컷 넘버 계산
- `getConsecutiveImageOnlyCount`: 연속 이미지 개수 확인
- `dataURLtoBlob`: Base64 → Blob 변환
- `fileToDataURL`: File → Base64 변환
- `createStoryboardCut`: 컷 생성
- `createImageBoardItem`: ImageBoard 항목 생성

### 4. 헤더 섹션 컴포넌트 ✅
**파일**: `components/storyboard/HeaderSection.tsx`
- 상단 입력 필드 관리
- StoryBoard/ImageBoard 형식별 필드 렌더링

### 5. 샘플 미리보기 컴포넌트
**파일**: `components/storyboard/SamplePreview.tsx`
- 프로젝트 정보 표시
- PDF 미리보기 버튼
- 이미지+내용 저장 버튼

### 6. StoryBoard 본문 컴포넌트
**파일**: `components/storyboard/StoryBoardBody.tsx`
- 컷 추가 버튼
- 컷 목록 렌더링
- 페이지네이션
- 이미지만 추가 그룹 렌더링

### 7. ImageBoard 본문 컴포넌트
**파일**: `components/storyboard/ImageBoardBody.tsx`
- 이미지 추가 버튼
- 3x3 그리드 렌더링
- 페이지네이션

### 8. PDF 미리보기 모달 컴포넌트
**파일**: `components/storyboard/PDFPreviewModal.tsx`
- PDF iframe 뷰어
- 출력/저장 버튼
- 모달 닫기

### 9. 핸들러 훅 분리
**파일**: `hooks/useStoryboardHandlers.ts`
- 컷 추가/삭제 핸들러
- 이미지 업로드/제거 핸들러
- 설명 변경 핸들러
- PDF 관련 핸들러

### 10. 메인 컴포넌트 리팩토링
**파일**: `components/storyboard/StoryboardGenerator.tsx`
- 훅과 컴포넌트 조합
- 라우팅 및 레이아웃만 관리

## 디렉토리 구조

```
frontend/src/
├── components/
│   └── storyboard/
│       ├── StoryboardGenerator.tsx (메인)
│       ├── HeaderSection.tsx ✅
│       ├── SamplePreview.tsx
│       ├── StoryBoardBody.tsx
│       ├── ImageBoardBody.tsx
│       └── PDFPreviewModal.tsx
├── hooks/
│   ├── useStoryboard.ts ✅
│   └── useStoryboardHandlers.ts
├── types/
│   └── storyboard.ts ✅
└── utils/
    └── storyboardUtils.ts ✅
```

## 진행 단계

1. ✅ 타입 정의 분리
2. ✅ 커스텀 훅 기본 구조 생성
3. ✅ 유틸리티 함수 분리
4. ✅ 헤더 섹션 컴포넌트 생성
5. ⏳ 핸들러 훅 완성
6. ⏳ 샘플 미리보기 컴포넌트
7. ⏳ StoryBoard 본문 컴포넌트
8. ⏳ ImageBoard 본문 컴포넌트
9. ⏳ PDF 미리보기 모달 컴포넌트
10. ⏳ 메인 컴포넌트 리팩토링

