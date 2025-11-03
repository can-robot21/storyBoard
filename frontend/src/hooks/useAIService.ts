import { useState, useCallback } from 'react';
import { useAIServiceManager } from './useAIServiceManager';
import { useUIStore } from '../stores/uiStore';
import { getSystemPrompt } from '../utils/promptTemplates';

export interface AIGenerationOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ImageGenerationOptions extends AIGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16';
  quality?: 'standard' | 'high';
}

export interface VideoGenerationOptions extends AIGenerationOptions {
  videoRatio?: '16:9' | '1:1' | '9:16';
  duration?: number;
}

export const useAIService = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { addNotification } = useUIStore();
  const { getCurrentAIService, selectedProvider } = useAIServiceManager();

  // 텍스트 생성
  const generateText = useCallback(async (options: AIGenerationOptions): Promise<string> => {
    setIsGenerating(true);
    try {
      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      // Provider별 System Prompt 적용
      const systemPrompt = getSystemPrompt(selectedProvider, 'text');
      
      const result = await aiService.generateText({
        prompt: options.prompt,
        provider: selectedProvider,
        model: (options.model as any) || (selectedProvider === 'google' ? 'gemini-2.5-flash' : 'gpt-4'),
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        systemPrompt,
        generationType: 'text'
      });
      
      return result.text;
    } catch (error) {
      console.error('텍스트 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  // 이미지 생성
  const generateImage = useCallback(async (options: ImageGenerationOptions): Promise<string> => {
    setIsGenerating(true);
    try {
      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      // Provider별 System Prompt 적용 (이미지 생성 최적화)
      const systemPrompt = getSystemPrompt(selectedProvider, 'image');
      // 이미지 생성 프롬프트는 systemPrompt를 참고하여 최적화
      const optimizedPrompt = systemPrompt 
        ? `${systemPrompt}\n\nGenerate image: ${options.prompt}`
        : options.prompt;
      
      const result = await aiService.generateImage({
        prompt: optimizedPrompt,
        provider: selectedProvider,
        model: (options.model as any) || 'dall-e-3',
        aspectRatio: options.aspectRatio || '16:9',
        quality: options.quality || 'standard'
      });
      
      return result.images[0] || '';
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  // 영상 생성
  const generateVideo = useCallback(async (options: VideoGenerationOptions): Promise<string> => {
    setIsGenerating(true);
    try {
      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      // Provider별 System Prompt 적용 (영상 생성 최적화)
      const systemPrompt = getSystemPrompt(selectedProvider, 'video');
      // 영상 생성 프롬프트는 systemPrompt를 참고하여 최적화
      const optimizedPrompt = systemPrompt 
        ? `${systemPrompt}\n\nGenerate video: ${options.prompt}`
        : options.prompt;
      
      const result = await aiService.generateVideo({
        prompt: optimizedPrompt,
        provider: selectedProvider,
        model: (options.model as any) || 'veo-3.0-generate-preview',
        videoRatio: options.videoRatio || '16:9',
        duration: options.duration || 10,
        quality: 'standard'
      });
      
      return result.videos[0] || '';
    } catch (error) {
      console.error('영상 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  // 통합 프롬프트 생성
  const generateIntegratedPrompts = useCallback(async (projectData: {
    story: string;
    characterList: Array<{ name: string; description: string }>;
    storyText: string;
    dialogue: string;
  }): Promise<{
    characterPrompt: string;
    scenarioPrompt: string;
    imagePrompts: {
      character: string;
      background: string;
      setting: string;
    };
    videoPrompts: {
      main: string;
      cuts: string[];
    };
  }> => {
    setIsGenerating(true);
    try {
      const prompt = `다음 프로젝트 정보를 바탕으로 AI 텍스트 생성을 위한 프롬프트를 생성해주세요:

=== 프로젝트 정보 ===
스토리: ${projectData.story}
캐릭터 목록: ${projectData.characterList.map(char => `${char.name}: ${char.description}`).join(', ')}
상세 스토리 텍스트: ${projectData.storyText}
주요 대사: ${projectData.dialogue}

=== 요청사항 ===
1. 캐릭터 설정 프롬프트: 각 캐릭터의 특성과 역할을 명확히 정의
2. 시나리오 프롬프트: 스토리 구조와 장면 구성에 대한 프롬프트
3. 영상 생성 최적화 프롬프트: 각 항목별로 영상 생성에 최적화된 영문 프롬프트

다음 JSON 형식으로 응답해주세요:
{
  "characterPrompt": "캐릭터 설정 프롬프트 내용",
  "scenarioPrompt": "시나리오 프롬프트 내용",
  "imagePrompts": {
    "character": "영문 캐릭터 이미지 생성 프롬프트",
    "background": "영문 배경 이미지 생성 프롬프트",
    "setting": "영문 설정 컷 이미지 생성 프롬프트"
  },
  "videoPrompts": {
    "main": "영문 메인 영상 생성 프롬프트",
    "cuts": ["컷1 영문 프롬프트", "컷2 영문 프롬프트", "컷3 영문 프롬프트"]
  }
}`;

      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      const result = await aiService.generateText({
        prompt,
        provider: selectedProvider,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      });
      
      const text = result.text;
      
      // JSON 파싱 시도
      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (e) {
        // JSON 파싱 실패 시 기본 구조로 설정
        parsedResult = {
          characterPrompt: text,
          scenarioPrompt: text,
          imagePrompts: {
            character: "Character image generation prompt",
            background: "Background image generation prompt",
            setting: "Setting cut image generation prompt"
          },
          videoPrompts: {
            main: "Main video generation prompt",
            cuts: ["Cut 1 prompt", "Cut 2 prompt", "Cut 3 prompt"]
          }
        };
      }

      return parsedResult;
    } catch (error) {
      console.error('통합 프롬프트 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 시나리오 프롬프트 생성
  const generateScenarioPrompt = useCallback(async (projectData: {
    story: string;
    characterList: Array<{ name: string; description: string }>;
    storyText: string;
    dialogue: string;
  }): Promise<string> => {
    setIsGenerating(true);
    try {
      const prompt = `다음 정보를 바탕으로 시나리오 생성용 프롬프트를 만들어주세요:

스토리: ${projectData.story}
캐릭터: ${projectData.characterList.map(char => `${char.name}: ${char.description}`).join(', ')}
상세 스토리: ${projectData.storyText}
주요 대사: ${projectData.dialogue}

시나리오 생성에 필요한 프롬프트를 작성해주세요.`;

      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      const result = await aiService.generateText({
        prompt,
        provider: selectedProvider,
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
      });
      
      return result.text;
    } catch (error) {
      console.error('시나리오 프롬프트 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  // 500자 스토리 정리 생성
  const generateStorySummary = useCallback(async (story: string): Promise<string> => {
    setIsGenerating(true);
    try {
      const prompt = `다음 스토리를 500자 이내로 간결하게 정리해주세요:

${story}

핵심 내용만 간결하게 요약해주세요.`;

      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      const result = await aiService.generateText({
        prompt,
        provider: selectedProvider,
        model: 'gpt-4',
        maxTokens: 500,
        temperature: 0.7
      });
      
      return result.text;
    } catch (error) {
      console.error('스토리 정리 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  // 최종 시나리오 생성
  const generateFinalScenario = useCallback(async (data: {
    characterPrompt: string;
    scenarioPrompt: string;
    storySummary: string;
  }): Promise<string> => {
    setIsGenerating(true);
    try {
      const prompt = `다음 정보를 바탕으로 최종 텍스트 시나리오를 생성해주세요:

캐릭터 프롬프트: ${data.characterPrompt}
시나리오 프롬프트: ${data.scenarioPrompt}
500자 스토리 정리: ${data.storySummary}

위의 모든 정보를 통합하여 완성된 텍스트 시나리오를 생성해주세요.`;

      const aiService = getCurrentAIService();
      if (!aiService) {
        throw new Error(`${selectedProvider} AI 서비스를 사용할 수 없습니다.`);
      }
      
      const result = await aiService.generateText({
        prompt,
        provider: selectedProvider,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      });
      
      return result.text;
    } catch (error) {
      console.error('최종 시나리오 생성 오류:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [getCurrentAIService, selectedProvider]);

  return {
    isGenerating,
    generateText,
    generateImage,
    generateVideo,
    generateIntegratedPrompts,
    generateScenarioPrompt,
    generateStorySummary,
    generateFinalScenario
  };
};
