import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Users,
  Image,
  Video,
  Bot,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface StepItem {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  count?: number;
  data?: any[];
  isVisible: boolean;
  progress?: number; // 진행률 추가
  details?: string; // 상세 정보 추가
}

interface StepProgressPanelProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  // 프로젝트 데이터
  story?: string;
  characterList?: any[];
  finalScenario?: string;
  generatedProjectData?: any;
  // 생성된 컨텐츠
  generatedCharacters?: any[];
  generatedBackgrounds?: any[];
  generatedSettingCuts?: any[];
  generatedAdvancedImages?: any[];
  generatedTextCards?: any[];
  generatedVideos?: any[];
  // 영상 생성에서 추가된 캐릭터/배경 이미지
  generatedCharacterImages?: any[];
  generatedVideoBackgrounds?: any[];
  // 영상 설정 데이터
  videoSettings?: {
    quality?: string;
    duration?: string;
    ratio?: string;
    englishPrompt?: string;
  };
  // 컷별 텍스트 카드 선택 상태
  cutTextCardSelections?: {[key: string]: Set<number>};
  selectedCuts?: Set<string>;
  // 핸들러
  onShowReference: (type: string, data: any[], aiProvider?: string) => void;
  onDeleteItem?: (type: string, index: number) => void;
  
  // AI 설정
  selectedAIProvider?: string;
  onAISettingsClick?: () => void;
  
  // API 키 상태
  hasAPIKey?: boolean;
  
  // 모달 토글 관련
  onToggleModal?: () => void;
  isModalVisible?: boolean;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
}

export const StepProgressPanel: React.FC<StepProgressPanelProps> = ({
  currentStep,
  onStepChange,
  story,
  characterList = [],
  finalScenario,
  generatedProjectData,
  generatedCharacters = [],
  generatedBackgrounds = [],
  generatedSettingCuts = [],
  generatedAdvancedImages = [],
  generatedTextCards = [],
  generatedVideos = [],
  generatedCharacterImages = [],
  generatedVideoBackgrounds = [],
  videoSettings = {},
  cutTextCardSelections = {},
  selectedCuts = new Set(),
  onShowReference,
  onDeleteItem,
  selectedAIProvider = 'google',
  onAISettingsClick,
  hasAPIKey = false,
  onToggleModal,
  isModalVisible = true,
  isAdmin = false,
  isLoggedIn = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 기본값: 감추기
  const [itemVisibility, setItemVisibility] = useState<{ [key: string]: boolean }>({
    story: true,
    characters: true,
    scenario: false,
    projectData: false,
    characterImages: false,
    backgroundImages: false,
    settingCuts: false,
    advancedImages: false,
    textCards: false,
    videos: true,
    videoSettings: false
  });

  // 단계별 항목 구성
  const getStepItems = (): StepItem[] => {
    const baseItems: StepItem[] = [
      {
        id: 'story',
        label: '스토리',
        status: story && story.trim() ? 'completed' : 'pending',
        data: story && story.trim() ? [{ content: story }] : [],
        isVisible: itemVisibility.story
      },
      {
        id: 'characters',
        label: '캐릭터',
        status: characterList.length > 0 ? 'completed' : 'pending',
        count: characterList.length,
        data: characterList,
        isVisible: itemVisibility.characters
      },
      {
        id: 'scenario',
        label: '시나리오',
        status: finalScenario ? 'completed' : 'pending',
        data: finalScenario ? [{ content: finalScenario }] : [],
        isVisible: itemVisibility.scenario
      },
      {
        id: 'projectData',
        label: 'JSON 카드',
        status: generatedProjectData ? 'completed' : 'pending',
        data: generatedProjectData ? [generatedProjectData] : [],
        isVisible: itemVisibility.projectData
      }
    ];

    // 현재 단계에 따른 추가 항목
    if (currentStep === 'TXT2IMG' || currentStep === 'IMG2IMG' || currentStep === '영상 생성') {
      baseItems.push(
        {
          id: 'characterImages',
          label: '캐릭터 이미지',
          status: (generatedCharacters.length > 0 || generatedCharacterImages.length > 0) ? 'completed' : 'pending',
          count: generatedCharacters.length + generatedCharacterImages.length,
          data: [...generatedCharacters, ...generatedCharacterImages],
          isVisible: itemVisibility.characterImages
        },
        {
          id: 'backgroundImages',
          label: '배경 이미지',
          status: (generatedBackgrounds.length > 0 || generatedVideoBackgrounds.length > 0) ? 'completed' : 'pending',
          count: generatedBackgrounds.length + generatedVideoBackgrounds.length,
          data: [...generatedBackgrounds, ...generatedVideoBackgrounds],
          isVisible: itemVisibility.backgroundImages
        },
        {
          id: 'settingCuts',
          label: '설정컷',
          status: generatedSettingCuts.length > 0 ? 'completed' : 'pending',
          count: generatedSettingCuts.length,
          data: generatedSettingCuts,
          isVisible: itemVisibility.settingCuts
        },
        {
          id: 'advancedImages',
          label: '고급 이미지',
          status: generatedAdvancedImages.length > 0 ? 'completed' : 'pending',
          count: generatedAdvancedImages.length,
          data: generatedAdvancedImages,
          isVisible: itemVisibility.advancedImages
        }
      );
    }

    // 영상 생성 단계에서만 생성된 영상 항목 추가
    if (currentStep === '영상 생성') {
      baseItems.push(
        {
          id: 'generatedVideos',
          label: '생성된 영상',
          status: generatedVideos.length > 0 ? 'completed' : 'pending',
          count: generatedVideos.length,
          data: generatedVideos,
          isVisible: itemVisibility.videos
        }
      );
    }

    if (currentStep === '영상 생성') {
      baseItems.push(
        {
          id: 'videoSettings',
          label: '영상 설정',
          status: videoSettings && Object.keys(videoSettings).length > 0 ? 'completed' : 'pending',
          data: videoSettings ? [videoSettings] : [],
          isVisible: itemVisibility.videoSettings
        },
        {
          id: 'textCards',
          label: '텍스트 카드',
          status: generatedTextCards.length > 0 ? 'completed' : 'pending',
          count: generatedTextCards.length,
          data: generatedTextCards,
          isVisible: itemVisibility.textCards
        }
      );
    }

    return baseItems;
  };

  const stepItems = getStepItems();

  const toggleItemVisibility = (itemId: string) => {
    setItemVisibility(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const getStatusIcon = (status: StepItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'error':
        return <Circle className="w-4 h-4 text-red-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getItemIcon = (itemId: string) => {
    switch (itemId) {
      case 'story':
      case 'scenario':
      case 'projectData':
      case 'textCards':
        return <FileText className="w-4 h-4" />;
      case 'characters':
        return <Users className="w-4 h-4" />;
      case 'characterImages':
      case 'backgroundImages':
      case 'settingCuts':
        return <Image className="w-4 h-4" />;
      case 'videos':
        return <Video className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };


  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      {/* 헤더 - 항상 표시 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* 왼쪽: 진행 상황 정보 */}
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800">진행 상황</h3>
          <span className="text-xs text-gray-500">
            {stepItems.filter(item => item.status === 'completed').length} / {stepItems.length} 완료
          </span>
          {/* 전체 진행률 표시 */}
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(stepItems.filter(item => item.status === 'completed').length / stepItems.length) * 100}%` 
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">
              {Math.round((stepItems.filter(item => item.status === 'completed').length / stepItems.length) * 100)}%
            </span>
          </div>
        </div>

        {/* 중앙: 단계별 네비게이션 */}
        <div className="flex items-center gap-2">
          {['프로젝트 개요', 'TXT2IMG', 'IMG2IMG', '영상 생성', '스토리보드 생성'].map((step) => (
            <button
              key={step}
              onClick={() => onStepChange(step)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                currentStep === step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {/* 오른쪽: 컨트롤 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 하단 도구패널 보이기/감추기 버튼 */}
          {onToggleModal && (
            <button
              onClick={onToggleModal}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              title={isModalVisible ? '하단 도구패널 숨기기' : '하단 도구패널 보이기'}
            >
              {isModalVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* AI 서비스 표시 및 설정 */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
            <Bot className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {selectedAIProvider === 'google' ? 'Google AI' :
               selectedAIProvider === 'openai' ? 'OpenAI' : selectedAIProvider}
            </span>
            {onAISettingsClick && (
              <button
                onClick={onAISettingsClick}
                className="ml-1 p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                title="AI 서비스 설정"
              >
                <Bot className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 패널 확장/축소 버튼 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={isExpanded ? '패널 접기' : '패널 펼치기'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 내용 */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {stepItems.map((item) => (
              <div
                key={item.id}
                className={`group p-3 rounded-lg border transition-all ${
                  item.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : item.status === 'in_progress'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* 항목 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    {getItemIcon(item.id)}
                    <span className="text-sm font-medium text-gray-800">
                      {item.label}
                    </span>
                    {item.count !== undefined && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 참조 버튼 */}
                    {item.data && item.data.length > 0 && (
                      <button
                        onClick={() => onShowReference(item.id, item.data || [], selectedAIProvider)}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                        title="참조 보기"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}

                    {/* 표시/숨김 토글 */}
                    <button
                      onClick={() => toggleItemVisibility(item.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                      title={item.isVisible ? "숨기기" : "보이기"}
                    >
                      {item.isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* 상태 표시 */}
                {item.isVisible && (
                  <div className="text-xs text-gray-600">
                    {item.status === 'completed' && item.data && item.data.length > 0 && (
                      <div className="text-green-700">
                        ✓ 생성 완료
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <div className="text-gray-500">
                        대기 중
                      </div>
                    )}
                    {item.status === 'in_progress' && (
                      <div className="text-blue-700">
                        진행 중...
                      </div>
                    )}
                  </div>
                )}

                {/* 미리보기 (필요시) */}
                {item.isVisible && item.status === 'completed' && item.data && item.data.length > 0 && (
                  <div className="mt-2">
                    {item.id === 'story' && item.data[0]?.content && (
                      <div className="text-xs text-gray-600 line-clamp-2 truncate">
                        {item.data[0].content.substring(0, 50)}...
                      </div>
                    )}
                    
                    {/* 이미지 카드들 */}
                    {['characterImages', 'backgroundImages', 'settingCuts'].includes(item.id) && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {item.data.slice(0, 4).map((imageItem: any, index: number) => (
                          <div key={index} className="relative">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={imageItem.image || imageItem}
                                alt={`${item.label} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        ))}
                        {item.data.length > 4 && (
                          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            +{item.data.length - 4}개 더
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 텍스트 카드들 */}
                    {item.id === 'textCards' && (
                      <div className="space-y-3 mt-2">
                        {item.data.slice(0, 2).map((textCard: any, index: number) => {
                          // 컷별 텍스트 파싱 (기존 MainLayout과 동일한 로직)
                          const parseCutTexts = (text: string) => {
                            const cutPattern = /--- \*\*컷\s*(\d+):\s*([^*]+)\*\*/g;
                            const cuts: { [key: number]: { title: string; content: string; sections: any } } = {};
                            let match;
                            
                            // 모든 컷 매치를 먼저 찾기
                            const allMatches: Array<{
                              cutNumber: number;
                              cutTitle: string;
                              startIndex: number;
                              match: RegExpExecArray;
                            }> = [];
                            while ((match = cutPattern.exec(text)) !== null) {
                              allMatches.push({
                                cutNumber: parseInt(match[1]),
                                cutTitle: match[2].trim(),
                                startIndex: match.index + match[0].length,
                                match: match
                              });
                            }

                            // 각 컷의 내용 추출
                            allMatches.forEach((cutMatch, index) => {
                              const cutNumber = cutMatch.cutNumber;
                              const cutTitle = cutMatch.cutTitle;
                              const startIndex = cutMatch.startIndex;
                              
                              // 다음 컷의 시작 위치 또는 텍스트 끝까지
                              const nextCutStart = index < allMatches.length - 1 
                                ? allMatches[index + 1].match.index 
                                : text.length;
                              
                              const cutContent = text.substring(startIndex, nextCutStart).trim();
                              
                              // 각 섹션 파싱 (필수/추가 항목)
                              const sections = {
                                character: '',
                                action: '',
                                background: '',
                                dialogue: '',
                                composition: '',
                                lighting: '',
                                cameraMovement: ''
                              };
                              
                              // 개선된 파싱 패턴들 (여러 가능한 형식 지원)
                              const patterns = {
                                character: [
                                  /\*\s*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,  // * **캐릭터:**
                                  /\*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,        // ***캐릭터:**
                                  /\*\*\*캐릭터:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,        // **캐릭터:**
                                  /캐릭터:\s*([\s\S]*?)(?=\*\*|$)/,                     // 캐릭터: (간단한 형태)
                                  /👤\s*캐릭터\s*([\s\S]*?)(?=🏃|🏞️|💬|📐|💡|🎥|$)/i,  // 이모지 형식
                                  /캐릭터[:\s]*([\s\S]*?)(?=🏃|🏞️|💬|📐|💡|🎥|액션|배경|대사|구도|조명|카메라|$)/i
                                ],
                                action: [
                                  /\*\s*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*액션:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /액션:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /🏃\s*액션\s*([\s\S]*?)(?=🏞️|💬|📐|💡|🎥|$)/i,
                                  /액션[:\s]*([\s\S]*?)(?=🏞️|💬|📐|💡|🎥|배경|대사|구도|조명|카메라|$)/i
                                ],
                                background: [
                                  /\*\s*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*배경:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /배경:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /🏞️\s*배경\s*([\s\S]*?)(?=💬|📐|💡|🎥|$)/i,
                                  /배경[:\s]*([\s\S]*?)(?=💬|📐|💡|🎥|대사|구도|조명|카메라|$)/i
                                ],
                                dialogue: [
                                  /\*\s*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*대사:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /대사:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /💬\s*대사\s*([\s\S]*?)(?=📐|💡|🎥|$)/i,
                                  /대사[:\s]*([\s\S]*?)(?=📐|💡|🎥|구도|조명|카메라|$)/i
                                ],
                                composition: [
                                  /\*\s*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*구도:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /구도:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /📐\s*구도\s*([\s\S]*?)(?=💡|🎥|$)/i,
                                  /구도[:\s]*([\s\S]*?)(?=💡|🎥|조명|카메라|$)/i
                                ],
                                lighting: [
                                  /\*\s*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*조명:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /조명:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /💡\s*조명\s*([\s\S]*?)(?=🎥|$)/i,
                                  /조명[:\s]*([\s\S]*?)(?=🎥|카메라|$)/i
                                ],
                                cameraMovement: [
                                  /\*\s*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/,
                                  /\*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /\*\*\*카메라 움직임:\*\*\s*([\s\S]*?)(?=\*\*\*|$)/,
                                  /카메라 움직임:\s*([\s\S]*?)(?=\*\*|$)/,
                                  /🎥\s*카메라\s*움직임\s*([\s\S]*?)(?=$)/i,
                                  /카메라\s*움직임[:\s]*([\s\S]*?)(?=$)/i
                                ]
                              };

                              // 각 섹션에 대해 여러 패턴 시도
                              Object.keys(patterns).forEach(sectionKey => {
                                for (const pattern of patterns[sectionKey as keyof typeof patterns]) {
                                  const match = cutContent.match(pattern);
                                  if (match) {
                                    sections[sectionKey as keyof typeof sections] = match[1].trim();
                                    break;
                                  }
                                }
                              });

                              cuts[cutNumber] = {
                                title: cutTitle,
                                content: cutContent,
                                sections: sections
                              };
                            });

                            return cuts;
                          };

                          const cuts = parseCutTexts(textCard.generatedText || textCard);
                          const cardId = textCard.id || index;
                          const cardKey = `card_${cardId}`;
                          const cutCount = Object.keys(cuts).length;

                          return (
                            <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-3">
                              {/* 씬 헤더 */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium text-green-700">씬{index + 1}</h4>
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                      {cutCount}컷
                                    </span>
                                  </div>
                                </div>
                              
                              {/* 씬 공통설정 */}
                              {textCard.sceneCommon && (
                                <div className="bg-white border border-green-200 rounded-lg p-2 mb-3">
                                  <h5 className="text-xs font-medium text-green-700 mb-1">씬 공통설정</h5>
                                  <div className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-2">
                                    {textCard.sceneCommon}
                                  </div>
                                </div>
                              )}

                              {/* 스토리 */}
                              {textCard.story && (
                                <div className="bg-white border border-green-200 rounded-lg p-2 mb-3">
                                  <h5 className="text-xs font-medium text-green-700 mb-1">스토리</h5>
                                  <div className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-2">
                                    {textCard.story}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {item.data.length > 2 && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            +{item.data.length - 2}개 텍스트 카드 더
                          </div>
                        )}
                      </div>
                    )}
                    {item.id === 'videos' && (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {item.data.slice(0, 2).map((videoItem: any, index: number) => (
                          <div key={index} className="relative">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <video
                                src={videoItem.video || videoItem}
                                controls
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                              {videoItem.videoRatio || '16:9'}
                            </div>
                          </div>
                        ))}
                        {item.data.length > 2 && (
                          <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                            +{item.data.length - 2}개 더
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};