import { BaseAIService } from './BaseAIService';
import { AIProvider, TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse, AIServiceConfig } from '../../types/ai';
import axios, { AxiosError } from 'axios';

export class ChatGPTService extends BaseAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor(config: AIServiceConfig) {
    super(config);
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.baseURL = config.baseUrl;
    }
  }

  protected validateConfig(): void {
    if (!this.apiKey || !this.apiKey.startsWith('sk-')) {
      this.isAvailableFlag = false;
      throw new Error('유효하지 않은 OpenAI API 키입니다.');
    }
    this.isAvailableFlag = true;
  }

  getProvider(): AIProvider {
    return 'chatgpt';
  }

  async generateText(options: TextGenerationOptions): Promise<TextGenerationResponse> {
    if (!this.isAvailable()) {
      throw new Error('ChatGPT 서비스를 사용할 수 없습니다.');
    }

    try {
      const model = options.model || 'gpt-4o-mini';
      const maxTokens = options.maxTokens || 4000;
      const temperature = options.temperature || 0.7;
      const systemPrompt = options.systemPrompt;

      const messages: any[] = [];
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      messages.push({
        role: 'user',
        content: options.prompt
      });

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: options.topP || 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.choices && response.data.choices[0]) {
        const generatedText = response.data.choices[0].message.content;
        const usage = response.data.usage;

        return this.formatTextResponse(
          generatedText,
          {
            promptTokens: usage?.prompt_tokens || 0,
            completionTokens: usage?.completion_tokens || 0,
            totalTokens: usage?.total_tokens || 0
          },
          model,
          response.data.choices[0].finish_reason || 'stop'
        );
      } else {
        throw new Error('ChatGPT API 응답 형식이 예상과 다릅니다.');
      }
    } catch (error) {
      console.error('ChatGPT 텍스트 생성 오류:', error);

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('OpenAI API 키가 유효하지 않습니다.');
        } else if (error.response?.status === 429) {
          throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.response?.status === 400) {
          const errorMessage = error.response.data?.error?.message || '잘못된 요청입니다.';
          throw new Error(`ChatGPT API 오류: ${errorMessage}`);
        }
      }

      throw new Error('ChatGPT 텍스트 생성에 실패했습니다.');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    if (!this.isAvailable()) {
      throw new Error('ChatGPT 서비스를 사용할 수 없습니다.');
    }

    try {
      const model = options.model || 'dall-e-3';
      const size = this.mapAspectRatioToSize(options.aspectRatio || '1:1');
      const quality = options.quality === 'high' ? 'hd' : 'standard';
      const style = options.style === 'photographic' ? 'natural' : 'vivid';
      const numberOfImages = options.numberOfImages || 1;

      const response = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model,
          prompt: options.prompt,
          size,
          quality,
          style,
          n: numberOfImages
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.data && response.data.data[0]) {
        const images = response.data.data.map((item: any) => item.url);

        return this.formatImageResponse(
          images,
          {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          },
          model
        );
      } else {
        throw new Error('ChatGPT 이미지 생성 API 응답 형식이 예상과 다릅니다.');
      }
    } catch (error) {
      console.error('ChatGPT 이미지 생성 오류:', error);

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          throw new Error('OpenAI API 키가 유효하지 않습니다.');
        } else if (error.response?.status === 429) {
          throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.response?.status === 400) {
          const errorMessage = error.response.data?.error?.message || '잘못된 요청입니다.';
          throw new Error(`ChatGPT 이미지 생성 오류: ${errorMessage}`);
        }
      }

      throw new Error('ChatGPT 이미지 생성에 실패했습니다.');
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse> {
    throw new Error('ChatGPT는 현재 비디오 생성을 지원하지 않습니다.');
  }

  /**
   * 종횡비를 DALL-E 크기로 매핑
   */
  private mapAspectRatioToSize(aspectRatio: string): string {
    switch (aspectRatio) {
      case '16:9':
        return '1792x1024';
      case '9:16':
        return '1024x1792';
      case '1:1':
      default:
        return '1024x1024';
    }
  }

  /**
   * 사용 가능한 모델 목록 반환
   */
  getAvailableModels(): string[] {
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'dall-e-3',
      'dall-e-2'
    ];
  }

  /**
   * 텍스트 생성용 최적화된 프롬프트 템플릿
   */
  static getOptimizedPromptTemplate(type: 'story' | 'character' | 'scenario' | 'dialogue'): string {
    const templates = {
      story: `다음 요구사항에 따라 스토리를 생성해주세요:

요구사항:
{requirements}

스토리 구조:
- 명확한 시작, 중간, 끝
- 감정적 몰입도가 높은 서사
- 영상 제작에 적합한 시각적 요소

생성된 스토리:`,

      character: `다음 캐릭터 설명을 바탕으로 상세한 캐릭터 프로필을 생성해주세요:

기본 정보:
{characterInfo}

포함할 요소:
- 외모 특징 (영상 제작용)
- 성격 및 행동 패턴
- 의상 및 스타일
- 핵심 대사 및 말투

캐릭터 프로필:`,

      scenario: `다음 스토리를 바탕으로 영상 제작용 시나리오를 생성해주세요:

스토리:
{story}

시나리오 요구사항:
- 장면별 구성
- 구체적인 촬영 지시
- 대사 및 내레이션
- 시각적 연출 방향

시나리오:`,

      dialogue: `다음 상황에 맞는 자연스러운 대사를 생성해주세요:

상황:
{situation}

캐릭터:
{characters}

대사 요구사항:
- 캐릭터별 개성 반영
- 상황에 적합한 감정 표현
- 영상 제작에 적합한 길이

대사:`,
    };

    return templates[type];
  }

  /**
   * 이미지 생성용 최적화된 프롬프트 생성
   */
  static optimizeImagePrompt(description: string, imageType: 'character' | 'background' | 'scene'): string {
    const basePrompts = {
      character: 'Detailed character portrait, anime style, high quality, expressive features, ',
      background: 'Detailed background scene, cinematic lighting, high quality, atmospheric, ',
      scene: 'Detailed scene composition, cinematic style, high quality, dynamic lighting, '
    };

    const qualityModifiers = [
      'highly detailed',
      'professional quality',
      'sharp focus',
      'vibrant colors',
      'perfect composition'
    ];

    return `${basePrompts[imageType]}${description}, ${qualityModifiers.join(', ')}`;
  }
}