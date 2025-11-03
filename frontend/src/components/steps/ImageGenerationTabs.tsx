import React, { useState } from 'react';
import Button from '../common/Button';
import { ImagenPromptSampleModal } from '../common/ImagenPromptSampleModal';
import type { GeneratedCharacter, GeneratedBackground, GeneratedSettingCut } from '../../types/project';

type TabId = 'character' | 'background' | 'settingCut';

interface ImageGenerationTabsProps {
  // 생성 핸들러들
  onGenerateCharacter: () => void;
  onGenerateBackground: () => void;
  onGenerateSettingCut: () => void;
  
  // 입력 상태
  characterInput: string;
  setCharacterInput: (input: string) => void;
  backgroundInput: string;
  setBackgroundInput: (input: string) => void;
  settingCut: string;
  setSettingCut: (input: string) => void;
  
  // 상위 공통 옵션
  imageStyle: string;
  imageQuality: string;
  numberOfImages: number;
  aspectRatio: string;

  // 개별 옵션 상태
  showCharacterIndividualOptions: boolean;
  setShowCharacterIndividualOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  showBackgroundIndividualOptions: boolean;
  setShowBackgroundIndividualOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  showSettingIndividualOptions: boolean;
  setShowSettingIndividualOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  
  // 개별 옵션 설정
  characterOptions: any;
  setCharacterOptions: (options: any) => void;
  backgroundOptions: any;
  setBackgroundOptions: (options: any) => void;
  settingOptions: any;
  setSettingOptions: (options: any) => void;
  
  // 생성 상태
  isGenerating: boolean;
  
  // 생성된 항목들
  generatedCharacters: GeneratedCharacter[];
  generatedBackgrounds: GeneratedBackground[];
  generatedSettingCuts: GeneratedSettingCut[];
}

export const ImageGenerationTabs: React.FC<ImageGenerationTabsProps> = ({
  onGenerateCharacter,
  onGenerateBackground,
  onGenerateSettingCut,
  characterInput,
  setCharacterInput,
  backgroundInput,
  setBackgroundInput,
  settingCut,
  setSettingCut,
  imageStyle,
  imageQuality,
  numberOfImages,
  aspectRatio,
  showCharacterIndividualOptions,
  setShowCharacterIndividualOptions,
  showBackgroundIndividualOptions,
  setShowBackgroundIndividualOptions,
  showSettingIndividualOptions,
  setShowSettingIndividualOptions,
  characterOptions,
  setCharacterOptions,
  backgroundOptions,
  setBackgroundOptions,
  settingOptions,
  setSettingOptions,
  isGenerating,
  generatedCharacters,
  generatedBackgrounds,
  generatedSettingCuts
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('character');
  const [showImagenPromptSampleModal, setShowImagenPromptSampleModal] = useState(false);

  // 상위 옵션과 탭 개별 옵션 병합 로직
  const mergeOptions = (tabOpts: any) => {
    return {
      style: tabOpts?.style || imageStyle,
      quality: tabOpts?.quality || imageQuality,
      aspectRatio: tabOpts?.aspectRatio || aspectRatio,
      numberOfImages: typeof tabOpts?.numberOfImages === 'number' ? tabOpts.numberOfImages : numberOfImages,
      imageSize: tabOpts?.imageSize,
      personGeneration: tabOpts?.personGeneration,
      peoplePolicy: tabOpts?.peoplePolicy,
      cameraProximity: tabOpts?.cameraProximity,
      cameraPosition: tabOpts?.cameraPosition,
      lensType: tabOpts?.lensType,
      filmType: tabOpts?.filmType,
      customSize: tabOpts?.customSize,
      additionalPrompt: tabOpts?.additionalPrompt,
    };
  };

  const effectiveCharacterOptions = mergeOptions(characterOptions);
  const effectiveBackgroundOptions = mergeOptions(backgroundOptions);
  const effectiveSettingOptions = mergeOptions(settingOptions);

  const tabs = [
    { id: 'character', label: '👤 캐릭터', count: generatedCharacters.length },
    { id: 'background', label: '🌅 배경', count: generatedBackgrounds.length },
    { id: 'settingCut', label: '🎬 설정 컷', count: generatedSettingCuts.length }
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'character':
        return (
          <div className="space-y-6">
            {/* 상단 타이틀/옵션/액션: 타이틀 | 개별 옵션 보이기▼ | 캐릭터 생성 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">🌅 캐릭터 생성</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCharacterIndividualOptions((prev: boolean) => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showCharacterIndividualOptions ? '개별 옵션 감추기' : '개별 옵션 보이기'}
                  <span className="text-xs ml-1">{showCharacterIndividualOptions ? '▲' : '▼'}</span>
                </button>
                <Button 
                  onClick={onGenerateCharacter} 
                  disabled={isGenerating || !characterInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      이미지 생성 중...
                    </>
                  ) : (
                    '캐릭터 생성'
                  )}
                </Button>
              </div>
            </div>
            {/* 설명 입력 */}
            <textarea
              value={characterInput}
              onChange={(e) => setCharacterInput(e.target.value)}
              placeholder="캐릭터 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* 캐릭터 개별 설정 추가 */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2">
              <h4 className="text-sm font-medium text-gray-800 mb-3">캐릭터 개별 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
                  <input
                    type="text"
                    value={characterOptions.customSize || ''}
                    onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, customSize: e.target.value }))}
                    placeholder="예: 1024x1024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
                  <input
                    type="text"
                    value={characterOptions.additionalPrompt || ''}
                    onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, additionalPrompt: e.target.value }))}
                    placeholder="추가적인 스타일이나 세부사항을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {/* 고급 옵션 블록 - 개별 옵션 토글 시 (배경 탭과 동일 배치) */}
            {showCharacterIndividualOptions && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-800">🎨 txt2img 고급 옵션 (Imagen 3/4)</h4>
                  <button
                    onClick={() => setShowImagenPromptSampleModal(true)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📚 샘플
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생성 개수</label>
                    <select
                      value={characterOptions.numberOfImages ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCharacterOptions((prev: any) => ({ 
                          ...prev, 
                          numberOfImages: value === 'inherit' ? undefined : Number(value)
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({numberOfImages}개)</option>
                      <option value={1}>1개</option>
                      <option value={2}>2개</option>
                      <option value={3}>3개</option>
                      <option value={4}>4개</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이미지 크기</label>
                    <select
                      value={characterOptions.imageSize}
                      onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, imageSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
                    <select
                      value={characterOptions.aspectRatio ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCharacterOptions((prev: any) => ({ 
                          ...prev, 
                          aspectRatio: value === 'inherit' ? undefined : value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({aspectRatio})</option>
                      <option value="1:1">1:1 (정사각형)</option>
                      <option value="3:4">3:4 (세로)</option>
                      <option value="4:3">4:3 (가로)</option>
                      <option value="9:16">9:16 (세로 모바일)</option>
                      <option value="16:9">16:9 (가로 모바일)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사람 생성</label>
                    <select
                      value={characterOptions.personGeneration}
                      onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, personGeneration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dont_allow">사람 생성 차단</option>
                      <option value="allow_adult">성인만 허용</option>
                      <option value="allow_all">모든 연령 허용</option>
                    </select>
                  </div>
                </div>

                {/* 카메라 관련 옵션 */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">📷 카메라 설정</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 근접성</label>
                      <select
                        value={characterOptions.cameraProximity}
                        onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, cameraProximity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="closeup">클로즈업</option>
                        <option value="medium">중간 거리</option>
                        <option value="wide">멀리서 촬영</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 위치</label>
                      <select
                        value={characterOptions.cameraPosition}
                        onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, cameraPosition: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="eye_level">눈 높이</option>
                        <option value="low_angle">아래에서</option>
                        <option value="high_angle">위에서</option>
                        <option value="aerial">항공</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">렌즈 종류</label>
                      <select
                        value={characterOptions.lensType}
                        onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, lensType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="35mm">35mm</option>
                        <option value="50mm">50mm</option>
                        <option value="85mm">85mm</option>
                        <option value="macro">매크로</option>
                        <option value="wide_angle">광각</option>
                        <option value="telephoto">망원</option>
                        <option value="fisheye">어안</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">필름 종류</label>
                      <select
                        value={characterOptions.filmType}
                        onChange={(e) => setCharacterOptions((prev: any) => ({ ...prev, filmType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="black_white">흑백</option>
                        <option value="polaroid">폴라로이드</option>
                        <option value="vintage">빈티지</option>
                        <option value="film_noir">느와르</option>
                        <option value="duotone">듀오톤</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'background':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">🌅 배경 생성</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBackgroundIndividualOptions((prev: boolean) => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showBackgroundIndividualOptions ? '개별 옵션 감추기' : '개별 옵션 보이기'}
                  <span className="text-xs ml-1">{showBackgroundIndividualOptions ? '▲' : '▼'}</span>
                </button>
                <Button 
                  className="text-sm flex items-center gap-2" 
                  onClick={onGenerateBackground}
                  disabled={isGenerating || !backgroundInput.trim()}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      이미지 생성 중...
                    </>
                  ) : (
                    '배경 생성'
                  )}
                </Button>
              </div>
            </div>
            
            <textarea
              value={backgroundInput}
              onChange={(e) => setBackgroundInput(e.target.value)}
              placeholder="배경 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 커스텀 사이즈와 추가 프롬프트 - 항상 표시 */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">배경 개별 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
                  <input
                    type="text"
                    value={backgroundOptions.customSize}
                    onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, customSize: e.target.value }))}
                    placeholder="예: 1024x1024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
                  <input
                    type="text"
                    value={backgroundOptions.additionalPrompt}
                    onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, additionalPrompt: e.target.value }))}
                    placeholder="추가적인 스타일이나 세부사항을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* txt2img 고급 옵션 (Imagen 3/4) - 개별 옵션 토글에 따라 표시 */}
            {showBackgroundIndividualOptions && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-800">🎨 txt2img 고급 옵션 (Imagen 3/4)</h4>
                  <button
                    onClick={() => setShowImagenPromptSampleModal(true)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📚 샘플
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생성 개수</label>
                    <select
                      value={backgroundOptions.numberOfImages ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBackgroundOptions((prev: any) => ({ 
                          ...prev, 
                          numberOfImages: value === 'inherit' ? undefined : Number(value)
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({numberOfImages}개)</option>
                      <option value={1}>1개</option>
                      <option value={2}>2개</option>
                      <option value={3}>3개</option>
                      <option value={4}>4개</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이미지 크기</label>
                    <select
                      value={backgroundOptions.imageSize}
                      onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, imageSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
                    <select
                      value={backgroundOptions.aspectRatio ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setBackgroundOptions((prev: any) => ({ 
                          ...prev, 
                          aspectRatio: value === 'inherit' ? undefined : value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({aspectRatio})</option>
                      <option value="1:1">1:1 (정사각형)</option>
                      <option value="3:4">3:4 (세로)</option>
                      <option value="4:3">4:3 (가로)</option>
                      <option value="9:16">9:16 (세로 모바일)</option>
                      <option value="16:9">16:9 (가로 모바일)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사람 생성</label>
                    <select
                      value={backgroundOptions.personGeneration}
                      onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, personGeneration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dont_allow">사람 생성 차단</option>
                      <option value="allow_adult">성인만 허용</option>
                      <option value="allow_all">모든 연령 허용</option>
                    </select>
                  </div>
                </div>

                {/* 카메라 관련 옵션 */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">📷 카메라 설정</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 근접성</label>
                      <select
                        value={backgroundOptions.cameraProximity}
                        onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, cameraProximity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="closeup">클로즈업</option>
                        <option value="medium">중간 거리</option>
                        <option value="wide">멀리서 촬영</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 위치</label>
                      <select
                        value={backgroundOptions.cameraPosition}
                        onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, cameraPosition: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="eye_level">눈 높이</option>
                        <option value="low_angle">아래에서</option>
                        <option value="high_angle">위에서</option>
                        <option value="aerial">항공</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">렌즈 종류</label>
                      <select
                        value={backgroundOptions.lensType}
                        onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, lensType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="35mm">35mm</option>
                        <option value="50mm">50mm</option>
                        <option value="85mm">85mm</option>
                        <option value="macro">매크로</option>
                        <option value="wide_angle">광각</option>
                        <option value="telephoto">망원</option>
                        <option value="fisheye">어안</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">필름 종류</label>
                      <select
                        value={backgroundOptions.filmType}
                        onChange={(e) => setBackgroundOptions((prev: any) => ({ ...prev, filmType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="black_white">흑백</option>
                        <option value="polaroid">폴라로이드</option>
                        <option value="vintage">빈티지</option>
                        <option value="film_noir">느와르</option>
                        <option value="duotone">듀오톤</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'settingCut':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">🎬 설정 컷 생성</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingIndividualOptions((prev: boolean) => !prev)}
                  className="px-3 py-1 text-xs rounded border hover:bg-gray-50 transition-colors"
                >
                  {showSettingIndividualOptions ? '개별 옵션 감추기' : '개별 옵션 보이기'}
                  <span className="text-xs ml-1">{showSettingIndividualOptions ? '▲' : '▼'}</span>
                </button>
                <Button 
                  className="text-sm flex items-center gap-2" 
                  onClick={onGenerateSettingCut}
                  disabled={isGenerating || !settingCut.trim()}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      이미지 생성 중...
                    </>
                  ) : (
                    '설정 컷 생성'
                  )}
                </Button>
              </div>
            </div>
            
            <textarea
              value={settingCut}
              onChange={(e) => setSettingCut(e.target.value)}
              placeholder="설정 컷 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 커스텀 사이즈와 추가 프롬프트 - 항상 표시 */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">설정 컷 개별 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">커스텀 사이즈</label>
                  <input
                    type="text"
                    value={settingOptions.customSize}
                    onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, customSize: e.target.value }))}
                    placeholder="예: 1024x1024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">추가 프롬프트</label>
                  <input
                    type="text"
                    value={settingOptions.additionalPrompt}
                    onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, additionalPrompt: e.target.value }))}
                    placeholder="추가적인 스타일이나 세부사항을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* txt2img 고급 옵션 (Imagen 3/4) - 개별 옵션 토글에 따라 표시 */}
            {showSettingIndividualOptions && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-blue-800">🎨 txt2img 고급 옵션 (Imagen 3/4)</h4>
                  <button
                    onClick={() => setShowImagenPromptSampleModal(true)}
                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📚 샘플
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생성 개수</label>
                    <select
                      value={settingOptions.numberOfImages ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSettingOptions((prev: any) => ({ 
                          ...prev, 
                          numberOfImages: value === 'inherit' ? undefined : Number(value)
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({numberOfImages}개)</option>
                      <option value={1}>1개</option>
                      <option value={2}>2개</option>
                      <option value={3}>3개</option>
                      <option value={4}>4개</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이미지 크기</label>
                    <select
                      value={settingOptions.imageSize}
                      onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, imageSize: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">화면 비율</label>
                    <select
                      value={settingOptions.aspectRatio ?? 'inherit'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSettingOptions((prev: any) => ({ 
                          ...prev, 
                          aspectRatio: value === 'inherit' ? undefined : value
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="inherit">사전 설정 유지 ({aspectRatio})</option>
                      <option value="1:1">1:1 (정사각형)</option>
                      <option value="3:4">3:4 (세로)</option>
                      <option value="4:3">4:3 (가로)</option>
                      <option value="9:16">9:16 (세로 모바일)</option>
                      <option value="16:9">16:9 (가로 모바일)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">사람 생성</label>
                    <select
                      value={settingOptions.personGeneration}
                      onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, personGeneration: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dont_allow">사람 생성 차단</option>
                      <option value="allow_adult">성인만 허용</option>
                      <option value="allow_all">모든 연령 허용</option>
                    </select>
                  </div>
                </div>

                {/* 카메라 관련 옵션 */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">📷 카메라 설정</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 근접성</label>
                      <select
                        value={settingOptions.cameraProximity}
                        onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, cameraProximity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="closeup">클로즈업</option>
                        <option value="medium">중간 거리</option>
                        <option value="wide">멀리서 촬영</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">카메라 위치</label>
                      <select
                        value={settingOptions.cameraPosition}
                        onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, cameraPosition: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="eye_level">눈 높이</option>
                        <option value="low_angle">아래에서</option>
                        <option value="high_angle">위에서</option>
                        <option value="aerial">항공</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">렌즈 종류</label>
                      <select
                        value={settingOptions.lensType}
                        onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, lensType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="35mm">35mm</option>
                        <option value="50mm">50mm</option>
                        <option value="85mm">85mm</option>
                        <option value="macro">매크로</option>
                        <option value="wide_angle">광각</option>
                        <option value="telephoto">망원</option>
                        <option value="fisheye">어안</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">필름 종류</label>
                      <select
                        value={settingOptions.filmType}
                        onChange={(e) => setSettingOptions((prev: any) => ({ ...prev, filmType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">없음</option>
                        <option value="black_white">흑백</option>
                        <option value="polaroid">폴라로이드</option>
                        <option value="vintage">빈티지</option>
                        <option value="film_noir">느와르</option>
                        <option value="duotone">듀오톤</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="px-4 md:px-8">
      {/* 탭명과 프롬프트 샘플 버튼(상단 header 공통) */}
      <div className="flex items-center border-b mb-6 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-400 hover:text-blue-500'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs font-normal text-gray-400">({tab.count})</span>
          </button>
        ))}
        <div className="flex-1"></div>
        <Button 
          onClick={() => setShowImagenPromptSampleModal(true)} 
          variant="outline"
          className="text-xs whitespace-nowrap"
        >
          프롬프트 샘플
        </Button>
      </div>

      {/* 탭별 내용 */}
      {renderTabContent()}

      {/* 하단: 생성된 이미지 썸네일 영역 (img2img와 동일) */}
      {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
        <div className="bg-white rounded-lg border mt-8 mb-3 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">생성된 이미지</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {generatedCharacters.map((item, idx) => (
              <div key={`char-${item.id}`} className="border rounded-lg p-3">
                <img src={item.image} alt={`캐릭터 ${idx+1}`} className="w-full h-32 object-cover rounded mb-2" />
                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
              </div>
            ))}
            {generatedBackgrounds.map((item, idx) => (
              <div key={`bg-${item.id}`} className="border rounded-lg p-3">
                <img src={item.image} alt={`배경 ${idx+1}`} className="w-full h-32 object-cover rounded mb-2" />
                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
              </div>
            ))}
            {generatedSettingCuts.map((item, idx) => (
              <div key={`cut-${item.id}`} className="border rounded-lg p-3">
                <img src={item.image} alt={`설정 컷 ${idx+1}`} className="w-full h-32 object-cover rounded mb-2" />
                <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 프롬프트 샘플 모달 */}
      <ImagenPromptSampleModal
        isOpen={showImagenPromptSampleModal}
        onClose={() => setShowImagenPromptSampleModal(false)}
      />
    </div>
  );
};
