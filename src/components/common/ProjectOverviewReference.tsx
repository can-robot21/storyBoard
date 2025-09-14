import React from 'react';
import { FormattedText, FormattedJSON } from './FormattedText';

interface ProjectOverviewReferenceProps {
  story: string;
  characterList: any[];
  scenarioPrompt: string;
  storySummary: string;
  finalScenario: string;
  generatedProjectData: any;
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * 프로젝트 개요 결과물을 참고용으로 표시하는 컴포넌트
 */
export const ProjectOverviewReference: React.FC<ProjectOverviewReferenceProps> = ({
  story,
  characterList,
  scenarioPrompt,
  storySummary,
  finalScenario,
  generatedProjectData,
  isVisible,
  onToggle
}) => {
  if (!isVisible) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium mb-2">프로젝트 개요 참고</h3>
            <p className="text-sm text-gray-600">
              프로젝트 개요에서 생성된 텍스트를 참고할 수 있습니다.
            </p>
          </div>
          <button 
            onClick={onToggle}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            📝 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">프로젝트 개요 참고</h3>
        <button 
          onClick={onToggle}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          📝 감추기
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* 스토리 */}
        {story && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">스토리</h4>
            <FormattedText 
              text={story}
              className="text-xs text-gray-600"
            />
          </div>
        )}
        
        {/* 캐릭터 목록 */}
        {characterList.length > 0 && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">캐릭터 목록</h4>
            <div className="space-y-1">
              {characterList.map((char, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-medium">{char.name}:</span> {char.description}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 시나리오 프롬프트 */}
        {scenarioPrompt && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">시나리오 프롬프트</h4>
            <FormattedText 
              text={scenarioPrompt}
              className="text-xs text-gray-600"
            />
          </div>
        )}
        
        {/* 스토리 요약 */}
        {storySummary && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">스토리 요약</h4>
            <FormattedText 
              text={storySummary}
              className="text-xs text-gray-600"
            />
          </div>
        )}
        
        {/* 최종 시나리오 */}
        {finalScenario && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">최종 시나리오</h4>
            <FormattedText 
              text={finalScenario}
              className="text-xs text-gray-600"
            />
          </div>
        )}
        
        {/* 통합 AI 검토 결과 */}
        {generatedProjectData && (
          <div className="border rounded p-3 bg-gray-50">
            <h4 className="font-medium text-sm text-gray-700 mb-2">통합 AI 검토 결과</h4>
            <FormattedJSON 
              data={generatedProjectData.reviewResult}
              className="text-xs text-gray-600"
            />
          </div>
        )}
        
        {/* 데이터가 없는 경우 */}
        {!story && characterList.length === 0 && !scenarioPrompt && !storySummary && !finalScenario && !generatedProjectData && (
          <div className="text-center py-4 text-gray-500">
            <div className="text-2xl mb-2">📝</div>
            <p className="text-sm">프로젝트 개요에서 먼저 텍스트를 생성해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
