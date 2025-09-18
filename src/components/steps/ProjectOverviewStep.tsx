import React, { useState } from 'react';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';
import { DEFAULT_SETTINGS } from '../../utils/constants';

interface ProjectOverviewStepProps {
  story: string;
  setStory: (story: string) => void;
  characterList: Array<{ id: number; name: string; description: string }>;
  setCharacterList: (characters: Array<{ id: number; name: string; description: string }>) => void;
  scenarioPrompt: string;
  setScenarioPrompt: (prompt: string) => void;
  storySummary: string;
  setStorySummary: (summary: string) => void;
  finalScenario: string;
  setFinalScenario: (scenario: string) => void;
  generatedProjectData: any;
  setGeneratedProjectData: (data: any) => void;
  onNext: () => void;
  canProceedToNext?: () => boolean;
  stepStatus: any;
  setStepStatus: (status: any) => void;
}

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
  const [characterInput, setCharacterInput] = useState('');
  const [storyText, setStoryText] = useState('');
  const [dialogue, setDialogue] = useState('');
  const [additionalScenarioSettings, setAdditionalScenarioSettings] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // 프롬프트 출력 길이 설정
  const [promptLengthSettings, setPromptLengthSettings] = useState({
    video: DEFAULT_SETTINGS.PROMPT_LENGTH.VIDEO,
    scenario: DEFAULT_SETTINGS.PROMPT_LENGTH.SCENARIO
  });
  
  // 씬/컷 설정
  const [sceneCutSettings, setSceneCutSettings] = useState({
    sceneCount: DEFAULT_SETTINGS.SCENE_CUT.SCENE_COUNT,
    cutCount: DEFAULT_SETTINGS.SCENE_CUT.CUT_COUNT
  });


  // 캐릭터 추가
  const handleAddCharacter = () => {
    if (characterInput.trim()) {
      const newCharacter = {
        id: Date.now(),
        name: `캐릭터 ${characterList.length + 1}`,
        description: characterInput.trim()
      };
      setCharacterList([...characterList, newCharacter]);
      setCharacterInput('');
    }
  };

  // 캐릭터 삭제
  const handleDeleteCharacter = (id: number) => {
    setCharacterList(characterList.filter(char => char.id !== id));
  };


  // 영상 설정 AI 생성 (오른쪽 본문 전용)
  const handleGenerateVisualSettingsPrompt = async () => {
    if (!story.trim() || characterList.length === 0 || !storyText.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리, 캐릭터, 시각적 설정을 모두 입력해주세요.',
      });
      return;
    }

    try {
      const prompt = `다음 정보를 바탕으로 영상 제작을 위한 시각적 설정 프롬프트를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.map(char => `${char.name}: ${char.description}`).join(', ')}
시각적 설정: ${storyText}

영상 제작에 필요한 다음 요소들을 포함한 프롬프트를 작성해주세요:
- 배경 설정 (장소, 환경, 분위기)
- 색감 및 조명 (톤, 무드, 분위기)
- 카메라 워크 (촬영 각도, 이동, 줌)
- 시각적 효과 (특수효과, 전환, 애니메이션)
- 의상 및 소품 (캐릭터 외형, 액세서리)
- 전체적인 영상 스타일 (장르, 톤앤매너)

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 생성된 프롬프트는 반드시 ${promptLengthSettings.video}자 이내로 작성해주세요.
⚠️ 이 제한을 초과하면 안 됩니다. ${promptLengthSettings.video}자를 넘으면 생성이 실패합니다.
⚠️ 핵심 내용만 간결하게 정리하세요.
⚠️ 영상 제작에 필요한 핵심 정보만 포함하세요.
⚠️ 불필요한 설명은 제거하고 액션과 시각적 요소에 집중하세요.
⚠️ 각 문장을 짧고 명확하게 작성하세요.

시각적 설정 프롬프트:`;

      const result = await googleAIService.generateText(prompt);
      setScenarioPrompt(result);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '영상 설정 프롬프트가 생성되었습니다. 오른쪽 본문에서 확인하세요.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '영상 설정 프롬프트 생성에 실패했습니다.',
      });
    }
  };

  // 시나리오용 프롬프트 AI 생성 (기존 함수 유지 - 현재 사용하지 않음)
  /*
  const handleGenerateScenarioPrompt = async () => {
    if (!story.trim() || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터를 입력해주세요.',
      });
      return;
    }

    try {
      const prompt = `다음 정보를 바탕으로 시나리오 생성용 프롬프트를 만들어주세요:

스토리: ${story}
캐릭터: ${characterList.map(char => `${char.name}: ${char.description}`).join(', ')}
상세 스토리: ${storyText}
주요 대사: ${dialogue}

시나리오 생성에 필요한 프롬프트를 작성해주세요.`;

      const result = await googleAIService.generateText(prompt);
      setScenarioPrompt(result);
      
      // 500자 스토리 정리 자동 생성
      await handleGenerateStorySummary();
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '시나리오 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '시나리오 프롬프트 생성에 실패했습니다.',
      });
    }
  };
  */



  // 3단계: JSON 카드 생성 (국문/영문 프롬프트 카드)
  const handleGenerateJsonCards = async () => {
    if (!stepStatus.aiReviewCompleted) {
      addNotification({
        type: 'error',
        title: '순서 오류',
        message: '먼저 2단계 AI 검토 및 프롬프트 생성을 완료해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 국문 프롬프트 카드 생성
      const koreanCards = {
        '스토리': story,
        '영상 설정': generatedProjectData?.aiReviewResult?.videoPrompt || scenarioPrompt,
        '캐릭터 설정': characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        '시나리오 추가 설정': additionalScenarioSettings || '없음',
        '영상 시나리오': finalScenario,
        '씬별 컷별 프롬프트': generatedProjectData?.aiReviewResult?.scenarioReview || '없음'
      };

      // 영문 프롬프트 카드 생성 (길이 제한 적용)
      const englishCards = {
        'Story': await translateToEnglish(story, promptLengthSettings.scenario),
        'Visual Settings': await translateToEnglish(generatedProjectData?.aiReviewResult?.videoPrompt || scenarioPrompt, promptLengthSettings.video),
        'Character Settings': await translateToEnglish(characterList.map(c => `${c.name}: ${c.description}`).join(', '), promptLengthSettings.scenario),
        'Additional Scenario Settings': await translateToEnglish(additionalScenarioSettings || 'None', promptLengthSettings.scenario),
        'Video Scenario': await translateToEnglish(finalScenario, promptLengthSettings.scenario),
        'Scene Cut Prompts': await translateToEnglish(generatedProjectData?.aiReviewResult?.scenarioReview || 'None', promptLengthSettings.scenario)
      };

      // JSON 데이터 형태로 저장
      const jsonData = {
        projectInfo: {
          title: 'Generated Project',
          createdAt: new Date().toISOString(),
          version: '1.0'
        },
        koreanCards,
        englishCards,
        settings: {
          promptLength: promptLengthSettings,
          sceneCuts: sceneCutSettings
        },
        aiReviewResult: generatedProjectData?.aiReviewResult
      };

      // MainLayout으로 전달할 데이터 설정
      setGeneratedProjectData((prev: any) => ({
        ...prev,
        ...jsonData
      }));

      // 3단계 완료 상태 업데이트
      setStepStatus((prev: any) => ({ ...prev, jsonCardsGenerated: true }));

      addNotification({
        type: 'success',
        title: '3단계 완료',
        message: 'JSON 카드 생성이 완료되었습니다. 프로젝트 개요 저장을 진행하세요.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: 'JSON 카드 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 4단계: 프로젝트 개요 저장 - 국문/영문 카드 생성
  const handleGenerateFinalPromptCards = async () => {
    if (!story || !finalScenario || !scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리, 영상 설정 프롬프트, 최종 시나리오를 모두 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 국문 프롬프트 카드 생성
      const koreanCards = {
        '스토리': story,
        '영상 설정': scenarioPrompt,
        '캐릭터 설정': characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        '시나리오 추가 설정': additionalScenarioSettings || '없음',
        '영상 시나리오': finalScenario
      };

      // 영문 프롬프트 카드 생성 (AI 서비스 사용, 길이 제한 적용)
      const englishCards = {
        'Story': await translateToEnglish(story, promptLengthSettings.scenario),
        'Visual Settings': await translateToEnglish(scenarioPrompt, promptLengthSettings.video),
        'Character Settings': await translateToEnglish(characterList.map(c => `${c.name}: ${c.description}`).join(', '), promptLengthSettings.scenario),
        'Additional Scenario Settings': await translateToEnglish(additionalScenarioSettings || 'None', promptLengthSettings.scenario),
        'Video Scenario': await translateToEnglish(finalScenario, promptLengthSettings.scenario)
      };

      // MainLayout으로 전달할 데이터 설정
      setGeneratedProjectData({
        koreanCards,
        englishCards,
        reviewResult: {
          korean: koreanCards,
          english: englishCards
        }
      });

      // 4단계 완료 상태 업데이트
      setStepStatus((prev: any) => ({ ...prev, projectOverviewSaved: true }));

      addNotification({
        type: 'success',
        title: '프로젝트 개요 저장 완료',
        message: '국문/영문 카드가 생성되었습니다. 오른쪽 본문에서 확인하세요.',
      });
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

  // AI 시나리오 생성 (4번 대사 + 5번 시나리오 추가 설정 + 영상 설정 프롬프트 기반)
  const handleGenerateScenario = async () => {
    if (!dialogue || !additionalScenarioSettings || !scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '대사(4번), 시나리오 추가 설정(5번), 영상 설정 프롬프트를 모두 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      const prompt = `다음 정보를 바탕으로 영상 제작용 시나리오를 생성해주세요:

=== 기본 정보 ===
스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

=== 핵심 입력 ===
대사: ${dialogue}
시나리오 추가 설정: ${additionalScenarioSettings}
영상 설정 프롬프트: ${scenarioPrompt}

=== 요청사항 ===
위의 대사, 시나리오 추가 설정, 영상 설정 프롬프트를 모두 통합하여 영상 제작에 적합한 완성된 시나리오를 생성해주세요. 
- 대사의 흐름과 타이밍을 고려한 장면 구성
- 시나리오 추가 설정의 특별한 요구사항 반영
- 영상 설정 프롬프트의 시각적 요소를 반영한 촬영 지시사항
- 캐릭터의 특성을 살린 연기 지도
- 영상 제작팀이 이해하기 쉬운 형태로 정리

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 생성된 시나리오는 반드시 ${promptLengthSettings.scenario}자 이내로 작성해주세요.
⚠️ 이 제한을 초과하면 안 됩니다. ${promptLengthSettings.scenario}자를 넘으면 생성이 실패합니다.
⚠️ 핵심 내용만 간결하게 정리하여 작성하세요.
⚠️ 불필요한 설명이나 반복은 절대 포함하지 마세요.
⚠️ 각 문장을 짧고 명확하게 작성하세요.

시나리오 생성:`;

      const result = await googleAIService.generateText(prompt);
      setFinalScenario(result);
      
      // 1단계 완료 상태 업데이트
      setStepStatus((prev: any) => ({ ...prev, scenarioGenerated: true }));
      
      addNotification({
        type: 'success',
        title: '1단계 완료',
        message: 'AI 시나리오가 생성되었습니다. 다음 단계를 진행하세요.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: 'AI 시나리오 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 2단계: 통합 AI 검토 및 프롬프트 생성
  const handleAICheckAndPromptGeneration = async () => {
    if (!stepStatus.scenarioGenerated) {
      addNotification({
        type: 'error',
        title: '순서 오류',
        message: '먼저 1단계 AI 시나리오 생성을 완료해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 영상 설정 프롬프트 검토 및 정리
      const videoPromptReview = await googleAIService.generateText(
        `다음 영상 설정 프롬프트를 검토하고 ${promptLengthSettings.video}자 이내로 정리해주세요:

원본 프롬프트:
${scenarioPrompt}

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 정리된 프롬프트는 반드시 ${promptLengthSettings.video}자 이내로 작성해주세요.
⚠️ 이 제한을 초과하면 안 됩니다. ${promptLengthSettings.video}자를 넘으면 생성이 실패합니다.
⚠️ 핵심 내용만 간결하게 정리하세요.
⚠️ 영상 제작에 필요한 핵심 정보만 포함하세요.
⚠️ 불필요한 설명은 제거하고 액션과 시각적 요소에 집중하세요.
⚠️ 각 문장을 짧고 명확하게 작성하세요.

정리된 프롬프트:`
      );

      // 시나리오 검토 및 씬별 컷별 프롬프트 생성
      const scenarioReview = await googleAIService.generateText(
        `다음 시나리오를 검토하고 씬별, 컷별로 나누어 각각 ${promptLengthSettings.scenario}자 이내의 프롬프트를 생성해주세요:

시나리오: ${finalScenario}

씬/컷 설정:
- 총 씬 수: ${sceneCutSettings.sceneCount}개
- 각 씬당 컷 수: ${sceneCutSettings.cutCount}개
- 총 컷 수: ${sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개

=== 🚨 절대적 제한사항 🚨 ===
⚠️ 각 컷별 프롬프트는 반드시 ${promptLengthSettings.scenario}자 이내로 작성해주세요.
⚠️ 이 제한을 초과하면 안 됩니다. ${promptLengthSettings.scenario}자를 넘으면 생성이 실패합니다.
⚠️ 핵심 액션과 시각적 요소에만 집중하세요.
⚠️ 불필요한 설명은 제거하고 간결하게 작성하세요.
⚠️ 각 문장을 짧고 명확하게 작성하세요.

요구사항:
1. 시나리오를 ${sceneCutSettings.sceneCount}개의 씬으로 나누기
2. 각 씬을 ${sceneCutSettings.cutCount}개의 컷으로 세분화
3. 씬별, 컷별로 명확하게 구분하여 출력
4. 각 프롬프트는 핵심 액션과 시각적 요소에 집중
5. 불필요한 설명은 제거하고 간결하게 작성

출력 형식:
씬 1:
  컷 1: [프롬프트 - ${promptLengthSettings.scenario}자 이내]
  컷 2: [프롬프트 - ${promptLengthSettings.scenario}자 이내]
  ...
씬 2:
  컷 1: [프롬프트 - ${promptLengthSettings.scenario}자 이내]
  컷 2: [프롬프트 - ${promptLengthSettings.scenario}자 이내]
  ...

씬별 컷별 프롬프트:`
      );

      // 검토 결과를 generatedProjectData에 저장
      setGeneratedProjectData((prev: any) => ({
        ...prev,
        aiReviewResult: {
          videoPrompt: videoPromptReview,
          scenarioReview: scenarioReview,
          sceneCutSettings: sceneCutSettings,
          promptLengthSettings: promptLengthSettings
        }
      }));

      // 2단계 완료 상태 업데이트
      setStepStatus((prev: any) => ({ ...prev, aiReviewCompleted: true }));

      addNotification({
        type: 'success',
        title: '2단계 완료',
        message: 'AI 검토 및 프롬프트 생성이 완료되었습니다. 다음 단계를 진행하세요.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '검토 실패',
        message: 'AI 검토 및 프롬프트 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };




  // 통합된 영문 번역 함수 (길이 제한 옵션 포함)
  const translateToEnglish = async (text: string, maxLength?: number): Promise<string> => {
    if (!text.trim()) return '';
    
    try {
      const lengthLimitText = maxLength ? `번역된 결과는 ${maxLength}자 이내로 작성해주세요.` : '';
      const requirements = maxLength ? [
        `- ${maxLength}자 이내로 작성`,
        '- 핵심 내용만 간결하게 번역',
        '- 불필요한 설명은 제거'
      ] : [
        '- 정확한 영어 번역',
        '- 영상 제작에 적합한 형태로 정리'
      ];

      const prompt = `다음 한국어 텍스트를 영어로 번역해주세요. ${lengthLimitText}

원본 텍스트:
${text}

요구사항:
${requirements.join('\n')}

${maxLength ? `=== 🚨 절대적 제한사항 🚨 ===
⚠️ 번역된 결과는 반드시 ${maxLength}자 이내로 작성해주세요.
⚠️ 이 제한을 초과하면 안 됩니다. ${maxLength}자를 넘으면 생성이 실패합니다.
⚠️ 핵심 내용만 간결하게 번역하세요.
⚠️ 불필요한 설명은 제거하세요.
⚠️ 각 문장을 짧고 명확하게 작성하세요.` : ''}

번역 결과:`;
      
      const result = await googleAIService.generateText(prompt);
      return result;
    } catch (error) {
      console.error('영문 번역 오류:', error);
      return `[English] ${text}`;
    }
  };




  return (
    <div className="space-y-4">
      {/* 프롬프트 출력 길이 설정 */}
      <div className="bg-blue-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">📏 프롬프트 출력 길이 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              영상 설정 프롬프트 길이 (자)
            </label>
            <input
              type="number"
              value={promptLengthSettings.video}
              onChange={(e) => setPromptLengthSettings(prev => ({
                ...prev,
                video: parseInt(e.target.value) || 1000
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="2000"
            />
            <div className="text-xs text-gray-500 mt-1">
              현재 설정: {promptLengthSettings.video}자 (AI 생성 시 적용됨)
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시나리오 프롬프트 길이 (자)
            </label>
            <input
              type="number"
              value={promptLengthSettings.scenario}
              onChange={(e) => setPromptLengthSettings(prev => ({
                ...prev,
                scenario: parseInt(e.target.value) || 2000
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="5000"
            />
            <div className="text-xs text-gray-500 mt-1">
              현재 설정: {promptLengthSettings.scenario}자 (AI 생성 시 적용됨)
            </div>
          </div>
        </div>
      </div>

      {/* 씬/컷 설정 */}
      <div className="bg-green-50 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3 text-green-800">🎬 씬/컷 설정</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                씬 숫자
              </label>
              <input
                type="number"
                value={sceneCutSettings.sceneCount}
                onChange={(e) => setSceneCutSettings(prev => ({
                  ...prev,
                  sceneCount: parseInt(e.target.value) || 3
                }))}
                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                컷 숫자
              </label>
              <input
                type="number"
                value={sceneCutSettings.cutCount}
                onChange={(e) => setSceneCutSettings(prev => ({
                  ...prev,
                  cutCount: parseInt(e.target.value) || 3
                }))}
                className="w-12 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="10"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            현재 설정: {sceneCutSettings.sceneCount}개 씬 × {sceneCutSettings.cutCount}개 컷 = 총 {sceneCutSettings.sceneCount * sceneCutSettings.cutCount}개 컷 (AI 생성 시 적용됨)
          </div>
        </div>
      </div>
      {/* 1. 스토리 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
            스토리
            {story && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">완료</span>
            )}
          </h3>
        </div>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="주요 스토리 라인을 입력하세요"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 2. 캐릭터 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            캐릭터
            {characterList.length > 0 && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">{characterList.length}개</span>
            )}
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={characterInput}
              onChange={(e) => setCharacterInput(e.target.value)}
              placeholder="캐릭터 설명을 입력하세요"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Button 
              onClick={handleAddCharacter}
              size="sm"
              variant="primary"
              className="text-xs"
            >
              추가
            </Button>
          </div>
          
          {/* 캐릭터 목록 */}
          {characterList.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {characterList.map((character) => (
                <div key={character.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-sm">{character.name}: {character.description}</span>
                  <button
                    onClick={() => handleDeleteCharacter(character.id)}
                    className="text-red-500 text-xs px-2 py-1 hover:bg-red-100 rounded"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. 시각 및 설정 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
            시각 및 설정
            {storyText && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">완료</span>
            )}
          </h3>
        </div>
        <textarea
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          placeholder="시각적 요소, 배경, 분위기, 색감 등 영상 제작을 위한 시각적 설정을 입력하세요"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <Button 
          className="w-full mt-2" 
          onClick={handleGenerateVisualSettingsPrompt}
          size="sm"
          variant="primary"
          disabled={!story.trim() || characterList.length === 0 || !storyText.trim()}
        >
          영상 설정 AI 생성
        </Button>
        {/* 시각 및 설정 결과는 오른쪽에 표시됨 */}
      </div>

      {/* 4. 대사 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            대사
            {dialogue && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">완료</span>
            )}
          </h3>
        </div>
        <textarea
          value={dialogue}
          onChange={(e) => setDialogue(e.target.value)}
          placeholder="주요 대사를 입력하세요"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* 5. 시나리오 추가 설정 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">5</span>
            시나리오 추가 설정
            {additionalScenarioSettings && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">완료</span>
            )}
          </h3>
        </div>
        <textarea
          value={additionalScenarioSettings}
          onChange={(e) => setAdditionalScenarioSettings(e.target.value)}
          placeholder="시나리오에 추가할 특별한 설정, 장면 전환, 특수 효과, 감정 표현 등을 입력하세요"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* 1단계: AI 시나리오 생성 버튼 */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 mb-2">
          {stepStatus.scenarioGenerated ? '✅ 1단계 완료' : '⏳ 1단계 대기'}
        </div>
        <Button 
          className={`w-full ${
            dialogue && additionalScenarioSettings && scenarioPrompt && !stepStatus.scenarioGenerated
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleGenerateScenario}
          disabled={!dialogue || !additionalScenarioSettings || !scenarioPrompt || stepStatus.scenarioGenerated || isGeneratingAll}
        >
          {isGeneratingAll ? 'AI 시나리오 생성 중...' : '1단계: AI 시나리오 생성'}
        </Button>
      </div>



      {/* 2단계: AI 검토 및 프롬프트 생성 버튼 */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 mb-2">
          {stepStatus.aiReviewCompleted ? '✅ 2단계 완료' : 
           stepStatus.scenarioGenerated ? '⏳ 2단계 준비됨' : '🔴 1단계 완료 필요'}
        </div>
        <Button 
          className={`w-full ${
            stepStatus.scenarioGenerated && !stepStatus.aiReviewCompleted
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleAICheckAndPromptGeneration}
          disabled={!stepStatus.scenarioGenerated || stepStatus.aiReviewCompleted || isGeneratingAll}
        >
          {isGeneratingAll ? 'AI 검토 중...' : '2단계: AI 검토 및 프롬프트 생성'}
        </Button>
      </div>

      {/* 3단계: JSON 카드 생성 버튼 */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 mb-2">
          {stepStatus.jsonCardsGenerated ? '✅ 3단계 완료' : 
           stepStatus.aiReviewCompleted ? '⏳ 3단계 준비됨' : '🔴 2단계 완료 필요'}
        </div>
        <Button 
          className={`w-full ${
            stepStatus.aiReviewCompleted && !stepStatus.jsonCardsGenerated
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleGenerateJsonCards}
          disabled={!stepStatus.aiReviewCompleted || stepStatus.jsonCardsGenerated || isGeneratingAll}
        >
          {isGeneratingAll ? 'JSON (영문)카드 생성 중...' : '3단계: JSON (영문)카드 완성'}
        </Button>
      </div>


      {/* 4단계: 프로젝트 개요 저장 및 다음 버튼 */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 mb-2">
          {stepStatus.jsonCardsGenerated ? '✅ 4단계 준비됨' : '🔴 3단계 완료 필요'}
        </div>
        <Button 
          className={`w-full ${
            stepStatus.jsonCardsGenerated
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={handleGenerateFinalPromptCards}
          disabled={!stepStatus.jsonCardsGenerated || isGeneratingAll}
        >
          {isGeneratingAll ? '프로젝트 저장 중...' : '4단계: 프로젝트 개요 저장'}
        </Button>
        
        {/* 프로젝트 개요 저장 완료 메시지 */}
        {stepStatus.projectOverviewSaved && (
          <div className="text-center py-2 px-4 bg-green-100 text-green-800 rounded-lg border border-green-200">
            <span className="text-sm font-medium">✅ 프로젝트 개요 저장됨</span>
          </div>
        )}
        
        <Button 
          className={`w-full ${
            stepStatus.jsonCardsGenerated && (!canProceedToNext || canProceedToNext())
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={onNext}
          disabled={!stepStatus.jsonCardsGenerated || (canProceedToNext && !canProceedToNext())}
        >
          다음
        </Button>
      </div>
    </div>
  );
};
