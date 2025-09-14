import { useUIStore } from '../stores/uiStore';
import { googleAIService } from '../services/googleAIService';
import { downloadBase64Image, downloadText, downloadVideo } from '../utils/downloadUtils';

export const useVideoHandlers = (
  generatedTextCards: any[],
  setGeneratedTextCards: React.Dispatch<React.SetStateAction<any[]>>,
  generatedCharacterImages: any[],
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<any[]>>,
  generatedVideoBackgrounds: any[],
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<any[]>>,
  generatedVideos: any[],
  setGeneratedVideos: React.Dispatch<React.SetStateAction<any[]>>,
  generatedProjectData: any
) => {
  const { addNotification } = useUIStore();

  const handleGenerateTextCard = async (storySceneInput: string) => {
    if (!storySceneInput.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '스토리/장면을 입력해주세요.',
      });
      return;
    }

    try {
      const prompt = `다음 스토리/장면을 바탕으로 영상 제작용 텍스트 카드를 생성해주세요:

${storySceneInput}

컷별로 나누어 상세한 텍스트 카드를 만들어주세요.`;

      const result = await googleAIService.generateText(prompt);
      
      const newTextCard = {
        id: Date.now(),
        generatedText: result,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedTextCards([...generatedTextCards, newTextCard]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '텍스트 카드가 생성되었습니다.',
      });
    } catch (error) {
      console.error('텍스트 카드 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '텍스트 카드 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleEditTextCard = (cardId: number, newText: string) => {
    setGeneratedTextCards((prev: any[]) =>
      prev.map((card: any) =>
        card.id === cardId
          ? { ...card, generatedText: newText }
          : card
      )
    );
  };

  const handleDeleteTextCardOld = (cardId: number) => {
    setGeneratedTextCards((prev: any[]) => prev.filter((card: any) => card.id !== cardId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '텍스트 카드가 삭제되었습니다.',
    });
  };

  const handleGenerateCharacterImage = async (characterOutfitInput: string, attachedImages: File[]) => {
    if (!characterOutfitInput.trim() && attachedImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '캐릭터/의상을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }

    try {
      const imageResult = await googleAIService.generateCharacterImage(characterOutfitInput);
      
      const newCharacterImage = {
        id: Date.now(),
        description: characterOutfitInput,
        image: imageResult,
        attachedImages: attachedImages,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedCharacterImages([...generatedCharacterImages, newCharacterImage]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 이미지가 생성되었습니다.',
      });
    } catch (error) {
      console.error('캐릭터 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleGenerateCharacterVideo = async () => {
    // 영상 생성 로직
    addNotification({
      type: 'info',
      title: '기능 준비 중',
      message: '영상 생성 기능은 준비 중입니다.',
    });
  };

  const handleRegenerateCharacterVideo = async (videoId: number) => {
    // 영상 재생성 로직
    addNotification({
      type: 'info',
      title: '기능 준비 중',
      message: '영상 재생성 기능은 준비 중입니다.',
    });
  };

  const handleDeleteCharacterVideo = (videoId: number) => {
    setGeneratedVideos((prev: any[]) => prev.filter((video: any) => video.id !== videoId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '영상이 삭제되었습니다.',
    });
  };

  const handleGenerateVideoBackground = async (videoBackgroundInput: string, attachedImages: File[]) => {
    if (!videoBackgroundInput.trim() && attachedImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }

    try {
      const imageResult = await googleAIService.generateBackgroundImage(videoBackgroundInput);
      
      const newVideoBackground = {
        id: Date.now(),
        description: videoBackgroundInput,
        image: imageResult,
        attachedImages: attachedImages,
        timestamp: new Date().toISOString(),
      };
      
      setGeneratedVideoBackgrounds([...generatedVideoBackgrounds, newVideoBackground]);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '배경이 생성되었습니다.',
      });
    } catch (error) {
      console.error('배경 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateVideoBackgroundOld = async (backgroundId: number) => {
    try {
      const background = generatedVideoBackgrounds.find(bg => bg.id === backgroundId);
      if (!background) return;

      const imageResult = await googleAIService.generateBackgroundImage(background.description);
      
      setGeneratedVideoBackgrounds((prev: any[]) =>
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

  const handleDeleteVideoBackgroundOld = (backgroundId: number) => {
    setGeneratedVideoBackgrounds((prev: any[]) => prev.filter((bg: any) => bg.id !== backgroundId));
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '배경이 삭제되었습니다.',
    });
  };

  const handleGenerateVideoThumbnail = async () => {
    addNotification({
      type: 'info',
      title: '기능 준비 중',
      message: '영상 썸네일 생성 기능은 준비 중입니다.',
    });
  };

  const handleGenerateAIVideo = async () => {
    addNotification({
      type: 'info',
      title: '기능 준비 중',
      message: 'AI 영상 생성 기능은 준비 중입니다.',
    });
  };

  // 전체 재생성 기능들
  const handleRegenerateAllTextCards = async () => {
    if (generatedTextCards.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 텍스트 카드가 없습니다.',
      });
      return;
    }

    try {
      const newTextCards = [];
      for (const card of generatedTextCards) {
        const result = await googleAIService.generateText(card.generatedText);
        newTextCards.push({
          ...card,
          generatedText: result,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedTextCards(newTextCards);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 텍스트 카드가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '텍스트 카드 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateAllCharacterImages = async () => {
    if (generatedCharacterImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 캐릭터 이미지가 없습니다.',
      });
      return;
    }

    try {
      const newImages = [];
      for (const image of generatedCharacterImages) {
        const result = await googleAIService.generateCharacterImage(image.input);
        newImages.push({
          ...image,
          image: result,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedCharacterImages(newImages);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 캐릭터 이미지가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 이미지 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateAllVideoBackgrounds = async () => {
    if (generatedVideoBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 영상 배경이 없습니다.',
      });
      return;
    }

    try {
      const newBackgrounds = [];
      for (const background of generatedVideoBackgrounds) {
        const result = await googleAIService.generateBackgroundImage(background.input);
        newBackgrounds.push({
          ...background,
          image: result,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedVideoBackgrounds(newBackgrounds);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 영상 배경이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '영상 배경 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateAllVideos = async () => {
    if (generatedVideos.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 영상이 없습니다.',
      });
      return;
    }

    try {
      const newVideos = [];
      for (const video of generatedVideos) {
        const result = await googleAIService.generateVideo(video.projectTexts.join(' '), video.videoRatio);
        newVideos.push({
          ...video,
          video: result,
          timestamp: new Date().toISOString(),
        });
      }
      
      setGeneratedVideos(newVideos);
      addNotification({
        type: 'success',
        title: '전체 재생성 완료',
        message: '모든 영상이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '영상 전체 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  // 개별 재생성 기능들
  const handleRegenerateTextCard = async (id: number) => {
    const card = generatedTextCards.find(c => c.id === id);
    if (!card) return;

    try {
      const result = await googleAIService.generateText(card.generatedText);
      setGeneratedTextCards(prev => prev.map(c => 
        c.id === id ? { ...c, generatedText: result, timestamp: new Date().toISOString() } : c
      ));
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '텍스트 카드가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '텍스트 카드 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateCharacterImage = async (id: number) => {
    const image = generatedCharacterImages.find(i => i.id === id);
    if (!image) return;

    try {
      const result = await googleAIService.generateCharacterImage(image.input);
      setGeneratedCharacterImages(prev => prev.map(i => 
        i.id === id ? { ...i, image: result, timestamp: new Date().toISOString() } : i
      ));
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '캐릭터 이미지가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 이미지 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateVideoBackground = async (id: number) => {
    const background = generatedVideoBackgrounds.find(b => b.id === id);
    if (!background) return;

    try {
      const result = await googleAIService.generateBackgroundImage(background.input);
      setGeneratedVideoBackgrounds(prev => prev.map(b => 
        b.id === id ? { ...b, image: result, timestamp: new Date().toISOString() } : b
      ));
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '영상 배경이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '영상 배경 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateVideo = async (id: number) => {
    const video = generatedVideos.find(v => v.id === id);
    if (!video) return;

    try {
      const result = await googleAIService.generateVideo(video.projectTexts.join(' '), video.videoRatio);
      setGeneratedVideos(prev => prev.map(v => 
        v.id === id ? { ...v, video: result, timestamp: new Date().toISOString() } : v
      ));
      addNotification({
        type: 'success',
        title: '재생성 완료',
        message: '영상이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '영상 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  // 삭제 기능들
  const handleDeleteTextCard = (id: number) => {
    setGeneratedTextCards(prev => prev.filter(c => c.id !== id));
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '텍스트 카드가 삭제되었습니다.',
    });
  };

  const handleDeleteCharacterImage = (id: number) => {
    setGeneratedCharacterImages(prev => prev.filter(i => i.id !== id));
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '캐릭터 이미지가 삭제되었습니다.',
    });
  };

  const handleDeleteVideoBackground = (id: number) => {
    setGeneratedVideoBackgrounds(prev => prev.filter(b => b.id !== id));
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '영상 배경이 삭제되었습니다.',
    });
  };

  const handleDeleteVideo = (id: number) => {
    setGeneratedVideos(prev => prev.filter(v => v.id !== id));
    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '영상이 삭제되었습니다.',
    });
  };

  // 저장 기능들
  const handleSaveTextCard = (id: number) => {
    const textCard = generatedTextCards.find(card => card.id === id);
    if (!textCard) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '텍스트 카드를 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `text_card_${id}_${new Date().toISOString().slice(0, 10)}.txt`;
    const success = downloadText(textCard.generatedText, filename);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `텍스트 카드가 다운로드되었습니다: ${filename}`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '텍스트 카드 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveCharacterImage = (id: number) => {
    const characterImage = generatedCharacterImages.find(img => img.id === id);
    if (!characterImage || !characterImage.image) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '캐릭터 이미지를 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `character_${id}_${new Date().toISOString().slice(0, 10)}.jpg`;
    const success = downloadBase64Image(characterImage.image, filename);
    
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

  const handleSaveVideoBackground = (id: number) => {
    const background = generatedVideoBackgrounds.find(bg => bg.id === id);
    if (!background || !background.image) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '영상 배경을 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `video_background_${id}_${new Date().toISOString().slice(0, 10)}.jpg`;
    const success = downloadBase64Image(background.image, filename);
    
    if (success) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `영상 배경이 다운로드되었습니다: ${filename}`,
      });
    } else {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  const handleSaveVideo = async (id: number) => {
    const video = generatedVideos.find(v => v.id === id);
    if (!video || !video.video) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '영상을 찾을 수 없습니다.',
      });
      return;
    }

    const filename = `video_${id}_${new Date().toISOString().slice(0, 10)}.mp4`;
    
    try {
      const success = await downloadVideo(video.video, filename);
      
      if (success) {
        addNotification({
          type: 'success',
          title: '저장 완료',
          message: `영상이 다운로드되었습니다: ${filename}`,
        });
      } else {
        addNotification({
          type: 'error',
          title: '저장 실패',
          message: '영상 다운로드에 실패했습니다.',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '영상 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  const handleSaveAllTextCards = () => {
    if (generatedTextCards.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 텍스트 카드가 없습니다.',
      });
      return;
    }

    let successCount = 0;
    generatedTextCards.forEach((card, index) => {
      const filename = `text_card_${card.id}_${new Date().toISOString().slice(0, 10)}.txt`;
      const success = downloadText(card.generatedText, filename);
      if (success) successCount++;
    });

    if (successCount === generatedTextCards.length) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `모든 텍스트 카드(${successCount}개)가 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'warning',
        title: '부분 저장 완료',
        message: `${successCount}/${generatedTextCards.length}개 텍스트 카드가 다운로드되었습니다.`,
      });
    }
  };

  const handleSaveAllCharacterImages = () => {
    if (generatedCharacterImages.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 캐릭터 이미지가 없습니다.',
      });
      return;
    }

    let successCount = 0;
    generatedCharacterImages.forEach((image) => {
      if (image.image) {
        const filename = `character_${image.id}_${new Date().toISOString().slice(0, 10)}.jpg`;
        const success = downloadBase64Image(image.image, filename);
        if (success) successCount++;
      }
    });

    if (successCount === generatedCharacterImages.length) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `모든 캐릭터 이미지(${successCount}개)가 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'warning',
        title: '부분 저장 완료',
        message: `${successCount}/${generatedCharacterImages.length}개 캐릭터 이미지가 다운로드되었습니다.`,
      });
    }
  };

  const handleSaveAllVideoBackgrounds = () => {
    if (generatedVideoBackgrounds.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 영상 배경이 없습니다.',
      });
      return;
    }

    let successCount = 0;
    generatedVideoBackgrounds.forEach((background) => {
      if (background.image) {
        const filename = `video_background_${background.id}_${new Date().toISOString().slice(0, 10)}.jpg`;
        const success = downloadBase64Image(background.image, filename);
        if (success) successCount++;
      }
    });

    if (successCount === generatedVideoBackgrounds.length) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `모든 영상 배경(${successCount}개)이 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'warning',
        title: '부분 저장 완료',
        message: `${successCount}/${generatedVideoBackgrounds.length}개 영상 배경이 다운로드되었습니다.`,
      });
    }
  };

  const handleSaveAllVideos = async () => {
    if (generatedVideos.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '저장할 영상이 없습니다.',
      });
      return;
    }

    let successCount = 0;
    for (const video of generatedVideos) {
      if (video.video) {
        const filename = `video_${video.id}_${new Date().toISOString().slice(0, 10)}.mp4`;
        try {
          const success = await downloadVideo(video.video, filename);
          if (success) successCount++;
        } catch (error) {
          console.error('영상 다운로드 오류:', error);
        }
      }
    }

    if (successCount === generatedVideos.length) {
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: `모든 영상(${successCount}개)이 다운로드되었습니다.`,
      });
    } else {
      addNotification({
        type: 'warning',
        title: '부분 저장 완료',
        message: `${successCount}/${generatedVideos.length}개 영상이 다운로드되었습니다.`,
      });
    }
  };

  return {
    handleGenerateTextCard,
    handleEditTextCard,
    handleDeleteTextCardOld,
    handleGenerateCharacterImage,
    handleGenerateCharacterVideo,
    handleRegenerateCharacterVideo,
    handleDeleteCharacterVideo,
    handleGenerateVideoBackground,
    handleRegenerateVideoBackgroundOld,
    handleDeleteVideoBackgroundOld,
    handleGenerateVideoThumbnail,
    handleGenerateAIVideo,
    // 전체 재생성 기능들
    handleRegenerateAllTextCards,
    handleRegenerateAllCharacterImages,
    handleRegenerateAllVideoBackgrounds,
    handleRegenerateAllVideos,
    // 개별 재생성 기능들
    handleRegenerateTextCard,
    handleRegenerateCharacterImage,
    handleRegenerateVideoBackground,
    handleRegenerateVideo,
    // 삭제 기능들
    handleDeleteTextCard,
    handleDeleteCharacterImage,
    handleDeleteVideoBackground,
    handleDeleteVideo,
    // 저장 기능들
    handleSaveTextCard,
    handleSaveCharacterImage,
    handleSaveVideoBackground,
    handleSaveVideo,
    handleSaveAllTextCards,
    handleSaveAllCharacterImages,
    handleSaveAllVideoBackgrounds,
    handleSaveAllVideos,
  };
};
