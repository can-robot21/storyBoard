import { GeneratedTextCard } from '../types/project';

export interface TextDataStorage {
  generatedTextCards: GeneratedTextCard[];
  characterPrompt: string;
  scenarioPrompt: string;
  sceneCommonInput: string;
  storyInput: string;
  lastUpdated: string;
}

class TextDataService {
  private readonly STORAGE_KEY = 'storyboard-text-data';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한

  /**
   * 텍스트 데이터를 localStorage에 저장
   */
  saveTextData(data: Partial<TextDataStorage>): void {
    try {
      const existingData = this.loadTextData();
      const newData: TextDataStorage = {
        ...existingData,
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(newData);
      
      // 저장소 크기 확인
      if (jsonString.length > this.MAX_STORAGE_SIZE) {
        console.warn('텍스트 데이터가 너무 큽니다. 일부 데이터를 제거합니다.');
        // 오래된 데이터부터 제거
        this.cleanupOldData();
      }

      localStorage.setItem(this.STORAGE_KEY, jsonString);
      console.log('텍스트 데이터가 저장되었습니다.');
    } catch (error) {
      console.error('텍스트 데이터 저장 실패:', error);
    }
  }

  /**
   * localStorage에서 텍스트 데이터 로드
   */
  loadTextData(): TextDataStorage {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getDefaultData();
      }

      const data = JSON.parse(stored) as TextDataStorage;
      
      // 데이터 유효성 검사
      if (!this.isValidTextData(data)) {
        console.warn('저장된 텍스트 데이터가 유효하지 않습니다. 기본값을 사용합니다.');
        return this.getDefaultData();
      }

      return data;
    } catch (error) {
      console.error('텍스트 데이터 로드 실패:', error);
      return this.getDefaultData();
    }
  }

  /**
   * 특정 필드만 업데이트
   */
  updateField<K extends keyof TextDataStorage>(field: K, value: TextDataStorage[K]): void {
    const currentData = this.loadTextData();
    this.saveTextData({ [field]: value });
  }

  /**
   * 생성된 텍스트 카드 추가
   */
  addTextCard(textCard: GeneratedTextCard): void {
    const currentData = this.loadTextData();
    const updatedCards = [...currentData.generatedTextCards, textCard];
    this.updateField('generatedTextCards', updatedCards);
  }

  /**
   * 생성된 텍스트 카드 업데이트
   */
  updateTextCard(cardId: number, updates: Partial<GeneratedTextCard>): void {
    const currentData = this.loadTextData();
    const updatedCards = currentData.generatedTextCards.map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    );
    this.updateField('generatedTextCards', updatedCards);
  }

  /**
   * 생성된 텍스트 카드 삭제
   */
  deleteTextCard(cardId: number): void {
    const currentData = this.loadTextData();
    const updatedCards = currentData.generatedTextCards.filter(card => card.id !== cardId);
    this.updateField('generatedTextCards', updatedCards);
  }

  /**
   * 모든 텍스트 데이터 삭제
   */
  clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('모든 텍스트 데이터가 삭제되었습니다.');
    } catch (error) {
      console.error('텍스트 데이터 삭제 실패:', error);
    }
  }

  /**
   * 저장소 사용량 확인
   */
  getStorageUsage(): { used: number; max: number; percentage: number } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const used = stored ? stored.length : 0;
      const percentage = (used / this.MAX_STORAGE_SIZE) * 100;
      
      return {
        used,
        max: this.MAX_STORAGE_SIZE,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      console.error('저장소 사용량 확인 실패:', error);
      return { used: 0, max: this.MAX_STORAGE_SIZE, percentage: 0 };
    }
  }

  /**
   * 기본 데이터 반환
   */
  private getDefaultData(): TextDataStorage {
    return {
      generatedTextCards: [],
      characterPrompt: '',
      scenarioPrompt: '',
      sceneCommonInput: '',
      storyInput: '',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 데이터 유효성 검사
   */
  private isValidTextData(data: any): data is TextDataStorage {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.generatedTextCards) &&
      typeof data.characterPrompt === 'string' &&
      typeof data.scenarioPrompt === 'string' &&
      typeof data.sceneCommonInput === 'string' &&
      typeof data.storyInput === 'string' &&
      typeof data.lastUpdated === 'string'
    );
  }

  /**
   * 오래된 데이터 정리
   */
  private cleanupOldData(): void {
    const currentData = this.loadTextData();
    
    // 텍스트 카드가 너무 많으면 오래된 것부터 제거
    if (currentData.generatedTextCards.length > 50) {
      const sortedCards = currentData.generatedTextCards.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // 최신 30개만 유지
      const recentCards = sortedCards.slice(-30);
      this.updateField('generatedTextCards', recentCards);
    }
  }

  /**
   * 데이터 백업 생성
   */
  exportData(): string {
    const data = this.loadTextData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * 데이터 복원
   */
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as TextDataStorage;
      
      if (!this.isValidTextData(data)) {
        throw new Error('유효하지 않은 데이터 형식입니다.');
      }

      this.saveTextData(data);
      console.log('데이터가 성공적으로 복원되었습니다.');
      return true;
    } catch (error) {
      console.error('데이터 복원 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const textDataService = new TextDataService();

