# 스토리보드 생성기 리팩토링 진행 상황

## 완료된 작업 ✅

### 1. 타입 정의 분리 ✅
**파일**: `types/storyboard.ts`
- `BoardFormat`
- `HeaderData`
- `StoryboardCut`
- `ImageBoardItem`
- `PDFBlob`
- `StoryboardGeneratorProps`

### 2. 커스텀 훅 기본 구조 ✅
**파일**: `hooks/useStoryboard.ts`
- 모든 상태 관리 통합
- 기본 핸들러 함수 포함

### 3. 핸들러 훅 분리 ✅
**파일**: `hooks/useStoryboardHandlers.ts`
- 컷 추가/삭제 핸들러
- 이미지 업로드/제거 핸들러
- 설명 변경 핸들러
- 파일 선택 핸들러

### 4. 유틸리티 함수 분리 ✅
**파일**: `utils/storyboardUtils.ts`
- `getNextCutNumber`: 컷 넘버 계산
- `getConsecutiveImageOnlyCount`: 연속 이미지 개수 확인
- `dataURLtoBlob`: Base64 → Blob 변환
- `fileToDataURL`: File → Base64 변환
- `createStoryboardCut`: 컷 생성
- `createImageBoardItem`: ImageBoard 항목 생성
- `getEffectivePageCount`: 페이지네이션 계산
- `getDisplayedCuts`: 페이지네이션된 컷 목록 반환

### 5. 헤더 섹션 컴포넌트 ✅
**파일**: `components/storyboard/HeaderSection.tsx`
- 상단 입력 필드 관리
- StoryBoard/ImageBoard 형식별 필드 렌더링
- 보이기/감추기 기능

### 6. 샘플 미리보기 컴포넌트 ✅
**파일**: `components/storyboard/SamplePreview.tsx`
- 프로젝트 정보 표시
- PDF 미리보기 버튼
- 이미지+내용 저장 버튼

### 7. PDF 미리보기 모달 컴포넌트 ✅
**파일**: `components/storyboard/PDFPreviewModal.tsx`
- PDF iframe 뷰어
- 출력/저장 버튼
- 모달 닫기

## 진행 중/대기 중인 작업 ⏳

### 8. StoryBoard 본문 컴포넌트 ⏳
**파일**: `components/storyboard/StoryBoardBody.tsx`
- 컷 추가 버튼
- 컷 목록 렌더링
- 페이지네이션
- 이미지만 추가 그룹 렌더링

### 9. ImageBoard 본문 컴포넌트 ⏳
**파일**: `components/storyboard/ImageBoardBody.tsx`
- 이미지 추가 버튼
- 3x3 그리드 렌더링
- 페이지네이션

### 10. 메인 컴포넌트 리팩토링 ⏳
**파일**: `components/storyboard/StoryboardGenerator.tsx`
- 훅과 컴포넌트 조합
- 라우팅 및 레이아웃만 관리

## 예상 효과

### 코드 가독성
- **현재**: 1565줄 단일 파일
- **예상**: 메인 파일 ~200줄, 각 모듈 ~100-300줄

### 유지보수성
- ✅ 타입 정의 중앙화
- ✅ 재사용 가능한 훅
- ✅ 분리된 컴포넌트로 독립적 수정 가능

### 테스트 용이성
- ✅ 유틸리티 함수 단위 테스트 가능
- ✅ 컴포넌트별 독립 테스트 가능
- ✅ 훅 테스트 가능

## 디렉토리 구조

```
frontend/src/
├── components/
│   └── storyboard/
│       ├── StoryboardGenerator.tsx (메인, 리팩토링 대기)
│       ├── HeaderSection.tsx ✅
│       ├── SamplePreview.tsx ✅
│       ├── PDFPreviewModal.tsx ✅
│       ├── StoryBoardBody.tsx (대기)
│       └── ImageBoardBody.tsx (대기)
├── hooks/
│   ├── useStoryboard.ts ✅
│   └── useStoryboardHandlers.ts ✅
├── types/
│   └── storyboard.ts ✅
└── utils/
    └── storyboardUtils.ts ✅
```

## 다음 단계

1. StoryBoard 본문 컴포넌트 분리
2. ImageBoard 본문 컴포넌트 분리
3. 메인 컴포넌트 리팩토링 및 통합
4. 테스트 작성
5. 문서화 완료

