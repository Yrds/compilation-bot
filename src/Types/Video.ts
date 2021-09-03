export default interface Video {
  intern_id: number | undefined;
  url: string;
  video_url: string;
  video_file_path: string | undefined;
  user: string;
  id: string;
  date: Date;
  likes: number;
  comments: number;
  shares: number;
  tags: string | undefined;
}
