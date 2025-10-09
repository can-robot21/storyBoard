import React from 'react';
import Button from '../common/Button';
import { EpisodeStructureManager } from '../videoGeneration/EpisodeStructureManager';
import { useProjectOverview } from '../../hooks/useProjectOverview';
import { ProjectOverviewStepProps, StepStatus, GeneratedProjectData, SceneCutSettings } from '../../types/projectOverview';
import { useUIStore } from '../../stores/uiStore';
import { useAIService } from '../../hooks/useAIService';

export const ProjectOverviewStep: React.FC<ProjectOverviewStepProps> = ({
  story,
  setStory,
  characterList,
  setCharacterList,
  scenarioPrompt,
  setScenarioPrompt,
  storySummary,
  setStorySummary,
  finalScenario,
  setFinalScenario,
  generatedProjectData,
  setGeneratedProjectData,
  onNext,
  canProceedToNext,
  stepStatus,
  setStepStatus
}) => {
  const { addNotification } = useUIStore();
  const { generateText } = useAIService();
  
  const {
    dialogue,
    setDialogue,
    additionalScenarioSettings,
    setAdditionalScenarioSettings,
    isGeneratingAll,
    setIsGeneratingAll,
    showStepInputs,
    setShowStepInputs,
    episodes,
    setEpisodes,
    promptLengthSettings,
    sceneCutSettings,
    setSceneCutSettings,
    checkAPIKeyStatus,
    toggleStepInputs,
    handleCommonInputsComplete,
    handleCommonInputsReset,
    translateToEnglish
  } = useProjectOverview();

  // API 키 상태 표시
  const apiKeyStatus = checkAPIKeyStatus();

  // 공통 입력 완료 처리 (프로젝트 개요 전용)
  const handleProjectCommonInputsComplete = () => {
    handleCommonInputsComplete(story, characterList);
  };

  // 공통 입력 초기화 (프로젝트 개요 전용)
  const handleProjectCommonInputsReset = () => {
    setStory('');
    setStorySummary('');
    setCharacterList([]);
    setSceneCutSettings({ sceneCount: 3, cutCount: 3 });
    handleCommonInputsReset();
  };

  // 1단계: 시나리오 생성
  const handleGenerateScenario = async () => {
    if (!dialogue || !additionalScenarioSettings || !scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '모든 필수 입력 항목을 채워주세요.',
      });
      return;
    }

    // API 키 상태 확인
    if (!apiKeyStatus.hasApiKey) {
      addNotification({
        type: 'error',
        title: 'API 키 오류',
        message: 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      const prompt = `다음 정보를 바탕으로 영상 시나리오를 생성해주세요:

기본 정보:
- 스토리 제목: ${story}
- 스토리 요약: ${storySummary}
- 캐릭터 정보: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

씬/컷 구성:
- 총 씬 개수: ${sceneCutSettings.sceneCount}개
- 씬당 컷 개수: ${sceneCutSettings.cutCount}개
- 총 컷 개수: ${sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개

${episodes.length > 0 ? `에피소드/씬 구조:
${episodes.map(episode => 
  `- 에피소드: ${episode.title}
  설명: ${episode.description}
  씬 구성: ${episode.scenes.map(scene => `${scene.title}: ${scene.description}`).join(', ')}`
).join('\n')}

` : ''}시나리오 입력:
- 대화 내용: ${dialogue}
- 추가 시나리오 설정: ${additionalScenarioSettings}
- 시나리오 프롬프트: ${scenarioPrompt}

위 정보를 종합하여 ${sceneCutSettings.sceneCount}개 씬, 총 ${sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개 컷으로 구성된 ${promptLengthSettings.scenario}자 이내의 상세한 영상 시나리오를 생성해주세요. 각 씬과 컷이 명확히 구분되도록 작성해주세요.${episodes.length > 0 ? ' 에피소드 구조를 반영하여 시나리오를 구성해주세요.' : ''}`;

      const result = await generateText({
        prompt,
        model: 'gemini-2.5-flash',
        maxTokens: Math.floor(promptLengthSettings.scenario / 2),
        temperature: 0.7
      });

      if (result) {
        setFinalScenario(result);
        (setStepStatus as React.Dispatch<React.SetStateAction<StepStatus>>)((prev: StepStatus) => ({ ...prev, scenarioGenerated: true }));
        
        addNotification({
          type: 'success',
          title: '시나리오 생성 완료',
          message: `${sceneCutSettings.sceneCount}개 씬, ${sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개 컷으로 구성된 영상 시나리오가 생성되었습니다.`,
        });
      }
    } catch (error) {
      console.error('시나리오 생성 오류:', error);
      
      let errorMessage = '시나리오 생성에 실패했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('API 키가 설정되지 않았습니다')) {
          errorMessage = 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
        } else if (error.message.includes('프롬프트가 비어있습니다')) {
          errorMessage = '입력된 프롬프트가 비어있습니다. 다시 확인해주세요.';
        } else if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('429')) {
          errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('401')) {
          errorMessage = 'API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.';
        }
      }
      
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: errorMessage,
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 2단계: JSON 카드 생성 (한글)
  const handleGenerateJsonCards = async () => {
    if (!finalScenario) {
      addNotification({
        type: 'error',
        title: '오류',
        message: '먼저 시나리오를 생성해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 1단계: 한글 프롬프트 카드 생성
      const koreanCards = {
        '스토리': story,
        '영상 설정': scenarioPrompt,
        '캐릭터 설정': characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        '씬/컷 구성': `${sceneCutSettings.sceneCount}개 씬, 씬당 ${sceneCutSettings.cutCount}개 컷 (총 ${sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개 컷)`,
        '시나리오 추가 설정': additionalScenarioSettings || '없음',
        '영상 시나리오': finalScenario,
        '씬별 컷별 프롬프트': '씬별 상세 프롬프트는 프로젝트 참조에서 생성 가능'
      };

      // 한글 카드만 먼저 저장 (사용자가 확인/수정할 수 있도록)
      const jsonData = {
        projectInfo: {
          title: 'Generated Project',
          createdAt: new Date().toISOString(),
          version: '1.0'
        },
        koreanCards,
        englishCards: null, // 아직 생성되지 않음
        settings: {
          promptLength: promptLengthSettings,
          sceneCuts: sceneCutSettings
        }
      };

      (setGeneratedProjectData as React.Dispatch<React.SetStateAction<GeneratedProjectData | null>>)((prev: GeneratedProjectData | null) => ({
        ...prev,
        ...jsonData
      }));

      (setStepStatus as React.Dispatch<React.SetStateAction<StepStatus>>)((prev: StepStatus) => ({ ...prev, jsonCardsGenerated: true }));

      addNotification({
        type: 'success',
        title: '한글 프롬프트 카드 생성 완료',
        message: '한글 프롬프트 카드가 생성되었습니다. 확인 후 영어 번역을 진행하세요.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '한글 프롬프트 카드 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 3단계: 영어 카드 생성
  const handleGenerateEnglishCards = async () => {
    if (!generatedProjectData?.koreanCards) {
      addNotification({
        type: 'error',
        title: '오류',
        message: '먼저 한글 프롬프트 카드를 생성해주세요.',
      });
      return;
    }

    // API 키 상태 확인
    if (!apiKeyStatus.hasApiKey) {
      addNotification({
        type: 'error',
        title: 'API 키 오류',
        message: 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      const koreanCards = generatedProjectData.koreanCards;
      
      // 영어 프롬프트 카드 생성 (AI 서비스 사용, 길이 제한 적용)
      const englishCards = {
        'Story': await translateToEnglish(koreanCards['스토리'], promptLengthSettings.scenario),
        'Visual Settings': await translateToEnglish(koreanCards['영상 설정'], promptLengthSettings.video),
        'Character Settings': await translateToEnglish(koreanCards['캐릭터 설정'], promptLengthSettings.scenario),
        'Scene Cut Structure': await translateToEnglish(koreanCards['씬/컷 구성'], promptLengthSettings.scenario),
        'Additional Scenario Settings': await translateToEnglish(koreanCards['시나리오 추가 설정'], promptLengthSettings.scenario),
        'Video Scenario': await translateToEnglish(koreanCards['영상 시나리오'], promptLengthSettings.scenario),
        'Scene Cut Prompts': await translateToEnglish(koreanCards['씬별 컷별 프롬프트'], promptLengthSettings.scenario)
      };

      // 영어 카드 추가
      (setGeneratedProjectData as any)((prev: any) => ({
        ...prev,
        englishCards
      }));
      
      addNotification({
        type: 'success',
        title: '영어 프롬프트 카드 생성 완료',
        message: '영어 프롬프트 카드가 생성되었습니다. 이제 프로젝트를 저장할 수 있습니다.',
      });
    } catch (error) {
      console.error('영어 카드 생성 오류:', error);
      
      let errorMessage = '영어 프롬프트 카드 생성에 실패했습니다.';
      
      if (error instanceof Error) {
        if (error.message.includes('API 키가 설정되지 않았습니다')) {
          errorMessage = 'Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.';
        } else if (error.message.includes('프롬프트가 비어있습니다')) {
          errorMessage = '한글 카드가 비어있습니다. 3단계를 먼저 완료해주세요.';
        } else if (error.message.includes('503') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'Google AI 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('429')) {
          errorMessage = 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('401')) {
          errorMessage = 'API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.';
        }
      }
      
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: errorMessage,
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 4단계: 최종 저장
  const handleGenerateFinalPromptCards = async () => {
    if (!generatedProjectData?.englishCards) {
      addNotification({
        type: 'error',
        title: '오류',
        message: '먼저 영어 프롬프트 카드를 생성해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // MainLayout으로 전달할 데이터 설정
      (setGeneratedProjectData as any)((prev: any) => ({
        ...prev,
        projectOverviewSaved: true,
        // Ensure koreanCards and englishCards are present from previous steps
        koreanCards: prev?.koreanCards,
        englishCards: prev?.englishCards,
        reviewResult: prev?.aiReviewResult // Assuming aiReviewResult is already set
      }));

      (setStepStatus as React.Dispatch<React.SetStateAction<StepStatus>>)((prev: StepStatus) => ({ ...prev, projectOverviewSaved: true }));

      addNotification({
        type: 'success',
        title: '프로젝트 개요 저장 완료',
        message: '프로젝트 개요가 성공적으로 저장되었습니다. 다음 단계로 진행하세요.',
      });
      onNext();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '프로젝트 개요 저장에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 에피소드/씬 구조 관리 (공통 입력 항목 포함) */}
      <EpisodeStructureManager
        episodes={episodes}
        setEpisodes={setEpisodes}
        showEpisodeStructure={showStepInputs.episodeStructure || false}
        setShowEpisodeStructure={(show) => setShowStepInputs(prev => ({ ...prev, episodeStructure: show }))}
        story={story}
        characterList={characterList}
        storySummary={storySummary}
        onCommonInputsComplete={handleProjectCommonInputsComplete}
        onCommonInputsReset={handleProjectCommonInputsReset}
        onStoryChange={setStory}
        onCharacterListChange={setCharacterList}
        onStorySummaryChange={setStorySummary}
      />

      {/* 단계별 버튼 및 입력 항목 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-3">프로젝트 생성 단계</div>
          
          {/* 관리자 계정 정보 표시 */}
          {apiKeyStatus.isAdmin && (
            <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">👤 관리자 계정:</span>
                <span>star612.net@gmail.com (환경변수 API 키 사용)</span>
              </div>
            </div>
          )}
          <div className={`p-3 rounded-lg border text-sm ${
            apiKeyStatus.hasApiKey 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {apiKeyStatus.hasApiKey ? '✅' : '⚠️'} Google AI API 키 상태:
                </span>
                <span>
                  {apiKeyStatus.hasApiKey 
                    ? `설정됨 (${apiKeyStatus.isAdmin ? '관리자 환경변수' : '사용자 설정'})` 
                    : '설정되지 않음'
                  }
                </span>
              </div>
              {!apiKeyStatus.hasApiKey && (
                <button
                  onClick={() => {
                    addNotification({
                      type: 'info',
                      title: 'API 키 설정 안내',
                      message: '우측 상단의 설정 버튼을 클릭하여 Google AI API 키를 입력해주세요.',
                    });
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  설정 안내
                </button>
              )}
            </div>
          </div>
          
          {/* 1단계: 기본 입력 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                !stepStatus.scenarioGenerated ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {stepStatus.scenarioGenerated ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">기본 입력 및 시나리오 생성</div>
                <div className="text-xs text-gray-500">대화, 추가 설정, 시나리오 프롬프트 입력</div>
              </div>
              <div className="flex items-center gap-2">
                {/* 1단계는 항상 표시 */}
                <button
                  onClick={() => toggleStepInputs('step1')}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showStepInputs.step1 ? '입력 숨기기' : '입력 보기/수정'}
                </button>
                <Button
                  className={`px-4 py-2 ${
                    dialogue && additionalScenarioSettings && scenarioPrompt && !stepStatus.scenarioGenerated
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleGenerateScenario}
                  disabled={!dialogue || !additionalScenarioSettings || !scenarioPrompt || stepStatus.scenarioGenerated || isGeneratingAll}
                >
                  {isGeneratingAll ? '생성 중...' : stepStatus.scenarioGenerated ? '완료' : '시나리오 생성'}
                </Button>
              </div>
            </div>

            {/* 1단계 입력 항목 */}
            {showStepInputs.step1 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 ml-11">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">📝 기본 입력</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      대화 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={dialogue}
                      onChange={(e) => setDialogue(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        dialogue ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      rows={3}
                      placeholder="주요 대화나 상황을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      추가 시나리오 설정 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={additionalScenarioSettings}
                      onChange={(e) => setAdditionalScenarioSettings(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        additionalScenarioSettings ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      rows={2}
                      placeholder="추가적인 시나리오 설정이나 요구사항을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시나리오 프롬프트 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={scenarioPrompt}
                      onChange={(e) => setScenarioPrompt(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 ${
                        scenarioPrompt ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      rows={2}
                      placeholder="시나리오 생성에 사용할 프롬프트를 입력하세요"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2단계: JSON 카드 생성 (한글) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepStatus.scenarioGenerated && !stepStatus.jsonCardsGenerated ? 'bg-indigo-600 text-white' : 
                stepStatus.jsonCardsGenerated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                {stepStatus.jsonCardsGenerated ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">JSON 카드 생성</div>
                <div className="text-xs text-gray-500">한글 프롬프트 카드 생성</div>
              </div>
              <div className="flex items-center gap-2">
                {/* 2단계는 1단계 완료 후에만 표시 */}
                {stepStatus.scenarioGenerated && (
                  <button
                    onClick={() => toggleStepInputs('step2')}
                    className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                  >
                    {showStepInputs.step2 ? '입력 숨기기' : '입력 보기/수정'}
                  </button>
                )}
                <Button
                  className={`px-4 py-2 ${
                    stepStatus.scenarioGenerated && !stepStatus.jsonCardsGenerated
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : stepStatus.jsonCardsGenerated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleGenerateJsonCards}
                  disabled={!stepStatus.scenarioGenerated || stepStatus.jsonCardsGenerated || isGeneratingAll}
                >
                  {isGeneratingAll ? '카드 생성 중...' : stepStatus.jsonCardsGenerated ? '완료' : '한글 카드 생성'}
                </Button>
              </div>
            </div>

            {/* 2단계 입력 항목 */}
            {showStepInputs.step2 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 ml-11">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">📋 한글 카드 생성</h4>
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded border">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">생성된 시나리오</h5>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {finalScenario || '시나리오가 생성되지 않았습니다. 1단계를 먼저 완료해주세요.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3단계: JSON 카드 생성 (한글) */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepStatus.scenarioGenerated && !stepStatus.jsonCardsGenerated ? 'bg-indigo-600 text-white' : 
                stepStatus.jsonCardsGenerated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                {stepStatus.jsonCardsGenerated ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">JSON 카드 생성</div>
                <div className="text-xs text-gray-500">한글 프롬프트 카드 생성</div>
              </div>
              <div className="flex items-center gap-2">
                {/* 3단계는 1단계 완료 후에만 표시 */}
                {stepStatus.scenarioGenerated && (
                  <button
                    onClick={() => toggleStepInputs('step3')}
                    className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                  >
                    {showStepInputs.step3 ? '입력 숨기기' : '입력 보기/수정'}
                  </button>
                )}
                <Button
                  className={`px-4 py-2 ${
                    stepStatus.scenarioGenerated && !stepStatus.jsonCardsGenerated
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : stepStatus.jsonCardsGenerated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleGenerateJsonCards}
                  disabled={!stepStatus.scenarioGenerated || stepStatus.jsonCardsGenerated || isGeneratingAll}
                >
                  {isGeneratingAll ? '카드 생성 중...' : stepStatus.jsonCardsGenerated ? '완료' : '한글 카드 생성'}
                </Button>
              </div>
            </div>

            {/* 3단계 입력 항목 */}
            {showStepInputs.step3 && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 ml-11">
                <h4 className="text-sm font-semibold text-indigo-800 mb-3">📋 한글 카드 설정</h4>
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded border">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">생성된 한글 카드</h5>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {generatedProjectData?.koreanCards ? 
                        Object.entries(generatedProjectData.koreanCards).map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        )) : 
                        '한글 카드가 생성되지 않았습니다.'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3.5단계: 영어 카드 생성 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                stepStatus.jsonCardsGenerated && !generatedProjectData?.englishCards ? 'bg-purple-600 text-white' : 
                generatedProjectData?.englishCards ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                {generatedProjectData?.englishCards ? '✓' : '3.5'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">영어 카드 생성</div>
                <div className="text-xs text-gray-500">한글 카드 확인 후 영어 번역</div>
              </div>
              <div className="flex items-center gap-2">
                {/* 3.5단계는 3단계 완료 후에만 표시 */}
                {stepStatus.jsonCardsGenerated && (
                  <button
                    onClick={() => toggleStepInputs('step4')}
                    className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                  >
                    {showStepInputs.step4 ? '입력 숨기기' : '입력 보기/수정'}
                  </button>
                )}
                <Button
                  className={`px-4 py-2 ${
                    stepStatus.jsonCardsGenerated && !generatedProjectData?.englishCards
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : generatedProjectData?.englishCards ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleGenerateEnglishCards}
                  disabled={!stepStatus.jsonCardsGenerated || !!generatedProjectData?.englishCards || isGeneratingAll}
                >
                  {isGeneratingAll ? '영어 번역 중...' : generatedProjectData?.englishCards ? '완료' : '영어 카드 생성'}
                </Button>
              </div>
            </div>

            {/* 3.5단계 입력 항목 */}
            {showStepInputs.step4 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 ml-11">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">🌐 영어 카드 설정</h4>
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded border">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">생성된 영어 카드</h5>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                      {generatedProjectData?.englishCards ? 
                        Object.entries(generatedProjectData.englishCards).map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        )) : 
                        '영어 카드가 생성되지 않았습니다.'
                      }
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">프로젝트 설정</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">씬 숫자</label>
                          <input
                            type="number"
                            value={sceneCutSettings.sceneCount}
                            onChange={(e) => setSceneCutSettings((prev: SceneCutSettings) => ({
                              ...prev,
                              sceneCount: parseInt(e.target.value) || 3
                            }))}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="1"
                            max="10"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">컷 숫자</label>
                          <input
                            type="number"
                            value={sceneCutSettings.cutCount}
                            onChange={(e) => setSceneCutSettings((prev: SceneCutSettings) => ({
                              ...prev,
                              cutCount: parseInt(e.target.value) || 3
                            }))}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="1"
                            max="10"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        현재 설정: {sceneCutSettings.sceneCount}개 씬 × {sceneCutSettings.cutCount}개 컷 = 총 {sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개 컷
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4단계: 최종 저장 */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              generatedProjectData?.englishCards ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              {stepStatus.projectOverviewSaved ? '✓' : '4'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">프로젝트 개요 저장</div>
              <div className="text-xs text-gray-500">최종 프로젝트 데이터 저장 및 다음 단계 진행</div>
            </div>
            <Button
              className={`px-4 py-2 ${
                generatedProjectData?.englishCards
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={handleGenerateFinalPromptCards}
              disabled={!generatedProjectData?.englishCards || isGeneratingAll}
            >
              {isGeneratingAll ? '저장 중...' : stepStatus.projectOverviewSaved ? '완료' : '프로젝트 저장'}
            </Button>
          </div>
        </div>
      </div>

      {/* 다음 단계 진행 버튼 */}
      {stepStatus.projectOverviewSaved && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">🎉 프로젝트 개요 완료</h3>
              <p className="text-sm text-gray-600 mt-1">모든 단계가 완료되었습니다. 다음 단계로 진행하세요.</p>
            </div>
            <Button
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              onClick={onNext}
            >
              다음 단계로 →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};