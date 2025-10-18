// AI 프롬프트 JSON 스키마 정의

export interface StoryPrompt {
  title: string;
  genre: string;
  theme: string;
  mainPlot: string;
  subPlots: string[];
  targetAudience: string;
  duration: string;
  visualStyle: string;
  emotionalTone: string;
  keyMessages: string[];
}

export interface CharacterPrompt {
  name: string;
  age: number;
  gender: string;
  personality: string[];
  appearance: string;
  background: string;
  motivation: string;
  role: string;
  relationships: string[];
  visualDescription: string;
}

export interface ScenarioPrompt {
  sceneNumber: number;
  title: string;
  location: string;
  timeOfDay: string;
  duration: string;
  characters: string[];
  action: string;
  dialogue: string;
  visualElements: string[];
  cameraAngles: string[];
  transitions: string;
}

export interface DialoguePrompt {
  speaker: string;
  text: string;
  emotion: string;
  tone: string;
  context: string;
  timing: string;
  visualCues: string[];
}

export interface FinalScenarioPrompt {
  projectTitle: string;
  totalDuration: string;
  scenes: ScenarioPrompt[];
  characters: CharacterPrompt[];
  storyArc: string;
  visualStyle: string;
  technicalRequirements: string[];
  productionNotes: string[];
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  retryCount?: number;
  timestamp: string;
}

export interface PromptTemplate {
  system: string;
  user: string;
  examples: string[];
  validation: {
    required: string[];
    format: string;
    maxLength?: number;
  };
}

// 프롬프트 템플릿 정의
export const PROMPT_TEMPLATES: { [key: string]: PromptTemplate } = {
  story: {
    system: "당신은 전문적인 영상 제작 스토리텔러입니다. 주어진 정보를 바탕으로 구조화된 스토리 프롬프트를 JSON 형식으로 생성해주세요.",
    user: "다음 정보를 바탕으로 영상 제작용 스토리 프롬프트를 생성해주세요:\n\n{input}\n\n다음 JSON 형식으로 응답해주세요:",
    examples: [
      `{
        "title": "스토리 제목",
        "genre": "장르",
        "theme": "주제",
        "mainPlot": "주요 플롯",
        "subPlots": ["서브 플롯1", "서브 플롯2"],
        "targetAudience": "타겟 오디언스",
        "duration": "예상 길이",
        "visualStyle": "시각적 스타일",
        "emotionalTone": "감정적 톤",
        "keyMessages": ["핵심 메시지1", "핵심 메시지2"]
      }`
    ],
    validation: {
      required: ["title", "genre", "theme", "mainPlot"],
      format: "json",
      maxLength: 2000
    }
  },
  character: {
    system: "당신은 전문적인 캐릭터 디자이너입니다. 주어진 정보를 바탕으로 영상 제작에 적합한 캐릭터 프롬프트를 JSON 형식으로 생성해주세요.",
    user: "다음 캐릭터 정보를 바탕으로 영상 제작용 캐릭터 프롬프트를 생성해주세요:\n\n{input}\n\n다음 JSON 형식으로 응답해주세요:",
    examples: [
      `{
        "name": "캐릭터 이름",
        "age": 25,
        "gender": "성별",
        "personality": ["성격1", "성격2"],
        "appearance": "외모 설명",
        "background": "배경 스토리",
        "motivation": "동기",
        "role": "역할",
        "relationships": ["관계1", "관계2"],
        "visualDescription": "시각적 설명"
      }`
    ],
    validation: {
      required: ["name", "age", "gender", "personality", "appearance"],
      format: "json",
      maxLength: 1500
    }
  },
  scenario: {
    system: "당신은 전문적인 시나리오 작가입니다. 주어진 정보를 바탕으로 영상 제작에 적합한 시나리오 프롬프트를 JSON 형식으로 생성해주세요.",
    user: "다음 시나리오 정보를 바탕으로 영상 제작용 시나리오 프롬프트를 생성해주세요:\n\n{input}\n\n다음 JSON 형식으로 응답해주세요:",
    examples: [
      `{
        "sceneNumber": 1,
        "title": "장면 제목",
        "location": "장소",
        "timeOfDay": "시간대",
        "duration": "길이",
        "characters": ["캐릭터1", "캐릭터2"],
        "action": "액션 설명",
        "dialogue": "대사",
        "visualElements": ["시각 요소1", "시각 요소2"],
        "cameraAngles": ["카메라 앵글1", "카메라 앵글2"],
        "transitions": "전환 효과"
      }`
    ],
    validation: {
      required: ["sceneNumber", "title", "location", "action"],
      format: "json",
      maxLength: 1000
    }
  },
  dialogue: {
    system: "당신은 전문적인 대사 작가입니다. 주어진 정보를 바탕으로 영상 제작에 적합한 대사 프롬프트를 JSON 형식으로 생성해주세요.",
    user: "다음 대사 정보를 바탕으로 영상 제작용 대사 프롬프트를 생성해주세요:\n\n{input}\n\n다음 JSON 형식으로 응답해주세요:",
    examples: [
      `{
        "speaker": "화자",
        "text": "대사 내용",
        "emotion": "감정",
        "tone": "톤",
        "context": "맥락",
        "timing": "타이밍",
        "visualCues": ["시각적 단서1", "시각적 단서2"]
      }`
    ],
    validation: {
      required: ["speaker", "text", "emotion"],
      format: "json",
      maxLength: 500
    }
  },
  final: {
    system: "당신은 전문적인 영상 제작 프로듀서입니다. 주어진 모든 정보를 통합하여 최종 시나리오 프롬프트를 JSON 형식으로 생성해주세요.",
    user: "다음 모든 정보를 통합하여 최종 영상 제작용 시나리오 프롬프트를 생성해주세요:\n\n{input}\n\n다음 JSON 형식으로 응답해주세요:",
    examples: [
      `{
        "projectTitle": "프로젝트 제목",
        "totalDuration": "총 길이",
        "scenes": [/* 시나리오 배열 */],
        "characters": [/* 캐릭터 배열 */],
        "storyArc": "스토리 아크",
        "visualStyle": "시각적 스타일",
        "technicalRequirements": ["기술 요구사항1", "기술 요구사항2"],
        "productionNotes": ["제작 노트1", "제작 노트2"]
      }`
    ],
    validation: {
      required: ["projectTitle", "totalDuration", "scenes", "characters"],
      format: "json",
      maxLength: 5000
    }
  }
};
