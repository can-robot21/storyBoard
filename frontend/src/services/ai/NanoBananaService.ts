import { BaseAIService } from './BaseAIService';
import { TextGenerationOptions, ImageGenerationOptions, VideoGenerationOptions, TextGenerationResponse, ImageGenerationResponse, VideoGenerationResponse } from '../../types/ai';
import { GoogleGenAI } from '@google/genai';
import { translateKoreanToEnglish } from '../../utils/promptGenerator';
import { getSystemPrompt } from '../../utils/promptTemplates';
import { validateContentPolicy, getFormattedErrorMessage, checkAPIResponseForPolicyViolation } from '../../utils/contentPolicyValidator';

/**
 * 나노 바나나 서비스 구현체 (Google Gemini 2.5 Flash Image Preview)
 */
export class NanoBananaService extends BaseAIService {
  private ai: GoogleGenAI | null = null;

  // 한글을 영어로 번역하는 공통 함수 (비활성화 - JSON 최적화에서만 사용)
  private translateKoreanToEnglish(text: string): string {
    // 번역은 JSON 최적화에서만 수행하므로 원본 텍스트 반환
    return text;
  }

  constructor(config: { apiKey: string; baseUrl?: string }) {
    super(config);
    
    // API 키가 있을 때만 GoogleGenAI 인스턴스 생성
    if (config.apiKey && config.apiKey.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({
          apiKey: config.apiKey,
        });
      } catch (error) {
        console.warn('⚠️ Google AI 초기화 실패:', error);
        this.ai = null;
      }
    }
  }

  protected validateConfig(): void {
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      console.warn('⚠️ API 키가 설정되지 않았습니다.');
      this.isAvailableFlag = false;
      return;
    }

    // API 키 형식 검증 (Google AI API 키는 보통 39자)
    if (this.config.apiKey.length < 20) {
      console.warn('⚠️ API 키가 너무 짧습니다. (최소 20자 필요)');
      this.isAvailableFlag = false;
      return;
    }

    // Google AI API 키 형식 검증 (AIza로 시작하는지 확인)
    if (!this.config.apiKey.startsWith('AIza')) {
      console.warn('⚠️ Google AI API 키 형식이 올바르지 않습니다. (AIza로 시작해야 함)');
      this.isAvailableFlag = false;
      return;
    }
    
    // API 키 형식이 올바르면 사용 가능으로 설정
    // this.ai 초기화는 생성자에서 별도로 처리됨
    console.log('✅ NanoBanana 서비스 설정 검증 완료');
    this.isAvailableFlag = true;
  }

  async generateText(options: TextGenerationOptions): Promise<TextGenerationResponse> {
    if (!this.ai) {
      return this.formatTextResponse(
        '⚠️ Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gemini-2.5-flash',
        'stop'
      );
    }

    try {
      // 프롬프트 검증
      if (!options.prompt || options.prompt.trim().length === 0) {
        throw new Error('프롬프트가 비어있습니다.');
      }

      // Provider별 System Prompt 적용
      const systemInstruction = options.systemPrompt || getSystemPrompt('google', 'text');

      const response = await this.ai.models.generateContent({
        model: options.model || 'gemini-2.5-flash',
        contents: [{ parts: [{ text: options.prompt }] }],
        config: {
          systemInstruction
        }
      });

      // 응답 검증
      if (!response || !response.text) {
        throw new Error('AI 응답이 비어있습니다.');
      }

      const text = response.text;

      return this.formatTextResponse(
        text,
        { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        options.model || 'gemini-2.5-flash',
        'stop'
      );
    } catch (error) {
      console.error('NanoBanana 텍스트 생성 오류:', error);
      
      // 구체적인 에러 메시지 제공
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Google AI API 키가 유효하지 않습니다. API 키를 확인해주세요.');
        } else if (error.message.includes('quota')) {
          throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('safety')) {
          throw new Error('안전 정책에 위배되는 내용이 감지되었습니다. 프롬프트를 수정해주세요.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
        }
      }
      
      this.handleError(error, '텍스트 생성');
    }
  }

  /**
   * Imagen 3/4를 사용한 텍스트-이미지 생성
   */
  async generateImageWithImagen(options: ImageGenerationOptions & {
    numberOfImages?: number;
    imageSize?: string;
    personGeneration?: string;
    aspectRatio?: string;
  }): Promise<ImageGenerationResponse> {
    if (!this.ai) {
      throw new Error('Google AI 서비스가 초기화되지 않았습니다.');
    }

    try {
      console.log('🎨 Imagen 3/4 텍스트-이미지 생성 시작...');

      // Imagen 공식 API 형식에 맞는 config 구성
      // 기본 비율: 커스텀 사이즈가 없을 때만 기본값 16:9 사용
      const config: any = {
        numberOfImages: options.numberOfImages || 4,
        imageSize: options.imageSize || '1K',
        aspectRatio: options.aspectRatio || '16:9',
        personGeneration: options.personGeneration || 'allow_adult'
      };

      console.log('📝 Imagen 설정:', config);
      console.log('📝 프롬프트:', options.prompt);

      // 한글 텍스트 안전 처리
      const safePrompt = this.translateKoreanToEnglish(options.prompt);

      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: safePrompt,
        config: config,
      });

      const imageUrls: string[] = [];
      
      // 응답에서 이미지 추출
      for (const generatedImage of response.generatedImages || []) {
        if (generatedImage.image?.imageBytes) {
          const imageUrl = `data:image/png;base64,${generatedImage.image.imageBytes}`;
          imageUrls.push(imageUrl);
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('이미지가 생성되지 않았습니다. 프롬프트가 차단되었을 수 있습니다.');
      }

      console.log('✅ Imagen 생성 완료:', imageUrls.length, '개');

      return {
        images: imageUrls,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'imagen-4.0-generate-001',
      };
    } catch (error) {
      console.error('❌ Imagen 생성 실패:', error);
      // API 응답에서 정책 위반 확인
      const policyViolation = checkAPIResponseForPolicyViolation(error);
      if (policyViolation) {
        throw new Error(policyViolation.message);
      }
      const formattedMessage = getFormattedErrorMessage(error, options.prompt);
      throw new Error(formattedMessage);
    }
  }

  /**
   * Gemini 2.5 Flash Image를 사용한 텍스트-이미지 생성
   */
  async generateImageWithGemini25(options: ImageGenerationOptions & {
    responseModalities?: string;
    styleEnhancement?: string;
    aspectRatio?: string;
  }): Promise<ImageGenerationResponse> {
    if (!this.ai) {
      throw new Error('Google AI 서비스가 초기화되지 않았습니다.');
    }

    try {
      console.log('🎨 Gemini 2.5 Flash Image 텍스트-이미지 생성 시작...');

      // Gemini 2.5 Flash Image 공식 API 형식에 맞는 config 구성
      // 기본 비율: 커스텀 사이즈가 없을 때만 기본값 16:9 사용
      const config: any = {
        responseModalities: options.responseModalities === 'Text,Image' ? ['Text', 'Image'] : ['Image'],
        imageConfig: {
          aspectRatio: options.aspectRatio || '16:9'
        }
      };

      console.log('📝 Gemini 2.5 Flash Image 설정:', config);
      console.log('📝 프롬프트:', options.prompt);

      // 스타일 강화 프롬프트 적용 (한글을 영어로 변환)
      const safePrompt = this.translateKoreanToEnglish(options.prompt);
      
      let enhancedPrompt = safePrompt;
      if (options.styleEnhancement) {
        const styleEnhancements: { [key: string]: string } = {
          'photorealistic': 'Create a photorealistic image with detailed photography techniques, sharp focus, and natural lighting.',
          'illustration': 'Create an artistic illustration with clean lines and vibrant colors.',
          'sticker': 'Create a sticker-style image with bold outlines, simple cel-shading, and vibrant colors on a white background.',
          'logo': 'Create a modern, minimalist logo design with clean typography and simple geometric shapes.',
          'product': 'Create a professional product photograph with studio lighting and clean composition.',
          'minimalist': 'Create a minimalist composition with significant negative space and simple elements.',
          'comic': 'Create a comic book panel with high-contrast inks and dramatic composition.',
          'balanced': 'Create a well-balanced image with good composition and appealing visual elements.'
        };
        
        const enhancement = styleEnhancements[options.styleEnhancement];
        if (enhancement) {
          enhancedPrompt = `${enhancement}\n\n${safePrompt}`;
        }
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ text: enhancedPrompt }],
        config: config,
      });

      const imageUrls: string[] = [];
      
      // 응답에서 이미지 추출
      for (const candidate of response.candidates || []) {
        if (candidate.content) {
          for (const part of candidate.content.parts || []) {
            if (part.inlineData) {
              const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              imageUrls.push(imageUrl);
            }
          }
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('이미지가 생성되지 않았습니다. 프롬프트가 차단되었을 수 있습니다.');
      }

      console.log('✅ Gemini 2.5 Flash Image 생성 완료:', imageUrls.length, '개');

      return {
        images: imageUrls,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'gemini-2.5-flash-image',
      };
    } catch (error) {
      console.error('❌ Gemini 2.5 Flash Image 생성 실패:', error);
      // API 응답에서 정책 위반 확인
      const policyViolation = checkAPIResponseForPolicyViolation(error);
      if (policyViolation) {
        throw new Error(policyViolation.message);
      }
      const formattedMessage = getFormattedErrorMessage(error, options.prompt);
      throw new Error(formattedMessage);
    }
  }

  /**
   * Gemini 2.5 Flash Image를 사용한 이미지 편집 (img2img)
   */
  async editImageWithGemini25(options: ImageGenerationOptions & {
    editMode?: string;
    detailPreservation?: number;
    editIntensity?: number;
    cameraControl?: string;
    responseModalities?: string;
  }, referenceImages: File[]): Promise<ImageGenerationResponse> {
    if (!this.ai) {
      throw new Error('Google AI 서비스가 초기화되지 않았습니다.');
    }

    try {
      console.log('🎨 Gemini 2.5 Flash Image 이미지 편집 시작...');

      // 편집 모드별 프롬프트 구성 (한글을 영어로 변환)
      const safePrompt = this.translateKoreanToEnglish(options.prompt);
      
      let editPrompt = safePrompt;
      const editMode = options.editMode || 'modify';
      
      const editModePrompts: { [key: string]: string } = {
        'modify': 'Modify the provided image by adding or changing elements as requested.',
        'inpainting': 'Edit only the specific areas mentioned in the prompt, keeping the rest of the image unchanged.',
        'style_transfer': 'Transform the provided image into the requested artistic style while preserving the original composition.',
        'composition': 'Create a new composition using elements from the provided images.'
      };

      if (editModePrompts[editMode]) {
        editPrompt = `${editModePrompts[editMode]}\n\n${options.prompt}`;
      }

      // 세부정보 보존 강도 적용
      const detailPreservation = options.detailPreservation || 70;
      if (detailPreservation > 80) {
        editPrompt += '\n\nIMPORTANT: Preserve all original details, facial features, and important elements exactly as they are.';
      } else if (detailPreservation < 30) {
        editPrompt += '\n\nFeel free to make creative changes and artistic interpretations.';
      }

      // 편집 강도 적용
      const editIntensity = options.editIntensity || 50;
      if (editIntensity > 70) {
        editPrompt += '\n\nMake significant changes to the image.';
      } else if (editIntensity < 30) {
        editPrompt += '\n\nMake only subtle, minimal changes to the image.';
      }

      // 카메라 제어 적용
      const cameraControl = options.cameraControl || 'maintain';
      if (cameraControl !== 'maintain') {
        const cameraControls: { [key: string]: string } = {
          'wide_angle': 'Use a wide-angle perspective.',
          'macro': 'Use a macro, close-up perspective.',
          'low_angle': 'Use a low-angle perspective.',
          'high_angle': 'Use a high-angle perspective.',
          'close_up': 'Use a close-up perspective.'
        };
        
        if (cameraControls[cameraControl]) {
          editPrompt += `\n\n${cameraControls[cameraControl]}`;
        }
      }

      // Gemini 2.5 Flash Image 공식 API 형식에 맞는 config 구성
      // 기본 비율: 커스텀 사이즈가 없을 때만 기본값 16:9 사용
      const config: any = {
        responseModalities: options.responseModalities === 'Text,Image' ? ['Text', 'Image'] : ['Image'],
        imageConfig: {
          aspectRatio: options.aspectRatio || '16:9'
        }
      };

      console.log('📝 Gemini 2.5 Flash Image 편집 설정:', config);
      console.log('📝 편집 프롬프트:', editPrompt);

      // 참조 이미지들을 base64로 변환
      const imageParts = [];
      for (const imageFile of referenceImages) {
        const { base64, mimeType } = await this.fileToBase64(imageFile);
        imageParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64
          }
        });
      }

      // 텍스트와 이미지 조합
      const contents = [
        {
          role: 'user',
          parts: [
            { text: editPrompt },
            ...imageParts
          ]
        }
      ];

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: config,
      });

      const imageUrls: string[] = [];
      
      // 응답에서 이미지 추출
      for (const candidate of response.candidates || []) {
        if (candidate.content) {
          for (const part of candidate.content.parts || []) {
            if (part.inlineData) {
              const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              imageUrls.push(imageUrl);
            }
          }
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('이미지가 생성되지 않았습니다. 프롬프트가 차단되었을 수 있습니다.');
      }

      console.log('✅ Gemini 2.5 Flash Image 편집 완료:', imageUrls.length, '개');

      return {
        images: imageUrls,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: 'gemini-2.5-flash-image',
      };
    } catch (error) {
      console.error('❌ Gemini 2.5 Flash Image 편집 실패:', error);
      throw error;
    }
  }

  /**
   * 파일을 base64로 변환하는 헬퍼 메서드
   * Gemini API가 지원하지 않는 포맷은 Canvas를 통해 JPEG로 변환
   */
  private async fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [header, base64] = result.split(',');
        let mimeType = header.split(':')[1].split(';')[0];
        
        // Gemini API가 지원하지 않는 포맷들을 JPEG로 변환
        const unsupportedFormats = ['image/avif', 'image/webp', 'image/bmp', 'image/tiff'];
        if (unsupportedFormats.includes(mimeType)) {
          console.log(`⚠️ 지원되지 않는 포맷 감지: ${mimeType}, JPEG로 변환합니다.`);
          
          // Canvas를 사용하여 JPEG로 변환
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const jpegBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
              resolve({ base64: jpegBase64, mimeType: 'image/jpeg' });
            } else {
              reject(new Error('Canvas context를 생성할 수 없습니다.'));
            }
          };
          img.onerror = () => reject(new Error('이미지 로드 실패'));
          img.src = result;
        } else {
          resolve({ base64, mimeType });
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    if (!this.ai) {
      return {
        images: [],
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        model: options.model || 'gemini-2.5-flash-image-preview'
      };
    }

    // 콘텐츠 정책 검증 (금지 항목 확인)
    if (options.prompt) {
      const validation = validateContentPolicy(options.prompt);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
    }

    try {
      console.log('🍌 Nano Banana 이미지 생성 시작:', options.prompt);
      
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image-preview';
      
      // 이미지 생성 전용 프롬프트로 변환 (간단하고 명확한 형식)
      const safePrompt = this.translateKoreanToEnglish(options.prompt);
      
      // 기본 이미지 생성 프롬프트 (간단하고 명확하게)
      let imagePrompt = `Create a high-quality, detailed image of: ${safePrompt}`;
      
      // 비율 정보 추가 (더 명확한 지시)
      if (options.aspectRatio) {
        const ratioMap: { [key: string]: string } = {
          '1:1': 'square format (1:1 aspect ratio)',
          '16:9': 'wide landscape format (16:9 aspect ratio)',
          '9:16': 'portrait format (9:16 aspect ratio)'
        };
        const ratioDescription = ratioMap[options.aspectRatio] || options.aspectRatio;
        imagePrompt += `. Format: ${ratioDescription}`;
      }
      
      // 품질 정보 추가
      if (options.quality) {
        const qualityMap: { [key: string]: string } = {
          'high': 'ultra high quality',
          'standard': 'high quality',
          'ultra': 'maximum quality'
        };
        const qualityDescription = qualityMap[options.quality] || options.quality;
        imagePrompt += `. Quality: ${qualityDescription}`;
      }
      
      // 최종 프롬프트 정리
      imagePrompt += '. Generate a photorealistic image with sharp details and natural lighting.';
      
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
      console.log('📝 최종 프롬프트:', imagePrompt);
      
      // 먼저 일반 generateContent 시도 (더 안정적)
      let response;
      try {
        console.log('📡 일반 generateContent 시도...');
        const simpleResponse = await this.ai.models.generateContent({
          model,
          config,
          contents,
        });
        
        // 일반 응답을 스트림 형태로 변환
        response = {
          [Symbol.asyncIterator]: async function* () {
            yield simpleResponse;
          }
        };
      } catch (simpleError) {
        console.log('⚠️ 일반 방식 실패, 스트림 방식 시도...', simpleError);
        
        // 일반 방식이 실패하면 스트림 방식 사용
        response = await this.ai.models.generateContentStream({
          model,
          config,
          contents,
        });
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
          prompt: imagePrompt,
          originalPrompt: options.prompt,
          safePrompt: safePrompt
        });
        
        // 더 구체적인 에러 메시지
        if (chunkCount === 0) {
          throw new Error('API 응답을 받지 못했습니다. 네트워크 연결을 확인해주세요.');
        } else if (!hasImageData) {
          throw new Error('API가 텍스트만 반환했습니다. 이미지 생성 모드가 활성화되지 않았을 수 있습니다.');
        } else {
          throw new Error('이미지 데이터를 찾을 수 없습니다. API 응답 형식을 확인해주세요.');
        }
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
    if (!this.ai) {
      console.warn('⚠️ Google AI API 키가 설정되지 않았습니다.');
      return '⚠️ Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
    }

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
      const { base64: base64Image, mimeType } = await this.fileToBase64(referenceImage);
      
      // Gemini 2.5 Flash 모델로 이미지 분석 (텍스트만 반환)
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  mimeType: referenceImage.type,
                  data: base64Image
                }
              } as any
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
      
      // 구체적인 에러 메시지 제공
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Google AI API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.');
        } else if (error.message.includes('quota')) {
          throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('safety')) {
          throw new Error('이미지가 안전 정책에 위배됩니다. 다른 이미지로 시도해주세요.');
        } else if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
          throw new Error('Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('network')) {
          throw new Error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
        } else {
          throw new Error(`이미지 분석 중 오류가 발생했습니다: ${error.message}`);
        }
      }
      
      throw new Error('이미지 분석 중 알 수 없는 오류가 발생했습니다.');
    }
  }

  // 멀티모달 이미지 생성 (여러 이미지 + 텍스트)
  async generateImageWithMultipleReferences(
    textPrompt: string, 
    referenceImages: File[], 
    imageRoles: any[] = [],
    options?: {
      aspectRatio?: string;
      style?: string;
      quality?: string;
      customSize?: string;
      additionalPrompt?: string;
    }
  ): Promise<string> {
    if (!this.ai) {
      console.warn('⚠️ Google AI API 키가 설정되지 않았습니다.');
      return '';
    }

    try {
      console.log('🍌 나노 바나나 멀티 이미지 생성 시작:', { textPrompt, imageCount: referenceImages.length });
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      // 여러 이미지를 parts 배열에 추가 (한글을 영어로 변환)
      const safeTextPrompt = this.translateKoreanToEnglish(textPrompt);
      
      // 비율 정보 추가
      let aspectRatioInfo = '';
      if (options?.aspectRatio) {
        const ratioMap: { [key: string]: string } = {
          '1:1': 'square format (1:1 aspect ratio)',
          '16:9': 'wide landscape format (16:9 aspect ratio)',
          '9:16': 'portrait format (9:16 aspect ratio)',
          '4:3': 'landscape format (4:3 aspect ratio)',
          '3:4': 'portrait format (3:4 aspect ratio)'
        };
        const ratioDescription = ratioMap[options.aspectRatio] || options.aspectRatio;
        aspectRatioInfo = ` Format: ${ratioDescription}.`;
        console.log('📐 멀티 참조 이미지 생성 - 비율 적용:', options.aspectRatio);
      }
      
      const parts: any[] = [
        {
          text: `Based on these reference images, generate a new image with the following modifications: ${safeTextPrompt}.${aspectRatioInfo}
          
          Instructions:
          - Combine elements from all reference images
          - Maintain consistency in style and quality
          - Incorporate the requested changes while preserving the best features from each image
          - Create a cohesive final result that blends the reference images effectively`,
        }
      ];

      // 각 이미지를 parts에 추가
      for (const imageFile of referenceImages) {
        const { base64: imageData, mimeType } = await this.fileToBase64(imageFile);
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: imageData,
          },
        });
      }
      
      const contents = [
        {
          role: 'user',
          parts: parts,
        },
      ];

      console.log('🎨 멀티 이미지 생성 중...');
      const response = await this.ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let generatedImage = '';
      for await (const chunk of response) {
        if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
          continue;
        }
        
        if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          const inlineData = chunk.candidates[0].content.parts[0].inlineData;
          generatedImage = `data:${inlineData.mimeType};base64,${inlineData.data}`;
          console.log('✅ 나노 바나나 멀티 이미지 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 멀티 이미지 생성 실패, 첫 번째 이미지로 단일 생성 시도');
        return await this.generateImageWithReference(textPrompt, referenceImages[0], options?.customSize);
      }

      return generatedImage;
    } catch (error) {
      console.error('❌ 나노 바나나 멀티 이미지 생성 오류:', error);
      // 실패 시 첫 번째 이미지로 단일 생성 시도
      if (referenceImages.length > 0) {
        return await this.generateImageWithReference(textPrompt, referenceImages[0], options?.customSize);
      }
      return '';
    }
  }

  // 멀티모달 이미지 생성 (이미지 + 텍스트)
  async generateImageWithReference(
    textPrompt: string, 
    referenceImage: File, 
    customSize?: string
  ): Promise<string> {
    if (!this.ai) {
      console.warn('⚠️ Google AI API 키가 설정되지 않았습니다.');
      return '';
    }

    try {
      console.log('🍌 나노 바나나 멀티모달 이미지 생성 시작:', textPrompt);
      
      // 파일을 base64로 변환 (MIME 타입 포함)
      const { base64: base64Image, mimeType } = await this.fileToBase64(referenceImage);
      
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      // 안전한 텍스트 처리 (한글을 영어로 변환)
      const safeTextPrompt = this.translateKoreanToEnglish(textPrompt);
      
      const analysisPrompt = `You are a professional image analysis expert. Analyze this reference image and create a detailed prompt for AI image generation.

User's request: "${safeTextPrompt}"

Please analyze the image and create a comprehensive prompt that includes:
1. Main subject description (characters, objects, poses)
2. Composition and framing details
3. Lighting and atmosphere
4. Color palette and mood
5. Technical specifications (camera angle, lens type, depth of field)
6. Style and artistic approach

Focus on visual elements that will help recreate or improve upon the reference image. Be specific about:
- Character poses and expressions
- Background elements and setting
- Camera positioning and angle
- Lighting direction and intensity
- Color tones and saturation

Return ONLY the detailed prompt in English, no explanations or additional text.`;
      
      const analysisContents = [
        {
          role: 'user',
          parts: [
            {
              text: analysisPrompt,
            },
            {
              inlineData: {
                mimeType: mimeType,
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
        finalPrompt += `\n\nSize requirements: ${customSize}`;
      }
      
      // 최종 이미지 생성 (참조 이미지와 함께) - 한글을 영어로 변환
      const safeAnalyzedPrompt = this.translateKoreanToEnglish(analyzedPrompt);
      
      const imageGenerationPrompt = `Create a high-quality image based on this detailed analysis: ${safeAnalyzedPrompt}

Technical requirements:
- Professional photography quality
- High resolution and detail
- Proper lighting and composition
- Realistic and visually appealing
- Follow the camera angle and lens specifications from the analysis

Style: Professional, detailed, realistic photography`;
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: imageGenerationPrompt,
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
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
      let safetyBlocked = false;
      let finishReason: string | undefined;
      let safetyRatings: any[] = [];
      let textResponse = '';

      for await (const chunk of response) {
        chunkCount++;
        console.log(`📦 청크 ${chunkCount} 처리 중...`);
        
        // 안전 필터링 정보 확인
        if (chunk.candidates && chunk.candidates[0]) {
          const candidate = chunk.candidates[0];
          
          // finishReason 확인 (SAFETY는 안전 정책 위반)
          if (candidate.finishReason) {
            finishReason = candidate.finishReason;
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 finishReason:', finishReason);
            }
            
            if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
              safetyBlocked = true;
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ 안전 정책에 의해 응답이 차단되었습니다.');
              }
            }
          }
          
          // safetyRatings 확인
          if (candidate.safetyRatings && Array.isArray(candidate.safetyRatings)) {
            safetyRatings = candidate.safetyRatings;
            const blockedCategories = safetyRatings.filter(r => 
              r.category && (r.probability === 'HIGH' || r.probability === 'MEDIUM')
            );
            if (blockedCategories.length > 0) {
              safetyBlocked = true;
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ 안전 카테고리 차단:', blockedCategories.map(r => r.category).join(', '));
              }
            }
          }
        }
        
        if (!chunk.candidates || !chunk.candidates[0] || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
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
            textResponse += part.text;
            if (process.env.NODE_ENV === 'development') {
              console.log('📝 텍스트 응답:', part.text);
            }
          }
        }
      }

      console.log(`📊 처리 완료 - 이미지 개수: ${images.length}`);

      if (images.length === 0) {
        // 안전 정책 위반으로 차단된 경우
        if (safetyBlocked || finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          const blockedCategories = safetyRatings
            .filter((r: any) => r.category && (r.probability === 'HIGH' || r.probability === 'MEDIUM'))
            .map((r: any) => r.category)
            .join(', ');
          
          const errorMessage = blockedCategories
            ? `안전 정책에 의해 이미지 생성이 차단되었습니다.\n\n차단된 카테고리: ${blockedCategories}\n\n해결 방법:\n1. 프롬프트에서 성인적인 내용을 제거하거나 완화해주세요.\n2. 속옷, 노출 등의 직접적인 표현 대신 "엘레강트한 의상", "세련된 패션" 등의 표현을 사용해주세요.\n3. 사람 생성 옵션을 '성인만 허용' 또는 '모든 연령 허용'으로 설정해주세요.`
            : `안전 정책에 의해 이미지 생성이 차단되었습니다.\n\n해결 방법:\n1. 프롬프트에서 성인적인 내용을 제거하거나 완화해주세요.\n2. 속옷, 노출 등의 직접적인 표현 대신 "엘레강트한 의상", "세련된 패션" 등의 표현을 사용해주세요.\n3. 사람 생성 옵션을 '성인만 허용' 또는 '모든 연령 허용'으로 설정해주세요.`;
          
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ 안전 정책 위반:', {
              finishReason,
              safetyRatings,
              textResponse: textResponse || '없음'
            });
          }
          
          throw new Error(errorMessage);
        }
        
        // 텍스트 응답이 있는 경우 안전 필터링 메시지 확인
        if (textResponse && (textResponse.includes('safety') || textResponse.includes('blocked') || textResponse.includes('policy'))) {
          throw new Error(`안전 정책에 의해 이미지 생성이 차단되었습니다.\n\nAPI 응답: ${textResponse}\n\n해결 방법:\n1. 프롬프트에서 성인적인 내용을 제거하거나 완화해주세요.\n2. 속옷, 노출 등의 직접적인 표현 대신 더 중립적인 표현을 사용해주세요.`);
        }
        
        console.error('❌ 이미지 생성 실패 - 응답에서 이미지 데이터를 찾을 수 없습니다.');
        if (process.env.NODE_ENV === 'development') {
          console.error('응답 정보:', {
            finishReason,
            safetyRatings,
            textResponse: textResponse || '없음',
            chunkCount
          });
        }
        throw new Error('이미지 생성 결과가 없습니다. 프롬프트나 이미지가 안전 정책에 위배될 수 있습니다. 프롬프트를 수정해 다시 시도해주세요.');
      }

      console.log('🎉 멀티모달 이미지 생성 완료:', images[0].substring(0, 50) + '...');
      return images[0];
    } catch (error) {
      console.error('❌ 나노 바나나 멀티모달 이미지 생성 오류:', error);
      
      // 구체적인 에러 메시지 제공
      if (error instanceof Error) {
        if (error.message.includes('Unsupported MIME type')) {
          throw new Error('지원되지 않는 이미지 포맷입니다. JPEG, PNG, GIF 포맷을 사용해주세요.');
        } else if (error.message.includes('INVALID_ARGUMENT')) {
          throw new Error('잘못된 요청입니다. 이미지 파일을 확인해주세요.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
          throw new Error('API 키 권한이 없습니다. 설정을 확인해주세요.');
        }
      }
      
      throw new Error('이미지 생성에 실패했습니다. 네트워크 연결과 API 키를 확인해주세요.');
    }
  }

}

// NanoBananaService 인스턴스 생성 및 export - 사용자별 API 키 필요