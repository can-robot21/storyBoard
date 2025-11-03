import { AIProvider, GenerationType } from '../types/ai';

/**
 * AI Provider별 System Prompt 템플릿
 */
export interface PromptTemplate {
  system: string;
  format?: 'json' | 'text' | 'markdown';
  maxLength?: number;
  examples?: string[];
}

/**
 * Provider 및 생성 타입별 프롬프트 템플릿 정의
 */
export const PROMPT_TEMPLATES: Record<
  AIProvider,
  Record<GenerationType, PromptTemplate>
> = {
  google: {
    text: {
      system: "당신은 창의적인 스토리텔러이자 영상 제작 전문가입니다. 주어진 요청에 따라 매력적이고 구체적인 콘텐츠를 생성해주세요. 응답은 명확하고 구조화되어야 하며, 영상 제작에 바로 활용할 수 있는 구체적인 내용이어야 합니다.",
      format: 'text',
      maxLength: 5000
    },
    image: {
      system: "당신은 전문적인 이미지 생성 프롬프트 최적화 전문가입니다. 주어진 설명을 바탕으로 AI 이미지 생성에 최적화된 상세하고 구체적인 영문 프롬프트를 생성해주세요. 프롬프트는 시각적 요소, 스타일, 구도, 조명 등을 명확히 포함해야 합니다.",
      format: 'text',
      maxLength: 1000
    },
    video: {
      system: "당신은 전문적인 영상 제작 프롬프트 최적화 전문가입니다. 주어진 설명을 바탕으로 AI 영상 생성에 최적화된 상세하고 구체적인 영문 프롬프트를 생성해주세요. 프롬프트는 움직임, 카메라 워크, 장면 전환 등을 명확히 포함해야 합니다.",
      format: 'text',
      maxLength: 1000
    }
  },
  chatgpt: {
    text: {
      system: "You are a creative storyteller and video production expert. Generate engaging and specific content based on the given request. Your response should be clear, structured, and immediately usable for video production with concrete details.",
      format: 'text',
      maxLength: 4000
    },
    image: {
      system: "You are a professional image generation prompt optimization expert. Based on the given description, generate a detailed and specific English prompt optimized for AI image generation. The prompt must clearly include visual elements, style, composition, and lighting.",
      format: 'text',
      maxLength: 1000
    },
    video: {
      system: "You are a professional video production prompt optimization expert. Based on the given description, generate a detailed and specific English prompt optimized for AI video generation. The prompt must clearly include movement, camera work, and scene transitions.",
      format: 'text',
      maxLength: 1000
    }
  },
  anthropic: {
    text: {
      system: "You are a creative storyteller and video production expert. Generate engaging and specific content based on the given request. Your response should be clear, structured, and immediately usable for video production.",
      format: 'text',
      maxLength: 4000
    },
    image: {
      system: "You are a professional image generation prompt optimization expert. Generate optimized English prompts for AI image generation.",
      format: 'text',
      maxLength: 1000
    },
    video: {
      system: "You are a professional video production prompt optimization expert. Generate optimized English prompts for AI video generation.",
      format: 'text',
      maxLength: 1000
    }
  },
  kling: {
    text: {
      system: "You are a creative storyteller and video production expert.",
      format: 'text',
      maxLength: 2000
    },
    image: {
      system: "You are a professional image generation prompt optimization expert.",
      format: 'text',
      maxLength: 1000
    },
    video: {
      system: "You are a professional video production prompt optimization expert. Generate detailed English prompts optimized for AI video generation with movement and camera work specifications.",
      format: 'text',
      maxLength: 1000
    }
  }
};

/**
 * 프롬프트 템플릿 가져오기
 */
export const getPromptTemplate = (
  provider: AIProvider,
  type: GenerationType
): PromptTemplate => {
  return PROMPT_TEMPLATES[provider]?.[type] || PROMPT_TEMPLATES.google[type];
};

/**
 * System Prompt 가져오기
 */
export const getSystemPrompt = (
  provider: AIProvider,
  type: GenerationType
): string => {
  const template = getPromptTemplate(provider, type);
  return template.system;
};

/**
 * Provider별 프롬프트 최적화 함수
 */
export const optimizePromptForProvider = (
  prompt: string,
  provider: AIProvider,
  type: GenerationType,
  additionalContext?: string
): string => {
  const template = getPromptTemplate(provider, type);
  let optimized = prompt;

  // Provider별 최적화 규칙
  switch (provider) {
    case 'google':
      // Google AI는 한글 프롬프트도 잘 처리하므로 그대로 사용 가능
      // 하지만 영문이 더 정확할 수 있음
      if (type === 'image' || type === 'video') {
        // 이미지/영상 생성은 영문 프롬프트 권장
        // (기존 translateKoreanToEnglish 로직 활용)
      }
      break;

    case 'chatgpt':
      // ChatGPT는 영문 프롬프트가 더 효과적
      // 필요시 번역 로직 적용
      break;

    case 'anthropic':
      // Anthropic도 영문 프롬프트 권장
      break;

    case 'kling':
      // Kling은 영문 프롬프트 필수
      break;
  }

  // 추가 컨텍스트가 있으면 포함
  if (additionalContext) {
    optimized = `${optimized}\n\nAdditional context: ${additionalContext}`;
  }

  // 최대 길이 제한
  if (template.maxLength && optimized.length > template.maxLength) {
    optimized = optimized.substring(0, template.maxLength - 3) + '...';
  }

  return optimized;
};

