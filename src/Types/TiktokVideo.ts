export interface TiktokVideo {
  url: string;
  user: string;
  id: string;
  date: Date;
  likes: number;
  comments: number;
  shares: number;
  video_url: string | null;
  text: string;
  duration: number;
}
