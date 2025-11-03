import React, { useState } from 'react';
import Button from '../common/Button';
import { ImageGenerationConfig } from '../common/ImageGenerationForm';
import { AdvancedImageGenerationModal } from '../common/AdvancedImageGenerationModal';
import { StyleReferenceModal } from '../common/StyleReferenceModal';
import { Camera } from 'lucide-react';
import type { GeneratedCharacter, GeneratedBackground, GeneratedSettingCut } from '../../types/project';

interface NanoBananaImageStepTabsProps {
  onGenerateCharacter: () => Promise<void>;
  onGenerateBackground: () => Promise<void>;
  onGenerateSettingCut: () => Promise<void>;
  
  characterInput: string;
  setCharacterInput: (input: string) => void;
  backgroundInput: string;
  setBackgroundInput: (input: string) => void;
  settingCut: string;
  setSettingCut: (input: string) => void;
  
  attachedCharacterImages: File[];
  setAttachedCharacterImages: (images: File[]) => void;
  attachedBackgroundImages: File[];
  setAttachedBackgroundImages: (images: File[]) => void;
  attachedSettingImages: File[];
  setAttachedSettingImages: (images: File[]) => void;
  
  showCharacterOptions: boolean;
  setShowCharacterOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  showBackgroundOptions: boolean;
  setShowBackgroundOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  showSettingOptions: boolean;
  setShowSettingOptions: (show: boolean | ((prev: boolean) => boolean)) => void;
  
  characterOptions: ImageGenerationConfig;
  setCharacterOptions: (options: ImageGenerationConfig | ((prev: ImageGenerationConfig) => ImageGenerationConfig)) => void;
  backgroundOptions: ImageGenerationConfig;
  setBackgroundOptions: (options: ImageGenerationConfig | ((prev: ImageGenerationConfig) => ImageGenerationConfig)) => void;
  settingOptions: ImageGenerationConfig;
  setSettingOptions: (options: ImageGenerationConfig | ((prev: ImageGenerationConfig) => ImageGenerationConfig)) => void;
  
  isGenerating: boolean;
  
  generatedCharacters: GeneratedCharacter[];
  generatedBackgrounds: GeneratedBackground[];
  generatedSettingCuts: GeneratedSettingCut[];
  
  // 고급 이미지 생성 상태
  generatedAdvancedImages: GeneratedCharacter[];
  setGeneratedAdvancedImages: React.Dispatch<React.SetStateAction<GeneratedCharacter[]>>;
}

export const NanoBananaImageStepTabs: React.FC<NanoBananaImageStepTabsProps> = ({
  onGenerateCharacter,
  onGenerateBackground,
  onGenerateSettingCut,
  characterInput,
  setCharacterInput,
  backgroundInput,
  setBackgroundInput,
  settingCut,
  setSettingCut,
  attachedCharacterImages,
  setAttachedCharacterImages,
  attachedBackgroundImages,
  setAttachedBackgroundImages,
  attachedSettingImages,
  setAttachedSettingImages,
  showCharacterOptions,
  setShowCharacterOptions,
  showBackgroundOptions,
  setShowBackgroundOptions,
  showSettingOptions,
  setShowSettingOptions,
  characterOptions,
  setCharacterOptions,
  backgroundOptions,
  setBackgroundOptions,
  settingOptions,
  setSettingOptions,
  isGenerating,
  generatedCharacters,
  generatedBackgrounds,
  generatedSettingCuts,
  generatedAdvancedImages,
  setGeneratedAdvancedImages
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'background' | 'setting'>('character');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showStyleReferenceModal, setShowStyleReferenceModal] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleFileUpload = (files: FileList | null, setter: (files: File[]) => void, currentFiles: File[]) => {
    if (files) {
      const fileArray = Array.from(files);
      // 기존 파일과 새 파일을 합쳐서 최대 3개까지만 허용
      const combinedFiles = [...currentFiles, ...fileArray];
      const limitedFiles = combinedFiles.slice(0, 3);
      setter(limitedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, setter: (files: File[]) => void, currentFiles: File[]) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    
    const files = e.dataTransfer.files;
    if (files) {
      const fileArray = Array.from(files);
      // 기존 파일과 새 파일을 합쳐서 최대 3개까지만 허용
      const combinedFiles = [...currentFiles, ...fileArray];
      const limitedFiles = combinedFiles.slice(0, 3);
      setter(limitedFiles);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'character':
        return (
          <div className="space-y-4">
            {/* 캐릭터 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">캐릭터 설명</label>
              <textarea
                value={characterInput}
                onChange={(e) => setCharacterInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="캐릭터에 대한 설명을 입력하세요..."
              />
            </div>

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 이미지 첨부 (최대 3개)
              </label>
              
              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === 'character'
                    ? 'border-blue-400 bg-blue-50'
                    : attachedCharacterImages.length > 0 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, 'character')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setAttachedCharacterImages, attachedCharacterImages)}
              >
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {dragOver === 'character' ? (
                      <p className="font-medium text-blue-600">이미지를 여기에 놓으세요</p>
                    ) : (
                      <>
                        <p className="font-medium">이미지를 드래그하여 놓거나</p>
                        <p>클릭하여 파일을 선택하세요</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, setAttachedCharacterImages, attachedCharacterImages)}
                    className="hidden"
                    id="character-file-input"
                  />
                  <label
                    htmlFor="character-file-input"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    파일 선택
                  </label>
                </div>
              </div>
              
              {/* 첨부된 이미지 미리보기 */}
              {attachedCharacterImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    첨부된 이미지 ({attachedCharacterImages.length}/3)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {attachedCharacterImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-40 h-40 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setAttachedCharacterImages(attachedCharacterImages.filter((_, i) => i !== index))}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                            title="이미지 제거"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 커스텀 설정 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">커스텀 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">커스텀 사이즈</label>
                  <input
                    type="text"
                    placeholder="예: 1024x1024, 1920x1080"
                    value={characterOptions.customSize || ''}
                    onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, customSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">추가 프롬프트</label>
                  <textarea
                    placeholder="추가적인 설명이나 스타일 지시사항을 입력하세요..."
                    value={characterOptions.additionalPrompt || ''}
                    onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, additionalPrompt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 개별 옵션 설정 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  캐릭터 개별 옵션
                </h3>
                <Button
                  onClick={() => setShowCharacterOptions((prev: boolean) => !prev)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {showCharacterOptions ? '숨기기' : '보이기'}
                </Button>
              </div>
              
              {showCharacterOptions && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  {/* 기본 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">기본 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
                        <select
                          value={characterOptions.style}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, style: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="photographic">사진형 (Photographic)</option>
                          <option value="artistic">아티스틱 (Artistic)</option>
                          <option value="cartoon">카툰 (Cartoon)</option>
                          <option value="anime">애니메이션 (Anime)</option>
                          <option value="realistic">리얼리스틱 (Realistic)</option>
                          <option value="illustration">일러스트레이션 (Illustration)</option>
                          <option value="sketch">스케치 (Sketch)</option>
                          <option value="pen_drawing">펜화 (Pen Drawing)</option>
                          <option value="ink_wash">수묵화 (Ink Wash)</option>
                          <option value="painting">회화 (Painting)</option>
                          <option value="watercolor">수채화 (Watercolor)</option>
                          <option value="oil_painting">유화 (Oil Painting)</option>
                          <option value="digital_art">디지털 아트 (Digital Art)</option>
                          <option value="concept_art">컨셉 아트 (Concept Art)</option>
                          <option value="fantasy">판타지 (Fantasy)</option>
                          <option value="sci_fi">사이언스 픽션 (Sci-Fi)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="modern">모던 (Modern)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
                        <select
                          value={characterOptions.quality}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, quality: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="standard">표준 (Standard)</option>
                          <option value="high">고품질 (High)</option>
                          <option value="ultra">초고품질 (Ultra)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
                        <select
                          value={characterOptions.aspectRatio}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, aspectRatio: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="1:1">정사각형 (1:1)</option>
                          <option value="4:3">전체화면 (4:3)</option>
                          <option value="3:4">세로 전체화면 (3:4)</option>
                          <option value="16:9">와이드스크린 (16:9)</option>
                          <option value="9:16">세로 모드 (9:16)</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* 추가 옵션들 */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일 강화</label>
                        <select
                          value={characterOptions.styleEnhancement || 'none'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, styleEnhancement: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음</option>
                          <option value="enhanced">스타일 강화</option>
                          <option value="subtle">은은한 강화</option>
                          <option value="dramatic">드라마틱 강화</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">편집 모드</label>
                        <select
                          value={characterOptions.editMode || 'modify'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, editMode: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="modify">수정 (Modify)</option>
                          <option value="enhance">향상 (Enhance)</option>
                          <option value="transform">변환 (Transform)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">세부사항 보존</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={characterOptions.detailPreservation || 75}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, detailPreservation: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 text-center">{characterOptions.detailPreservation || 75}%</div>
                      </div>
                    </div>
                  </div>

                  {/* 카메라 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      카메라 설정
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 위치</label>
                        <select
                          value={characterOptions.cameraPosition || 'front'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraPosition: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="front">정면 (Front)</option>
                          <option value="side">측면 (Side)</option>
                          <option value="back">후면 (Back)</option>
                          <option value="top">상단 (Top)</option>
                          <option value="low_angle">로우 앵글 (Low Angle)</option>
                          <option value="high_angle">하이 앵글 (High Angle)</option>
                          <option value="bird_eye">버드아이 (Bird's Eye)</option>
                          <option value="worm_eye">웜아이 (Worm's Eye)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">렌즈 타입</label>
                        <select
                          value={characterOptions.lensType || 'standard'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, lensType: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="wide_angle">와이드 앵글 (Wide Angle)</option>
                          <option value="standard">표준 (Standard)</option>
                          <option value="telephoto">망원 (Telephoto)</option>
                          <option value="macro">매크로 (Macro)</option>
                          <option value="fisheye">피시아이 (Fisheye)</option>
                          <option value="tilt_shift">틸트 시프트 (Tilt Shift)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">초점 거리</label>
                        <select
                          value={characterOptions.focalDistance || 'medium'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, focalDistance: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="close_up">클로즈업 (Close-up)</option>
                          <option value="medium">미디엄 (Medium)</option>
                          <option value="long_shot">롱샷 (Long Shot)</option>
                          <option value="extreme_long_shot">익스트림 롱샷 (Extreme Long Shot)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 필터</label>
                        <select
                          value={characterOptions.cameraFilter || 'none'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraFilter: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음 (None)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="cinematic">시네마틱 (Cinematic)</option>
                          <option value="dramatic">드라마틱 (Dramatic)</option>
                          <option value="soft_focus">소프트 포커스 (Soft Focus)</option>
                          <option value="sharp">샤프 (Sharp)</option>
                          <option value="warm">웜톤 (Warm)</option>
                          <option value="cool">쿨톤 (Cool)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 추가 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">추가 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일 강화</label>
                        <select
                          value={characterOptions.styleEnhancement || 'none'}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, styleEnhancement: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음</option>
                          <option value="enhanced">스타일 강화</option>
                          <option value="subtle">은은한 강화</option>
                          <option value="dramatic">드라마틱 강화</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">편집 강도</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={characterOptions.editIntensity || 50}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, editIntensity: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {characterOptions.editIntensity || 50}% (0: 보존, 100: 강한 편집)
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">세부정보 보존</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={characterOptions.detailPreservation || 75}
                          onChange={(e) => setCharacterOptions((prev: ImageGenerationConfig) => ({ ...prev, detailPreservation: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {characterOptions.detailPreservation || 75}% (0: 낮음, 100: 높음)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 생성 버튼 */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowStyleReferenceModal(true)}
                variant="outline"
                className="text-sm"
              >
                스타일 참조
              </Button>
              <Button
                onClick={onGenerateCharacter}
                disabled={isGenerating || !characterInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isGenerating ? '생성 중...' : '캐릭터 생성'}
              </Button>
            </div>
          </div>
        );

      case 'background':
        return (
          <div className="space-y-4">
            {/* 배경 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">배경 설명</label>
              <textarea
                value={backgroundInput}
                onChange={(e) => setBackgroundInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="배경에 대한 설명을 입력하세요..."
              />
            </div>

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 이미지 첨부 (최대 3개)
              </label>
              
              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === 'background'
                    ? 'border-blue-400 bg-blue-50'
                    : attachedBackgroundImages.length > 0 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, 'background')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setAttachedBackgroundImages, attachedBackgroundImages)}
              >
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {dragOver === 'background' ? (
                      <p className="font-medium text-blue-600">이미지를 여기에 놓으세요</p>
                    ) : (
                      <>
                        <p className="font-medium">이미지를 드래그하여 놓거나</p>
                        <p>클릭하여 파일을 선택하세요</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, setAttachedBackgroundImages, attachedBackgroundImages)}
                    className="hidden"
                    id="background-file-input"
                  />
                  <label
                    htmlFor="background-file-input"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    파일 선택
                  </label>
                </div>
              </div>
              
              {/* 첨부된 이미지 미리보기 */}
              {attachedBackgroundImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    첨부된 이미지 ({attachedBackgroundImages.length}/3)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {attachedBackgroundImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-40 h-40 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setAttachedBackgroundImages(attachedBackgroundImages.filter((_, i) => i !== index))}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                            title="이미지 제거"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 커스텀 설정 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">커스텀 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">커스텀 사이즈</label>
                  <input
                    type="text"
                    placeholder="예: 1024x1024, 1920x1080"
                    value={backgroundOptions.customSize || ''}
                    onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, customSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">추가 프롬프트</label>
                  <textarea
                    placeholder="추가적인 설명이나 스타일 지시사항을 입력하세요..."
                    value={backgroundOptions.additionalPrompt || ''}
                    onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, additionalPrompt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 개별 옵션 설정 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  배경 개별 옵션
                </h3>
                <Button
                  onClick={() => setShowBackgroundOptions((prev: boolean) => !prev)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {showBackgroundOptions ? '숨기기' : '보이기'}
                </Button>
              </div>
              
              {showBackgroundOptions && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  {/* 기본 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">기본 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
                        <select
                          value={backgroundOptions.style}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, style: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="photographic">사진형 (Photographic)</option>
                          <option value="artistic">아티스틱 (Artistic)</option>
                          <option value="cartoon">카툰 (Cartoon)</option>
                          <option value="anime">애니메이션 (Anime)</option>
                          <option value="realistic">리얼리스틱 (Realistic)</option>
                          <option value="illustration">일러스트레이션 (Illustration)</option>
                          <option value="sketch">스케치 (Sketch)</option>
                          <option value="pen_drawing">펜화 (Pen Drawing)</option>
                          <option value="ink_wash">수묵화 (Ink Wash)</option>
                          <option value="painting">회화 (Painting)</option>
                          <option value="watercolor">수채화 (Watercolor)</option>
                          <option value="oil_painting">유화 (Oil Painting)</option>
                          <option value="digital_art">디지털 아트 (Digital Art)</option>
                          <option value="concept_art">컨셉 아트 (Concept Art)</option>
                          <option value="fantasy">판타지 (Fantasy)</option>
                          <option value="sci_fi">사이언스 픽션 (Sci-Fi)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="modern">모던 (Modern)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
                        <select
                          value={backgroundOptions.quality}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, quality: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="standard">표준 (Standard)</option>
                          <option value="high">고품질 (High)</option>
                          <option value="ultra">초고품질 (Ultra)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
                        <select
                          value={backgroundOptions.aspectRatio}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, aspectRatio: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="1:1">정사각형 (1:1)</option>
                          <option value="4:3">전체화면 (4:3)</option>
                          <option value="3:4">세로 전체화면 (3:4)</option>
                          <option value="16:9">와이드스크린 (16:9)</option>
                          <option value="9:16">세로 모드 (9:16)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 카메라 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      카메라 설정
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 위치</label>
                        <select
                          value={backgroundOptions.cameraPosition || 'front'}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraPosition: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="front">정면 (Front)</option>
                          <option value="side">측면 (Side)</option>
                          <option value="back">후면 (Back)</option>
                          <option value="top">상단 (Top)</option>
                          <option value="low_angle">로우 앵글 (Low Angle)</option>
                          <option value="high_angle">하이 앵글 (High Angle)</option>
                          <option value="bird_eye">버드아이 (Bird's Eye)</option>
                          <option value="worm_eye">웜아이 (Worm's Eye)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">렌즈 타입</label>
                        <select
                          value={backgroundOptions.lensType || 'standard'}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, lensType: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="wide_angle">와이드 앵글 (Wide Angle)</option>
                          <option value="standard">표준 (Standard)</option>
                          <option value="telephoto">망원 (Telephoto)</option>
                          <option value="macro">매크로 (Macro)</option>
                          <option value="fisheye">피시아이 (Fisheye)</option>
                          <option value="tilt_shift">틸트 시프트 (Tilt Shift)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">초점 거리</label>
                        <select
                          value={backgroundOptions.focalDistance || 'medium'}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, focalDistance: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="close_up">클로즈업 (Close-up)</option>
                          <option value="medium">미디엄 (Medium)</option>
                          <option value="long_shot">롱샷 (Long Shot)</option>
                          <option value="extreme_long_shot">익스트림 롱샷 (Extreme Long Shot)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 필터</label>
                        <select
                          value={backgroundOptions.cameraFilter || 'none'}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraFilter: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음 (None)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="cinematic">시네마틱 (Cinematic)</option>
                          <option value="dramatic">드라마틱 (Dramatic)</option>
                          <option value="soft_focus">소프트 포커스 (Soft Focus)</option>
                          <option value="sharp">샤프 (Sharp)</option>
                          <option value="warm">웜톤 (Warm)</option>
                          <option value="cool">쿨톤 (Cool)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 추가 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">추가 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일 강화</label>
                        <select
                          value={backgroundOptions.styleEnhancement || 'none'}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, styleEnhancement: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음</option>
                          <option value="enhanced">스타일 강화</option>
                          <option value="subtle">은은한 강화</option>
                          <option value="dramatic">드라마틱 강화</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">편집 강도</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={backgroundOptions.editIntensity || 50}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, editIntensity: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {backgroundOptions.editIntensity || 50}% (0: 보존, 100: 강한 편집)
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">세부정보 보존</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={backgroundOptions.detailPreservation || 75}
                          onChange={(e) => setBackgroundOptions((prev: ImageGenerationConfig) => ({ ...prev, detailPreservation: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {backgroundOptions.detailPreservation || 75}% (0: 낮음, 100: 높음)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 생성 버튼 */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowStyleReferenceModal(true)}
                variant="outline"
                className="text-sm"
              >
                스타일 참조
              </Button>
              <Button
                onClick={onGenerateBackground}
                disabled={isGenerating || !backgroundInput.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isGenerating ? '생성 중...' : '배경 생성'}
              </Button>
            </div>
          </div>
        );

      case 'setting':
        return (
          <div className="space-y-4">
            {/* 설정 컷 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">설정 컷 설명</label>
              <textarea
                value={settingCut}
                onChange={(e) => setSettingCut(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="설정 컷에 대한 설명을 입력하세요..."
              />
            </div>

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참조 이미지 첨부 (최대 3개)
              </label>
              
              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver === 'setting'
                    ? 'border-blue-400 bg-blue-50'
                    : attachedSettingImages.length > 0 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, 'setting')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setAttachedSettingImages, attachedSettingImages)}
              >
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    {dragOver === 'setting' ? (
                      <p className="font-medium text-blue-600">이미지를 여기에 놓으세요</p>
                    ) : (
                      <>
                        <p className="font-medium">이미지를 드래그하여 놓거나</p>
                        <p>클릭하여 파일을 선택하세요</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files, setAttachedSettingImages, attachedSettingImages)}
                    className="hidden"
                    id="setting-file-input"
                  />
                  <label
                    htmlFor="setting-file-input"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    파일 선택
                  </label>
                </div>
              </div>
              
              {/* 첨부된 이미지 미리보기 */}
              {attachedSettingImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    첨부된 이미지 ({attachedSettingImages.length}/3)
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {attachedSettingImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-40 h-40 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setAttachedSettingImages(attachedSettingImages.filter((_, i) => i !== index))}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                            title="이미지 제거"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 커스텀 설정 */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">커스텀 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">커스텀 사이즈</label>
                  <input
                    type="text"
                    placeholder="예: 1024x1024, 1920x1080"
                    value={settingOptions.customSize || ''}
                    onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, customSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">추가 프롬프트</label>
                  <textarea
                    placeholder="추가적인 설명이나 스타일 지시사항을 입력하세요..."
                    value={settingOptions.additionalPrompt || ''}
                    onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, additionalPrompt: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 개별 옵션 설정 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  설정 컷 개별 옵션
                </h3>
                <Button
                  onClick={() => setShowSettingOptions((prev: boolean) => !prev)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {showSettingOptions ? '숨기기' : '보이기'}
                </Button>
              </div>
              
              {showSettingOptions && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  {/* 기본 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">기본 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
                        <select
                          value={settingOptions.style}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, style: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="photographic">사진형 (Photographic)</option>
                          <option value="artistic">아티스틱 (Artistic)</option>
                          <option value="cartoon">카툰 (Cartoon)</option>
                          <option value="anime">애니메이션 (Anime)</option>
                          <option value="realistic">리얼리스틱 (Realistic)</option>
                          <option value="illustration">일러스트레이션 (Illustration)</option>
                          <option value="sketch">스케치 (Sketch)</option>
                          <option value="pen_drawing">펜화 (Pen Drawing)</option>
                          <option value="ink_wash">수묵화 (Ink Wash)</option>
                          <option value="painting">회화 (Painting)</option>
                          <option value="watercolor">수채화 (Watercolor)</option>
                          <option value="oil_painting">유화 (Oil Painting)</option>
                          <option value="digital_art">디지털 아트 (Digital Art)</option>
                          <option value="concept_art">컨셉 아트 (Concept Art)</option>
                          <option value="fantasy">판타지 (Fantasy)</option>
                          <option value="sci_fi">사이언스 픽션 (Sci-Fi)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="modern">모던 (Modern)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">품질</label>
                        <select
                          value={settingOptions.quality}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, quality: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="standard">표준 (Standard)</option>
                          <option value="high">고품질 (High)</option>
                          <option value="ultra">초고품질 (Ultra)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">화면 비율</label>
                        <select
                          value={settingOptions.aspectRatio}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, aspectRatio: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="1:1">정사각형 (1:1)</option>
                          <option value="4:3">전체화면 (4:3)</option>
                          <option value="3:4">세로 전체화면 (3:4)</option>
                          <option value="16:9">와이드스크린 (16:9)</option>
                          <option value="9:16">세로 모드 (9:16)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 카메라 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      카메라 설정
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 위치</label>
                        <select
                          value={settingOptions.cameraPosition || 'front'}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraPosition: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="front">정면 (Front)</option>
                          <option value="side">측면 (Side)</option>
                          <option value="back">후면 (Back)</option>
                          <option value="top">상단 (Top)</option>
                          <option value="low_angle">로우 앵글 (Low Angle)</option>
                          <option value="high_angle">하이 앵글 (High Angle)</option>
                          <option value="bird_eye">버드아이 (Bird's Eye)</option>
                          <option value="worm_eye">웜아이 (Worm's Eye)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">렌즈 타입</label>
                        <select
                          value={settingOptions.lensType || 'standard'}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, lensType: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="wide_angle">와이드 앵글 (Wide Angle)</option>
                          <option value="standard">표준 (Standard)</option>
                          <option value="telephoto">망원 (Telephoto)</option>
                          <option value="macro">매크로 (Macro)</option>
                          <option value="fisheye">피시아이 (Fisheye)</option>
                          <option value="tilt_shift">틸트 시프트 (Tilt Shift)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">초점 거리</label>
                        <select
                          value={settingOptions.focalDistance || 'medium'}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, focalDistance: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="close_up">클로즈업 (Close-up)</option>
                          <option value="medium">미디엄 (Medium)</option>
                          <option value="long_shot">롱샷 (Long Shot)</option>
                          <option value="extreme_long_shot">익스트림 롱샷 (Extreme Long Shot)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">카메라 필터</label>
                        <select
                          value={settingOptions.cameraFilter || 'none'}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, cameraFilter: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음 (None)</option>
                          <option value="vintage">빈티지 (Vintage)</option>
                          <option value="cinematic">시네마틱 (Cinematic)</option>
                          <option value="dramatic">드라마틱 (Dramatic)</option>
                          <option value="soft_focus">소프트 포커스 (Soft Focus)</option>
                          <option value="sharp">샤프 (Sharp)</option>
                          <option value="warm">웜톤 (Warm)</option>
                          <option value="cool">쿨톤 (Cool)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 추가 설정 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">추가 설정</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">스타일 강화</label>
                        <select
                          value={settingOptions.styleEnhancement || 'none'}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, styleEnhancement: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="none">적용 없음</option>
                          <option value="enhanced">스타일 강화</option>
                          <option value="subtle">은은한 강화</option>
                          <option value="dramatic">드라마틱 강화</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">편집 강도</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settingOptions.editIntensity || 50}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, editIntensity: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {settingOptions.editIntensity || 50}% (0: 보존, 100: 강한 편집)
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">세부정보 보존</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settingOptions.detailPreservation || 75}
                          onChange={(e) => setSettingOptions((prev: ImageGenerationConfig) => ({ ...prev, detailPreservation: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {settingOptions.detailPreservation || 75}% (0: 낮음, 100: 높음)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 생성 버튼 */}
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setShowStyleReferenceModal(true)}
                variant="outline"
                className="text-sm"
              >
                스타일 참조
              </Button>
              <Button
                onClick={onGenerateSettingCut}
                disabled={isGenerating || !settingCut.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? '생성 중...' : '설정 컷 생성'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('character')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'character'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            캐릭터 ({generatedCharacters.length})
          </button>
          <button
            onClick={() => setActiveTab('background')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'background'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            배경 ({generatedBackgrounds.length})
          </button>
          <button
            onClick={() => setActiveTab('setting')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'setting'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            설정 컷 ({generatedSettingCuts.length})
          </button>
        </div>
        
        {/* 탭 내용 */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* 모달들 */}
      <AdvancedImageGenerationModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onComplete={(result) => {
          console.log('🎉 고급 이미지 생성 완료:', result);
          
          if (result && result.image) {
            const newAdvancedImage: GeneratedCharacter = {
              id: Date.now(),
              description: result.description || '고급 이미지',
              image: result.image,
              attachedImages: (result.attachedImages || []).map((f: File) => f.name || 'file'), // File[]를 string[]로 변환
              timestamp: new Date().toISOString(),
              type: 'character' // GeneratedCharacter 타입에 필수
            };
            
            setGeneratedAdvancedImages(prev => [...prev, newAdvancedImage]);
            console.log('✅ 고급 이미지가 성공적으로 생성되어 목록에 추가되었습니다.');
          } else {
            console.error('❌ 고급 이미지 생성 결과가 올바르지 않습니다:', result);
          }
          
          setShowAdvancedModal(false);
        }}
      />

      <StyleReferenceModal
        isOpen={showStyleReferenceModal}
        onClose={() => setShowStyleReferenceModal(false)}
      />
    </div>
  );
};
