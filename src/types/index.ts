export type Platform = 'tiktok' | 'instagram' | 'youtube';

export interface MediaPreview {
  title: string;
  thumbnail: string;
  author?: string;
  downloadUrl: string;
  type: 'video' | 'image';
}
