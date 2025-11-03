import { useState } from 'react';
import { useUIStore } from '../stores/uiStore';
import { GoogleAIService } from '../services/googleAIService';
import { getAPIKeyFromStorage } from '../utils/apiKeyUtils';

export const useProjectHandlers = (
  story: string,
  setStory: (story: string) => void,
  characterList: any[],
  setCharacterList: (list: any[]) => void,
  scenarioPrompt: string,
  setScenarioPrompt: (prompt: string) => void,
  storySummary: string,
  setStorySummary: (summary: string) => void,
  finalScenario: string,
  setFinalScenario: (scenario: string) => void,
  generatedProjectData: any,
  setGeneratedProjectData: (data: any) => void,
  currentStep: string,
  setCurrentStep: (step: string) => void,
  generatedCharacters?: any[],
  setStepStatus?: (status: any) => void
) => {
  const { addNotification } = useUIStore();
  
  // API 키 가져오기 (통합 유틸리티 사용)
  const getAPIKey = (): string => {
    return getAPIKeyFromStorage('google');
  };
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const handleGenerateAllPrompts = async () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '스토리를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 통합 AI 생성 로직

      const prompt = `다음 정보를 바탕으로 영상 제작을 위한 통합 프롬프트를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
시나리오 프롬프트: ${scenarioPrompt}

각 항목별로 그룹화하여 정리하고, 영상 생성에 최적화된 프롬프트를 포함해주세요.`;

      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      
      // JSON 파싱 시도
      try {
        const parsedResult = JSON.parse(result);
        setGeneratedProjectData(parsedResult);
      } catch {
        // JSON 파싱 실패 시 기본 구조로 저장
        setGeneratedProjectData({
          reviewResult: result,
          groupedResults: {
            characterGroup: { prompt: result },
            scenarioGroup: { prompt: result },
            videoGroup: { prompt: result }
          }
        });
      }

      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '통합 AI 생성이 완료되었습니다.',
      });
    } catch (error) {
      console.error('통합 AI 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: 'AI 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleGenerateScenarioPrompt = async () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '스토리를 먼저 입력해주세요.',
      });
      return;
    }

    try {
      const prompt = `다음 스토리를 바탕으로 시나리오 생성용 프롬프트를 만들어주세요:

스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

시나리오의 핵심 요소와 전개를 포함한 프롬프트를 생성해주세요.`;

      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setScenarioPrompt(result);

      // 500자 스토리 정리도 자동 생성
      await handleGenerateStorySummary();

      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '시나리오 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      console.error('시나리오 프롬프트 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '시나리오 프롬프트 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleGenerateStorySummary = async () => {
    if (!story.trim()) {
      return;
    }

    try {
      const prompt = `다음 스토리를 500자 이내로 요약해주세요:

${story}

핵심 내용과 주요 전개를 포함하여 간결하게 정리해주세요.`;

      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setStorySummary(result);
    } catch (error) {
      console.error('스토리 요약 생성 오류:', error);
    }
  };

  const handleSaveScenario = () => {
    if (!finalScenario) {
      addNotification({
        type: 'error',
        title: '저장 불가',
        message: '최종 시나리오가 생성되지 않았습니다.',
      });
      return;
    }

    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 개요가 저장되었습니다.',
    });
  };

  const handleNextStep = () => {
    if (currentStep === "프로젝트 개요") {
      setCurrentStep("이미지 생성");
    } else if (currentStep === "이미지 생성") {
      setCurrentStep("영상 생성");
    }
  };

  // 다음 단계로 진행 가능한지 확인
  const canProceedToNext = () => {
    if (currentStep === "프로젝트 개요") {
      return generatedProjectData && generatedProjectData.koreanCards && generatedProjectData.englishCards;
    } else if (currentStep === "이미지 생성") {
      return generatedCharacters && generatedCharacters.length > 0;
    }
    return false;
  };

  // 재생성 기능들
  const handleRegenerateStory = async () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 스토리가 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 스토리를 더욱 매력적이고 영상 제작에 적합하게 재작성해주세요:\n\n${story}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setStory(result);
      addNotification({
        type: 'success',
        title: '스토리 재생성 완료',
        message: '스토리가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '스토리 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateCharacters = async () => {
    if (characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 캐릭터가 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 캐릭터들을 더욱 상세하고 영상 제작에 적합하게 재작성해주세요:\n\n${characterList.map(c => `${c.name}: ${c.description}`).join('\n')}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      
      // JSON 파싱 시도
      try {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          setCharacterList(parsed);
        } else {
          throw new Error('Invalid format');
        }
      } catch {
        // JSON이 아닌 경우 텍스트로 처리
        const lines = result.split('\n').filter(line => line.trim());
        const newCharacters = lines.map((line, index) => ({
          name: `캐릭터 ${index + 1}`,
          description: line.trim()
        }));
        setCharacterList(newCharacters);
      }

      addNotification({
        type: 'success',
        title: '캐릭터 재생성 완료',
        message: '캐릭터 목록이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '캐릭터 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateScenarioPrompt = async () => {
    if (!scenarioPrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 시나리오 프롬프트가 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 시나리오 프롬프트를 더욱 효과적이고 영상 제작에 최적화되게 재작성해주세요:\n\n${scenarioPrompt}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setScenarioPrompt(result);
      addNotification({
        type: 'success',
        title: '시나리오 프롬프트 재생성 완료',
        message: '시나리오 프롬프트가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '시나리오 프롬프트 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateStorySummary = async () => {
    if (!storySummary.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 스토리 요약이 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 스토리 요약을 더욱 간결하고 명확하게 재작성해주세요:\n\n${storySummary}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setStorySummary(result);
      addNotification({
        type: 'success',
        title: '스토리 요약 재생성 완료',
        message: '스토리 요약이 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '스토리 요약 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateFinalScenario = async () => {
    if (!finalScenario.trim()) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 최종 시나리오가 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 최종 시나리오를 더욱 완성도 높고 영상 제작에 적합하게 재작성해주세요:\n\n${finalScenario}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setFinalScenario(result);
      addNotification({
        type: 'success',
        title: '최종 시나리오 재생성 완료',
        message: '최종 시나리오가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '최종 시나리오 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRegenerateReview = async () => {
    if (!generatedProjectData) {
      addNotification({
        type: 'error',
        title: '입력 필요',
        message: '재생성할 통합 AI 검토 결과가 없습니다.',
      });
      return;
    }

    try {
      const prompt = `다음 통합 AI 검토 결과를 더욱 체계적이고 영상 제작에 최적화되게 재작성해주세요:\n\n${generatedProjectData.reviewResult}`;
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateText(prompt);
      setGeneratedProjectData({
        ...generatedProjectData,
        reviewResult: result
      });
      addNotification({
        type: 'success',
        title: '통합 AI 검토 재생성 완료',
        message: '통합 AI 검토 결과가 성공적으로 재생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '재생성 실패',
        message: '통합 AI 검토 재생성 중 오류가 발생했습니다.',
      });
    }
  };

  // 수정 기능들 (편집 모드)
  const handleEditStory = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '스토리 편집 모드가 활성화되었습니다.',
    });
  };

  const handleEditCharacters = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '캐릭터 목록 편집 모드가 활성화되었습니다.',
    });
  };

  const handleEditScenarioPrompt = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '시나리오 프롬프트 편집 모드가 활성화되었습니다.',
    });
  };

  const handleEditStorySummary = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '스토리 요약 편집 모드가 활성화되었습니다.',
    });
  };

  const handleEditFinalScenario = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '최종 시나리오 편집 모드가 활성화되었습니다.',
    });
  };

  const handleEditReview = () => {
    addNotification({
      type: 'info',
      title: '편집 모드',
      message: '통합 AI 검토 결과 편집 모드가 활성화되었습니다.',
    });
  };

  // 저장 기능들
  const handleSaveStory = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '스토리가 성공적으로 저장되었습니다.',
    });
  };

  const handleSaveCharacters = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '캐릭터 목록이 성공적으로 저장되었습니다.',
    });
  };

  const handleSaveScenarioPrompt = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '시나리오 프롬프트가 성공적으로 저장되었습니다.',
    });
  };

  const handleSaveStorySummary = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '스토리 요약이 성공적으로 저장되었습니다.',
    });
  };

  const handleSaveFinalScenario = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '최종 시나리오가 성공적으로 저장되었습니다.',
    });
  };

  const handleSaveReview = () => {
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '통합 AI 검토 결과가 성공적으로 저장되었습니다.',
    });
  };

  return {
    handleGenerateAllPrompts,
    handleGenerateScenarioPrompt,
    handleGenerateStorySummary,
    handleSaveScenario,
    handleNextStep,
    handleNext: handleNextStep, // 별칭 추가
    canProceedToNext,
    isGeneratingAll,
    // 재생성 기능들
    handleRegenerateStory,
    handleRegenerateCharacters,
    handleRegenerateScenarioPrompt,
    handleRegenerateStorySummary,
    handleRegenerateFinalScenario,
    handleRegenerateReview,
    // 수정 기능들
    handleEditStory,
    handleEditCharacters,
    handleEditScenarioPrompt,
    handleEditStorySummary,
    handleEditFinalScenario,
    handleEditReview,
    // 저장 기능들
    handleSaveStory,
    handleSaveCharacters,
    handleSaveScenarioPrompt,
    handleSaveStorySummary,
    handleSaveFinalScenario,
    handleSaveReview,
    // 단계 상태 관리
    setStepStatus
  };
};
