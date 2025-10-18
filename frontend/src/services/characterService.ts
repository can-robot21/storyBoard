import { apiService } from './api';
import { mockApiService } from './mockApi';

interface CharacterInput {
  description: string;
  style: string;
  attachedImages?: File[];
}

interface CharacterOutput {
  character: {
    id: string;
    name: string;
    description: string;
    style: string;
    imageUrl: string;
    attachedImages: File[];
    createdAt: string;
  };
  success: boolean;
  message?: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  style: '애니메이션' | '사실적' | '만화' | '픽사';
  imageUrl: string;
  attachedImages: File[];
  createdAt: string;
}

export class CharacterService {
  async generateCharacter(input: CharacterInput): Promise<CharacterOutput> {
    // Mock response for development
    return {
      character: {
        id: `char_${Date.now()}`,
        name: '생성된 캐릭터',
        description: input.description,
        style: input.style,
        imageUrl: 'https://via.placeholder.com/300x300?text=Character',
        attachedImages: input.attachedImages || [],
        createdAt: new Date().toISOString(),
      },
      success: true,
      message: '캐릭터가 성공적으로 생성되었습니다.',
    };
  }

  async uploadReferenceImage(
    projectId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const response = await apiService.uploadFile<{ image_url: string }>(
      `/characters/${projectId}/upload-reference`,
      file,
      onProgress
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to upload reference image');
    }

    return response.data!.image_url;
  }

  async getCharacter(characterId: string): Promise<Character> {
    const response = await apiService.get<Character>(`/characters/${characterId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get character');
    }

    return response.data!;
  }

  async updateCharacter(characterId: string, updates: Partial<Character>): Promise<Character> {
    const response = await apiService.put<Character>(`/characters/${characterId}`, updates);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update character');
    }

    return response.data!;
  }

  async deleteCharacter(characterId: string): Promise<void> {
    const response = await apiService.delete(`/characters/${characterId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete character');
    }
  }

  async getProjectCharacters(projectId: string): Promise<Character[]> {
    const response = await apiService.get<Character[]>(`/characters/project/${projectId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get project characters');
    }

    return response.data!;
  }
}

export const characterService = new CharacterService();
