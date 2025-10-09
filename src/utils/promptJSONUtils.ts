// 프롬프트 JSON 형식 일관성 유틸리티

export interface StandardPromptFormat {
  id: string;
  type: 'story' | 'character' | 'image' | 'video' | 'text_card';
  title: string;
  content: {
    korean: string;
    english?: string;
  };
  metadata: {
    step: string;
    timestamp: string;
    version: string;
    source?: string;
  };
  parameters?: {
    [key: string]: any;
  };
  dependencies?: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  type: 'story' | 'character' | 'image' | 'video' | 'text_card';
  template: string;
  variables: string[];
  examples: Array<{
    input: { [key: string]: any };
    output: string;
  }>;
}

// 표준 프롬프트 템플릿들
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'story-base',
    name: '기본 스토리',
    description: '스토리보드를 위한 기본 스토리 프롬프트',
    type: 'story',
    template: `다음 조건에 맞는 스토리를 작성해주세요:
- 장르: {{genre}}
- 길이: {{length}}
- 주요 테마: {{theme}}
- 대상 연령: {{targetAge}}

스토리:`,
    variables: ['genre', 'length', 'theme', 'targetAge'],
    examples: [
      {
        input: {
          genre: '판타지',
          length: '짧음',
          theme: '모험',
          targetAge: '전체 연령'
        },
        output: '마법의 숲에서 잃어버린 친구를 찾아가는 용감한 소년의 이야기...'
      }
    ]
  },
  {
    id: 'character-description',
    name: '캐릭터 설명',
    description: '캐릭터의 외모와 성격을 상세히 설명하는 프롬프트',
    type: 'character',
    template: `캐릭터 정보:
이름: {{name}}
역할: {{role}}
성격: {{personality}}
외모: {{appearance}}

상세 설명:`,
    variables: ['name', 'role', 'personality', 'appearance'],
    examples: [
      {
        input: {
          name: '아리',
          role: '주인공',
          personality: '용감하고 호기심 많은',
          appearance: '긴 갈색 머리, 파란 눈'
        },
        output: '아리는 모험을 좋아하는 12세 소녀로, 긴 갈색 머리와 호기심 가득한 파란 눈을 가지고 있습니다...'
      }
    ]
  },
  {
    id: 'image-generation',
    name: '이미지 생성',
    description: '이미지 생성을 위한 상세한 프롬프트',
    type: 'image',
    template: `이미지 생성 프롬프트:
주제: {{subject}}
스타일: {{style}}
색상: {{colors}}
구도: {{composition}}
분위기: {{mood}}
품질: {{quality}}

상세 프롬프트:`,
    variables: ['subject', 'style', 'colors', 'composition', 'mood', 'quality'],
    examples: [
      {
        input: {
          subject: '마법사 소녀',
          style: '애니메이션',
          colors: '파스텔 톤',
          composition: '클로즈업',
          mood: '신비로운',
          quality: '고품질'
        },
        output: 'anime style cute magical girl with pastel colors, close-up portrait, mystical atmosphere, high quality, detailed...'
      }
    ]
  }
];

/**
 * 프롬프트를 표준 JSON 형식으로 변환
 */
export const convertToStandardFormat = (
  content: string,
  type: StandardPromptFormat['type'],
  step: string,
  options: {
    title?: string;
    english?: string;
    parameters?: { [key: string]: any };
    dependencies?: string[];
    source?: string;
  } = {}
): StandardPromptFormat => {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title: options.title || `${type} 프롬프트`,
    content: {
      korean: content,
      english: options.english
    },
    metadata: {
      step,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: options.source
    },
    parameters: options.parameters,
    dependencies: options.dependencies
  };
};

/**
 * 템플릿에 변수를 적용하여 프롬프트 생성
 */
export const applyTemplate = (
  templateId: string,
  variables: { [key: string]: any }
): string => {
  const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`템플릿을 찾을 수 없습니다: ${templateId}`);
  }

  let result = template.template;

  // 변수 치환
  template.variables.forEach(variable => {
    const value = variables[variable] || '';
    const placeholder = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
    result = result.replace(placeholder, value);
  });

  return result;
};

/**
 * 프롬프트 체인 생성 (이전 단계 결과를 다음 단계에 전달)
 */
export const createPromptChain = (
  prompts: StandardPromptFormat[]
): StandardPromptFormat[] => {
  const chain: StandardPromptFormat[] = [];

  prompts.forEach((prompt, index) => {
    const chainedPrompt = { ...prompt };

    // 이전 프롬프트들의 ID를 dependencies에 추가
    if (index > 0) {
      chainedPrompt.dependencies = [
        ...(chainedPrompt.dependencies || []),
        ...prompts.slice(0, index).map(p => p.id)
      ];
    }

    chain.push(chainedPrompt);
  });

  return chain;
};

/**
 * 프롬프트 검증
 */
export const validatePrompt = (prompt: StandardPromptFormat): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 필수 필드 검증
  if (!prompt.id) errors.push('ID가 필요합니다');
  if (!prompt.type) errors.push('타입이 필요합니다');
  if (!prompt.title) errors.push('제목이 필요합니다');
  if (!prompt.content?.korean) errors.push('한국어 내용이 필요합니다');
  if (!prompt.metadata?.step) errors.push('단계 정보가 필요합니다');
  if (!prompt.metadata?.timestamp) errors.push('타임스탬프가 필요합니다');

  // 경고 사항
  if (!prompt.content.english) warnings.push('영어 내용이 없습니다');
  if (prompt.content.korean.length < 10) warnings.push('내용이 너무 짧습니다');
  if (prompt.content.korean.length > 1000) warnings.push('내용이 너무 깁니다');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 프롬프트 최적화
 */
export const optimizePrompt = (prompt: StandardPromptFormat): StandardPromptFormat => {
  const optimized = { ...prompt };

  // 내용 정리
  optimized.content.korean = optimized.content.korean
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n');

  if (optimized.content.english) {
    optimized.content.english = optimized.content.english
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n');
  }

  // 메타데이터 업데이트
  optimized.metadata = {
    ...optimized.metadata,
    version: '1.0.1'
  };

  return optimized;
};

/**
 * 프롬프트 히스토리 관리
 */
export class PromptHistory {
  private history: StandardPromptFormat[] = [];
  private maxSize: number = 100;

  add(prompt: StandardPromptFormat): void {
    this.history.unshift(prompt);

    // 크기 제한
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
  }

  getByType(type: StandardPromptFormat['type']): StandardPromptFormat[] {
    return this.history.filter(p => p.type === type);
  }

  getByStep(step: string): StandardPromptFormat[] {
    return this.history.filter(p => p.metadata.step === step);
  }

  getRecent(count: number = 10): StandardPromptFormat[] {
    return this.history.slice(0, count);
  }

  clear(): void {
    this.history = [];
  }

  export(): string {
    return JSON.stringify(this.history, null, 2);
  }

  import(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      if (Array.isArray(imported)) {
        this.history = imported;
        return true;
      }
    } catch (error) {
      console.error('프롬프트 히스토리 가져오기 실패:', error);
    }
    return false;
  }
}

/**
 * 프롬프트 간 연관성 분석
 */
export const analyzePromptRelations = (
  prompts: StandardPromptFormat[]
): Array<{
  from: string;
  to: string;
  relation: 'dependency' | 'sequence' | 'reference';
  strength: number;
}> => {
  const relations: Array<{
    from: string;
    to: string;
    relation: 'dependency' | 'sequence' | 'reference';
    strength: number;
  }> = [];

  prompts.forEach((prompt, i) => {
    // 의존성 관계
    if (prompt.dependencies) {
      prompt.dependencies.forEach(depId => {
        relations.push({
          from: depId,
          to: prompt.id,
          relation: 'dependency',
          strength: 1.0
        });
      });
    }

    // 순서 관계 (타임스탬프 기준)
    if (i > 0) {
      relations.push({
        from: prompts[i - 1].id,
        to: prompt.id,
        relation: 'sequence',
        strength: 0.8
      });
    }

    // 내용 유사성 기반 참조 관계 (간단한 키워드 매칭)
    prompts.forEach((otherPrompt, j) => {
      if (i !== j) {
        const keywords1 = extractKeywords(prompt.content.korean);
        const keywords2 = extractKeywords(otherPrompt.content.korean);
        const similarity = calculateSimilarity(keywords1, keywords2);

        if (similarity > 0.3) {
          relations.push({
            from: otherPrompt.id,
            to: prompt.id,
            relation: 'reference',
            strength: similarity
          });
        }
      }
    });
  });

  return relations;
};

/**
 * 키워드 추출 (간단한 구현)
 */
const extractKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .slice(0, 10);
};

/**
 * 유사도 계산
 */
const calculateSimilarity = (keywords1: string[], keywords2: string[]): number => {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
};