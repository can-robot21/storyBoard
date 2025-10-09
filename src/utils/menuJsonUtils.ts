// 메뉴별 JSON 구조 및 참조 기능 개선
import { GeneratedProjectData, GeneratedCharacter, GeneratedBackground, GeneratedSettingCut, GeneratedTextCard, GeneratedImage, GeneratedVideo } from '../types/project';

export interface MenuJsonStructure {
  project: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    version: string;
  };
  story: {
    originalStory: string;
    summary: string;
    scenario: string;
    characterList: Array<{ id: number; name: string; description: string }>;
  };
  images: {
    characters: GeneratedCharacter[];
    backgrounds: GeneratedBackground[];
    settingCuts: GeneratedSettingCut[];
    metadata: {
      totalCharacters: number;
      totalBackgrounds: number;
      totalSettingCuts: number;
    };
  };
  videos: {
    textCards: GeneratedTextCard[];
    characterImages: GeneratedImage[];
    videoBackgrounds: GeneratedImage[];
    videos: GeneratedVideo[];
    metadata: {
      totalTextCards: number;
      totalCharacterImages: number;
      totalVideoBackgrounds: number;
      totalVideos: number;
    };
  };
  data: {
    jsonCards: any[];
    rawData: any;
    exportData: any;
  };
}

export interface ReferenceData {
  id: string;
  type: 'project' | 'images' | 'videos' | 'data';
  title: string;
  description: string;
  data: any;
  metadata: {
    size: number;
    lastModified: string;
    version: string;
  };
}

/**
 * 프로젝트 데이터를 메뉴별 JSON 구조로 변환
 */
export const convertToMenuJsonStructure = (
  projectData: {
    story?: string;
    storySummary?: string;
    characterList?: Array<{ id: number; name: string; description: string }>;
    finalScenario?: string;
    generatedProjectData?: GeneratedProjectData;
    generatedCharacters?: GeneratedCharacter[];
    generatedBackgrounds?: GeneratedBackground[];
    generatedSettingCuts?: GeneratedSettingCut[];
    generatedTextCards?: GeneratedTextCard[];
    generatedCharacterImages?: GeneratedImage[];
    generatedVideoBackgrounds?: GeneratedImage[];
    generatedVideos?: GeneratedVideo[];
  }
): MenuJsonStructure => {
  const now = new Date().toISOString();
  
  return {
    project: {
      id: generateProjectId(),
      title: 'StoryBoard Project',
      description: 'AI Generated StoryBoard',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0'
    },
    story: {
      originalStory: projectData.story || '',
      summary: projectData.storySummary || '',
      scenario: projectData.finalScenario || '',
      characterList: projectData.characterList || []
    },
    images: {
      characters: projectData.generatedCharacters || [],
      backgrounds: projectData.generatedBackgrounds || [],
      settingCuts: projectData.generatedSettingCuts || [],
      metadata: {
        totalCharacters: projectData.generatedCharacters?.length || 0,
        totalBackgrounds: projectData.generatedBackgrounds?.length || 0,
        totalSettingCuts: projectData.generatedSettingCuts?.length || 0
      }
    },
    videos: {
      textCards: projectData.generatedTextCards || [],
      characterImages: projectData.generatedCharacterImages || [],
      videoBackgrounds: projectData.generatedVideoBackgrounds || [],
      videos: projectData.generatedVideos || [],
      metadata: {
        totalTextCards: projectData.generatedTextCards?.length || 0,
        totalCharacterImages: projectData.generatedCharacterImages?.length || 0,
        totalVideoBackgrounds: projectData.generatedVideoBackgrounds?.length || 0,
        totalVideos: projectData.generatedVideos?.length || 0
      }
    },
    data: {
      jsonCards: projectData.generatedTextCards || [],
      rawData: projectData.generatedProjectData || {},
      exportData: {
        format: 'json',
        exportedAt: now,
        version: '1.0.0'
      }
    }
  };
};

/**
 * 메뉴별 참조 데이터 생성
 */
export const generateMenuReferenceData = (
  menuStructure: MenuJsonStructure
): ReferenceData[] => {
  const references: ReferenceData[] = [];

  // 프로젝트 정보 참조
  references.push({
    id: 'project-info',
    type: 'project',
    title: '프로젝트 정보',
    description: '프로젝트 기본 정보 및 메타데이터',
    data: menuStructure.project,
    metadata: {
      size: JSON.stringify(menuStructure.project).length,
      lastModified: menuStructure.project.updatedAt,
      version: menuStructure.project.version
    }
  });

  // 스토리 정보 참조
  references.push({
    id: 'story-info',
    type: 'project',
    title: '스토리 정보',
    description: '스토리, 시나리오, 캐릭터 정보',
    data: menuStructure.story,
    metadata: {
      size: JSON.stringify(menuStructure.story).length,
      lastModified: menuStructure.project.updatedAt,
      version: menuStructure.project.version
    }
  });

  // 이미지 데이터 참조
  if (menuStructure.images.metadata.totalCharacters > 0 || 
      menuStructure.images.metadata.totalBackgrounds > 0 || 
      menuStructure.images.metadata.totalSettingCuts > 0) {
    references.push({
      id: 'images-data',
      type: 'images',
      title: '이미지 데이터',
      description: '생성된 모든 이미지 데이터',
      data: menuStructure.images,
      metadata: {
        size: JSON.stringify(menuStructure.images).length,
        lastModified: menuStructure.project.updatedAt,
        version: menuStructure.project.version
      }
    });
  }

  // 영상 데이터 참조
  if (menuStructure.videos.metadata.totalTextCards > 0 || 
      menuStructure.videos.metadata.totalCharacterImages > 0 || 
      menuStructure.videos.metadata.totalVideoBackgrounds > 0 || 
      menuStructure.videos.metadata.totalVideos > 0) {
    references.push({
      id: 'videos-data',
      type: 'videos',
      title: '영상 데이터',
      description: '생성된 모든 영상 관련 데이터',
      data: menuStructure.videos,
      metadata: {
        size: JSON.stringify(menuStructure.videos).length,
        lastModified: menuStructure.project.updatedAt,
        version: menuStructure.project.version
      }
    });
  }

  // 원시 데이터 참조
  references.push({
    id: 'raw-data',
    type: 'data',
    title: '원시 데이터',
    description: 'JSON 카드 및 원시 프로젝트 데이터',
    data: menuStructure.data,
    metadata: {
      size: JSON.stringify(menuStructure.data).length,
      lastModified: menuStructure.project.updatedAt,
      version: menuStructure.project.version
    }
  });

  return references;
};

/**
 * 프로젝트 ID 생성
 */
export const generateProjectId = (): string => {
  return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * JSON 구조 검증
 */
export const validateMenuJsonStructure = (data: any): data is MenuJsonStructure => {
  return (
    data &&
    typeof data === 'object' &&
    data.project &&
    data.story &&
    data.images &&
    data.videos &&
    data.data &&
    typeof data.project.id === 'string' &&
    typeof data.project.title === 'string' &&
    typeof data.project.version === 'string'
  );
};

/**
 * 참조 데이터 검증
 */
export const validateReferenceData = (data: any): data is ReferenceData => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    ['project', 'images', 'videos', 'data'].includes(data.type) &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    data.data &&
    data.metadata &&
    typeof data.metadata.size === 'number' &&
    typeof data.metadata.lastModified === 'string' &&
    typeof data.metadata.version === 'string'
  );
};

/**
 * 메뉴별 데이터 필터링
 */
export const filterMenuData = (
  menuStructure: MenuJsonStructure,
  menuType: 'project' | 'images' | 'videos' | 'data'
): any => {
  switch (menuType) {
    case 'project':
      return {
        project: menuStructure.project,
        story: menuStructure.story
      };
    case 'images':
      return menuStructure.images;
    case 'videos':
      return menuStructure.videos;
    case 'data':
      return menuStructure.data;
    default:
      return menuStructure;
  }
};

/**
 * 데이터 크기 계산 (KB 단위)
 */
export const calculateDataSizeKB = (data: any): number => {
  const jsonString = JSON.stringify(data);
  return Math.round(new Blob([jsonString]).size / 1024 * 100) / 100;
};

/**
 * 데이터 압축률 계산
 */
export const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return Math.round((1 - compressedSize / originalSize) * 100);
};

/**
 * 메뉴별 통계 생성
 */
export const generateMenuStatistics = (menuStructure: MenuJsonStructure) => {
  return {
    project: {
      totalSize: calculateDataSizeKB(menuStructure.project),
      lastModified: menuStructure.project.updatedAt,
      version: menuStructure.project.version
    },
    story: {
      totalSize: calculateDataSizeKB(menuStructure.story),
      characterCount: menuStructure.story.characterList.length,
      hasScenario: !!menuStructure.story.scenario
    },
    images: {
      totalSize: calculateDataSizeKB(menuStructure.images),
      totalItems: menuStructure.images.metadata.totalCharacters + 
                  menuStructure.images.metadata.totalBackgrounds + 
                  menuStructure.images.metadata.totalSettingCuts,
      ...menuStructure.images.metadata
    },
    videos: {
      totalSize: calculateDataSizeKB(menuStructure.videos),
      totalItems: menuStructure.videos.metadata.totalTextCards + 
                  menuStructure.videos.metadata.totalCharacterImages + 
                  menuStructure.videos.metadata.totalVideoBackgrounds + 
                  menuStructure.videos.metadata.totalVideos,
      ...menuStructure.videos.metadata
    },
    data: {
      totalSize: calculateDataSizeKB(menuStructure.data),
      jsonCardCount: menuStructure.data.jsonCards.length,
      hasRawData: !!menuStructure.data.rawData
    }
  };
};
