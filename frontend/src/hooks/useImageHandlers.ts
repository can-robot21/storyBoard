import React from 'react';
import { useUIStore } from '../stores/uiStore';
import { downloadBase64Image } from '../utils/downloadUtils';
import { GoogleAIService } from '../services/googleAIService';
import { AIProvider } from '../types/ai';
import ImageStorageService from '../services/imageStorageService';
import { getFormattedErrorMessage } from '../utils/contentPolicyValidator';
import { getAPIKeyFromStorage } from '../utils/apiKeyUtils';

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
  individualOptions?: {
    characterOptions?: any;
    backgroundOptions?: any;
    settingOptions?: any;
  }
) => {
  const { addNotification } = useUIStore();
  const imageStorageService = ImageStorageService.getInstance();
  
  // API 키 가져오기 (통합 유틸리티 사용)
  const getAPIKey = (): string => {
    return getAPIKeyFromStorage('google');
  };
  
  // Google AI 서비스 인스턴스 생성
  const createGoogleAIService = (): GoogleAIService => {
    const apiKey = getAPIKey();
    if (!apiKey) {
      throw new Error('Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
    }
    return GoogleAIService.getInstance();
  };
  
  // 나노 바나나 서비스는 더 이상 사용하지 않음 (Google AI만 사용)

  // 통합 이미지 생성 함수 (Google AI만 사용) - 단일 이미지 반환
  const generateImageWithAPI = async (prompt: string, attachedImages: File[], type: 'character' | 'background' | 'setting' | 'settingCut') => {
    console.log('🚀 generateImageWithAPI 호출:', { prompt, attachedImages: attachedImages.length, type, imageGenerationAPI, aspectRatio, imageOptions });
    
    // 이미지 옵션이 있으면 프롬프트에 추가
    let enhancedPrompt = prompt;
    if (imageOptions) {
      const stylePrompt = `Style: ${imageOptions.imageStyle}`;
      const qualityPrompt = `Quality: ${imageOptions.imageQuality}`;
      
      enhancedPrompt = `${prompt}\n\n${stylePrompt}\n${qualityPrompt}`;
      console.log('🎨 이미지 옵션 적용된 프롬프트:', enhancedPrompt);
    }
    
    // Google AI 서비스 사용
    console.log('🔍 Google AI 서비스 사용');
    const numberOfImages = imageOptions?.numberOfImages || 1;
    
    // 동적으로 Google AI 서비스 인스턴스 생성
    const googleAIService = createGoogleAIService();
    
    if (attachedImages.length > 0) {
      console.log('📷 첨부 이미지와 함께 생성 (단일 이미지만 지원)');
      // 첨부 이미지가 있는 경우 기존 단일 이미지 함수 사용
      switch (type) {
        case 'character':
          return await googleAIService.generateWithImage(attachedImages[0], enhancedPrompt, aspectRatio);
        case 'background':
          return await googleAIService.generateBackgroundWithImage(attachedImages[0], enhancedPrompt, aspectRatio);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateSettingCutWithImage(attachedImages[0], enhancedPrompt, aspectRatio);
        default:
          throw new Error(`지원되지 않는 이미지 타입: ${type}`);
      }
    } else {
      console.log('📝 텍스트만으로 생성');
      // 텍스트만으로 생성
      switch (type) {
        case 'character':
          return await googleAIService.generateCharacterImage(enhancedPrompt, aspectRatio, numberOfImages);
        case 'background':
          return await googleAIService.generateBackgroundImage(enhancedPrompt, aspectRatio, numberOfImages);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateSettingCutImage(enhancedPrompt, aspectRatio, numberOfImages);
        default:
          throw new Error(`지원되지 않는 이미지 타입: ${type}`);
      }
    }
  };

  // 옵션 우선순위 적용 함수
  const applyOptionsPriority = (type: 'character' | 'background' | 'settingCut', basePrompt: string) => {
    let enhancedPrompt = basePrompt;
    let finalNumberOfImages = imageOptions?.numberOfImages || 1;
    let finalAspectRatio = aspectRatio;
    let finalImageSize = '1K';
    let finalPersonGeneration = 'allow_adult';
    
    // 개별 옵션 우선 적용
    let individualOpts: any = {};
    switch (type) {
      case 'character':
        individualOpts = individualOptions?.characterOptions || {};
        break;
      case 'background':
        individualOpts = individualOptions?.backgroundOptions || {};
        break;
      case 'settingCut':
        individualOpts = individualOptions?.settingOptions || {};
        break;
    }
    
    // 개별 옵션 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 ${type} 개별 옵션 확인:`, {
        individualOpts,
        hasPersonGeneration: !!individualOpts.personGeneration,
        personGenerationValue: individualOpts.personGeneration,
        hasAspectRatio: !!individualOpts.aspectRatio,
        aspectRatioValue: individualOpts.aspectRatio,
        hasNumberOfImages: !!individualOpts.numberOfImages,
        numberOfImagesValue: individualOpts.numberOfImages
      });
    }
    
    // 개별 옵션에서 값이 있으면 우선 적용 (명시적으로 설정된 값만 사용)
    // numberOfImages: 0도 유효한 값이므로, undefined/null 체크만 수행
    if (individualOpts.numberOfImages !== undefined && individualOpts.numberOfImages !== null) {
      finalNumberOfImages = individualOpts.numberOfImages;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${type} numberOfImages 개별 옵션 적용: ${finalNumberOfImages} (기본값: ${imageOptions?.numberOfImages || 1})`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ ${type} numberOfImages 개별 옵션 없음, 공통 옵션 사용: ${finalNumberOfImages}`);
      }
    }
    
    // aspectRatio: 빈 문자열이나 undefined가 아닌 경우 적용 ('1:1' 포함 모든 값 허용)
    if (individualOpts.aspectRatio && typeof individualOpts.aspectRatio === 'string' && individualOpts.aspectRatio.trim() !== '') {
      finalAspectRatio = individualOpts.aspectRatio;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${type} aspectRatio 개별 옵션 적용: ${finalAspectRatio} (기본값: ${aspectRatio})`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ ${type} aspectRatio 개별 옵션 없음, 공통 옵션 사용: ${finalAspectRatio}`);
      }
    }
    
    // imageSize: 명시적으로 설정된 경우만 적용
    if (individualOpts.imageSize && typeof individualOpts.imageSize === 'string' && individualOpts.imageSize.trim() !== '') {
      finalImageSize = individualOpts.imageSize;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${type} imageSize 개별 옵션 적용: ${finalImageSize}`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ ${type} imageSize 개별 옵션 없음, 기본값 사용: ${finalImageSize}`);
      }
    }
    
    // personGeneration: 명시적으로 설정된 경우만 적용
    if (individualOpts.personGeneration && typeof individualOpts.personGeneration === 'string' && individualOpts.personGeneration.trim() !== '') {
      finalPersonGeneration = individualOpts.personGeneration;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${type} personGeneration 개별 옵션 적용: ${finalPersonGeneration} (기본값: allow_adult)`);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ ${type} personGeneration 개별 옵션 없음, 기본값 사용: ${finalPersonGeneration}`);
      }
    }
    
    // 추가 프롬프트 적용
    if (individualOpts.additionalPrompt) {
      enhancedPrompt = `${enhancedPrompt}, ${individualOpts.additionalPrompt}`;
    }
    
    // 공통 옵션 적용 (개별 옵션에 없는 경우만)
    if (imageOptions) {
      if (!individualOpts.imageStyle) {
        enhancedPrompt = `${enhancedPrompt}, ${imageOptions.imageStyle} style`;
      }
      if (!individualOpts.imageQuality) {
        enhancedPrompt = `${enhancedPrompt}, ${imageOptions.imageQuality} quality`;
      }
    }
    
    // 카메라 옵션 적용
    const cameraOptions = [];
    if (individualOpts.cameraProximity && individualOpts.cameraProximity !== 'none') {
      cameraOptions.push(individualOpts.cameraProximity);
    }
    if (individualOpts.cameraPosition && individualOpts.cameraPosition !== 'none') {
      cameraOptions.push(individualOpts.cameraPosition);
    }
    if (individualOpts.lensType && individualOpts.lensType !== 'none') {
      cameraOptions.push(`${individualOpts.lensType} lens`);
    }
    if (individualOpts.filmType && individualOpts.filmType !== 'none') {
      cameraOptions.push(individualOpts.filmType);
    }
    
    if (cameraOptions.length > 0) {
      enhancedPrompt = `${enhancedPrompt}, ${cameraOptions.join(', ')}`;
    }
    
    // 최종 적용된 옵션 로깅 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 최종 적용된 옵션:', {
        prompt: enhancedPrompt.substring(0, 100) + '...',
        numberOfImages: {
          개별옵션: individualOpts.numberOfImages,
          공통옵션: imageOptions?.numberOfImages || 1,
          최종적용: finalNumberOfImages,
          출처: individualOpts.numberOfImages !== undefined ? '✅ 개별 옵션' : '⚠️ 공통 옵션'
        },
        aspectRatio: {
          개별옵션: individualOpts.aspectRatio,
          공통옵션: aspectRatio,
          최종적용: finalAspectRatio,
          출처: (individualOpts.aspectRatio && typeof individualOpts.aspectRatio === 'string') ? '✅ 개별 옵션' : '⚠️ 공통 옵션'
        },
        imageSize: {
          개별옵션: individualOpts.imageSize,
          기본값: '1K',
          최종적용: finalImageSize,
          출처: individualOpts.imageSize ? '✅ 개별 옵션' : '⚠️ 기본값'
        },
        personGeneration: {
          개별옵션: individualOpts.personGeneration,
          기본값: 'allow_adult',
          최종적용: finalPersonGeneration,
          출처: (individualOpts.personGeneration && typeof individualOpts.personGeneration === 'string') ? '✅ 개별 옵션' : '⚠️ 기본값'
        }
      });
    }
    
    return {
      enhancedPrompt,
      numberOfImages: finalNumberOfImages,
      aspectRatio: finalAspectRatio,
      imageSize: finalImageSize,
      personGeneration: finalPersonGeneration
    };
  };

  // 통합 이미지 생성 함수 (Google AI만 사용) - 여러 이미지 반환
  const generateMultipleImagesWithAPI = async (prompt: string, attachedImages: File[], type: 'character' | 'background' | 'setting' | 'settingCut') => {
    console.log('🚀 generateMultipleImagesWithAPI 호출:', { prompt, attachedImages: attachedImages.length, type, imageGenerationAPI, aspectRatio, imageOptions });
    
    // 옵션 우선순위 적용
    const { enhancedPrompt, numberOfImages: finalNumberOfImages, aspectRatio: finalAspectRatio, imageSize: finalImageSize, personGeneration: finalPersonGeneration } = applyOptionsPriority(type as 'character' | 'background' | 'settingCut', prompt);
    
    // Google AI 서비스 사용
    console.log('🔍 Google AI 서비스 사용');
    
    // 동적으로 Google AI 서비스 인스턴스 생성
    const googleAIService = createGoogleAIService();
    
    if (attachedImages.length > 0) {
      console.log('📷 첨부 이미지와 함께 생성 (단일 이미지만 지원)');
      // 첨부 이미지가 있는 경우 기존 단일 이미지 함수 사용
      switch (type) {
        case 'character':
          const singleImage = await googleAIService.generateWithImage(attachedImages[0], enhancedPrompt, finalAspectRatio);
          return [singleImage];
        case 'background':
          const singleBgImage = await googleAIService.generateBackgroundWithImage(attachedImages[0], enhancedPrompt, finalAspectRatio);
          return [singleBgImage];
        case 'setting':
        case 'settingCut':
          const singleSettingImage = await googleAIService.generateSettingCutWithImage(attachedImages[0], enhancedPrompt, finalAspectRatio);
          return [singleSettingImage];
      }
    } else {
      console.log('📝 텍스트만으로 여러 이미지 생성');
      switch (type) {
        case 'character':
          return await googleAIService.generateMultipleCharacterImages(enhancedPrompt, finalAspectRatio, finalNumberOfImages, finalPersonGeneration);
        case 'background':
          return await googleAIService.generateMultipleBackgroundImages(enhancedPrompt, finalAspectRatio, finalNumberOfImages, finalPersonGeneration);
        case 'setting':
        case 'settingCut':
          return await googleAIService.generateMultipleSettingCutImages(enhancedPrompt, finalAspectRatio, finalNumberOfImages, finalPersonGeneration);
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
      
      // 메타데이터 추출 (이미지 배열에 저장된 메타데이터)
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = (imageResults as any).__metadata || [];
      
      // 여러 이미지를 각각 캐릭터로 추가 (이미지 저장 정책 적용)
      const newCharacters = await Promise.all(imageResults.map(async (imageResult, index) => {
        const characterId = Date.now() + index;
        const metadata = metadataList[index];
        
        // 이미지 저장 서비스에 저장 (용량 초과 시 오래된 이미지 자동 삭제)
        let storedImageId: string | null = null;
        let deletedImagesCount = 0;
        try {
          const result = await imageStorageService.storeImage(
            currentProjectId || 'default',
            'character',
            imageResult,
            {
              description: characterInput,
              attachedImages: attachedImages.length,
              generatedAt: new Date().toISOString()
            }
          );
          storedImageId = result.imageId;
          deletedImagesCount = result.deletedImagesCount || 0;
          
          // 삭제된 이미지가 있으면 알림 표시
          if (deletedImagesCount > 0) {
            addNotification({
              type: 'info',
              title: '저장소 정리 완료',
              message: `브라우저 저장소 용량이 부족하여 오래된 이미지 ${deletedImagesCount}개를 자동으로 삭제했습니다.`
            });
          }
        } catch (storageError: any) {
          // localStorage 용량 초과 에러 처리
          if (storageError?.name === 'QuotaExceededError' || storageError?.message?.includes('quota') || storageError?.message?.includes('용량이 부족')) {
            console.warn('⚠️ 이미지 저장 실패: localStorage 용량 초과');
            addNotification({
              type: 'warning',
              title: '저장 경고',
              message: '이미지 생성은 완료되었지만, 브라우저 저장소 용량이 부족하여 저장되지 않았습니다. 브라우저 저장소를 수동으로 정리해주세요.'
            });
          } else {
            throw storageError;
          }
        }
        
        return {
          id: characterId,
          description: characterInput,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
          type: 'character' as const,
          generationMetadata: metadata
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
      
      // getFormattedErrorMessage를 사용하여 일관된 에러 메시지 제공
      let errorMessage = '캐릭터 생성에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = getFormattedErrorMessage(error, characterInput);
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
      const googleAIService = createGoogleAIService();
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
      
      // 메타데이터 추출
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = (imageResults as any).__metadata || [];
      
      // 여러 이미지를 각각 배경으로 추가 (이미지 저장 정책 적용)
      const newBackgrounds = await Promise.all(imageResults.map(async (imageResult, index) => {
        const backgroundId = Date.now() + index;
        const metadata = metadataList[index];
        
        // 이미지 저장 서비스에 저장 (용량 초과 시 오래된 이미지 자동 삭제)
        let storedImageId: string | null = null;
        let deletedImagesCount = 0;
        try {
          const result = await imageStorageService.storeImage(
            currentProjectId || 'default',
            'background',
            imageResult,
            {
              description: backgroundInput,
              attachedImages: attachedImages.length,
              generatedAt: new Date().toISOString()
            }
          );
          storedImageId = result.imageId;
          deletedImagesCount = result.deletedImagesCount || 0;
          
          // 삭제된 이미지가 있으면 알림 표시
          if (deletedImagesCount > 0) {
            addNotification({
              type: 'info',
              title: '저장소 정리 완료',
              message: `브라우저 저장소 용량이 부족하여 오래된 이미지 ${deletedImagesCount}개를 자동으로 삭제했습니다.`
            });
          }
        } catch (storageError: any) {
          // localStorage 용량 초과 에러 처리
          if (storageError?.name === 'QuotaExceededError' || storageError?.message?.includes('quota') || storageError?.message?.includes('용량이 부족')) {
            console.warn('⚠️ 이미지 저장 실패: localStorage 용량 초과');
            addNotification({
              type: 'warning',
              title: '저장 경고',
              message: '이미지 생성은 완료되었지만, 브라우저 저장소 용량이 부족하여 저장되지 않았습니다. 브라우저 저장소를 수동으로 정리해주세요.'
            });
          } else {
            throw storageError;
          }
        }
        
        return {
          id: backgroundId,
          description: backgroundInput,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
          type: 'background' as const,
          generationMetadata: metadata
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
      console.error('❌ 배경 생성 오류:', error);
      
      let errorMessage = '배경 생성에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = getFormattedErrorMessage(error, backgroundInput);
      }
      
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: errorMessage,
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
      const googleAIService = createGoogleAIService();
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
      
      // 메타데이터 추출
      const metadataList: Array<import('../types/project').ImageGenerationMetadata> = (imageResults as any).__metadata || [];
      
      // 여러 이미지를 각각 설정 컷으로 추가 (이미지 저장 정책 적용)
      const newSettingCuts = await Promise.all(imageResults.map(async (imageResult, index) => {
        const settingCutId = Date.now() + index;
        const metadata = metadataList[index];
        
        // 이미지 저장 서비스에 저장 (용량 초과 시 오래된 이미지 자동 삭제)
        let storedImageId: string | null = null;
        let deletedImagesCount = 0;
        try {
          const result = await imageStorageService.storeImage(
            currentProjectId || 'default',
            'settingCut',
            imageResult,
            {
              description: settingCut,
              attachedImages: attachedImages.length,
              generatedAt: new Date().toISOString()
            }
          );
          storedImageId = result.imageId;
          deletedImagesCount = result.deletedImagesCount || 0;
          
          // 삭제된 이미지가 있으면 알림 표시
          if (deletedImagesCount > 0) {
            addNotification({
              type: 'info',
              title: '저장소 정리 완료',
              message: `브라우저 저장소 용량이 부족하여 오래된 이미지 ${deletedImagesCount}개를 자동으로 삭제했습니다.`
            });
          }
        } catch (storageError: any) {
          // localStorage 용량 초과 에러 처리
          if (storageError?.name === 'QuotaExceededError' || storageError?.message?.includes('quota') || storageError?.message?.includes('용량이 부족')) {
            console.warn('⚠️ 이미지 저장 실패: localStorage 용량 초과');
            addNotification({
              type: 'warning',
              title: '저장 경고',
              message: '이미지 생성은 완료되었지만, 브라우저 저장소 용량이 부족하여 저장되지 않았습니다. 브라우저 저장소를 수동으로 정리해주세요.'
            });
          } else {
            throw storageError;
          }
        }
        
        return {
          id: settingCutId,
          description: settingCut,
          image: imageResult,
          imageStorageId: storedImageId,
          attachedImages: attachedImages,
          timestamp: new Date().toISOString(),
          type: 'setting' as const,
          generationMetadata: metadata
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
      console.error('❌ 설정 컷 생성 오류:', error);
      
      let errorMessage = '설정 컷 생성에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = getFormattedErrorMessage(error, settingCut);
      }
      
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: errorMessage,
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
      const googleAIService = createGoogleAIService();
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
      const googleAIService = createGoogleAIService();
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
      const googleAIService = createGoogleAIService();
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
      const googleAIService = createGoogleAIService();
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
