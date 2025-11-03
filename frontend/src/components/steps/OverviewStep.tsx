import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';
import Input from '../common/Input';
import { GoogleAIService } from '../../services/googleAIService';

const OverviewStep: React.FC = () => {
  const { currentProject, updateStep, createProject } = useProjectStore();
  const { addNotification } = useUIStore();
  
  // 로그인 상태 확인 및 API 키 가져오기
  const getAPIKey = (): string => {
    try {
      if (typeof window === 'undefined') return '';
      
      // 현재 사용자 확인
      const currentUserRaw = localStorage.getItem('storyboard_current_user');
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      
      if (!currentUser) {
        console.log('🔑 API 키 로딩: 미설정 (로그인 필요)');
        return '';
      }
      
      // 사용자 API 키 확인
      if (currentUser?.apiKeys?.google) {
        return currentUser.apiKeys.google;
      }
      
      // 로컬 저장소에서 API 키 확인
      const localKeysRaw = localStorage.getItem('user_api_keys');
      if (localKeysRaw) {
        const localKeys = JSON.parse(localKeysRaw);
        if (localKeys?.google) {
          return localKeys.google;
        }
      }
      
      console.log('🔑 API 키 로딩: 미설정');
      return '';
    } catch (error) {
      console.error('API 키 로딩 오류:', error);
      return '';
    }
  };
  
  const [formData, setFormData] = useState({
    title: currentProject?.name || '',
    description: currentProject?.description || '',
    story: currentProject?.data.story || '',
    character: '',
    storyText: '',
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
    
    updateStep('프로젝트 개요', formData);
    addNotification({
      type: 'success',
      title: '저장 완료',
      message: '프로젝트 개요가 저장되었습니다.',
    });
  };

  const [generatedPrompts, setGeneratedPrompts] = useState({
    storyPrompt: '',
    characterPrompt: '',
    scenarioPrompt: ''
  });

  const [isGenerating, setIsGenerating] = useState({
    story: false,
    character: false,
    scenario: false
  });

  // AI 프롬프트 생성 함수들
  const handleGenerateStoryPrompt = async () => {
    if (!formData.story || !formData.character) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리와 캐릭터 정보를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGenerating(prev => ({ ...prev, story: true }));
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const prompt = await googleAIService.generateStoryPrompt(
        formData.story,
        formData.character,
        formData.genre,
        formData.target_audience
      );
      setGeneratedPrompts(prev => ({ ...prev, storyPrompt: prompt }));
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '스토리 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '스토리 프롬프트 생성에 실패했습니다.',
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, story: false }));
    }
  };

  const handleGenerateCharacterPrompt = async () => {
    if (!formData.character) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 정보를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGenerating(prev => ({ ...prev, character: true }));
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const prompt = await googleAIService.generateCharacterPrompt(
        formData.character,
        '애니메이션' // 기본 스타일
      );
      setGeneratedPrompts(prev => ({ ...prev, characterPrompt: prompt }));
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '캐릭터 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 프롬프트 생성에 실패했습니다.',
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, character: false }));
    }
  };

  const handleGenerateScenarioPrompt = async () => {
    if (!formData.story) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '스토리 정보를 먼저 입력해주세요.',
      });
      return;
    }

    setIsGenerating(prev => ({ ...prev, scenario: true }));
    try {
      const apiKey = getAPIKey();
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다. 로그인 후 설정에서 API 키를 입력해주세요.');
      }
      const googleAIService = GoogleAIService.getInstance();
      const prompt = await googleAIService.generateScenarioPrompt(
        formData.story,
        5 // 기본 컷 수
      );
      setGeneratedPrompts(prev => ({ ...prev, scenarioPrompt: prompt }));
      addNotification({
        type: 'success',
        title: '생성 완료',
        message: '시나리오 프롬프트가 생성되었습니다.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '시나리오 프롬프트 생성에 실패했습니다.',
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, scenario: false }));
    }
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

        {/* AI 생성 결과 표시 */}
        {(generatedPrompts.storyPrompt || generatedPrompts.characterPrompt || generatedPrompts.scenarioPrompt) && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 생성 결과</h3>
            
            {generatedPrompts.storyPrompt && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">스토리 프롬프트</h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{generatedPrompts.storyPrompt}</pre>
                </div>
              </div>
            )}

            {generatedPrompts.characterPrompt && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">캐릭터 프롬프트</h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{generatedPrompts.characterPrompt}</pre>
                </div>
              </div>
            )}

            {generatedPrompts.scenarioPrompt && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">시나리오 프롬프트</h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{generatedPrompts.scenarioPrompt}</pre>
                </div>
              </div>
            )}
          </div>
        )}

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
