import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Calendar,
  User,
  Share,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Clock,
  Filter
} from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import { databaseService } from '../../services/database/DatabaseService';
import { ProjectLoadResponse } from '../../types/project';
import { useUIStore } from '../../stores/uiStore';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onProjectLoad?: (project: ProjectLoadResponse) => void;
  onProjectCreate?: () => void;
}

interface ProjectFilters {
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
  shared: 'all' | 'my' | 'shared';
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
  userId,
  onProjectLoad,
  onProjectCreate
}) => {
  const { addNotification } = useUIStore();
  const [projects, setProjects] = useState<ProjectLoadResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    dateRange: 'all',
    shared: 'all'
  });
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const allProjects = await databaseService.listProjects(userId);
      setProjects(allProjects);
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '로드 실패',
        message: '프로젝트 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 필터링 및 정렬된 프로젝트 목록
  const filteredAndSortedProjects = React.useMemo(() => {
    let filtered = projects.filter(project => {
      // 검색 필터
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = project.projectData.story?.toLowerCase().includes(searchLower);
        const matchesContent = JSON.stringify(project.projectData).toLowerCase().includes(searchLower);
        if (!matchesName && !matchesContent) return false;
      }

      // 날짜 필터
      if (filters.dateRange !== 'all') {
        const projectDate = new Date(project.updatedAt);
        const now = new Date();
        const diffTime = now.getTime() - projectDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      // 공유 필터
      if (filters.shared !== 'all') {
        switch (filters.shared) {
          case 'my':
            if (project.isShared) return false;
            break;
          case 'shared':
            if (!project.isShared) return false;
            break;
        }
      }

      return true;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.projectData.story || 'Untitled';
          bValue = b.projectData.story || 'Untitled';
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updated':
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [projects, filters, sortBy, sortOrder]);

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await databaseService.deleteProject(projectId);
      addNotification({
        type: 'success',
        title: '삭제 완료',
        message: '프로젝트가 삭제되었습니다.'
      });
      await loadProjects();
    } catch (error) {
      console.error('프로젝트 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '프로젝트 삭제에 실패했습니다.'
      });
    }
  };

  // 프로젝트 내보내기
  const handleExportProject = async (projectId: string) => {
    try {
      const exportData = await databaseService.exportProject(projectId);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${projectId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: '내보내기 완료',
        message: '프로젝트가 내보내기되었습니다.'
      });
    } catch (error) {
      console.error('프로젝트 내보내기 실패:', error);
      addNotification({
        type: 'error',
        title: '내보내기 실패',
        message: '프로젝트 내보내기에 실패했습니다.'
      });
    }
  };

  // 프로젝트 가져오기
  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = e.target?.result as string;
        await databaseService.importProject(importData);

        addNotification({
          type: 'success',
          title: '가져오기 완료',
          message: '프로젝트가 성공적으로 가져와졌습니다.'
        });

        await loadProjects();
      } catch (error) {
        console.error('프로젝트 가져오기 실패:', error);
        addNotification({
          type: 'error',
          title: '가져오기 실패',
          message: '프로젝트 가져오기에 실패했습니다.'
        });
      }
    };
    reader.readAsText(file);
  };

  // 선택된 프로젝트 토글
  const toggleProjectSelection = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // 모든 프로젝트 선택/해제
  const toggleAllProjects = () => {
    if (selectedProjects.size === filteredAndSortedProjects.length) {
      setSelectedProjects(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(filteredAndSortedProjects.map(p => p.projectId));
      setSelectedProjects(allIds);
      setShowBulkActions(true);
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (!confirm(`선택된 ${selectedProjects.size}개 프로젝트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      for (const projectId of selectedProjects) {
        await databaseService.deleteProject(projectId);
      }

      addNotification({
        type: 'success',
        title: '일괄 삭제 완료',
        message: `${selectedProjects.size}개 프로젝트가 삭제되었습니다.`
      });

      setSelectedProjects(new Set());
      setShowBulkActions(false);
      await loadProjects();
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '일괄 삭제 실패',
        message: '일부 프로젝트 삭제에 실패했습니다.'
      });
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return '방금 전';
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 30) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로젝트 관리" size="xl">
      <div className="space-y-6">
        {/* 필터 및 검색 */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="프로젝트 검색..."
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 기간</option>
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
            </select>

            <select
              value={filters.shared}
              onChange={(e) => setFilters(prev => ({ ...prev, shared: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 프로젝트</option>
              <option value="my">내 프로젝트</option>
              <option value="shared">공유된 프로젝트</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated-desc">최근 수정순</option>
              <option value="updated-asc">오래된 수정순</option>
              <option value="created-desc">최근 생성순</option>
              <option value="created-asc">오래된 생성순</option>
              <option value="name-asc">이름순 (A-Z)</option>
              <option value="name-desc">이름순 (Z-A)</option>
            </select>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {onProjectCreate && (
              <Button
                onClick={onProjectCreate}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트
              </Button>
            )}

            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              가져오기
              <input
                type="file"
                accept=".json"
                onChange={handleImportProject}
                className="hidden"
              />
            </label>
          </div>

          {showBulkActions && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedProjects.size}개 선택됨
              </span>
              <Button
                onClick={handleBulkDelete}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 프로젝트 목록 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center p-3 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
            <div className="flex items-center w-8">
              <input
                type="checkbox"
                checked={selectedProjects.size === filteredAndSortedProjects.length && filteredAndSortedProjects.length > 0}
                onChange={toggleAllProjects}
              />
            </div>
            <div className="flex-1">프로젝트</div>
            <div className="w-24">상태</div>
            <div className="w-32">수정일</div>
            <div className="w-32">작성자</div>
            <div className="w-32">액션</div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">로딩 중...</p>
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">프로젝트가 없습니다</p>
              {filters.search || filters.dateRange !== 'all' || filters.shared !== 'all' ? (
                <p className="text-sm text-gray-400">필터 조건을 변경해보세요</p>
              ) : (
                <p className="text-sm text-gray-400">새 프로젝트를 만들어보세요</p>
              )}
            </div>
          ) : (
            filteredAndSortedProjects.map((project) => (
              <div
                key={project.projectId}
                className={`flex items-center p-3 border rounded-lg hover:shadow-sm transition-shadow ${
                  selectedProjects.has(project.projectId) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center w-8">
                  <input
                    type="checkbox"
                    checked={selectedProjects.has(project.projectId)}
                    onChange={() => toggleProjectSelection(project.projectId)}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {project.projectData.story || 'Untitled Project'}
                  </h4>
                  <p className="text-sm text-gray-500 truncate">
                    {Object.keys(project.projectData).length > 1 ?
                      `${Object.keys(project.projectData).length}개 섹션` :
                      '빈 프로젝트'
                    }
                  </p>
                </div>

                <div className="w-24">
                  <div className="flex items-center gap-1">
                    {project.isShared && (
                      <Share className="w-3 h-3 text-blue-500" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.projectData.story ?
                        'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                      {project.projectData.story ? '완료' : '초안'}
                    </span>
                  </div>
                </div>

                <div className="w-32">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(project.updatedAt)}
                  </div>
                </div>

                <div className="w-32">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <User className="w-3 h-3" />
                    {project.userName || '알 수 없음'}
                  </div>
                </div>

                <div className="w-32">
                  <div className="flex gap-1">
                    {onProjectLoad && (
                      <Button
                        onClick={() => onProjectLoad(project)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        title="프로젝트 열기"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleExportProject(project.projectId)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      title="내보내기"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.projectId)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600 hover:text-red-700"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 요약 정보 */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              총 {filteredAndSortedProjects.length}개 프로젝트
              {filters.search || filters.dateRange !== 'all' || filters.shared !== 'all' ?
                ` (${projects.length}개 중)` : ''
              }
            </span>
            {selectedProjects.size > 0 && (
              <span>
                {selectedProjects.size}개 선택됨
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectManager;