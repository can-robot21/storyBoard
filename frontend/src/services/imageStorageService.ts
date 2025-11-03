/**
 * 이미지 저장 정책 관리 서비스
 * - 현재 프로젝트와 직전 2개 프로젝트의 이미지만 스토리지에 저장
 * - 나머지는 링크 처리하여 저장 공간 절약
 */

export interface ImageStorageItem {
  id: string;
  projectId: string;
  imageType: 'character' | 'background' | 'settingCut';
  imageData: string; // Base64 데이터 또는 링크
  isStored: boolean; // 실제 저장 여부
  timestamp: number;
  metadata?: any;
}

export interface ProjectImageStorage {
  projectId: string;
  images: ImageStorageItem[];
  lastAccessed: number;
}

class ImageStorageService {
  private static instance: ImageStorageService;
  private readonly STORAGE_KEY = 'storyboard-image-storage';
  private readonly MAX_STORED_PROJECTS = 3; // 현재 + 직전 2개
  private readonly MAX_IMAGES_PER_PROJECT = 50; // 프로젝트당 최대 이미지 수

  private projectStorages: Map<string, ProjectImageStorage> = new Map();

  static getInstance(): ImageStorageService {
    if (!ImageStorageService.instance) {
      ImageStorageService.instance = new ImageStorageService();
    }
    return ImageStorageService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 이미지 저장 (정책에 따라 저장 또는 링크 처리)
   * @returns 저장된 이미지 ID와 삭제된 이미지 개수
   */
  async storeImage(
    projectId: string,
    imageType: 'character' | 'background' | 'settingCut',
    imageData: string,
    metadata?: any
  ): Promise<{ imageId: string; deletedImagesCount?: number }> {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // 현재 프로젝트의 이미지 수 확인
    const currentProjectStorage = this.projectStorages.get(projectId);
    const currentImageCount = currentProjectStorage?.images.length || 0;

    // 프로젝트당 최대 이미지 수 초과 시 오래된 이미지부터 링크 처리
    if (currentImageCount >= this.MAX_IMAGES_PER_PROJECT) {
      this.convertOldImagesToLinks(projectId);
    }

    // 저장 정책에 따라 처리
    const shouldStore = this.shouldStoreImage(projectId);
    
    const imageItem: ImageStorageItem = {
      id: imageId,
      projectId,
      imageType,
      imageData: shouldStore ? imageData : this.createImageLink(imageData),
      isStored: shouldStore,
      timestamp: Date.now(),
      metadata
    };

    // 프로젝트 스토리지에 추가
    if (!this.projectStorages.has(projectId)) {
      this.projectStorages.set(projectId, {
        projectId,
        images: [],
        lastAccessed: Date.now()
      });
    }

    const projectStorage = this.projectStorages.get(projectId)!;
    projectStorage.images.push(imageItem);
    projectStorage.lastAccessed = Date.now();

    // 저장 정책 업데이트
    this.updateStoragePolicy();

    // 로컬 스토리지에 저장 (용량 초과 시 오래된 이미지 자동 삭제)
    let deletedCount = 0;
    try {
      deletedCount = this.saveToStorage();
      if (deletedCount > 0) {
        // 삭제된 이미지가 있으면 알림을 위해 반환
        // 상위 컴포넌트에서 알림 표시 가능하도록 deletedCount를 포함한 객체 반환
        console.log(`✅ 오래된 이미지 ${deletedCount}개 삭제 후 저장 완료`);
      }
    } catch (error: any) {
      // localStorage 용량 초과 에러 처리 (삭제 후에도 실패한 경우)
      if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
        console.warn('⚠️ localStorage 용량이 초과되었습니다. 오래된 이미지를 삭제했지만 여전히 용량이 부족합니다.');
        // 저장 실패해도 이미지는 반환 (메모리에만 존재)
        // 사용자에게 알림은 상위 컴포넌트에서 처리
        throw new Error('localStorage 용량이 부족합니다. 브라우저 저장소를 수동으로 정리해주세요.');
      } else {
        throw error;
      }
    }

    console.log(`이미지 저장 완료: ${imageId} (${shouldStore ? '실제 저장' : '링크 처리'})`);
    
    // 삭제된 이미지가 있으면 반환값에 포함
    if (deletedCount > 0) {
      return { imageId, deletedImagesCount: deletedCount };
    }
    
    return { imageId };
  }

  /**
   * 이미지 조회
   */
  getImage(imageId: string): ImageStorageItem | null {
    for (const projectStorage of this.projectStorages.values()) {
      const image = projectStorage.images.find(img => img.id === imageId);
      if (image) {
        // 접근 시간 업데이트
        projectStorage.lastAccessed = Date.now();
        this.saveToStorage();
        return image;
      }
    }
    return null;
  }

  /**
   * 프로젝트의 모든 이미지 조회
   */
  getProjectImages(projectId: string): ImageStorageItem[] {
    const projectStorage = this.projectStorages.get(projectId);
    if (projectStorage) {
      projectStorage.lastAccessed = Date.now();
      this.saveToStorage();
      return projectStorage.images;
    }
    return [];
  }

  /**
   * 이미지 삭제
   */
  deleteImage(imageId: string): boolean {
    for (const projectStorage of this.projectStorages.values()) {
      const imageIndex = projectStorage.images.findIndex(img => img.id === imageId);
      if (imageIndex !== -1) {
        const image = projectStorage.images[imageIndex];
        // 링크 이미지인 경우 blob URL 해제
        if (!image.isStored && image.imageData.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(image.imageData);
          } catch (e) {
            console.warn('Blob URL 해제 실패:', e);
          }
        }
        
        projectStorage.images.splice(imageIndex, 1);
        
        // 프로젝트의 이미지가 모두 삭제되면 프로젝트도 삭제
        if (projectStorage.images.length === 0) {
          this.projectStorages.delete(projectStorage.projectId);
        }
        
        this.saveToStorage();
        console.log(`이미지 삭제 완료: ${imageId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 프로젝트 삭제
   */
  deleteProject(projectId: string): boolean {
    const deleted = this.projectStorages.delete(projectId);
    if (deleted) {
      this.saveToStorage();
      console.log(`프로젝트 이미지 삭제 완료: ${projectId}`);
    }
    return deleted;
  }

  /**
   * 저장 정책 확인 (현재 프로젝트와 직전 2개만 저장)
   */
  private shouldStoreImage(projectId: string): boolean {
    const sortedProjects = Array.from(this.projectStorages.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed);

    // 현재 프로젝트가 상위 3개에 포함되는지 확인
    const topProjects = sortedProjects.slice(0, this.MAX_STORED_PROJECTS);
    return topProjects.some(project => project.projectId === projectId);
  }

  /**
   * 저장 정책 업데이트 (오래된 프로젝트의 이미지를 링크로 변환)
   */
  private updateStoragePolicy(): void {
    const sortedProjects = Array.from(this.projectStorages.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed);

    // 상위 3개를 제외한 프로젝트들의 이미지를 링크로 변환
    const projectsToConvert = sortedProjects.slice(this.MAX_STORED_PROJECTS);
    
    projectsToConvert.forEach(project => {
      project.images.forEach(image => {
        if (image.isStored) {
          image.imageData = this.createImageLink(image.imageData);
          image.isStored = false;
        }
      });
    });

    // 오래된 프로젝트 삭제 (선택사항)
    if (sortedProjects.length > this.MAX_STORED_PROJECTS * 2) {
      const projectsToDelete = sortedProjects.slice(this.MAX_STORED_PROJECTS * 2);
      projectsToDelete.forEach(project => {
        this.projectStorages.delete(project.projectId);
      });
    }
  }

  /**
   * 오래된 이미지를 링크로 변환
   */
  private convertOldImagesToLinks(projectId: string): void {
    const projectStorage = this.projectStorages.get(projectId);
    if (!projectStorage) return;

    // 오래된 이미지부터 링크로 변환
    const sortedImages = projectStorage.images.sort((a, b) => a.timestamp - b.timestamp);
    const imagesToConvert = sortedImages.slice(0, Math.floor(sortedImages.length / 2));

    imagesToConvert.forEach(image => {
      if (image.isStored) {
        image.imageData = this.createImageLink(image.imageData);
        image.isStored = false;
      }
    });
  }

  /**
   * 이미지 링크 생성 (실제 이미지 데이터를 링크로 변환)
   */
  private createImageLink(imageData: string): string {
    // Base64 데이터를 Blob URL로 변환
    try {
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      
      return url;
    } catch (error) {
      console.error('이미지 링크 생성 실패:', error);
      return imageData; // 실패 시 원본 데이터 반환
    }
  }

  /**
   * 새 프로젝트 저장 시 권고 알림
   */
  getStorageRecommendation(): {
    shouldRecommend: boolean;
    message: string;
    action: string;
  } {
    const totalProjects = this.projectStorages.size;
    const totalImages = Array.from(this.projectStorages.values())
      .reduce((sum, project) => sum + project.images.length, 0);

    if (totalProjects > this.MAX_STORED_PROJECTS) {
      return {
        shouldRecommend: true,
        message: `현재 ${totalProjects}개 프로젝트의 ${totalImages}개 이미지가 저장되어 있습니다. 오래된 프로젝트의 이미지는 자동으로 링크 처리됩니다.`,
        action: '프로젝트 저장을 권장합니다.'
      };
    }

    return {
      shouldRecommend: false,
      message: '',
      action: ''
    };
  }

  /**
   * 저장소에서 로드
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.projectStorages = new Map(data);
        console.log('이미지 저장소 로드 완료');
      }
    } catch (error) {
      console.error('이미지 저장소 로드 실패:', error);
    }
  }

  /**
   * 오래된 이미지 삭제 (용량 초과 시 사용)
   * @param targetCount 삭제할 이미지 개수 (기본값: 10개)
   * @returns 삭제된 이미지 개수
   */
  private deleteOldestImages(targetCount: number = 10): number {
    let deletedCount = 0;
    
    // 모든 이미지를 타임스탬프로 정렬하여 오래된 것부터 삭제
    const allImages: Array<{ projectId: string; image: ImageStorageItem; timestamp: number }> = [];
    
    this.projectStorages.forEach((projectStorage, projectId) => {
      projectStorage.images.forEach(image => {
        allImages.push({
          projectId,
          image,
          timestamp: image.timestamp
        });
      });
    });
    
    // 타임스탬프 오름차순 정렬 (오래된 것부터)
    allImages.sort((a, b) => a.timestamp - b.timestamp);
    
    // 오래된 이미지부터 삭제
    for (const { projectId, image } of allImages) {
      if (deletedCount >= targetCount) break;
      
      const projectStorage = this.projectStorages.get(projectId);
      if (projectStorage) {
        const imageIndex = projectStorage.images.findIndex(img => img.id === image.id);
        if (imageIndex !== -1) {
          // 링크 이미지인 경우 blob URL 해제
          if (!image.isStored && image.imageData.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(image.imageData);
            } catch (e) {
              console.warn('Blob URL 해제 실패:', e);
            }
          }
          
          projectStorage.images.splice(imageIndex, 1);
          deletedCount++;
          
          // 프로젝트의 이미지가 모두 삭제되면 프로젝트도 삭제
          if (projectStorage.images.length === 0) {
            this.projectStorages.delete(projectId);
          }
        }
      }
    }
    
    return deletedCount;
  }

  /**
   * 저장소에 저장 (용량 초과 시 오래된 이미지 삭제 후 재시도)
   * @param maxRetries 최대 재시도 횟수 (기본값: 3)
   * @returns 삭제된 이미지 개수 (성공 시 0)
   */
  private saveToStorage(maxRetries: number = 3): number {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const data = Array.from(this.projectStorages.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return 0; // 성공
      } catch (error: any) {
        // localStorage 용량 초과 에러 처리
        if (error?.name === 'QuotaExceededError' || error?.message?.includes('quota')) {
          if (attempt < maxRetries - 1) {
            // 오래된 이미지 삭제 후 재시도
            const deletedCount = this.deleteOldestImages(10); // 10개씩 삭제
            
            if (deletedCount === 0) {
              // 더 이상 삭제할 이미지가 없으면 중단
              console.error('⚠️ localStorage 용량 초과: 삭제할 이미지가 없습니다.');
              throw error;
            }
            
            console.log(`⚠️ localStorage 용량 초과: 오래된 이미지 ${deletedCount}개 삭제 후 재시도 (${attempt + 1}/${maxRetries})`);
            continue; // 재시도
          } else {
            // 최대 재시도 횟수 초과
            console.error('⚠️ localStorage 용량 초과: 최대 재시도 횟수 초과');
            throw error;
          }
        } else {
          // 다른 에러는 즉시 throw
          throw error;
        }
      }
    }
    return 0;
  }

  /**
   * 저장소 통계 조회
   */
  getStorageStats(): {
    totalProjects: number;
    totalImages: number;
    storedImages: number;
    linkedImages: number;
    storageSize: number;
  } {
    let totalImages = 0;
    let storedImages = 0;
    let linkedImages = 0;
    let storageSize = 0;

    this.projectStorages.forEach(project => {
      totalImages += project.images.length;
      project.images.forEach(image => {
        if (image.isStored) {
          storedImages++;
          storageSize += image.imageData.length;
        } else {
          linkedImages++;
        }
      });
    });

    return {
      totalProjects: this.projectStorages.size,
      totalImages,
      storedImages,
      linkedImages,
      storageSize: Math.round(storageSize / 1024) // KB 단위
    };
  }

  /**
   * 저장소 정리 (링크된 이미지 정리)
   */
  cleanupLinkedImages(): void {
    this.projectStorages.forEach(project => {
      project.images.forEach(image => {
        if (!image.isStored && image.imageData.startsWith('blob:')) {
          URL.revokeObjectURL(image.imageData);
        }
      });
    });
  }
}

export default ImageStorageService;
