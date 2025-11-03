# PDF 미리보기 버튼 공백 문제 원인 분석

## 문제 증상

'PDF 미리보기' 버튼이 공백으로 보이는 문제

## 원인 분석

### 1. 조건부 렌더링 확인

```typescript
{isSaved && (
  <div className="mt-4 pt-3 border-t border-gray-300">
    <button onClick={handlePDFPreview}>
      <Eye className="w-4 h-4" />
      <span>{isGeneratingPDF ? 'PDF 생성 중...' : 'PDF 미리보기'}</span>
    </button>
  </div>
)}
```

**가능한 원인:**
- `isSaved`가 `false`인 경우 버튼이 렌더링되지 않음
- `Eye` 아이콘 import 문제
- CSS 스타일 문제로 텍스트/아이콘이 보이지 않음

### 2. 현재 구현 상태

**버튼 위치**: '샘플 미리보기' 섹션 하단
**조건**: `isSaved === true`일 때만 표시
**기능**: 클릭 시 `handlePDFPreview` 호출 → PDF 생성 → 모달 표시

### 3. 모달 미리보기 구현 상태

**현재 구현됨:**
- ✅ 모달 컴포넌트 존재 (`showPDFPreview && previewPDFBlob`)
- ✅ iframe을 통한 PDF 렌더링
- ✅ 출력/저장/닫기 버튼 포함
- ✅ 반응형 디자인

## 현재 구현 vs 이상적인 구현 비교

### 현재 구현 방식

#### 장점
- ✅ 모달 형태로 깔끔하게 구현됨
- ✅ PDF를 iframe으로 렌더링
- ✅ 출력/저장 기능 포함
- ✅ 반응형 디자인

#### 단점/문제점
- ❓ 버튼이 공백으로 보일 수 있음 (아이콘/텍스트 렌더링 문제)
- ❓ `isSaved` 조건이 명확하지 않을 수 있음
- ❓ 버튼 표시 조건이 직관적이지 않을 수 있음

### 이상적인 구현 (제안)

#### 옵션 1: 항상 표시되는 버튼
```typescript
// 저장 여부와 관계없이 항상 버튼 표시
<button 
  onClick={handlePDFPreview}
  disabled={!isSaved || isGeneratingPDF}
  className="..."
>
  <Eye className="w-4 h-4" />
  <span>
    {!isSaved ? '먼저 저장해주세요' : 
     isGeneratingPDF ? 'PDF 생성 중...' : 
     'PDF 미리보기'}
  </span>
</button>
```

**장점:**
- ✅ 항상 보이므로 사용자가 기능을 쉽게 발견
- ✅ 저장되지 않았을 때 명확한 피드백

**단점:**
- ❌ 저장되지 않은 상태에서도 버튼이 보여 혼란 가능

#### 옵션 2: 저장 완료 후 즉시 표시
```typescript
// 저장 완료 시 자동으로 PDF 미리보기 모달 표시
const handleSave = () => {
  setIsSaved(true);
  setIsEditing(false);
  // 저장 완료 후 자동으로 PDF 미리보기
  handlePDFPreview();
};
```

**장점:**
- ✅ 저장 후 즉시 미리보기 가능
- ✅ 추가 클릭 없이 바로 확인

**단점:**
- ❌ 사용자가 원하지 않을 때도 모달이 열림

#### 옵션 3: 개선된 버튼 표시 (권장)
```typescript
// 버튼을 항상 표시하되, 상태에 따라 비활성화
<div className="mt-4 pt-3 border-t border-gray-300">
  <button
    onClick={handlePDFPreview}
    disabled={!isSaved || isGeneratingPDF}
    className={`
      w-full flex items-center justify-center gap-2 
      px-3 py-2 rounded text-xs md:text-sm 
      transition-colors font-medium
      ${!isSaved 
        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
        : isGeneratingPDF
        ? 'bg-gray-400 text-white cursor-wait'
        : 'bg-green-600 hover:bg-green-700 text-white'
      }
    `}
    title={!isSaved ? '먼저 저장해주세요' : 'PDF 미리보기'}
  >
    <Eye className="w-4 h-4" />
    <span>
      {!isSaved 
        ? '저장 후 미리보기' 
        : isGeneratingPDF 
        ? 'PDF 생성 중...' 
        : 'PDF 미리보기'
      }
    </span>
  </button>
</div>
```

**장점:**
- ✅ 항상 보이므로 사용자가 기능을 쉽게 발견
- ✅ 상태에 따른 명확한 피드백
- ✅ 비활성화 상태에서도 버튼이 보여 기능 존재를 알림

## 문제 해결 방안

### 즉시 해결 (디버깅)

1. **브라우저 개발자 도구 확인**
   - Elements 탭에서 버튼이 실제로 렌더링되는지 확인
   - `isSaved` 상태 값 확인
   - CSS 스타일 적용 여부 확인

2. **콘솔 로그 추가**
   ```typescript
   console.log('isSaved:', isSaved);
   console.log('버튼 렌더링 여부:', isSaved);
   ```

3. **아이콘 import 확인**
   ```typescript
   import { Eye } from 'lucide-react'; // 올바른 import 확인
   ```

### 근본적 해결 (권장)

**옵션 3: 개선된 버튼 표시** 방식으로 변경
- 버튼을 항상 표시
- 상태에 따라 비활성화 및 텍스트 변경
- 더 명확한 사용자 피드백

## 모달 미리보기 현재 상태

### 구현 완료 사항
- ✅ 모달 컴포넌트 구조
- ✅ iframe PDF 렌더링
- ✅ 출력/저장/닫기 버튼
- ✅ 반응형 디자인
- ✅ z-index 및 오버레이 처리

### 개선 가능 사항
- 💡 PDF 로딩 중 인디케이터 추가
- 💡 에러 발생 시 표시
- 💡 PDF 페이지 네비게이션 (여러 페이지인 경우)
- 💡 줌 인/아웃 기능

## 권장 해결 방법

1. **즉시**: 버튼이 공백으로 보이는 원인 디버깅
2. **단기**: 옵션 3 방식으로 버튼 개선
3. **장기**: 모달 기능 강화 (로딩 인디케이터, 에러 처리 등)

