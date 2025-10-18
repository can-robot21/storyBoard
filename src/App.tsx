import React, { useState } from 'react';
import { useUIStore } from './stores/uiStore';
import Button from './components/common/Button';
import ProgressTracker from './components/common/ProgressTracker';

const mainSteps = [
  "프로젝트 개요",
  "캐릭터 설정", 
  "영상 생성",
];

const progressSteps = [
  {
    id: 'overview',
    title: '프로젝트 개요',
    description: 'AI 텍스트 생성',
    status: 'completed' as const,
  },
  {
    id: 'character',
    title: '캐릭터 설정',
    description: 'AI 이미지 생성',
    status: 'current' as const,
  },
  {
    id: 'video',
    title: '영상 생성',
    description: '컷별 이미지 생성',
    status: 'pending' as const,
  },
];

export default function App() {
  const { addNotification } = useUIStore();
  const [currentStep, setCurrentStep] = useState("프로젝트 개요");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 프로젝트 개요 상태
  const [story, setStory] = useState("");
  const [character, setCharacter] = useState("");
  const [storyText, setStoryText] = useState("");
  
  // 생성된 프롬프트들
  const [storyPrompt, setStoryPrompt] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [scenarioPrompt, setScenarioPrompt] = useState("");
  
  // 저장 상태
  const [isSaved, setIsSaved] = useState(false);
  
  
  // 캐릭터 설정 상태
  const [characterInput, setCharacterInput] = useState("");
  const [backgroundInput, setBackgroundInput] = useState("");
  const [settingCut, setSettingCut] = useState("");
  const [generatedCharacters, setGeneratedCharacters] = useState<any[]>([]);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<any[]>([]);
  const [generatedSettingCuts, setGeneratedSettingCuts] = useState<any[]>([]);
  
  // 첨부된 이미지들 (캐릭터 설정용)
  const [attachedCharacterImages, setAttachedCharacterImages] = useState<File[]>([]);
  const [attachedBackgroundImages, setAttachedBackgroundImages] = useState<File[]>([]);
  const [attachedSettingImages, setAttachedSettingImages] = useState<File[]>([]);
  
  // 영상 생성 상태
  const [cutCount, setCutCount] = useState(3);
  const [videoRatio, setVideoRatio] = useState("16:9");
  const [textScenario, setTextScenario] = useState("");
  const [characterOutfit, setCharacterOutfit] = useState("");
  const [additionalElements, setAdditionalElements] = useState("");
  const [generatedCuts, setGeneratedCuts] = useState<any[]>([]);
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  
  // 영상 생성용 첨부 이미지들
  const [attachedCharacterOutfitImages, setAttachedCharacterOutfitImages] = useState<File[]>([]);
  const [attachedAdditionalImages, setAttachedAdditionalImages] = useState<File[]>([]);
  
  // 프로젝트 저장 상태
  const [isProjectSaved, setIsProjectSaved] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const handleRun = () => {
    addNotification({
      type: 'success',
      title: '실행 완료',
      message: `${currentStep}이 성공적으로 실행되었습니다.`,
    });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    addNotification({
      type: 'success',
      title: '로그인 완료',
      message: '성공적으로 로그인되었습니다.',
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    addNotification({
      type: 'info',
      title: '로그아웃',
      message: '로그아웃되었습니다.',
    });
  };

  // 스토리 프롬프트 생성
  const handleGenerateStoryPrompt = () => {
    if (!story.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리를 입력해주세요.',
      });
      return;
    }
    
    const prompt = `스토리 프롬프트:
주요 스토리: ${story}

이 요소를 바탕으로 매력적인 스토리를 생성해주세요.`;
    
    setStoryPrompt(prompt);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '스토리 프롬프트가 생성되었습니다.',
    });
  };

  // 캐릭터 프롬프트 생성
  const handleGenerateCharacterPrompt = () => {
    if (!character.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력해주세요.',
      });
      return;
    }
    
    const prompt = `캐릭터 설정 프롬프트:
캐릭터 설명: ${character}

이 설정을 바탕으로 일관성 있는 캐릭터를 생성해주세요.`;
    
    setCharacterPrompt(prompt);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '캐릭터 설정 프롬프트가 생성되었습니다.',
    });
  };

  // 시나리오 프롬프트 생성
  const handleGenerateScenarioPrompt = () => {
    if (!story.trim() || !character.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터를 먼저 입력해주세요.',
      });
      return;
    }
    
    const prompt = `시나리오 프롬프트:
스토리: ${story}
캐릭터: ${character}

이 설정을 바탕으로 상세한 시나리오를 생성해주세요.`;
    
    setScenarioPrompt(prompt);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '시나리오 프롬프트가 생성되었습니다.',
    });
  };

  // 시나리오 저장
  const handleSaveScenario = () => {
    if (!storyPrompt || !characterPrompt || !scenarioPrompt) {
      addNotification({
        type: 'error',
        title: '저장 오류',
        message: '모든 프롬프트를 먼저 생성해주세요.',
      });
      return;
    }
    
    setIsSaved(true);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '시나리오가 성공적으로 저장되었습니다.',
    });
  };


  // 이미지 첨부 핸들러
  const handleImageAttach = (type: 'character' | 'background' | 'setting' | 'characterOutfit' | 'additional', files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    switch (type) {
      case 'character':
        setAttachedCharacterImages(prev => [...prev, ...fileArray]);
        break;
      case 'background':
        setAttachedBackgroundImages(prev => [...prev, ...fileArray]);
        break;
      case 'setting':
        setAttachedSettingImages(prev => [...prev, ...fileArray]);
        break;
      case 'characterOutfit':
        setAttachedCharacterOutfitImages(prev => [...prev, ...fileArray]);
        break;
      case 'additional':
        setAttachedAdditionalImages(prev => [...prev, ...fileArray]);
        break;
    }
    
    addNotification({
      type: 'success',
      title: '첨부 완료',
      message: `${fileArray.length}개의 이미지가 첨부되었습니다.`,
    });
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (type: 'character' | 'background' | 'setting' | 'characterOutfit' | 'additional', index: number) => {
    switch (type) {
      case 'character':
        setAttachedCharacterImages(prev => prev.filter((_, i) => i !== index));
        break;
      case 'background':
        setAttachedBackgroundImages(prev => prev.filter((_, i) => i !== index));
        break;
      case 'setting':
        setAttachedSettingImages(prev => prev.filter((_, i) => i !== index));
        break;
      case 'characterOutfit':
        setAttachedCharacterOutfitImages(prev => prev.filter((_, i) => i !== index));
        break;
      case 'additional':
        setAttachedAdditionalImages(prev => prev.filter((_, i) => i !== index));
        break;
    }
    
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '이미지가 삭제되었습니다.',
    });
  };

  // 캐릭터 AI 이미지 생성
  const handleGenerateCharacter = () => {
    if (!characterInput.trim() && attachedCharacterImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    const newCharacter = {
      id: Date.now(),
      description: characterInput,
      image: `캐릭터 이미지 ${generatedCharacters.length + 1}`,
      attachedImages: attachedCharacterImages,
      timestamp: new Date().toISOString()
    };
    
    setGeneratedCharacters(prev => [...prev, newCharacter]);
    setCharacterInput("");
    setAttachedCharacterImages([]);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '캐릭터 이미지가 생성되었습니다.',
    });
  };

  // 배경 AI 이미지 생성
  const handleGenerateBackground = () => {
    if (!backgroundInput.trim() && attachedBackgroundImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '배경 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    const newBackground = {
      id: Date.now(),
      description: backgroundInput,
      image: `배경 이미지 ${generatedBackgrounds.length + 1}`,
      attachedImages: attachedBackgroundImages,
      timestamp: new Date().toISOString()
    };
    
    setGeneratedBackgrounds(prev => [...prev, newBackground]);
    setBackgroundInput("");
    setAttachedBackgroundImages([]);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '배경 이미지가 생성되었습니다.',
    });
  };

  // 설정 컷 생성
  const handleGenerateSettingCut = () => {
    if (!settingCut.trim() && attachedSettingImages.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '설정 컷 설명을 입력하거나 이미지를 첨부해주세요.',
      });
      return;
    }
    
    const newSettingCut = {
      id: Date.now(),
      description: settingCut,
      image: `설정 컷 ${generatedSettingCuts.length + 1}`,
      attachedImages: attachedSettingImages,
      timestamp: new Date().toISOString()
    };
    
    setGeneratedSettingCuts(prev => [...prev, newSettingCut]);
    setSettingCut("");
    setAttachedSettingImages([]);
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: '설정 컷이 생성되었습니다.',
    });
  };

  // 컷별 영상 생성
  const handleGenerateCut = () => {
    if (!textScenario.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '텍스트 시나리오를 입력해주세요.',
      });
      return;
    }
    
    const newCut = {
      id: Date.now(),
      cutNumber: currentCutIndex + 1,
      textScenario: textScenario,
      characterOutfit: characterOutfit,
      additionalElements: additionalElements,
      attachedCharacterOutfitImages: attachedCharacterOutfitImages,
      attachedAdditionalImages: attachedAdditionalImages,
      video: `컷 ${currentCutIndex + 1} 영상`,
      videoRatio: videoRatio,
      timestamp: new Date().toISOString()
    };
    
    setGeneratedCuts(prev => {
      const updatedCuts = [...prev, newCut];
      // 컷 번호별로 정렬
      return updatedCuts.sort((a, b) => a.cutNumber - b.cutNumber);
    });
    setCurrentCutIndex(prev => prev + 1);
    setTextScenario("");
    setCharacterOutfit("");
    setAdditionalElements("");
    setAttachedCharacterOutfitImages([]);
    setAttachedAdditionalImages([]);
    
    addNotification({
      type: 'success',
      title: '생성 완료',
      message: `컷 ${currentCutIndex + 1} 영상이 생성되었습니다.`,
    });
  };


  // 이전 컷으로 이동
  const handlePreviousCut = () => {
    if (currentCutIndex > 0) {
      setCurrentCutIndex(prev => prev - 1);
    }
  };

  // 다음 컷으로 이동
  const handleNextCutNavigation = () => {
    if (currentCutIndex < cutCount - 1) {
      setCurrentCutIndex(prev => prev + 1);
    } else {
      addNotification({
        type: 'info',
        title: '완료',
        message: '마지막 컷입니다.',
      });
    }
  };

  // 프로젝트 영상 저장
  const handleSaveProject = () => {
    if (generatedCuts.length === 0) {
      addNotification({
        type: 'error',
        title: '저장 오류',
        message: '생성된 영상이 없습니다.',
      });
      return;
    }
    
    setIsProjectSaved(true);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 영상이 저장되었습니다.',
    });
  };

  const handleDeleteCut = (cutId: number) => {
    setGeneratedCuts(prev => {
      const filteredCuts = prev.filter(cut => cut.id !== cutId);
      // 삭제 후 컷 번호 재정렬
      return filteredCuts.map((cut, index) => ({
        ...cut,
        cutNumber: index + 1
      }));
    });
    addNotification({
      type: 'info',
      title: '삭제 완료',
      message: '컷이 삭제되었습니다.',
    });
  };

  // 페이지네이션 함수들
  const getTotalPages = () => Math.ceil(generatedCuts.length / itemsPerPage);
  
  const getCurrentPageCuts = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return generatedCuts.slice(startIndex, endIndex);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 다운로드 핸들러
  const handleDownload = (type: 'character' | 'background' | 'setting' | 'cut', id: number, name: string) => {
    // 실제 구현에서는 서버에서 파일을 다운로드하거나 생성된 이미지를 다운로드
    const element = document.createElement('a');
    const file = new Blob([`${name} 다운로드 내용`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${name}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    addNotification({
      type: 'success',
      title: '다운로드 완료',
      message: `${name}이 다운로드되었습니다.`,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 상단 헤더 */}
      <header className="w-full bg-white shadow-md px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🎬 AI 영상 프로젝트</h1>

        <nav className="flex gap-2">
          {mainSteps.map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                currentStep === step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {step}
            </button>
          ))}
        </nav>

        <div className="flex gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="outline" size="sm" onClick={handleLogout}>로그아웃</Button>
              <Button variant="outline" size="sm">설정</Button>
              <Button variant="outline" size="sm">저장</Button>
              <Button size="sm">내보내기</Button>
            </>
          ) : (
            <Button size="sm" onClick={handleLogin}>로그인</Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 - 입력 및 제어 */}
        <aside className="w-80 bg-white border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">{currentStep}</h2>
          
          {currentStep === "프로젝트 개요" && (
            <div className="space-y-6">
              {/* 스토리 입력 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">1. 스토리 기본 설정</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">스토리</label>
                  <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="스토리 개요를 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button className="w-full" onClick={handleGenerateStoryPrompt}>
                  AI 생성
                </Button>
              </div>

              {/* 캐릭터 입력 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">2. 캐릭터 설정</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">캐릭터</label>
                  <textarea
                    value={character}
                    onChange={(e) => setCharacter(e.target.value)}
                    placeholder="주요 캐릭터를 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button className="w-full" onClick={handleGenerateCharacterPrompt}>
                  AI 생성
                </Button>
              </div>

              {/* 시나리오 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">3. 시나리오 생성</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">스토리 텍스트</label>
                  <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="상세 스토리 텍스트를 입력하세요"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button className="w-full" onClick={handleGenerateScenarioPrompt}>
                  시나리오 AI 생성
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === "캐릭터 설정" && (
            <div className="space-y-6">
              {/* 캐릭터 생성 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">캐릭터 생성</h3>
                <textarea
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="캐릭터 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageAttach('character', e.target.files)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  {/* 첨부된 이미지 목록 */}
                  {attachedCharacterImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachedCharacterImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => handleImageRemove('character', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button className="w-full" onClick={handleGenerateCharacter}>
                  캐릭터 생성
                </Button>
              </div>
              
              {/* 배경 설정 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">배경 설정</h3>
                <textarea
                  value={backgroundInput}
                  onChange={(e) => setBackgroundInput(e.target.value)}
                  placeholder="배경 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageAttach('background', e.target.files)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  {/* 첨부된 이미지 목록 */}
                  {attachedBackgroundImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachedBackgroundImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => handleImageRemove('background', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button className="w-full" onClick={handleGenerateBackground}>
                  배경 생성
                </Button>
              </div>
              
              {/* 설정 컷 */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">설정 컷</h3>
                <textarea
                  value={settingCut}
                  onChange={(e) => setSettingCut(e.target.value)}
                  placeholder="설정 컷 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageAttach('setting', e.target.files)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  {/* 첨부된 이미지 목록 */}
                  {attachedSettingImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachedSettingImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => handleImageRemove('setting', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button className="w-full" onClick={handleGenerateSettingCut}>
                  설정 컷 생성
                </Button>
              </div>
            </div>
          )}
          
          {currentStep === "영상 생성" && (
            <div className="space-y-4">
              {/* 컷 수 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">컷 수 설정</label>
                <select
                  value={cutCount}
                  onChange={(e) => setCutCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1컷</option>
                  <option value={2}>2컷</option>
                  <option value={3}>3컷</option>
                  <option value={4}>4컷</option>
                  <option value={5}>5컷</option>
                  <option value={6}>6컷</option>
                  <option value={7}>7컷</option>
                  <option value={8}>8컷</option>
                  <option value={9}>9컷</option>
                  <option value={10}>10컷</option>
                </select>
              </div>
              
              {/* 영상 비율 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">영상 비율</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setVideoRatio("16:9")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "16:9"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    16:9
                  </button>
                  <button
                    onClick={() => setVideoRatio("1:1")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "1:1"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setVideoRatio("9:16")}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      videoRatio === "9:16"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    9:16
                  </button>
                </div>
              </div>
              
              {/* 현재 컷 정보 */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">현재 컷: {currentCutIndex + 1} / {cutCount}</p>
              </div>
              
              {/* 텍스트 + 시나리오 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">텍스트 + 시나리오</label>
                <textarea
                  value={textScenario}
                  onChange={(e) => setTextScenario(e.target.value)}
                  placeholder="현재 컷의 텍스트와 시나리오를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* 캐릭터 + 의상 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">캐릭터 + 의상</label>
                <textarea
                  value={characterOutfit}
                  onChange={(e) => setCharacterOutfit(e.target.value)}
                  placeholder="캐릭터와 의상을 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageAttach('characterOutfit', e.target.files)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  {/* 첨부된 이미지 목록 */}
                  {attachedCharacterOutfitImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachedCharacterOutfitImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => handleImageRemove('characterOutfit', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 추가 요소 */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">추가 (구도, 소품 등)</label>
                <textarea
                  value={additionalElements}
                  onChange={(e) => setAdditionalElements(e.target.value)}
                  placeholder="구도, 소품 등 추가 요소를 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 이미지 첨부 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지 첨부</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageAttach('additional', e.target.files)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  
                  {/* 첨부된 이미지 목록 */}
                  {attachedAdditionalImages.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {attachedAdditionalImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => handleImageRemove('additional', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button className="w-full" onClick={handleGenerateCut}>
                  생성
                </Button>
                <Button variant="outline" className="w-full" onClick={handleRun}>
                  재생성
                </Button>
              </div>
              
              {/* 네비게이션 버튼 */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handlePreviousCut}
                  disabled={currentCutIndex === 0}
                >
                  이전
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleNextCutNavigation}
                  disabled={currentCutIndex >= cutCount - 1}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* 메인 Canvas - 결과 표시 */}
        <main className="flex-1 p-6 overflow-y-auto bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">생성 결과</h2>
            
            {currentStep === "프로젝트 개요" && (
              <div className="space-y-6">
                {/* 스토리 프롬프트 */}
                {storyPrompt && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">스토리 프롬프트 (스토리 생성용)</h3>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{storyPrompt}</pre>
                    </div>
                  </div>
                )}

                {/* 캐릭터 설정 프롬프트 */}
                {characterPrompt && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">캐릭터 설정 프롬프트</h3>
                    <div className="bg-green-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{characterPrompt}</pre>
                    </div>
                  </div>
                )}

                {/* 시나리오 프롬프트 */}
                {scenarioPrompt && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium mb-4">시나리오 항목</h3>
                    <div className="bg-purple-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">{scenarioPrompt}</pre>
                    </div>
                  </div>
                )}

                {/* 저장 버튼 */}
                {storyPrompt && characterPrompt && scenarioPrompt && (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium mb-2">시나리오 저장</h3>
                        <p className="text-sm text-gray-600">모든 프롬프트가 생성되었습니다. 저장하시겠습니까?</p>
                      </div>
                      <Button 
                        onClick={handleSaveScenario}
                        disabled={isSaved}
                        className={isSaved ? "bg-gray-400" : ""}
                      >
                        {isSaved ? "저장 완료" : "시나리오 저장"}
                      </Button>
                    </div>
                    {isSaved && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-800">✅ 해당 내용이 저장되었습니다.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 안내 메시지 */}
                {!storyPrompt && !characterPrompt && !scenarioPrompt && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>좌측의 AI 생성 버튼들을 클릭하여 프롬프트를 생성하세요.</p>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === "캐릭터 설정" && (
              <div className="space-y-6">
                {/* 생성된 캐릭터들 */}
                {generatedCharacters.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 캐릭터들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedCharacters.map((char) => (
                        <div key={char.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400">{char.image}</span>
                          </div>
                          <h4 className="font-medium mb-2">캐릭터 {char.id}</h4>
                          <p className="text-sm text-gray-600 mb-2">{char.description}</p>
                          <div className="flex justify-between items-center">
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload('character', char.id, `캐릭터_${char.id}`)}
                            >
                              다운로드
                            </Button>
                            <button className="text-red-500 text-xs">삭제</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 생성된 배경들 */}
                {generatedBackgrounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 배경들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedBackgrounds.map((bg) => (
                        <div key={bg.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400">{bg.image}</span>
                          </div>
                          <h4 className="font-medium mb-2">배경 {bg.id}</h4>
                          <p className="text-sm text-gray-600 mb-2">{bg.description}</p>
                          <div className="flex justify-between items-center">
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload('background', bg.id, `배경_${bg.id}`)}
                            >
                              다운로드
                            </Button>
                            <button className="text-red-500 text-xs">삭제</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 생성된 설정 컷들 */}
                {generatedSettingCuts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">생성된 설정 컷들</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {generatedSettingCuts.map((cut) => (
                        <div key={cut.id} className="bg-white rounded-lg border p-4">
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                            <span className="text-gray-400">{cut.image}</span>
                          </div>
                          <h4 className="font-medium mb-2">설정 컷 {cut.id}</h4>
                          <p className="text-sm text-gray-600 mb-2">{cut.description}</p>
                          <div className="flex justify-between items-center">
                            <Button 
                              size="sm" 
                              onClick={() => handleDownload('setting', cut.id, `설정컷_${cut.id}`)}
                            >
                              다운로드
                            </Button>
                            <button className="text-red-500 text-xs">삭제</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 다음 버튼 */}
                {(generatedCharacters.length > 0 || generatedBackgrounds.length > 0 || generatedSettingCuts.length > 0) && (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium mb-2">캐릭터 설정 완료</h3>
                        <p className="text-sm text-gray-600">
                          생성된 항목: 캐릭터 {generatedCharacters.length}개, 
                          배경 {generatedBackgrounds.length}개, 
                          설정컷 {generatedSettingCuts.length}개
                        </p>
                      </div>
                      <Button 
                        onClick={() => setCurrentStep("영상 생성")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}

                {/* 안내 메시지 */}
                {generatedCharacters.length === 0 && generatedBackgrounds.length === 0 && generatedSettingCuts.length === 0 && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>좌측의 생성 버튼들을 클릭하여 캐릭터, 배경, 설정컷을 생성하세요.</p>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === "영상 생성" && (
              <div className="space-y-6">
                {/* 컷별 영상 */}
                {generatedCuts.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">컷별 영상 ({generatedCuts.length}/{cutCount})</h3>
                      <div className="text-sm text-gray-500">
                        페이지 {currentPage} / {getTotalPages()}
                      </div>
                    </div>
                    
                    {/* 3x3 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {getCurrentPageCuts().map((cut) => (
                        <div key={cut.id} className="bg-white rounded-lg border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-lg">컷 {cut.cutNumber}</h5>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleDownload('cut', cut.id, `컷_${cut.cutNumber}_영상`)}
                              >
                                다운로드
                              </Button>
                              <button 
                                className="text-red-500 text-sm px-2 py-1 hover:bg-red-50 rounded"
                                onClick={() => handleDeleteCut(cut.id)}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          
                          <div className={`bg-gray-100 rounded-lg mb-4 flex items-center justify-center ${
                            cut.videoRatio === "16:9" ? "aspect-video" : 
                            cut.videoRatio === "1:1" ? "aspect-square" : 
                            "aspect-[9/16]"
                          }`}>
                            <span className="text-gray-400">{cut.video}</span>
                          </div>
                          
                        </div>
                      ))}
                    </div>
                    
                    {/* 페이지네이션 */}
                    {getTotalPages() > 1 && (
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          이전
                        </Button>
                        
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === getTotalPages()}
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 프로젝트 영상 저장 */}
                {generatedCuts.length > 0 && (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium mb-2">프로젝트 영상 저장</h3>
                        <p className="text-sm text-gray-600">
                          총 {generatedCuts.length}개의 컷이 생성되었습니다. 프로젝트를 저장하시겠습니까?
                        </p>
                      </div>
                      <Button 
                        onClick={handleSaveProject}
                        disabled={isProjectSaved}
                        className={isProjectSaved ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}
                      >
                        {isProjectSaved ? "저장 완료" : "프로젝트 영상 저장"}
                      </Button>
                    </div>
                    {isProjectSaved && (
                      <div className="mt-4 p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-800">✅ 프로젝트 영상이 저장되었습니다.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {generatedCuts.length === 0 && (
                  <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
                    <p>생성 버튼을 클릭하여 컷별 영상을 생성하세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 하단 진행률 추적기 */}
      <ProgressTracker 
        steps={progressSteps}
        currentStep={currentStep}
        onStepClick={(stepId) => {
          const stepMap: { [key: string]: string } = {
            'overview': '프로젝트 개요',
            'character': '캐릭터 설정',
            'video': '영상 생성'
          };
          setCurrentStep(stepMap[stepId] || '프로젝트 개요');
        }}
      />
    </div>
  );
}