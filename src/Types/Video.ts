import { ChatMessage } from "./ChatMessage";
import { Clip } from './Clip';

export default interface Video {
  intern_id?: number;
  url: string;
  video_url: string;
  video_file_path?: string;
  user: string;
  id: string;
  date: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string;
  text: string;
  duration: number;
  platform: string;
  chats?: ChatMessage[];
  clips?: Clip[];
}
