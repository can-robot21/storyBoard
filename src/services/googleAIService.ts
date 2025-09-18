import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } from '@google/genai';

// Google AI 서비스 클래스
export class GoogleAIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.REACT_APP_GEMINI_API_KEY || 'your-gemini-api-key'
    });
  }

  // 텍스트 생성 (프로젝트 개요용)
  async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: "당신은 창의적인 스토리텔러이자 영상 제작 전문가입니다. 주어진 요청에 따라 매력적이고 구체적인 콘텐츠를 생성해주세요."
        }
      });
      return response.text || '';
    } catch (error) {
      console.error('Google AI 텍스트 생성 오류:', error);
      throw new Error('텍스트 생성에 실패했습니다.');
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

  // 이미지 생성 (캐릭터용) - 실제 Imagen API 사용
  async generateCharacterImage(prompt: string, aspectRatio: string = '1:1'): Promise<string> {
    try {
      // 스토리보드 연계를 위한 상세한 프롬프트 생성
      const detailedPrompt = `Create a detailed character image for video production:

${prompt}

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

      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-fast-generate-001',
        prompt: detailedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9' // 비디오 비율에 맞춤
        }
      });

      console.log('Imagen API 응답:', response); // 디버깅용

      // 다양한 응답 구조 확인
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0] as any;
        
        // 응답 구조 1: image.imageBytes
        if (firstImage?.image?.imageBytes) {
          const base64ImageBytes = firstImage.image.imageBytes;
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        // 응답 구조 2: imageBytes 직접
        if (firstImage?.imageBytes) {
          const base64ImageBytes = firstImage.imageBytes;
          return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        
        // 응답 구조 3: base64Data
        if (firstImage?.base64Data) {
          return `data:image/jpeg;base64,${firstImage.base64Data}`;
        }
        
        // 응답 구조 4: data 직접
        if (firstImage?.data) {
          return `data:image/jpeg;base64,${firstImage.data}`;
        }
      }
      
      // 응답 구조 5: response.data
      if ((response as any).data && (response as any).data.generatedImages) {
        const firstImage = (response as any).data.generatedImages[0];
        if (firstImage?.image?.imageBytes) {
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
      }
      
      throw new Error('이미지 생성 결과가 없습니다.');
    } catch (error) {
      console.error('Google AI 이미지 생성 오류:', error);
      throw new Error('이미지 생성에 실패했습니다.');
    }
  }

  // 배경 이미지 생성 - 실제 Imagen API 사용
  async generateBackgroundImage(prompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9'
        }
      });

      // 다양한 응답 구조 확인
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0] as any;
        
        if (firstImage?.image?.imageBytes) {
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
        if (firstImage?.imageBytes) {
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

  // 설정 컷 이미지 생성 - 실제 Imagen API 사용
  async generateSettingCutImage(prompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-ultra-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9'
        }
      });

      // 다양한 응답 구조 확인
      if (response.generatedImages && response.generatedImages.length > 0) {
        const firstImage = response.generatedImages[0] as any;
        
        if (firstImage?.image?.imageBytes) {
          return `data:image/jpeg;base64,${firstImage.image.imageBytes}`;
        }
        if (firstImage?.imageBytes) {
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

  // 비디오 생성 - 실제 Veo API 사용
  async generateVideo(prompt: string, videoRatio: string = '16:9'): Promise<string> {
    try {
      console.log('Veo API를 사용하여 실제 영상을 생성합니다.');
      
      // Veo API에 최적화된 프롬프트 생성
      const veoOptimizedPrompt = await this.createVeoOptimizedPrompt(prompt, videoRatio);
      
      // Veo API 호출 (오디오 생성 포함)
      let operation = await this.ai.models.generateVideos({
        model: 'veo-3.0-fast-generate-001', // Veo 3.0 사용
        prompt: veoOptimizedPrompt,
        config: {
          numberOfVideos: 1,
          aspectRatio: videoRatio,
          durationSeconds: 8,
          personGeneration: 'ALLOW_ALL',
          generateAudio: true, // 오디오 생성 활성화
          resolution: '720p', // 해상도 설정
          fps: 24, // 프레임 레이트 설정
        },
      });

      console.log(`Video generation started: ${operation.name}`);

      // 비디오 생성 완료까지 대기
      while (!operation.done) {
        console.log(`Video ${operation.name} is still generating. Checking again in 10 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10초마다 체크
        operation = await this.ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      console.log(`Generated ${operation.response?.generatedVideos?.length ?? 0} video(s).`);

      if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
        const generatedVideo = operation.response.generatedVideos[0];
        const videoUri = generatedVideo?.video?.uri;
        
        if (videoUri) {
          // API 키를 URI에 추가하여 반환
          const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
          return `${videoUri}&key=${apiKey}`;
        }
      }
      
      throw new Error('비디오 생성 결과가 없습니다.');
      
    } catch (error) {
      console.error('Google AI 비디오 생성 오류:', error);
      
      // Veo API 실패 시 스토리보드로 폴백
      console.log('Veo API 실패. 스토리보드를 생성합니다.');
      return await this.generateStoryboardFallback(prompt, videoRatio);
    }
  }

  // Veo API 최적화 프롬프트 생성 (오디오 포함)
  private async createVeoOptimizedPrompt(originalPrompt: string, videoRatio: string): Promise<string> {
    const optimizationPrompt = `다음 프롬프트를 Veo API에 최적화된 영상 생성 프롬프트로 변환해주세요:

원본 프롬프트: ${originalPrompt}
영상 비율: ${videoRatio}

요구사항:
1. 8초 길이의 영상에 적합한 내용으로 조정
2. 카메라 워크와 액션을 구체적으로 설명
3. 조명과 색감을 명확히 지정
4. 영상의 흐름과 전환이 자연스럽도록 구성
5. 오디오와 사운드 효과를 포함하여 설명
6. 대사가 있다면 자연스러운 음성으로 표현
7. 배경음악과 효과음을 적절히 배치
8. Veo API가 이해하기 쉬운 명확한 영어로 작성

오디오 지시사항:
- 자연스러운 대사와 내레이션
- 적절한 배경음악
- 상황에 맞는 효과음
- 음성의 톤과 감정 표현

최적화된 프롬프트만 반환해주세요 (추가 설명 없이):`;

    return await this.generateText(optimizationPrompt);
  }

  // Veo API 실패 시 스토리보드 폴백
  private async generateStoryboardFallback(prompt: string, videoRatio: string): Promise<string> {
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
    
    // Base64로 인코딩하여 반환
    return `data:application/json;base64,${btoa(JSON.stringify(storyboardData))}`;
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
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      // 이미지 기반 프롬프트 생성 - 영문, 적절한 길이로 제한
      const imagePrompt = `Analyze this image and create a detailed English prompt for character image generation.

User request: ${textPrompt}

Requirements:
- Generate a concise English prompt (50-100 words max)
- Focus on visual elements: appearance, clothing, pose, expression, style
- Include technical details: lighting, composition, quality
- Avoid overly complex descriptions
- Make it suitable for AI image generation

Generate only the English prompt, no explanations.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: imageData,
              mimeType: imageFile.type
            }
          },
          imagePrompt
        ]
      });
      
      // 생성된 프롬프트 검증 및 최적화
      let generatedPrompt = response.text?.trim() || textPrompt;
      
      // 프롬프트 길이 확인 및 조정
      if (generatedPrompt.length > 200) {
        generatedPrompt = generatedPrompt.substring(0, 200) + '...';
      }
      
      // 사용자 프롬프트와 결합
      const finalPrompt = `${generatedPrompt}, ${textPrompt}`;
      
      return await this.generateCharacterImage(finalPrompt);
    } catch (error) {
      console.error('Google AI 멀티모달 생성 오류:', error);
      // 실패 시 텍스트만으로 이미지 생성
      return await this.generateCharacterImage(textPrompt);
    }
  }

  // 멀티모달 입력 처리 (이미지 + 텍스트) - 배경 이미지 생성용
  async generateBackgroundWithImage(imageFile: File, textPrompt: string, aspectRatio: string = '16:9'): Promise<string> {
    try {
      const imageData = await this.fileToBase64(imageFile);
      
      // 이미지 기반 프롬프트 생성 - 영문, 적절한 길이로 제한
      const imagePrompt = `Analyze this image and create a detailed English prompt for background image generation.

User request: ${textPrompt}

Requirements:
- Generate a concise English prompt (50-100 words max)
- Focus on environmental elements: setting, atmosphere, lighting, composition
- Include technical details: perspective, depth, mood, style
- Avoid overly complex descriptions
- Make it suitable for AI image generation

Generate only the English prompt, no explanations.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: imageData,
              mimeType: imageFile.type
            }
          },
          imagePrompt
        ]
      });
      
      // 생성된 프롬프트 검증 및 최적화
      let generatedPrompt = response.text?.trim() || textPrompt;
      
      // 프롬프트 길이 확인 및 조정
      if (generatedPrompt.length > 200) {
        generatedPrompt = generatedPrompt.substring(0, 200) + '...';
      }
      
      // 사용자 프롬프트와 결합
      const finalPrompt = `${generatedPrompt}, ${textPrompt}`;
      
      return await this.generateBackgroundImage(finalPrompt);
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
      
      // 이미지 기반 프롬프트 생성 - 영문, 적절한 길이로 제한
      const imagePrompt = `Analyze this image and create a detailed English prompt for setting cut image generation.

User request: ${textPrompt}

Requirements:
- Generate a concise English prompt (50-100 words max)
- Focus on scene elements: location, atmosphere, composition, mood
- Include technical details: lighting, perspective, style, quality
- Avoid overly complex descriptions
- Make it suitable for AI image generation

Generate only the English prompt, no explanations.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: imageData,
              mimeType: imageFile.type
            }
          },
          imagePrompt
        ]
      });
      
      // 생성된 프롬프트 검증 및 최적화
      let generatedPrompt = response.text?.trim() || textPrompt;
      
      // 프롬프트 길이 확인 및 조정
      if (generatedPrompt.length > 200) {
        generatedPrompt = generatedPrompt.substring(0, 200) + '...';
      }
      
      // 사용자 프롬프트와 결합
      const finalPrompt = `${generatedPrompt}, ${textPrompt}`;
      
      return await this.generateSettingCutImage(finalPrompt);
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
      const responseStream = await this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt
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
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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
    return this.ai.chats.create({ model: "gemini-2.5-flash" });
  }

  // 안전 설정이 포함된 텍스트 생성
  async generateTextWithSafety(prompt: string, safetySettings?: any[]): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
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

// 싱글톤 인스턴스
export const googleAIService = new GoogleAIService();
