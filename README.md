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

## 🏗️ App.tsx 리팩토링 구조 분석

### 1. 전체 아키텍처 개선

#### **리팩토링 전 (v1.x)**
- **단일 파일**: 3908줄의 거대한 App.tsx
- **혼재된 로직**: UI 로직과 비즈니스 로직이 한 파일에 혼재
- **유지보수 어려움**: 코드 수정 시 전체 파일 영향
- **재사용성 부족**: 중복 코드 다수 존재

#### **리팩토링 후 (v2.1)**
- **모듈화된 구조**: 200줄의 깔끔한 App.tsx
- **관심사 분리**: UI 로직과 비즈니스 로직 완전 분리
- **커스텀 훅 활용**: 각 기능별 핸들러 훅으로 분리
- **타입 안정성**: TypeScript 타입 정의 완전 적용

### 2. App.tsx 코드 구조 분석

#### **Import 구조**
```typescript
// React 및 상태 관리
import React, { useState } from 'react';
import { useUIStore } from './stores/uiStore';

// 레이아웃 컴포넌트
import { Header } from './components/layout/Header';
import { MainLayout } from './components/layout/MainLayout';
import { AISettingsModal } from './components/common/AISettingsModal';

// 커스텀 훅 (비즈니스 로직)
import { useProjectHandlers } from './hooks/useProjectHandlers';
import { useImageHandlers } from './hooks/useImageHandlers';
import { useVideoHandlers } from './hooks/useVideoHandlers';
import { useAIServiceManager } from './hooks/useAIServiceManager';

// TypeScript 타입 정의
import { 
  GeneratedCharacter, GeneratedBackground, GeneratedSettingCut,
  GeneratedTextCard, GeneratedImage, GeneratedVideo, GeneratedProjectData
} from './types/project';
import { AIProvider } from './types/ai';
```

#### **상태 관리 구조**
```typescript
// 1. 기본 UI 상태
const [currentStep, setCurrentStep] = useState("프로젝트 개요");
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [showAISettings, setShowAISettings] = useState(false);

// 2. AI 서비스 관리
const { selectedProvider, changeAIService } = useAIServiceManager();

// 3. 프로젝트 개요 상태 (5개 상태)
const [story, setStory] = useState("");
const [characterList, setCharacterList] = useState<any[]>([]);
const [scenarioPrompt, setScenarioPrompt] = useState("");
const [storySummary, setStorySummary] = useState("");
const [finalScenario, setFinalScenario] = useState("");
const [generatedProjectData, setGeneratedProjectData] = useState<GeneratedProjectData | null>(null);

// 4. 이미지 생성 상태 (3개 상태)
const [generatedCharacters, setGeneratedCharacters] = useState<GeneratedCharacter[]>([]);
const [generatedBackgrounds, setGeneratedBackgrounds] = useState<GeneratedBackground[]>([]);
const [generatedSettingCuts, setGeneratedSettingCuts] = useState<GeneratedSettingCut[]>([]);

// 5. 영상 생성 상태 (4개 상태)
const [generatedTextCards, setGeneratedTextCards] = useState<GeneratedTextCard[]>([]);
const [generatedCharacterImages, setGeneratedCharacterImages] = useState<GeneratedImage[]>([]);
const [generatedVideoBackgrounds, setGeneratedVideoBackgrounds] = useState<GeneratedImage[]>([]);
const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);

// 6. 영상 생성 선택 상태 (3개 상태)
const [selectedTextCards, setSelectedTextCards] = useState<Set<number>>(new Set());
const [selectedCharacterImages, setSelectedCharacterImages] = useState<Set<number>>(new Set());
const [selectedVideoBackgrounds, setSelectedVideoBackgrounds] = useState<Set<number>>(new Set());

// 7. UI 상태
const [showTextResults, setShowTextResults] = useState(false);
```

#### **핸들러 훅 구조**
```typescript
// 프로젝트 핸들러 (프로젝트 개요 관련)
const projectHandlers = useProjectHandlers(
  story, setStory,
  characterList, setCharacterList,
  scenarioPrompt, setScenarioPrompt,
  storySummary, setStorySummary,
  finalScenario, setFinalScenario,
  generatedProjectData, setGeneratedProjectData,
  currentStep, setCurrentStep
);

// 이미지 핸들러 (이미지 생성 관련)
const imageHandlers = useImageHandlers(
  generatedCharacters, setGeneratedCharacters,
  generatedBackgrounds, setGeneratedBackgrounds,
  generatedSettingCuts, setGeneratedSettingCuts,
  generatedProjectData
);

// 영상 핸들러 (영상 생성 관련)
const videoHandlers = useVideoHandlers(
  generatedTextCards, setGeneratedTextCards,
  generatedCharacterImages, setGeneratedCharacterImages,
  generatedVideoBackgrounds, setGeneratedVideoBackgrounds,
  generatedVideos, setGeneratedVideos,
  generatedProjectData
);
```

#### **이벤트 핸들러 구조**
```typescript
// 인증 관련 핸들러
const handleLogin = () => { /* 로그인 로직 */ };
const handleLogout = () => { /* 로그아웃 로직 */ };

// AI 설정 관련 핸들러
const handleAISettingsClick = () => { /* AI 설정 모달 열기 */ };
const handleAISettingsClose = () => { /* AI 설정 모달 닫기 */ };
const handleAIProviderChange = async (provider: AIProvider) => { /* AI 서비스 변경 */ };
const handleAISettingsSave = () => { /* AI 설정 저장 */ };
```

#### **컴포넌트 렌더링 구조**
```typescript
return (
  <div className="h-screen flex flex-col bg-gray-50">
    {/* 헤더 컴포넌트 */}
    <Header
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      isLoggedIn={isLoggedIn}
      onLogin={handleLogin}
      onLogout={handleLogout}
      onAISettingsClick={handleAISettingsClick}
      selectedAIProvider={selectedProvider}
    />
    
    {/* 메인 레이아웃 컴포넌트 */}
    <MainLayout 
      currentStep={currentStep}
      // 프로젝트 개요 props (6개)
      story={story} setStory={setStory}
      characterList={characterList} setCharacterList={setCharacterList}
      scenarioPrompt={scenarioPrompt} setScenarioPrompt={setScenarioPrompt}
      storySummary={storySummary} setStorySummary={setStorySummary}
      finalScenario={finalScenario} setFinalScenario={setFinalScenario}
      generatedProjectData={generatedProjectData} setGeneratedProjectData={setGeneratedProjectData}
      
      // 이미지 생성 props (3개)
      generatedCharacters={generatedCharacters} setGeneratedCharacters={setGeneratedCharacters}
      generatedBackgrounds={generatedBackgrounds} setGeneratedBackgrounds={setGeneratedBackgrounds}
      generatedSettingCuts={generatedSettingCuts} setGeneratedSettingCuts={setGeneratedSettingCuts}
      
      // 영상 생성 props (4개)
      generatedTextCards={generatedTextCards} setGeneratedTextCards={setGeneratedTextCards}
      generatedCharacterImages={generatedCharacterImages} setGeneratedCharacterImages={setGeneratedCharacterImages}
      generatedVideoBackgrounds={generatedVideoBackgrounds} setGeneratedVideoBackgrounds={setGeneratedVideoBackgrounds}
      generatedVideos={generatedVideos} setGeneratedVideos={setGeneratedVideos}
      
      // 영상 생성 선택 상태 (3개)
      selectedTextCards={selectedTextCards} setSelectedTextCards={setSelectedTextCards}
      selectedCharacterImages={selectedCharacterImages} setSelectedCharacterImages={setSelectedCharacterImages}
      selectedVideoBackgrounds={selectedVideoBackgrounds} setSelectedVideoBackgrounds={setSelectedVideoBackgrounds}
      
      // 핸들러들 (3개)
      projectHandlers={projectHandlers}
      imageHandlers={imageHandlers}
      videoHandlers={videoHandlers}
      
      // UI 상태 (1개)
      showTextResults={showTextResults} setShowTextResults={setShowTextResults}
    />
    
    {/* AI 설정 모달 */}
    <AISettingsModal
      isOpen={showAISettings}
      onClose={handleAISettingsClose}
      selectedProvider={selectedProvider}
      onProviderChange={handleAIProviderChange}
      onSave={handleAISettingsSave}
    />
  </div>
);
```

### 3. 리팩토링 효과 분석

#### **코드 품질 개선**
- **가독성**: 200줄의 깔끔한 코드로 가독성 대폭 향상
- **유지보수성**: 각 기능별로 분리되어 수정 시 영향 범위 최소화
- **재사용성**: 커스텀 훅으로 비즈니스 로직 재사용 가능
- **테스트 용이성**: 각 훅별로 독립적인 테스트 가능

#### **성능 최적화**
- **메모이제이션**: 각 훅에서 필요한 상태만 관리
- **렌더링 최적화**: 상태 변경 시 해당 컴포넌트만 리렌더링
- **번들 크기**: 코드 분할로 초기 로딩 시간 단축

#### **개발 생산성**
- **디버깅**: 각 기능별로 독립적인 디버깅 가능
- **협업**: 여러 개발자가 동시에 다른 기능 개발 가능
- **확장성**: 새로운 기능 추가 시 기존 코드 영향 최소화

### 4. 핸들러 훅별 기능 분석

#### **useProjectHandlers**
- **기능**: 프로젝트 개요 관련 모든 비즈니스 로직
- **상태**: story, characterList, scenarioPrompt, storySummary, finalScenario, generatedProjectData
- **핸들러**: AI 텍스트 생성, 프로젝트 데이터 관리, 단계 전환

#### **useImageHandlers**
- **기능**: 이미지 생성 관련 모든 비즈니스 로직
- **상태**: generatedCharacters, generatedBackgrounds, generatedSettingCuts
- **핸들러**: AI 이미지 생성, 이미지 관리, 다운로드 기능

#### **useVideoHandlers**
- **기능**: 영상 생성 관련 모든 비즈니스 로직
- **상태**: generatedTextCards, generatedCharacterImages, generatedVideoBackgrounds, generatedVideos
- **핸들러**: AI 영상 생성, 선택 기능, 영상 옵션 설정, 다운로드 기능

#### **useAIServiceManager**
- **기능**: AI 서비스 관리 및 전환
- **상태**: selectedProvider
- **핸들러**: AI 서비스 변경, 설정 관리

### 5. 타입 안정성 분석

#### **TypeScript 타입 정의**
```typescript
// 프로젝트 관련 타입
import { 
  GeneratedCharacter,    // 생성된 캐릭터 타입
  GeneratedBackground,   // 생성된 배경 타입
  GeneratedSettingCut,   // 생성된 설정컷 타입
  GeneratedTextCard,     // 생성된 텍스트 카드 타입
  GeneratedImage,        // 생성된 이미지 타입
  GeneratedVideo,        // 생성된 영상 타입
  GeneratedProjectData   // 생성된 프로젝트 데이터 타입
} from './types/project';

// AI 관련 타입
import { AIProvider } from './types/ai';
```

#### **타입 안정성 효과**
- **컴파일 타임 에러 검출**: 개발 중 타입 오류 사전 발견
- **자동 완성**: IDE에서 정확한 자동 완성 제공
- **리팩토링 안전성**: 타입 변경 시 영향 범위 자동 검출
- **문서화 효과**: 타입 정의가 코드의 문서 역할

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
REACT_APP_GEMINI_API_KEY=your-gemini-api-key  # Google AI 및 나노 바나나 API용
REACT_APP_OPENAI_API_KEY=your-openai-api-key  # OpenAI API용
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

**최종 업데이트**: 2025-09-14  
**버전**: v2.2.0  
**개발자**: star612.net  
**라이선스**: MIT