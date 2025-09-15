import { BaseAIService } from './BaseAIService';
import { TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';
import { GoogleGenAI } from '@google/genai';

/**
 * 나노 바나나 서비스 구현체 (Google Gemini 2.5 Flash Image Preview)
 */
export class NanoBananaService extends BaseAIService {
  private ai: GoogleGenAI;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    super(config);
    this.ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Google AI API 키가 필요합니다.');
    }
    this.isAvailableFlag = true;
  }

  async generateText(options: TextGenerationOptions): Promise<TextGenerationResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: options.model || 'gemini-2.5-flash',
        contents: options.prompt,
        config: {
          systemInstruction: "당신은 창의적인 스토리텔러이자 영상 제작 전문가입니다. 주어진 요청에 따라 매력적이고 구체적인 콘텐츠를 생성해주세요."
        }
      });

      const text = response.text || '';

      return this.formatTextResponse(
        text,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gemini-2.5-flash',
        'stop'
      );
    } catch (error) {
      this.handleError(error, '텍스트 생성');
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      console.log('🍌 Nano Banana 이미지 생성 시작:', options.prompt);
      
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image-preview';
      
      // 이미지 생성 전용 프롬프트로 변환 (비율 정보 포함)
      let imagePrompt = `Create a detailed image: ${options.prompt}. Make it high quality, detailed, and visually appealing.`;
      
      // 비율 정보 추가 (더 명확한 지시)
      if (options.aspectRatio) {
        const ratioMap: { [key: string]: string } = {
          '1:1': 'perfect square format (1:1 aspect ratio) - equal width and height',
          '16:9': 'wide landscape format (16:9 aspect ratio) - much wider than tall',
          '9:16': 'portrait format (9:16 aspect ratio) - much taller than wide'
        };
        const ratioDescription = ratioMap[options.aspectRatio] || options.aspectRatio;
        imagePrompt += `\n\nIMPORTANT: Create the image in ${ratioDescription}. This is a critical requirement for the final output.`;
      }
      
      // 품질 정보 추가
      if (options.quality) {
        const qualityMap: { [key: string]: string } = {
          'high': 'ultra high quality',
          'standard': 'high quality',
          'ultra': 'maximum quality'
        };
        const qualityDescription = qualityMap[options.quality] || options.quality;
        imagePrompt += ` Generate in ${qualityDescription}.`;
      }
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: imagePrompt,
            },
          ],
        },
      ];

      console.log('🔄 API 호출 시작...');
      
      // 먼저 generateContentStream 시도
      let response;
      try {
        response = await this.ai.models.generateContentStream({
          model,
          config,
          contents,
        });
      } catch (streamError) {
        console.log('⚠️ 스트림 방식 실패, 일반 generateContent 시도...', streamError);
        
        // 스트림이 실패하면 일반 generateContent 사용
        const simpleResponse = await this.ai.models.generateContent({
          model,
          contents,
        });
        
        // 일반 응답을 스트림 형태로 변환
        response = {
          [Symbol.asyncIterator]: async function* () {
            yield simpleResponse;
          }
        };
      }

      console.log('📡 스트림 응답 처리 시작...');
      const images: string[] = [];
      let chunkCount = 0;
      let hasImageData = false;

      for await (const chunk of response) {
        chunkCount++;
        console.log(`📦 청크 ${chunkCount} 처리 중...`);
        
        if (!chunk.candidates || !chunk.candidates[0]?.content?.parts) {
          console.log('⚠️ 유효하지 않은 청크 건너뛰기');
          continue;
        }

        const parts = chunk.candidates[0].content.parts;
        
        for (const part of parts) {
          if (part.inlineData) {
            console.log('🖼️ 이미지 데이터 발견!');
            hasImageData = true;
            const inlineData = part.inlineData;
            const mimeType = inlineData.mimeType || 'image/jpeg';
            const base64Data = inlineData.data || '';
            
            if (base64Data) {
              // Base64 데이터를 data URL로 변환
              const imageUrl = `data:${mimeType};base64,${base64Data}`;
              images.push(imageUrl);
              console.log('✅ 이미지 추가됨:', imageUrl.substring(0, 50) + '...');
            }
          } else if (part.text) {
            console.log('📝 텍스트 응답:', part.text);
          }
        }
      }

      console.log(`📊 처리 완료 - 이미지 데이터 발견: ${hasImageData}, 이미지 개수: ${images.length}`);

      console.log(`🎉 이미지 생성 완료: ${images.length}개 이미지`);

      if (images.length === 0) {
        console.error('❌ 이미지 생성 실패 - 응답에서 이미지 데이터를 찾을 수 없습니다.');
        console.error('📊 디버그 정보:', {
          hasImageData,
          chunkCount,
          responseModalities: config.responseModalities,
          model,
          prompt: imagePrompt
        });
        throw new Error('이미지 생성 결과가 없습니다. API가 텍스트만 반환하고 있습니다.');
      }

      return this.formatImageResponse(
        images,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gemini-2.5-flash-image-preview'
      );
    } catch (error) {
      console.error('❌ Nano Banana 이미지 생성 오류:', error);
      this.handleError(error, '이미지 생성');
    }
  }

  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResponse> {
    try {
      // 나노 바나나는 영상 생성 API를 제공하지 않음
      throw new Error('나노 바나나는 현재 영상 생성 API를 지원하지 않습니다.');
    } catch (error) {
      this.handleError(error, '영상 생성');
    }
  }

  // 이미지 분석 전용 함수 (텍스트만 반환)
  async analyzeImage(referenceImage: File): Promise<string> {
    try {
      console.log('🔍 이미지 분석 시작...');
      
      const analysisPrompt = `Analyze this image in detail and provide a comprehensive description that includes:
      - Visual characteristics (colors, lighting, composition)
      - Style and mood
      - Technical details (perspective, framing)
      - Key elements that should be preserved in a similar image
      - Suggestions for improvement or enhancement
      
      Provide a detailed analysis that can be used as reference for creating a similar high-quality image.`;
      
      // 이미지를 base64로 변환
      const base64Image = await this.fileToBase64(referenceImage);
      
      // Gemini 2.5 Flash 모델로 이미지 분석 (텍스트만 반환)
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  mimeType: referenceImage.type,
                  data: base64Image
                }
              }
            ]
          }
        ]
      });
      
      // 응답 처리 개선
      let analysisResult = '분석 결과를 가져올 수 없습니다.';
      
      if (response && response.text) {
        analysisResult = response.text;
      } else if (response && response.candidates && response.candidates[0] && response.candidates[0].content) {
        const content = response.candidates[0].content;
        if (content.parts && content.parts[0] && content.parts[0].text) {
          analysisResult = content.parts[0].text;
        }
      }
      
      console.log('✅ 이미지 분석 완료 (텍스트):', analysisResult);
      console.log('📊 응답 구조:', {
        hasText: !!response.text,
        hasCandidates: !!response.candidates,
        responseKeys: Object.keys(response || {})
      });
      
      return analysisResult;
    } catch (error) {
      console.error('❌ 이미지 분석 오류:', error);
      throw new Error(`이미지 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  // 멀티모달 이미지 생성 (텍스트 + 이미지)
  async generateImageWithReference(
    textPrompt: string, 
    referenceImage: File, 
    customSize?: string
  ): Promise<string> {
    try {
      console.log('🍌 나노 바나나 멀티모달 이미지 생성 시작:', textPrompt);
      
      // 파일을 base64로 변환
      const base64Image = await this.fileToBase64(referenceImage);
      
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image-preview';
      
      // 1단계: 첨부 이미지 분석하여 상세 프롬프트 생성
      const analysisPrompt = `Analyze this reference image and create a detailed, professional image generation prompt. 
      
      User's request: "${textPrompt}"
      
      Please analyze the image and create a comprehensive prompt that includes:
      - Detailed visual description of the main subject
      - Lighting and mood
      - Composition and framing
      - Color palette and style
      - Technical details (resolution, quality)
      
      Make the prompt specific, detailed, and optimized for AI image generation. Focus on visual elements that will help create a high-quality image.
      
      Return ONLY the detailed prompt, no other text.`;
      
      const analysisContents = [
        {
          role: 'user',
          parts: [
            {
              text: analysisPrompt,
            },
            {
              inlineData: {
                mimeType: referenceImage.type,
                data: base64Image,
              },
            },
          ],
        },
      ];

      console.log('🔍 이미지 분석 중...');
      let analyzedPrompt = textPrompt; // 기본값으로 사용자 프롬프트 사용
      
      try {
        const analysisResponse = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: analysisContents,
        });
        
        // 응답 처리 개선
        if (analysisResponse && analysisResponse.text) {
          analyzedPrompt = analysisResponse.text.trim();
        } else if (analysisResponse && analysisResponse.candidates && analysisResponse.candidates[0] && analysisResponse.candidates[0].content) {
          const content = analysisResponse.candidates[0].content;
          if (content.parts && content.parts[0] && content.parts[0].text) {
            analyzedPrompt = content.parts[0].text.trim();
          }
        }
        
        console.log('✅ 이미지 분석 완료:', analyzedPrompt);
      } catch (analysisError) {
        console.log('⚠️ 이미지 분석 실패, 원본 프롬프트 사용:', analysisError);
      }
      
      // 2단계: 분석된 프롬프트로 최종 이미지 생성
      let finalPrompt = analyzedPrompt;
      if (customSize) {
        finalPrompt += `\n\n사이즈 요청사항: ${customSize}`;
      }
      
      // 최종 이미지 생성 프롬프트 (이미지 참조 없이 텍스트만으로 생성)
      const imageGenerationPrompt = `Create a high-quality, detailed image based on this analysis: ${finalPrompt}. 
      
      Requirements:
      - Professional quality
      - Detailed and realistic
      - High resolution
      - Visually appealing composition`;
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: imageGenerationPrompt,
            }
          ],
        },
      ];

      console.log('🔄 최종 이미지 생성 API 호출 시작...');
      console.log('📝 사용된 프롬프트:', imageGenerationPrompt);
      
      const response = await this.ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      const images: string[] = [];
      let chunkCount = 0;

      for await (const chunk of response) {
        chunkCount++;
        console.log(`📦 청크 ${chunkCount} 처리 중...`);
        
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          console.log('⚠️ 유효하지 않은 청크 건너뛰기');
          continue;
        }
        
        for (const part of chunk.candidates[0].content.parts) {
          if (part.inlineData) {
            console.log('🖼️ 이미지 데이터 발견!');
            const mimeType = part.inlineData.mimeType || 'image/jpeg';
            const base64Data = part.inlineData.data || '';
            
            const imageUrl = `data:${mimeType};base64,${base64Data}`;
            images.push(imageUrl);
            console.log('✅ 이미지 추가됨:', imageUrl.substring(0, 50) + '...');
          } else if (part.text) {
            console.log('📝 텍스트 응답:', part.text);
          }
        }
      }

      console.log(`📊 처리 완료 - 이미지 개수: ${images.length}`);

      if (images.length === 0) {
        console.error('❌ 이미지 생성 실패 - 응답에서 이미지 데이터를 찾을 수 없습니다.');
        throw new Error('이미지 생성 결과가 없습니다.');
      }

      console.log('🎉 멀티모달 이미지 생성 완료:', images[0].substring(0, 50) + '...');
      return images[0];
    } catch (error) {
      console.error('❌ 나노 바나나 멀티모달 이미지 생성 오류:', error);
      throw new Error('이미지 생성에 실패했습니다.');
    }
  }

  // 파일을 base64로 변환하는 유틸리티 함수
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, 부분을 제거하고 순수 base64만 반환
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
