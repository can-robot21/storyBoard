# AI 기반 스토리→이미지→영상 제작 워크플로우 툴 v2.3

## 📋 프로젝트 개요 (2025-09-17 기준)

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
│   │   │   ├── AISettingsModal.tsx # AI 설정 모달
│   │   │   ├── AuthModal.tsx   # 사용자 인증 모달
│   │   │   └── ProjectReferenceSection.tsx # 프로젝트 참고 섹션
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx      # 헤더 컴포넌트
│   │   │   └── MainLayout.tsx  # 메인 레이아웃 컴포넌트
│   │   └── steps/              # 단계별 컴포넌트
│   │       ├── ProjectOverviewStep.tsx # 프로젝트 개요 단계
│   │       ├── ImageGenerationStep.tsx # 이미지 생성 단계
│   │       ├── NanoBananaImageStep.tsx # 나노바나나 이미지 생성 단계
│   │       └── VideoGenerationStep.tsx # 영상 생성 단계
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useProject.ts       # 프로젝트 관련 훅
│   │   ├── useAIService.ts     # AI 서비스 훅
│   │   ├── useAIServiceManager.ts # AI 서비스 관리 훅
│   │   ├── useProjectHandlers.ts # 프로젝트 핸들러 훅
│   │   ├── useImageHandlers.ts # 이미지 핸들러 훅
│   │   ├── useVideoHandlers.ts # 영상 핸들러 훅
│   │   ├── useImageHandlers.ts # 이미지 핸들러 훅
│   │   └── useDatabase.ts      # 데이터베이스 훅
│   ├── services/               # 비즈니스 로직 서비스
│   │   ├── ai/                 # AI 서비스
│   │   │   ├── BaseAIService.ts # AI 서비스 기본 클래스
│   │   │   ├── GoogleAIService.ts # Google AI 서비스
│   │   │   ├── OpenAIService.ts # OpenAI 서비스
│   │   │   ├── AIServiceFactory.ts # AI 서비스 팩토리
│   │   │   └── PromptValidationService.ts # 프롬프트 검증 서비스
│   │   ├── authService.ts      # 사용자 인증 서비스
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
│   │   ├── ai.ts              # AI 관련 타입 정의
│   │   └── auth.ts            # 인증 관련 타입 정의
│   └── utils/                 # 유틸리티 함수
│       ├── constants.ts       # 상수 정의
│       ├── helpers.ts         # 유틸리티 함수
│       ├── downloadUtils.ts   # 다운로드 유틸리티
│       └── videoModelConfig.ts # 영상 모델 설정
```

### 2. 현재 기능 구현 상태

#### ✅ 완료된 기능
- **프로젝트 개요**: AI 텍스트 생성 (스토리, 캐릭터, 시나리오)
- **이미지 생성**: Google AI Studio를 통한 이미지 생성 (캐릭터, 배경, 설정컷)
- **나노바나나 이미지 생성**: Gemini 2.5 Flash Image Preview를 통한 고급 이미지 생성
- **영상 생성**: 컷별 영상 생성 및 관리 (선택 기능, 영상 옵션)
- **사용자 인증**: 로그인, 회원가입, 프로필 관리
- **상태 관리**: Zustand를 통한 전역 상태 관리
- **UI/UX**: 반응형 디자인 및 진행률 추적
- **파일 다운로드**: 텍스트, 이미지, 영상 파일 다운로드 기능
- **선택 기능**: 영상 생성 시 항목별 선택 기능

#### ⚠️ 개선이 필요한 부분
- **데이터 저장**: 로컬 상태만 사용, 영구 저장 불가
- **AI 서비스 확장**: Google AI 외 다른 서비스 지원 확대
- **에러 처리**: 상세한 에러 메시지 및 복구 로직 개선

## 🎬 메뉴별 기능 상세 분석

### 1. 프로젝트 개요 메뉴

#### 📝 주요 기능
- **스토리 입력**: 기본 스토리 텍스트 입력
- **캐릭터 관리**: 캐릭터 추가/삭제 및 설명 관리
- **시나리오 생성**: AI를 통한 시나리오 프롬프트 생성
- **500자 스토리 정리**: 자동으로 스토리를 500자로 요약
- **최종 시나리오**: AI 검토 및 최종 시나리오 생성
- **프로젝트 개요 저장**: 국문/영문 카드 생성

#### 🎯 UI 구성
- **왼쪽 입력 영역**: 5단계 입력 폼
  1. 스토리 기본 설정
  2. 캐릭터 설정 (추가/삭제 기능)
  3. 시나리오용 프롬프트 AI 생성
  4. 장소와 에피소드 핵심 상황
  5. 시나리오 추가 설정
- **오른쪽 결과 영역**: 
  - 프로젝트 개요 저장 결과 (맨 하단)
  - 프로젝트 참고 섹션 (국문/영문 항목별 분류)

#### 🔧 핵심 기능
- **텍스트 길이 제한**: AI 생성 시 텍스트 길이 제한 적용
- **단계별 활성화**: 이전 단계 완료 시 다음 단계 활성화
- **JSON 카드 생성**: 국문/영문 카드 자동 생성
- **삭제 기능**: 프로젝트 개요 삭제 시 2단계로 복귀

### 2. 이미지 생성 메뉴

#### 📝 주요 기능
- **Google AI (Imagen)**: 기본 이미지 생성 API
- **이미지 비율 선택**: 16:9, 9:16, 1:1 (세로 배치)
- **캐릭터 이미지 생성**: 텍스트 설명 또는 이미지 업로드
- **배경 이미지 생성**: 텍스트 설명 또는 이미지 업로드
- **설정 컷 이미지 생성**: 텍스트 설명 또는 이미지 업로드

#### 🎯 UI 구성
- **왼쪽 입력 영역**: 
  - API 선택 (Google AI 고정)
  - 이미지 비율 선택 (세로 배치)
  - 각 항목별 입력 폼 및 이미지 업로드
- **오른쪽 결과 영역**:
  - 토큰 사용량 표시
  - 생성된 이미지 카드 (API 표시 포함)
  - 개별/전체 재생성 및 저장 기능

#### 🔧 핵심 기능
- **멀티모달 생성**: 텍스트 + 이미지 조합 생성
- **비율 최적화**: 캐릭터(1:1), 배경/설정컷(16:9)
- **API 표시**: 생성된 이미지에 사용된 API 표시
- **에러 처리**: API 응답 구조 다양성 대응

### 3. 이미지 생성/나노 바나나 메뉴

#### 📝 주요 기능
- **Gemini 2.5 Flash Image Preview**: 고급 이미지 생성
- **커스텀 사이즈**: 사용자 정의 이미지 크기 설정
- **추가 프롬프트**: 세부 요구사항 지정
- **이미지 스타일**: realistic, cartoon, anime, 3d, watercolor, oil_painting
- **이미지 품질**: high, standard, ultra

#### 🎯 UI 구성
- **왼쪽 입력 영역**:
  - 나노바나나 전용 헤더
  - 고급 옵션 설정 (스타일, 품질, 비율)
  - 커스텀 사이즈 및 추가 프롬프트 입력
- **오른쪽 결과 영역**:
  - 토큰 사용량 표시
  - 고급 이미지 생성 결과
  - 개별/전체 재생성 및 저장 기능

#### 🔧 핵심 기능
- **고급 이미지 생성**: 모달을 통한 단계별 이미지 생성
- **멀티모달 지원**: 텍스트 + 이미지 참조 생성
- **커스텀 설정**: 사용자 정의 크기 및 스타일
- **품질 선택**: 다양한 품질 옵션 제공

### 4. 영상 생성 메뉴

#### 📝 주요 기능
- **씬 공통설정**: 전체 씬에 적용되는 공통 설정
- **컷 숫자 설정**: 기본 1컷, 사용자 정의 가능
- **스토리 입력**: 컷별 이미지 생성 프롬프트 생성
- **텍스트 출력 제한**: 500-5000자 범위 설정 (기본 2000자)
- **AI 텍스트 생성**: 구조화된 컷별 텍스트 생성
- **캐릭터 이미지 생성**: 캐릭터/의상 기반 이미지 생성
- **영상 배경 생성**: 영상 배경 이미지 생성
- **AI 영상 생성**: 선택된 항목들로 최종 영상 생성

#### 🎯 UI 구성
- **왼쪽 입력 영역**: 
  1. 씬 공통설정 (단일 입력 필드)
  2. 컷 숫자 설정 (기본 1, 편집 가능)
  3. 스토리 입력 - 컷별 이미지 생성 프롬프트 생성
  4. 텍스트 출력 제한 (500-5000자)
  5. 캐릭터 + 의상 + 이미지
  6. 배경 생성
  7. AI 영상 생성
- **오른쪽 결과 영역**:
  - 토큰 사용량 표시
  - 씬 설정 결과 (씬별 메인 블록)
  - 씬 공통설정, 스토리, 컷별 상세 표시
  - 필수/추가 항목 구조화 표시
  - 개별/전체 재생성 및 저장 기능

#### 🔧 핵심 기능
- **구조화된 출력**: 필수/추가 항목으로 분류된 컷별 설명
- **씬별 관리**: 씬 단위로 그룹화된 컷 관리
- **감추기/보이기**: 씬별, 컷별 개별 토글 기능
- **영상 모델 선택**: VEO 2.0 (기본), VEO 3.0 Fast, VEO 3.0 Standard
- **선택 기능**: 텍스트 카드, 캐릭터 이미지, 영상 배경 선택

## 🔐 사용자 인증 시스템

### 📝 주요 기능
- **로그인**: 이메일/비밀번호 로그인
- **회원가입**: 이름, 이메일, 비밀번호, API 키 설정
- **프로필 관리**: 회원정보 수정 및 API 키 관리
- **하드코딩된 관리자**: star612.net@gmail.com / star6120

### 🎯 UI 구성
- **헤더**: 로그인 상태에 따른 버튼 표시
  - 로그인 전: [로그인], [회원가입] 버튼
  - 로그인 후: 사용자명, [프로필], [로그아웃] 버튼
- **인증 모달**: 로그인/회원가입/프로필 수정 통합 모달
- **API 키 관리**: Google, OpenAI, Midjourney, Anthropic API 키 설정

### 🔧 핵심 기능
- **로컬 스토리지**: 사용자 데이터 로컬 저장
- **세션 관리**: 로그인 상태 유지
- **API 키 관리**: 개별 사용자별 API 키 설정
- **폼 검증**: 이메일 형식, 비밀번호 길이 검증

## 🚀 주요 개선사항 (v2.3)

### 1. 영상 생성 메뉴 대폭 개선
- **단순화된 입력**: 복잡한 옵션을 단순한 입력 필드로 변경
- **구조화된 출력**: 필수/추가 항목으로 분류된 컷별 설명
- **씬별 관리**: 씬 단위로 그룹화된 컷 관리 시스템
- **텍스트 길이 제한**: AI 생성 시 텍스트 길이 제한 적용
- **감추기/보이기**: 씬별, 컷별 개별 토글 기능

### 2. 이미지 생성 메뉴 개선
- **API 단일화**: Google AI (Imagen)만 사용
- **비율 선택**: 16:9, 9:16, 1:1 세로 배치
- **API 표시**: 생성된 이미지에 사용된 API 표시
- **나노바나나 분리**: 별도 메뉴로 고급 이미지 생성

### 3. 프로젝트 개요 메뉴 개선
- **텍스트 길이 제한**: AI 생성 시 텍스트 길이 제한 적용
- **UI 재구성**: 프로젝트 개요 저장 결과를 맨 하단으로 이동
- **버튼 정리**: [수정] 버튼 삭제, [삭제] 기능 개선
- **JSON 카드**: [대사] 국문/영문 프롬프트 제거

### 4. 사용자 인증 시스템 추가
- **완전한 인증 시스템**: 로그인, 회원가입, 프로필 관리
- **API 키 관리**: 개별 사용자별 API 키 설정
- **하드코딩된 관리자**: 초기 설정용 관리자 계정

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

#### API 선택 옵션
- **Google AI (Imagen)**: 기존 Imagen 4.0 모델 사용
- **나노 바나나 (Gemini 2.5 Flash Image)**: 새로운 Gemini 2.5 Flash Image Preview 모델 사용
  - 기타 사이즈 요청사항 입력 가능 (예: 1920x1080, 4K, 세로형 등)
  - 추가 프롬프트 입력으로 세부 요구사항 지정 가능

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
// Google AI (Imagen) - 캐릭터 이미지 생성
const generateCharacterImage = async (description: string, attachedImages: File[]) => {
  const prompt = `Create a detailed character image based on the following description:

${description}

Requirements:
- Style: Animation, high quality, detailed facial features
- Aspect ratio: 1:1
- Character design: Detailed and expressive
- Additional references: ${attachedImages.length > 0 ? 'Use the attached images as reference' : 'No additional references'}`;
};

// 나노 바나나 (Gemini 2.5 Flash Image) - 캐릭터 이미지 생성
const generateCharacterImageWithNanoBanana = async (
  description: string, 
  attachedImages: File[], 
  customSize?: string,
  additionalPrompt?: string
) => {
  let finalPrompt = `Create a detailed character image based on the following description:

${description}

Requirements:
- Style: Animation, high quality, detailed facial features
- Character design: Detailed and expressive`;

  // 추가 프롬프트가 있으면 결합
  if (additionalPrompt?.trim()) {
    finalPrompt += `\n\nAdditional requirements: ${additionalPrompt}`;
  }
  
  // 사이즈 요청사항이 있으면 결합
  if (customSize?.trim()) {
    finalPrompt += `\n\nSize requirements: ${customSize}`;
  }

  // 첨부 이미지가 있으면 멀티모달 생성
  if (attachedImages.length > 0) {
    const nanoBananaService = getCurrentAIService();
    return await nanoBananaService.generateImageWithReference(
      finalPrompt, 
      attachedImages[0], 
      customSize
    );
  } else {
    // 텍스트만으로 이미지 생성
    const nanoBananaService = getCurrentAIService();
    const result = await nanoBananaService.generateImage({
      prompt: finalPrompt,
      provider: 'nano-banana',
      model: 'gemini-2.5-flash-image-preview',
      aspectRatio: '1:1',
      quality: 'standard'
    });
    return result.images[0];
  }
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
const textCardPrompt = `다음 스토리를 바탕으로 ${cutCount}컷 영상 제작용 텍스트 카드를 생성해주세요:

**씬 공통설정:**
${sceneCommonInput ? `- 공통 설정: ${sceneCommonInput}` : ''}

**스토리:**
${storyInput}

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 생성되는 텍스트는 반드시 ${textLimit}자 이내여야 합니다.
⚠️ ${textLimit}자를 초과하면 생성이 실패합니다.
⚠️ 각 컷별 설명을 간결하고 명확하게 작성하세요.

**중요한 출력 형식 요구사항:**
반드시 다음 형식으로 출력해주세요:

--- **컷 1: [컷 제목]**

**필수 항목:**
* **캐릭터:** [예시] A young woman with long brown hair wearing a red coat
* **액션:** [예시] walking slowly through a forest
* **배경:** [예시] a misty morning in a dense forest
* **대사:** [예시] "이 길의 끝은 어디일까?"

**추가 항목 (필요한 경우):**
* **구도:** [예시] Wide shot showing the entire landscape
* **조명:** [예시] Warm golden hour lighting with lens flare
* **카메라 움직임:** [예시] The camera slowly pans to the right

--- **컷 2: [컷 제목]**

**필수 항목:**
* **캐릭터:** [캐릭터의 외모, 의상, 특징을 영어로 상세히 설명]
* **액션:** [캐릭터의 구체적인 행동을 영어로 설명]
* **배경:** [장면의 배경과 환경을 영어로 설명]
* **대사:** [캐릭터의 대사를 한국어로 표시]

**추가 항목 (필요한 경우):**
* **구도:** [카메라 앵글과 구도를 영어로 설명]
* **조명:** [조명과 분위기를 영어로 설명]
* **카메라 움직임:** [카메라의 움직임을 영어로 설명]

... (총 ${cutCount}컷까지)

**중요한 지침:**
1. 필수 항목은 모든 컷에 반드시 포함되어야 합니다.
2. 추가 항목은 장면에 필요한 경우에만 포함하세요.
3. 캐릭터, 액션, 배경은 영어로 작성하세요.
4. 대사는 한국어로 작성하세요.
5. 각 항목은 구체적이고 상세하게 작성하세요.

**중요**: 반드시 ${textLimit}자 이내로 작성하고, 위의 --- **컷 X: [제목]** 형식을 정확히 따라주세요.`;
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
REACT_APP_GEMINI_API_KEY=your-gemini-api-key  # Google AI 및 나노 바나나 API용
REACT_APP_OPENAI_API_KEY=your-openai-api-key  # OpenAI API용
REACT_APP_ANTHROPIC_API_KEY=your-anthropic-api-key  # Anthropic API용

# 관리자 계정 설정 (보안을 위해 환경변수로 관리)
REACT_APP_ADMIN_EMAIL=star612.net@gmail.com
REACT_APP_ADMIN_PASSWORD=star6120@@
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

### 1. 비밀번호 보안
- **해시화**: SHA-256 해시로 비밀번호 저장
- **솔트**: 고유한 솔트로 레인보우 테이블 공격 방지
- **평문 저장 금지**: 비밀번호는 절대 평문으로 저장되지 않음

### 2. 환경변수 관리
- **민감한 정보**: 관리자 계정 정보는 환경변수로 관리
- **API 키**: 모든 API 키는 환경변수로 설정
- **기본값**: 안전한 기본값 제공

### 3. 데이터 보호
- **민감한 정보 제거**: 사용자 객체에서 비밀번호 제거
- **API 키 마스킹**: 로그에서 API 키 일부만 표시
- **에러 로깅**: 민감한 정보가 포함되지 않은 에러 메시지

### 4. 인증 시스템
- **로그인**: 해시화된 비밀번호 검증
- **회원가입**: 비밀번호 자동 해시화
- **프로필 수정**: 비밀번호 변경 시 해시화

### 5. API 키 보안
- 환경변수 사용
- 클라이언트 사이드 노출 방지
- API 키 로테이션 정책

### 6. 데이터 보안
- 사용자 입력 검증
- XSS 공격 방지
- 파일 업로드 검증

### 7. 에러 처리
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

### v2.3.0 (2025-09-17)
- **영상 생성 메뉴 대폭 개선**: 단순화된 입력, 구조화된 출력, 씬별 관리
- **이미지 생성 메뉴 개선**: API 단일화, 비율 선택 세로 배치, API 표시
- **프로젝트 개요 메뉴 개선**: 텍스트 길이 제한, UI 재구성, 버튼 정리
- **사용자 인증 시스템 추가**: 완전한 인증 시스템, API 키 관리, 하드코딩된 관리자
- **텍스트 길이 제한**: AI 생성 시 텍스트 길이 제한 적용
- **구조화된 출력**: 필수/추가 항목으로 분류된 컷별 설명
- **씬별 관리**: 씬 단위로 그룹화된 컷 관리 시스템

### v2.2.0 (2025-09-15)
- **나노 바나나 API 추가**: Gemini 2.5 Flash Image Preview 모델 지원
- **이미지 생성 API 선택**: Google AI (Imagen) 또는 나노 바나나 선택 가능
- **나노 바나나 전용 옵션**: 
  - 기타 사이즈 요청사항 입력 (예: 1920x1080, 4K, 세로형 등)
  - 추가 프롬프트 입력으로 세부 요구사항 지정
- **멀티모달 이미지 생성**: 텍스트 + 이미지 입력으로 이미지 생성
- **API 통합**: AI 서비스 매니저를 통한 동적 API 선택

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

**최종 업데이트**: 2025-09-17  
**버전**: v2.3.0  
**개발자**: star612.net  
**라이선스**: MIT