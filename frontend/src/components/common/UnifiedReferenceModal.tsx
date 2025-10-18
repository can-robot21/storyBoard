import React, { useState } from 'react';
import {
  X,
  FileText,
  Users,
  Image,
  Video,
  Copy,
  Download,
  ArrowRight,
  Trash2,
  Edit // 수정 아이콘 추가
} from 'lucide-react';
import { downloadBase64Image, downloadVideo } from '../../utils/downloadUtils';

interface UnifiedReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dataType: string;
  data: any[];
  onUseInStep?: (item: any) => void;
  onCopyPrompt?: (item: any) => void;
  onDeleteItem?: (index: number) => void;
  onEditItem?: (index: number, item: any) => void; // 수정 기능 추가
  selectedAIProvider?: string;
}

export const UnifiedReferenceModal: React.FC<UnifiedReferenceModalProps> = ({
  isOpen,
  onClose,
  title,
  dataType,
  data,
  onUseInStep,
  onCopyPrompt,
  onDeleteItem,
  onEditItem, // 수정 기능 추가
  selectedAIProvider = 'google'
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  // 텍스트 카드 편집 상태
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingCardText, setEditingCardText] = useState('');
  const [editingSceneCommon, setEditingSceneCommon] = useState('');
  const [editingStory, setEditingStory] = useState('');
  const [editingCutCount, setEditingCutCount] = useState(1);

  if (!isOpen) return null;

  const toggleSelection = (index: number) => {
    const newSelection = new Set(selectedItems);
    const indexStr = index.toString();
    if (newSelection.has(indexStr)) {
      newSelection.delete(indexStr);
    } else {
      newSelection.add(indexStr);
    }
    setSelectedItems(newSelection);
  };

  const toggleExpansion = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleUseSelected = () => {
    const selectedData = Array.from(selectedItems).map(indexStr => data[parseInt(indexStr)]);
    onUseInStep?.(selectedData);
  };

  // 텍스트 카드 편집 핸들러
  const handleEditCard = (index: number, item: any) => {
    setEditingCardId(index);
    setEditingCardText(item.generatedText || '');
    setEditingSceneCommon(item.sceneCommon || '');
    setEditingStory(item.story || '');
    setEditingCutCount(item.cutCount || 1);
  };

  const handleSaveCardEdit = () => {
    if (editingCardId !== null && onEditItem) {
      const updatedItem = {
        ...data[editingCardId],
        generatedText: editingCardText,
        sceneCommon: editingSceneCommon,
        story: editingStory,
        cutCount: editingCutCount
      };
      onEditItem(editingCardId, updatedItem);
      setEditingCardId(null);
      setEditingCardText('');
      setEditingSceneCommon('');
      setEditingStory('');
      setEditingCutCount(1);
    }
  };

  const handleCancelCardEdit = () => {
    setEditingCardId(null);
    setEditingCardText('');
    setEditingSceneCommon('');
    setEditingStory('');
    setEditingCutCount(1);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'story':
      case 'scenario':
      case 'textCards':
      case 'projectData':
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
        return <FileText className="w-4 h-4" />;
    }
  };

  const renderItemContent = (item: any, index: number) => {
    const isExpanded = expandedItems.has(index);

    switch (dataType) {
      case 'story':
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-700">
              {isExpanded ? item.content : `${item.content?.substring(0, 100)}...`}
            </div>
            {item.content && item.content.length > 100 && (
              <button
                onClick={() => toggleExpansion(index)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? '접기' : '더보기'}
              </button>
            )}
          </div>
        );

      case 'characters':
        return (
          <div className="space-y-2">
            <div className="font-medium text-sm">{item.name}</div>
            <div className="text-sm text-gray-700">
              {isExpanded ? item.description : `${item.description?.substring(0, 80)}...`}
            </div>
            {item.description && item.description.length > 80 && (
              <button
                onClick={() => toggleExpansion(index)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? '접기' : '더보기'}
              </button>
            )}
          </div>
        );

      case 'characterImages':
      case 'backgroundImages':
      case 'settingCuts':
        return (
          <div className="space-y-2">
            {item.image && (
              <div className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden w-full">
                  <img
                    src={item.image}
                    alt={item.description || `${dataType} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 출처 표시 */}
                <div className="absolute top-1 left-1 px-1 py-0.5 bg-black bg-opacity-50 text-white text-xs rounded">
                  {item.source || (selectedAIProvider === 'google' ? 'Google AI' : selectedAIProvider)}
                </div>
                <button
                  onClick={() => {
                    const filename = `${dataType}_${index + 1}_${new Date().toISOString().split('T')[0]}.jpg`;
                    downloadBase64Image(item.image, filename);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="다운로드"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="text-sm text-gray-700">
              {isExpanded ? (item.description || '설명 없음') : (
                <div>
                  <div className="line-clamp-2">
                    {item.description || '설명 없음'}
                  </div>
                  {(item.description && item.description.length > 50) && (
                    <button
                      onClick={() => toggleExpansion(index)}
                      className="text-blue-600 hover:text-blue-800 text-xs mt-1"
                    >
                      더보기
                    </button>
                  )}
                </div>
              )}
            </div>
            {item.timestamp && (
              <div className="text-xs text-gray-500">{item.timestamp}</div>
            )}
          </div>
        );

      case 'textCards':
        return (
          <div className="space-y-4">
            {item.generatedText && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                {/* 씬 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-green-700">씬{index + 1}</h4>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      {item.cutCount || 1}컷
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpansion(index)}
                      className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      {isExpanded ? '[감추기]' : '[보이기]'}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="space-y-4">
                    {/* 씬 공통설정 */}
                    {item.sceneCommon && (
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <h5 className="text-md font-medium text-green-700 mb-2">씬 공통설정</h5>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.sceneCommon}</div>
                        {item.originalSceneCommon && item.originalSceneCommon !== item.sceneCommon && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">원본 입력:</div>
                            <div className="text-xs text-gray-600 italic">{item.originalSceneCommon}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 스토리 */}
                    {item.story && (
                      <div className="bg-white border border-green-200 rounded-lg p-4">
                        <h5 className="text-md font-medium text-green-700 mb-2">스토리</h5>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.story}</div>
                        {item.originalStory && item.originalStory !== item.story && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">원본 입력:</div>
                            <div className="text-xs text-gray-600 italic">{item.originalStory}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 컷별 카드 */}
                    <div className="space-y-3">
                      <h5 className="text-md font-medium text-green-700 mb-2">컷별 상세</h5>
                      {(() => {
                        // 컷별 텍스트 파싱 함수
                        const parseCutTexts = (text: string) => {
                          const cutPattern = /--- \*\*컷\s*(\d+):\s*([^*]+)\*\*/g;
                          const cuts: { [key: number]: { title: string; content: string; sections: any } } = {};
                          let match;

                          while ((match = cutPattern.exec(text)) !== null) {
                            const cutNum = parseInt(match[1]);
                            const cutTitle = match[2].trim();
                            const startIndex = match.index + match[0].length;
                            
                            const nextMatch = cutPattern.exec(text);
                            const endIndex = nextMatch ? nextMatch.index : text.length;
                            
                            const cutContent = text.substring(startIndex, endIndex).trim();
                            
                            const sections = {
                              character: '',
                              action: '',
                              background: '',
                              dialogue: '',
                              composition: '',
                              lighting: '',
                              cameraMovement: ''
                            };

                            // 섹션별 파싱 (기존 MainLayout과 동일한 로직)
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

                            cuts[cutNum] = {
                              title: cutTitle,
                              content: cutContent,
                              sections: sections
                            };
                            
                            cutPattern.lastIndex = endIndex;
                          }

                          return cuts;
                        };

                        const cutTexts = parseCutTexts(item.generatedText);
                        const cutCount = item.cutCount || 1;
                        
                        return Array.from({ length: cutCount }, (_, cutIndex) => {
                          const cutNumber = cutIndex + 1;
                          const cutData = cutTexts[cutNumber];
                          const cutKey = `scene${index + 1}_cut${cutNumber}`;
                          
                          return (
                            <div key={cutIndex} className="bg-white border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h6 className="font-medium text-green-700">컷{cutNumber}</h6>
                                  <div className="flex gap-1 ml-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedItems.has(cutKey)}
                                      onChange={() => {
                                        const newSet = new Set(selectedItems);
                                        if (newSet.has(cutKey)) {
                                          newSet.delete(cutKey);
                                        } else {
                                          newSet.add(cutKey);
                                        }
                                        setSelectedItems(newSet);
                                      }}
                                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                      title="컷 선택"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              {cutData && (
                                <div className="space-y-2">
                                  <div className="border-l-4 border-green-400 pl-3">
                                    <h6 className="font-medium text-green-600 mb-1">{cutData.title}</h6>
                                  </div>
                                  
                                  {/* 필수 항목 */}
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-gray-500 mb-1">필수 항목</div>
                                    
                                    {cutData.sections.character && (
                                      <div className="bg-blue-50 rounded p-2">
                                        <div className="text-xs font-medium text-blue-600 mb-1">👤 캐릭터</div>
                                        <div className="text-sm text-gray-700">{cutData.sections.character}</div>
                                      </div>
                                    )}
                                    
                                    {cutData.sections.action && (
                                      <div className="bg-green-50 rounded p-2">
                                        <div className="text-xs font-medium text-green-600 mb-1">🏃 액션</div>
                                        <div className="text-sm text-gray-700">{cutData.sections.action}</div>
                                      </div>
                                    )}
                                    
                                    {cutData.sections.background && (
                                      <div className="bg-purple-50 rounded p-2">
                                        <div className="text-xs font-medium text-purple-600 mb-1">🏞️ 배경</div>
                                        <div className="text-sm text-gray-700">{cutData.sections.background}</div>
                                      </div>
                                    )}
                                    
                                    {cutData.sections.dialogue && (
                                      <div className="bg-orange-50 rounded p-2">
                                        <div className="text-xs font-medium text-orange-600 mb-1">💬 대사</div>
                                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{cutData.sections.dialogue}</div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* 추가 항목 */}
                                  {(cutData.sections.composition || cutData.sections.lighting || cutData.sections.cameraMovement) && (
                                    <div className="space-y-2">
                                      <div className="text-xs font-medium text-gray-500 mb-1">추가 항목</div>
                                      
                                      {cutData.sections.composition && (
                                        <div className="bg-gray-50 rounded p-2">
                                          <div className="text-xs font-medium text-gray-600 mb-1">📐 구도</div>
                                          <div className="text-sm text-gray-700">{cutData.sections.composition}</div>
                                        </div>
                                      )}
                                      
                                      {cutData.sections.lighting && (
                                        <div className="bg-yellow-50 rounded p-2">
                                          <div className="text-xs font-medium text-yellow-600 mb-1">💡 조명</div>
                                          <div className="text-sm text-gray-700">{cutData.sections.lighting}</div>
                                        </div>
                                      )}
                                      
                                      {cutData.sections.cameraMovement && (
                                        <div className="bg-indigo-50 rounded p-2">
                                          <div className="text-xs font-medium text-indigo-600 mb-1">🎥 카메라 움직임</div>
                                          <div className="text-sm text-gray-700">{cutData.sections.cameraMovement}</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {!cutData && (
                                <div className="text-sm text-gray-500 italic">
                                  컷별 상세 설명이 아직 생성되지 않았습니다.
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
            {item.timestamp && (
              <div className="text-xs text-gray-500">{item.timestamp}</div>
            )}
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-2">
            {item.video && (
              <div className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <video
                    src={item.video}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    const filename = `영상_${index + 1}_${new Date().toISOString().split('T')[0]}.mp4`;
                    downloadVideo(item.video, filename);
                  }}
                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="다운로드"
                >
                  <Download className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                  {item.videoRatio || '16:9'}
                </div>
              </div>
            )}
            <div className="text-sm">
              <div>비율: {item.videoRatio || '16:9'}</div>
              <div>텍스트 카드: {item.textCards?.length || 0}개</div>
              <div>이미지: {(item.characterImages?.length || 0) + (item.backgrounds?.length || 0)}개</div>
            </div>
            {item.timestamp && (
              <div className="text-xs text-gray-500">{item.timestamp}</div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-700">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(item, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getItemIcon(dataType)}
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <span className="text-sm text-gray-500">({data.length}개)</span>
          </div>

          <div className="flex items-center gap-2">
            {selectedItems.size > 0 && onUseInStep && (
              <button
                onClick={handleUseSelected}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                선택한 항목 사용 ({selectedItems.size})
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 선택된 항목 관리 영역 */}
          {selectedItems.size > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-800">
                  선택된 항목 ({selectedItems.size}개)
                </h3>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  전체 선택 해제
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedItems).map((indexStr) => {
                  const index = parseInt(indexStr);
                  const item = data[index];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm"
                    >
                      <span className="text-blue-700">
                        {dataType === 'characters' ? item.name : `${title} ${index + 1}`}
                      </span>
                      <button
                        onClick={() => {
                          const newSelection = new Set(selectedItems);
                          newSelection.delete(indexStr);
                          setSelectedItems(newSelection);
                        }}
                        className="text-red-500 hover:text-red-700 ml-1"
                        title="제거"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                {getItemIcon(dataType)}
              </div>
              <p>아직 생성된 {title}가 없습니다.</p>
            </div>
          ) : (
            <div className={`${
              ['characterImages', 'backgroundImages', 'settingCuts'].includes(dataType) 
                ? 'grid grid-cols-2 gap-4' 
                : 'space-y-4'
            }`}>
              {data.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedItems.has(index.toString())
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* 항목 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(index.toString())}
                        onChange={() => toggleSelection(index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {dataType === 'characters' ? item.name : `${title} ${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onEditItem && dataType === 'textCards' && (
                        <button
                          onClick={() => handleEditCard(index, item)}
                          className="p-1 text-blue-500 hover:text-blue-700 rounded transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {onCopyPrompt && (
                        <button
                          onClick={() => onCopyPrompt(item)}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                          title="프롬프트 복사"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(item, null, 2)], {
                            type: 'application/json'
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${dataType}-${index + 1}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded transition-colors"
                        title="JSON 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {onDeleteItem && (
                        <button
                          onClick={() => {
                            if (window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
                              onDeleteItem(index);
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 항목 내용 */}
                  {renderItemContent(item, index)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {data.length}개 항목 중 {selectedItems.size}개 선택됨
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                선택 해제
              </button>

              <button
                onClick={() => setSelectedItems(new Set(data.map((_, i) => i.toString())))}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                전체 선택
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 텍스트 카드 편집 모달 */}
      {editingCardId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">텍스트 카드 수정</h2>
              <button
                onClick={handleCancelCardEdit}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* 씬 공통설정 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  씬 공통설정
                </label>
                <textarea
                  value={editingSceneCommon}
                  onChange={(e) => setEditingSceneCommon(e.target.value)}
                  className="w-full h-20 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="씬 공통설정을 입력하세요..."
                />
              </div>

              {/* 스토리 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  스토리
                </label>
                <textarea
                  value={editingStory}
                  onChange={(e) => setEditingStory(e.target.value)}
                  className="w-full h-20 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="스토리를 입력하세요..."
                />
              </div>

              {/* 컷 수 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  컷 수
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editingCutCount}
                  onChange={(e) => setEditingCutCount(parseInt(e.target.value) || 1)}
                  className="w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 텍스트 카드 내용 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  텍스트 카드 내용
                </label>
                <textarea
                  value={editingCardText}
                  onChange={(e) => setEditingCardText(e.target.value)}
                  className="w-full h-80 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="텍스트 카드 내용을 입력하세요..."
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelCardEdit}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveCardEdit}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};