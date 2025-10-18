import React, { useState, useEffect } from 'react';
import { databaseService } from '../../services/database/DatabaseService';
import { useUIStore } from '../../stores/uiStore';
import Button from './Button';
import Modal from './Modal';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectData?: any;
  onLoadProject?: (projectData: any) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
  currentProjectData,
  onLoadProject
}) => {
  const { addNotification } = useUIStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // 프로젝트 목록 로드
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await databaseService.listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('프로젝트 목록 로드 실패:', error);
      addNotification({ 
        title: '프로젝트 목록 로드 실패', 
        message: '프로젝트 목록을 불러오는데 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 저장
  const saveProject = async () => {
    if (!projectName.trim()) {
      addNotification({ 
        title: '프로젝트 이름 오류', 
        message: '프로젝트 이름을 입력해주세요.', 
        type: 'error' 
      });
      return;
    }

    if (!currentProjectData) {
      addNotification({ 
        title: '프로젝트 데이터 없음', 
        message: '저장할 프로젝트 데이터가 없습니다.', 
        type: 'error' 
      });
      return;
    }

    try {
      setSaving(true);
      const projectId = await databaseService.saveProject({
        projectId: selectedProject || undefined,
        userId: 'current-user', // 실제로는 현재 로그인한 사용자 ID 사용
        projectData: {
          ...currentProjectData,
          name: projectName,
          description: projectDescription
        }
      });

      addNotification({ 
        title: '프로젝트 저장 성공', 
        message: '프로젝트가 성공적으로 저장되었습니다.', 
        type: 'success' 
      });
      setProjectName('');
      setProjectDescription('');
      setSelectedProject(null);
      loadProjects();
    } catch (error) {
      console.error('프로젝트 저장 실패:', error);
      addNotification({ 
        title: '프로젝트 저장 실패', 
        message: '프로젝트 저장에 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  // 프로젝트 로드
  const loadProject = async (projectId: string) => {
    try {
      setLoading(true);
      const project = await databaseService.loadProject(projectId);
      if (project && onLoadProject) {
        onLoadProject(project.projectData);
        addNotification({ 
          title: '프로젝트 로드 성공', 
          message: '프로젝트가 성공적으로 로드되었습니다.', 
          type: 'success' 
        });
        onClose();
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      addNotification({ 
        title: '프로젝트 로드 실패', 
        message: '프로젝트 로드에 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 삭제
  const deleteProject = async (projectId: string) => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      await databaseService.deleteProject(projectId);
      addNotification({ 
        title: '프로젝트 삭제 성공', 
        message: '프로젝트가 성공적으로 삭제되었습니다.', 
        type: 'success' 
      });
      loadProjects();
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      addNotification({ 
        title: '프로젝트 삭제 실패', 
        message: '프로젝트 삭제에 실패했습니다.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 내보내기
  const exportProject = async (projectId: string) => {
    try {
      const exportData = await databaseService.exportProject(projectId);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification({ 
        title: '프로젝트 내보내기 성공', 
        message: '프로젝트가 성공적으로 내보내졌습니다.', 
        type: 'success' 
      });
    } catch (error) {
      console.error('프로젝트 내보내기 실패:', error);
      addNotification({ 
        title: '프로젝트 내보내기 실패', 
        message: '프로젝트 내보내기에 실패했습니다.', 
        type: 'error' 
      });
    }
  };

  // 프로젝트 가져오기
  const importProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const projectId = await databaseService.importProject(text);
      addNotification({ 
        title: '프로젝트 가져오기 성공', 
        message: '프로젝트가 성공적으로 가져와졌습니다.', 
        type: 'success' 
      });
      loadProjects();
    } catch (error) {
      console.error('프로젝트 가져오기 실패:', error);
      addNotification({ 
        title: '프로젝트 가져오기 실패', 
        message: '프로젝트 가져오기에 실패했습니다.', 
        type: 'error' 
      });
    }
  };

  // 프로젝트 선택
  const selectProject = (project: any) => {
    setSelectedProject(project.projectId);
    setProjectName(project.projectData.name || '');
    setProjectDescription(project.projectData.description || '');
  };

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로젝트 관리">
      <div className="space-y-6">
        {/* 프로젝트 저장 섹션 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">프로젝트 저장</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 이름
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프로젝트 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 설명
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="프로젝트 설명을 입력하세요"
              />
            </div>
            <Button
              onClick={saveProject}
              disabled={saving || !projectName.trim()}
              className="w-full"
            >
              {saving ? '저장 중...' : selectedProject ? '프로젝트 업데이트' : '프로젝트 저장'}
            </Button>
          </div>
        </div>

        {/* 프로젝트 목록 섹션 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">저장된 프로젝트</h3>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={importProject}
                className="hidden"
                id="import-project"
              />
              <label
                htmlFor="import-project"
                className="px-3 py-1 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700 text-sm"
              >
                가져오기
              </label>
              <Button
                onClick={loadProjects}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                새로고침
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>저장된 프로젝트가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.projectId}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProject === project.projectId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => selectProject(project)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {project.projectData.name || 'Untitled Project'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.projectData.description || '설명 없음'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        수정일: {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProject(project.projectId);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        로드
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportProject(project.projectId);
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        내보내기
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.projectId);
                        }}
                        size="sm"
                        variant="danger"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};