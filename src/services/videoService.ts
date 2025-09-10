import { apiService } from './api';
import { VideoInput, VideoOutput } from '../types/api';

export class VideoService {
  async generateVideo(input: VideoInput): Promise<VideoOutput> {
    const response = await apiService.post<VideoOutput>('/videos/generate', input);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate video');
    }

    return response.data!;
  }

  async getVideo(videoId: string): Promise<VideoOutput> {
    const response = await apiService.get<VideoOutput>(`/videos/${videoId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get video');
    }

    return response.data!;
  }

  async deleteVideo(videoId: string): Promise<void> {
    const response = await apiService.delete(`/videos/${videoId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete video');
    }
  }

  async getVideoStatus(videoId: string): Promise<{ status: 'processing' | 'completed' | 'failed', progress?: number }> {
    const response = await apiService.get<{ status: string, progress?: number }>(`/videos/${videoId}/status`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get video status');
    }

    return {
      status: response.data!.status as 'processing' | 'completed' | 'failed',
      progress: response.data!.progress,
    };
  }

  async downloadVideo(videoId: string): Promise<string> {
    const response = await apiService.get<{ download_url: string }>(`/videos/${videoId}/download`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get video download URL');
    }

    return response.data!.download_url;
  }

  async getProjectVideos(projectId: string): Promise<VideoOutput[]> {
    const response = await apiService.get<VideoOutput[]>(`/videos/project/${projectId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to get project videos');
    }

    return response.data!;
  }
}

export const videoService = new VideoService();
