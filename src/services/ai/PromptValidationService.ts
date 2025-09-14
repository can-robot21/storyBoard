import { AIResponse, PromptTemplate } from '../../types/ai-prompt';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class PromptValidationService {
  private static instance: PromptValidationService;

  static getInstance(): PromptValidationService {
    if (!PromptValidationService.instance) {
      PromptValidationService.instance = new PromptValidationService();
    }
    return PromptValidationService.instance;
  }

  // JSON 응답 검증
  validateJSONResponse(response: any, template: PromptTemplate): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // JSON 파싱 검사
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      
      if (typeof parsed !== 'object' || parsed === null) {
        result.isValid = false;
        result.errors.push('응답이 유효한 JSON 객체가 아닙니다.');
        return result;
      }

      // 필수 필드 검사
      const missingFields = template.validation.required.filter(
        field => !parsed.hasOwnProperty(field) || parsed[field] === undefined || parsed[field] === ''
      );
      
      if (missingFields.length > 0) {
        result.isValid = false;
        result.errors.push(`필수 필드가 누락되었습니다: ${missingFields.join(', ')}`);
      }

      // 데이터 타입 검사
      this.validateDataTypes(parsed, template, result);

      // 길이 검사
      this.validateLength(parsed, template, result);

      // 내용 품질 검사
      this.validateContentQuality(parsed, template, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`JSON 파싱 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // 데이터 타입 검사
  private validateDataTypes(data: any, template: PromptTemplate, result: ValidationResult): void {
    // 스토리 타입 검사
    if (template.validation.required.includes('title') && typeof data.title !== 'string') {
      result.errors.push('title은 문자열이어야 합니다.');
    }
    
    if (template.validation.required.includes('genre') && typeof data.genre !== 'string') {
      result.errors.push('genre는 문자열이어야 합니다.');
    }
    
    if (template.validation.required.includes('subPlots') && !Array.isArray(data.subPlots)) {
      result.errors.push('subPlots는 배열이어야 합니다.');
    }

    // 캐릭터 타입 검사
    if (template.validation.required.includes('age') && typeof data.age !== 'number') {
      result.errors.push('age는 숫자여야 합니다.');
    }
    
    if (template.validation.required.includes('personality') && !Array.isArray(data.personality)) {
      result.errors.push('personality는 배열이어야 합니다.');
    }
  }

  // 길이 검사
  private validateLength(data: any, template: PromptTemplate, result: ValidationResult): void {
    if (template.validation.maxLength) {
      const responseStr = JSON.stringify(data);
      if (responseStr.length > template.validation.maxLength) {
        result.warnings.push(`응답이 너무 깁니다 (${responseStr.length}/${template.validation.maxLength})`);
        result.suggestions.push('내용을 간결하게 요약해주세요.');
      }
    }

    // 개별 필드 길이 검사
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key].length > 500) {
        result.warnings.push(`${key} 필드가 너무 깁니다 (${data[key].length}자)`);
      }
    });
  }

  // 내용 품질 검사
  private validateContentQuality(data: any, template: PromptTemplate, result: ValidationResult): void {
    // 빈 문자열 검사
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string' && data[key].trim() === '') {
        result.warnings.push(`${key} 필드가 비어있습니다.`);
      }
    });

    // 배열 길이 검사
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key]) && data[key].length === 0) {
        result.warnings.push(`${key} 배열이 비어있습니다.`);
      }
    });

    // 중복 내용 검사
    if (data.title && data.mainPlot && data.title === data.mainPlot) {
      result.warnings.push('title과 mainPlot이 동일합니다.');
    }
  }

  // 에러 복구 제안
  generateRecoverySuggestions(error: string, type: string): string[] {
    const suggestions: string[] = [];

    if (error.includes('JSON')) {
      suggestions.push('AI에게 "JSON 형식으로만 응답해주세요"라고 명시하세요.');
      suggestions.push('응답을 다시 파싱해보세요.');
    }

    if (error.includes('Missing required fields')) {
      suggestions.push('프롬프트에 필수 필드 목록을 명시하세요.');
      suggestions.push('예시 JSON을 더 상세하게 제공하세요.');
    }

    if (error.includes('too long')) {
      suggestions.push('프롬프트에 "간결하게" 또는 "요약해서"라는 지시를 추가하세요.');
      suggestions.push('최대 길이 제한을 명시하세요.');
    }

    if (error.includes('empty')) {
      suggestions.push('입력 데이터가 충분한지 확인하세요.');
      suggestions.push('더 구체적인 입력을 제공하세요.');
    }

    return suggestions;
  }

  // 프롬프트 개선 제안
  improvePrompt(template: PromptTemplate, validationResult: ValidationResult): PromptTemplate {
    const improved = { ...template };

    if (validationResult.errors.some(e => e.includes('Missing required fields'))) {
      improved.user += '\n\n중요: 다음 필드들을 반드시 포함해주세요: ' + template.validation.required.join(', ');
    }

    if (validationResult.warnings.some(w => w.includes('too long'))) {
      improved.user += '\n\n응답은 간결하고 명확하게 작성해주세요.';
    }

    if (validationResult.warnings.some(w => w.includes('empty'))) {
      improved.user += '\n\n모든 필드에 의미있는 내용을 작성해주세요.';
    }

    return improved;
  }

  // 응답 품질 점수 계산
  calculateQualityScore(data: any, template: PromptTemplate): number {
    let score = 0;
    let totalChecks = 0;

    // 필수 필드 존재 여부 (40점)
    const requiredFields = template.validation.required;
    const existingFields = requiredFields.filter(field => 
      data.hasOwnProperty(field) && data[field] !== undefined && data[field] !== ''
    );
    score += (existingFields.length / requiredFields.length) * 40;
    totalChecks += 40;

    // 데이터 타입 정확성 (20점)
    const typeChecks = this.checkDataTypes(data);
    score += (typeChecks.correct / typeChecks.total) * 20;
    totalChecks += 20;

    // 내용 품질 (20점)
    const contentQuality = this.checkContentQuality(data);
    score += contentQuality * 20;
    totalChecks += 20;

    // 길이 적절성 (20점)
    const lengthScore = this.checkLengthAppropriateness(data, template);
    score += lengthScore * 20;
    totalChecks += 20;

    return Math.round((score / totalChecks) * 100);
  }

  private checkDataTypes(data: any): { correct: number; total: number } {
    let correct = 0;
    let total = 0;

    Object.keys(data).forEach(key => {
      total++;
      if (typeof data[key] === 'string' || typeof data[key] === 'number' || Array.isArray(data[key])) {
        correct++;
      }
    });

    return { correct, total };
  }

  private checkContentQuality(data: any): number {
    let quality = 0;
    let total = 0;

    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        total++;
        if (data[key].trim().length > 10) {
          quality += 1;
        }
      } else if (Array.isArray(data[key])) {
        total++;
        if (data[key].length > 0) {
          quality += 1;
        }
      }
    });

    return total > 0 ? quality / total : 0;
  }

  private checkLengthAppropriateness(data: any, template: PromptTemplate): number {
    const responseStr = JSON.stringify(data);
    const length = responseStr.length;
    const maxLength = template.validation.maxLength || 2000;

    if (length <= maxLength * 0.8) return 1;
    if (length <= maxLength) return 0.8;
    if (length <= maxLength * 1.2) return 0.5;
    return 0;
  }
}

export const promptValidationService = PromptValidationService.getInstance();
