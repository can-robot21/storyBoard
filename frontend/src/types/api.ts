export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Character API Types
export interface CharacterInput {
  project_id: string;
  step: 'character';
  input: {
    description: string;
    style: string;
    reference_images?: string[];
  };
}

export interface CharacterOutput {
  output: {
    character_id: string;
    image_url: string;
    meta: {
      model: string;
      tokens_used: number;
    };
  };
  status: 'success' | 'error';
}

// Story API Types
export interface StoryInput {
  project_id: string;
  step: 'story';
  input: {
    theme: string;
    tone: string;
    length: string;
  };
}

export interface StoryOutput {
  output: {
    script_id: string;
    text: string;
    tokens_used: number;
  };
  status: 'success' | 'error';
}

// Storyboard API Types
export interface StoryboardInput {
  project_id: string;
  step: 'storyboard';
  input: {
    script_id: string;
    cuts: number;
    style: string;
    export_format: 'pdf' | 'png' | 'jpg';
  };
}

export interface StoryboardOutput {
  output: {
    storyboard_id: string;
    cuts: Array<{
      cut_no: number;
      image_url: string;
      description: string;
    }>;
    pdf_url?: string;
    tokens_used: number;
  };
  status: 'success' | 'error';
}

// Video Generation API Types
export interface VideoInput {
  project_id: string;
  step: 'video_generation';
  input: {
    storyboard_id: string;
    voiceover: string;
    background_music: string;
    resolution: string;
  };
}

export interface VideoOutput {
  output: {
    video_id: string;
    video_url: string;
    duration: string;
    tokens_used: number;
  };
  status: 'success' | 'error';
}
