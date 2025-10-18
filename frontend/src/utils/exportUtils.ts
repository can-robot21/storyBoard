// 프로젝트 내보내기 유틸리티
import { GeneratedProjectData, GeneratedCharacter, GeneratedBackground, GeneratedSettingCut, GeneratedImage, GeneratedVideo } from '../types/project';

export interface ExportOptions {
  includeMetadata: boolean;
  includeImages: boolean;
  includeVideos: boolean;
  format: 'json' | 'txt' | 'pdf';
  compression: boolean;
}

export interface ProjectExportData {
  projectInfo: {
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
  };
  characters: GeneratedCharacter[];
  backgrounds: GeneratedBackground[];
  settingCuts: GeneratedSettingCut[];
  images: GeneratedImage[];
  videos: GeneratedVideo[];
  metadata: {
    totalCharacters: number;
    totalBackgrounds: number;
    totalSettingCuts: number;
    totalImages: number;
    totalVideos: number;
    estimatedDuration: number;
  };
}

/**
 * 프로젝트 데이터를 TXT 형식으로 변환
 */
export const generateTxtExport = (data: ProjectExportData, options: ExportOptions): string => {
  let content = '';

  // 헤더
  content += '='.repeat(80) + '\n';
  content += `스토리보드 프로젝트: ${data.projectInfo.title}\n`;
  content += '='.repeat(80) + '\n\n';

  // 프로젝트 정보
  if (options.includeMetadata) {
    content += '📋 프로젝트 정보\n';
    content += '-'.repeat(40) + '\n';
    content += `제목: ${data.projectInfo.title}\n`;
    content += `설명: ${data.projectInfo.description}\n`;
    content += `생성일: ${data.projectInfo.createdAt}\n`;
    content += `수정일: ${data.projectInfo.updatedAt}\n`;
    content += `버전: ${data.projectInfo.version}\n\n`;
  }

  // 스토리 정보
  content += '📖 스토리 정보\n';
  content += '-'.repeat(40) + '\n';
  content += `원본 스토리:\n${data.story.originalStory}\n\n`;
  content += `스토리 요약:\n${data.story.summary}\n\n`;
  content += `시나리오:\n${data.story.scenario}\n\n`;

  // 캐릭터 정보
  if (data.characters.length > 0) {
    content += '👥 캐릭터 정보\n';
    content += '-'.repeat(40) + '\n';
    data.characters.forEach((character, index) => {
      content += `${index + 1}. 캐릭터 ${index + 1}\n`;
      content += `   설명: ${character.description}\n`;
      content += `   이미지: [첨부됨]\n`;
      content += '\n';
    });
  }

  // 배경 정보
  if (data.backgrounds.length > 0) {
    content += '🏞️ 배경 정보\n';
    content += '-'.repeat(40) + '\n';
    data.backgrounds.forEach((background, index) => {
      content += `${index + 1}. 배경 ${index + 1}\n`;
      content += `   설명: ${background.description}\n`;
      content += `   이미지: [첨부됨]\n`;
      content += '\n';
    });
  }

  // 설정 컷 정보
  if (data.settingCuts.length > 0) {
    content += '🎬 설정 컷 정보\n';
    content += '-'.repeat(40) + '\n';
    data.settingCuts.forEach((cut, index) => {
      content += `${index + 1}. 설정 컷 ${index + 1}\n`;
      content += `   설명: ${cut.description}\n`;
      content += `   이미지: [첨부됨]\n`;
      content += '\n';
    });
  }

  // 생성된 이미지 정보
  if (options.includeImages && data.images.length > 0) {
    content += '🖼️ 생성된 이미지\n';
    content += '-'.repeat(40) + '\n';
    data.images.forEach((image, index) => {
      content += `${index + 1}. 이미지 ${index + 1}\n`;
      content += `   입력: ${image.input}\n`;
      content += `   생성일: ${image.timestamp}\n`;
      content += `   이미지: [첨부됨]\n\n`;
    });
  }

  // 생성된 영상 정보
  if (options.includeVideos && data.videos.length > 0) {
    content += '🎥 생성된 영상\n';
    content += '-'.repeat(40) + '\n';
    data.videos.forEach((video, index) => {
      content += `${index + 1}. 영상 ${index + 1}\n`;
      content += `   텍스트 카드: ${video.textCards.length}개\n`;
      content += `   캐릭터 이미지: ${video.characterImages.length}개\n`;
      content += `   배경: ${video.backgrounds.length}개\n`;
      content += `   비율: ${video.videoRatio}\n`;
      content += `   생성일: ${video.timestamp}\n`;
      content += `   영상: [첨부됨]\n\n`;
    });
  }

  // 메타데이터
  if (options.includeMetadata) {
    content += '📊 프로젝트 통계\n';
    content += '-'.repeat(40) + '\n';
    content += `총 캐릭터 수: ${data.metadata.totalCharacters}\n`;
    content += `총 배경 수: ${data.metadata.totalBackgrounds}\n`;
    content += `총 설정 컷 수: ${data.metadata.totalSettingCuts}\n`;
    content += `총 이미지 수: ${data.metadata.totalImages}\n`;
    content += `총 영상 수: ${data.metadata.totalVideos}\n`;
    content += `예상 총 길이: ${data.metadata.estimatedDuration}초\n\n`;
  }

  // 푸터
  content += '='.repeat(80) + '\n';
  content += `생성일: ${new Date().toLocaleString('ko-KR')}\n`;
  content += `StoryBoard AI - 스토리보드 생성 도구\n`;
  content += '='.repeat(80) + '\n';

  return content;
};

/**
 * 프로젝트 데이터를 JSON 형식으로 변환
 */
export const generateJsonExport = (data: ProjectExportData, options: ExportOptions): string => {
  const exportData = {
    ...data,
    exportOptions: options,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * 파일 다운로드 함수
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * 프로젝트 데이터를 내보내기 형식으로 변환
 */
export const convertProjectData = (
  projectData: GeneratedProjectData,
  options: ExportOptions
): ProjectExportData => {
  return {
    projectInfo: {
      title: 'StoryBoard Project',
      description: 'AI Generated StoryBoard',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
    story: {
      originalStory: '',
      summary: '',
      scenario: projectData.finalScenario || '',
    },
    characters: [],
    backgrounds: [],
    settingCuts: [],
    images: [],
    videos: [], // 비디오 데이터는 별도로 관리됨
    metadata: {
      totalCharacters: 0,
      totalBackgrounds: 0,
      totalSettingCuts: 0,
      totalImages: 0,
      totalVideos: 0,
      estimatedDuration: 0,
    },
  };
};

/**
 * 프로젝트 내보내기 실행
 */
export const exportProject = (
  projectData: GeneratedProjectData,
  options: ExportOptions,
  filename?: string
): void => {
  const exportData = convertProjectData(projectData, options);
  
  let content: string;
  let fileExtension: string;
  let mimeType: string;
  
  switch (options.format) {
    case 'txt':
      content = generateTxtExport(exportData, options);
      fileExtension = 'txt';
      mimeType = 'text/plain';
      break;
    case 'json':
      content = generateJsonExport(exportData, options);
      fileExtension = 'json';
      mimeType = 'application/json';
      break;
    default:
      content = generateTxtExport(exportData, options);
      fileExtension = 'txt';
      mimeType = 'text/plain';
  }
  
  const defaultFilename = `storyboard_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
  const finalFilename = filename || defaultFilename;
  
  downloadFile(content, finalFilename, mimeType);
};
