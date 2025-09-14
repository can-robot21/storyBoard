import React, { useState } from 'react';
import Button from '../common/Button';
import { useUIStore } from '../../stores/uiStore';
import { googleAIService } from '../../services/googleAIService';

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
  onNext
}) => {
  const { addNotification } = useUIStore();
  const [characterInput, setCharacterInput] = useState('');
  const [storyText, setStoryText] = useState('');
  const [dialogue, setDialogue] = useState('');
  const [additionalScenarioSettings, setAdditionalScenarioSettings] = useState('');
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

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
- 전체적인 영상 스타일 (장르, 톤앤매너)`;

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



  // 프로젝트 개요 저장 - 국문/영문 카드 생성
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

      // 영문 프롬프트 카드 생성 (AI 서비스 사용)
      const englishCards = {
        'Story': await translateToEnglish(story),
        'Visual Settings': await translateToEnglish(scenarioPrompt),
        'Character Settings': await translateToEnglish(characterList.map(c => `${c.name}: ${c.description}`).join(', ')),
        'Additional Scenario Settings': await translateToEnglish(additionalScenarioSettings || 'None'),
        'Video Scenario': await translateToEnglish(finalScenario)
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
- 영상 제작팀이 이해하기 쉬운 형태로 정리`;

      const result = await googleAIService.generateText(prompt);
      setFinalScenario(result);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: 'AI 시나리오가 생성되었습니다.',
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

  // AI 검토 및 프롬프트 정리
  const handleGeneratePromptCards = async () => {
    if (!scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '시나리오 프롬프트를 먼저 생성해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      // 국문 프롬프트 카드 생성
      const koreanCards = {
        '스토리': story,
        '캐릭터': characterList.map(c => `${c.name}: ${c.description}`).join(', '),
        '시나리오': storyText,
        '대사': dialogue,
        '시나리오프롬프트': scenarioPrompt
      };

      // 영문 프롬프트 카드 생성 (AI 서비스 사용)
      const englishCards = {
        'Story': await translateToEnglish(story),
        'Characters': await translateToEnglish(characterList.map(c => `${c.name}: ${c.description}`).join(', ')),
        'Scenario': await translateToEnglish(storyText),
        'Dialogue': await translateToEnglish(dialogue),
        'Scenario Prompt': await translateToEnglish(scenarioPrompt)
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

      addNotification({
        type: 'success',
        title: '생성 완료',
        message: 'AI 검토 및 프롬프트 정리가 완료되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: 'AI 검토 및 프롬프트 정리에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // AI 검토 및 시나리오 생성
  const handleGenerateFinalScenario = async () => {
    if (!dialogue || !scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '대사와 시나리오를 입력해주세요.',
      });
      return;
    }

    setIsGeneratingAll(true);
    try {
      const prompt = `다음 정보를 바탕으로 최종 시나리오를 생성해주세요:

=== 입력 정보 ===
스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
상세 스토리: ${storyText}
대사: ${dialogue}
시나리오: ${scenarioPrompt}

=== 요청사항 ===
위의 모든 정보를 통합하여 완성된 최종 시나리오를 생성해주세요. 영상 제작에 적합한 형태로 정리해주세요.`;

      const result = await googleAIService.generateText(prompt);
      setFinalScenario(result);
      
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: 'AI 검토 및 시나리오가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: 'AI 검토 및 시나리오 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // 영문 번역 함수
  const translateToEnglish = async (text: string): Promise<string> => {
    if (!text.trim()) return '';
    
    try {
      const prompt = `다음 한국어 텍스트를 영문으로 번역하고 영상 제작에 적합한 형태로 정리해주세요:\n\n${text}`;
      const result = await googleAIService.generateText(prompt);
      return result;
    } catch (error) {
      console.error('번역 오류:', error);
      return `[English] ${text}`;
    }
  };




  return (
    <div className="space-y-4">
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

      {/* AI 시나리오 생성 버튼 */}
      {dialogue && additionalScenarioSettings && scenarioPrompt && (
        <div className="space-y-3">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleGenerateScenario}
            disabled={isGeneratingAll}
          >
            {isGeneratingAll ? 'AI 시나리오 생성 중...' : 'AI 시나리오 생성'}
          </Button>
        </div>
      )}



      {/* AI 검토 및 영상 설정 정리 버튼 */}
      {scenarioPrompt && (
        <div className="space-y-3">
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={handleGeneratePromptCards}
            disabled={isGeneratingAll}
          >
            {isGeneratingAll ? 'AI 검토 중...' : 'AI 검토 및 영상 설정 정리'}
          </Button>
        </div>
      )}

      {/* AI 시나리오 검토 및 생성 버튼 */}
      {finalScenario && (
        <div className="space-y-3">
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700" 
            onClick={handleGenerateFinalScenario}
            disabled={isGeneratingAll}
          >
            {isGeneratingAll ? 'AI 검토 중...' : 'AI 시나리오 검토 및 생성'}
          </Button>
        </div>
      )}


      {/* 프로젝트 개요 저장 및 다음 버튼 */}
      {finalScenario && (
        <div className="space-y-3">
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            onClick={handleGenerateFinalPromptCards}
          >
            프로젝트 개요 저장
          </Button>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={onNext}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};
