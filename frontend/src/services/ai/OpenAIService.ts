import { BaseAIService } from './BaseAIService';
import { TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';

/**
 * OpenAI 서비스 구현체
 */
export class OpenAIService extends BaseAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API 키가 필요합니다.');
    }
    this.isAvailableFlag = true;
  }

  async generateText(options: TextGenerationOptions): Promise<TextGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4',
          messages: [
            ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: options.prompt }
          ],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0]?.message?.content || '';

      return this.formatTextResponse(
        text,
        data.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gpt-4',
        data.choices[0]?.finish_reason || 'stop'
      );
    } catch (error) {
      this.handleError(error, '텍스트 생성');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'dall-e-3',
          prompt: options.prompt,
          n: options.numberOfImages || 1,
          size: this.getImageSize(options.aspectRatio),
          quality: options.quality || 'standard',
          style: options.style || 'natural',
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const images = data.data.map((item: any) => item.url);

      return this.formatImageResponse(
        images,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'dall-e-3'
      );
    } catch (error) {
      this.handleError(error, '이미지 생성');
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse> {
    try {
      // OpenAI는 현재 영상 생성 API를 제공하지 않음
      throw new Error('OpenAI는 현재 영상 생성 API를 지원하지 않습니다.');
    } catch (error) {
      this.handleError(error, '영상 생성');
    }
  }

  private getImageSize(aspectRatio: string): string {
    switch (aspectRatio) {
      case '1:1':
        return '1024x1024';
      case '16:9':
        return '1792x1024';
      case '9:16':
        return '1024x1792';
      default:
        return '1024x1024';
    }
  }
}
