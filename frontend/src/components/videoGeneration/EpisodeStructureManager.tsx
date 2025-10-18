import React, { useCallback, useEffect } from 'react';
import { Episode } from '../../types/projectOverview';
import { CommonInputsSection } from '../shared/CommonInputsSection';
import { useUIStore } from '../../stores/uiStore';
import { storageOptimizationService } from '../../services/storageOptimizationService';

interface EpisodeStructureManagerProps {
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  showEpisodeStructure: boolean;
  setShowEpisodeStructure: (show: boolean) => void;
  story: string;
  characterList: any[];
  storySummary?: string;
  onCommonInputsComplete?: () => void;
  onCommonInputsReset?: () => void;
  onStoryChange?: (story: string) => void;
  onCharacterListChange?: (characters: any[]) => void;
  onStorySummaryChange?: (summary: string) => void;
  // 헤딩 정보와 공통 입력 항목 데이터 추가
  videoTitle?: string;
  videoDescription?: string;
  videoNotes?: string;
  finalScenario?: string;
  generatedProjectData?: any;
  // 비활성화 상태
  isDisabled?: boolean;
  // 초기화 경고 처리
  onResetWithWarning?: (resetAction: () => void) => void;
}

export const EpisodeStructureManager: React.FC<EpisodeStructureManagerProps> = React.memo(({
  episodes,
  setEpisodes,
  showEpisodeStructure,
  setShowEpisodeStructure,
  story,
  characterList,
  storySummary,
  onCommonInputsComplete,
  onCommonInputsReset,
  onStoryChange,
  onCharacterListChange,
  onStorySummaryChange,
  // 헤딩 정보와 공통 입력 항목 데이터
  videoTitle,
  videoDescription,
  videoNotes,
  finalScenario,
  generatedProjectData,
  // 비활성화 상태
  isDisabled = false,
  // 초기화 경고 처리
  onResetWithWarning
}) => {
  const { addNotification } = useUIStore();

  // 에피소드 구조를 프로젝트 참조에 업로드
  const handleUploadToReference = useCallback(() => {
    if (episodes.length === 0) {
      addNotification({
        type: 'warning',
        title: '업로드 불가',
        message: '업로드할 에피소드 구조가 없습니다.',
      });
      return;
    }

    try {
      // 에피소드 구조를 JSON으로 변환
      const episodeData = {
        episodes: episodes,
        story: story,
        characterList: characterList,
        storySummary: storySummary,
        timestamp: new Date().toISOString(),
        type: 'episode_structure'
      };

      // localStorage에 저장
      const existingData = JSON.parse(localStorage.getItem('projectReferenceData') || '{}');
      existingData.episodeStructure = episodeData;
      localStorage.setItem('projectReferenceData', JSON.stringify(existingData));

      addNotification({
        type: 'success',
        title: '업로드 완료',
        message: `${episodes.length}개 에피소드 구조가 프로젝트 참조에 업로드되었습니다.`,
      });
    } catch (error) {
      console.error('에피소드 구조 업로드 오류:', error);
      addNotification({
        type: 'error',
        title: '업로드 실패',
        message: '에피소드 구조 업로드에 실패했습니다.',
      });
    }
  }, [episodes, story, characterList, storySummary, addNotification]);

  // 에피소드별 텍스트 카드 생성 함수
  const handleGenerateEpisodeTextCards = useCallback(async (episodeIndex: number) => {
    console.log('🎬 에피소드 텍스트 카드 생성 시작:', { 
      episodeIndex, 
      story, 
      characterList, 
      episodes,
      videoTitle,
      videoDescription,
      videoNotes,
      finalScenario,
      generatedProjectData
    });
    
    // 헤딩 정보와 공통 입력 항목에서 데이터 수집
    const effectiveStory = story || videoTitle || '기본 스토리';
    const effectiveCharacterList = characterList.length > 0 ? characterList : 
      (generatedProjectData?.koreanCards?.['캐릭터 설정'] ? 
        [{ name: '주인공', description: generatedProjectData.koreanCards['캐릭터 설정'] }] : 
        [{ name: '주인공', description: '주요 캐릭터' }]);
    const effectiveStorySummary = storySummary || videoDescription || videoNotes || '스토리 요약';
    
    console.log('📊 수집된 데이터:', {
      effectiveStory,
      effectiveCharacterList,
      effectiveStorySummary
    });
    
    if (!effectiveStory || effectiveCharacterList.length === 0) {
      console.log('❌ 입력 검증 실패:', { 
        effectiveStory: !!effectiveStory, 
        effectiveCharacterListLength: effectiveCharacterList.length 
      });
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 먼저 입력해주세요. 헤딩 정보나 공통 입력 항목에서 데이터를 확인할 수 없습니다.',
      });
      return;
    }

    const selectedEpisode = episodes[episodeIndex];
    if (!selectedEpisode) {
      console.log('❌ 에피소드 찾기 실패:', { episodeIndex, episodesLength: episodes.length });
      addNotification({
        type: 'error',
        title: '에피소드 오류',
        message: '선택된 에피소드를 찾을 수 없습니다.',
      });
      return;
    }

    console.log('✅ 검증 통과, AI 호출 시작:', selectedEpisode);

    try {
      const prompt = `다음 정보를 바탕으로 영상 제작용 프롬프트 카드를 생성해주세요:

=== 프로젝트 정보 ===
에피소드 제목: ${selectedEpisode.title}
에피소드 설명: ${selectedEpisode.description}
기본 스토리: ${effectiveStory}
캐릭터 설정: ${effectiveCharacterList.map(c => `${c.name}: ${c.description}`).join(', ')}
스토리 요약: ${effectiveStorySummary}
${finalScenario ? `최종 시나리오: ${finalScenario}` : ''}
${videoTitle ? `영상 제목: ${videoTitle}` : ''}
${videoDescription ? `영상 설명: ${videoDescription}` : ''}
${videoNotes ? `영상 노트: ${videoNotes}` : ''}

=== 씬 구성 ===
        ${selectedEpisode.scenes.map((scene: any, index: number) =>
  `씬 ${index + 1}: ${scene.title}
- 설명: ${scene.description}
- 컷 수: ${scene.cuts || 3}개`
).join('\n')}

=== 요청사항 ===
각 씬을 다음과 같이 구성하여 생성해주세요:

**씬 공통 설정 (모든 컷에 공통 적용)**:
- 색감 및 톤 (따뜻한 톤, 차가운 톤, 대비 등)
- 분위기 (긴장감, 로맨틱, 코믹, 드라마틱 등)
- 조명 설정 (자연광, 인공조명, 색온도, 방향 등)
- 배경 및 소품 (구체적인 배경 묘사, 중요한 소품)
- 영상 종류 (실사, 애니메이션, 드로잉 등)
- 음향 효과 (배경음악, 환경음, 효과음 등)
- 캐릭터 설정 (주요 캐릭터의 기본 상태, 감정, 행동)

**컷별 설정 (각 컷마다 다르게 적용)**:
- 카메라 앵글 (와이드샷, 미디엄샷, 클로즈업, 팬, 틸트 등)
- 촬영 기법 (정적, 동적, 줌인/아웃 등)
- 편집 포인트 (컷, 페이드, 디졸브 등)
- 전환효과 (다음 컷과의 연결 방식)
- 지속시간 (각 컷의 예상 지속시간)
- 캐릭터 및 대사 (씬 설명에 언급된 캐릭터들과 실제 대화 내용을 반영한 자연스러운 대사)
- 캐릭터 감정 및 표정 (씬의 분위기와 상황에 맞는 캐릭터의 감정 상태와 표정)
- 스토리 연속성 (이전 컷과의 연결성, 다음 컷으로의 자연스러운 전개)

=== 출력 형식 ===
씬 1: [씬 제목]

**씬 공통 설정:**
- 색감 및 톤: [구체적인 색감 설정]
- 분위기: [씬의 전체적인 분위기]
- 조명 설정: [조명의 종류와 방향]
- 배경 및 소품: [배경과 중요한 소품]
- 영상 종류: [실사/애니메이션 등]
- 음향 효과: [배경음악, 효과음 등]
- 캐릭터 설정: [캐릭터의 기본 상태]

**컷별 설정:**
컷 1: [카메라 앵글, 촬영 기법, 편집 포인트, 전환효과, 지속시간, 등장 캐릭터와 자연스러운 대사, 캐릭터 감정 및 표정, 스토리 연속성]
컷 2: [카메라 앵글, 촬영 기법, 편집 포인트, 전환효과, 지속시간, 등장 캐릭터와 자연스러운 대사, 캐릭터 감정 및 표정, 스토리 연속성]
컷 3: [카메라 앵글, 촬영 기법, 편집 포인트, 전환효과, 지속시간, 등장 캐릭터와 자연스러운 대사, 캐릭터 감정 및 표정, 스토리 연속성]

씬 2: [씬 제목]
...

각 컷은 서로 다른 카메라 앵글과 촬영 기법을 가져야 하며, 씬 공통 설정은 모든 컷에 일관되게 적용되어야 합니다.

**중요한 지시사항:**
1. 씬 설명에 언급된 캐릭터들을 정확히 반영하여 대사를 생성하세요.
2. 각 컷의 대사는 씬의 상황과 분위기에 맞게 자연스럽게 연결되어야 합니다.
3. 캐릭터별로 다른 대사와 감정을 표현하세요.
4. 컷 간의 스토리 흐름이 자연스럽게 이어지도록 하세요.
5. 씬 설명에 포함된 구체적인 대화 내용이 있다면 반드시 반영하세요.`;

      console.log('📝 프롬프트 생성 완료, 길이:', prompt.length);
      console.log('🔑 API 키 확인:', !!process.env.REACT_APP_GEMINI_API_KEY);

      const { googleAIService } = await import('../../services/googleAIService');
      console.log('📡 Google AI 서비스 로드 완료');
      
      const result = await googleAIService.generateText(prompt);
      console.log('🤖 AI 응답 받음:', result ? '성공' : '실패', result?.length || 0);

      if (result) {
        console.log('🎬 에피소드 텍스트 카드 생성 결과:', result);
        
        const episodeTextCards: any[] = [];
        let cutId = 1;

        selectedEpisode.scenes.forEach((scene: any, sceneIndex: number) => {
          const cutCount = scene.cuts || 3;
          
          // AI 응답에서 해당 씬 정보 추출
          const scenePattern = new RegExp(`씬\\s*${sceneIndex + 1}[\\s\\S]*?(?=씬\\s*${sceneIndex + 2}|$)`, 'i');
          const sceneMatch = result.match(scenePattern);
          
          let sceneCommonSettings = '';
          let cutSettings: string[] = [];
          
          if (sceneMatch) {
            const sceneContent = sceneMatch[0];
            
            // 씬 공통 설정 추출
            const commonPattern = /씬 공통 설정:([\s\S]*?)(?=컷별 설정:|$)/i;
            const commonMatch = sceneContent.match(commonPattern);
            if (commonMatch && commonMatch[1]) {
              sceneCommonSettings = commonMatch[1].trim();
            }
            
            // 컷별 설정 추출
            const cutPattern = /컷\s*(\d+):\s*([^컷]*?)(?=컷\s*\d+:|$)/gi;
            let cutMatch;
            while ((cutMatch = cutPattern.exec(sceneContent)) !== null) {
              const cutNumber = parseInt(cutMatch[1]);
              const cutText = cutMatch[2].trim();
              if (cutNumber <= cutCount) {
                cutSettings[cutNumber - 1] = cutText;
              }
            }
          }
          
          // 씬별로 텍스트 카드 생성
          const sceneCutCards = Array.from({ length: cutCount }, (_, cutIndex) => {
            let cutText = cutSettings[cutIndex] || '';
            
            // 컷별 텍스트가 없으면 씬 설명 기반 기본 텍스트 생성
            if (!cutText) {
              const cameraAngles = ['와이드샷 (전체 배경과 캐릭터 포함)', '미디엄샷 (캐릭터 상반신 중심)', '클로즈업 (캐릭터 얼굴 또는 중요한 소품)'];
              const techniques = ['정적 촬영 (안정적인 구도)', '동적 촬영 (팬-틸트)', '줌 촬영 (줌인-아웃)'];
              const transitions = ['컷 전환', '페이드 전환', '디졸브 전환'];
              const durations = ['5-7초', '3-5초', '2-4초'];
              
              // 씬 설명에서 캐릭터와 대사 추출
              const sceneDescription = scene.description.toLowerCase();
              let characters = [];
              let dialogues = [];
              let emotions = [];
              
              // 씬 설명에서 캐릭터 이름 추출
              if (sceneDescription.includes('진') && sceneDescription.includes('지나')) {
                characters = ['진', '지나'];
                if (cutIndex === 0) {
                  dialogues = ['진: "오늘은 날씨가 정말 좋네요!"', '지나: "네, 정말 기분이 좋아요!"'];
                  emotions = ['밝고 활기찬 표정', '즐거운 미소'];
                } else if (cutIndex === 1) {
                  dialogues = ['진: "한옥마을이 정말 아름답네요."', '지나: "전통 건물들이 멋져요!"'];
                  emotions = ['감탄하는 표정', '흥미로운 표정'];
                } else {
                  dialogues = ['진: "함께 걸어보는 게 어떨까요?"', '지나: "좋은 아이디어예요!"'];
                  emotions = ['제안하는 표정', '동의하는 표정'];
                }
              } else if (sceneDescription.includes('외국인') || sceneDescription.includes('관광객')) {
                characters = ['진', '외국인 관광객'];
                if (cutIndex === 0) {
                  dialogues = ['외국인: "Excuse me, where is the cafe?"', '진: "아, 카페를 찾고 계시는군요!"'];
                  emotions = ['당황한 표정', '친절한 표정'];
                } else if (cutIndex === 1) {
                  dialogues = ['진: "이쪽으로 가시면 됩니다."', '외국인: "Thank you very much!"'];
                  emotions = ['안내하는 표정', '감사한 표정'];
                } else {
                  dialogues = ['진: "한옥마을을 즐겁게 둘러보세요!"', '외국인: "I will, thank you!"'];
                  emotions = ['환영하는 표정', '만족한 표정'];
                }
              } else {
                // 기본 케이스 - 캐릭터 리스트에서 추출
                characters = effectiveCharacterList.length > 0 ? [effectiveCharacterList[0].name] : ['주인공'];
                dialogues = [
                  `${characters[0]}: "여기서 만나게 되어 반가워요."`,
                  `${characters[0]}: "이곳이 정말 멋진 곳이네요."`,
                  `${characters[0]}: "함께 시간을 보내는 게 좋겠어요."`
                ];
                emotions = ['자연스러운 표정', '감정이 드러나는 표정', '강렬한 감정 표현'];
              }
              
              const currentCharacter = characters[cutIndex % characters.length] || characters[0];
              const currentDialogue = dialogues[cutIndex % dialogues.length] || dialogues[0];
              const currentEmotion = emotions[cutIndex % emotions.length] || emotions[0];
              
              cutText = `컷 ${cutIndex + 1}: ${scene.title}의 ${cutIndex + 1}번째 장면

=== 컷별 영상 제작 지시사항 ===
📹 카메라 앵글: ${cameraAngles[cutIndex % cameraAngles.length]}
🎬 촬영 기법: ${techniques[cutIndex % techniques.length]}
✂️ 편집 포인트: ${cutIndex === cutCount - 1 ? '씬 마무리' : '다음 컷 연결'}
🔄 전환효과: ${transitions[cutIndex % transitions.length]}
⏱️ 지속시간: ${durations[cutIndex % durations.length]}

=== 캐릭터 및 대사 ===
👤 등장 캐릭터: ${currentCharacter}
💬 대사: ${currentDialogue}
😊 캐릭터 감정 및 표정: ${currentEmotion}

=== 추가 제작 노트 ===
- 촬영 순서: ${cutIndex + 1}/${cutCount}
- 편집 포인트: ${cutIndex === cutCount - 1 ? '다음 씬으로의 자연스러운 연결' : '다음 컷과의 연속성'}
- 특별 주의사항: ${cutIndex === 0 ? '씬 시작의 임팩트' : cutIndex === cutCount - 1 ? '씬 마무리의 여운' : '중간 컷의 안정성'}`;
            }

            return {
              id: Date.now() + cutId++,
              cutNumber: cutIndex + 1,
              text: cutText,
              selected: true,
              timestamp: new Date().toISOString()
            };
          });

          episodeTextCards.push({
            id: Date.now() + sceneIndex,
            sceneId: scene.id,
            sceneTitle: scene.title,
            sceneDescription: scene.description,
            sceneCommonSettings: sceneCommonSettings || `씬 공통 설정:
- 색감 및 톤: ${scene.description.includes('따뜻') ? '따뜻한 톤' : scene.description.includes('차가운') ? '차가운 톤' : '자연스러운 톤'}
- 분위기: ${scene.description.includes('긴장') ? '긴장감 있는 분위기' : scene.description.includes('로맨틱') ? '로맨틱한 분위기' : '자연스러운 분위기'}
- 조명 설정: 자연광 중심, 부드러운 그림자
- 배경 및 소품: ${scene.description || '씬에 맞는 배경과 소품'}
- 영상 종류: 실사 영상
- 음향 효과: 배경음악과 환경음
- 캐릭터 설정: ${effectiveCharacterList.length > 0 ? effectiveCharacterList[0].name : '주인공'}의 자연스러운 연기`,
            cuts: sceneCutCards,
            showScene: true,
            timestamp: new Date().toISOString()
          });
        });

        // 기존 에피소드 텍스트 카드 삭제 후 새로 저장
        const existingCards = JSON.parse(localStorage.getItem('generatedSceneTextCards') || '[]');
        const filteredCards = existingCards.filter((card: any) => 
          !selectedEpisode.scenes.some((scene: any) => scene.id === card.sceneId)
        );
        const updatedCards = [...filteredCards, ...episodeTextCards];
        localStorage.setItem('generatedSceneTextCards', JSON.stringify(updatedCards));

        console.log('💾 텍스트 카드 저장 완료:', updatedCards.length);

        addNotification({
          type: 'success',
          title: '에피소드 텍스트 카드 생성 완료',
          message: `${selectedEpisode.title} 에피소드의 ${episodeTextCards.length}개 씬 텍스트 카드가 생성되었습니다.`,
        });
      } else {
        console.log('❌ AI 응답이 비어있음');
        addNotification({
          type: 'error',
          title: '생성 실패',
          message: 'AI가 응답을 생성하지 못했습니다.',
        });
      }
    } catch (error) {
      console.error('에피소드 텍스트 카드 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `에피소드 텍스트 카드 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [story, characterList, storySummary, episodes, addNotification, videoTitle, videoDescription, videoNotes, finalScenario, generatedProjectData]);

  // localStorage에서 에피소드 데이터 로드
  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const savedEpisodes = storageOptimizationService.loadEpisodeStructure();
        if (Array.isArray(savedEpisodes) && savedEpisodes.length > 0) {
          setEpisodes(savedEpisodes);
          console.log('✅ 에피소드 구조 데이터 로드 완료:', savedEpisodes.length, '개');
        }
      } catch (error) {
        console.error('❌ 에피소드 데이터 로드 실패:', error);
        addNotification({
          type: 'error',
          title: '데이터 로드 실패',
          message: '에피소드 구조 데이터를 불러오는데 실패했습니다.',
        });
      }
    };

    loadEpisodes();
  }, [setEpisodes, addNotification]);

  // 에피소드 데이터를 localStorage에 저장
  const saveEpisodesToStorage = useCallback(async (newEpisodes: Episode[]) => {
    try {
      await storageOptimizationService.saveEpisodeStructure(newEpisodes);
      console.log('✅ 에피소드 구조 데이터 저장 완료');
      
      // 커스텀 이벤트 발생하여 다른 컴포넌트에 알림
      window.dispatchEvent(new CustomEvent('episodeStructureUpdated', {
        detail: { episodes: newEpisodes }
      }));
    } catch (error) {
      console.error('❌ 에피소드 데이터 저장 실패:', error);
      addNotification({
        type: 'error',
        title: '데이터 저장 실패',
        message: '에피소드 구조 데이터 저장에 실패했습니다. 스토리지 용량을 확인해주세요.',
      });
    }
  }, [addNotification]);

  // 에피소드 추가 (하나의 에피소드만 유지)
  const addEpisode = useCallback(() => {
    if (episodes.length >= 1) {
      addNotification({
        type: 'warning',
        title: '에피소드 제한',
        message: '하나의 에피소드만 생성할 수 있습니다. 기존 에피소드를 삭제한 후 새로 생성해주세요.',
      });
      return;
    }

    const newEpisode = {
      id: episodes.length + 1,
      title: `에피소드 ${episodes.length + 1}`,
      description: '',
      scenes: []
    };
    const updatedEpisodes = [...episodes, newEpisode];
    setEpisodes(updatedEpisodes);
    saveEpisodesToStorage(updatedEpisodes);
  }, [episodes, setEpisodes, saveEpisodesToStorage, addNotification]);

  // 에피소드 삭제 (텍스트 카드도 함께 삭제)
  const deleteEpisode = useCallback((episodeIndex: number) => {
    const episodeToDelete = episodes[episodeIndex];
    if (!episodeToDelete) return;

    // 해당 에피소드의 씬들과 관련된 텍스트 카드 삭제
    const existingCards = JSON.parse(localStorage.getItem('generatedSceneTextCards') || '[]');
    const filteredCards = existingCards.filter((card: any) => 
      !episodeToDelete.scenes.some((scene: any) => scene.id === card.sceneId)
    );
    localStorage.setItem('generatedSceneTextCards', JSON.stringify(filteredCards));

    const updatedEpisodes = episodes.filter((_, index) => index !== episodeIndex);
    setEpisodes(updatedEpisodes);
    saveEpisodesToStorage(updatedEpisodes);

    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: `${episodeToDelete.title} 에피소드와 관련 텍스트 카드가 삭제되었습니다.`,
    });
  }, [episodes, setEpisodes, saveEpisodesToStorage, addNotification]);

  // 씬 추가
  const addScene = useCallback((episodeIndex: number) => {
    const newScene = {
      id: Date.now(),
      title: '',
      description: '',
      cuts: 1
    };
    const updatedEpisodes = episodes.map((episode, index) => 
      index === episodeIndex 
        ? { ...episode, scenes: [...episode.scenes, newScene] }
        : episode
    );
    setEpisodes(updatedEpisodes);
    saveEpisodesToStorage(updatedEpisodes);
  }, [episodes, setEpisodes, saveEpisodesToStorage]);

  // 에피소드 업데이트
  const updateEpisode = useCallback(async (index: number, field: string, value: string) => {
    const updatedEpisodes = episodes.map((episode, i) => 
      i === index 
        ? { ...episode, [field]: value }
        : episode
    );
    setEpisodes(updatedEpisodes);
    
    // 비동기 저장 (에러 처리 포함)
    try {
      await saveEpisodesToStorage(updatedEpisodes);
    } catch (error) {
      console.error('에피소드 업데이트 저장 실패:', error);
    }
  }, [episodes, setEpisodes, saveEpisodesToStorage]);

  // 씬 업데이트
  const updateScene = useCallback(async (episodeIndex: number, sceneIndex: number, field: string, value: string | number) => {
    const updatedEpisodes = episodes.map((episode, index) => 
      index === episodeIndex 
        ? {
            ...episode,
            scenes: episode.scenes.map((scene: any, sIndex: number) => 
              sIndex === sceneIndex 
                ? { ...scene, [field]: value }
                : scene
            )
          }
        : episode
    );
    setEpisodes(updatedEpisodes);
    
    // 비동기 저장 (에러 처리 포함)
    try {
      await saveEpisodesToStorage(updatedEpisodes);
    } catch (error) {
      console.error('씬 업데이트 저장 실패:', error);
    }
  }, [episodes, setEpisodes, saveEpisodesToStorage]);

  // 씬 삭제
  const deleteScene = useCallback((episodeIndex: number, sceneIndex: number) => {
    const updatedEpisodes = episodes.map((episode, index) => 
      index === episodeIndex 
        ? {
            ...episode,
            scenes: episode.scenes.filter((_: any, sIndex: number) => sIndex !== sceneIndex)
          }
        : episode
    );
    setEpisodes(updatedEpisodes);
    saveEpisodesToStorage(updatedEpisodes);
  }, [episodes, setEpisodes, saveEpisodesToStorage]);

  return (
    <div className="space-y-4">
      {/* 공통 입력 항목 */}
      <div className={isDisabled ? 'opacity-60 pointer-events-none' : ''}>
        <CommonInputsSection
          story={story}
          characterList={characterList}
          storySummary={storySummary}
          onComplete={onCommonInputsComplete}
          onReset={onResetWithWarning ? () => onResetWithWarning(() => onCommonInputsReset?.()) : onCommonInputsReset}
          showEditMode={!isDisabled}
          title={`📋 공통 입력 항목${isDisabled ? ' (비활성화됨)' : ''}`}
          editable={!isDisabled}
          onStoryChange={onStoryChange}
          onCharacterListChange={onCharacterListChange}
          onStorySummaryChange={onStorySummaryChange}
        />
      </div>

      {/* 에피소드 구조 관리 */}
      <div className={`p-4 rounded-lg border ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-green-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDisabled ? 'text-gray-500' : 'text-green-800'}`}>
            🎬 에피소드/씬 구조 관리
            {isDisabled && <span className="ml-2 text-xs text-red-500">(비활성화됨)</span>}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => !isDisabled && setShowEpisodeStructure(!showEpisodeStructure)}
              disabled={isDisabled}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                isDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {showEpisodeStructure ? '구조 숨기기' : '구조 보기-수정'}
            </button>
            <button
              onClick={addEpisode}
              disabled={isDisabled}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              + 에피소드 추가
            </button>
            <button
              onClick={handleUploadToReference}
              disabled={isDisabled}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isDisabled 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              📤 참조 업로드
            </button>
          </div>
        </div>

        {showEpisodeStructure && (
          <div className={`space-y-4 ${isDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
            {episodes.map((episode, episodeIndex) => (
              <div key={episode.id} className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-green-800">
                    에피소드 {episodeIndex + 1}
                  </h4>
                  <div className="flex items-center gap-2">
                    {/* 에피소드 텍스트 카드 생성 버튼 */}
                    {episode.title && episode.description && episode.scenes.length > 0 && (
                      <button
                        onClick={() => !isDisabled && handleGenerateEpisodeTextCards(episodeIndex)}
                        disabled={isDisabled}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          isDisabled 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }`}
                      >
                        📝 에피소드 텍스트 카드 생성
                      </button>
                    )}
                    <button
                      onClick={() => !isDisabled && addScene(episodeIndex)}
                      disabled={isDisabled}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        isDisabled 
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      + 씬 추가
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('이 에피소드를 삭제하시겠습니까?')) {
                          deleteEpisode(episodeIndex);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      🗑️ 에피소드 삭제
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">에피소드 제목</label>
                    <input
                      type="text"
                      value={episode.title}
                      onChange={(e) => updateEpisode(episodeIndex, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="에피소드 제목을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">에피소드 설명</label>
                    <textarea
                      value={episode.description}
                      onChange={(e) => updateEpisode(episodeIndex, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={2}
                      placeholder="에피소드 설명을 입력하세요"
                    />
                  </div>

                  {/* 씬 목록 */}
                  <div className="space-y-2">
                    {episode.scenes.map((scene: any, sceneIndex: number) => (
                      <div key={scene.id} className="bg-gray-50 p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            씬 {sceneIndex + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            {/* 가이드 버튼 */}
                            <button
                              onClick={() => {
                                const template = `장소: 실내/실외, 구체적인 배경
시간: 낮/밤, 계절, 날씨
분위기: 긴장감, 로맨틱, 코믹, 드라마틱
캐릭터: 주인공의 감정, 행동, 대사
카메라: 앵글, 움직임, 촬영 기법
조명: 자연광, 인공조명, 색감
소품: 중요한 물건이나 배경 요소
사운드: 배경음, 효과음, 대사 톤`;
                                
                                navigator.clipboard.writeText(template).then(() => {
                                  addNotification({
                                    type: 'success',
                                    title: '복사 완료',
                                    message: '씬 설명 템플릿이 클립보드에 복사되었습니다.',
                                  });
                                }).catch(() => {
                                  // 클립보드 복사 실패 시 텍스트 영역에 표시
                                  const textArea = document.createElement('textarea');
                                  textArea.value = template;
                                  document.body.appendChild(textArea);
                                  textArea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textArea);
                                  
                                  addNotification({
                                    type: 'success',
                                    title: '복사 완료',
                                    message: '씬 설명 템플릿이 클립보드에 복사되었습니다.',
                                  });
                                });
                              }}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              설명예시 복사
                            </button>
                            <button
                              onClick={() => deleteScene(episodeIndex, sceneIndex)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">씬 제목</label>
                            <input
                              type="text"
                              value={scene.title}
                              onChange={(e) => updateScene(episodeIndex, sceneIndex, 'title', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                              placeholder="씬 제목"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">씬 설명</label>
                            <textarea
                              value={scene.description}
                              onChange={(e) => updateScene(episodeIndex, sceneIndex, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                              rows={3}
                              placeholder="씬 설명을 입력하세요"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">컷 수</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={scene.cuts}
                              onChange={(e) => updateScene(episodeIndex, sceneIndex, 'cuts', parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {episodes.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-lg font-medium text-gray-700 mb-2">에피소드 구조가 설정되지 않았습니다</div>
                  <div className="text-sm text-gray-600 mb-4">
                    더 정확한 씬/컷 구성을 위해 에피소드 구조를 설정해보세요.
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <div className="text-blue-800 font-medium mb-2">💡 에피소드 구조 설정의 장점</div>
                  <div className="text-blue-700 text-sm space-y-1">
                    <div>• 정확한 씬/컷 수 계산</div>
                    <div>• 체계적인 영상 제작 계획</div>
                    <div>• 에피소드별 텍스트 카드 생성</div>
                    <div>• 프로젝트 참조에서 상세 정보 확인</div>
                  </div>
                </div>
                <button
                  onClick={addEpisode}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDisabled 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  🎬 에피소드 추가하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
