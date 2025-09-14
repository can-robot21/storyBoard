# AI 기반 스토리→이미지→영상 제작 워크플로우 툴 v2.1

## 📋 프로젝트 개요 (2025-09-14 기준)

AI 기반 프로젝트 파이프라인 툴로, **스토리 입력 → 캐릭터/배경 이미지 생성 → 컷별 영상 생성**까지의 전체 워크플로우를 관리하는 웹 애플리케이션입니다.

### 🎯 핵심 워크플로우
```
스토리 입력 → AI 텍스트 생성 → 이미지 생성 → 영상 생성
     ↓              ↓              ↓           ↓
  기본 설정    →  프롬프트 생성  →  AI 이미지  →  컷별 영상
  캐릭터 설정     시나리오 생성     배경/설정컷    최종 영상
```

## 🏗️ 현재 아키텍처 분석

### 1. 파일 구조 현황
```
frontend/
├── src/
│   ├── App.tsx                 # 메인 컴포넌트 (상태 관리 및 라우팅)
│   ├── components/
│   │   ├── common/             # 재사용 가능한 공통 컴포넌트
│   │   │   ├── Button.tsx      # 버튼 컴포넌트
│   │   │   ├── Modal.tsx       # 모달 컴포넌트
│   │   │   ├── ImageUpload.tsx # 이미지 업로드 컴포넌트
│   │   │   ├── ProgressTracker.tsx # 진행률 추적기
│   │   │   ├── StreamingText.tsx # 스트리밍 텍스트 컴포넌트
│   │   │   ├── FormattedText.tsx # 포맷된 텍스트 표시
│   │   │   └── AISettingsModal.tsx # AI 설정 모달
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx      # 헤더 컴포넌트
│   │   │   └── MainLayout.tsx  # 메인 레이아웃 컴포넌트
│   │   └── steps/              # 단계별 컴포넌트
│   │       ├── ProjectOverviewStep.tsx # 프로젝트 개요 단계
│   │       ├── ImageGenerationStep.tsx # 이미지 생성 단계
│   │       └── VideoGenerationStep.tsx # 영상 생성 단계
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useProject.ts       # 프로젝트 관련 훅
│   │   ├── useAIService.ts     # AI 서비스 훅
│   │   ├── useProjectHandlers.ts # 프로젝트 핸들러 훅
│   │   ├── useImageHandlers.ts # 이미지 핸들러 훅
│   │   └── useVideoHandlers.ts # 영상 핸들러 훅
│   ├── services/               # 비즈니스 로직 서비스
│   │   ├── ai/                 # AI 서비스
│   │   │   ├── BaseAIService.ts # AI 서비스 기본 클래스
│   │   │   ├── GoogleAIService.ts # Google AI 서비스
│   │   │   ├── OpenAIService.ts # OpenAI 서비스
│   │   │   ├── AIServiceFactory.ts # AI 서비스 팩토리
│   │   │   └── PromptValidationService.ts # 프롬프트 검증 서비스
│   │   ├── database/           # 데이터베이스 서비스
│   │   │   └── DatabaseService.ts # 데이터베이스 서비스
│   │   ├── googleAIService.ts  # Google AI 통합 서비스
│   │   ├── api.ts             # API 서비스
│   │   ├── characterService.ts # 캐릭터 관련 서비스
│   │   ├── videoService.ts    # 영상 관련 서비스
│   │   └── mockApi.ts         # 목업 API
│   ├── stores/                # 상태 관리 (Zustand)
│   │   ├── projectStore.ts    # 프로젝트 상태 관리
│   │   └── uiStore.ts         # UI 상태 관리
│   ├── types/                 # TypeScript 타입 정의
│   │   ├── project.ts         # 프로젝트 타입 정의
│   │   ├── common.ts          # 공통 타입 정의
│   │   ├── api.ts             # API 타입 정의
│   │   └── ai.ts              # AI 관련 타입 정의
│   └── utils/                 # 유틸리티 함수
│       ├── constants.ts       # 상수 정의
│       ├── helpers.ts         # 유틸리티 함수
│       └── downloadUtils.ts   # 다운로드 유틸리티
```

### 2. 현재 기능 구현 상태

#### ✅ 완료된 기능
- **프로젝트 개요**: AI 텍스트 생성 (스토리, 캐릭터, 시나리오)
- **이미지 생성**: Google AI Studio를 통한 이미지 생성 (캐릭터, 배경, 설정컷)
- **영상 생성**: 컷별 영상 생성 및 관리 (선택 기능, 영상 옵션)
- **상태 관리**: Zustand를 통한 전역 상태 관리
- **UI/UX**: 반응형 디자인 및 진행률 추적
- **파일 다운로드**: 텍스트, 이미지, 영상 파일 다운로드 기능
- **선택 기능**: 영상 생성 시 항목별 선택 기능

#### ⚠️ 개선이 필요한 부분
- **App.tsx 거대화**: 3908줄의 단일 파일로 인한 유지보수 어려움
- **컴포넌트 분리 부족**: 일부 컴포넌트에서 UI 로직과 비즈니스 로직 혼재
- **AI 서비스 단일화**: Google AI만 지원, 확장성 부족
- **데이터 저장**: 로컬 상태만 사용, 영구 저장 불가

## 🔧 기능별 상세 분석

### 1. 프로젝트 개요 단계 (ProjectOverviewStep)

#### 메뉴 구조
- **입력 필드**:
  - `story`: 기본 스토리 입력
  - `characterList`: 캐릭터 목록 관리
  - `scenarioPrompt`: 시나리오 프롬프트 입력
  - `storySummary`: 500자 스토리 정리 (자동 생성)
  - `finalScenario`: 최종 시나리오 (AI 검토 후 생성)

#### AI 생성 기능
- **개별 생성**: 스토리/캐릭터/시나리오 프롬프트 개별 생성
- **통합 AI 생성**: 모든 프롬프트를 한 번에 생성
- **최종 시나리오 생성**: AI 검토 및 최종 시나리오 생성
- **프로젝트 개요 저장**: 국문/영문 카드 생성

#### 프롬프트 양식
```typescript
// 스토리 프롬프트 생성
const storyPrompt = `다음 스토리를 바탕으로 영상 제작용 스토리 프롬프트를 생성해주세요:
${story}

주요 요소:
- 스토리 라인
- 영상 스타일
- 시각적 요소
- 감정적 요소`;

// 캐릭터 프롬프트 생성
const characterPrompt = `다음 캐릭터 정보를 바탕으로 영상 제작용 캐릭터 설정 프롬프트를 생성해주세요:
${characterList.join(', ')}

캐릭터 설정:
- 외모 특징
- 성격 특성
- 의상 스타일
- 행동 패턴`;

// 시나리오 프롬프트 생성
const scenarioPrompt = `다음 정보를 바탕으로 영상 제작용 시나리오 프롬프트를 생성해주세요:
스토리: ${story}
캐릭터: ${characterList.join(', ')}

시나리오 구성:
- 장면별 구성
- 대사 및 내레이션
- 시각적 연출
- 감정적 흐름`;
```

### 2. 이미지 생성 단계 (ImageGenerationStep)

#### 메뉴 구조
- **생성 항목**:
  - **캐릭터 이미지**: 텍스트 설명 또는 이미지 업로드로 생성
  - **배경 이미지**: 텍스트 설명 또는 이미지 업로드로 생성
  - **설정 컷 이미지**: 텍스트 설명 또는 이미지 업로드로 생성

#### AI 생성 기능
- **Google Imagen 4.0 API**: 실제 이미지 생성
- **멀티모달 생성**: 텍스트 + 이미지 조합 생성
- **비율 최적화**: 캐릭터(1:1), 배경/설정컷(16:9)
- **에러 처리**: API 응답 구조 다양성 대응

#### 프롬프트 양식
```typescript
// 캐릭터 이미지 생성
const characterPrompt = `Create a detailed character image: ${description}
Style: Animation, high quality, detailed facial features
Aspect ratio: 1:1
Additional requirements: ${attachedImages.length > 0 ? 'Reference the attached images' : ''}`;

// 배경 이미지 생성
const backgroundPrompt = `Create a detailed background image: ${description}
Style: High quality, cinematic lighting, detailed environment
Aspect ratio: 16:9
Additional requirements: ${attachedImages.length > 0 ? 'Reference the attached images' : ''}`;

// 설정 컷 이미지 생성
const settingPrompt = `Create a detailed setting cut image: ${description}
Style: High quality, cinematic composition, detailed architectural design
Aspect ratio: 16:9
Additional requirements: ${attachedImages.length > 0 ? 'Reference the attached images' : ''}`;
```

### 3. 영상 생성 단계 (VideoGenerationStep)

#### 메뉴 구조
- **입력 필드**:
  - `storySceneInput`: 스토리/장면 입력
  - `characterOutfitInput`: 캐릭터/의상 입력
  - `videoBackgroundInput`: 영상 배경 입력

#### AI 생성 기능
- **텍스트 카드 생성**: 스토리/장면 기반 텍스트 카드 생성
- **캐릭터 이미지 생성**: 캐릭터/의상 기반 이미지 생성
- **영상 배경 생성**: 영상 배경 이미지 생성
- **AI 영상 생성**: 선택된 항목들로 최종 영상 생성

#### 영상 옵션 설정
- **스타일**: 애니메이션, 실사, 만화, 픽사
- **무드**: 밝은, 어두운, 신비로운, 드라마틱
- **카메라 워크**: 정적, 팬, 줌, 트래킹
- **음악**: 액션, 드라마, 코미디, 모험
- **커스텀 프롬프트**: 사용자 정의 추가 프롬프트

#### 프롬프트 양식
```typescript
// 텍스트 카드 생성
const textCardPrompt = `다음 스토리/장면을 바탕으로 영상 제작용 텍스트 카드를 생성해주세요:
${storySceneInput}

컷별로 나누어 상세한 텍스트 카드를 만들어주세요.`;

// AI 영상 생성
const videoPrompt = `Create a video based on the following elements:
Text Cards: ${selectedTextCards.map(id => textCards.find(c => c.id === id)?.generatedText).join(' ')}
Character Images: ${selectedCharacterImages.map(id => characters.find(c => c.id === id)?.description).join(' ')}
Background Images: ${selectedVideoBackgrounds.map(id => backgrounds.find(b => b.id === id)?.description).join(' ')}

Video Options:
- Style: ${videoOptions.style}
- Mood: ${videoOptions.mood}
- Camera Work: ${videoOptions.cameraWork}
- Music: ${videoOptions.music}
- Custom Prompt: ${videoOptions.customPrompt}

Aspect Ratio: ${videoRatio}`;
```

## 🚀 주요 개선사항 (v2.1)

### 1. 영상 생성 메뉴 개선
- **선택 기능**: 텍스트 카드, 캐릭터 이미지, 영상 배경 선택 기능 추가
- **영상 옵션**: 스타일, 무드, 카메라 워크, 음악, 커스텀 프롬프트 설정
- **비율 제한**: 1:1 비율 제거 (API 지원 불가)
- **중복 제거**: 왼쪽 하단 중복 출력 제거

### 2. 파일 다운로드 기능
- **개별 다운로드**: 각 항목별 개별 다운로드 기능
- **전체 다운로드**: 모든 항목 일괄 다운로드 기능
- **파일 형식**: 텍스트(.txt), 이미지(.jpg), 영상(.mp4)
- **에러 처리**: 다운로드 실패 시 상세한 에러 메시지

### 3. AI 서비스 개선
- **API 응답 처리**: 다양한 API 응답 구조 대응
- **에러 처리**: 상세한 에러 메시지 및 복구 로직
- **타입 안정성**: TypeScript 타입 안정성 향상

### 4. UI/UX 개선
- **프로젝트 개요 참고**: 오른쪽 하단으로 이동, 토글 버튼 추가
- **선택 인터페이스**: 체크박스 기반 선택 시스템
- **진행률 표시**: 실시간 생성 진행률 표시
- **알림 시스템**: 성공/실패/경고 알림 구분

## 📊 메뉴별 단계별 프롬프트 양식

### 1. 프로젝트 개요 단계

#### 입력 프롬프트
```typescript
// 1. 스토리 기본 설정
const storyInput = `스토리 기본 설정을 입력해주세요:
- 주요 스토리 라인
- 영상 스타일 (애니메이션, 실사, 만화 등)
- 시각적 요소 (색감, 분위기 등)
- 감정적 요소 (기쁨, 슬픔, 긴장감 등)`;

// 2. 캐릭터 설정
const characterInput = `캐릭터 설정을 입력해주세요:
- 캐릭터 이름
- 외모 특징
- 성격 특성
- 의상 스타일`;

// 3. 시나리오 생성
const scenarioInput = `시나리오 생성을 위한 정보를 입력해주세요:
- 상세 스토리 텍스트
- 주요 대사
- 장면별 구성`;

// 4. 장소와 에피소드 핵심 상황
const locationInput = `장소와 에피소드 핵심 상황을 입력해주세요:
- 주요 장소
- 핵심 에피소드
- 상황 설정`;

// 5. 시나리오 추가 설정
const additionalScenarioInput = `시나리오 추가 설정을 입력해주세요:
- 추가적인 스토리 요소
- 특별한 설정
- 보완할 내용`;
```

#### AI 생성 프롬프트
```typescript
// 스토리 프롬프트 생성
const generateStoryPrompt = async (story: string) => {
  const prompt = `다음 스토리를 바탕으로 영상 제작용 스토리 프롬프트를 생성해주세요:

${story}

다음 형식으로 생성해주세요:
- 스토리 라인: [주요 스토리 흐름]
- 영상 스타일: [시각적 스타일]
- 시각적 요소: [색감, 분위기, 조명]
- 감정적 요소: [감정적 흐름, 분위기]
- 타겟 오디언스: [대상 연령층]`;
};

// 캐릭터 프롬프트 생성
const generateCharacterPrompt = async (characterList: string[]) => {
  const prompt = `다음 캐릭터 정보를 바탕으로 영상 제작용 캐릭터 설정 프롬프트를 생성해주세요:

${characterList.join('\n')}

다음 형식으로 생성해주세요:
- 캐릭터별 외모 특징
- 성격 특성 및 행동 패턴
- 의상 스타일 및 색상
- 시각적 특징 및 아이덴티티`;
};

// 시나리오 프롬프트 생성
const generateScenarioPrompt = async (story: string, characterList: string[], scenarioPrompt: string) => {
  const prompt = `다음 정보를 바탕으로 영상 제작용 시나리오 프롬프트를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.join(', ')}
시나리오: ${scenarioPrompt}

다음 형식으로 생성해주세요:
- 장면별 구성 (시작, 중간, 끝)
- 주요 대사 및 내레이션
- 시각적 연출 방향
- 감정적 흐름 및 분위기`;
};

// 최종 시나리오 생성
const generateFinalScenario = async (aiScenario: string, additionalScenario: string) => {
  const prompt = `다음 AI 생성 시나리오와 추가 설정을 종합하여 최종 시나리오를 생성해주세요:

AI 생성 시나리오:
${aiScenario}

추가 설정:
${additionalScenario}

다음 형식으로 생성해주세요:
- 최종 스토리 라인
- 장면별 상세 구성
- 캐릭터별 역할 및 대사
- 시각적 연출 가이드
- 감정적 흐름`;
};
```

### 2. 이미지 생성 단계

#### 입력 프롬프트
```typescript
// 캐릭터 이미지 생성
const characterImagePrompt = `캐릭터 이미지를 생성하기 위한 설명을 입력해주세요:
- 캐릭터 외모 특징
- 의상 및 스타일
- 포즈 및 표정
- 배경 (선택사항)`;

// 배경 이미지 생성
const backgroundImagePrompt = `배경 이미지를 생성하기 위한 설명을 입력해주세요:
- 장소 및 환경
- 분위기 및 조명
- 색감 및 스타일
- 구도 및 시점`;

// 설정 컷 이미지 생성
const settingCutPrompt = `설정 컷 이미지를 생성하기 위한 설명을 입력해주세요:
- 장소 및 환경
- 구체적인 설정
- 분위기 및 조명
- 시각적 연출`;
```

#### AI 생성 프롬프트
```typescript
// 캐릭터 이미지 생성
const generateCharacterImage = async (description: string, attachedImages: File[]) => {
  const prompt = `Create a detailed character image based on the following description:

${description}

Requirements:
- Style: Animation, high quality, detailed facial features
- Aspect ratio: 1:1
- Character design: Detailed and expressive
- Additional references: ${attachedImages.length > 0 ? 'Use the attached images as reference' : 'No additional references'}`;
};

// 배경 이미지 생성
const generateBackgroundImage = async (description: string, attachedImages: File[]) => {
  const prompt = `Create a detailed background image based on the following description:

${description}

Requirements:
- Style: High quality, cinematic lighting, detailed environment
- Aspect ratio: 16:9
- Composition: Cinematic and visually appealing
- Additional references: ${attachedImages.length > 0 ? 'Use the attached images as reference' : 'No additional references'}`;
};

// 설정 컷 이미지 생성
const generateSettingCutImage = async (description: string, attachedImages: File[]) => {
  const prompt = `Create a detailed setting cut image based on the following description:

${description}

Requirements:
- Style: High quality, cinematic composition, detailed architectural design
- Aspect ratio: 16:9
- Setting: Detailed and immersive
- Additional references: ${attachedImages.length > 0 ? 'Use the attached images as reference' : 'No additional references'}`;
};
```

### 3. 영상 생성 단계

#### 입력 프롬프트
```typescript
// 텍스트 카드 생성
const textCardPrompt = `스토리/장면을 입력해주세요:
- 컷별 스토리 내용
- 장면 설명
- 대사 및 내레이션
- 시각적 연출 방향`;

// 캐릭터 이미지 생성
const characterImagePrompt = `캐릭터/의상을 입력해주세요:
- 캐릭터 설명
- 의상 및 스타일
- 포즈 및 표정
- 추가 특징`;

// 영상 배경 생성
const videoBackgroundPrompt = `영상 배경을 입력해주세요:
- 배경 장소
- 분위기 및 조명
- 색감 및 스타일
- 구도 및 시점`;
```

#### AI 생성 프롬프트
```typescript
// 텍스트 카드 생성
const generateTextCard = async (storySceneInput: string) => {
  const prompt = `다음 스토리/장면을 바탕으로 영상 제작용 텍스트 카드를 생성해주세요:

${storySceneInput}

요구사항:
- 컷별로 나누어 상세한 텍스트 카드 생성
- 각 카드는 명확한 장면 설명 포함
- 대사 및 내레이션 포함
- 시각적 연출 방향 제시`;
};

// AI 영상 생성
const generateAIVideo = async (selectedItems: any[], videoOptions: any, videoRatio: string) => {
  const prompt = `Create a video based on the following selected elements:

Selected Text Cards: ${selectedItems.textCards.map(card => card.generatedText).join(' ')}
Selected Character Images: ${selectedItems.characterImages.map(img => img.description).join(' ')}
Selected Background Images: ${selectedItems.backgrounds.map(bg => bg.description).join(' ')}

Video Options:
- Style: ${videoOptions.style}
- Mood: ${videoOptions.mood}
- Camera Work: ${videoOptions.cameraWork}
- Music: ${videoOptions.music}
- Custom Prompt: ${videoOptions.customPrompt}

Technical Requirements:
- Aspect Ratio: ${videoRatio}
- Duration: 5-10 seconds
- Quality: High definition
- Format: MP4`;
};
```

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 18.0.0 이상
- TypeScript 4.9.5
- React 19.1.1
- npm 8.0.0 이상

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build
```

### 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# API 키 설정
REACT_APP_GEMINI_API_KEY=your-gemini-api-key
```

## 📈 성능 최적화

### 1. 코드 분할
- 컴포넌트별 lazy loading
- 동적 import 사용
- 번들 크기 최적화

### 2. 메모이제이션
- React.memo 사용
- useMemo, useCallback 활용
- 불필요한 리렌더링 방지

### 3. 상태 관리
- Zustand를 통한 효율적인 상태 관리
- 로컬 상태와 전역 상태 분리
- 상태 업데이트 최적화

## 🔒 보안 고려사항

### 1. API 키 보안
- 환경변수 사용
- 클라이언트 사이드 노출 방지
- API 키 로테이션 정책

### 2. 데이터 보안
- 사용자 입력 검증
- XSS 공격 방지
- 파일 업로드 검증

### 3. 에러 처리
- 상세한 에러 메시지
- 사용자 친화적 에러 표시
- 로깅 및 모니터링

## 📝 테스트 전략

### 1. 단위 테스트
- 컴포넌트별 테스트
- 훅별 테스트
- 유틸리티 함수 테스트

### 2. 통합 테스트
- API 서비스 테스트
- 상태 관리 테스트
- 컴포넌트 간 상호작용 테스트

### 3. E2E 테스트
- 전체 워크플로우 테스트
- 사용자 시나리오 테스트
- 크로스 브라우저 테스트

## 🚀 배포 전략

### 1. 개발 환경
- 로컬 개발 서버
- Hot reloading
- 개발자 도구

### 2. 스테이징 환경
- Docker 컨테이너
- 실제 API 연동
- 성능 테스트

### 3. 프로덕션 환경
- 클라우드 배포
- CDN 사용
- 모니터링 및 로깅

## 🔄 업데이트 로그

### v2.1.0 (2025-09-14)
- ✅ 영상 생성 메뉴 선택 기능 추가
- ✅ 영상 옵션 설정 (스타일, 무드, 카메라 워크, 음악)
- ✅ 파일 다운로드 기능 완전 구현
- ✅ 1:1 비율 제거 (API 지원 불가)
- ✅ 중복 UI 제거 및 정리
- ✅ 에러 처리 개선
- ✅ TypeScript 타입 안정성 향상

### v2.0.0 (2025-09-12)
- ✅ 프로젝트 개요 메뉴 완전 개선
- ✅ 이미지 생성 API 오류 수정
- ✅ 영상 생성 메뉴 UI 개선
- ✅ 프로젝트 개요 참고 기능 개선
- ✅ 파일 구조 정리 및 최적화

### v1.5.0 (2025-01-27)
- ✅ 프로젝트 개요 워크플로우 완전 개선
- ✅ 시나리오용 프롬프트 AI 생성으로 버튼명 변경
- ✅ 500자 스토리 정리 자동 생성
- ✅ 항목별 카드 시스템 구현
- ✅ 통합 AI 검토 및 시나리오 생성 조건 개선

## 🤝 기여 가이드

### 코드 스타일
- TypeScript 사용 필수
- ESLint 규칙 준수
- 컴포넌트는 함수형으로 작성
- 상태 관리는 Zustand 사용

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 변경
refactor: 코드 리팩토링
```

## 📄 라이선스

MIT License

---

**최종 업데이트**: 2025-09-14  
**버전**: v2.1.0  
**개발자**: AI Assistant  
**라이선스**: MIT