import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit3, Trash2, Download, Upload, Copy, Eye } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import Input from './Input';
import { databaseService } from '../../services/database/DatabaseService';
import { PromptTemplate } from '../../types/project';
import { useUIStore } from '../../stores/uiStore';

interface PromptTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTemplateSelect?: (template: PromptTemplate) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  templateData: {
    prompt: string;
    parameters: Record<string, any>;
    metadata: Record<string, any>;
  };
  isPublic: boolean;
}

const defaultCategories = [
  'story',
  'character',
  'scenario',
  'dialogue',
  'image-generation',
  'video-generation',
  'custom'
];

export const PromptTemplateManager: React.FC<PromptTemplateManagerProps> = ({
  isOpen,
  onClose,
  userId,
  onTemplateSelect
}) => {
  const { addNotification } = useUIStore();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PromptTemplate | null>(null);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'custom',
    templateData: {
      prompt: '',
      parameters: {},
      metadata: {}
    },
    isPublic: false
  });

  // 템플릿 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const categoryFilter = selectedCategory === 'all' ? undefined : selectedCategory;
      const allTemplates = await databaseService.listPromptTemplates(userId, categoryFilter);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      addNotification({
        type: 'error',
        title: '로드 실패',
        message: '템플릿 목록을 불러오는데 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 검색 및 필터링된 템플릿
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 폼 데이터 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      templateData: {
        prompt: '',
        parameters: {},
        metadata: {}
      },
      isPublic: false
    });
    setEditingTemplate(null);
  };

  // 템플릿 저장
  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.templateData.prompt.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '템플릿 이름과 프롬프트를 입력해주세요.'
      });
      return;
    }

    try {
      if (editingTemplate) {
        // 업데이트 로직 (현재는 삭제 후 재생성)
        await databaseService.deletePromptTemplate(editingTemplate.id);
      }

      const templateId = await databaseService.savePromptTemplate(
        userId,
        formData.name,
        formData.category,
        {
          ...formData.templateData,
          isPublic: formData.isPublic,
          description: formData.description
        }
      );

      addNotification({
        type: 'success',
        title: '저장 완료',
        message: editingTemplate ? '템플릿이 수정되었습니다.' : '템플릿이 저장되었습니다.'
      });

      setShowForm(false);
      resetForm();
      await loadTemplates();
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      addNotification({
        type: 'error',
        title: '저장 실패',
        message: '템플릿 저장에 실패했습니다.'
      });
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (template: PromptTemplate) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await databaseService.deletePromptTemplate(template.id);
      addNotification({
        type: 'success',
        title: '삭제 완료',
        message: '템플릿이 삭제되었습니다.'
      });
      await loadTemplates();
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '템플릿 삭제에 실패했습니다.'
      });
    }
  };

  // 템플릿 편집
  const handleEditTemplate = (template: PromptTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      templateData: template.templateData,
      isPublic: template.isPublic
    });
    setEditingTemplate(template);
    setShowForm(true);
  };

  // 템플릿 복사
  const handleCopyTemplate = (template: PromptTemplate) => {
    navigator.clipboard.writeText(template.templateData.prompt);
    addNotification({
      type: 'success',
      title: '복사 완료',
      message: '템플릿이 클립보드에 복사되었습니다.'
    });
  };

  // 템플릿 미리보기
  const handlePreviewTemplate = (template: PromptTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  // 템플릿 내보내기
  const handleExportTemplate = (template: PromptTemplate) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      templateData: template.templateData,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${template.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 템플릿 가져오기
  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        setFormData({
          name: importData.name,
          description: importData.description || '',
          category: importData.category,
          templateData: importData.templateData,
          isPublic: false
        });
        setShowForm(true);
      } catch (error) {
        console.error('템플릿 가져오기 실패:', error);
        addNotification({
          type: 'error',
          title: '가져오기 실패',
          message: '템플릿 파일 형식이 올바르지 않습니다.'
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="프롬프트 템플릿 관리" size="xl">
        <div className="space-y-6">
          {/* 검색 및 필터 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="템플릿 검색..."
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 카테고리</option>
                {defaultCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'custom' ? '커스텀' :
                     category === 'story' ? '스토리' :
                     category === 'character' ? '캐릭터' :
                     category === 'scenario' ? '시나리오' :
                     category === 'dialogue' ? '대화' :
                     category === 'image-generation' ? '이미지 생성' :
                     category === 'video-generation' ? '영상 생성' : category}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => setShowForm(true)}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 템플릿
              </Button>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                <Upload className="w-4 h-4" />
                가져오기
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTemplate}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 템플릿 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">로딩 중...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">템플릿이 없습니다.</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate flex-1">
                      {template.name}
                    </h4>
                    {template.isPublic && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        공개
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {template.description || '설명 없음'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {template.category}
                    </span>
                    <span>
                      {template.userName && template.userName !== '관리자' ? template.userName : '내 템플릿'}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      onClick={() => handlePreviewTemplate(template)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleCopyTemplate(template)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleExportTemplate(template)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    {template.userId === userId && (
                      <>
                        <Button
                          onClick={() => handleEditTemplate(template)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteTemplate(template)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {onTemplateSelect && (
                      <Button
                        onClick={() => onTemplateSelect(template)}
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        선택
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* 템플릿 생성/편집 모달 */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingTemplate ? '템플릿 편집' : '새 템플릿 만들기'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="템플릿 이름"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="템플릿 이름을 입력하세요"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (선택)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="템플릿에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {defaultCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'custom' ? '커스텀' :
                   category === 'story' ? '스토리' :
                   category === 'character' ? '캐릭터' :
                   category === 'scenario' ? '시나리오' :
                   category === 'dialogue' ? '대화' :
                   category === 'image-generation' ? '이미지 생성' :
                   category === 'video-generation' ? '영상 생성' : category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프롬프트 템플릿 *
            </label>
            <textarea
              value={formData.templateData.prompt}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                templateData: { ...prev.templateData, prompt: e.target.value }
              }))}
              placeholder="{placeholder} 형태로 변수를 사용할 수 있습니다"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              예: "다음 스토리를 바탕으로 &#123;type&#125;을(를) 생성해주세요: &#123;content&#125;"
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                다른 사용자에게 공개
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              저장
            </Button>
          </div>
        </div>
      </Modal>

      {/* 템플릿 미리보기 모달 */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="템플릿 미리보기"
        size="lg"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{previewTemplate.name}</h4>
              <p className="text-sm text-gray-600">{previewTemplate.description}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">{previewTemplate.category}</span>
              <span>•</span>
              <span>{previewTemplate.userName || '내 템플릿'}</span>
              {previewTemplate.isPublic && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">공개</span>
                </>
              )}
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-2">프롬프트 내용</h5>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {previewTemplate.templateData.prompt}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => handleCopyTemplate(previewTemplate)}
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                복사
              </Button>
              {onTemplateSelect && (
                <Button
                  onClick={() => {
                    onTemplateSelect(previewTemplate);
                    setShowPreview(false);
                  }}
                  variant="primary"
                >
                  선택
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PromptTemplateManager;