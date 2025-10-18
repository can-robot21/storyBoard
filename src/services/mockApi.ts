// Mock API implementation for development and testing
import { CharacterInput, CharacterOutput, StoryInput, StoryOutput, StoryboardInput, StoryboardOutput, VideoInput, VideoOutput } from '../types/api';

class MockApiService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async generateCharacter(input: CharacterInput): Promise<CharacterOutput> {
    await this.delay(2000); // Simulate API delay
    
    return {
      output: {
        character_id: `char_${Date.now()}`,
        image_url: `https://via.placeholder.com/400x600/3b82f6/ffffff?text=${encodeURIComponent(input.input.description.slice(0, 20))}`,
        meta: {
          model: 'stable-diffusion-v1.5',
          tokens_used: Math.floor(Math.random() * 200) + 100,
        },
      },
      status: 'success',
    };
  }

  async generateStory(input: StoryInput): Promise<StoryOutput> {
    await this.delay(3000);
    
    const stories = {
      'bright_warm': `옛날에 작은 로봇이 있었어요. 이 로봇의 이름은 '아이'였습니다.

아이는 매일 같은 일을 반복하며 살았어요. 아침에 일어나서, 점심을 먹고, 저녁에 잠들었습니다. 하지만 아이는 뭔가 다른 것을 원했어요.

어느 날, 아이는 창문 밖으로 나가고 싶어졌어요. 하지만 로봇은 밖에 나갈 수 없다고 들었어요.

그래도 아이는 용기를 내어 문을 열고 밖으로 나갔어요. 그리고 세상이 얼마나 아름다운지 깨달았어요.

아이는 이제 매일 새로운 모험을 떠나며 행복하게 살았어요.`,
      'mysterious': `깊은 숲 속에 오래된 성이 있었습니다. 그 성에는 아무도 살지 않는다고 했어요.

하지만 어느 날 밤, 성에서 이상한 빛이 나오기 시작했어요. 그 빛을 따라간 소년은 성 안에서 놀라운 비밀을 발견하게 됩니다.

성의 주인은 마법사였고, 소년에게 특별한 능력을 선물해주었어요. 이제 소년은 마법의 세계로의 여행을 시작합니다.`,
      'adventurous': `바다의 용사 '해적왕'이 되고 싶은 소년이 있었어요. 하지만 그는 배도 없고, 선원도 없었습니다.

그래도 포기하지 않고 작은 배를 만들기 시작했어요. 나무를 구하고, 돛을 만들고, 나침반을 준비했어요.

드디어 바다로 나간 소년은 폭풍과 괴물들을 만나지만, 용기와 지혜로 모든 시험을 통과합니다.

마침내 그는 진정한 해적왕이 되어 바다를 누비며 모험을 계속합니다.`,
    };

    const storyText = stories[input.input.tone as keyof typeof stories] || stories['bright_warm'];
    
    return {
      output: {
        script_id: `script_${Date.now()}`,
        text: storyText,
        tokens_used: Math.floor(Math.random() * 500) + 300,
      },
      status: 'success',
    };
  }

  async generateStoryboard(input: StoryboardInput): Promise<StoryboardOutput> {
    await this.delay(4000);
    
    const cuts = Array.from({ length: input.input.cuts }, (_, i) => ({
      cut_no: i + 1,
      image_url: `https://via.placeholder.com/400x300/3b82f6/ffffff?text=Cut+${i + 1}`,
      description: `컷 ${i + 1}: ${this.getCutDescription(i + 1, input.input.cuts)}`,
    }));

    return {
      output: {
        storyboard_id: `storyboard_${Date.now()}`,
        cuts,
        pdf_url: `https://via.placeholder.com/800x600/ffffff/000000?text=Storyboard+PDF`,
        tokens_used: Math.floor(Math.random() * 800) + 500,
      },
      status: 'success',
    };
  }

  async generateVideo(input: VideoInput): Promise<VideoOutput> {
    await this.delay(10000); // Longer delay for video generation
    
    return {
      output: {
        video_id: `video_${Date.now()}`,
        video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: '3분 20초',
        tokens_used: Math.floor(Math.random() * 1000) + 800,
      },
      status: 'success',
    };
  }

  private getCutDescription(cutNumber: number, totalCuts: number): string {
    const descriptions = [
      '주인공 등장',
      '배경 설명',
      '갈등 시작',
      '위기 상황',
      '절정',
      '해결',
      '결말',
      '에필로그',
    ];
    
    if (cutNumber <= descriptions.length) {
      return descriptions[cutNumber - 1];
    }
    
    return `장면 ${cutNumber}`;
  }

  // Simulate file upload
  async uploadFile(file: File): Promise<{ image_url: string }> {
    await this.delay(1000);
    
    return {
      image_url: URL.createObjectURL(file),
    };
  }

  // Simulate project save
  async saveProject(project: any): Promise<{ success: boolean }> {
    await this.delay(500);
    
    // In a real app, this would save to a database
    localStorage.setItem('saved_project', JSON.stringify(project));
    
    return { success: true };
  }

  // Simulate project load
  async loadProject(projectId: string): Promise<any> {
    await this.delay(500);
    
    const saved = localStorage.getItem('saved_project');
    if (saved) {
      return JSON.parse(saved);
    }
    
    throw new Error('Project not found');
  }
}

export const mockApiService = new MockApiService();
