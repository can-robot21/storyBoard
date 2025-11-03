export interface BannerItem {
  id: string;
  type: 'image' | 'youtube';
  src: string;
  alt: string;
  title: string;
  description: string;
  youtubeUrl?: string;
}
