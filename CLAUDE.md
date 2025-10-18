# CLAUDE.md - AI 기반 스토리보드 제작 도구

## 1. 기술 스택 및 버전

### 언어 및 런타임
- **TypeScript**: `^4.9.5` - 정적 타입 검사 및 개발 생산성 향상
- **Node.js**: 18.0.0 이상 (권장)
- **React**: `^19.1.1` - 최신 React 19 버전 사용
- **React DOM**: `^19.1.1` - React 19와 호환

### 상태 관리
- **Zustand**: `^5.0.8` - 경량 상태 관리 라이브러리
  - `zustand/middleware` - persist 미들웨어 사용
  - 전역 상태 관리 및 로컬 스토리지 연동

### 스타일링 및 디자인 시스템
- **Tailwind CSS**: `^3.4.17` - 유틸리티 퍼스트 CSS 프레임워크
- **PostCSS**: `^8.5.6` - CSS 후처리기
- **Autoprefixer**: `^10.4.21` - CSS 벤더 프리픽스 자동 추가
- **Lucide React**: `^0.543.0` - 아이콘 라이브러리

### AI 서비스 통합
- **Google AI**: `@google/genai ^1.19.0` - Gemini API 통합
- **Axios**: `^1.11.0` - HTTP 클라이언트

### 데이터베이스
- **SQL.js**: `^1.13.0` - 클라이언트 사이드 SQLite 구현

### 라우팅
- **React Router DOM**: `^7.8.2` - 클라이언트 사이드 라우팅

### 테스팅
- **Jest**: `^27.5.2` - 테스트 프레임워크
- **React Testing Library**: `^16.3.0` - React 컴포넌트 테스팅
- **Testing Library User Event**: `^13.5.0` - 사용자 이벤트 시뮬레이션
- **Testing Library DOM**: `^10.4.1` - DOM 테스팅 유틸리티
- **Testing Library Jest DOM**: `^6.8.0` - Jest DOM 매처

### 패키지 매니저
- **npm** - Node.js 기본 패키지 매니저 사용
- **React Scripts**: `5.0.1` - Create React App 기반 빌드 도구

### 프로젝트 버전
- **현재 버전**: `0.1.0` (개발 초기 단계)
- **빌드 도구**: Create React App (CRA)
- **TypeScript 설정**: strict 모드 활성화

## 2. 개발 규칙

### 코드 작성 규칙

#### 절대 모킹하지 않기 - 동작 코드만 작성
- **원칙**: 모든 코드는 실제 동작하는 코드로만 작성
- **금지사항**: 
  - Mock 데이터나 더미 코드 작성 금지
  - 임시 플레이스홀더 코드 사용 금지
  - `// TODO` 주석으로 남겨두는 미완성 코드 금지
- **예외**: 테스트 코드에서의 Mock은 허용

#### 타입 안정성
- **TypeScript strict 모드** 사용 필수
- **모든 함수와 변수에 명시적 타입 정의**
- **인터페이스와 타입 별칭 적극 활용**
- **any 타입 사용 금지** (예외: 외부 라이브러리 타입 정의 불가능한 경우)
- **제네릭 활용**으로 재사용 가능한 타입 정의

```typescript
// ✅ 좋은 예
interface ProjectData {
  id: string;
  name: string;
  createdAt: Date;
}

const updateProject = (id: string, data: Partial<ProjectData>): Promise<void> => {
  // 구현
};

// ❌ 나쁜 예
const updateProject = (id: any, data: any): any => {
  // 구현
};
```

#### 테스트 우선 - 테스트 커버리지 90%
- **TDD(Test-Driven Development) 원칙** 적용
- **최소 90% 테스트 커버리지** 유지
- **단위 테스트**: 모든 유틸리티 함수와 훅
- **통합 테스트**: 컴포넌트 간 상호작용
- **E2E 테스트**: 주요 사용자 워크플로우

```typescript
// 테스트 파일 명명 규칙
// Button.tsx → Button.test.tsx
// useProject.ts → useProject.test.ts
// projectService.ts → projectService.test.ts
```

#### 컴포넌트 네이밍 - PascalCase, 기능 명확히 드러내는 네이밍
- **PascalCase** 사용 필수
- **기능이 명확히 드러나는 이름** 사용
- **컴포넌트 역할을 명확히 표현**

```typescript
// ✅ 좋은 예
export const ProjectOverviewStep = () => { /* */ };
export const CharacterGenerationForm = () => { /* */ };
export const VideoThumbnailCard = () => { /* */ };

// ❌ 나쁜 예
export const Step1 = () => { /* */ };
export const Form = () => { /* */ };
export const Card = () => { /* */ };
```

### 패키지 버전 호환성

#### 현재 언어 고정
- **TypeScript 4.9.5** 고정 (업그레이드 시 전체 프로젝트 검증 필요)
- **React 19.1.1** 고정 (React 19의 새로운 기능 활용)
- **Node.js 18.x** LTS 버전 사용

#### 패키지와의 호환성 유지
- **의존성 충돌 방지**: `npm ls` 명령어로 의존성 트리 확인
- **버전 범위 명시**: `^` (캐럿) 사용으로 하위 호환성 보장
- **정기적 업데이트**: 월 1회 의존성 업데이트 검토

#### 새 패키지 추가시 기존 패키지와의 의존성과 충돌 확인
- **추가 전 검증**:
  ```bash
  npm install <package-name> --dry-run
  npm ls <package-name>
  ```
- **의존성 충돌 해결**:
  ```bash
  npm audit
  npm audit fix
  ```
- **호환성 테스트**: 새 패키지 추가 후 전체 테스트 실행

### 파일 구조 규칙

#### Export 모듈화
- **Named Export 우선 사용**
- **Default Export는 메인 컴포넌트에만 사용**
- **Barrel Export 패턴** 활용

```typescript
// components/common/index.ts
export { Button } from './Button';
export { Modal } from './Modal';
export { Input } from './Input';

// 사용
import { Button, Modal, Input } from './components/common';
```

#### 확장자로 단위 테스트 작성
- **테스트 파일 명명**: `ComponentName.test.tsx`
- **테스트 파일 위치**: 컴포넌트와 동일한 디렉토리
- **테스트 그룹화**: `describe` 블록으로 관련 테스트 그룹화

```
src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── Modal.tsx
│   └── Modal.test.tsx
```

#### .env 및 gitignore 우선 작성
- **환경변수 관리**: `.env.example` 템플릿 제공
- **민감한 정보 보호**: `.env` 파일은 `.gitignore`에 포함
- **환경별 설정**: 개발/스테이징/프로덕션 환경 분리

```bash
# .env.example
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
REACT_APP_OPENAI_API_KEY=your-openai-api-key
REACT_APP_DATABASE_PATH=./data/storyboard.db
```

## 3. 프로젝트 구조

### 현재 아키텍처
```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 UI 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   └── steps/          # 단계별 컴포넌트
│   ├── hooks/              # 커스텀 훅
│   ├── services/           # 비즈니스 로직 서비스
│   │   ├── ai/            # AI 서비스 (Google, OpenAI)
│   │   └── database/      # 데이터베이스 서비스
│   ├── stores/            # 상태 관리 (Zustand)
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
```

### 핵심 기능
1. **프로젝트 개요**: AI 기반 스토리, 캐릭터, 시나리오 생성
2. **이미지 생성**: Google AI Studio를 통한 이미지 생성
3. **영상 생성**: 컷별 영상 생성 및 관리
4. **상태 관리**: Zustand를 통한 전역 상태 관리
5. **데이터 저장**: SQL.js를 통한 로컬 데이터베이스

## 4. 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- npm 8.0.0 이상
- TypeScript 4.9.5

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build

# 테스트 실행
npm test
```

### 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# API 키 설정
REACT_APP_GEMINI_API_KEY=your-actual-api-key
```

## 5. 코드 품질 관리

### 린팅 및 포맷팅
- **ESLint**: React App 기본 설정 사용
- **Prettier**: 코드 포맷팅 (추가 설정 권장)
- **TypeScript**: 컴파일 타임 타입 검사

### 코드 리뷰 체크리스트
- [ ] TypeScript 타입 안정성 확인
- [ ] 컴포넌트 단일 책임 원칙 준수
- [ ] 테스트 코드 작성 및 커버리지 확인
- [ ] 에러 처리 구현
- [ ] 성능 최적화 고려
- [ ] 접근성(a11y) 고려

---

**문서 작성일**: 2025-01-27  
**프로젝트 버전**: v0.1.0  
**다음 업데이트**: 2025-02-27
