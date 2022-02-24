import VideoRepository from '../Repository/VideoRepository';
import ChatRepository from '../Repository/ChatRepository';
import { ClipsRepository } from '../Repository/ClipsRepository';


export class VideoService {
  public async getVideo(params: {video_id: number}) {
    const videoRepository = new VideoRepository();
    const chatRepository = new ChatRepository();
    const clipsRepository = new ClipsRepository()

    const video = await videoRepository.find({video_id: params.video_id});
    const chat = await chatRepository.find({video_id: params.video_id});
    const clips = await clipsRepository.findClipFromVideo({video_id: params.video_id});

    if(video) {
      if(chat) {
        video.chats = chat;
      }
      if(clips) {
        video.clips = clips;
      }
    }


    return video;
  }

}
