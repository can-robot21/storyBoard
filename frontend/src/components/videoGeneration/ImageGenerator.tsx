import React, { useState, useRef, useEffect, useCallback, startTransition } from 'react';
import Button from '../common/Button';
import { GeneratedImage } from '../../types/videoGeneration';
import { useUIStore } from '../../stores/uiStore';
import { GoogleAIService } from '../../services/googleAIService';
import { getAPIKeyFromStorage } from '../../utils/apiKeyUtils';
import type { Character, GeneratedCharacter, GeneratedBackground, GeneratedSettingCut } from '../../types/project';
import { Trash2, Edit3, Check, X, Download } from 'lucide-react';

// 프로젝트 참조 이미지 타입 정의
interface ProjectReferenceImage {
  image: string;
  imageUrl?: string;
  description: string;
  prompt?: string;
  timestamp: string;
  id: number;
  source?: string;
}

interface ProjectReferenceData {
  characters: ProjectReferenceImage[];
  backgrounds: ProjectReferenceImage[];
  settingCuts: ProjectReferenceImage[];
  advanced: ProjectReferenceImage[];
}

interface ImageGeneratorProps {
  generatedCharacterImages: GeneratedImage[];
  setGeneratedCharacterImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideoBackgrounds: GeneratedImage[];
  setGeneratedVideoBackgrounds: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectedCharacterImages: Set<number>;
  setSelectedCharacterImages: React.Dispatch<React.SetStateAction<Set<number>>>;
  selectedVideoBackgrounds: Set<number>;
  setSelectedVideoBackgrounds: React.Dispatch<React.SetStateAction<Set<number>>>;
  story: string;
  characterList: Character[];
  finalScenario: string;
  // 프로젝트 참조에서 가져올 이미지들
  projectReferenceCharacters?: GeneratedCharacter[];
  projectReferenceBackgrounds?: GeneratedBackground[];
  projectReferenceSettingCuts?: GeneratedSettingCut[];
  // 설정 컷 이미지 관련 (새로 추가)
  generatedSettingCutImages?: GeneratedImage[];
  setGeneratedSettingCutImages?: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  selectedSettingCutImages?: Set<number>;
  setSelectedSettingCutImages?: React.Dispatch<React.SetStateAction<Set<number>>>;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  generatedCharacterImages,
  setGeneratedCharacterImages,
  generatedVideoBackgrounds,
  setGeneratedVideoBackgrounds,
  selectedCharacterImages,
  setSelectedCharacterImages,
  selectedVideoBackgrounds,
  setSelectedVideoBackgrounds,
  story,
  characterList,
  finalScenario,
  projectReferenceCharacters = [],
  projectReferenceBackgrounds = [],
  projectReferenceSettingCuts = [],
  generatedSettingCutImages = [],
  setGeneratedSettingCutImages,
  selectedSettingCutImages = new Set(),
  setSelectedSettingCutImages
}) => {
  const { addNotification } = useUIStore();
  
  // API 키 가져오기 (통합 유틸리티 사용)
  const getAPIKey = useCallback((): string => {
    return getAPIKeyFromStorage('google');
  }, []);
  
  // 상태 관리
  const [isGeneratingCharacterImage, setIsGeneratingCharacterImage] = useState(false);
  const [isGeneratingBackgroundImage, setIsGeneratingBackgroundImage] = useState(false);
  const [isGeneratingSettingCutImage, setIsGeneratingSettingCutImage] = useState(false);
  
  // 프로젝트 참조 모달 상태
  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);
  const [referenceModalType, setReferenceModalType] = useState<'character' | 'background' | 'settingCut' | null>(null);
  
  // 텍스트 편집 상태
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  
  // 프롬프트 입력 모달 상태
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalType, setPromptModalType] = useState<'character' | 'background' | 'settingCut' | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // 프로젝트 참조 데이터 상태
  const [projectReferenceData, setProjectReferenceData] = useState<ProjectReferenceData | null>(null);
  
  // 프로젝트 참조 모달에서 선택된 이미지 상태
  const [selectedProjectImages, setSelectedProjectImages] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  // 중복 호출 방지를 위한 ref
  const processingImagesRef = useRef<Set<string>>(new Set());

  // 프로젝트 참조 데이터 로드 (localStorage + 현재 프로젝트 props 병합)
  useEffect(() => {
    const loadProjectReferenceData = () => {
      try {
        // localStorage에서 각 이미지 타입별로 데이터 로드
        const storedCharacterImages = JSON.parse(localStorage.getItem('generatedCharacters') || '[]');
        const storedBackgroundImages = JSON.parse(localStorage.getItem('generatedBackgrounds') || '[]');
        const storedSettingCutImages = JSON.parse(localStorage.getItem('generatedSettingCuts') || '[]');
        const storedAdvancedImages = JSON.parse(localStorage.getItem('generatedAdvancedImages') || '[]');
        
        // 고급 이미지가 없는 경우 다른 키에서도 확인
        const storedAdvancedImagesAlt = storedAdvancedImages.length === 0 
          ? JSON.parse(localStorage.getItem('advanced_images') || '[]')
          : storedAdvancedImages;
        
        // 프로젝트 이미지도 확인
        const projectImages = JSON.parse(localStorage.getItem('project_images') || '[]');
        
        // 각 이미지 배열이 존재하는지 확인
        const validStoredCharacters = Array.isArray(storedCharacterImages) ? storedCharacterImages : [];
        const validStoredBackgrounds = Array.isArray(storedBackgroundImages) ? storedBackgroundImages : [];
        const validStoredSettingCuts = Array.isArray(storedSettingCutImages) ? storedSettingCutImages : [];
        const validStoredAdvanced = Array.isArray(storedAdvancedImagesAlt) ? storedAdvancedImagesAlt : [];
        const validProjectImages = Array.isArray(projectImages) ? projectImages : [];
        
        // props로 받은 현재 프로젝트 이미지들을 형식 변환
        const currentProjectCharacters = (projectReferenceCharacters || []).map((img: GeneratedCharacter): ProjectReferenceImage => ({
          image: img.image,
          imageUrl: img.image,
          description: img.description,
          prompt: img.description,
          timestamp: img.timestamp,
          id: img.id,
          source: 'current_project'
        }));
        
        const currentProjectBackgrounds = (projectReferenceBackgrounds || []).map((img: GeneratedBackground): ProjectReferenceImage => ({
          image: img.image,
          imageUrl: img.image,
          description: img.description,
          prompt: img.description,
          timestamp: img.timestamp,
          id: img.id,
          source: 'current_project'
        }));
        
        const currentProjectSettingCuts = (projectReferenceSettingCuts || []).map((img: GeneratedSettingCut): ProjectReferenceImage => ({
          image: img.image,
          imageUrl: img.image,
          description: img.description,
          prompt: img.description,
          timestamp: img.timestamp,
          id: img.id,
          source: 'current_project'
        }));
        
        // 중복 제거를 위한 Set 사용 (image URL 기준)
        const seenCharacterUrls = new Set<string>();
        const seenBackgroundUrls = new Set<string>();
        const seenSettingCutUrls = new Set<string>();
        const seenAdvancedUrls = new Set<string>();
        
        // 중복 제거 헬퍼 함수
        const filterUniqueImages = (images: ProjectReferenceImage[], seenUrls: Set<string>): ProjectReferenceImage[] => {
          return images.filter((img) => {
            const url = img.image || img.imageUrl || '';
            if (seenUrls.has(url)) return false;
            seenUrls.add(url);
            return true;
          });
        };

        // localStorage 이미지를 ProjectReferenceImage 형식으로 변환
        const convertToProjectReferenceImage = (img: unknown): ProjectReferenceImage | null => {
          if (typeof img !== 'object' || img === null) return null;
          const obj = img as Record<string, unknown>;
          return {
            image: String(obj.image || obj.imageUrl || ''),
            imageUrl: obj.imageUrl ? String(obj.imageUrl) : undefined,
            description: String(obj.description || obj.prompt || ''),
            prompt: obj.prompt ? String(obj.prompt) : undefined,
            timestamp: String(obj.timestamp || new Date().toISOString()),
            id: typeof obj.id === 'number' ? obj.id : Date.now(),
            source: obj.source ? String(obj.source) : undefined
          };
        };

        // localStorage 이미지 배열 변환
        const storedCharsAsRefImages = validStoredCharacters
          .map(convertToProjectReferenceImage)
          .filter((img): img is ProjectReferenceImage => img !== null);
        const storedBgsAsRefImages = validStoredBackgrounds
          .map(convertToProjectReferenceImage)
          .filter((img): img is ProjectReferenceImage => img !== null);
        const storedCutsAsRefImages = validStoredSettingCuts
          .map(convertToProjectReferenceImage)
          .filter((img): img is ProjectReferenceImage => img !== null);
        const storedAdvancedAsRefImages = validStoredAdvanced
          .map(convertToProjectReferenceImage)
          .filter((img): img is ProjectReferenceImage => img !== null);
        const projectImgsAsRefImages = validProjectImages
          .map(convertToProjectReferenceImage)
          .filter((img): img is ProjectReferenceImage => img !== null);

        // 현재 프로젝트 이미지를 우선으로 하고, localStorage 이미지를 추가 (중복 제거)
        const mergedCharacters = [
          ...filterUniqueImages(currentProjectCharacters, seenCharacterUrls),
          ...filterUniqueImages(storedCharsAsRefImages, seenCharacterUrls),
          ...filterUniqueImages(
            projectImgsAsRefImages.filter(img => {
              // 타입 확인은 localStorage에서 가져온 데이터의 구조에 따라 다를 수 있음
              return true; // character 타입 필터링은 상위에서 처리
            }),
            seenCharacterUrls
          )
        ];
        
        const mergedBackgrounds = [
          ...filterUniqueImages(currentProjectBackgrounds, seenBackgroundUrls),
          ...filterUniqueImages(storedBgsAsRefImages, seenBackgroundUrls),
          ...filterUniqueImages(projectImgsAsRefImages, seenBackgroundUrls)
        ];
        
        const mergedSettingCuts = [
          ...filterUniqueImages(currentProjectSettingCuts, seenSettingCutUrls),
          ...filterUniqueImages(storedCutsAsRefImages, seenSettingCutUrls),
          ...filterUniqueImages(projectImgsAsRefImages, seenSettingCutUrls)
        ];
        
        const mergedAdvanced = [
          ...filterUniqueImages(storedAdvancedAsRefImages, seenAdvancedUrls),
          ...filterUniqueImages(projectImgsAsRefImages, seenAdvancedUrls)
        ];
        
        const data: ProjectReferenceData = {
          characters: mergedCharacters,
          backgrounds: mergedBackgrounds,
          settingCuts: mergedSettingCuts,
          advanced: mergedAdvanced
        };
        
        // 데이터가 있는지 확인
        const hasAnyData = data.characters.length > 0 || 
                          data.backgrounds.length > 0 || 
                          data.settingCuts.length > 0 || 
                          data.advanced.length > 0;
        
        // 기존 데이터와 비교하여 실제로 변경되었는지 확인 (무한 루프 방지)
        const currentDataStr = JSON.stringify(projectReferenceData);
        const newDataStr = JSON.stringify(data);
        
        // 데이터가 변경되었을 때만 상태 업데이트 (렌더링 중 setState 방지)
        if (currentDataStr !== newDataStr) {
          startTransition(() => {
            if (hasAnyData) {
              setProjectReferenceData(data);
              // 디버그 로그는 개발 환경에서만 출력 (무한 로그 방지)
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ 프로젝트 참조 데이터 로드됨 (변경 감지):', {
                  캐릭터: `${currentProjectCharacters.length}(현재) + ${validStoredCharacters.length}(저장) = ${data.characters.length}(병합)`,
                  배경: `${currentProjectBackgrounds.length}(현재) + ${validStoredBackgrounds.length}(저장) = ${data.backgrounds.length}(병합)`,
                  설정컷: `${currentProjectSettingCuts.length}(현재) + ${validStoredSettingCuts.length}(저장) = ${data.settingCuts.length}(병합)`,
                  고급: `${validStoredAdvanced.length}(저장) = ${data.advanced.length}(병합)`
                });
              }
            } else {
              setProjectReferenceData({ characters: [], backgrounds: [], settingCuts: [], advanced: [] });
            }
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('프로젝트 참조 데이터 로드 오류:', error);
        }
        startTransition(() => {
          setProjectReferenceData({ characters: [], backgrounds: [], settingCuts: [], advanced: [] });
        });
      }
    };

    // 모달이 열릴 때만 데이터 로드 (props 변경으로 인한 무한 루프 방지)
    if (showProjectReferenceModal) {
      loadProjectReferenceData();
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProjectReferenceModal]);
  
  // props 변경을 별도로 감지 (실제 데이터 변경만, debounce 적용)
  const prevPropsRef = useRef({
    characters: JSON.stringify(projectReferenceCharacters),
    backgrounds: JSON.stringify(projectReferenceBackgrounds),
    settingCuts: JSON.stringify(projectReferenceSettingCuts)
  });
  
  useEffect(() => {
    if (!showProjectReferenceModal) return;
    
    const currentCharacters = JSON.stringify(projectReferenceCharacters);
    const currentBackgrounds = JSON.stringify(projectReferenceBackgrounds);
    const currentSettingCuts = JSON.stringify(projectReferenceSettingCuts);
    
    // props가 실제로 변경되었는지 확인
    const hasChanged = 
      prevPropsRef.current.characters !== currentCharacters ||
      prevPropsRef.current.backgrounds !== currentBackgrounds ||
      prevPropsRef.current.settingCuts !== currentSettingCuts;
    
    if (hasChanged) {
      // debounce 적용 (300ms)
      const timeoutId = setTimeout(() => {
        prevPropsRef.current = {
          characters: currentCharacters,
          backgrounds: currentBackgrounds,
          settingCuts: currentSettingCuts
        };
        
        // 데이터 재로드
        try {
          const storedCharacterImages = JSON.parse(localStorage.getItem('generatedCharacters') || '[]');
          const storedBackgroundImages = JSON.parse(localStorage.getItem('generatedBackgrounds') || '[]');
          const storedSettingCutImages = JSON.parse(localStorage.getItem('generatedSettingCuts') || '[]');
          const storedAdvancedImages = JSON.parse(localStorage.getItem('generatedAdvancedImages') || '[]');
          const storedAdvancedImagesAlt = storedAdvancedImages.length === 0 
            ? JSON.parse(localStorage.getItem('advanced_images') || '[]')
            : storedAdvancedImages;
          const projectImages = JSON.parse(localStorage.getItem('project_images') || '[]');
          
          const validStoredCharacters = Array.isArray(storedCharacterImages) ? storedCharacterImages : [];
          const validStoredBackgrounds = Array.isArray(storedBackgroundImages) ? storedBackgroundImages : [];
          const validStoredSettingCuts = Array.isArray(storedSettingCutImages) ? storedSettingCutImages : [];
          const validStoredAdvanced = Array.isArray(storedAdvancedImagesAlt) ? storedAdvancedImagesAlt : [];
          const validProjectImages = Array.isArray(projectImages) ? projectImages : [];
          
          const currentProjectCharacters = (projectReferenceCharacters || []).map((img: GeneratedCharacter): ProjectReferenceImage => ({
            image: img.image,
            imageUrl: img.image,
            description: img.description,
            prompt: img.description,
            timestamp: img.timestamp,
            id: img.id,
            source: 'current_project'
          }));
          
          const currentProjectBackgrounds = (projectReferenceBackgrounds || []).map((img: GeneratedBackground): ProjectReferenceImage => ({
            image: img.image,
            imageUrl: img.image,
            description: img.description,
            prompt: img.description,
            timestamp: img.timestamp,
            id: img.id,
            source: 'current_project'
          }));
          
          const currentProjectSettingCuts = (projectReferenceSettingCuts || []).map((img: GeneratedSettingCut): ProjectReferenceImage => ({
            image: img.image,
            imageUrl: img.image,
            description: img.description,
            prompt: img.description,
            timestamp: img.timestamp,
            id: img.id,
            source: 'current_project'
          }));
          
          const seenCharacterUrls = new Set<string>();
          const seenBackgroundUrls = new Set<string>();
          const seenSettingCutUrls = new Set<string>();
          const seenAdvancedUrls = new Set<string>();
          
          // 중복 제거 헬퍼 함수 (로컬 스코프)
          const filterUniqueImagesLocal = (images: ProjectReferenceImage[], seenUrls: Set<string>): ProjectReferenceImage[] => {
            return images.filter((img) => {
              const url = img.image || img.imageUrl || '';
              if (seenUrls.has(url)) return false;
              seenUrls.add(url);
              return true;
            });
          };

          // localStorage 이미지를 ProjectReferenceImage 형식으로 변환 (로컬 스코프)
          const convertToProjectReferenceImageLocal = (img: unknown): ProjectReferenceImage | null => {
            if (typeof img !== 'object' || img === null) return null;
            const obj = img as Record<string, unknown>;
            return {
              image: String(obj.image || obj.imageUrl || ''),
              imageUrl: obj.imageUrl ? String(obj.imageUrl) : undefined,
              description: String(obj.description || obj.prompt || ''),
              prompt: obj.prompt ? String(obj.prompt) : undefined,
              timestamp: String(obj.timestamp || new Date().toISOString()),
              id: typeof obj.id === 'number' ? obj.id : Date.now(),
              source: obj.source ? String(obj.source) : undefined
            };
          };

          // localStorage 이미지 배열 변환
          const storedCharsAsRefImagesLocal = validStoredCharacters
            .map(convertToProjectReferenceImageLocal)
            .filter((img): img is ProjectReferenceImage => img !== null);
          const storedBgsAsRefImagesLocal = validStoredBackgrounds
            .map(convertToProjectReferenceImageLocal)
            .filter((img): img is ProjectReferenceImage => img !== null);
          const storedCutsAsRefImagesLocal = validStoredSettingCuts
            .map(convertToProjectReferenceImageLocal)
            .filter((img): img is ProjectReferenceImage => img !== null);
          const storedAdvancedAsRefImagesLocal = validStoredAdvanced
            .map(convertToProjectReferenceImageLocal)
            .filter((img): img is ProjectReferenceImage => img !== null);
          const projectImgsAsRefImagesLocal = validProjectImages
            .map(convertToProjectReferenceImageLocal)
            .filter((img): img is ProjectReferenceImage => img !== null);

          const mergedCharacters = [
            ...filterUniqueImagesLocal(currentProjectCharacters, seenCharacterUrls),
            ...filterUniqueImagesLocal(storedCharsAsRefImagesLocal, seenCharacterUrls),
            ...filterUniqueImagesLocal(projectImgsAsRefImagesLocal, seenCharacterUrls)
          ];
          
          const mergedBackgrounds = [
            ...filterUniqueImagesLocal(currentProjectBackgrounds, seenBackgroundUrls),
            ...filterUniqueImagesLocal(storedBgsAsRefImagesLocal, seenBackgroundUrls),
            ...filterUniqueImagesLocal(projectImgsAsRefImagesLocal, seenBackgroundUrls)
          ];
          
          const mergedSettingCuts = [
            ...filterUniqueImagesLocal(currentProjectSettingCuts, seenSettingCutUrls),
            ...filterUniqueImagesLocal(storedCutsAsRefImagesLocal, seenSettingCutUrls),
            ...filterUniqueImagesLocal(projectImgsAsRefImagesLocal, seenSettingCutUrls)
          ];
          
          const mergedAdvanced = [
            ...filterUniqueImagesLocal(storedAdvancedAsRefImagesLocal, seenAdvancedUrls),
            ...filterUniqueImagesLocal(projectImgsAsRefImagesLocal, seenAdvancedUrls)
          ];
          
          const newData: ProjectReferenceData = {
            characters: mergedCharacters,
            backgrounds: mergedBackgrounds,
            settingCuts: mergedSettingCuts,
            advanced: mergedAdvanced
          };
          
          const hasAnyData = newData.characters.length > 0 || 
                            newData.backgrounds.length > 0 || 
                            newData.settingCuts.length > 0 || 
                            newData.advanced.length > 0;
          
          const currentDataStr = JSON.stringify(projectReferenceData);
          const newDataStr = JSON.stringify(newData);
          
          if (currentDataStr !== newDataStr) {
            startTransition(() => {
              if (hasAnyData) {
                setProjectReferenceData(newData);
              } else {
                setProjectReferenceData({ characters: [], backgrounds: [], settingCuts: [], advanced: [] });
              }
            });
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
          console.error('프로젝트 참조 데이터 로드 오류:', error);
        }
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProjectReferenceModal, JSON.stringify(projectReferenceCharacters), JSON.stringify(projectReferenceBackgrounds), JSON.stringify(projectReferenceSettingCuts)]);

  // 텍스트 편집 시작
  const handleStartEdit = (imageId: number, currentText: string) => {
    setEditingImageId(imageId);
    setEditingText(currentText);
  };

  // 텍스트 편집 완료
  const handleSaveEdit = (imageType: 'character' | 'background' | 'settingCut') => {
    if (!editingImageId || !editingText.trim()) return;

    const updateImage = (images: GeneratedImage[], setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>) => {
      setImages(prev => prev.map(img => 
        img.id === editingImageId 
          ? { ...img, description: editingText.trim() }
          : img
      ));
    };

    switch (imageType) {
      case 'character':
        updateImage(generatedCharacterImages, setGeneratedCharacterImages);
        break;
      case 'background':
        updateImage(generatedVideoBackgrounds, setGeneratedVideoBackgrounds);
        break;
      case 'settingCut':
        if (setGeneratedSettingCutImages) {
          updateImage(generatedSettingCutImages, setGeneratedSettingCutImages);
        }
        break;
    }

    setEditingImageId(null);
    setEditingText('');
    
    addNotification({
      type: 'success',
      title: '수정 완료',
      message: '이미지 설명이 수정되었습니다.',
    });
  };

  // 텍스트 편집 취소
  const handleCancelEdit = () => {
    setEditingImageId(null);
    setEditingText('');
  };

  // 이미지 삭제
  const handleDeleteImage = (imageId: number, imageType: 'character' | 'background' | 'settingCut') => {
    const deleteImage = (images: GeneratedImage[], setImages: React.Dispatch<React.SetStateAction<GeneratedImage[]>>) => {
      setImages(prev => prev.filter(img => img.id !== imageId));
    };

    switch (imageType) {
      case 'character':
        deleteImage(generatedCharacterImages, setGeneratedCharacterImages);
        setSelectedCharacterImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
        break;
      case 'background':
        deleteImage(generatedVideoBackgrounds, setGeneratedVideoBackgrounds);
        setSelectedVideoBackgrounds(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
        break;
      case 'settingCut':
        if (setGeneratedSettingCutImages && setSelectedSettingCutImages) {
          deleteImage(generatedSettingCutImages, setGeneratedSettingCutImages);
          setSelectedSettingCutImages(prev => {
            const newSet = new Set(prev);
            newSet.delete(imageId);
            return newSet;
          });
        }
        break;
    }

    addNotification({
      type: 'success',
      title: '삭제 완료',
      message: '이미지가 삭제되었습니다.',
    });
  };

  // 이미지 다운로드
  const handleDownloadImage = (imageUrl: string, description: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${description.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addNotification({
        type: 'success',
        title: '다운로드 완료',
        message: '이미지가 다운로드되었습니다.',
      });
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      addNotification({
        type: 'error',
        title: '다운로드 실패',
        message: '이미지 다운로드에 실패했습니다.',
      });
    }
  };

  // 프롬프트 확인 및 이미지 생성
  const handleConfirmPromptAndGenerate = () => {
    if (!customPrompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '프롬프트를 입력해주세요.',
      });
      return;
    }

    setShowPromptModal(false);
    
    switch (promptModalType) {
      case 'character':
        handleGenerateCharacterImage(customPrompt);
        break;
      case 'background':
        handleGenerateVideoBackground(customPrompt);
        break;
      case 'settingCut':
        handleGenerateSettingCutImage(customPrompt);
        break;
    }
    
    setPromptModalType(null);
    setCustomPrompt('');
  };

  // 프로젝트 참조에서 이미지 선택 핸들러
  const handleSelectFromProjectReference = (type: 'character' | 'background' | 'settingCut') => {
    setReferenceModalType(type);
    setShowProjectReferenceModal(true);
    setSelectedProjectImages(new Set()); // 모달 열 때 선택 상태 초기화
  };

  // 이미지 URL을 기반으로 고유한 ID 생성 (중복 방지)
  const generateImageId = (image: any, type: string): string => {
    const imageUrl = image.image || image.imageUrl || '';
    // 이미지 URL을 기반으로 해시 생성하여 고유 ID 생성
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i++) {
      const char = imageUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${type}-${Math.abs(hash)}`;
  };

  // 프로젝트 참조 이미지 체크박스 토글 핸들러 (렌더링 중 setState 방지 및 중복 호출 방지)
  const handleToggleProjectImageSelection = useCallback((imageId: string, image: any, type: 'character' | 'background' | 'settingCut') => {
    // 이미 처리 중인 요청인지 확인 (중복 호출 방지)
    const processingKey = `${imageId}-${type}`;
    if (processingImagesRef.current.has(processingKey)) {
      console.log('⚠️ 중복 호출 방지:', processingKey);
      return; // 이미 처리 중이면 무시
    }
    
    processingImagesRef.current.add(processingKey);
    const imageUrl = image.image || image.imageUrl || '';
    
    // 렌더링 완료 후 실행되도록 setTimeout 사용 (이중 보호)
    setTimeout(() => {
      startTransition(() => {
        setSelectedProjectImages(prev => {
          const newSet = new Set(prev);
          
          if (newSet.has(imageId)) {
            newSet.delete(imageId);
            // 체크박스 해제 시 이미지 URL 기준으로 제거
            switch (type) {
              case 'character':
                startTransition(() => {
                  setGeneratedCharacterImages(prev => prev.filter(img => {
                    const imgUrl = img.image?.trim() || '';
                    const targetUrl = imageUrl.trim();
                    return imgUrl !== targetUrl;
                  }));
                });
                break;
              case 'background':
                startTransition(() => {
                  setGeneratedVideoBackgrounds(prev => prev.filter(img => {
                    const imgUrl = img.image?.trim() || '';
                    const targetUrl = imageUrl.trim();
                    return imgUrl !== targetUrl;
                  }));
                });
                break;
              case 'settingCut':
                if (setGeneratedSettingCutImages) {
                  startTransition(() => {
                    setGeneratedSettingCutImages(prev => prev.filter(img => {
                      const imgUrl = img.image?.trim() || '';
                      const targetUrl = imageUrl.trim();
                      return imgUrl !== targetUrl;
                    }));
                  });
                }
                break;
            }
            // 처리 완료 후 제거
            setTimeout(() => {
              processingImagesRef.current.delete(processingKey);
            }, 100);
          } else {
            newSet.add(imageId);
            // 이미지 URL + 타입 + 타임스탬프 + 랜덤으로 고유한 ID 생성 (중복 방지)
            // 고유성 보장을 위해 타임스탬프 + 랜덤 + 타입 조합
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000000);
            const uniqueId = timestamp + random;
            
            // 체크박스 클릭 시 즉시 이미지 첨부 (이미지 URL 기준 중복 확인 강화)
            const newImage: GeneratedImage = {
              id: uniqueId,
              input: image.description || image.prompt || '프로젝트 참조에서 선택된 이미지',
              description: image.description || image.prompt || '프로젝트 참조에서 선택된 이미지',
              image: imageUrl,
              timestamp: new Date().toISOString(),
              source: 'project_reference'
            };

            switch (type) {
              case 'character':
                // 함수형 업데이트로 현재 상태를 안전하게 참조하며 중복 확인
                startTransition(() => {
                  setGeneratedCharacterImages(prev => {
                    const existingUrl = imageUrl.trim();
                    const isDuplicate = prev.some(existing => {
                      const existingImageUrl = existing.image?.trim() || '';
                      return existingImageUrl && existingImageUrl === existingUrl;
                    });
                    if (!isDuplicate) {
                      // 알림은 상태 업데이트 외부에서 호출
                      setTimeout(() => {
                        addNotification({
                          type: 'success',
                          title: '캐릭터 이미지 추가',
                          message: '프로젝트 참조에서 캐릭터 이미지를 선택했습니다.',
                        });
                      }, 0);
                      return [...prev, newImage];
                    }
                    return prev;
                  });
                });
                break;
              case 'background':
                startTransition(() => {
                  setGeneratedVideoBackgrounds(prev => {
                    const existingUrl = imageUrl.trim();
                    const isDuplicate = prev.some(existing => {
                      const existingImageUrl = existing.image?.trim() || '';
                      return existingImageUrl && existingImageUrl === existingUrl;
                    });
                    if (!isDuplicate) {
                      setTimeout(() => {
                        addNotification({
                          type: 'success',
                          title: '배경 이미지 추가',
                          message: '프로젝트 참조에서 배경 이미지를 선택했습니다.',
                        });
                      }, 0);
                      return [...prev, newImage];
                    }
                    return prev;
                  });
                });
                break;
              case 'settingCut':
                if (setGeneratedSettingCutImages) {
                  startTransition(() => {
                    setGeneratedSettingCutImages(prev => {
                      const existingUrl = imageUrl.trim();
                      const isDuplicate = prev.some(existing => {
                        const existingImageUrl = existing.image?.trim() || '';
                        return existingImageUrl && existingImageUrl === existingUrl;
                      });
                      if (!isDuplicate) {
                        setTimeout(() => {
                          addNotification({
                            type: 'success',
                            title: '설정 컷 이미지 추가',
                            message: '프로젝트 참조에서 설정 컷 이미지를 선택했습니다.',
                          });
                        }, 0);
                        return [...prev, newImage];
                      }
                      return prev;
                    });
                  });
                }
                break;
            }
            // 처리 완료 후 제거
            setTimeout(() => {
              processingImagesRef.current.delete(processingKey);
            }, 100);
          }
          return newSet;
        });
      });
    }, 0); // 즉시 실행하지만 이벤트 루프의 다음 틱에서 실행
  }, [setGeneratedSettingCutImages, addNotification, setGeneratedCharacterImages, setGeneratedVideoBackgrounds]);

  // 기존 handleProjectReferenceImageSelect는 호환성을 위해 유지 (이미지 클릭 시에도 작동)
  // 단, 체크박스와 중복 호출을 방지하기 위해 별도 처리
  const handleProjectReferenceImageSelect = useCallback((image: any, type: 'character' | 'background' | 'settingCut') => {
    // 이미지 클릭은 체크박스 토글만 수행 (이벤트 전파 방지)
    const imageId = generateImageId(image, type);
    handleToggleProjectImageSelection(imageId, image, type);
  }, [handleToggleProjectImageSelection]);

  // 캐릭터 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenCharacterPromptModal = () => {
    setPromptModalType('character');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 캐릭터 이미지 생성
  const handleGenerateCharacterImage = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 캐릭터 이미지를 생성해주세요:

스토리: ${story}
캐릭터 정보: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}

요구사항:
1. 캐릭터의 외모와 성격을 정확히 반영
2. 스토리의 분위기에 맞는 스타일
3. 영상 제작에 적합한 고품질 이미지
4. 다양한 각도와 표정 포함`;

    setIsGeneratingCharacterImage(true);
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateCharacterImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: `캐릭터 이미지 - ${characterList.map(c => c.name).join(', ')}`,
          source: 'generated'
        };

        setGeneratedCharacterImages(prev => [...prev, newImage]);
        
        addNotification({
          type: 'success',
          title: '캐릭터 이미지 생성 완료',
          message: '캐릭터 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('캐릭터 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingCharacterImage(false);
    }
  };

  // 설정 컷 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenSettingCutPromptModal = () => {
    setPromptModalType('settingCut');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 설정 컷 이미지 생성
  const handleGenerateSettingCutImage = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 설정 컷 이미지를 생성해주세요:

스토리: ${story}
캐릭터: ${characterList.map(c => `${c.name}: ${c.description}`).join(', ')}
시나리오: ${finalScenario}

요구사항:
1. 스토리의 핵심 설정과 분위기를 반영
2. 캐릭터들의 특징을 잘 드러내는 설정
3. 영상 제작에 적합한 구체적인 설정 컷
4. 고품질, 상세한 이미지`;

    setIsGeneratingSettingCutImage(true);

    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateSettingCutImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          description: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          source: 'ai_generated'
        };

        if (setGeneratedSettingCutImages) {
          setGeneratedSettingCutImages(prev => [...prev, newImage]);
        }

        addNotification({
          type: 'success',
          title: '설정 컷 이미지 생성 완료',
          message: '설정 컷 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('설정 컷 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '설정 컷 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingSettingCutImage(false);
    }
  };

  // 배경 이미지 생성 프롬프트 입력 모달 열기
  const handleOpenBackgroundPromptModal = () => {
    setPromptModalType('background');
    setCustomPrompt('');
    setShowPromptModal(true);
  };

  // 배경 이미지 생성
  const handleGenerateVideoBackground = async (prompt?: string) => {
    const finalPrompt = prompt || `다음 정보를 바탕으로 배경 이미지를 생성해주세요:

스토리: ${story}
시나리오: ${finalScenario}

요구사항:
1. 시나리오의 배경과 분위기를 정확히 반영
2. 영상 제작에 적합한 고품질 이미지
3. 다양한 장소와 시간대 포함
4. 캐릭터가 자연스럽게 배치될 수 있는 환경`;

    setIsGeneratingBackgroundImage(true);
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const result = await googleAIService.generateCharacterImage(finalPrompt);

      if (result) {
        const newImage: GeneratedImage = {
          id: Date.now(),
          input: finalPrompt,
          image: result,
          timestamp: new Date().toISOString(),
          description: '배경 이미지',
          source: 'generated'
        };

        setGeneratedVideoBackgrounds(prev => [...prev, newImage]);
        
        addNotification({
          type: 'success',
          title: '배경 이미지 생성 완료',
          message: '배경 이미지가 성공적으로 생성되었습니다.',
        });
      }
    } catch (error) {
      console.error('배경 이미지 생성 오류:', error);
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '배경 이미지 생성에 실패했습니다.',
      });
    } finally {
      setIsGeneratingBackgroundImage(false);
    }
  };

  // 파일에서 이미지 추가
  const handleAddCharacterImageFromFile = () => {
    fileInputRef.current?.click();
  };

  const handleAddBackgroundImageFromFile = () => {
    backgroundFileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'character' | 'background' | 'settingCut') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      const newImage: GeneratedImage = {
        id: Date.now(),
        input: `업로드된 ${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지`,
        image: imageData,
        timestamp: new Date().toISOString(),
        description: `업로드된 ${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지`,
        source: 'uploaded'
      };

      if (type === 'character') {
        setGeneratedCharacterImages(prev => [...prev, newImage]);
      } else if (type === 'background') {
        setGeneratedVideoBackgrounds(prev => [...prev, newImage]);
      } else if (type === 'settingCut' && setGeneratedSettingCutImages) {
        setGeneratedSettingCutImages(prev => [...prev, newImage]);
      }

      addNotification({
        type: 'success',
        title: '이미지 업로드 완료',
        message: `${type === 'character' ? '캐릭터' : type === 'background' ? '배경' : '설정 컷'} 이미지가 업로드되었습니다.`,
      });
    };
    reader.readAsDataURL(file);
  };

  // 이미지 선택 토글
  const handleToggleImageSelection = (imageId: number, type: 'character' | 'background' | 'settingCut') => {
    if (type === 'character') {
      setSelectedCharacterImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    } else if (type === 'background') {
      setSelectedVideoBackgrounds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    } else if (type === 'settingCut' && setSelectedSettingCutImages) {
      setSelectedSettingCutImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageId)) {
          newSet.delete(imageId);
        } else {
          newSet.add(imageId);
        }
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 캐릭터 이미지 생성 */}
      <div className="bg-purple-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-800">👤 캐릭터 이미지 생성</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenCharacterPromptModal}
              disabled={isGeneratingCharacterImage}
              className={`px-4 py-2 ${
                isGeneratingCharacterImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isGeneratingCharacterImage ? '생성 중...' : 'AI로 캐릭터 이미지 생성'}
            </Button>
            
            <Button
              onClick={handleAddCharacterImageFromFile}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              파일에서 추가
            </Button>

            <Button
              onClick={() => handleSelectFromProjectReference('character')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              📋 프로젝트 참조에서 선택
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'character')}
          className="hidden"
        />

        {/* 생성된 캐릭터 이미지 목록 */}
        {generatedCharacterImages.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-purple-800">
              생성된 캐릭터 이미지 ({generatedCharacterImages.length}개)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedCharacterImages.map((image, index) => {
                // 고유한 key 생성 (이미지 URL 해시 + 인덱스)
                const imageKey = image.image ? 
                  `character-${generateImageId({ image: image.image }, 'char')}-${index}` : 
                  `character-${image.id}-${index}`;
                return (
                <div key={imageKey} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedCharacterImages.has(image.id)}
                      onChange={() => handleToggleImageSelection(image.id, 'character')}
                      className="rounded"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '캐릭터 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'character')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-24 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('character')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 배경 이미지 생성 */}
      <div className="bg-orange-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-orange-800">🏞️ 배경 이미지 생성</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenBackgroundPromptModal}
              disabled={isGeneratingBackgroundImage}
              className={`px-4 py-2 ${
                isGeneratingBackgroundImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isGeneratingBackgroundImage ? '생성 중...' : 'AI로 배경 이미지 생성'}
            </Button>
            
            <Button
              onClick={handleAddBackgroundImageFromFile}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              파일에서 추가
            </Button>

            <Button
              onClick={() => handleSelectFromProjectReference('background')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              📋 프로젝트 참조에서 선택
            </Button>
          </div>
        </div>

        <input
          ref={backgroundFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'background')}
          className="hidden"
        />

        {/* 생성된 배경 이미지 목록 */}
        {generatedVideoBackgrounds.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-orange-800">
              생성된 배경 이미지 ({generatedVideoBackgrounds.length}개)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedVideoBackgrounds.map((image, index) => {
                // 고유한 key 생성 (이미지 URL 해시 + 인덱스)
                const imageKey = image.image ? 
                  `background-${generateImageId({ image: image.image }, 'bg')}-${index}` : 
                  `background-${image.id}-${index}`;
                return (
                <div key={imageKey} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedVideoBackgrounds.has(image.id)}
                      onChange={() => handleToggleImageSelection(image.id, 'background')}
                      className="rounded"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '배경 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'background')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-24 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('background')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 설정 컷 이미지 생성 */}
      <div className="bg-green-50 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-800">🎬 설정 컷 이미지 생성</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenSettingCutPromptModal}
              disabled={isGeneratingSettingCutImage}
              className={`px-4 py-2 ${
                isGeneratingSettingCutImage
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isGeneratingSettingCutImage ? '생성 중...' : 'AI로 설정 컷 이미지 생성'}
            </Button>

            <Button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    handleFileUpload({ target: { files: [file] } } as any, 'settingCut');
                  }
                };
                input.click();
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white"
            >
              파일에서 추가
            </Button>

            <Button
              onClick={() => handleSelectFromProjectReference('settingCut')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              📋 프로젝트 참조에서 선택
            </Button>
          </div>
        </div>

        {/* 설정 컷 이미지 목록 */}
        {generatedSettingCutImages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-green-700 mb-2">생성된 설정 컷 이미지</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generatedSettingCutImages.map((image, index) => (
                <div key={`settingCut-${image.image || image.id}-${index}`} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="checkbox"
                      checked={selectedSettingCutImages?.has(image.id) || false}
                      onChange={() => handleToggleImageSelection(image.id, 'settingCut')}
                      className="rounded"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadImage(image.image, image.description || '설정 컷 이미지')}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(image.id, image.description || '')}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="편집"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id, 'settingCut')}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <img
                    src={image.image}
                    alt={image.description}
                    className="w-full h-24 object-cover rounded"
                  />
                  {editingImageId === image.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                      />
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => handleSaveEdit('settingCut')}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 프로젝트 참조 모달 */}
      {showProjectReferenceModal && referenceModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                프로젝트 참조에서 이미지 선택
              </h2>
              <button
                onClick={() => setShowProjectReferenceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 프로젝트 참조 데이터에서 이미지 표시 */}
              <div className="space-y-4">
                {projectReferenceData ? (
                  <>
                    {/* 캐릭터 이미지 */}
                    {projectReferenceData.characters && projectReferenceData.characters.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">캐릭터 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {projectReferenceData.characters.map((image: ProjectReferenceImage, index: number) => {
                            const imageId = generateImageId(image, 'character');
                            const isSelected = selectedProjectImages.has(imageId);
                            return (
                            <div key={imageId} className="bg-gray-50 p-3 rounded border hover:bg-gray-100">
                              <div className="relative">
                                <img
                                  src={image.image}
                                  alt={image.description || image.prompt}
                                  className="w-full h-32 object-cover rounded cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 이미지 클릭 시에도 체크박스 토글 (중복 방지 로직 내장)
                                    handleProjectReferenceImageSelect(image, 'character');
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '캐릭터 이미지');
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70 transition-colors"
                                  title="다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-2">{image.description || image.prompt}</p>
                              {/* 캐릭터 이미지에도 체크박스 추가 */}
                              <div className="mt-2 flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleProjectImageSelection(imageId, image, 'character');
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                <span className="ml-2 text-xs text-gray-600">선택</span>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 배경 이미지 */}
                    {projectReferenceData.backgrounds && projectReferenceData.backgrounds.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">배경 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {projectReferenceData.backgrounds.map((image: ProjectReferenceImage, index: number) => {
                            const imageId = generateImageId(image, 'background');
                            const isSelected = selectedProjectImages.has(imageId);
                            return (
                              <div key={imageId} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={image.image}
                                    alt={image.description || image.prompt}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="mt-2 text-sm">
                                  <div className="font-medium truncate">{image.description || image.prompt}</div>
                                </div>
                                <div className="absolute top-1 left-1 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleProjectImageSelection(imageId, image, 'background');
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '배경 이미지');
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="이미지 다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 설정 컷 이미지 */}
                    {projectReferenceData.settingCuts && projectReferenceData.settingCuts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">설정 컷 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {projectReferenceData.settingCuts.map((image: ProjectReferenceImage, index: number) => {
                            const imageId = generateImageId(image, 'settingCut');
                            const isSelected = selectedProjectImages.has(imageId);
                            return (
                              <div key={imageId} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={image.image}
                                    alt={image.description || image.prompt}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="mt-2 text-sm">
                                  <div className="font-medium truncate">{image.description || image.prompt}</div>
                                </div>
                                <div className="absolute top-1 left-1 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleProjectImageSelection(imageId, image, 'settingCut');
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '설정 컷 이미지');
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="이미지 다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 고급 이미지 */}
                    {projectReferenceData.advanced && projectReferenceData.advanced.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">고급 이미지</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {projectReferenceData.advanced.map((image: ProjectReferenceImage, index: number) => {
                            const imageId = generateImageId(image, 'advanced');
                            const isSelected = selectedProjectImages.has(imageId);
                            return (
                              <div key={imageId} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={image.image}
                                    alt={image.description || image.prompt}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="mt-2 text-sm">
                                  <div className="font-medium truncate">{image.description || image.prompt}</div>
                                  {image.timestamp && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(image.timestamp).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="absolute top-1 left-1 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleProjectImageSelection(imageId, image, referenceModalType || 'character');
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadImage(image.image, image.description || image.prompt || '고급 이미지');
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="이미지 다운로드"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 전체 이미지가 없는 경우 */}
                    {(!projectReferenceData.characters || projectReferenceData.characters.length === 0) && 
                     (!projectReferenceData.backgrounds || projectReferenceData.backgrounds.length === 0) && 
                     (!projectReferenceData.settingCuts || projectReferenceData.settingCuts.length === 0) &&
                     (!projectReferenceData.advanced || projectReferenceData.advanced.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        프로젝트 참조에 저장된 이미지가 없습니다.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    프로젝트 참조 데이터를 로드하는 중...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 입력 모달 */}
      {showPromptModal && promptModalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">
                {promptModalType === 'character' ? '캐릭터' : promptModalType === 'background' ? '배경' : '설정 컷'} 이미지 생성 프롬프트
              </h2>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    프롬프트 입력
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${promptModalType === 'character' ? '캐릭터' : promptModalType === 'background' ? '배경' : '설정 컷'} 이미지 생성을 위한 프롬프트를 입력하세요...`}
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 프롬프트 작성 팁</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 구체적인 외모, 의상, 표정을 명시하세요</li>
                    <li>• 색상, 스타일, 분위기를 표현하세요</li>
                    <li>• 카메라 앵글과 구도를 지정하세요</li>
                    <li>• 배경과 조명을 설명하세요</li>
                    <li>• 영상 제작에 적합한 고품질 이미지로 요청하세요</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmPromptAndGenerate}
                disabled={!customPrompt.trim()}
                className={`px-4 py-2 rounded ${
                  !customPrompt.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
