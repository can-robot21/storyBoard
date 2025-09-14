import { PROMPT_TEMPLATES, AIResponse, PromptTemplate } from '../../types/ai-prompt';

export class AIPromptService {
  private static instance: AIPromptService;
  private maxRetries = 3;
  private retryDelay = 1000; // 1초

  static getInstance(): AIPromptService {
    if (!AIPromptService.instance) {
      AIPromptService.instance = new AIPromptService();
    }
    return AIPromptService.instance;
  }

  // 구조화된 프롬프트 생성
  async generateStructuredPrompt(
    type: string, 
    input: string, 
    retryCount: number = 0
  ): Promise<AIResponse> {
    try {
      const template = PROMPT_TEMPLATES[type];
      if (!template) {
        throw new Error(`Unknown prompt type: ${type}`);
      }

      const prompt = this.buildPrompt(template, input);
      const response = await this.callAIService(prompt, type);
      
      // JSON 유효성 검사
      const validatedResponse = this.validateResponse(response, template);
      
      return {
        success: true,
        data: validatedResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`AI Prompt generation failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay * (retryCount + 1));
        return this.generateStructuredPrompt(type, input, retryCount + 1);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 프롬프트 빌드
  private buildPrompt(template: PromptTemplate, input: string): string {
    return `${template.system}\n\n${template.user.replace('{input}', input)}\n\n${template.examples[0]}`;
  }

  // AI 서비스 호출
  private async callAIService(prompt: string, type: string): Promise<any> {
    // 실제 AI 서비스 구현 (Google AI, OpenAI 등)
    const response = await fetch('/api/generate-structured-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        type,
        temperature: 0.7,
        maxTokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // 응답 유효성 검사
  private validateResponse(response: any, template: PromptTemplate): any {
    try {
      // JSON 파싱 시도
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      // 필수 필드 검사
      const missingFields = template.validation.required.filter(
        field => !parsed.hasOwnProperty(field)
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // 길이 검사
      if (template.validation.maxLength) {
        const responseStr = JSON.stringify(parsed);
        if (responseStr.length > template.validation.maxLength) {
          throw new Error(`Response too long: ${responseStr.length} > ${template.validation.maxLength}`);
        }
      }

      return parsed;
    } catch (error) {
      throw new Error(`Response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 지연 함수
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 에러 복구 전략
  async recoverFromError(type: string, input: string, error: string): Promise<AIResponse> {
    console.log(`Attempting error recovery for ${type}:`, error);
    
    // 에러 타입별 복구 전략
    if (error.includes('JSON')) {
      return this.generateStructuredPrompt(type, input + '\n\nJSON 형식으로만 응답해주세요.');
    }
    
    if (error.includes('Missing required fields')) {
      return this.generateStructuredPrompt(type, input + '\n\n모든 필수 필드를 포함해주세요.');
    }
    
    if (error.includes('too long')) {
      return this.generateStructuredPrompt(type, input + '\n\n간결하게 요약해주세요.');
    }
    
    // 기본 복구 전략
    return this.generateStructuredPrompt(type, input);
  }

  // 배치 처리
  async generateBatchPrompts(
    requests: Array<{type: string, input: string}>
  ): Promise<AIResponse[]> {
    const results: AIResponse[] = [];
    
    for (const request of requests) {
      const result = await this.generateStructuredPrompt(request.type, request.input);
      results.push(result);
      
      // 요청 간 지연 (API 제한 방지)
      await this.delay(500);
    }
    
    return results;
  }
}

export const aiPromptService = AIPromptService.getInstance();
