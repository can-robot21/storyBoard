import React, { useState } from 'react';
import MediaSlider from '../common/MediaSlider';

// 샘플 데이터 타입
interface SampleMediaItem {
  id: number;
  type: 'image' | 'video';
  url?: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  timestamp?: string;
}

// 샘플 데이터 생성
const generateSampleData = (): { images: SampleMediaItem[], videos: SampleMediaItem[] } => {
  const images: SampleMediaItem[] = [];
  const videos: SampleMediaItem[] = [];

  // 샘플 이미지 데이터 (10개)
  for (let i = 1; i <= 10; i++) {
    images.push({
      id: i,
      type: 'image',
      url: `https://picsum.photos/400/300?random=${i}`,
      thumbnail: `https://picsum.photos/200/150?random=${i}`,
      title: `이미지 ${i}`,
      description: `샘플 이미지 ${i}번`,
      timestamp: new Date().toISOString()
    });
  }

  // 샘플 영상 데이터 (8개)
  for (let i = 1; i <= 8; i++) {
    videos.push({
      id: i + 100,
      type: 'video',
      url: `https://sample-videos.com/zip/10/mp4/SampleVideo_${i}.mp4`,
      thumbnail: `https://picsum.photos/200/150?random=${i + 100}`,
      title: `영상 ${i}`,
      description: `샘플 영상 ${i}번`,
      timestamp: new Date().toISOString()
    });
  }

  return { images, videos };
};

export const MediaSliderExample: React.FC = () => {
  const [mediaData] = useState(generateSampleData());

  const handleImageClick = (item: SampleMediaItem) => {
    console.log('이미지 클릭:', item);
    // 이미지 모달 열기 또는 상세 보기 로직
  };

  const handleVideoClick = (item: SampleMediaItem) => {
    console.log('영상 클릭:', item);
    // 영상 모달 열기 또는 재생 로직
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">미디어 슬라이더 예시</h2>
      
      <MediaSlider
        images={mediaData.images}
        videos={mediaData.videos}
        onImageClick={handleImageClick}
        onVideoClick={handleVideoClick}
        className="w-full"
      />
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">사용법:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 좌우 화살표 버튼으로 슬라이드 이동</li>
          <li>• 각 아이템은 200px × 150px 크기</li>
          <li>• 한 번에 7개씩 보이며 스크롤 가능</li>
          <li>• 이미지/영상이 없으면 "No Thumbnail" 표시</li>
          <li>• 호버 시 확대 효과 및 오버레이 표시</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaSliderExample;
