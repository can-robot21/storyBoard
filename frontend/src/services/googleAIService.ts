import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type, PersonGeneration } from '@google/genai';
import TokenCalculator from '../utils/tokenCalculator';
import { validateContentPolicy } from '../utils/contentPolicyValidator';

// Google AI 서비스 클래스
export class GoogleAIService {
  private static instance: GoogleAIService | null = null;
  private ai: GoogleGenAI | null;
  private apiKeyInUse: string;
  private tokenCalculator: TokenCalculator;

  private constructor() {
    this.tokenCalculator = TokenCalculator.getInstance();
    const getCurrentUser = () => {
      try {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem('storyboard_current_user');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };
    const user = getCurrentUser();

    // API 키 로드 함수 (로그인 사용자 우선, localStorage 직접 확인 포함)
    const getLocalApiKey = (): string => {
      try {
        if (typeof window === 'undefined') return '';
        
        // 1순위: localStorage의 user_api_keys에서 직접 확인 (로그인 여부와 무관)
        const localKeysRaw = localStorage.getItem('user_api_keys');
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google && localKeys.google.trim() !== '' && localKeys.google !== 'your-gemini-api-key') {
            console.log('✅ localStorage에서 Google API 키 로드 성공');
            return localKeys.google as string;
          }
        }
        
        // 2순위: 로그인한 사용자의 API 키
        if (user?.apiKeys?.google && user.apiKeys.google.trim() !== '' && user.apiKeys.google !== 'your-gemini-api-key') {
          console.log('✅ 사용자 객체에서 Google API 키 로드 성공');
          return user.apiKeys.google as string;
        }
        
        return '';
      } catch (error) {
        console.error('❌ API 키 로드 중 오류:', error);
        return '';
      }
    };

    // API 키 로드 시도
    this.apiKeyInUse = getLocalApiKey();
    
    if (this.apiKeyInUse) {
      console.log('🔑 사용자 API 키 로딩: 설정됨', this.apiKeyInUse.substring(0, 10) + '...');
      this.ai = new GoogleGenAI({
        apiKey: this.apiKeyInUse
      });
    } else {
      // API 키가 없는 경우
      if (!user) {
        console.log('🔑 사용자 API 키 로딩: 미설정 (로그인하지 않음 또는 API 키 없음)');
      } else {
        console.log('🔑 사용자 API 키 로딩: 미설정 (API 키가 localStorage나 사용자 객체에 없음)');
      }
      this.apiKeyInUse = '';
      this.ai = null; // API 키 없이는 서비스 사용 불가
      return;
    }
  }

  // 싱글톤 인스턴스 가져오기
  static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
  }

  // 인스턴스 무효화 (로그아웃 시 호출)
  static invalidateInstance(): void {
    if (GoogleAIService.instance) {
      GoogleAIService.instance.ai = null;
      GoogleAIService.instance.apiKeyInUse = '';
      GoogleAIService.instance = null;
      console.log('🔑 GoogleAIService 인스턴스 무효화 완료');
    }
  }

  // 현재 인스턴스가 유효한지 확인
  isInitialized(): boolean {
    return this.ai !== null && this.apiKeyInUse !== '';
  }

  // 인스턴스 재초기화 (로그인 후 호출)
  static reinitializeInstance(): GoogleAIService {
    // 기존 인스턴스 무효화
    GoogleAIService.invalidateInstance();
    
    // 디버깅: API 키 상태 확인
    try {
      if (typeof window !== 'undefined') {
        const currentUserRaw = localStorage.getItem('storyboard_current_user');
        const localKeysRaw = localStorage.getItem('user_api_keys');
        
        console.log('🔄 API 키 재초기화 시도:', {
          hasCurrentUser: !!currentUserRaw,
          hasLocalKeys: !!localKeysRaw,
          localKeys: localKeysRaw ? JSON.parse(localKeysRaw) : null
        });
        
        if (localKeysRaw) {
          const localKeys = JSON.parse(localKeysRaw);
          if (localKeys?.google && localKeys.google.trim() !== '') {
            console.log('✅ localStorage에 Google API 키 존재:', localKeys.google.substring(0, 10) + '...');
          } else {
            console.warn('⚠️ localStorage에 Google API 키가 없음');
          }
        }
        
        if (currentUserRaw) {
          const currentUser = JSON.parse(currentUserRaw);
          if (currentUser?.apiKeys?.google && currentUser.apiKeys.google.trim() !== '') {
            console.log('✅ 사용자 객체에 Google API 키 존재:', currentUser.apiKeys.google.substring(0, 10) + '...');
          }
        }
      }
    } catch (error) {
      console.error('❌ API 키 상태 확인 중 오류:', error);
    }
    
    // 새 인스턴스 생성
    const instance = GoogleAIService.getInstance();
    
    // 재초기화 후 상태 확인
    if (!instance.isInitialized()) {
      console.warn('⚠️ 재초기화 후에도 API 키가 설정되지 않음');
    } else {
      console.log('✅ API 키 재초기화 완료 - 서비스 사용 가능');
    }
    
    return instance;
  }

  // 텍스트 생성 (프로젝트 개요용)
  async generateText(prompt: string, model: string = 'gemini-2.5-flash', retryCount: number = 0): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
    }
    
    const maxRetries = 3;
    const retryDelay = 2000; // 2초

    try {
      // API 키 검증
      if (!this.apiKeyInUse || this.apiKeyInUse === 'your-gemini-api-key') {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      }

      // 프롬프트 검증
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('프롬프트가 비어있습니다.');
      }

      const response = await this.ai!.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }], // 올바른 형식으로 수정
        config: {
          systemInstruction: "당신은 창의적인 스토리텔러이자 영상 제작 전문가입니다. 주어진 요청에 따라 매력적이고 구체적인 콘텐츠를 생성해주세요."
        }
      });

      // 응답 검증
      if (!response || !response.text) {
        throw new Error('AI 응답이 비어있습니다.');
      }

      // 토큰 사용량 기록
      this.tokenCalculator.recordAPICall(model, 'text', prompt, response.text);

      return response.text;
    } catch (error) {
      console.error('Google AI 텍스트 생성 오류:', error);
      
      // 503 서비스 불가 에러 처리 및 재시도
      if (error instanceof Error && error.message.includes('503') && retryCount < maxRetries) {
        console.log(`서비스 불가 에러 감지. ${retryDelay}ms 후 재시도 (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return this.generateText(prompt, model, retryCount + 1);
      }
      
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
        } else if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
          throw new Error('Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        }
      }
      
      throw new Error(`텍스트 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 스토리 프롬프트 생성
  async generateStoryPrompt(story: string, character: string, genre: string, targetAudience: string): Promise<string> {
    const prompt = `
다음 정보를 바탕으로 영상 제작용 스토리 프롬프트를 생성해주세요:

스토리: ${story}
캐릭터: ${character}
장르: ${genre}
타겟 오디언스: ${targetAudience}

다음 형식으로 생성해주세요:
- 주요 스토리: [핵심 스토리 라인]
- 캐릭터 설정: [주요 캐릭터 특징]
- 장면 구성: [주요 장면들]
- 시각적 요소: [영상으로 표현할 핵심 요소들]
- 감정적 톤: [전달하고자 하는 감정]
    `;

    return await this.generateText(prompt, 'gemini-2.5-flash');
  }

  // 캐릭터 프롬프트 생성
  async generateCharacterPrompt(character: string, style: string): Promise<string> {
    const prompt = `
다음 정보를 바탕으로 AI 이미지 생성용 캐릭터 프롬프트를 생성해주세요:

캐릭터 설명: ${character}
스타일: ${style}

다음 형식으로 생성해주세요:
- 외모: [상세한 외모 설명]
- 의상: [캐릭터의 의상과 스타일]
- 표정: [주요 표정과 감정]
- 포즈: [특징적인 자세나 동작]
- 배경: [캐릭터에 어울리는 배경]
- 조명: [적절한 조명과 분위기]
- 화질: [고품질, 상세한 디테일]
    `;

    return await this.generateText(prompt, 'gemini-2.5-flash');
  }

  // 시나리오 프롬프트 생성
  async generateScenarioPrompt(story: string, cutCount: number): Promise<string> {
    const prompt = `
다음 스토리를 ${cutCount}개의 컷으로 나누어 시나리오를 생성해주세요:

스토리: ${story}

다음 형식으로 각 컷별로 생성해주세요:
컷 1:
- 장면: [컷의 주요 장면]
- 캐릭터: [등장하는 캐릭터]
- 액션: [주요 액션이나 동작]
- 대사: [있을 경우 대사]
- 시각적 요소: [중요한 시각적 요소들]
- 카메라 앵글: [추천 카메라 각도]
- 지속시간: [예상 지속시간]

[컷 2부터 ${cutCount}까지 동일한 형식으로 반복]
    `;

    return await this.generateText(prompt, 'gemini-2.5-pro');
  }

  // 프롬프트 검증 및 강화 함수
  private validateAndEnhancePrompt(prompt: string, type: 'character' | 'background' | 'setting'): string {
    // 기본 검증
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('프롬프트가 비어있습니다.');
    }

    // 캐릭터 프롬프트 강화
    if (type === 'character') {
      return this.enhanceCharacterPrompt(prompt);
    }

    return prompt;
  }

  // 캐릭터 프롬프트 강화
  private enhanceCharacterPrompt(prompt: string): string {
    // 한국어 프롬프트를 영어로 변환하고 강화
    const enhancedPrompt = `Professional character portrait for video production:

CHARACTER DESCRIPTION:
${prompt}

CRITICAL REQUIREMENTS:
- MUST be a professional character portrait
- High quality, detailed facial features
- Clear character expression and personality
- Professional lighting and composition
- Suitable for video production use

TECHNICAL SPECIFICATIONS:
- High resolution and sharp details
- Professional photography style
- Clean background or appropriate setting
- Character should be the main focus
- Consistent with video production standards

STYLE GUIDELINES:
- Realistic and professional appearance
- Clear visual hierarchy
- Appropriate color palette
- Character should be visually distinct and memorable`;

    return enhancedPrompt;
  }

  // 이미지 생성 제한 및 검증
  private validateImageGeneration(prompt: string, type: 'character' | 'background' | 'setting', personGeneration?: string): void {
    // 프롬프트 길이 제한
    if (prompt.length > 1000) {
      throw new Error('프롬프트가 너무 깁니다. 1000자 이내로 작성해주세요.');
    }

    // 콘텐츠 정책 검증 (금지 항목 확인) - personGeneration 옵션 전달
    const validation = validateContentPolicy(prompt, personGeneration);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // 캐릭터 프롬프트 특별 검증
    if (type === 'character') {
      this.validateCharacterPrompt(prompt);
    }
  }

  // 캐릭터 프롬프트 검증
  private validateCharacterPrompt(prompt: string): void {
    const lowerPrompt = prompt.toLowerCase();
    
    // 필수 요소 검사
    const hasGender = lowerPrompt.includes('여성') || lowerPrompt.includes('남성') || 
                     lowerPrompt.includes('female') || lowerPrompt.includes('male') ||
                     lowerPrompt.includes('woman') || lowerPrompt.includes('man');
    
    if (!hasGender) {
      console.warn('⚠️ 캐릭터 프롬프트에 성별이 명시되지 않았습니다. 결과가 예상과 다를 수 있습니다.');
    }

    // 한국어 프롬프트 강화 제안
    if (lowerPrompt.includes('한국') || lowerPrompt.includes('korean')) {
      console.log('💡 한국 캐릭터 생성 시 더 정확한 결과를 위해 다음을 추가해보세요:');
      console.log('- "한국인 여성" 또는 "한국인 남성"');
      console.log('- "아시아인 특징"');
      console.log('- "한국 전통 의상" (해당하는 경우)');
    }
  }

  // 이미지 생성 (캐릭터용) - 여러 이미지 반환
  async generateMultipleCharacterImages(prompt: string, aspectRatio: string = '1:1', numberOfImages: number = 1, personGeneration?: string): Promise<string[]> {
    try {
      // 이미지 생성 제한 및 검증 (personGeneration 전달)
      this.validateImageGeneration(prompt, 'character', personGeneration);
      
      // 프롬프트 검증 및 강화
      const validatedPrompt = this.validateAndEnhancePrompt(prompt, 'character');
      
      // 스토리보드 연계를 위한 상세한 프롬프트 생성
      const detailedPrompt = `Create a detailed character image for video production:

${validatedPrompt}

Technical specifications:
- High quality, professional character design
- Suitable for video production and storyboarding
- Clear character features and expressions
- Appropriate lighting and composition
- Character should be visually distinct and memorable
- Consider camera angles and framing for video use

Style requirements:
- Realistic or stylized as appropriate for the character
- Consistent with video production standards
- Clear visual hierarchy and focal points
- Appropriate color palette for video integration`;

      // personGeneration 문자열을 PersonGeneration enum으로 변환
      let personGenerationEnum = PersonGeneration.ALLOW_ADULT; // 기본값
      if (personGeneration === 'allow_adult') {
        personGenerationEnum = PersonGeneration.ALLOW_ADULT;
      } else if (personGeneration === 'allow_all') {
        personGenerationEnum = PersonGeneration.ALLOW_ALL;
      } else if (personGeneration === 'dont_allow') {
        personGenerationEnum = PersonGeneration.DONT_ALLOW;
      }
      
      // personGeneration 옵션 적용 로깅 (개발 환경)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 캐릭터 생성 personGeneration 옵션 변환:', {
          입력값: personGeneration,
          변환된Enum값: personGenerationEnum,
          enum비교: {
            'allow_adult': PersonGeneration.ALLOW_ADULT,
            'allow_all': PersonGeneration.ALLOW_ALL,
            'dont_allow': PersonGeneration.DONT_ALLOW
          },
          최종적용: personGenerationEnum === PersonGeneration.ALLOW_ALL ? '✅ 모든 연령 허용' :
                   personGenerationEnum === PersonGeneration.ALLOW_ADULT ? '✅ 성인만 허용' :
                   personGenerationEnum === PersonGeneration.DONT_ALLOW ? '❌ 사람 생성 차단' : '❓ 알 수 없음'
        });
      }

      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: detailedPrompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: personGenerationEnum,
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K'
        }
      });

      // API 응답 상세 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        const httpResponse = response?.sdkHttpResponse as any;
        console.log('📊 Imagen API 응답:', {
          generatedImages: response?.generatedImages?.length || 0,
          sdkHttpResponse: httpResponse ? {
            status: httpResponse.status,
            statusText: httpResponse.statusText,
            headers: httpResponse.headers ? Object.fromEntries(
              Object.entries(httpResponse.headers).slice(0, 5)
            ) : null
          } : null,
          personGeneration,
          aspectRatio: aspectRatio || '16:9',
          numberOfImages,
          fullResponse: response
        });
        
        console.log('📊 Imagen API 응답 요약 (캐릭터):', {
          generatedImagesCount: response?.generatedImages?.length || 0,
          hasResponse: !!response,
          personGeneration,
          aspectRatio: aspectRatio || '16:9',
          numberOfImages
        });
        
        // 각 이미지의 안전 속성 정보 로깅
        if (response?.generatedImages && response.generatedImages.length > 0) {
          response.generatedImages.forEach((img: any, index: number) => {
            const safetyAttrs = img.safetyAttributes || img.image?.safetyAttributes;
            if (safetyAttrs) {
              console.log(`🛡️ 캐릭터 이미지 ${index + 1} 안전 속성:`, {
                blocked: safetyAttrs.blocked,
                categories: safetyAttrs.categories || safetyAttrs.harmCategories || 'N/A',
                scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores || 'N/A',
                personGeneration,
                fullSafetyAttributes: safetyAttrs
              });
            } else {
              console.log(`⚠️ 캐릭터 이미지 ${index + 1}: 안전 속성 정보 없음`);
              console.log(`📸 캐릭터 이미지 ${index + 1} 상세:`, {
                hasImage: !!img.image,
                hasImageBytes: !!img.image?.imageBytes,
                imageSize: img.image?.imageBytes ? `${(img.image.imageBytes.length / 1024).toFixed(2)}KB` : 'N/A',
                fullImageData: img
              });
            }
          });
        }
      }

      // 빈 응답 처리
      if (!response || !response.generatedImages || response.generatedImages.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('이미지 생성 API가 빈 응답을 반환했습니다.', {
            hasResponse: !!response,
            generatedImagesLength: response?.generatedImages?.length || 0,
            personGeneration,
            prompt: detailedPrompt.substring(0, 100)
          });
        }
        
        // personGeneration 옵션에 따른 에러 메시지 분기
        let errorMessage = '이미지 생성 결과가 없습니다. 프롬프트를 수정하거나 잠시 후 다시 시도해주세요.';
        
        if (personGeneration === 'allow_adult') {
          errorMessage = '이미지 생성 결과가 없습니다. AI 서비스의 안전 정책에 의해 이미지가 생성되지 않았을 수 있습니다.\n\n다음을 시도해보세요:\n• 프롬프트를 더 명확하고 구체적으로 작성\n• "사람 생성" 옵션에서 "모든 연령 허용" 선택\n• 프롬프트에서 미성년자 관련 표현 제거하고 "성인 여성", "성인 남성" 등으로 명시\n• 잠시 후 다시 시도';
        } else if (personGeneration === 'allow_all') {
          errorMessage = '이미지 생성 결과가 없습니다. "모든 연령 허용" 옵션을 사용했지만 AI 서비스의 안전 정책에 의해 이미지가 생성되지 않았을 수 있습니다.\n\n다음을 시도해보세요:\n• 프롬프트를 더 명확하고 구체적으로 작성\n• 프롬프트에서 미성년자 관련 표현을 명확한 성인 표현으로 변경 ("성인 여성", "성인 남성" 등)\n• 잠시 후 다시 시도\n• 다른 프롬프트로 시도';
        } else if (personGeneration === 'dont_allow') {
          errorMessage = '이미지 생성 결과가 없습니다. "사람 생성 차단" 옵션이 설정되어 있어 사람 이미지가 생성되지 않았을 수 있습니다.\n\n다음을 시도해보세요:\n• "사람 생성" 옵션을 "성인만 허용" 또는 "모든 연령 허용"으로 변경\n• 프롬프트를 사람이 아닌 객체/배경 중심으로 수정';
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('❌ 이미지 생성 실패:', {
            personGeneration,
            에러타입: personGeneration === 'allow_all' ? '모든 연령 허용 선택했지만 빈 응답' : 
                     personGeneration === 'allow_adult' ? '성인만 허용 선택했지만 빈 응답' : 
                     personGeneration === 'dont_allow' ? '사람 생성 차단 선택' : '알 수 없음',
            promptPreview: detailedPrompt.substring(0, 100)
          });
        }
        
        throw new Error(errorMessage);
      }

      // 모든 생성된 이미지와 메타데이터 반환
      const images: string[] = [];
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = [];
      const responseTimestamp = new Date().toISOString();
      
      for (const generatedImage of response.generatedImages) {
        const imageData = generatedImage as any;
        
        // 안전 속성 확인 및 로깅
        const safetyAttrs = imageData.safetyAttributes || imageData.image?.safetyAttributes;
        if (process.env.NODE_ENV === 'development') {
          if (safetyAttrs) {
            console.log(`🔍 캐릭터 이미지 ${images.length + 1} 안전 속성 상세:`, {
              blocked: safetyAttrs.blocked,
              categories: safetyAttrs.categories || safetyAttrs.harmCategories,
              scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores,
              personGeneration,
              imageIndex: images.length + 1,
              fullSafetyAttributes: safetyAttrs
            });
          } else {
            console.log(`⚠️ 캐릭터 이미지 ${images.length + 1}: 안전 속성 정보 없음`);
          }
        }
        
        // 메타데이터 생성
        const metadata: import('../types/project').ImageGenerationMetadata = {
          personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K',
          numberOfImages,
          apiResponse: {
            generatedCount: response.generatedImages.length,
            requestedCount: numberOfImages,
            timestamp: responseTimestamp
          },
          safetyAttributes: safetyAttrs ? {
            blocked: safetyAttrs.blocked || false,
            categories: safetyAttrs.categories || safetyAttrs.harmCategories,
            scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores
          } : undefined
        };
        metadataList.push(metadata);
        
        // 응답 구조 1: image.imageBytes
        if (imageData?.image?.imageBytes) {
          const base64ImageBytes = imageData.image.imageBytes;
          images.push(`data:image/jpeg;base64,${base64ImageBytes}`);
        }
        // 응답 구조 2: imageBytes 직접
        else if (imageData?.imageBytes) {
          const base64ImageBytes = imageData.imageBytes;
          images.push(`data:image/jpeg;base64,${base64ImageBytes}`);
        }
        // 응답 구조 3: base64Data
        else if (imageData?.base64Data) {
          images.push(`data:image/jpeg;base64,${imageData.base64Data}`);
        }
        // 응답 구조 4: data 직접
        else if (imageData?.data) {
          images.push(`data:image/jpeg;base64,${imageData.data}`);
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 캐릭터 이미지 ${images.length}개 생성 성공`, {
          personGeneration,
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K',
          numberOfImages: numberOfImages,
          metadataCount: metadataList.length
        });
      }
      
      // 메타데이터를 이미지 배열과 함께 저장 (임시로 함수에 저장)
      // 실제로는 반환 타입을 변경하거나 Map을 사용해야 하지만,
      // 기존 호환성을 위해 (images as any).__metadata로 저장
      (images as any).__metadata = metadataList;
      return images;
    } catch (error) {
      console.error('Google AI 이미지 생성 오류:', error);
      
      // 에러 메시지가 이미 상세한 경우 그대로 사용
      if (error instanceof Error) {
        throw error;
      }
      
      // 알 수 없는 에러의 경우 기본 메시지
      throw new Error('이미지 생성에 실패했습니다.');
    }
  }

  // 이미지 생성 (캐릭터용) - 단일 이미지 반환
  async generateCharacterImage(prompt: string, aspectRatio: string = '1:1', numberOfImages: number = 1): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
    }
    
    try {
      // 이미지 생성 제한 및 검증
      this.validateImageGeneration(prompt, 'character');
      
      // 프롬프트 검증 및 강화
      const validatedPrompt = this.validateAndEnhancePrompt(prompt, 'character');
      
      // 스토리보드 연계를 위한 상세한 프롬프트 생성
      const detailedPrompt = `Create a detailed character image for video production:

${validatedPrompt}

Technical specifications:
- High quality, professional character design
- Suitable for video production and storyboarding
- Clear character features and expressions
- Appropriate lighting and composition
- Character should be visually distinct and memorable
- Consider camera angles and framing for video use

Style requirements:
- Realistic or stylized as appropriate for the character
- Consistent with video production standards
- Clear visual hierarchy and focal points
- Appropriate color palette for video integration`;

      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: detailedPrompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: PersonGeneration.ALLOW_ALL,
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K'
        }
      });

      console.log('Imagen API 응답:', response); // 디버깅용

      // 빈 응답 처리
      if (!response || !response.generatedImages || response.generatedImages.length === 0) {
        console.warn('이미지 생성 API가 빈 응답을 반환했습니다. 프롬프트를 수정하거나 다른 모델을 시도해보세요.');
        throw new Error('이미지 생성 결과가 없습니다. 프롬프트를 수정하거나 잠시 후 다시 시도해주세요.');
      }

      // 여러 이미지 중 첫 번째 이미지 반환
      const firstImage = response.generatedImages[0] as any;
        
        // 응답 구조 1: image.imageBytes
        if (firstImage?.image?.imageBytes) {
          const base64ImageBytes = firstImage.image.imageBytes;
          console.log(`✅ 캐릭터 이미지 생성 성공 (${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        // 응답 구조 2: imageBytes 직접
        if (firstImage?.imageBytes) {
          const base64ImageBytes = firstImage.imageBytes;
          console.log(`✅ 캐릭터 이미지 생성 성공 (대체 구조, ${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        // 응답 구조 3: base64Data
        if (firstImage?.base64Data) {
          console.log(`✅ 캐릭터 이미지 생성 성공 (base64Data 구조, ${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.base64Data}`;
        }
        
        // 응답 구조 4: data 직접
        if (firstImage?.data) {
          console.log(`✅ 캐릭터 이미지 생성 성공 (data 구조, ${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.data}`;
        }
      
      // 응답 구조 5: response.data
      if ((response as any).data && (response as any).data.generatedImages) {
        const images = (response as any).data.generatedImages;
        if (images.length > 0) {
          const firstImage = images[0];
          if (firstImage?.image?.imageBytes) {
            return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
          }
        }
      }
      
      // 모든 구조에서 이미지를 찾지 못한 경우
      console.error('이미지 데이터를 찾을 수 없습니다. 응답 구조:', JSON.stringify(response, null, 2));
      throw new Error('이미지 데이터 형식을 인식할 수 없습니다. API 응답 구조가 변경되었을 수 있습니다.');
    } catch (error) {
      console.error('Google AI 이미지 생성 오류:', error);
      throw new Error('이미지 생성에 실패했습니다.');
    }
  }

  // 배경 이미지 생성 - 여러 이미지 반환
  async generateMultipleBackgroundImages(prompt: string, aspectRatio: string = '16:9', numberOfImages: number = 1, personGeneration?: string): Promise<string[]> {
    try {
      // personGeneration 문자열을 PersonGeneration enum으로 변환
      let personGenerationEnum = PersonGeneration.ALLOW_ADULT; // 기본값
      if (personGeneration === 'allow_adult') {
        personGenerationEnum = PersonGeneration.ALLOW_ADULT;
      } else if (personGeneration === 'allow_all') {
        personGenerationEnum = PersonGeneration.ALLOW_ALL;
      } else if (personGeneration === 'dont_allow') {
        personGenerationEnum = PersonGeneration.DONT_ALLOW;
      }

      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: personGenerationEnum,
          aspectRatio: aspectRatio,
          imageSize: '1K'
        }
      });

      // API 응답 상세 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Imagen API 응답 요약 (배경):', {
          generatedImagesCount: response?.generatedImages?.length || 0,
          hasResponse: !!response,
          personGeneration,
          aspectRatio,
          numberOfImages
        });
        
        if (response?.generatedImages && response.generatedImages.length > 0) {
          response.generatedImages.forEach((img: any, index: number) => {
            const safetyAttrs = img.safetyAttributes || img.image?.safetyAttributes;
            if (safetyAttrs) {
              console.log(`🛡️ 배경 이미지 ${index + 1} 안전 속성:`, {
                blocked: safetyAttrs.blocked,
                categories: safetyAttrs.categories || safetyAttrs.harmCategories || 'N/A',
                scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores || 'N/A',
                personGeneration,
                fullSafetyAttributes: safetyAttrs
              });
            }
          });
        }
      }

      // 빈 응답 처리
      if (!response || !response.generatedImages || response.generatedImages.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('이미지 생성 API가 빈 응답을 반환했습니다.', {
            hasResponse: !!response,
            generatedImagesLength: response?.generatedImages?.length || 0,
            personGeneration,
            prompt: prompt.substring(0, 100)
          });
        }
        
        const errorMessage = personGeneration === 'allow_adult' 
          ? '이미지 생성 결과가 없습니다. AI 서비스의 안전 정책에 의해 이미지가 생성되지 않았을 수 있습니다.\n\n다음을 시도해보세요:\n• 프롬프트를 더 명확하고 구체적으로 작성\n• "사람 생성" 옵션에서 "모든 연령 허용" 선택\n• 잠시 후 다시 시도'
          : '이미지 생성 결과가 없습니다. 프롬프트를 수정하거나 잠시 후 다시 시도해주세요.';
        
        throw new Error(errorMessage);
      }

      // 모든 생성된 이미지와 메타데이터 반환
      const images: string[] = [];
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = [];
      const responseTimestamp = new Date().toISOString();
      
      if (response.generatedImages && response.generatedImages.length > 0) {
        for (const generatedImage of response.generatedImages) {
          const imageData = generatedImage as any;
          
          // 안전 속성 확인 및 로깅
          const safetyAttrs = imageData.safetyAttributes || imageData.image?.safetyAttributes;
          if (process.env.NODE_ENV === 'development' && safetyAttrs) {
            console.log('🔍 배경 이미지 안전 속성 상세:', {
              blocked: safetyAttrs.blocked,
              categories: safetyAttrs.categories || safetyAttrs.harmCategories,
              scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores,
              personGeneration,
              imageIndex: images.length + 1
            });
          }
          
          // 메타데이터 생성
          const metadata: import('../types/project').ImageGenerationMetadata = {
            personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
            aspectRatio: aspectRatio || '16:9',
            imageSize: '1K',
            numberOfImages,
            apiResponse: {
              generatedCount: response.generatedImages.length,
              requestedCount: numberOfImages,
              timestamp: responseTimestamp
            },
            safetyAttributes: safetyAttrs ? {
              blocked: safetyAttrs.blocked || false,
              categories: safetyAttrs.categories || safetyAttrs.harmCategories,
              scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores
            } : undefined
          };
          metadataList.push(metadata);
          
          if (imageData?.image?.imageBytes) {
            images.push(`data:image/jpeg;base64,${imageData.image.imageBytes}`);
          } else if (imageData?.imageBytes) {
            images.push(`data:image/jpeg;base64,${imageData.imageBytes}`);
          } else if (imageData?.base64Data) {
            images.push(`data:image/jpeg;base64,${imageData.base64Data}`);
          } else if (imageData?.data) {
            images.push(`data:image/jpeg;base64,${imageData.data}`);
          }
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 배경 이미지 ${images.length}개 생성 성공`, {
          metadataCount: metadataList.length
        });
      }
      
      (images as any).__metadata = metadataList;
      return images;
    } catch (error) {
      console.error('Google AI 배경 이미지 생성 오류:', error);
      throw new Error('배경 이미지 생성에 실패했습니다.');
    }
  }

  // 배경 이미지 생성 - 단일 이미지 반환
  async generateBackgroundImage(prompt: string, aspectRatio: string = '16:9', numberOfImages: number = 1): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
    }
    
    try {
      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: PersonGeneration.ALLOW_ALL,
          aspectRatio: aspectRatio,
          imageSize: '1K'
        }
      });

      // 다양한 응답 구조 확인
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0] as any;
        
        if (firstImage?.image?.imageBytes) {
          console.log(`✅ 배경 이미지 생성 성공 (${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
        if (firstImage?.imageBytes) {
          console.log(`✅ 배경 이미지 생성 성공 (대체 구조, ${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.imageBytes}`;
        }
        if (firstImage?.base64Data) {
          return `data:image/jpeg;base64,${firstImage.base64Data}`;
        }
        if (firstImage?.data) {
          return `data:image/jpeg;base64,${firstImage.data}`;
        }
      }
      
      if ((response as any).data && (response as any).data.generatedImages) {
        const firstImage = (response as any).data.generatedImages[0];
        if (firstImage?.image?.imageBytes) {
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
      }
      
      throw new Error('배경 이미지 생성 결과가 없습니다.');
    } catch (error) {
      console.error('Google AI 배경 이미지 생성 오류:', error);
      throw new Error('배경 이미지 생성에 실패했습니다.');
    }
  }

  // 설정 컷 이미지 생성 - 여러 이미지 반환
  async generateMultipleSettingCutImages(prompt: string, aspectRatio: string = '16:9', numberOfImages: number = 1, personGeneration?: string): Promise<string[]> {
    try {
      // personGeneration 문자열을 PersonGeneration enum으로 변환
      let personGenerationEnum = PersonGeneration.ALLOW_ADULT; // 기본값
      if (personGeneration === 'allow_adult') {
        personGenerationEnum = PersonGeneration.ALLOW_ADULT;
      } else if (personGeneration === 'allow_all') {
        personGenerationEnum = PersonGeneration.ALLOW_ALL;
      } else if (personGeneration === 'dont_allow') {
        personGenerationEnum = PersonGeneration.DONT_ALLOW;
      }

      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: personGenerationEnum,
          aspectRatio: aspectRatio,
          imageSize: '1K'
        }
      });

      // API 응답 상세 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Imagen API 응답 요약 (설정 컷):', {
          generatedImagesCount: response?.generatedImages?.length || 0,
          hasResponse: !!response,
          personGeneration,
          aspectRatio,
          numberOfImages
        });
        
        if (response?.generatedImages && response.generatedImages.length > 0) {
          response.generatedImages.forEach((img: any, index: number) => {
            const safetyAttrs = img.safetyAttributes || img.image?.safetyAttributes;
            if (safetyAttrs) {
              console.log(`🛡️ 설정 컷 이미지 ${index + 1} 안전 속성:`, {
                blocked: safetyAttrs.blocked,
                categories: safetyAttrs.categories || safetyAttrs.harmCategories || 'N/A',
                scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores || 'N/A',
                personGeneration,
                fullSafetyAttributes: safetyAttrs
              });
            }
          });
        }
      }

      // 빈 응답 처리
      if (!response || !response.generatedImages || response.generatedImages.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('이미지 생성 API가 빈 응답을 반환했습니다.', {
            hasResponse: !!response,
            generatedImagesLength: response?.generatedImages?.length || 0,
            personGeneration,
            prompt: prompt.substring(0, 100)
          });
        }
        
        const errorMessage = personGeneration === 'allow_adult' 
          ? '이미지 생성 결과가 없습니다. AI 서비스의 안전 정책에 의해 이미지가 생성되지 않았을 수 있습니다.\n\n다음을 시도해보세요:\n• 프롬프트를 더 명확하고 구체적으로 작성\n• "사람 생성" 옵션에서 "모든 연령 허용" 선택\n• 잠시 후 다시 시도'
          : '이미지 생성 결과가 없습니다. 프롬프트를 수정하거나 잠시 후 다시 시도해주세요.';
        
        throw new Error(errorMessage);
      }

      // 모든 생성된 이미지와 메타데이터 반환
      const images: string[] = [];
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = [];
      const responseTimestamp = new Date().toISOString();
      
      if (response.generatedImages && response.generatedImages.length > 0) {
        for (const generatedImage of response.generatedImages) {
          const imageData = generatedImage as any;
          
          // 안전 속성 확인 및 로깅
          const safetyAttrs = imageData.safetyAttributes || imageData.image?.safetyAttributes;
          if (process.env.NODE_ENV === 'development' && safetyAttrs) {
            console.log('🔍 설정 컷 이미지 안전 속성 상세:', {
              blocked: safetyAttrs.blocked,
              categories: safetyAttrs.categories || safetyAttrs.harmCategories,
              scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores,
              personGeneration,
              imageIndex: images.length + 1
            });
          }
          
          // 메타데이터 생성
          const metadata: import('../types/project').ImageGenerationMetadata = {
            personGeneration: personGeneration as 'allow_adult' | 'allow_all' | 'dont_allow' | undefined,
            aspectRatio: aspectRatio || '16:9',
            imageSize: '1K',
            numberOfImages,
            apiResponse: {
              generatedCount: response.generatedImages.length,
              requestedCount: numberOfImages,
              timestamp: responseTimestamp
            },
            safetyAttributes: safetyAttrs ? {
              blocked: safetyAttrs.blocked || false,
              categories: safetyAttrs.categories || safetyAttrs.harmCategories,
              scores: safetyAttrs.scores || safetyAttrs.harmProbabilityScores
            } : undefined
          };
          metadataList.push(metadata);
          
          if (imageData?.image?.imageBytes) {
            images.push(`data:image/jpeg;base64,${imageData.image.imageBytes}`);
          } else if (imageData?.imageBytes) {
            images.push(`data:image/jpeg;base64,${imageData.imageBytes}`);
          } else if (imageData?.base64Data) {
            images.push(`data:image/jpeg;base64,${imageData.base64Data}`);
          } else if (imageData?.data) {
            images.push(`data:image/jpeg;base64,${imageData.data}`);
          }
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ 설정 컷 이미지 ${images.length}개 생성 성공`, {
          metadataCount: metadataList.length
        });
      }
      
      (images as any).__metadata = metadataList;
      return images;
    } catch (error) {
      console.error('Google AI 설정 컷 이미지 생성 오류:', error);
      throw new Error('설정 컷 이미지 생성에 실패했습니다.');
    }
  }

  // 설정 컷 이미지 생성 - 단일 이미지 반환
  async generateSettingCutImage(prompt: string, aspectRatio: string = '16:9', numberOfImages: number = 1): Promise<string> {
    try {
      const response = await this.ai!.models.generateImages({
        model: 'models/imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          personGeneration: PersonGeneration.ALLOW_ALL,
          aspectRatio: aspectRatio,
          imageSize: '1K'
        }
      });

      // 다양한 응답 구조 확인
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0] as any;
        
        if (firstImage?.image?.imageBytes) {
          console.log(`✅ 설정 컷 이미지 생성 성공 (${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
        if (firstImage?.imageBytes) {
          console.log(`✅ 설정 컷 이미지 생성 성공 (대체 구조, ${numberOfImages}개 중 1개 반환)`);
          return `data:image/jpeg;base64,${firstImage.imageBytes}`;
        }
        if (firstImage?.base64Data) {
          return `data:image/jpeg;base64,${firstImage.base64Data}`;
        }
        if (firstImage?.data) {
          return `data:image/jpeg;base64,${firstImage.data}`;
        }
      }
      
      if ((response as any).data && (response as any).data.generatedImages) {
        const firstImage = (response as any).data.generatedImages[0];
        if (firstImage?.image?.imageBytes) {
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
      }
      
      throw new Error('설정 컷 이미지 생성 결과가 없습니다.');
    } catch (error) {
      console.error('Google AI 설정 컷 이미지 생성 오류:', error);
      throw new Error('설정 컷 이미지 생성에 실패했습니다.');
    }
  }

  // 비디오 생성 - Veo 3.0/3.1 API 사용
  async generateVideo(options: {
    prompt: string;
    ratio?: string;
    model?: string;
    duration?: string;
    referenceImages?: string[];
    lastFrame?: string;
    negativePrompt?: string;
    abortSignal?: AbortSignal;
  }): Promise<{ videoUrl: string; thumbnail?: string; duration?: string }> {
    if (!this.isInitialized()) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
    }
    
    try {
      console.log('🎬 Veo API를 사용하여 실제 영상을 생성합니다.');
      console.log('📝 프롬프트:', options.prompt.substring(0, 100) + '...');
      console.log('🖼️ 참조 이미지 개수:', options.referenceImages?.length || 0);
      console.log('⚙️ 모델:', options.model || 'veo-3.1-generate-preview');
      console.log('📐 비율:', options.ratio || '16:9');
      
      // API 키 확인
      if (!this.apiKeyInUse || this.apiKeyInUse === 'your-gemini-api-key') {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
      }

      // Veo API에 최적화된 프롬프트 생성
      const hasReferenceImage = !!(options.referenceImages && options.referenceImages.length > 0);
      const duration = parseInt(options.duration || '8');
      const veoOptimizedPrompt = await this.createVeoOptimizedPrompt(options.prompt, options.ratio || '16:9', hasReferenceImage, duration);
      
      console.log('✨ 최적화된 프롬프트:', veoOptimizedPrompt.substring(0, 200) + '...');
      
      // Veo API 호출 설정
      const requestedDuration = parseInt(options.duration || '8');
      const veoDuration = Math.min(Math.max(requestedDuration, 4), 8); // 4-8초 범위로 제한
      
      const videoConfig: any = {
        numberOfVideos: 1,
        aspectRatio: options.ratio || '16:9',
        durationSeconds: veoDuration,
        personGeneration: PersonGeneration.ALLOW_ALL,
      };

      // 부정 프롬프트 추가 (Veo 3.1 지원)
      if (options.negativePrompt) {
        videoConfig.negativePrompt = options.negativePrompt;
        console.log('🚫 부정 프롬프트 추가:', options.negativePrompt.substring(0, 100) + '...');
      }

      // 참조 이미지 처리
      if (options.referenceImages && options.referenceImages.length > 0) {
        console.log('🖼️ 참조 이미지 처리 중...');
        
        // Veo 3.1은 최대 3개의 참조 이미지 지원
        const maxReferenceImages = options.model?.includes('3.1') ? 3 : 1;
        const imagesToUse = options.referenceImages.slice(0, maxReferenceImages);
        
        if (imagesToUse.length === 1) {
          // 단일 이미지 (이미지-영상 변환)
          const referenceImage = imagesToUse[0];
          
          if (referenceImage.startsWith('data:')) {
            const [header, data] = referenceImage.split(',');
            const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
            
            videoConfig.image = {
              imageBytes: data,
              mimeType: mimeType,
            };
            
            console.log('✅ 참조 이미지가 Veo API에 추가되었습니다:', mimeType);
          }
        } else if (imagesToUse.length > 1 && options.model?.includes('3.1')) {
          // 다중 참조 이미지 (Veo 3.1만 지원)
          videoConfig.referenceImages = imagesToUse.map(img => {
            if (img.startsWith('data:')) {
              const [header, data] = img.split(',');
              const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
              
              return {
                image: {
                  imageBytes: data,
                  mimeType: mimeType,
                },
                referenceType: 'asset'
              };
            }
            return null;
          }).filter(Boolean);
          
          console.log('✅ 다중 참조 이미지가 Veo 3.1 API에 추가되었습니다:', imagesToUse.length);
        }
      }

      // 프레임 보간 (Veo 3.1만 지원)
      if (options.lastFrame && options.model?.includes('3.1')) {
        console.log('🎞️ 프레임 보간 설정 중...');
        
        if (options.lastFrame.startsWith('data:')) {
          const [header, data] = options.lastFrame.split(',');
          const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          
          videoConfig.lastFrame = {
            imageBytes: data,
            mimeType: mimeType,
          };
          
          console.log('✅ 마지막 프레임이 Veo 3.1 API에 추가되었습니다:', mimeType);
        }
      }

      // Veo API 호출
      console.log('🚀 Veo API 호출 시작...');
      let operation = await this.ai!.models.generateVideos({
        model: options.model || 'veo-3.1-generate-preview',
        prompt: veoOptimizedPrompt,
        config: videoConfig,
      });

      console.log(`🎬 Video generation started: ${operation.name}`);
      console.log(`⚙️ Using model: ${options.model || 'veo-3.1-generate-preview'}`);

      // 비디오 생성 완료까지 대기 (최대 5분)
      let attempts = 0;
      const maxAttempts = 30; // 5분 (30 * 10초)
      
      while (!operation.done && attempts < maxAttempts) {
        attempts++;
        console.log(`⏳ Video ${operation.name} is still generating... (${attempts}/${maxAttempts})`);
        
        // 취소 신호 확인
        if (options.abortSignal?.aborted) {
          console.log('❌ 영상 생성이 취소되었습니다.');
          throw new Error('영상 생성이 취소되었습니다.');
        }
        
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초마다 체크
        
        try {
          operation = await this.ai!.operations.getVideosOperation({
            operation: operation,
          });
        } catch (pollError) {
          console.error('❌ 폴링 중 오류:', pollError);
          throw new Error(`영상 생성 상태 확인 중 오류가 발생했습니다: ${pollError instanceof Error ? pollError.message : '알 수 없는 오류'}`);
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('영상 생성 시간이 초과되었습니다. 다시 시도해주세요.');
      }

      console.log(`✅ Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

      if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
        const generatedVideo = operation.response.generatedVideos[0];
        const videoUri = generatedVideo?.video?.uri;
        
        if (videoUri) {
          // 토큰 사용량 기록 (영상 생성은 별도 비용이므로 프롬프트 토큰만 기록)
          this.tokenCalculator.recordAPICall(
            options.model || 'veo-3.0-generate-001', 
            'video', 
            veoOptimizedPrompt
          );

          // API 키를 URI에 추가하여 반환
          const finalVideoUrl = `${videoUri}&key=${this.apiKeyInUse}`;
          console.log('🎉 영상 생성 완료!');
          console.log('🔗 영상 URL:', finalVideoUrl);
          
          return {
            videoUrl: finalVideoUrl,
            thumbnail: (generatedVideo as any).thumbnail?.uri || '',
            duration: '8:00' // 기본값
          };
        }
      }
      
      throw new Error('비디오 생성 결과가 없습니다.');
      
    } catch (error) {
      console.error('❌ Google AI 비디오 생성 오류:', error);
      
      // Veo API 파라미터 오류인 경우 구체적인 메시지 제공
      if (error instanceof Error && error.message.includes('parameter is not supported')) {
        console.error('❌ Veo API에서 지원되지 않는 파라미터가 사용되었습니다:', error.message);
        throw new Error('Veo API에서 지원되지 않는 설정이 사용되었습니다. 설정을 확인해주세요.');
      }
      
      // 모델을 찾을 수 없는 경우
      if (error instanceof Error && error.message.includes('not found')) {
        console.error('❌ Veo API 모델을 찾을 수 없습니다. 사용 가능한 모델을 확인해주세요.');
        console.error('사용된 모델:', options.model || 'veo-3.0-generate-001');
        throw new Error('Veo API 모델을 찾을 수 없습니다. 다른 모델을 시도해주세요.');
      }
      
      // API 키 관련 오류
      if (error instanceof Error && (error.message.includes('API key') || error.message.includes('authentication'))) {
        console.error('❌ API 키 인증 오류:', error.message);
        throw new Error('Google AI API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.');
      }
      
      // 권한 관련 오류
      if (error instanceof Error && error.message.includes('permission')) {
        console.error('❌ Veo API 권한 오류:', error.message);
        throw new Error('Veo API 사용 권한이 없습니다. Google AI Studio에서 Veo API를 활성화해주세요.');
      }
      
      // 일반적인 오류 처리
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('❌ 영상 생성 실패:', errorMessage);
      throw new Error(`영상 생성에 실패했습니다: ${errorMessage}`);
    }
  }

  // Veo API 최적화 프롬프트 생성
  private async createVeoOptimizedPrompt(originalPrompt: string, videoRatio: string, hasReferenceImage: boolean = false, duration: number = 8): Promise<string> {
    const imageContext = hasReferenceImage 
      ? "\n\n참조 이미지가 제공되었으므로, 이미지의 스타일, 색감, 구도를 영상에 반영하도록 프롬프트를 구성해주세요."
      : "";

    const durationContext = duration > 6 
      ? `\n\n영상 길이가 ${duration}초이므로, 더 풍부한 내용과 장면 전환을 포함하여 구성해주세요.`
      : duration < 6 
      ? `\n\n영상 길이가 ${duration}초이므로, 핵심 내용만 간결하게 구성해주세요.`
      : "";

    const optimizationPrompt = `다음 프롬프트를 Veo API에 최적화된 영상 생성 프롬프트로 변환해주세요:

원본 프롬프트: ${originalPrompt}
영상 비율: ${videoRatio}
영상 길이: ${duration}초${imageContext}${durationContext}

Veo API 최적화 요구사항:
1. ${duration}초 길이의 영상에 적합한 내용으로 조정
2. 카메라 워크와 액션을 구체적으로 설명 (pan, zoom, tilt, tracking 등)
3. 조명과 색감을 명확히 지정 (warm, cool, dramatic, soft 등)
4. 영상의 흐름과 전환이 자연스럽도록 구성
5. Veo API가 이해하기 쉬운 명확한 영어로 작성
6. 구체적인 장면 묘사와 시각적 요소 강조
7. 영상의 시작과 끝 부분이 명확히 구분되도록 구성
8. 참조 이미지가 있다면 그 스타일과 분위기를 영상에 반영
9. 영상의 시작과 끝에 자연스러운 페이드 인/아웃 효과 고려
10. 편집을 위한 여유 시간을 고려하여 내용을 구성

최적화된 프롬프트만 반환해주세요 (추가 설명 없이):`;

    return await this.generateText(optimizationPrompt);
  }

  // Veo API 실패 시 스토리보드 폴백
  private async generateStoryboardFallback(prompt: string, videoRatio: string): Promise<{ videoUrl: string; thumbnail?: string; duration?: string }> {
    const storyboardPrompt = `다음 프롬프트를 바탕으로 상세한 영상 스토리보드를 생성해주세요:

프롬프트: ${prompt}
영상 비율: ${videoRatio}

🎬 영상 스토리보드

📝 장면 1: [장면 제목]
- 시간: 0-3초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

📝 장면 2: [장면 제목]
- 시간: 3-6초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

📝 장면 3: [장면 제목]
- 시간: 6-8초
- 카메라: [카메라 앵글 및 워크]
- 조명: [조명 설정]
- 색감: [색상 팔레트]
- 액션: [주요 액션 및 움직임]
- 음향: [배경음악 및 효과음]

🎨 전체 영상 스타일:
- 톤앤매너: [드라마틱/코미디/로맨틱 등]
- 편집 스타일: [빠른 컷/긴 숏 등]
- 색상 그레이딩: [따뜻한/차가운/모노톤 등]

💡 제작 노트:
- [특별한 주의사항이나 제작 팁]
- [필요한 소품이나 세트]
- [특수 효과 요구사항]`;

    const storyboard = await this.generateText(storyboardPrompt);
    
    // 스토리보드 데이터를 JSON으로 구성
    const storyboardData = {
      type: 'storyboard',
      prompt: prompt,
      videoRatio: videoRatio,
      storyboard: storyboard,
      timestamp: new Date().toISOString(),
      note: 'Veo API 실패로 인해 스토리보드를 생성했습니다.'
    };
    
    // Base64로 인코딩하여 반환 (한글 안전 처리)
    const jsonString = JSON.stringify(storyboardData);
    const base64String = this.safeBase64Encode(jsonString);
    
    return {
      videoUrl: `data:application/json;base64,${base64String}`,
      thumbnail: '',
      duration: '8:00'
    };
  }

  // 안전한 Base64 인코딩 (한글 지원)
  private safeBase64Encode(str: string): string {
    try {
      // UTF-8로 인코딩 후 Base64로 변환
      const utf8Bytes = new TextEncoder().encode(str);
      const base64String = btoa(String.fromCharCode(...utf8Bytes));
      return base64String;
    } catch (error) {
      console.error('Base64 인코딩 오류:', error);
      // 폴백: 한글을 제거하고 인코딩
      const asciiString = str.replace(/[^\u0000-\u007F]/g, '?');
      return btoa(asciiString);
    }
  }

  // 안전한 비디오 프롬프트 생성 (사람이 포함되지 않은 콘텐츠로 제한)
  private createSafeVideoPrompt(originalPrompt: string): string {
    // 사람이 포함되지 않은 안전한 콘텐츠로 프롬프트 수정
    const safePrompt = `${originalPrompt}

안전 가이드라인:
- 사람이나 얼굴이 포함되지 않은 콘텐츠로 제한
- 자연, 풍경, 건물, 물체, 애니메이션 캐릭터 중심
- 고품질, 시네마틱한 영상 스타일
- 부드러운 카메라 움직임과 전환`;

    return safePrompt;
  }

  // 멀티모달 입력 처리 (이미지 + 텍스트) - 캐릭터 이미지 생성용
  async generateWithImage(imageFile: File, textPrompt: string, aspectRatio: string = '1:1'): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
    }
    
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      console.log('🖼️ img2img 캐릭터 이미지 생성 시작:', textPrompt);
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Based on this reference image, generate a new character image with the following modifications: ${textPrompt}. 
              
              Maintain the overall style and composition of the reference image while incorporating the requested changes.`,
            },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageData,
              },
            },
          ],
        },
      ];

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ img2img 이미지 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 이미지 생성 실패, 텍스트만으로 생성 시도');
        return await this.generateCharacterImage(textPrompt);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티모달 생성 오류:', error);
      // 실패 시 텍스트만으로 이미지 생성
      return await this.generateCharacterImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (여러 이미지 + 텍스트) - 캐릭터 이미지 생성용
  async generateWithMultipleImages(imageFiles: File[], textPrompt: string, aspectRatio: string = '1:1'): Promise<string> {
    try {
      console.log('🖼️ 멀티 이미지 캐릭터 생성 시작:', { textPrompt, imageCount: imageFiles.length });
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      // 여러 이미지를 parts 배열에 추가
      const parts: any[] = [
        {
          text: `Based on these reference images, generate a new character image with the following modifications: ${textPrompt}. 
          
          Instructions:
          - Combine elements from all reference images
          - Maintain consistency in style and quality
          - Incorporate the requested changes while preserving the best features from each image
          - Create a cohesive final result that blends the reference images effectively`,
        }
      ];

      // 각 이미지를 parts에 추가
      for (const imageFile of imageFiles) {
        const imageData = await this.fileToBase64(imageFile);
        parts.push({
          inlineData: {
            mimeType: imageFile.type,
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

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ 멀티 이미지 캐릭터 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 멀티 이미지 생성 실패, 첫 번째 이미지로 단일 생성 시도');
        return await this.generateWithImage(imageFiles[0], textPrompt, aspectRatio);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티 이미지 생성 오류:', error);
      // 실패 시 첫 번째 이미지로 단일 생성 시도
      if (imageFiles.length > 0) {
        return await this.generateWithImage(imageFiles[0], textPrompt, aspectRatio);
      }
      // 모든 실패 시 텍스트만으로 생성
      return await this.generateCharacterImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (여러 이미지 + 텍스트) - 배경 이미지 생성용
  async generateBackgroundWithMultipleImages(imageFiles: File[], textPrompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      console.log('🖼️ 멀티 이미지 배경 생성 시작:', { textPrompt, imageCount: imageFiles.length });
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      // 여러 이미지를 parts 배열에 추가
      const parts: any[] = [
        {
          text: `Based on these reference images, generate a new background image with the following modifications: ${textPrompt}. 
          
          Instructions:
          - Combine environmental elements from all reference images
          - Maintain atmospheric consistency and mood
          - Incorporate the requested changes while preserving the best features from each image
          - Create a cohesive background that blends the reference images effectively`,
        }
      ];

      // 각 이미지를 parts에 추가
      for (const imageFile of imageFiles) {
        const imageData = await this.fileToBase64(imageFile);
        parts.push({
          inlineData: {
            mimeType: imageFile.type,
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

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ 멀티 이미지 배경 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 멀티 이미지 배경 생성 실패, 첫 번째 이미지로 단일 생성 시도');
        return await this.generateBackgroundWithImage(imageFiles[0], textPrompt, aspectRatio);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티 이미지 배경 생성 오류:', error);
      // 실패 시 첫 번째 이미지로 단일 생성 시도
      if (imageFiles.length > 0) {
        return await this.generateBackgroundWithImage(imageFiles[0], textPrompt, aspectRatio);
      }
      // 모든 실패 시 텍스트만으로 생성
      return await this.generateBackgroundImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (여러 이미지 + 텍스트) - 설정 컷 이미지 생성용
  async generateSettingCutWithMultipleImages(imageFiles: File[], textPrompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      console.log('🖼️ 멀티 이미지 설정 컷 생성 시작:', { textPrompt, imageCount: imageFiles.length });
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      // 여러 이미지를 parts 배열에 추가
      const parts: any[] = [
        {
          text: `Based on these reference images, generate a new setting cut image with the following modifications: ${textPrompt}. 
          
          Instructions:
          - Combine scene elements from all reference images
          - Maintain compositional consistency and visual flow
          - Incorporate the requested changes while preserving the best features from each image
          - Create a cohesive scene that blends the reference images effectively`,
        }
      ];

      // 각 이미지를 parts에 추가
      for (const imageFile of imageFiles) {
        const imageData = await this.fileToBase64(imageFile);
        parts.push({
          inlineData: {
            mimeType: imageFile.type,
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

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ 멀티 이미지 설정 컷 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 멀티 이미지 설정 컷 생성 실패, 첫 번째 이미지로 단일 생성 시도');
        return await this.generateSettingCutWithImage(imageFiles[0], textPrompt, aspectRatio);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티 이미지 설정 컷 생성 오류:', error);
      // 실패 시 첫 번째 이미지로 단일 생성 시도
      if (imageFiles.length > 0) {
        return await this.generateSettingCutWithImage(imageFiles[0], textPrompt, aspectRatio);
      }
      // 모든 실패 시 텍스트만으로 생성
      return await this.generateSettingCutImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (이미지 + 텍스트) - 배경 이미지 생성용
  async generateBackgroundWithImage(imageFile: File, textPrompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      console.log('🖼️ img2img 배경 이미지 생성 시작:', textPrompt);
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Based on this reference image, generate a new background image with the following modifications: ${textPrompt}. 
              
              Maintain the overall atmosphere and style of the reference image while incorporating the requested changes.`,
            },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageData,
              },
            },
          ],
        },
      ];

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ img2img 배경 이미지 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 이미지 생성 실패, 텍스트만으로 생성 시도');
        return await this.generateBackgroundImage(textPrompt);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티모달 배경 생성 오류:', error);
      // 실패 시 텍스트만으로 이미지 생성
      return await this.generateBackgroundImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (이미지 + 텍스트) - 설정 컷 이미지 생성용
  async generateSettingCutWithImage(imageFile: File, textPrompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      console.log('🖼️ img2img 설정 컷 이미지 생성 시작:', textPrompt);
      
      // Gemini 2.5 Flash Image 모델을 사용한 이미지 생성
      const config = {
        responseModalities: ['IMAGE'],
      };
      
      const model = 'gemini-2.5-flash-image';
      
      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Based on this reference image, generate a new setting cut image with the following modifications: ${textPrompt}. 
              
              Maintain the overall scene composition and atmosphere of the reference image while incorporating the requested changes.`,
            },
            {
              inlineData: {
                mimeType: imageFile.type,
                data: imageData,
              },
            },
          ],
        },
      ];

      const response = await this.ai!.models.generateContentStream({
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
          console.log('✅ img2img 설정 컷 이미지 생성 완료');
          break;
        }
      }

      if (!generatedImage) {
        console.warn('⚠️ 이미지 생성 실패, 텍스트만으로 생성 시도');
        return await this.generateSettingCutImage(textPrompt);
      }

      return generatedImage;
    } catch (error) {
      console.error('Google AI 멀티모달 설정 컷 생성 오류:', error);
      // 실패 시 텍스트만으로 이미지 생성
      return await this.generateSettingCutImage(textPrompt);
    }
  }

  // 파일을 Base64로 변환
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // data:image/jpeg;base64, 부분 제거
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 스트리밍 응답 (실시간 생성)
  async generateStream(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const responseStream = await this.ai!.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }]
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    } catch (error) {
      console.error('Google AI 스트리밍 생성 오류:', error);
      throw new Error('스트리밍 생성에 실패했습니다.');
    }
  }

  // 구조화된 출력 (JSON 형태)
  async generateStructuredOutput(prompt: string, schema: any): Promise<any> {
    try {
      const response = await this.ai!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
      throw new Error('구조화된 출력 생성에 실패했습니다.');
    } catch (error) {
      console.error('Google AI 구조화된 출력 생성 오류:', error);
      throw new Error('구조화된 출력 생성에 실패했습니다.');
    }
  }

  // 채팅 세션 생성 (멀티턴 대화)
  createChatSession() {
    return this.ai!.chats.create({ model: "gemini-2.5-flash" });
  }

  // 안전 설정이 포함된 텍스트 생성
  async generateTextWithSafety(prompt: string, safetySettings?: any[]): Promise<string> {
    try {
      const response = await this.ai!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          safetySettings: safetySettings || [
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            }
          ]
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Google AI 안전 설정 텍스트 생성 오류:', error);
      throw new Error('텍스트 생성에 실패했습니다.');
    }
  }

  // 프로젝트 개요 통합 데이터 생성 (구조화된 출력)
  async generateProjectOverviewData(projectData: {
    title: string;
    description: string;
    story: string;
    character: string;
    storyText: string;
    genre: string;
    targetAudience: string;
    duration: string;
  }): Promise<{
    storyPrompt: string;
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
  }> {
    try {
      const schema = {
        type: Type.OBJECT,
        properties: {
          storyPrompt: {
            type: Type.STRING,
            description: '스토리 생성용 상세 프롬프트'
          },
          characterPrompt: {
            type: Type.STRING,
            description: '캐릭터 이미지 생성용 프롬프트'
          },
          scenarioPrompt: {
            type: Type.STRING,
            description: '시나리오 생성용 프롬프트'
          },
          imagePrompts: {
            type: Type.OBJECT,
            properties: {
              character: {
                type: Type.STRING,
                description: '캐릭터 이미지 생성용 구체적 프롬프트'
              },
              background: {
                type: Type.STRING,
                description: '배경 이미지 생성용 구체적 프롬프트'
              },
              setting: {
                type: Type.STRING,
                description: '설정 컷 이미지 생성용 구체적 프롬프트'
              }
            },
            required: ['character', 'background', 'setting']
          },
          videoPrompts: {
            type: Type.OBJECT,
            properties: {
              main: {
                type: Type.STRING,
                description: '전체 영상 생성용 메인 프롬프트'
              },
              cuts: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: '개별 컷별 영상 생성용 프롬프트'
                },
                description: '컷별 영상 생성용 프롬프트 배열'
              }
            },
            required: ['main', 'cuts']
          }
        },
        required: ['storyPrompt', 'characterPrompt', 'scenarioPrompt', 'imagePrompts', 'videoPrompts']
      };

      const prompt = `다음 프로젝트 정보를 바탕으로 AI 이미지/영상 생성에 필요한 모든 프롬프트를 생성해주세요:

프로젝트 정보:
- 제목: ${projectData.title}
- 설명: ${projectData.description}
- 스토리: ${projectData.story}
- 캐릭터: ${projectData.character}
- 상세 스토리: ${projectData.storyText}
- 장르: ${projectData.genre}
- 타겟 오디언스: ${projectData.targetAudience}
- 영상 길이: ${projectData.duration}

요구사항:
1. storyPrompt: 스토리 생성용 상세 프롬프트 (주요 스토리 라인, 캐릭터 설정, 장면 구성, 시각적 요소, 감정적 톤 포함)
2. characterPrompt: 캐릭터 이미지 생성용 프롬프트 (외모, 의상, 표정, 포즈, 배경, 조명, 화질 포함)
3. scenarioPrompt: 시나리오 생성용 프롬프트 (컷별 장면, 캐릭터, 액션, 대사, 시각적 요소, 카메라 앵글, 지속시간 포함)
4. imagePrompts: 각 이미지 타입별 구체적 생성 프롬프트
5. videoPrompts: 영상 생성용 프롬프트 (메인 + 컷별)

모든 프롬프트는 실제 AI 이미지/영상 생성에 바로 사용할 수 있도록 구체적이고 상세하게 작성해주세요.`;

      const result = await this.generateStructuredOutput(prompt, schema);
      return result;
    } catch (error) {
      console.error('프로젝트 개요 데이터 생성 오류:', error);
      throw new Error('프로젝트 개요 데이터 생성에 실패했습니다.');
    }
  }

  // 다음 단계를 위한 이미지 생성 프롬프트 최적화
  async optimizeImagePromptsForNextStep(
    basePrompts: { character: string; background: string; setting: string },
    context: { story: string; character: string; genre: string }
  ): Promise<{
    character: string;
    background: string;
    setting: string;
    style: string;
    quality: string;
  }> {
    try {
      const schema = {
        type: Type.OBJECT,
        properties: {
          character: {
            type: Type.STRING,
            description: '캐릭터 이미지 생성용 최적화된 프롬프트'
          },
          background: {
            type: Type.STRING,
            description: '배경 이미지 생성용 최적화된 프롬프트'
          },
          setting: {
            type: Type.STRING,
            description: '설정 컷 이미지 생성용 최적화된 프롬프트'
          },
          style: {
            type: Type.STRING,
            description: '일관된 스타일 가이드라인'
          },
          quality: {
            type: Type.STRING,
            description: '이미지 품질 및 기술적 요구사항'
          }
        },
        required: ['character', 'background', 'setting', 'style', 'quality']
      };

      const prompt = `다음 정보를 바탕으로 이미지 생성 프롬프트를 최적화해주세요:

기본 프롬프트:
- 캐릭터: ${basePrompts.character}
- 배경: ${basePrompts.background}
- 설정: ${basePrompts.setting}

컨텍스트:
- 스토리: ${context.story}
- 캐릭터: ${context.character}
- 장르: ${context.genre}

요구사항:
1. 모든 이미지가 일관된 스타일과 톤을 유지하도록 최적화
2. 실제 AI 이미지 생성에 최적화된 구체적이고 상세한 프롬프트
3. 장르와 스토리에 맞는 시각적 일관성 확보
4. 고품질 이미지 생성을 위한 기술적 세부사항 포함`;

      const result = await this.generateStructuredOutput(prompt, schema);
      return result;
    } catch (error) {
      console.error('이미지 프롬프트 최적화 오류:', error);
      throw new Error('이미지 프롬프트 최적화에 실패했습니다.');
    }
  }
}

// 싱글톤 인스턴스 제거 - 로그인 후 동적 생성 필요
