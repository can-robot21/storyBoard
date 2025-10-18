import React from 'react';
import { useUIStore } from '../stores/uiStore';
import { downloadBase64Image } from '../utils/downloadUtils';
import { googleAIService } from '../services/googleAIService';
import { AIProvider } from '../types/ai';
import ImageStorageService from '../services/imageStorageService';

export const useImageHandlers = (
  generatedCharacters: any[],
  setGeneratedCharacters: React.Dispatch<React.SetStateAction<any[]>>,
  generatedBackgrounds: any[],
  setGeneratedBackgrounds: React.Dispatch<React.SetStateAction<any[]>>,
  generatedSettingCuts: any[],
  setGeneratedSettingCuts: React.Dispatch<React.SetStateAction<any[]>>,
  generatedProjectData: any,
  imageGenerationAPI: AIProvider = 'google',
  aspectRatio: string = '16:9',
  imageOptions?: {
    imageStyle: string;
    imageQuality: string;
    numberOfImages: number;
  },
  currentProjectId?: string,
  globalImageSettings?: {
    quality: 'standard' | 'high' | 'ultra';
    aspectRatio: '16:9' | '9:16' | '2:3' | '1:1' | 'free';
  }
) => {
  const { addNotification } = useUIStore();
  const imageStorageService = ImageStorageService.getInstance();
  
  // 나노 바나나 서비스는 더 이상 사용하지 않음 (Google AI만 사용)

  // 설정 우선순위 적용 함수 (본문 설정 우선)
  const applySettingsPriority = () => {
    // 본문 설정이 있으면 우선 적용, 없으면 상단 기본 설정 사용
    const finalAspectRatio = aspectRatio || globalImageSettings?.aspectRatio || '16:9';
    const finalQuality = imageOptions?.imageQuality || globalImageSettings?.quality || 'high';
    const finalStyle = imageOptions?.imageStyle || 'realistic';
    const finalNumberOfImages = imageOptions?.numberOfImages || 1;

    // 설정 우선순위 안내 메시지
    if (aspectRatio && globalImageSettings?.aspectRatio && aspectRatio !== globalImageSettings.aspectRatio) {
      console.log('📋 설정 우선순위: 본문 설정이 상단 기본 설정보다 우선 적용됩니다.');
      console.log(`   본문 비율: ${aspectRatio}, 상단 기본 비율: ${globalImageSettings.aspectRatio}`);
    }
    if (imageOptions?.imageQuality && globalImageSettings?.quality && imageOptions.imageQuality !== globalImageSettings.quality) {
      console.log('📋 설정 우선순위: 본문 설정이 상단 기본 설정보다 우선 적용됩니다.');
      console.log(`   본문 품질: ${imageOptions.imageQuality}, 상단 기본 품질: ${globalImageSettings.quality}`);
    }

    return {
      aspectRatio: finalAspectRatio,
      quality: finalQuality,
      style: finalStyle,
      numberOfImages: finalNumberOfImages
    };
  };

  // 통합 이미지 생성 함수 (Google AI만 사용) - 단일 이미지 반환
  const generateImageWithAPI = async (prompt: string, attachedImages: File[], type: 'character' | 'background' | 'setting' | 'settingCut') => {
    console.log('🚀 generateImageWithAPI 호출:', { prompt, attachedImages: attachedImages.length, type, imageGenerationAPI, aspectRatio, imageOptions });
    
    // 설정 우선순위 적용
    const settings = applySettingsPriority();
    console.log('⚙️ 적용된 설정:', settings);
    
    // 이미지 옵션이 있으면 프롬프트에 추가
    let enhancedPrompt = prompt;
    if (imageOptions) {
      const stylePrompt = `Style: ${settings.style}`;
      const qualityPrompt = `Quality: ${settings.quality}`;
      
      enhancedPrompt = `${prompt}\n\n${stylePrompt}\n${qualityPrompt}`;
      console.log('🎨 이미지 옵션 적용된 프롬프트:', enhancedPrompt);
    }
    
    // Google AI 서비스 사용
    console.log('🔍 Google AI 서비스 사용');
    const numberOfImages = settings.numberOfImages;
    
    if (attachedImages.length > 0) {
      console.log('📷 첨부 이미지와 함께 생성 (단일 이미지만 지원)');
      // 첨부 이미지가 있는 경우 기존 단일 이미지 함수 사용
      switch (type) {
        case 'character':
          return await googleAIService.generateWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
        case 'background':
          return await googleAIService.generateBackgroundWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateSettingCutWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
        default:
          throw new Error(`지원되지 않는 이미지 타입: ${type}`);
      }
    } else {
      console.log('📝 텍스트만으로 생성');
      // 텍스트만으로 생성
      switch (type) {
        case 'character':
          return await googleAIService.generateCharacterImage(enhancedPrompt, settings.aspectRatio, numberOfImages);
        case 'background':
          return await googleAIService.generateBackgroundImage(enhancedPrompt, settings.aspectRatio, numberOfImages);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateSettingCutImage(enhancedPrompt, settings.aspectRatio, numberOfImages);
        default:
          throw new Error(`지원되지 않는 이미지 타입: ${type}`);
      }
    }
  };

  // 통합 이미지 생성 함수 (Google AI만 사용) - 여러 이미지 반환
  const generateMultipleImagesWithAPI = async (prompt: string, attachedImages: File[], type: 'character' | 'background' | 'setting' | 'settingCut') => {
    console.log('🚀 generateMultipleImagesWithAPI 호출:', { prompt, attachedImages: attachedImages.length, type, imageGenerationAPI, aspectRatio, imageOptions });
    
    // 설정 우선순위 적용
    const settings = applySettingsPriority();
    console.log('⚙️ 적용된 설정:', settings);
    
    // 이미지 옵션이 있으면 프롬프트에 추가
    let enhancedPrompt = prompt;
    if (imageOptions) {
      const stylePrompt = `Style: ${settings.style}`;
      const qualityPrompt = `Quality: ${settings.quality}`;
      
      enhancedPrompt = `${prompt}\n\n${stylePrompt}\n${qualityPrompt}`;
      console.log('🎨 이미지 옵션 적용된 프롬프트:', enhancedPrompt);
    }
    
    // Google AI 서비스 사용
    console.log('🔍 Google AI 서비스 사용');
    const numberOfImages = settings.numberOfImages;
    
    if (attachedImages.length > 0) {
      console.log('📷 첨부 이미지와 함께 생성 (단일 이미지만 지원)');
      // 첨부 이미지가 있는 경우 기존 단일 이미지 함수 사용
      switch (type) {
        case 'character':
          const singleImage = await googleAIService.generateWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
          return [singleImage];
        case 'background':
          const singleBgImage = await googleAIService.generateBackgroundWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
          return [singleBgImage];
        case 'setting':
        case 'settingCut':
          const singleSettingImage = await googleAIService.generateSettingCutWithImage(attachedImages[0], enhancedPrompt, settings.aspectRatio);
          return [singleSettingImage];
      }
    } else {
      console.log('📝 텍스트만으로 여러 이미지 생성');
      switch (type) {
        case 'character':
          return await googleAIService.generateMultipleCharacterImages(enhancedPrompt, settings.aspectRatio, numberOfImages);
        case 'background':
          return await googleAIService.generateMultipleBackgroundImages(enhancedPrompt, settings.aspectRatio, numberOfImages);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateMultipleSettingCutImages(enhancedPrompt, settings.aspectRatio, numberOfImages);
      }
    }
  };

  const handleGenerateCharacter = async (characterInput: string, attachedImages: File[]) => {
    console.log('🎭 캐릭터 생성 시작:', { characterInput, attachedImages: attachedImages.length, imageGenerationAPI });
    
    if (!characterInput.trim() && attachedImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '캐릭터 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return null;
    }

    try {
      let imagePrompt = characterInput;
      if (generatedProjectData?.imagePrompts?.character) {
        imagePrompt = generatedProjectData.imagePrompts.character;
        console.log('📝 프로젝트 데이터에서 캐릭터 프롬프트 사용:', imagePrompt);
      } else if (generatedProjectData?.characterPrompt) {
        imagePrompt = generatedProjectData.characterPrompt;
        console.log('📝 프로젝트 데이터에서 캐릭터 프롬프트 사용:', imagePrompt);
      } else {
        console.log('📝 사용자 입력 사용:', imagePrompt);
      }
      
      console.log('🔄 이미지 생성 API 호출 시작...');
      const imageResults = await generateMultipleImagesWithAPI(imagePrompt, attachedImages, 'character');
      console.log('✅ 이미지 생성 완료:', imageResults ? `${imageResults.length}개 이미지 생성` : '실패');
      
      // 여러 이미지를 각각 캐릭터로 추가 (이미지 저장 정책 적용)
      const newCharacters = await Promise.all(imageResults.map(async (imageResult, index) => {
        const characterId = Date.now() + index;
        
        // 이미지 저장 서비스에 저장
        const storedImageId = await imageStorageService.storeImage(
          currentProjectId || 'default',
          'character',
          imageResult,
          {
            description: characterInput,
            attachedImages: attachedImages.length,
            generatedAt: new Date().toISOString()
          }
        );
        
        return {
          id: characterId,
          description: characterInput,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
        };
      }));
      
      console.log('💾 캐릭터 상태 업데이트:', newCharacters);
      setGeneratedCharacters([...generatedCharacters, ...newCharacters]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `${newCharacters.length}개의 캐릭터가 생성되었습니다. 결과를 확인해보세요.`,
      });

      return newCharacters;
    } catch (error) {
      console.error('❌ 캐릭터 생성 오류:', error);
      
      let errorMessage = '캐릭터 생성에 실패했습니다.';
      if (error instanceof Error) {
        if (error.message.includes('프롬프트가 비어있습니다')) {
          errorMessage = '캐릭터 설명을 입력해주세요.';
        } else if (error.message.includes('프롬프트가 너무 깁니다')) {
          errorMessage = '캐릭터 설명이 너무 깁니다. 1000자 이내로 작성해주세요.';
        } else if (error.message.includes('부적절한 내용')) {
          errorMessage = '부적절한 내용이 포함되어 있습니다. 다른 내용으로 시도해주세요.';
        } else if (error.message.includes('이미지 생성 결과가 없습니다')) {
          errorMessage = '이미지 생성에 실패했습니다. 프롬프트를 더 구체적으로 작성해보세요.';
        } else if (error.message.includes('API 키')) {
          errorMessage = 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
        } else if (error.message.includes('사용량 한도')) {
          errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('안전 정책')) {
          errorMessage = '입력 내용이 안전 정책에 위배됩니다. 다른 내용으로 시도해주세요.';
        } else if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('네트워크')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        } else {
          errorMessage = `캐릭터 생성에 실패했습니다: ${error.message}`;
        }
      }
      
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: errorMessage,
      });
      return null;
    }
  };

  const handleRegenerateCharacter = async (characterId: number) => {
    try {
      const character = generatedCharacters.find(c => c.id === characterId);
      if (!character) return;

      let imagePrompt = character.description;
      if (generatedProjectData?.imagePrompts?.character) {
        imagePrompt = generatedProjectData.imagePrompts.character;
      }
      
      const numberOfImages = imageOptions?.numberOfImages || 1;
      const imageResult = await googleAIService.generateCharacterImage(imagePrompt, aspectRatio, numberOfImages);
      
      setGeneratedCharacters((prev: any[]) =>
        prev.map((char: any) =>
          char.id === characterId
            ? { ...char, image: imageResult, timestamp: new Date().toISOString() }
            : char
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '캐릭터가 재생성되었습니다.',
      });
    } catch (error) {
      console.error('캐릭터 재생성 오류:', error);
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDeleteCharacter = (characterId: number) => {
    setGeneratedCharacters((prev: any[]) => {
      const characterToDelete = prev.find((char: any) => char.id === characterId);
      if (characterToDelete?.imageStorageId) {
        // 이미지 저장 서비스에서도 삭제
        imageStorageService.deleteImage(characterToDelete.imageStorageId);
      }
      
      const filtered = prev.filter((char: any) => char.id !== characterId);
      console.log('캐릭터 삭제:', { 삭제ID: characterId, 원본수: prev.length, 삭제후수: filtered.length });
      return filtered;
    });
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '캐릭터가 삭제되었습니다.',
    });
  };

  const handleGenerateBackground = async (backgroundInput: string, attachedImages: File[]) => {
    if (!backgroundInput.trim() && attachedImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return null;
    }

    try {
      let imagePrompt = backgroundInput;
      if (generatedProjectData?.imagePrompts?.background) {
        imagePrompt = generatedProjectData.imagePrompts.background;
      } else if (generatedProjectData?.scenarioPrompt) {
        imagePrompt = generatedProjectData.scenarioPrompt;
      }
      
      const imageResults = await generateMultipleImagesWithAPI(imagePrompt, attachedImages, 'background');
      
      // 여러 이미지를 각각 배경으로 추가 (이미지 저장 정책 적용)
      const newBackgrounds = await Promise.all(imageResults.map(async (imageResult, index) => {
        const backgroundId = Date.now() + index;
        
        // 이미지 저장 서비스에 저장
        const storedImageId = await imageStorageService.storeImage(
          currentProjectId || 'default',
          'background',
          imageResult,
          {
            description: backgroundInput,
            attachedImages: attachedImages.length,
            generatedAt: new Date().toISOString()
          }
        );
        
        return {
          id: backgroundId,
          description: backgroundInput,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
        };
      }));
      
      setGeneratedBackgrounds([...generatedBackgrounds, ...newBackgrounds]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `${newBackgrounds.length}개의 배경이 생성되었습니다.`,
      });

      return newBackgrounds;
    } catch (error) {
      console.error('배경 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `배경 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return null;
    }
  };

  const handleRegenerateBackground = async (backgroundId: number) => {
    try {
      const background = generatedBackgrounds.find(bg => bg.id === backgroundId);
      if (!background) return;

      let imagePrompt = background.description;
      if (generatedProjectData?.imagePrompts?.background) {
        imagePrompt = generatedProjectData.imagePrompts.background;
      }
      
      const numberOfImages = imageOptions?.numberOfImages || 1;
      const imageResult = await googleAIService.generateBackgroundImage(imagePrompt, aspectRatio, numberOfImages);
      
      setGeneratedBackgrounds((prev: any[]) =>
        prev.map((bg: any) =>
          bg.id === backgroundId
            ? { ...bg, image: imageResult, timestamp: new Date().toISOString() }
            : bg
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '배경이 재생성되었습니다.',
      });
    } catch (error) {
      console.error('배경 재생성 오류:', error);
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '배경 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDeleteBackground = (backgroundId: number) => {
    setGeneratedBackgrounds((prev: any[]) => {
      const backgroundToDelete = prev.find((bg: any) => bg.id === backgroundId);
      if (backgroundToDelete?.imageStorageId) {
        // 이미지 저장 서비스에서도 삭제
        imageStorageService.deleteImage(backgroundToDelete.imageStorageId);
      }
      
      const filtered = prev.filter((bg: any) => bg.id !== backgroundId);
      console.log('배경 삭제:', { 삭제ID: backgroundId, 원본수: prev.length, 삭제후수: filtered.length });
      return filtered;
    });
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '배경이 삭제되었습니다.',
    });
  };

  const handleGenerateSettingCut = async (settingCut: string, attachedImages: File[]) => {
    if (!settingCut.trim() && attachedImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '설정 컷 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return null;
    }

    try {
      let imagePrompt = settingCut;
      if (generatedProjectData?.imagePrompts?.setting) {
        imagePrompt = generatedProjectData.imagePrompts.setting;
      } else if (generatedProjectData?.scenarioPrompt) {
        imagePrompt = generatedProjectData.scenarioPrompt;
      }
      
      const imageResults = await generateMultipleImagesWithAPI(imagePrompt, attachedImages, 'setting');
      
      // 여러 이미지를 각각 설정 컷으로 추가 (이미지 저장 정책 적용)
      const newSettingCuts = await Promise.all(imageResults.map(async (imageResult, index) => {
        const settingCutId = Date.now() + index;
        
        // 이미지 저장 서비스에 저장
        const storedImageId = await imageStorageService.storeImage(
          currentProjectId || 'default',
          'settingCut',
          imageResult,
          {
            description: settingCut,
            attachedImages: attachedImages.length,
            generatedAt: new Date().toISOString()
          }
        );
        
        return {
          id: settingCutId,
          description: settingCut,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
        };
      }));
      
      setGeneratedSettingCuts([...generatedSettingCuts, ...newSettingCuts]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: `${newSettingCuts.length}개의 설정 컷이 생성되었습니다.`,
      });

      return newSettingCuts;
    } catch (error) {
      console.error('설정 컷 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `설정 컷 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return null;
    }
  };

  const handleRegenerateSettingCut = async (settingId: number) => {
    try {
      const settingCut = generatedSettingCuts.find(cut => cut.id === settingId);
      if (!settingCut) return;

      let imagePrompt = settingCut.description;
      if (generatedProjectData?.imagePrompts?.setting) {
        imagePrompt = generatedProjectData.imagePrompts.setting;
      }
      
      const numberOfImages = imageOptions?.numberOfImages || 1;
      const imageResult = await googleAIService.generateSettingCutImage(imagePrompt, aspectRatio, numberOfImages);
      
      setGeneratedSettingCuts((prev: any[]) =>
        prev.map((cut: any) =>
          cut.id === settingId
            ? { ...cut, image: imageResult, timestamp: new Date().toISOString() }
            : cut
        )
      );
      
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '설정 컷이 재생성되었습니다.',
      });
    } catch (error) {
      console.error('설정 컷 재생성 오류:', error);
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '설정 컷 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDeleteSettingCut = (settingId: number) => {
    setGeneratedSettingCuts((prev: any[]) => {
      const settingCutToDelete = prev.find((cut: any) => cut.id === settingId);
      if (settingCutToDelete?.imageStorageId) {
        // 이미지 저장 서비스에서도 삭제
        imageStorageService.deleteImage(settingCutToDelete.imageStorageId);
      }
      
      const filtered = prev.filter((cut: any) => cut.id !== settingId);
      console.log('설정 컷 삭제:', { 삭제ID: settingId, 원본수: prev.length, 삭제후수: filtered.length });
      return filtered;
    });
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '설정 컷이 삭제되었습니다.',
    });
  };

  // 전체 재생성 기능들
  const handleRegenerateAllCharacters = async () => {
    if (generatedCharacters.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 캐릭터가 없습니다.',
      });
      return;
    }

    try {
      const newCharacters = [];
      const numberOfImages = imageOptions?.numberOfImages || 1;
      for (const character of generatedCharacters) {
        const imageResult = await googleAIService.generateCharacterImage(character.description, aspectRatio, numberOfImages);
        newCharacters.push({
          ...character,
          image: imageResult,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedCharacters(newCharacters);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 캐릭터가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateAllBackgrounds = async () => {
    if (generatedBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 배경이 없습니다.',
      });
      return;
    }

    try {
      const newBackgrounds = [];
      const numberOfImages = imageOptions?.numberOfImages || 1;
      for (const background of generatedBackgrounds) {
        const imageResult = await googleAIService.generateBackgroundImage(background.description, aspectRatio, numberOfImages);
        newBackgrounds.push({
          ...background,
          image: imageResult,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedBackgrounds(newBackgrounds);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 배경이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '배경 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateAllSettingCuts = async () => {
    if (generatedSettingCuts.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 설정 컷이 없습니다.',
      });
      return;
    }

    try {
      const newSettingCuts = [];
      const numberOfImages = imageOptions?.numberOfImages || 1;
      for (const cut of generatedSettingCuts) {
        const imageResult = await googleAIService.generateSettingCutImage(cut.description, aspectRatio, numberOfImages);
        newSettingCuts.push({
          ...cut,
          image: imageResult,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedSettingCuts(newSettingCuts);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 설정 컷이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '설정 컷 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  // 저장 기능들 (실제 다운로드)
  const handleSaveCharacter = (id: number) => {
    const character = generatedCharacters.find(char => char.id === id);
    if (!character || !character.image) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '캐릭터 이미지를 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `character_${id}_${new Date().toISOString().slice(0, 10)}.jpg`;
    const success = downloadBase64Image(character.image, filename);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `캐릭터 이미지가 다운로드되었습니다: ${filename}`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveBackground = (id: number) => {
    const background = generatedBackgrounds.find(bg => bg.id === id);
    if (!background || !background.image) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '배경 이미지를 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `background_${id}_${new Date().toISOString().slice(0, 10)}.jpg`;
    const success = downloadBase64Image(background.image, filename);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `배경 이미지가 다운로드되었습니다: ${filename}`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveSettingCut = (id: number) => {
    const settingCut = generatedSettingCuts.find(cut => cut.id === id);
    if (!settingCut || !settingCut.image) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '설정 컷 이미지를 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `setting_cut_${id}_${new Date().toISOString().slice(0, 10)}.jpg`;
    const success = downloadBase64Image(settingCut.image, filename);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `설정 컷 이미지가 다운로드되었습니다: ${filename}`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveAllCharacters = () => {
    if (generatedCharacters.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 캐릭터가 없습니다.',
      });
      return;
    }

    let successCount = 0;
    const date = new Date().toISOString().slice(0, 10);
    
    generatedCharacters.forEach((character, index) => {
      if (character.image) {
        const filename = `character_${character.id}_${date}.jpg`;
        if (downloadBase64Image(character.image, filename)) {
          successCount++;
        }
      }
    });

    if (successCount > 0) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `${successCount}개의 캐릭터 이미지가 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '캐릭터 이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveAllBackgrounds = () => {
    if (generatedBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 배경이 없습니다.',
      });
      return;
    }

    let successCount = 0;
    const date = new Date().toISOString().slice(0, 10);
    
    generatedBackgrounds.forEach((background, index) => {
      if (background.image) {
        const filename = `background_${background.id}_${date}.jpg`;
        if (downloadBase64Image(background.image, filename)) {
          successCount++;
        }
      }
    });

    if (successCount > 0) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `${successCount}개의 배경 이미지가 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '배경 이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveAllSettingCuts = () => {
    if (generatedSettingCuts.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 설정 컷이 없습니다.',
      });
      return;
    }

    let successCount = 0;
    const date = new Date().toISOString().slice(0, 10);
    
    generatedSettingCuts.forEach((settingCut, index) => {
      if (settingCut.image) {
        const filename = `setting_cut_${settingCut.id}_${date}.jpg`;
        if (downloadBase64Image(settingCut.image, filename)) {
          successCount++;
        }
      }
    });

    if (successCount > 0) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `${successCount}개의 설정 컷 이미지가 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '설정 컷 이미지 다운로드에 실패했습니다.',
      });
    }
  };

  return {
    // 핵심 생성 함수들
    generateImageWithAPI,
    handleGenerateCharacter,
    handleRegenerateCharacter,
    handleDeleteCharacter,
    handleGenerateBackground,
    handleRegenerateBackground,
    handleDeleteBackground,
    handleGenerateSettingCut,
    handleRegenerateSettingCut,
    handleDeleteSettingCut,
    // 전체 재생성 기능들
    handleRegenerateAllCharacters,
    handleRegenerateAllBackgrounds,
    handleRegenerateAllSettingCuts,
    // 저장 기능들
    handleSaveCharacter,
    handleSaveBackground,
    handleSaveSettingCut,
    handleSaveAllCharacters,
    handleSaveAllBackgrounds,
    handleSaveAllSettingCuts,
  };
};
