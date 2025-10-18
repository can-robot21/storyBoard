import React, { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';
import Input from '../common/Input';

const ProjectOverview: React.FC = () => {
  const { addNotification } = useUIStore();
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    genre: '',
    targetAudience: '',
    duration: '',
    budget: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    if (!formData.projectName.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '프로젝트명을 입력해주세요.',
      });
      return;
    }

    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 개요가 저장되었습니다.',
    });
  };

  const handleNext = () => {
    handleSave();
    addNotification({
      type: 'info',
      title: '다음 단계',
      message: '캐릭터 설정 단계로 이동합니다.',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">프로젝트 개요</h2>
        <p className="text-gray-600">프로젝트의 기본 정보를 설정하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="프로젝트명 *"
            name="projectName"
            value={formData.projectName}
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
            name="targetAudience"
            value={formData.targetAudience}
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

        <div>
          <Input
            label="예산"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            placeholder="예: $1000, 무제한"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
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
  );
};

export default ProjectOverview;
