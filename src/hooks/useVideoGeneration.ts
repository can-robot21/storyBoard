import { useState, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { Episode, ErrorModalState, ConfirmModalState } from '../types/videoGeneration';

export const useVideoGeneration = () => {
  const { addNotification } = useUIStore();
  
  // 공통 입력 항목 표시 상태
  const [showCommonInputs, setShowCommonInputs] = useState(false);
  const [commonInputsCompleted, setCommonInputsCompleted] = useState(false);
  
  // 에피소드별 구조 관리
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showEpisodeStructure, setShowEpisodeStructure] = useState(false);

  // 헤딩 입력창 상태 변수들
  const [showHeadingInput, setShowHeadingInput] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoNotes, setVideoNotes] = useState('');

  // 에러 모달 상태
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    error: '',
    hasImages: false,
    currentPrompt: '',
    currentVideoRatio: '16:9',
    currentReferenceImages: []
  });

  // 프롬프트 확인 모달 상태
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    prompt: '',
    videoRatio: '16:9',
    referenceImages: [],
    onConfirm: () => {}
  });

  // 공통 입력 완료 처리
  const handleCommonInputsComplete = (story: string, characterList: any[]) => {
    if (!story || characterList.length === 0) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 입력해주세요.',
      });
      return;
    }

    setCommonInputsCompleted(true);
    setShowCommonInputs(false);
    
    addNotification({
      type: 'success',
      title: '공통 입력 완료',
      message: '기본 정보가 성공적으로 입력되었습니다.',
    });
  };

  // 공통 입력 초기화
  const handleCommonInputsReset = () => {
    setCommonInputsCompleted(false);
    
    addNotification({
      type: 'info',
      title: '초기화 완료',
      message: '공통 입력 항목이 초기화되었습니다.',
    });
  };

  // 헤딩 정보 저장
  const handleSaveHeadingInfo = () => {
    if (!videoTitle.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '영상 제목을 입력해주세요.',
      });
      return;
    }

    setShowHeadingInput(false);
    
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '헤딩 정보가 저장되었습니다.',
    });
  };

  // 데이터 저장/로드
  const handleExportData = () => {
    const data = {
      episodes,
      videoTitle,
      videoDescription,
      videoNotes,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-generation-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: '내보내기 완료',
      message: '데이터가 성공적으로 내보내졌습니다.',
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.episodes) setEpisodes(data.episodes);
        if (data.videoTitle) setVideoTitle(data.videoTitle);
        if (data.videoDescription) setVideoDescription(data.videoDescription);
        if (data.videoNotes) setVideoNotes(data.videoNotes);
        
        addNotification({
          type: 'success',
          title: '가져오기 완료',
          message: '데이터가 성공적으로 가져와졌습니다.',
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: '가져오기 실패',
          message: '파일 형식이 올바르지 않습니다.',
        });
      }
    };
    reader.readAsText(file);
  };

  // 모든 데이터 초기화
  const handleClearAllData = () => {
    if (window.confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setEpisodes([]);
      setVideoTitle('');
      setVideoDescription('');
      setVideoNotes('');
      setShowHeadingInput(false);
      setShowEpisodeStructure(false);
      setCommonInputsCompleted(false);
      setShowCommonInputs(false);
      
      addNotification({
        type: 'info',
        title: '초기화 완료',
        message: '모든 데이터가 초기화되었습니다.',
      });
    }
  };

  return {
    // 상태
    showCommonInputs,
    setShowCommonInputs,
    commonInputsCompleted,
    setCommonInputsCompleted,
    episodes,
    setEpisodes,
    showEpisodeStructure,
    setShowEpisodeStructure,
    showHeadingInput,
    setShowHeadingInput,
    videoTitle,
    setVideoTitle,
    videoDescription,
    setVideoDescription,
    videoNotes,
    setVideoNotes,
    errorModal,
    setErrorModal,
    confirmModal,
    setConfirmModal,

    // 함수
    handleCommonInputsComplete,
    handleCommonInputsReset,
    handleSaveHeadingInfo,
    handleExportData,
    handleImportData,
    handleClearAllData
  };
};
