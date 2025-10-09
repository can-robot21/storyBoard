import React, { useState } from 'react';
import { X, FileText, Image, Video, User, Settings, ChevronDown, ChevronUp, Globe, Flag, Share2, Download, Copy, Trash2, Plus } from 'lucide-react';
import { FormattedJSON } from './FormattedText';
import { shareProjectData, DataSharingOptions } from '../../utils/dataSharingUtils';
import { downloadBase64Image, downloadVideo } from '../../utils/downloadUtils';
import { useAIService } from '../../hooks/useAIService';
import { useUIStore } from '../../stores/uiStore';

interface ProjectReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 프로젝트 데이터
  story?: string;
  characterList?: Array<{ id: number; name: string; description: string }>;
  finalScenario?: string;
  generatedProjectData?: any;
  // 생성된 컨텐츠
  generatedCharacters?: any[];
  generatedBackgrounds?: any[];
  generatedSettingCuts?: any[];
  generatedTextCards?: any[];
  generatedVideos?: any[];
  // 영상 생성에서 추가된 캐릭터/배경 이미지
  generatedCharacterImages?: any[];
  generatedVideoBackgrounds?: any[];
  // 영상 설정
  videoSettings?: {
    quality?: string;
    duration?: string;
    ratio?: string;
    englishPrompt?: string;
  };
  // 삭제 핸들러
  onDeleteItem?: (type: string, index: number) => void;
  // JSON 카드 생성 핸들러
  onGenerateJsonCard?: (cardType: string, content: string) => void;
  // 에피소드/씬 구조 데이터
  episodes?: Array<{
    id: number;
    title: string;
    description: string;
    scenes: Array<{
      id: number;
      title: string;
      description: string;
      cuts: number;
    }>;
  }>;
  // 컷별 텍스트 카드 선택 상태
  cutTextCardSelections?: {[key: string]: Set<number>};
  selectedCuts?: Set<string>;
  // 에피소드 선택 핸들러
  onEpisodeSelection?: (episode: any) => void;
  // 개별 항목 편집 핸들러
  onEditItem?: (type: string, index: number, data: any) => void;
  // 개별 항목 재생성 핸들러
  onRegenerateItem?: (type: string, index: number) => void;
}

interface SectionVisibility {
  projectInfo: boolean;
  characters: boolean;
  scenario: boolean;
  textCards: boolean;
  characterImages: boolean;
  backgroundImages: boolean;
  settingCutImages: boolean;
  videos: boolean;
  jsonCards: boolean;
  englishJson: boolean;
  koreanJson: boolean;
  rawData: boolean;
  videoSettings: boolean;
  englishPrompt: boolean;
  koreanCards: boolean;
  englishCards: boolean;
  episodes: boolean;
}

type TabType = 'project' | 'images' | 'videos' | 'textcards' | 'data';

export const ProjectReferenceModal: React.FC<ProjectReferenceModalProps> = ({
  isOpen,
  onClose,
  story,
  characterList = [],
  finalScenario,
  generatedProjectData,
  generatedCharacters = [],
  generatedBackgrounds = [],
  generatedSettingCuts = [],
  generatedTextCards = [],
  generatedVideos = [],
  generatedCharacterImages = [],
  generatedVideoBackgrounds = [],
  videoSettings = {},
  onDeleteItem,
  onGenerateJsonCard,
  episodes = [],
  cutTextCardSelections = {},
  selectedCuts = new Set(),
  onEpisodeSelection,
  onEditItem,
  onRegenerateItem
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('project');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  // 카드별 열기/닫기 상태 관리
  const [cardVisibility, setCardVisibility] = useState<{ [key: string]: boolean }>({});
  
  // JSON 카드 생성 상태
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [generatingCardType, setGeneratingCardType] = useState<string | null>(null);
  
  // 이미지 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // 개별 편집 상태
  const [editingItem, setEditingItem] = useState<{
    type: string;
    index: number;
    data: any;
  } | null>(null);
  
  const { generateText } = useAIService();
  const { addNotification } = useUIStore();
  
  // 개별 편집 핸들러
  const handleEditItem = (type: string, index: number, data: any) => {
    setEditingItem({ type, index, data });
  };

  const handleSaveEdit = () => {
    if (editingItem && onEditItem) {
      onEditItem(editingItem.type, editingItem.index, editingItem.data);
      setEditingItem(null);
      addNotification({
        type: 'success',
        title: '편집 완료',
        message: '항목이 성공적으로 편집되었습니다.',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleRegenerateItem = async (type: string, index: number) => {
    if (onRegenerateItem) {
      onRegenerateItem(type, index);
      addNotification({
        type: 'info',
        title: '재생성 시작',
        message: '항목을 재생성하고 있습니다...',
      });
    }
  };
  
  // JSON 카드 생성 함수
  const handleGenerateJsonCard = async (cardType: string) => {
    if (!onGenerateJsonCard) return;
    
    setIsGeneratingCard(true);
    setGeneratingCardType(cardType);
    
    try {
      let prompt = '';
      let content = '';
      
      switch (cardType) {
        case '스토리':
          prompt = `다음 정보를 바탕으로 영상 제작에 적합한 스토리를 생성해주세요:
- 기본 스토리: ${story || '없음'}
- 캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ') || '없음'}
- 시나리오: ${finalScenario || '없음'}

영상 제작에 최적화된 스토리를 500자 이내로 생성해주세요.`;
          break;
          
        case '영상 설정':
          prompt = `다음 정보를 바탕으로 영상 제작 설정을 생성해주세요:
- 기본 스토리: ${story || '없음'}
- 시나리오: ${finalScenario || '없음'}
- 영상 설정: ${JSON.stringify(videoSettings) || '없음'}

영상 제작에 필요한 설정 정보를 300자 이내로 생성해주세요.`;
          break;
          
        case '캐릭터 설정':
          prompt = `다음 캐릭터 정보를 바탕으로 영상 제작에 적합한 캐릭터 설정을 생성해주세요:
- 캐릭터 목록: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ') || '없음'}
- 생성된 캐릭터 이미지: ${generatedCharacters.length}개
- 추가 캐릭터 이미지: ${generatedCharacterImages.length}개

영상 제작에 최적화된 캐릭터 설정을 400자 이내로 생성해주세요.`;
          break;
          
        case '씬/컷 구성':
          prompt = `다음 정보를 바탕으로 씬과 컷 구성 정보를 생성해주세요:
- 에피소드: ${episodes.length}개
- 시나리오: ${finalScenario || '없음'}
- 텍스트 카드: ${generatedTextCards.length}개

영상 제작에 필요한 씬/컷 구성 정보를 300자 이내로 생성해주세요.`;
          break;
          
        case '시나리오 추가 설정':
          prompt = `다음 정보를 바탕으로 시나리오 추가 설정을 생성해주세요:
- 기본 스토리: ${story || '없음'}
- 시나리오: ${finalScenario || '없음'}
- 영상 설정: ${JSON.stringify(videoSettings) || '없음'}

영상 제작에 필요한 추가 설정을 300자 이내로 생성해주세요.`;
          break;
          
        case '영상 시나리오':
          prompt = `다음 정보를 바탕으로 영상 시나리오를 생성해주세요:
- 기본 스토리: ${story || '없음'}
- 시나리오: ${finalScenario || '없음'}
- 텍스트 카드: ${generatedTextCards.length}개

영상 제작에 최적화된 시나리오를 600자 이내로 생성해주세요.`;
          break;
          
        case '씬별 컷별 프롬프트':
          prompt = `다음 정보를 바탕으로 씬별 컷별 프롬프트를 생성해주세요:
- 에피소드: ${episodes.length}개
- 텍스트 카드: ${generatedTextCards.length}개
- 시나리오: ${finalScenario || '없음'}

각 씬과 컷에 대한 상세 프롬프트를 500자 이내로 생성해주세요.`;
          break;
          
        default:
          prompt = `다음 정보를 바탕으로 ${cardType} 관련 내용을 생성해주세요:
- 기본 스토리: ${story || '없음'}
- 시나리오: ${finalScenario || '없음'}
- 캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ') || '없음'}

${cardType}에 대한 내용을 400자 이내로 생성해주세요.`;
      }
      
      const result = await generateText({
        prompt,
        model: 'gemini-2.5-flash',
        maxTokens: 1000,
        temperature: 0.7
      });
      
      if (result) {
        onGenerateJsonCard(cardType, result);
        addNotification({
          type: 'success',
          title: '카드 생성 완료',
          message: `${cardType} 카드가 성공적으로 생성되었습니다.`
        });
      }
    } catch (error) {
      console.error('JSON 카드 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: `${cardType} 카드 생성에 실패했습니다.`
      });
    } finally {
      setIsGeneratingCard(false);
      setGeneratingCardType(null);
    }
  };

  // 생성된 카드 상태 관리
  const [generatedCards, setGeneratedCards] = useState<{
    korean: any[];
    english: any[];
  }>({ korean: [], english: [] });

  // 섹션별 표시/숨김 상태 (기본 감춤)
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    projectInfo: true,
    characters: true,
    scenario: false,
    textCards: false,
    characterImages: false,
    backgroundImages: false,
    settingCutImages: false,
    videos: true,
    jsonCards: false,
    englishJson: false,
    koreanJson: false,
    rawData: false,
    videoSettings: false,
    englishPrompt: false,
    koreanCards: true,
    englishCards: true,
    episodes: true
  });

  // 섹션 토글 함수
  const toggleSection = (section: keyof SectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 모든 섹션 표시/숨김
  const toggleAllSections = (show: boolean) => {
    setSectionVisibility(prev =>
      Object.keys(prev).reduce((acc, key) => ({
        ...acc,
        [key]: show
      }), {} as SectionVisibility)
    );
  };

  // 카드별 토글 함수
  const toggleCard = (cardId: string) => {
    setCardVisibility(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // 카드 데이터 생성 함수
  const generateCards = () => {
    const koreanCards: any[] = [];
    const englishCards: any[] = [];

    // 텍스트 카드에서 국문/영문 카드 생성
    if (generatedTextCards && generatedTextCards.length > 0) {
      generatedTextCards.forEach((card, index) => {
        // 국문 카드 생성
        koreanCards.push({
          id: `korean_${index}`,
          scene: index + 1,
          content: card.generatedText,
          timestamp: card.timestamp,
          type: 'korean'
        });

        // 영문 카드 생성 (영문 프롬프트가 있는 경우)
        if (videoSettings?.englishPrompt) {
          englishCards.push({
            id: `english_${index}`,
            scene: index + 1,
            content: `${videoSettings.englishPrompt}\n\n${card.generatedText}`,
            timestamp: card.timestamp,
            type: 'english'
          });
        }
      });
    }

    // JSON 카드에서도 국문/영문 카드 생성
    if (generatedProjectData?.jsonCards) {
      generatedProjectData.jsonCards.forEach((card: any, index: number) => {
        const cardIndex = koreanCards.length + index;
        
        if (card.korean || card.ko || card.kor) {
          koreanCards.push({
            id: `korean_json_${index}`,
            scene: cardIndex + 1,
            content: card.korean || card.ko || card.kor,
            timestamp: card.timestamp || new Date().toISOString(),
            type: 'korean',
            source: 'json'
          });
        }
        
        if (card.english || card.en || card.eng) {
          englishCards.push({
            id: `english_json_${index}`,
            scene: cardIndex + 1,
            content: card.english || card.en || card.eng,
            timestamp: card.timestamp || new Date().toISOString(),
            type: 'english',
            source: 'json'
          });
        }
      });
    }

    setGeneratedCards({ korean: koreanCards, english: englishCards });
    
    // 모든 카드를 기본적으로 열린 상태로 설정
    const initialVisibility: { [key: string]: boolean } = {};
    [...koreanCards, ...englishCards].forEach(card => {
      initialVisibility[card.id] = true;
    });
    setCardVisibility(initialVisibility);
  };

  // 데이터 공유 함수들
  const handleShareData = async (format: 'clipboard' | 'url' | 'json') => {
    setIsSharing(true);
    setShareMessage('');

    try {
      const projectData = {
        story,
        characterList,
        finalScenario,
        generatedProjectData,
        generatedCharacters,
        generatedBackgrounds,
        generatedSettingCuts,
        generatedTextCards,
        generatedVideos
      };

      const options: DataSharingOptions = {
        includeImages: true,
        includeVideos: true,
        includeMetadata: true,
        compressData: true,
        format
      };

      const result = await shareProjectData(projectData, options);

      if (result.success) {
        if (format === 'clipboard') {
          setShareMessage('데이터가 클립보드에 복사되었습니다.');
        } else if (format === 'url' && result.url) {
          setShareMessage(`공유 URL: ${result.url}`);
        } else if (format === 'json') {
          setShareMessage('JSON 파일이 다운로드되었습니다.');
        }
      } else {
        setShareMessage(`공유 실패: ${result.error}`);
      }
    } catch (error) {
      setShareMessage(`오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'project' as TabType, label: '프로젝트 정보', icon: FileText },
    { id: 'images' as TabType, label: '참고 이미지', icon: Image },
    { id: 'videos' as TabType, label: '생성된 영상', icon: Video },
    { id: 'textcards' as TabType, label: '텍스트 카드', icon: FileText },
    { id: 'data' as TabType, label: '데이터 및 JSON', icon: Settings }
  ];

  // 섹션 헤더 컴포넌트
  const SectionHeader: React.FC<{
    title: string;
    icon: React.ComponentType<any>;
    section: keyof SectionVisibility;
    count?: number;
  }> = ({ title, icon: Icon, section, count }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium">{title}</span>
        {count !== undefined && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {count}
          </span>
        )}
      </div>
      {sectionVisibility[section] ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  // 프로젝트 정보 렌더링
  const renderProjectInfo = () => (
    <div className="space-y-4">
      <SectionHeader
        title="프로젝트 기본 정보"
        icon={FileText}
        section="projectInfo"
      />
      {sectionVisibility.projectInfo && (
        <div className="p-4 bg-white border rounded-lg">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                스토리
              </label>
              <div className="p-3 bg-gray-50 rounded border text-sm">
                {story || '스토리가 입력되지 않았습니다.'}
              </div>
            </div>
          </div>
        </div>
      )}

      <SectionHeader
        title="캐릭터 목록"
        icon={User}
        section="characters"
        count={characterList.length}
      />
      {sectionVisibility.characters && (
        <div className="p-4 bg-white border rounded-lg">
          {characterList.length > 0 ? (
            <div className="space-y-2">
              {characterList.map((character, index) => (
                <div key={character.id || index} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">{character.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {character.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              캐릭터가 생성되지 않았습니다.
            </div>
          )}
        </div>
      )}

      <SectionHeader
        title="최종 시나리오"
        icon={FileText}
        section="scenario"
      />
      {sectionVisibility.scenario && (
        <div className="p-4 bg-white border rounded-lg">
          <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
            {finalScenario || '시나리오가 생성되지 않았습니다.'}
          </div>
        </div>
      )}

      <SectionHeader
        title="에피소드/씬 구조"
        icon={Settings}
        section="episodes"
        count={episodes.length}
      />
      {sectionVisibility.episodes && (
        <div className="p-4 bg-white border rounded-lg">
          {episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((episode, episodeIndex) => (
                <div key={episode.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{episode.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {episode.scenes.length}개 씬
                      </span>
                      {onEpisodeSelection && (
                        <button
                          onClick={() => onEpisodeSelection(episode)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          선택
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {episode.description && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        에피소드 설명
                      </label>
                      <div className="p-2 bg-white rounded border text-sm">
                        {episode.description}
                      </div>
                    </div>
                  )}
                  
                  {episode.scenes.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">씬 목록</h5>
                      {episode.scenes.map((scene, sceneIndex) => (
                        <div key={scene.id} className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{scene.title}</span>
                            <span className="text-xs text-gray-500">{scene.cuts}컷</span>
                          </div>
                          {scene.description && (
                            <div className="text-sm text-gray-600">
                              {scene.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              에피소드 구조가 설정되지 않았습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 이미지 렌더링
  const renderImages = () => (
    <div className="space-y-4">
      <SectionHeader
        title="캐릭터 이미지"
        icon={User}
        section="characterImages"
        count={generatedCharacters.length + generatedCharacterImages.length}
      />
      {sectionVisibility.characterImages && (
        <div className="p-4 bg-white border rounded-lg">
          {(generatedCharacters.length > 0 || generatedCharacterImages.length > 0) ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...generatedCharacters, ...generatedCharacterImages].map((item, index) => {
                // AI 생성 이미지인지 사용자 추가 이미지인지 구분
                const isAIGenerated = index < generatedCharacters.length;
                const actualIndex = isAIGenerated ? index : index - generatedCharacters.length;
                const deleteType = isAIGenerated ? 'characters' : 'characterImages';
                
                return (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={`Character ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium truncate">{item.description}</div>
                    {item.source && (
                      <div className="text-xs text-gray-500 mt-1">
                        출처: {item.source}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const filename = `캐릭터_${index + 1}_${new Date().toISOString().split('T')[0]}.jpg`;
                      downloadBase64Image(item.image, filename);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="이미지 다운로드"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {onDeleteItem && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 캐릭터 이미지를 삭제하시겠습니까?')) {
                          const deleteIndex = isAIGenerated ? index : actualIndex;
                          onDeleteItem(deleteType, deleteIndex);
                          addNotification({
                            type: 'success',
                            title: '삭제 완료',
                            message: '캐릭터 이미지가 삭제되었습니다.',
                          });
                        }
                      }}
                      className="absolute top-1 left-1 p-1 bg-red-600 bg-opacity-80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // 이미지 클릭 시 원본 이미지 모달 표시
                      setShowImageModal(true);
                      setSelectedImage(item.image);
                    }}
                    className="absolute inset-0 bg-transparent cursor-pointer"
                    title="이미지 확대 보기"
                  />
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              캐릭터 이미지가 생성되지 않았습니다.
            </div>
          )}
        </div>
      )}

      <SectionHeader
        title="배경 이미지"
        icon={Image}
        section="backgroundImages"
        count={generatedBackgrounds.length + generatedVideoBackgrounds.length}
      />
      {sectionVisibility.backgroundImages && (
        <div className="p-4 bg-white border rounded-lg">
          {(generatedBackgrounds.length > 0 || generatedVideoBackgrounds.length > 0) ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...generatedBackgrounds, ...generatedVideoBackgrounds].map((item, index) => {
                // AI 생성 이미지인지 사용자 추가 이미지인지 구분
                const isAIGenerated = index < generatedBackgrounds.length;
                const actualIndex = isAIGenerated ? index : index - generatedBackgrounds.length;
                const deleteType = isAIGenerated ? 'backgrounds' : 'backgroundImages';
                
                return (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={`Background ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium truncate">{item.description}</div>
                    {item.source && (
                      <div className="text-xs text-gray-500 mt-1">
                        출처: {item.source}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const filename = `배경_${index + 1}_${new Date().toISOString().split('T')[0]}.jpg`;
                      downloadBase64Image(item.image, filename);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="이미지 다운로드"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {onDeleteItem && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 배경 이미지를 삭제하시겠습니까?')) {
                          onDeleteItem(deleteType, actualIndex);
                          addNotification({
                            type: 'success',
                            title: '삭제 완료',
                            message: '배경 이미지가 삭제되었습니다.',
                          });
                        }
                      }}
                      className="absolute top-1 left-1 p-1 bg-red-600 bg-opacity-80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // 이미지 클릭 시 원본 이미지 모달 표시
                      setShowImageModal(true);
                      setSelectedImage(item.image);
                    }}
                    className="absolute inset-0 bg-transparent cursor-pointer"
                    title="이미지 확대 보기"
                  />
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              배경 이미지가 생성되지 않았습니다.
            </div>
          )}
        </div>
      )}

      <SectionHeader
        title="설정 컷 이미지"
        icon={Image}
        section="settingCutImages"
        count={generatedSettingCuts.length}
      />
      {sectionVisibility.settingCutImages && (
        <div className="p-4 bg-white border rounded-lg">
          {generatedSettingCuts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generatedSettingCuts.map((item, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={`Setting Cut ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium truncate">{item.description}</div>
                    {item.source && (
                      <div className="text-xs text-gray-500 mt-1">
                        출처: {item.source}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const filename = `설정컷_${index + 1}_${new Date().toISOString().split('T')[0]}.jpg`;
                      downloadBase64Image(item.image, filename);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="이미지 다운로드"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {onDeleteItem && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 설정컷 이미지를 삭제하시겠습니까?')) {
                          onDeleteItem('settingCuts', index);
                          addNotification({
                            type: 'success',
                            title: '삭제 완료',
                            message: '설정컷 이미지가 삭제되었습니다.',
                          });
                        }
                      }}
                      className="absolute top-1 left-1 p-1 bg-red-600 bg-opacity-80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // 이미지 클릭 시 원본 이미지 모달 표시
                      setShowImageModal(true);
                      setSelectedImage(item.image);
                    }}
                    className="absolute inset-0 bg-transparent cursor-pointer"
                    title="이미지 확대 보기"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              설정 컷 이미지가 생성되지 않았습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 영상 렌더링
  const renderVideos = () => (
    <div className="space-y-4">
      <SectionHeader
        title="영상 설정"
        icon={Settings}
        section="videoSettings"
      />
      {sectionVisibility.videoSettings && (
        <div className="p-4 bg-white border rounded-lg">
          {videoSettings && Object.keys(videoSettings).length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    품질
                  </label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {videoSettings.quality || '설정되지 않음'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    길이
                  </label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {videoSettings.duration || '설정되지 않음'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    비율
                  </label>
                  <div className="p-2 bg-gray-50 rounded border text-sm">
                    {videoSettings.ratio || '설정되지 않음'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              영상 설정이 없습니다.
            </div>
          )}
        </div>
      )}

      <SectionHeader
        title="영문 프롬프트"
        icon={Globe}
        section="englishPrompt"
      />
      {sectionVisibility.englishPrompt && (
        <div className="p-4 bg-white border rounded-lg">
          {videoSettings?.englishPrompt ? (
            <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
              {videoSettings.englishPrompt}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              영문 프롬프트가 없습니다.
            </div>
          )}
        </div>
      )}

      <SectionHeader
        title="생성된 영상"
        icon={Video}
        section="videos"
        count={generatedVideos.length}
      />
      {sectionVisibility.videos && (
        <div className="p-4 bg-white border rounded-lg">
          {generatedVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedVideos.map((video, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      src={video.videoUrl || video.video}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium">영상 {index + 1}</div>
                    <div className="text-gray-600">생성 시간: {video.timestamp}</div>
                  </div>
                  <button
                    onClick={() => {
                      const filename = `영상_${index + 1}_${new Date().toISOString().split('T')[0]}.mp4`;
                      downloadVideo(video.videoUrl || video.video, filename);
                    }}
                    className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="다운로드"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    {video.videoRatio || '16:9'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              영상이 생성되지 않았습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 데이터 및 JSON 렌더링
  const renderData = () => {
    return (
      <div className="space-y-4">
        {/* 카드 생성 버튼 */}
        <div className="flex justify-between items-center p-4 bg-blue-50 border rounded-lg">
          <div>
            <h3 className="font-medium text-blue-900">국문/영문 카드 생성</h3>
            <p className="text-sm text-blue-700">텍스트 카드와 JSON 데이터에서 국문/영문 카드를 자동 생성합니다.</p>
          </div>
          <button
            onClick={generateCards}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            카드 생성
          </button>
        </div>

        {/* 생성된 국문 카드 */}
        {generatedCards.korean.length > 0 && (
          <div className="space-y-3">
            <SectionHeader
              title="국문 카드"
              icon={Flag}
              section="koreanCards"
              count={generatedCards.korean.length}
            />
            {sectionVisibility.koreanCards && (
              <div className="space-y-3">
                {generatedCards.korean.map((card) => (
                  <div key={card.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-600" />
                        <span className="font-medium">장면 {card.scene}</span>
                        {card.source && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            {card.source}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleCard(card.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={cardVisibility[card.id] ? '닫기' : '열기'}
                      >
                        {cardVisibility[card.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {cardVisibility[card.id] && (
                      <div className="p-4">
                        <div className="text-sm whitespace-pre-wrap mb-3">
                          {card.content}
                        </div>
                        <div className="text-xs text-gray-500">
                          생성 시간: {card.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 생성된 영문 카드 */}
        {generatedCards.english.length > 0 && (
          <div className="space-y-3">
            <SectionHeader
              title="영문 카드"
              icon={Globe}
              section="englishCards"
              count={generatedCards.english.length}
            />
            {sectionVisibility.englishCards && (
              <div className="space-y-3">
                {generatedCards.english.map((card) => (
                  <div key={card.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Scene {card.scene}</span>
                        {card.source && (
                          <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                            {card.source}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleCard(card.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={cardVisibility[card.id] ? '닫기' : '열기'}
                      >
                        {cardVisibility[card.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {cardVisibility[card.id] && (
                      <div className="p-4">
                        <div className="text-sm whitespace-pre-wrap mb-3">
                          {card.content}
                        </div>
                        <div className="text-xs text-gray-500">
                          Generated: {card.timestamp}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* JSON 카드 섹션 */}
        <SectionHeader
          title="JSON 카드 (한국어)"
          icon={Flag}
          section="koreanJson"
        />
        {sectionVisibility.koreanJson && (
          <div className="p-4 bg-white border rounded-lg">
            <div className="space-y-4">
              {/* 카드 생성 버튼들 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['스토리', '영상 설정', '캐릭터 설정', '씬/컷 구성', '시나리오 추가 설정', '영상 시나리오', '씬별 컷별 프롬프트'].map((cardType) => (
                  <button
                    key={cardType}
                    onClick={() => handleGenerateJsonCard(cardType)}
                    disabled={isGeneratingCard}
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      isGeneratingCard && generatingCardType === cardType
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isGeneratingCard && generatingCardType === cardType ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        생성 중...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {cardType}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 생성된 카드 표시 */}
              {generatedProjectData?.koreanCards ? (
                <div className="space-y-3">
                  {Object.entries(generatedProjectData.koreanCards).map(([key, value]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-800">{key}</h4>
                        <button
                          onClick={() => navigator.clipboard.writeText(String(value))}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="복사"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {(() => {
                          const valueStr = String(value);
                          
                          // 모든 JSON 카드 항목에 줄바꿈 처리 적용
                          if (valueStr.includes('\n') || 
                              valueStr.includes('씬') || valueStr.includes('Scene') ||
                              valueStr.includes('컷') || valueStr.includes('Cut') ||
                              valueStr.includes('에피소드') || valueStr.includes('Episode') ||
                              valueStr.includes('---') || valueStr.includes('**') ||
                              valueStr.includes('•') || valueStr.includes('-') ||
                              valueStr.includes('1.') || valueStr.includes('2.') ||
                              valueStr.includes('3.') || valueStr.includes('4.') ||
                              valueStr.includes('5.') || valueStr.includes('6.') ||
                              valueStr.includes('7.') || valueStr.includes('8.') ||
                              valueStr.includes('9.') || valueStr.includes('10.')) {
                            
                            return (
                              <div className="whitespace-pre-wrap">
                                {valueStr.split('\n').map((line, index) => {
                                  // 주요 항목별로 줄바꿈 처리
                                  if (line.includes('씬') || line.includes('Scene') || 
                                      line.includes('컷') || line.includes('Cut') ||
                                      line.includes('에피소드') || line.includes('Episode') ||
                                      line.includes('---') || line.includes('**') ||
                                      line.includes('•') || line.includes('-') ||
                                      line.match(/^\d+\./) || line.match(/^[가-힣]+:/) ||
                                      line.match(/^[A-Z][a-z]+:/)) {
                                    return (
                                      <div key={index} className="mb-2 font-medium text-gray-800">
                                        {line}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={index} className="mb-1">
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // 줄바꿈이 없는 일반 텍스트
                          return valueStr;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  위의 버튼을 눌러 JSON 카드를 생성하세요.
                </div>
              )}
            </div>
          </div>
        )}

        <SectionHeader
          title="JSON 카드 (영어)"
          icon={Globe}
          section="englishJson"
        />
        {sectionVisibility.englishJson && (
          <div className="p-4 bg-white border rounded-lg">
            <div className="space-y-4">
              {/* 영어 카드 생성 버튼들 */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['Story', 'Visual Settings', 'Character Settings', 'Scene Cut Structure', 'Additional Scenario Settings', 'Video Scenario', 'Scene Cut Prompts'].map((cardType) => (
                  <button
                    key={cardType}
                    onClick={() => handleGenerateJsonCard(cardType)}
                    disabled={isGeneratingCard}
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      isGeneratingCard && generatingCardType === cardType
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isGeneratingCard && generatingCardType === cardType ? (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        {cardType}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 생성된 영어 카드 표시 */}
              {generatedProjectData?.englishCards ? (
                <div className="space-y-3">
                  {Object.entries(generatedProjectData.englishCards).map(([key, value]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-800">{key}</h4>
                        <button
                          onClick={() => navigator.clipboard.writeText(String(value))}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {(() => {
                          const valueStr = String(value);
                          
                          // 모든 JSON 카드 항목에 줄바꿈 처리 적용
                          if (valueStr.includes('\n') || 
                              valueStr.includes('씬') || valueStr.includes('Scene') ||
                              valueStr.includes('컷') || valueStr.includes('Cut') ||
                              valueStr.includes('에피소드') || valueStr.includes('Episode') ||
                              valueStr.includes('---') || valueStr.includes('**') ||
                              valueStr.includes('•') || valueStr.includes('-') ||
                              valueStr.includes('1.') || valueStr.includes('2.') ||
                              valueStr.includes('3.') || valueStr.includes('4.') ||
                              valueStr.includes('5.') || valueStr.includes('6.') ||
                              valueStr.includes('7.') || valueStr.includes('8.') ||
                              valueStr.includes('9.') || valueStr.includes('10.')) {
                            
                            return (
                              <div className="whitespace-pre-wrap">
                                {valueStr.split('\n').map((line, index) => {
                                  // 주요 항목별로 줄바꿈 처리
                                  if (line.includes('씬') || line.includes('Scene') || 
                                      line.includes('컷') || line.includes('Cut') ||
                                      line.includes('에피소드') || line.includes('Episode') ||
                                      line.includes('---') || line.includes('**') ||
                                      line.includes('•') || line.includes('-') ||
                                      line.match(/^\d+\./) || line.match(/^[가-힣]+:/) ||
                                      line.match(/^[A-Z][a-z]+:/)) {
                                    return (
                                      <div key={index} className="mb-2 font-medium text-gray-800">
                                        {line}
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={index} className="mb-1">
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          // 줄바꿈이 없는 일반 텍스트
                          return valueStr;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  Click the buttons above to generate English JSON cards.
                </div>
              )}
            </div>
          </div>
        )}

        <SectionHeader
          title="원시 데이터"
          icon={Settings}
          section="rawData"
        />
        {sectionVisibility.rawData && (
          <div className="p-4 bg-white border rounded-lg">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">프로젝트 데이터</h4>
                <div className="bg-gray-50 p-3 rounded border">
                  <FormattedJSON data={generatedProjectData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 텍스트 카드 렌더링
  const renderTextCards = () => {
    return (
      <div className="space-y-4">
        {/* 일반 텍스트 카드 */}
        <SectionHeader
          title="일반 텍스트 카드"
          icon={FileText}
          section="textCards"
          count={generatedTextCards.length}
        />
        {sectionVisibility.textCards && (
          <div className="p-4 bg-white border rounded-lg">
            {generatedTextCards.length > 0 ? (
              <div className="space-y-3">
                {generatedTextCards.map((card, index) => (
                  <div key={card.id} className="bg-gray-50 p-3 rounded border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          카드 {index + 1}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          일반
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(card.generatedText);
                            addNotification({
                              type: 'success',
                              title: '복사 완료',
                              message: '텍스트 카드가 클립보드에 복사되었습니다.',
                            });
                          }}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          📋 복사
                        </button>
                        {onDeleteItem && (
                          <button
                            onClick={() => {
                              if (window.confirm('이 텍스트 카드를 삭제하시겠습니까?')) {
                                onDeleteItem('textCard', index);
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            🗑️ 삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {card.generatedText}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      생성 시간: {new Date(card.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                생성된 텍스트 카드가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 에피소드/씬 구조 */}
        <SectionHeader
          title="에피소드/씬 구조"
          icon={Settings}
          section="episodes"
          count={episodes.length}
        />
        {sectionVisibility.episodes && (
          <div className="p-4 bg-white border rounded-lg">
            {episodes.length > 0 ? (
              <div className="space-y-4">
                {episodes.map((episode) => (
                  <div key={episode.id} className="bg-gray-50 p-4 rounded border">
                    <h4 className="font-medium text-gray-800 mb-2">
                      🎬 {episode.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{episode.description}</p>
                    <div className="space-y-2">
                      {episode.scenes.map((scene) => (
                        <div key={scene.id} className="bg-white p-3 rounded border border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            📽️ {scene.title}
                          </h5>
                          <p className="text-xs text-gray-600">{scene.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                에피소드/씬 구조가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'project':
        return renderProjectInfo();
      case 'images':
        return renderImages();
      case 'videos':
        return renderVideos();
      case 'textcards':
        return renderTextCards();
      case 'data':
        return renderData();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">프로젝트 참조</h2>
          <div className="flex items-center gap-2">
            {/* 공유 버튼들 */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <button
                onClick={() => handleShareData('clipboard')}
                disabled={isSharing}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
                title="클립보드에 복사"
              >
                <Copy className="w-3 h-3" />
                복사
              </button>
              <button
                onClick={() => handleShareData('url')}
                disabled={isSharing}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                title="URL로 공유"
              >
                <Share2 className="w-3 h-3" />
                공유
              </button>
              <button
                onClick={() => handleShareData('json')}
                disabled={isSharing}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-purple-100 text-purple-800 rounded hover:bg-purple-200 disabled:opacity-50"
                title="JSON 파일 다운로드"
              >
                <Download className="w-3 h-3" />
                다운로드
              </button>
            </div>
            
            <button
              onClick={() => toggleAllSections(true)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              모두 펼치기
            </button>
            <button
              onClick={() => toggleAllSections(false)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              모두 접기
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 공유 메시지 */}
        {shareMessage && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
            <div className="text-sm text-blue-800">{shareMessage}</div>
          </div>
        )}

        {/* 탭 네비게이션 */}
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="확대된 이미지"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const filename = `이미지_${new Date().toISOString().split('T')[0]}.jpg`;
                downloadBase64Image(selectedImage, filename);
              }}
              className="absolute top-2 left-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-opacity"
              title="이미지 다운로드"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
