/**
 * 토큰 계산 및 API 사용량 추적 유틸리티
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface APICall {
  id: string;
  timestamp: string;
  model: string;
  type: 'text' | 'image' | 'video';
  tokens: TokenUsage;
  prompt: string;
  response?: string;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  calls: APICall[];
}

class TokenCalculator {
  private static instance: TokenCalculator;
  private dailyUsage: DailyUsage[] = [];
  private currentSessionCalls: APICall[] = [];

  private constructor() {
    this.loadUsageFromStorage();
  }

  public static getInstance(): TokenCalculator {
    if (!TokenCalculator.instance) {
      TokenCalculator.instance = new TokenCalculator();
    }
    return TokenCalculator.instance;
  }

  /**
   * 간단한 토큰 계산 (정확하지 않지만 대략적인 추정)
   */
  public estimateTokens(text: string): number {
    // 한국어: 평균 1.5자당 1토큰
    // 영어: 평균 4자당 1토큰
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishChars = text.length - koreanChars;
    
    const koreanTokens = Math.ceil(koreanChars / 1.5);
    const englishTokens = Math.ceil(englishChars / 4);
    
    return koreanTokens + englishTokens;
  }

  /**
   * 모델별 토큰 비용 계산
   */
  public calculateCost(tokens: number, model: string): number {
    const costs: { [key: string]: { input: number; output: number } } = {
      'gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
      'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-2.5-flash-image': { input: 0.000075, output: 0.0003 },
      'veo-3.0-generate-001': { input: 0.0, output: 0.0 }, // 비디오 생성은 별도 비용
      'imagen-4.0-generate-001': { input: 0.0, output: 0.0 }, // 이미지 생성은 별도 비용
    };

    const modelCost = costs[model] || costs['gemini-2.5-flash'];
    return tokens * modelCost.input;
  }

  /**
   * API 호출 기록
   */
  public recordAPICall(
    model: string,
    type: 'text' | 'image' | 'video',
    prompt: string,
    response?: string
  ): APICall {
    const promptTokens = this.estimateTokens(prompt);
    const completionTokens = response ? this.estimateTokens(response) : 0;
    const totalTokens = promptTokens + completionTokens;
    const cost = this.calculateCost(totalTokens, model);

    const apiCall: APICall = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      model,
      type,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost
      },
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      response: response ? response.substring(0, 100) + (response.length > 100 ? '...' : '') : undefined
    };

    this.currentSessionCalls.push(apiCall);
    this.updateDailyUsage(apiCall);
    this.saveUsageToStorage();

    // 이벤트 발생으로 다른 컴포넌트에 알림
    window.dispatchEvent(new CustomEvent('apiCallCompleted', {
      detail: { apiCall }
    }));

    return apiCall;
  }

  /**
   * 일일 사용량 업데이트
   */
  private updateDailyUsage(apiCall: APICall): void {
    const today = new Date().toISOString().split('T')[0];
    let dailyUsage = this.dailyUsage.find(d => d.date === today);

    if (!dailyUsage) {
      dailyUsage = {
        date: today,
        totalTokens: 0,
        totalCost: 0,
        calls: []
      };
      this.dailyUsage.push(dailyUsage);
    }

    dailyUsage.totalTokens += apiCall.tokens.totalTokens;
    dailyUsage.totalCost += apiCall.tokens.cost;
    dailyUsage.calls.push(apiCall);
  }

  /**
   * 현재 세션 통계
   */
  public getCurrentSessionStats(): {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    callsByType: { [key: string]: number };
    callsByModel: { [key: string]: number };
  } {
    const callsByType: { [key: string]: number } = {};
    const callsByModel: { [key: string]: number } = {};
    let totalTokens = 0;
    let totalCost = 0;

    this.currentSessionCalls.forEach(call => {
      callsByType[call.type] = (callsByType[call.type] || 0) + 1;
      callsByModel[call.model] = (callsByModel[call.model] || 0) + 1;
      totalTokens += call.tokens.totalTokens;
      totalCost += call.tokens.cost;
    });

    return {
      totalCalls: this.currentSessionCalls.length,
      totalTokens,
      totalCost,
      callsByType,
      callsByModel
    };
  }

  /**
   * 일일 사용량 통계
   */
  public getDailyStats(days: number = 7): DailyUsage[] {
    return this.dailyUsage.slice(-days);
  }

  /**
   * 사용량 초기화
   */
  public clearSession(): void {
    this.currentSessionCalls = [];
  }

  /**
   * 로컬 스토리지에서 사용량 로드
   */
  private loadUsageFromStorage(): void {
    try {
      const saved = localStorage.getItem('apiUsageData');
      if (saved) {
        const data = JSON.parse(saved);
        this.dailyUsage = data.dailyUsage || [];
        this.currentSessionCalls = data.currentSessionCalls || [];
      }
    } catch (error) {
      console.error('API 사용량 데이터 로드 오류:', error);
    }
  }

  /**
   * 로컬 스토리지에 사용량 저장
   */
  private saveUsageToStorage(): void {
    try {
      const data = {
        dailyUsage: this.dailyUsage,
        currentSessionCalls: this.currentSessionCalls,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('apiUsageData', JSON.stringify(data));
    } catch (error) {
      console.error('API 사용량 데이터 저장 오류:', error);
    }
  }
}

export default TokenCalculator;
