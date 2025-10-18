import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { characterService } from '../../services/characterService';
import Button from '../common/Button';
import Input from '../common/Input';

const CHARACTER_STYLES = [
  { value: '애니메이션', label: '애니메이션 스타일' },
  { value: '사실적', label: '사실적 스타일' },
  { value: '만화', label: '만화 스타일' },
  { value: '픽사', label: '픽사 스타일' },
] as const;

const CharacterStep: React.FC = () => {
  const { currentProject, updateStep } = useProjectStore();
  const { addNotification } = useUIStore();
  
  const [formData, setFormData] = useState({
    description: '',
    style: 'anime',
    referenceImages: [] as File[],
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      referenceImages: [...prev.referenceImages, ...files]
    }));
  };

  const handleGenerateCharacter = async () => {
    if (!formData.description.trim()) {
      addNotification({
        type: 'error',
        title: '입력 오류',
        message: '캐릭터 설명을 입력해주세요.',
      });
      return;
    }

    if (!currentProject) {
      addNotification({
        type: 'error',
        title: '프로젝트 필요',
        message: '먼저 프로젝트를 생성해주세요.',
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await characterService.generateCharacter({
        description: formData.description,
        style: formData.style,
        attachedImages: formData.referenceImages,
      });
      
      const newCharacter = {
        id: result.character.id,
        name: '생성된 캐릭터',
        description: formData.description,
        style: formData.style as '애니메이션' | '사실적' | '만화' | '픽사',
        imageUrl: result.character.imageUrl,
        attachedImages: formData.referenceImages,
        createdAt: new Date().toISOString(),
      };

      const currentCharacters = currentProject.data.generatedCharacters || [];
      updateStep('이미지 생성', {
        generatedCharacters: [...currentCharacters, newCharacter]
      });

      addNotification({
        type: 'success',
        title: '캐릭터 생성 완료',
        message: 'AI가 캐릭터를 성공적으로 생성했습니다.',
      });

      // Reset form
      setFormData({
        description: '',
        style: 'anime',
        referenceImages: [],
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '생성 실패',
        message: '캐릭터 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const characters = currentProject?.data.generatedCharacters || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">캐릭터 설정</h1>
        <p className="text-gray-600">AI를 활용하여 캐릭터를 생성하고 관리하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Character Generation Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">새 캐릭터 생성</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                캐릭터 설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="캐릭터의 외모, 성격, 특징을 자세히 설명해주세요"
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                스타일
              </label>
              <select
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {CHARACTER_STYLES.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                참조 이미지 (선택사항)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              {formData.referenceImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">업로드된 파일:</p>
                  <ul className="text-sm text-gray-500">
                    {formData.referenceImages.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateCharacter}
              loading={isGenerating}
              className="w-full"
            >
              {isGenerating ? '캐릭터 생성 중...' : '캐릭터 생성'}
            </Button>
          </div>
        </div>

        {/* Generated Characters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">생성된 캐릭터</h2>
          
          {characters.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-gray-500">아직 생성된 캐릭터가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {characters.map((character: any) => (
                <div key={character.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={character.imageUrl}
                      alt={character.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{character.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{character.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {CHARACTER_STYLES.find(s => s.value === character.style)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 구체적이고 자세한 설명을 입력하면 더 정확한 캐릭터가 생성됩니다</li>
          <li>• 참조 이미지를 업로드하면 원하는 스타일에 더 가까운 결과를 얻을 수 있습니다</li>
          <li>• 여러 캐릭터를 생성하여 다양한 옵션을 비교해보세요</li>
        </ul>
      </div>
    </div>
  );
};

export default CharacterStep;
