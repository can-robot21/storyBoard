import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { databaseService } from '../services/database/DatabaseService';
import { ProjectState, ProjectLoadResponse } from '../types/project';

/**
 * 데이터베이스 관리 훅
 * 프로젝트 저장, 로드, 삭제 등의 기능 제공
 */
export const useDatabase = () => {
  const { addNotification } = useUIStore();
  
  // 상태
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectLoadResponse[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectLoadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectList = await databaseService.listProjects();
      setProjects(projectList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 목록 로드에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '로드 실패',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // 프로젝트 저장
  const saveProject = useCallback(async (projectData: ProjectState, projectId?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const savedProjectId = await databaseService.saveProject({
        projectId,
        projectData
      });
      
      // 프로젝트 목록 새로고침
      await loadProjects();
      
      addNotification({
        type: 'success',
        title: '저장 완료',
        message: '프로젝트가 성공적으로 저장되었습니다.',
      });
      
      return savedProjectId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 저장에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, addNotification]);

  // 프로젝트 로드
  const loadProject = useCallback(async (projectId: string): Promise<ProjectLoadResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const project = await databaseService.loadProject(projectId);
      setCurrentProject(project);
      
      if (project) {
        addNotification({
          type: 'success',
          title: '로드 완료',
          message: '프로젝트가 성공적으로 로드되었습니다.',
        });
      } else {
        addNotification({
          type: 'warning',
          title: '프로젝트 없음',
          message: '해당 프로젝트를 찾을 수 없습니다.',
        });
      }
      
      return project;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 로드에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '로드 실패',
        message: errorMessage,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // 프로젝트 삭제
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await databaseService.deleteProject(projectId);
      
      if (success) {
        // 프로젝트 목록에서 제거
        setProjects(prev => prev.filter(p => p.projectId !== projectId));
        
        // 현재 프로젝트가 삭제된 프로젝트라면 초기화
        if (currentProject?.projectId === projectId) {
          setCurrentProject(null);
        }
        
        addNotification({
          type: 'success',
          title: '삭제 완료',
          message: '프로젝트가 성공적으로 삭제되었습니다.',
        });
      } else {
        addNotification({
          type: 'warning',
          title: '삭제 실패',
          message: '프로젝트를 찾을 수 없습니다.',
        });
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 삭제에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: errorMessage,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, addNotification]);

  // 프로젝트 내보내기
  const exportProject = useCallback(async (projectId: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectData = await databaseService.exportProject(projectId);
      
      addNotification({
        type: 'success',
        title: '내보내기 완료',
        message: '프로젝트가 성공적으로 내보내기되었습니다.',
      });
      
      return projectData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 내보내기에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '내보내기 실패',
        message: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  // 프로젝트 가져오기
  const importProject = useCallback(async (projectData: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectId = await databaseService.importProject(projectData);
      
      // 프로젝트 목록 새로고침
      await loadProjects();
      
      addNotification({
        type: 'success',
        title: '가져오기 완료',
        message: '프로젝트가 성공적으로 가져와졌습니다.',
      });
      
      return projectId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '프로젝트 가져오기에 실패했습니다.';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: '가져오기 실패',
        message: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, addNotification]);

  // 파일로 내보내기
  const exportToFile = useCallback(async (projectId: string, filename?: string): Promise<void> => {
    try {
      const projectData = await exportProject(projectId);
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `storyboard-project-${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 내보내기 실패:', error);
    }
  }, [exportProject]);

  // 파일에서 가져오기
  const importFromFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const projectId = await importProject(content);
          resolve(projectId);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsText(file);
    });
  }, [importProject]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    // 상태
    isLoading,
    projects,
    currentProject,
    error,
    
    // 액션
    loadProjects,
    saveProject,
    loadProject,
    deleteProject,
    exportProject,
    importProject,
    exportToFile,
    importFromFile,
    clearError,
    
    // 유틸리티
    hasProjects: projects.length > 0,
    isCurrentProjectLoaded: currentProject !== null
  };
};
