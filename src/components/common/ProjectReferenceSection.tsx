import React, { useState } from 'react';
import { FormattedText } from './FormattedText';

interface ProjectReferenceSectionProps {
  generatedProjectData: any;
  story: string;
  characterList: Array<{ id: number; name: string; description: string }>;
  finalScenario: string;
  scenarioPrompt: string;
  showKoreanCards: boolean;
  showEnglishCards: boolean;
  onToggleKoreanCards: () => void;
  onToggleEnglishCards: () => void;
}

// 항목별 가시성 상태 타입 (국문/영문 통합)
interface ItemVisibility {
  story: boolean;
  visualSettings: boolean;
  characterSettings: boolean;
  additionalScenarioSettings: boolean;
  videoScenario: boolean;
}

export const ProjectReferenceSection: React.FC<ProjectReferenceSectionProps> = ({
  generatedProjectData,
  story,
  characterList,
  finalScenario,
  scenarioPrompt,
  showKoreanCards,
  showEnglishCards,
  onToggleKoreanCards,
  onToggleEnglishCards
}) => {
  // 항목별 가시성 상태 관리 (국문/영문 통합)
  const [itemVisibility, setItemVisibility] = useState<ItemVisibility>({
    story: true,
    visualSettings: true,
    characterSettings: true,
    additionalScenarioSettings: true,
    videoScenario: true
  });

  // 항목별 가시성 토글 함수
  const toggleItem = (item: keyof ItemVisibility) => {
    setItemVisibility(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };
  return (
    <div className="mt-8 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          생성 프로젝트 참고
        </h2>
        
        <div className="space-y-4">
          {/* JSON 카드 생성 결과가 있으면 우선 표시, 없으면 기본 데이터 표시 */}
          {generatedProjectData?.koreanCards && generatedProjectData?.englishCards ? (
            <div className="space-y-4">
              {/* 스토리 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">📖</span>
                    스토리 / Story
                  </h4>
                  <button 
                    onClick={() => toggleItem('story')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.story ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.story && (
                  <div className="space-y-4">
                    {/* 국문 스토리 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.koreanCards['스토리'] || story}
                        className="text-sm text-gray-700"
                      />
                    </div>
                    {/* 영문 스토리 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.englishCards['Story'] || `[English] ${story}`}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 영상 설정 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">🎨</span>
                    영상 설정 / Visual Settings
                  </h4>
                  <button 
                    onClick={() => toggleItem('visualSettings')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.visualSettings ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.visualSettings && (
                  <div className="space-y-4">
                    {/* 국문 영상 설정 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.koreanCards['영상 설정'] || scenarioPrompt}
                        className="text-sm text-gray-700"
                      />
                    </div>
                    {/* 영문 영상 설정 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.englishCards['Visual Settings'] || `[English] ${scenarioPrompt}`}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 캐릭터 설정 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    캐릭터 설정 / Character Settings
                  </h4>
                  <button 
                    onClick={() => toggleItem('characterSettings')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.characterSettings ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.characterSettings && (
                  <div className="space-y-4">
                    {/* 국문 캐릭터 설정 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <div className="space-y-2">
                        {generatedProjectData.koreanCards['캐릭터 설정'] ? (
                          <FormattedText 
                            text={generatedProjectData.koreanCards['캐릭터 설정']}
                            className="text-sm text-gray-700"
                          />
                        ) : (
                          characterList.map((char, index) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-3">
                              <div className="font-medium text-gray-800">{char.name}</div>
                              <div className="text-sm text-gray-600">{char.description}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {/* 영문 캐릭터 설정 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <div className="space-y-2">
                        {generatedProjectData.englishCards['Character Settings'] ? (
                          <FormattedText 
                            text={generatedProjectData.englishCards['Character Settings']}
                            className="text-sm text-gray-700"
                          />
                        ) : (
                          characterList.map((char, index) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-3">
                              <div className="font-medium text-gray-800">[English] {char.name}</div>
                              <div className="text-sm text-gray-600">[English] {char.description}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 시나리오 추가 설정 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    시나리오 추가 설정 / Additional Scenario Settings
                  </h4>
                  <button 
                    onClick={() => toggleItem('additionalScenarioSettings')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.additionalScenarioSettings ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.additionalScenarioSettings && (
                  <div className="space-y-4">
                    {/* 국문 시나리오 추가 설정 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.koreanCards['시나리오 추가 설정'] || '없음'}
                        className="text-sm text-gray-700"
                      />
                    </div>
                    {/* 영문 시나리오 추가 설정 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.englishCards['Additional Scenario Settings'] || '[English] None'}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 영상 시나리오 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">🎬</span>
                    영상 시나리오 / Video Scenario
                  </h4>
                  <button 
                    onClick={() => toggleItem('videoScenario')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.videoScenario ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.videoScenario && (
                  <div className="space-y-4">
                    {/* 국문 영상 시나리오 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.koreanCards['영상 시나리오'] || finalScenario}
                        className="text-sm text-gray-700"
                      />
                    </div>
                    {/* 영문 영상 시나리오 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <FormattedText 
                        text={generatedProjectData.englishCards['Video Scenario'] || `[English] ${finalScenario}`}
                        className="text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 기본 데이터 표시 (JSON 카드가 없을 때) */
            <div className="space-y-4">
              {/* 스토리 */}
              {story && (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <span className="text-xl">📖</span>
                      스토리 / Story
                    </h4>
                    <button 
                      onClick={() => toggleItem('story')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {itemVisibility.story ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {itemVisibility.story && (
                    <div className="space-y-4">
                      {/* 국문 스토리 */}
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇰🇷</span>
                          국문
                        </h5>
                        <FormattedText 
                          text={story}
                          className="text-sm text-gray-700"
                        />
                      </div>
                      {/* 영문 스토리 */}
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                        <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇺🇸</span>
                          영문
                        </h5>
                        <FormattedText 
                          text={`[English] ${story}`}
                          className="text-sm text-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 영상 설정 */}
              {scenarioPrompt && (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <span className="text-xl">🎨</span>
                      영상 설정 / Visual Settings
                    </h4>
                    <button 
                      onClick={() => toggleItem('visualSettings')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {itemVisibility.visualSettings ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {itemVisibility.visualSettings && (
                    <div className="space-y-4">
                      {/* 국문 영상 설정 */}
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇰🇷</span>
                          국문
                        </h5>
                        <FormattedText 
                          text={scenarioPrompt}
                          className="text-sm text-gray-700"
                        />
                      </div>
                      {/* 영문 영상 설정 */}
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                        <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇺🇸</span>
                          영문
                        </h5>
                        <FormattedText 
                          text={`[English] ${scenarioPrompt}`}
                          className="text-sm text-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 캐릭터 설정 */}
              {characterList.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <span className="text-xl">👥</span>
                      캐릭터 설정 / Character Settings
                    </h4>
                    <button 
                      onClick={() => toggleItem('characterSettings')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {itemVisibility.characterSettings ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {itemVisibility.characterSettings && (
                    <div className="space-y-4">
                      {/* 국문 캐릭터 설정 */}
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇰🇷</span>
                          국문
                        </h5>
                        <div className="space-y-2">
                          {characterList.map((char, index) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-3">
                              <div className="font-medium text-gray-800">{char.name}</div>
                              <div className="text-sm text-gray-600">{char.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* 영문 캐릭터 설정 */}
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                        <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇺🇸</span>
                          영문
                        </h5>
                        <div className="space-y-2">
                          {characterList.map((char, index) => (
                            <div key={index} className="border-l-4 border-blue-200 pl-3">
                              <div className="font-medium text-gray-800">[English] {char.name}</div>
                              <div className="text-sm text-gray-600">[English] {char.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 시나리오 추가 설정 */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    시나리오 추가 설정 / Additional Scenario Settings
                  </h4>
                  <button 
                    onClick={() => toggleItem('additionalScenarioSettings')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {itemVisibility.additionalScenarioSettings ? '감추기' : '보이기'}
                  </button>
                </div>
                {itemVisibility.additionalScenarioSettings && (
                  <div className="space-y-4">
                    {/* 국문 시나리오 추가 설정 */}
                    <div className="bg-gray-50 rounded-lg border p-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇰🇷</span>
                        국문
                      </h5>
                      <FormattedText 
                        text="없음"
                        className="text-sm text-gray-700"
                      />
                    </div>
                    {/* 영문 시나리오 추가 설정 */}
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        영문
                      </h5>
                      <FormattedText 
                        text="[English] None"
                        className="text-sm text-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 영상 시나리오 */}
              {finalScenario && (
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                      <span className="text-xl">🎬</span>
                      영상 시나리오 / Video Scenario
                    </h4>
                    <button 
                      onClick={() => toggleItem('videoScenario')}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {itemVisibility.videoScenario ? '감추기' : '보이기'}
                    </button>
                  </div>
                  {itemVisibility.videoScenario && (
                    <div className="space-y-4">
                      {/* 국문 영상 시나리오 */}
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇰🇷</span>
                          국문
                        </h5>
                        <FormattedText 
                          text={finalScenario}
                          className="text-sm text-gray-700"
                        />
                      </div>
                      {/* 영문 영상 시나리오 */}
                      <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                        <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                          <span className="text-lg">🇺🇸</span>
                          영문
                        </h5>
                        <FormattedText 
                          text={`[English] ${finalScenario}`}
                          className="text-sm text-gray-700"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
