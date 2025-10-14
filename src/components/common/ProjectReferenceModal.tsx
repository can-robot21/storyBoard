import React, { useState, useEffect } from 'react';
import { X, FileText, Image, Video, User, Settings, ChevronDown, ChevronUp, Globe, Flag, Download, Copy, Trash2, Plus, HardDrive, RotateCcw } from 'lucide-react';
import { FormattedJSON } from './FormattedText';
import { downloadBase64Image, downloadVideo } from '../../utils/downloadUtils';
import { useAIService } from '../../hooks/useAIService';
import { useUIStore } from '../../stores/uiStore';
import { sqliteTextBackupService } from '../../services/sqliteTextBackupService';
import { storageOptimizationService } from '../../services/storageOptimizationService';
import { backupManagementService } from '../../services/backupManagementService';

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
  onDeleteById?: (type: string, id: number) => void;
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
  // 에피소드만 선택 모드
  episodeOnlyMode?: boolean;
  onEpisodeSelectForCards?: (episode: any) => void;
  // 개별 항목 재생성 핸들러
  onRegenerateItem?: (type: string, index: number) => void;
  // 프로젝트 초기화 핸들러
  onProjectReset?: () => void;
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
  onDeleteById,
  onGenerateJsonCard,
  episodes = [],
  cutTextCardSelections = {},
  selectedCuts = new Set(),
  onEpisodeSelection,
  onEditItem,
  onRegenerateItem,
  // 에피소드만 선택 모드
  episodeOnlyMode = false,
  onEpisodeSelectForCards,
  onProjectReset
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('project');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // 카드별 열기/닫기 상태 관리
  const [cardVisibility, setCardVisibility] = useState<{ [key: string]: boolean }>({});
  
  // JSON 카드 생성 상태
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [generatingCardType, setGeneratingCardType] = useState<string | null>(null);
  
  // 이미지 모달 상태
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // 스토리지 상태
  const [storageHealth, setStorageHealth] = useState<any>(null);
  const [detailedUsage, setDetailedUsage] = useState<any>(null);
  const [showStorageDetails, setShowStorageDetails] = useState(false);
  
  // 백업 관리 상태
  const [backups, setBackups] = useState<any[]>([]);
  const [backupAnalysis, setBackupAnalysis] = useState<any>(null);
  const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set());
  const [showBackupManager, setShowBackupManager] = useState(false);
  
  // 저장 상태 개선
  const [storageOptimization, setStorageOptimization] = useState<any>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  
  // 특정 키 상세 보기
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<any>(null);
  const [showKeyDetails, setShowKeyDetails] = useState(false);
  
  // 에피소드 구조 실시간 업데이트
  const [localEpisodes, setLocalEpisodes] = useState<any[]>([]);
  
  // 에피소드 편집 상태
  const [editingEpisode, setEditingEpisode] = useState<number | null>(null);
  const [editingScene, setEditingScene] = useState<{episodeIndex: number, sceneIndex: number} | null>(null);

  // SQLite 텍스트 백업 상태
  const [sqliteBackups, setSqliteBackups] = useState<any[]>([]);
  const [showSqliteBackupManager, setShowSqliteBackupManager] = useState(false);
  const [sqliteBackupStats, setSqliteBackupStats] = useState<any>(null);
  
  const { generateText } = useAIService();
  const { addNotification } = useUIStore();
  // 디버깅 로그 헬퍼 함수
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  };
  
  // 스토리지 상태 업데이트 (모달이 열릴 때만)
  useEffect(() => {
    if (!isOpen) return;
    
    const updateStorageStatus = async () => {
      try {
        const status = await storageOptimizationService.getStorageStatus();
        const usage = await storageOptimizationService.getDetailedUsage();
        setStorageHealth(status);
        setDetailedUsage(usage);
      } catch (error) {
        console.error('스토리지 상태 업데이트 실패:', error);
      }
    };

    updateStorageStatus();
  }, [isOpen]);

  // 백업 데이터 로드
  useEffect(() => {
    const loadBackupData = async () => {
      try {
        const [backupList, analysis] = await Promise.all([
          backupManagementService.getAllBackups(),
          backupManagementService.getBackupAnalysis()
        ]);
        setBackups(backupList);
        setBackupAnalysis(analysis);
      } catch (error) {
        console.error('백업 데이터 로드 실패:', error);
      }
    };

    loadBackupData();
  }, []);

  // 저장 상태 개선 분석
  useEffect(() => {
    const loadOptimizationData = async () => {
      try {
        const optimization = await storageOptimizationService.analyzeStorageOptimization();
        setStorageOptimization(optimization);
      } catch (error) {
        console.error('저장 상태 개선 분석 실패:', error);
      }
    };

    loadOptimizationData();
  }, []);

  // 에피소드 구조 로드 (모달 열릴 때만)
  useEffect(() => {
    if (!isOpen) return;

    const loadEpisodes = () => {
      try {
        const savedEpisodes = storageOptimizationService.loadEpisodeStructure();
        
        if (Array.isArray(savedEpisodes) && savedEpisodes.length > 0) {
          setLocalEpisodes(prevEpisodes => {
            // 데이터가 변경되었을 때만 로그 출력
            if (JSON.stringify(prevEpisodes) !== JSON.stringify(savedEpisodes)) {
              debugLog(`✅ 프로젝트 참조 모달: 에피소드 구조 데이터 로드 완료: ${savedEpisodes.length}개`);
            }
            return savedEpisodes;
          });
        } else {
          setLocalEpisodes(prevEpisodes => {
            if (prevEpisodes.length > 0) {
              debugLog('⚠️ 프로젝트 참조 모달: 에피소드 구조 데이터 없음');
            }
            return [];
          });
        }
      } catch (error) {
        console.error('❌ 프로젝트 참조 모달: 에피소드 데이터 로드 실패:', error);
        setLocalEpisodes([]);
      }
    };

    // 모달이 열릴 때만 데이터 로드
    loadEpisodes();

    // 커스텀 이벤트 리스너 등록 (모달이 열려있을 때만)
    const handleEpisodeStructureUpdate = (event: CustomEvent) => {
      setLocalEpisodes(prevEpisodes => {
        const newEpisodes = event.detail.episodes;
        // 데이터가 변경되었을 때만 로그 출력
        if (JSON.stringify(prevEpisodes) !== JSON.stringify(newEpisodes)) {
          debugLog('🔄 프로젝트 참조 모달: 에피소드 구조 업데이트 이벤트 수신');
        }
        return newEpisodes;
      });
    };

    window.addEventListener('episodeStructureUpdated', handleEpisodeStructureUpdate as EventListener);

    return () => {
      window.removeEventListener('episodeStructureUpdated', handleEpisodeStructureUpdate as EventListener);
    };
  }, [isOpen, episodes]);

  // SQLite 텍스트 백업 데이터 로드
  useEffect(() => {
    if (!isOpen) return;
    
    const loadSqliteBackupData = async () => {
      try {
        const [backupList, stats] = await Promise.all([
          sqliteTextBackupService.getBackupList(),
          sqliteTextBackupService.getBackupStats()
        ]);
        setSqliteBackups(backupList);
        setSqliteBackupStats(stats);
      } catch (error) {
        console.error('SQLite 백업 데이터 로드 실패:', error);
      }
    };

    loadSqliteBackupData();
  }, [isOpen]);
  
  // 스토리지 정리 핸들러
  const handleStorageCleanup = async () => {
    try {
      addNotification({
        type: 'info',
        title: '스토리지 정리 시작',
        message: '불필요한 데이터를 정리하고 있습니다...',
      });

      const result = await storageOptimizationService.cleanupStorage();
      
      addNotification({
        type: 'success',
        title: '스토리지 정리 완료',
        message: `${result.cleanedItems}개 항목 정리, ${(result.freedSpace / 1024).toFixed(1)}KB 확보`,
      });

      // 상태 업데이트
      const status = await storageOptimizationService.getStorageStatus();
      const usage = await storageOptimizationService.getDetailedUsage();
      setStorageHealth(status);
      setDetailedUsage(usage);
    } catch (error) {
      console.error('스토리지 정리 실패:', error);
      addNotification({
        type: 'error',
        title: '정리 실패',
        message: '스토리지 정리 중 오류가 발생했습니다.',
      });
    }
  };

  // 백업 관리 핸들러들
  const handleBackupSelection = (backupId: string, selected: boolean) => {
    const newSelection = new Set(selectedBackups);
    if (selected) {
      newSelection.add(backupId);
    } else {
      newSelection.delete(backupId);
    }
    setSelectedBackups(newSelection);
  };

  const handleSelectAllBackups = () => {
    setSelectedBackups(new Set(backups.map(backup => backup.id)));
  };

  const handleDeselectAllBackups = () => {
    setSelectedBackups(new Set());
  };

  const handleDeleteSelectedBackups = async () => {
    if (selectedBackups.size === 0) {
      addNotification({
        type: 'warning',
        title: '선택된 백업 없음',
        message: '삭제할 백업을 선택해주세요.',
      });
      return;
    }

    try {
      addNotification({
        type: 'info',
        title: '백업 삭제 시작',
        message: `${selectedBackups.size}개 백업을 삭제하고 있습니다...`,
      });

      const result = await backupManagementService.deleteSelectedBackups(Array.from(selectedBackups));
      
      addNotification({
        type: 'success',
        title: '백업 삭제 완료',
        message: `${result.deletedBackups.length}개 백업 삭제, ${(result.freedSpace / 1024).toFixed(1)}KB 확보`,
      });

      // 상태 업데이트
      const [backupList, analysis] = await Promise.all([
        backupManagementService.getAllBackups(),
        backupManagementService.getBackupAnalysis()
      ]);
      setBackups(backupList);
      setBackupAnalysis(analysis);
      setSelectedBackups(new Set());

      // 스토리지 상태도 업데이트
      const status = await storageOptimizationService.getStorageStatus();
      const usage = await storageOptimizationService.getDetailedUsage();
      setStorageHealth(status);
      setDetailedUsage(usage);
    } catch (error) {
      console.error('백업 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '백업 삭제 중 오류가 발생했습니다.',
      });
    }
  };

  const handleAutoCleanupBackups = async () => {
    try {
      addNotification({
        type: 'info',
        title: '자동 정리 시작',
        message: '오래된 백업을 자동으로 정리하고 있습니다...',
      });

      const result = await backupManagementService.autoCleanupBackups();
      
      addNotification({
        type: 'success',
        title: '자동 정리 완료',
        message: `${result.deletedBackups.length}개 백업 정리, ${(result.freedSpace / 1024).toFixed(1)}KB 확보`,
      });

      // 상태 업데이트
      const [backupList, analysis] = await Promise.all([
        backupManagementService.getAllBackups(),
        backupManagementService.getBackupAnalysis()
      ]);
      setBackups(backupList);
      setBackupAnalysis(analysis);
    } catch (error) {
      console.error('자동 정리 실패:', error);
      addNotification({
        type: 'error',
        title: '정리 실패',
        message: '자동 정리 중 오류가 발생했습니다.',
      });
    }
  };

  const handleCleanupTemporaryData = async () => {
    try {
      addNotification({
        type: 'info',
        title: '임시 데이터 정리 시작',
        message: '24시간 지난 임시 데이터를 정리하고 있습니다...',
      });

      const result = await backupManagementService.cleanupTemporaryData();
      
      addNotification({
        type: 'success',
        title: '임시 데이터 정리 완료',
        message: `${result.deletedItems}개 임시 데이터 삭제, ${(result.freedSpace / 1024).toFixed(1)}KB 확보`,
      });

      // 스토리지 상태 업데이트
      const [status, usage] = await Promise.all([
        storageOptimizationService.getStorageStatus(),
        storageOptimizationService.getDetailedUsage()
      ]);
      setStorageHealth(status);
      setDetailedUsage(usage);
    } catch (error) {
      console.error('임시 데이터 정리 실패:', error);
      addNotification({
        type: 'error',
        title: '정리 실패',
        message: '임시 데이터 정리 중 오류가 발생했습니다.',
      });
    }
  };

  // 저장 상태 개선 핸들러
  const handleStorageOptimization = async () => {
    try {
      addNotification({
        type: 'info',
        title: '저장 상태 최적화 시작',
        message: '데이터 압축, 중복 제거, 정리를 실행하고 있습니다...',
      });

      const result = await storageOptimizationService.executeOptimization();
      
      addNotification({
        type: 'success',
        title: '저장 상태 최적화 완료',
        message: `압축: ${result.compressed}개, 중복제거: ${result.deduplicated}개, 정리: ${result.cleaned}개, 총 ${(result.totalSavings / 1024).toFixed(1)}KB 절약`,
      });

      // 상태 업데이트
      const [status, usage, optimization] = await Promise.all([
        storageOptimizationService.getStorageStatus(),
        storageOptimizationService.getDetailedUsage(),
        storageOptimizationService.analyzeStorageOptimization()
      ]);
      setStorageHealth(status);
      setDetailedUsage(usage);
      setStorageOptimization(optimization);
    } catch (error) {
      console.error('저장 상태 최적화 실패:', error);
      addNotification({
        type: 'error',
        title: '최적화 실패',
        message: '저장 상태 최적화 중 오류가 발생했습니다.',
      });
    }
  };

  // SQLite 텍스트 백업 핸들러들
  const handleCreateSqliteBackup = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'SQLite 백업 생성 중',
        message: '텍스트 데이터를 백업하고 있습니다...',
      });

      const result = await sqliteTextBackupService.createTextBackup('수동 백업');
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'SQLite 백업 생성 완료',
          message: result.message || '백업이 생성되었습니다.',
        });

        // 백업 목록 새로고침
        const [backupList, stats] = await Promise.all([
          sqliteTextBackupService.getBackupList(),
          sqliteTextBackupService.getBackupStats()
        ]);
        setSqliteBackups(backupList);
        setSqliteBackupStats(stats);
      } else {
        addNotification({
          type: 'error',
          title: 'SQLite 백업 생성 실패',
          message: result.error || '백업 생성 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('SQLite 백업 생성 실패:', error);
      addNotification({
        type: 'error',
        title: 'SQLite 백업 생성 실패',
        message: '백업 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleRestoreSqliteBackup = async (backupId: string) => {
    try {
      addNotification({
        type: 'info',
        title: 'SQLite 백업 복원 중',
        message: '텍스트 데이터를 복원하고 있습니다...',
      });

      const result = await sqliteTextBackupService.restoreBackup(backupId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'SQLite 백업 복원 완료',
          message: result.message || '백업이 복원되었습니다.',
        });

        // 페이지 새로고침으로 데이터 반영
        window.location.reload();
      } else {
        addNotification({
          type: 'error',
          title: 'SQLite 백업 복원 실패',
          message: result.error || '백업 복원 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('SQLite 백업 복원 실패:', error);
      addNotification({
        type: 'error',
        title: 'SQLite 백업 복원 실패',
        message: '백업 복원 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDeleteSqliteBackup = async (backupId: string) => {
    if (!window.confirm('이 백업을 삭제하시겠습니까?')) return;

    try {
      addNotification({
        type: 'info',
        title: 'SQLite 백업 삭제 중',
        message: '백업을 삭제하고 있습니다...',
      });

      const result = await sqliteTextBackupService.deleteBackup(backupId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'SQLite 백업 삭제 완료',
          message: result.message || '백업이 삭제되었습니다.',
        });

        // 백업 목록 새로고침
        const [backupList, stats] = await Promise.all([
          sqliteTextBackupService.getBackupList(),
          sqliteTextBackupService.getBackupStats()
        ]);
        setSqliteBackups(backupList);
        setSqliteBackupStats(stats);
      } else {
        addNotification({
          type: 'error',
          title: 'SQLite 백업 삭제 실패',
          message: result.error || '백업 삭제 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('SQLite 백업 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: 'SQLite 백업 삭제 실패',
        message: '백업 삭제 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDownloadSqliteBackup = async (backupId: string) => {
    try {
      addNotification({
        type: 'info',
        title: 'SQLite 백업 다운로드 중',
        message: '백업 파일을 다운로드하고 있습니다...',
      });

      const result = await sqliteTextBackupService.downloadBackup(backupId);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'SQLite 백업 다운로드 완료',
          message: result.message || '백업이 다운로드되었습니다.',
        });
      } else {
        addNotification({
          type: 'error',
          title: 'SQLite 백업 다운로드 실패',
          message: result.error || '백업 다운로드 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('SQLite 백업 다운로드 실패:', error);
      addNotification({
        type: 'error',
        title: 'SQLite 백업 다운로드 실패',
        message: '백업 다운로드 중 오류가 발생했습니다.',
      });
    }
  };

  // 특정 키 상세 보기 핸들러
  const handleViewKeyDetails = (key: string) => {
    const details = storageOptimizationService.getKeyDetails(key);
    setSelectedKey(key);
    setKeyDetails(details);
    setShowKeyDetails(true);
  };

  const handleDeleteKey = async (key: string) => {
    try {
      addNotification({
        type: 'info',
        title: '키 삭제 시작',
        message: `${key} 키를 삭제하고 있습니다...`,
      });

      const result = storageOptimizationService.deleteKey(key);
      
      if (result) {
        addNotification({
          type: 'success',
          title: '키 삭제 완료',
          message: `${key} 키가 삭제되었습니다.`,
        });

        // 스토리지 상태 업데이트
        const [status, usage] = await Promise.all([
          storageOptimizationService.getStorageStatus(),
          storageOptimizationService.getDetailedUsage()
        ]);
        setStorageHealth(status);
        setDetailedUsage(usage);
        setShowKeyDetails(false);
      } else {
        addNotification({
          type: 'error',
          title: '삭제 실패',
          message: '키 삭제 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('키 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '키 삭제 중 오류가 발생했습니다.',
      });
    }
  };

  // 에피소드 구조 편집 핸들러
  const handleUpdateEpisode = async (episodeIndex: number, field: string, value: string) => {
    try {
      const updatedEpisodes = [...localEpisodes];
      updatedEpisodes[episodeIndex] = {
        ...updatedEpisodes[episodeIndex],
        [field]: value
      };
      
      setLocalEpisodes(updatedEpisodes);
      await storageOptimizationService.saveEpisodeStructure(updatedEpisodes);
      
      addNotification({
        type: 'success',
        title: '에피소드 업데이트 완료',
        message: '에피소드 정보가 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('에피소드 업데이트 실패:', error);
      addNotification({
        type: 'error',
        title: '업데이트 실패',
        message: '에피소드 정보 업데이트에 실패했습니다.',
      });
    }
  };

  const handleUpdateScene = async (episodeIndex: number, sceneIndex: number, field: string, value: string | number) => {
    try {
      const updatedEpisodes = [...localEpisodes];
      updatedEpisodes[episodeIndex].scenes[sceneIndex] = {
        ...updatedEpisodes[episodeIndex].scenes[sceneIndex],
        [field]: value
      };
      
      setLocalEpisodes(updatedEpisodes);
      await storageOptimizationService.saveEpisodeStructure(updatedEpisodes);
      
      addNotification({
        type: 'success',
        title: '씬 업데이트 완료',
        message: '씬 정보가 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('씬 업데이트 실패:', error);
      addNotification({
        type: 'error',
        title: '업데이트 실패',
        message: '씬 정보 업데이트에 실패했습니다.',
      });
    }
  };

  const handleDeleteEpisode = async (episodeIndex: number) => {
    try {
      const updatedEpisodes = localEpisodes.filter((_, index) => index !== episodeIndex);
      setLocalEpisodes(updatedEpisodes);
      await storageOptimizationService.saveEpisodeStructure(updatedEpisodes);
      
      addNotification({
        type: 'success',
        title: '에피소드 삭제 완료',
        message: '에피소드가 성공적으로 삭제되었습니다.',
      });
    } catch (error) {
      console.error('에피소드 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '에피소드 삭제에 실패했습니다.',
      });
    }
  };

  const handleDeleteScene = async (episodeIndex: number, sceneIndex: number) => {
    try {
      const updatedEpisodes = [...localEpisodes];
      updatedEpisodes[episodeIndex].scenes = updatedEpisodes[episodeIndex].scenes.filter((_: any, index: number) => index !== sceneIndex);
      
      setLocalEpisodes(updatedEpisodes);
      await storageOptimizationService.saveEpisodeStructure(updatedEpisodes);
      
      addNotification({
        type: 'success',
        title: '씬 삭제 완료',
        message: '씬이 성공적으로 삭제되었습니다.',
      });
    } catch (error) {
      console.error('씬 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '씬 삭제에 실패했습니다.',
      });
    }
  };
  
  // 프로젝트 초기화 핸들러
  const handleProjectReset = () => {
    if (onProjectReset) {
      onProjectReset();
      setShowResetConfirm(false);
      onClose(); // 모달 닫기
    }
  };

  // 프로젝트 초기화 확인 핸들러
  const handleResetConfirm = () => {
    setShowResetConfirm(true);
  };

  // 프로젝트 초기화 취소 핸들러
  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };
  
  // JSON 카드 생성 함수
  const handleGenerateJsonCard = async (cardType: string) => {
    if (!onGenerateJsonCard) return;
    
    setIsGeneratingCard(true);
    setGeneratingCardType(cardType);
    
    try {
      let prompt = '';
      
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
          
        case '씬-컷 구성':
          const episodeStructureInfo = episodes.length > 0 
            ? `에피소드 구조:
${episodes.map(episode => 
  `- ${episode.title}: ${episode.scenes.length}개 씬 (${episode.scenes.reduce((sum, scene) => sum + scene.cuts, 0)}개 컷)
  씬 상세: ${episode.scenes.map(scene => `${scene.title} (${scene.cuts}컷)`).join(', ')}`
).join('\n')}

총 구성: ${episodes.length}개 에피소드, ${episodes.reduce((sum, ep) => sum + ep.scenes.length, 0)}개 씬, ${episodes.reduce((sum, ep) => sum + ep.scenes.reduce((sceneSum, scene) => sceneSum + scene.cuts, 0), 0)}개 컷`
            : '에피소드 구조가 설정되지 않음';
            
          prompt = `다음 정보를 바탕으로 씬과 컷 구성 정보를 생성해주세요:

${episodeStructureInfo}

- 시나리오: ${finalScenario || '없음'}
- 텍스트 카드: ${generatedTextCards.length}개

영상 제작에 필요한 씬/컷 구성 정보를 400자 이내로 생성해주세요. 에피소드 구조가 있다면 이를 정확히 반영하여 작성해주세요.`;
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
          const sceneCutPromptInfo = episodes.length > 0 
            ? `에피소드별 씬/컷 구조:
${episodes.map(episode => 
  `에피소드: ${episode.title}
  설명: ${episode.description}
  씬 구성:
${episode.scenes.map(scene => 
  `  - 씬: ${scene.title} (${scene.cuts}컷)
    설명: ${scene.description}`
).join('\n')}`
).join('\n\n')}

총 ${episodes.length}개 에피소드, ${episodes.reduce((sum, ep) => sum + ep.scenes.length, 0)}개 씬, ${episodes.reduce((sum, ep) => sum + ep.scenes.reduce((sceneSum, scene) => sceneSum + scene.cuts, 0), 0)}개 컷`
            : '에피소드 구조가 설정되지 않음';
            
          prompt = `다음 정보를 바탕으로 씬별 컷별 프롬프트를 생성해주세요:

${sceneCutPromptInfo}

- 시나리오: ${finalScenario || '없음'}
- 텍스트 카드: ${generatedTextCards.length}개

각 씬과 컷에 대한 상세 프롬프트를 생성해주세요. 에피소드 구조가 있다면 각 에피소드의 씬과 컷을 정확히 반영하여 작성해주세요. 600자 이내로 생성해주세요.`;
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
    projectInfo: !episodeOnlyMode,
    characters: !episodeOnlyMode,
    scenario: false,
    textCards: false,
    characterImages: false,
    backgroundImages: false,
    settingCutImages: false,
    videos: !episodeOnlyMode,
    jsonCards: false,
    englishJson: false,
    koreanJson: false,
    rawData: false,
    videoSettings: false,
    englishPrompt: false,
    koreanCards: !episodeOnlyMode,
    englishCards: !episodeOnlyMode,
    episodes: true
  });

  // 섹션 토글 함수
  const toggleSection = (section: keyof SectionVisibility) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
        title="에피소드-씬 구조"
        icon={Settings}
        section="episodes"
        count={(localEpisodes.length > 0 ? localEpisodes : episodes).length}
      />
      {sectionVisibility.episodes && (
        <div className="p-4 bg-white border rounded-lg">
          {(() => {
            const hasLocalEpisodes = localEpisodes.length > 0;
            const hasPropEpisodes = episodes.length > 0;
            const displayEpisodes = hasLocalEpisodes ? localEpisodes : episodes;
            
            return (hasLocalEpisodes || hasPropEpisodes) ? (
            <div className="space-y-4">
              {/* 전체 구조 요약 */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  📊 전체 구조 요약
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{displayEpisodes.length}</div>
                    <div className="text-sm text-blue-700">에피소드</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-green-600">{displayEpisodes.reduce((sum: number, ep: any) => sum + ep.scenes.length, 0)}</div>
                    <div className="text-sm text-green-700">씬</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-orange-600">{displayEpisodes.reduce((sum: number, ep: any) => sum + ep.scenes.reduce((sceneSum: number, scene: any) => sceneSum + (scene.cuts || 1), 0), 0)}</div>
                    <div className="text-sm text-orange-700">컷</div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-blue-700 text-center">
                  총 {displayEpisodes.length}개 에피소드, {displayEpisodes.reduce((sum: number, ep: any) => sum + ep.scenes.length, 0)}개 씬, {displayEpisodes.reduce((sum: number, ep: any) => sum + ep.scenes.reduce((sceneSum: number, scene: any) => sceneSum + (scene.cuts || 1), 0), 0)}개 컷으로 구성
                </div>
              </div>
              
              {displayEpisodes.map((episode: any, episodeIndex: number) => (
                <div key={episode.id} className="bg-gray-50 p-4 rounded-lg border">
                  {/* 에피소드 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{episodeIndex + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">{episode.title}</h4>
                        <div className="text-sm text-gray-500">
                          {episode.scenes.length}개 씬 • {episode.scenes.reduce((sum: number, scene: any) => sum + (scene.cuts || 1), 0)}개 컷
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onEpisodeSelection && (
                        <button
                          onClick={() => onEpisodeSelection(episode)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          선택
                        </button>
                      )}
                      {episodeOnlyMode && onEpisodeSelectForCards && (
                        <button
                          onClick={() => onEpisodeSelectForCards(episode)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          카드 생성용 선택
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* 에피소드 설명 */}
                  {episode.description && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 에피소드 설명
                      </label>
                      <div className="p-3 bg-white rounded border text-sm text-gray-700">
                        {episode.description}
                      </div>
                    </div>
                  )}
                  
                  {/* 씬 목록 */}
                  {episode.scenes.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        🎬 씬 목록 ({episode.scenes.length}개)
                      </h5>
                      <div className="space-y-1">
                        {episode.scenes.map((scene: any, sceneIndex: number) => (
                          <div key={scene.id} className="bg-white p-2 rounded border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                  {sceneIndex + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-800">{scene.title}</span>
                              </div>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {scene.cuts || 1}컷
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-lg font-medium text-gray-700 mb-2">에피소드 구조가 설정되지 않았습니다</div>
                <div className="text-sm text-gray-600 mb-4">
                  더 정확한 씬/컷 구성을 위해 에피소드 구조를 설정해보세요.
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                <div className="text-yellow-800 font-medium mb-2">💡 에피소드 구조 설정 방법</div>
                <div className="text-yellow-700 text-sm space-y-1">
                  <div>1. 프로젝트 개요로 이동</div>
                  <div>2. "에피소드/씬 구조 관리" 섹션 찾기</div>
                  <div>3. 에피소드와 씬을 추가하여 구조 설정</div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-800 font-medium mb-2">🧪 테스트용 에피소드 구조 생성</div>
                <div className="text-blue-700 text-sm mb-3">
                  개발/테스트 목적으로 샘플 에피소드 구조를 생성할 수 있습니다.
                </div>
                <button
                  onClick={async () => {
                    try {
                      const testEpisodes = [
                        {
                          id: 1,
                          title: "LA 공항에서 곤란한 상황",
                          description: "미진이 LA 공항에서 겪는 첫 번째 시련",
                          scenes: [
                            {
                              id: 1,
                              title: "공항 도착",
                              description: "미진이 LA 공항에 도착하여 혼란스러워하는 장면",
                              cuts: 3
                            },
                            {
                              id: 2,
                              title: "수하물 분실",
                              description: "수하물을 찾지 못해 당황하는 미진",
                              cuts: 2
                            },
                            {
                              id: 3,
                              title: "도움 요청",
                              description: "공항 직원에게 도움을 요청하는 미진",
                              cuts: 4
                            }
                          ]
                        },
                        {
                          id: 2,
                          title: "새로운 시작",
                          description: "미진이 새로운 환경에 적응해가는 과정",
                          scenes: [
                            {
                              id: 4,
                              title: "숙소 도착",
                              description: "숙소에 도착하여 새로운 환경을 탐색하는 미진",
                              cuts: 3
                            },
                            {
                              id: 5,
                              title: "첫 만남",
                              description: "새로운 사람들과의 첫 만남",
                              cuts: 2
                            }
                          ]
                        }
                      ];
                      
                      await storageOptimizationService.saveEpisodeStructure(testEpisodes);
                      setLocalEpisodes(testEpisodes);
                      
                      // 커스텀 이벤트 발생
                      window.dispatchEvent(new CustomEvent('episodeStructureUpdated', {
                        detail: { episodes: testEpisodes }
                      }));
                      
                      addNotification({
                        type: 'success',
                        title: '테스트 데이터 생성 완료',
                        message: '2개 에피소드, 5개 씬, 14개 컷의 테스트 구조가 생성되었습니다.',
                      });
                    } catch (error) {
                      console.error('테스트 데이터 생성 실패:', error);
                      addNotification({
                        type: 'error',
                        title: '테스트 데이터 생성 실패',
                        message: '테스트 에피소드 구조 생성에 실패했습니다.',
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  테스트 에피소드 구조 생성
                </button>
              </div>
            </div>
          );
          })()}
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
                <div key={`${deleteType}-${actualIndex}`} className="relative group">
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
                  {(onDeleteItem || onDeleteById) && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 캐릭터 이미지를 삭제하시겠습니까?')) {
                          console.log('캐릭터 삭제:', { deleteType, actualIndex, isAIGenerated, index, itemId: item.id }); // 디버깅용 로그
                          
                          // ID 기반 삭제가 가능하면 ID로 삭제, 아니면 인덱스로 삭제
                          if (onDeleteById && item.id) {
                            onDeleteById(deleteType, item.id);
                          } else if (onDeleteItem) {
                            onDeleteItem(deleteType, actualIndex);
                          }
                          
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
                <div key={`${deleteType}-${actualIndex}`} className="relative group">
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
                  {(onDeleteItem || onDeleteById) && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 배경 이미지를 삭제하시겠습니까?')) {
                          console.log('배경 삭제:', { deleteType, actualIndex, isAIGenerated, index, itemId: item.id }); // 디버깅용 로그
                          
                          // ID 기반 삭제가 가능하면 ID로 삭제, 아니면 인덱스로 삭제
                          if (onDeleteById && item.id) {
                            onDeleteById(deleteType, item.id);
                          } else if (onDeleteItem) {
                            onDeleteItem(deleteType, actualIndex);
                          }
                          
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
                <div key={`settingCuts-${index}`} className="relative group">
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
                  {(onDeleteItem || onDeleteById) && (
                    <button
                      onClick={() => {
                        if (window.confirm('정말로 이 설정컷 이미지를 삭제하시겠습니까?')) {
                          console.log('설정컷 삭제:', { type: 'settingCuts', index, itemId: item.id }); // 디버깅용 로그
                          
                          // ID 기반 삭제가 가능하면 ID로 삭제, 아니면 인덱스로 삭제
                          if (onDeleteById && item.id) {
                            onDeleteById('settingCuts', item.id);
                          } else if (onDeleteItem) {
                            onDeleteItem('settingCuts', index);
                          }
                          
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
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
                {['스토리', '영상 설정', '캐릭터 설정', '씬-컷 구성', '시나리오 추가 설정', '영상 시나리오', '씬별 컷별 프롬프트'].map((cardType) => (
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newValue = prompt(`${key} 내용을 수정하세요:`, String(value));
                              if (newValue !== null && newValue !== String(value)) {
                                // 카드 내용 수정 로직
                                const updatedCards = { ...generatedProjectData.koreanCards };
                                updatedCards[key] = newValue;
                                // 상위 컴포넌트에 수정된 데이터 전달
                                if (onEditItem) {
                                  onEditItem('koreanCards', 0, updatedCards);
                                }
                              }
                            }}
                            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                            title="수정"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`${key} 카드를 삭제하시겠습니까?`)) {
                                // 카드 삭제 후 재생성 로직
                                const updatedCards = { ...generatedProjectData.koreanCards };
                                delete updatedCards[key];
                                // 상위 컴포넌트에 삭제된 데이터 전달
                                if (onEditItem) {
                                  onEditItem('koreanCards', 0, updatedCards);
                                }
                                // 삭제 후 즉시 재생성
                                setTimeout(() => {
                                  handleGenerateJsonCard(key);
                                }, 100);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="삭제 후 재생성"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(value))}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="복사"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newValue = prompt(`Edit ${key} content:`, String(value));
                              if (newValue !== null && newValue !== String(value)) {
                                // 영어 카드 내용 수정 로직
                                const updatedCards = { ...generatedProjectData.englishCards };
                                updatedCards[key] = newValue;
                                // 상위 컴포넌트에 수정된 데이터 전달
                                if (onEditItem) {
                                  onEditItem('englishCards', 0, updatedCards);
                                }
                              }
                            }}
                            className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Settings className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${key} card?`)) {
                                // 영어 카드 삭제 후 재생성 로직
                                const updatedCards = { ...generatedProjectData.englishCards };
                                delete updatedCards[key];
                                // 상위 컴포넌트에 삭제된 데이터 전달
                                if (onEditItem) {
                                  onEditItem('englishCards', 0, updatedCards);
                                }
                                // 삭제 후 즉시 재생성
                                setTimeout(() => {
                                  handleGenerateJsonCard(key);
                                }, 100);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Delete and Regenerate"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => navigator.clipboard.writeText(String(value))}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
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
                            const newText = prompt('텍스트 카드 내용을 수정하세요:', card.generatedText);
                            if (newText !== null && newText !== card.generatedText) {
                              // 텍스트 카드 내용 수정 로직
                              if (onEditItem) {
                                onEditItem('textCard', index, { ...card, generatedText: newText });
                              }
                            }
                          }}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          ✏️ 수정
                        </button>
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

        {/* 에피소드-씬 구조 */}
        <SectionHeader
          title="에피소드-씬 구조"
          icon={Settings}
          section="episodes"
          count={episodes.length}
        />
        {sectionVisibility.episodes && (
          <div className="p-4 bg-white border rounded-lg">
            {(localEpisodes.length > 0 || episodes.length > 0) ? (
              <div className="space-y-4">
                {/* 전체 구조 요약 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 전체 구조 요약</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {(localEpisodes.length > 0 ? localEpisodes : episodes).length}
                      </div>
                      <div className="text-blue-700">에피소드</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {(localEpisodes.length > 0 ? localEpisodes : episodes).reduce((sum, ep) => sum + ep.scenes.length, 0)}
                      </div>
                      <div className="text-blue-700">씬</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {(localEpisodes.length > 0 ? localEpisodes : episodes).reduce((sum: number, ep: any) => 
                          sum + ep.scenes.reduce((sceneSum: number, scene: any) => sceneSum + (scene.cuts || 1), 0), 0
                        )}
                      </div>
                      <div className="text-blue-700">컷</div>
                    </div>
                  </div>
                </div>

                {/* 에피소드별 상세 정보 */}
                {(localEpisodes.length > 0 ? localEpisodes : episodes).map((episode, episodeIndex) => (
                  <div key={episode.id || episodeIndex} className="bg-gray-50 p-4 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800">
                          🎬 {episodeIndex + 1}. {episode.title}
                        </h4>
                        <button
                          onClick={() => setEditingEpisode(editingEpisode === episodeIndex ? null : episodeIndex)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="편집"
                        >
                          ✏️
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-gray-500">
                          {episode.scenes.length}개 씬, {episode.scenes.reduce((sum: number, scene: any) => sum + (scene.cuts || 1), 0)}개 컷
                        </div>
                        <button
                          onClick={() => handleDeleteEpisode(episodeIndex)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {/* 에피소드 편집 모드 */}
                    {editingEpisode === episodeIndex && (
                      <div className="mb-3 p-3 bg-white rounded border">
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600">제목</label>
                            <input
                              type="text"
                              value={episode.title}
                              onChange={(e) => handleUpdateEpisode(episodeIndex, 'title', e.target.value)}
                              className="w-full p-2 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">설명</label>
                            <textarea
                              value={episode.description}
                              onChange={(e) => handleUpdateEpisode(episodeIndex, 'description', e.target.value)}
                              className="w-full p-2 text-sm border rounded h-20"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-3">{episode.description}</p>
                    <div className="space-y-2">
                      {episode.scenes.map((scene: any, sceneIndex: number) => (
                        <div key={scene.id || sceneIndex} className="bg-white p-3 rounded border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="text-sm font-medium text-gray-700">
                                📽️ {sceneIndex + 1}. {scene.title}
                              </h5>
                              <button
                                onClick={() => setEditingScene(
                                  editingScene?.episodeIndex === episodeIndex && editingScene?.sceneIndex === sceneIndex 
                                    ? null 
                                    : { episodeIndex, sceneIndex }
                                )}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="편집"
                              >
                                ✏️
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {scene.cuts || 1}컷
                              </span>
                              <button
                                onClick={() => handleDeleteScene(episodeIndex, sceneIndex)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                title="삭제"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          {/* 씬 편집 모드 */}
                          {editingScene?.episodeIndex === episodeIndex && editingScene?.sceneIndex === sceneIndex && (
                            <div className="mb-2 p-2 bg-gray-50 rounded">
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-600">제목</label>
                                  <input
                                    type="text"
                                    value={scene.title}
                                    onChange={(e) => handleUpdateScene(episodeIndex, sceneIndex, 'title', e.target.value)}
                                    className="w-full p-1 text-xs border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">설명</label>
                                  <textarea
                                    value={scene.description}
                                    onChange={(e) => handleUpdateScene(episodeIndex, sceneIndex, 'description', e.target.value)}
                                    className="w-full p-1 text-xs border rounded h-16"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">컷 수</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={scene.cuts || 1}
                                    onChange={(e) => handleUpdateScene(episodeIndex, sceneIndex, 'cuts', parseInt(e.target.value) || 1)}
                                    className="w-full p-1 text-xs border rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-600">{scene.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🎬</div>
                <div className="text-gray-500 mb-2">에피소드/씬 구조가 설정되지 않았습니다</div>
                <div className="text-sm text-gray-400 mb-4">
                  프로젝트 개요에서 에피소드 구조를 설정하면<br />
                  더 정확한 카드 생성이 가능합니다
                </div>
                <button
                  onClick={() => {
                    addNotification({
                      type: 'info',
                      title: '에피소드 구조 설정',
                      message: '프로젝트 개요의 "에피소드/씬 구조 관리"에서 설정할 수 있습니다.',
                    });
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                >
                  🎬 에피소드 구조 설정하기
                </button>
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
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">프로젝트 참조</h2>
            {storageHealth && (
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
                  storageHealth.localStorage.status === 'healthy' ? 'bg-green-100 text-green-700' :
                  storageHealth.localStorage.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <HardDrive className="w-3 h-3" />
                  <span>LocalStorage: {storageHealth.localStorage.percentage.toFixed(1)}%</span>
                </div>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs ${
                  storageHealth.indexedDB.connected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <span>IndexedDB: {storageHealth.indexedDB.connected ? '연결됨' : '연결실패'}</span>
                </div>
                <button
                  onClick={handleStorageCleanup}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-colors"
                  title="스토리지 정리"
                >
                  🧹 정리
                </button>
                <button
                  onClick={() => setShowStorageDetails(!showStorageDetails)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                  title="상세 정보"
                >
                  📊 상세
                </button>
                <button
                  onClick={() => setShowBackupManager(!showBackupManager)}
                  className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
                  title="백업 관리"
                >
                  💾 백업 ({backups.length})
                </button>
                <button
                  onClick={() => setShowOptimization(!showOptimization)}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors"
                  title="저장 상태 개선"
                >
                  🚀 최적화
                </button>
                <button
                  onClick={() => setShowSqliteBackupManager(!showSqliteBackupManager)}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                  title="SQLite 텍스트 백업"
                >
                  💾 SQLite 백업 ({sqliteBackups.length})
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* 프로젝트 초기화 버튼 */}
            <button
              onClick={handleResetConfirm}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
              title="프로젝트 초기화"
            >
              <Trash2 className="w-3 h-3" />
              프로젝트 초기화
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>


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
        {/* SQLite 텍스트 백업 패널 */}
        {showSqliteBackupManager && (
          <div className="border-b bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">💾 SQLite 텍스트 백업</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreateSqliteBackup}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  백업 생성
                </button>
                <button
                  onClick={() => setShowSqliteBackupManager(false)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 백업 통계 */}
            {sqliteBackupStats && (
              <div className="mb-4 p-3 bg-white rounded border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">총 백업:</span>
                    <span className="ml-2 font-semibold">{sqliteBackupStats.totalBackups}개</span>
                  </div>
                  <div>
                    <span className="text-gray-600">총 크기:</span>
                    <span className="ml-2 font-semibold">{(sqliteBackupStats.totalSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div>
                    <span className="text-gray-600">최신 백업:</span>
                    <span className="ml-2 font-semibold">
                      {sqliteBackupStats.newestBackup ? 
                        new Date(sqliteBackupStats.newestBackup.timestamp).toLocaleDateString() : '없음'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">가장 오래된:</span>
                    <span className="ml-2 font-semibold">
                      {sqliteBackupStats.oldestBackup ? 
                        new Date(sqliteBackupStats.oldestBackup.timestamp).toLocaleDateString() : '없음'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 백업 목록 */}
            <div className="space-y-2">
              {sqliteBackups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HardDrive className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>생성된 SQLite 백업이 없습니다.</p>
                  <p className="text-sm">텍스트 데이터를 백업하려면 "백업 생성" 버튼을 클릭하세요.</p>
                </div>
              ) : (
                sqliteBackups.map((backup) => (
                  <div key={backup.id} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{backup.metadata.description}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(backup.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          크기: {(backup.metadata.size / 1024).toFixed(1)}KB | 
                          ID: {backup.id.substring(0, 8)}...
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleRestoreSqliteBackup(backup.id)}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="복원"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadSqliteBackup(backup.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSqliteBackup(backup.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 저장 상태 개선 패널 */}
        {showOptimization && storageOptimization && (
          <div className="border-b bg-green-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🚀 저장 상태 개선</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleStorageOptimization}
                  className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
                >
                  최적화 실행
                </button>
              </div>
            </div>

            {/* 최적화 통계 */}
            <div className="mb-4 p-3 bg-white rounded border">
              <h4 className="font-medium text-gray-700 mb-2">📊 최적화 가능 통계</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">총 절약 가능:</span>
                  <span className="ml-1 font-medium text-green-600">{(storageOptimization.totalSavings / 1024).toFixed(1)}KB</span>
                </div>
                <div>
                  <span className="text-gray-500">압축 가능:</span>
                  <span className="ml-1 font-medium">{(storageOptimization.compressionRatio * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">중복 제거:</span>
                  <span className="ml-1 font-medium">{(storageOptimization.deduplicationRatio * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-500">상태:</span>
                  <span className={`ml-1 font-medium ${
                    storageOptimization.totalSavings > 1024 ? 'text-red-600' : 
                    storageOptimization.totalSavings > 512 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {storageOptimization.totalSavings > 1024 ? '개선 필요' : 
                     storageOptimization.totalSavings > 512 ? '보통' : '양호'}
                  </span>
                </div>
              </div>
            </div>

            {/* 권장사항 */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">💡 권장사항</h4>
              <div className="space-y-1">
                {storageOptimization.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="text-sm text-gray-600 p-2 bg-white rounded border">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 백업 관리 패널 */}
        {showBackupManager && (
          <div className="border-b bg-orange-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">💾 백업 관리</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAllBackups}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                >
                  전체 선택
                </button>
                <button
                  onClick={handleDeselectAllBackups}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                >
                  선택 해제
                </button>
                <button
                  onClick={handleDeleteSelectedBackups}
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                  disabled={selectedBackups.size === 0}
                >
                  선택 삭제 ({selectedBackups.size})
                </button>
                <button
                  onClick={handleAutoCleanupBackups}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-colors"
                >
                  자동 정리
                </button>
                <button
                  onClick={handleCleanupTemporaryData}
                  className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded hover:bg-yellow-200 transition-colors"
                >
                  24시간 정리
                </button>
              </div>
            </div>

            {/* 백업 통계 */}
            {backupAnalysis && (
              <div className="mb-4 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-700 mb-2">📊 백업 통계</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">총 백업:</span>
                    <span className="ml-1 font-medium">{backupAnalysis.totalBackups}개</span>
                  </div>
                  <div>
                    <span className="text-gray-500">총 크기:</span>
                    <span className="ml-1 font-medium">{(backupAnalysis.totalSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">수동:</span>
                    <span className="ml-1 font-medium">{backupAnalysis.backupsByType.manual}개</span>
                  </div>
                  <div>
                    <span className="text-gray-500">자동:</span>
                    <span className="ml-1 font-medium">{backupAnalysis.backupsByType.automatic}개</span>
                  </div>
                </div>
              </div>
            )}

            {/* 백업 목록 */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {backups.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  백업 데이터가 없습니다.
                </div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center space-x-3 p-3 bg-white rounded border">
                    <input
                      type="checkbox"
                      checked={selectedBackups.has(backup.id)}
                      onChange={(e) => handleBackupSelection(backup.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {backup.description}
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {(backup.size / 1024).toFixed(1)}KB
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(backup.timestamp).toLocaleString()} • 
                        프로젝트: {backup.data.projects}개, 
                        이미지: {backup.data.images}개, 
                        템플릿: {backup.data.templates}개
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 text-xs rounded ${
                        backup.type === 'manual' ? 'bg-blue-100 text-blue-700' :
                        backup.type === 'automatic' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {backup.type === 'manual' ? '수동' : 
                         backup.type === 'automatic' ? '자동' : '예약'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 스토리지 상세 정보 */}
        {showStorageDetails && detailedUsage && (
          <div className="border-b bg-gray-50 p-4">
            <h3 className="text-lg font-semibold mb-3">📊 스토리지 상세 정보</h3>
            
            {/* LocalStorage 상세 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">💾 LocalStorage 사용량</h4>
              <div className="space-y-1">
                {detailedUsage.localStorage.slice(0, 10).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-white rounded border hover:bg-gray-50">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="truncate max-w-xs font-medium" title={item.key}>{item.key}</span>
                      <span className="text-gray-500">{(item.size / 1024).toFixed(1)}KB</span>
                      <span className="text-xs text-gray-400">({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <button
                        onClick={() => handleViewKeyDetails(item.key)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                        title="상세 보기"
                      >
                        👁️ 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IndexedDB 상세 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">🗄️ IndexedDB 스토어</h4>
              <div className="space-y-1">
                {detailedUsage.indexedDB.map((store: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{store.store}</span>
                    <span className="text-gray-500">{(store.estimatedSize / 1024).toFixed(1)}KB (추정)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 권장사항 */}
            {storageHealth?.recommendations && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💡 권장사항</h4>
                <div className="space-y-1">
                  {storageHealth.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="text-sm text-gray-600">{rec}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

      {/* 키 상세 보기 모달 */}
      {showKeyDetails && keyDetails && selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🔍 키 상세 정보: {selectedKey}</h3>
              <button
                onClick={() => setShowKeyDetails(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 키 정보 */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">크기:</span>
                  <span className="ml-2">{(keyDetails.size / 1024).toFixed(1)}KB</span>
                </div>
                <div>
                  <span className="font-medium">타입:</span>
                  <span className="ml-2">{keyDetails.type}</span>
                </div>
                {keyDetails.itemCount && (
                  <div>
                    <span className="font-medium">항목 수:</span>
                    <span className="ml-2">{keyDetails.itemCount}개</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">상태:</span>
                  <span className={`ml-2 ${keyDetails.exists ? 'text-green-600' : 'text-red-600'}`}>
                    {keyDetails.exists ? '존재함' : '없음'}
                  </span>
                </div>
              </div>
            </div>

            {/* 미리보기 */}
            {keyDetails.preview && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">📋 미리보기</h4>
                <div className="bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(keyDetails.preview, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(keyDetails.preview, null, 2));
                  addNotification({
                    type: 'success',
                    title: '복사 완료',
                    message: '미리보기 데이터가 클립보드에 복사되었습니다.',
                  });
                }}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
              >
                📋 복사
              </button>
              <button
                onClick={() => handleDeleteKey(selectedKey)}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
              >
                🗑️ 삭제
              </button>
              <button
                onClick={() => setShowKeyDetails(false)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 초기화 확인 다이얼로그 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">프로젝트 초기화</h3>
                <p className="text-sm text-gray-600">모든 프로젝트 데이터를 삭제합니다</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                다음 데이터가 모두 삭제됩니다:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 스토리 및 캐릭터 정보</li>
                <li>• 시나리오 및 에피소드 구조</li>
                <li>• 생성된 이미지 및 영상</li>
                <li>• 텍스트 카드 및 JSON 데이터</li>
                <li>• 모든 프로젝트 설정</li>
              </ul>
              <p className="text-sm text-red-600 font-medium mt-3">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleResetCancel}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleProjectReset}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                초기화 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
