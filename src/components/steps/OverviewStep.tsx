import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';
import Input from '../common/Input';

const OverviewStep: React.FC = () => {
  const { currentProject, updateStep, createProject } = useProjectStore();
  const { addNotification } = useUIStore();
  
  const [formData, setFormData] = useState({
    title: currentProject?.steps.overview.title || '',
    description: currentProject?.steps.overview.description || '',
    story: currentProject?.steps.overview.data.story || '',
    character: currentProject?.steps.overview.data.character || '',
    storyText: currentProject?.steps.overview.data.storyText || '',
    genre: '',
    target_audience: '',
    duration: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    if (!currentProject) {
      // Create new project
      createProject(formData.title || '새 프로젝트');
    }
    
    updateStep('overview', formData);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 개요가 저장되었습니다.',
    });
  };

  const handleNext = () => {
    handleSave();
    // Move to next step
    // This would be handled by the parent component or store
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 개요</h1>
        <p className="text-gray-600">프로젝트의 기본 정보를 입력하세요.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="프로젝트 제목"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="프로젝트 제목을 입력하세요"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트 설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <Input
              label="장르"
              name="genre"
              value={formData.genre}
              onChange={handleInputChange}
              placeholder="예: 애니메이션, 교육용, 광고"
            />
          </div>

          <div>
            <Input
              label="타겟 오디언스"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleInputChange}
              placeholder="예: 유아, 청소년, 성인"
            />
          </div>

          <div>
            <Input
              label="예상 영상 길이"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="예: 3분, 5분, 10분"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <Button variant="outline" onClick={() => console.log('Cancel')}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSave}>
            저장
          </Button>
          <Button variant="primary" onClick={handleNext}>
            다음 단계
          </Button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 명확하고 구체적인 제목을 사용하세요</li>
          <li>• 타겟 오디언스를 명확히 정의하면 더 정확한 콘텐츠를 생성할 수 있습니다</li>
          <li>• 영상 길이를 미리 정해두면 스토리 구성에 도움이 됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default OverviewStep;
