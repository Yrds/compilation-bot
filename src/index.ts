import dotenv from 'dotenv';
dotenv.config();

//@ts-ignore
import wtf from 'wtfnode';

import { ApiServer } from './api';
import crawler from "./Crawler";
import { DownloaderService } from './Services/Downloader';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { endPool, destroyKnex } from './Repository/BaseRepository';
import VideoRepository, { bestVideosQuery } from './Repository/VideoRepository';
import UrlRepository from './Repository/UrlRepository';
import ContentCreatorsRepository from './Repository/ContentCreatorsRepository';
import CompilationsRepository from './Repository/CompilationsRepository';
import ChatRepository from './Repository/ChatRepository';
import Video from './Types/Video';
import VideoUrl from './Types/VideoUrl';
import { TiktokService } from './Services/Tiktok';


//@ts-ignore
import ffmpeg from 'fluent-ffmpeg';

import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';

//Move to Repository
import { Op } from 'sequelize';
import { TiktokVideo } from './Crawler/Actions/Tiktok';
import { error } from 'console';

const downloadNewVideos = async (urls: Pick<Video, 'platform' | 'video_url' | 'video_file_path' | 'intern_id'>[] = []): Promise<void> => {
  const videoRepo = new VideoRepository();
  let videosToDownload: Pick<Video, 'platform' | 'video_url' | 'video_file_path' | 'intern_id'>[] = [];

  if(urls.length) {
    videosToDownload = urls;
  } else {
    videosToDownload = await videoRepo.findNonDownloadedVideos();
  }

  const downloader_service = new DownloaderService();

  if(videosToDownload.length) {
    for(const video of videosToDownload) {
      try{
        console.log('downloading', video.video_url);
        const download_info = await downloader_service.download(video.video_url, 'videos/' + video.intern_id + '.mp4');
        video.video_file_path = download_info;
        await videoRepo.assignDownload(video);
      }
      catch(e){
        console.error("Houve um erro ao baixar o arquivo:", e);
      }
    }
  }
  else {
    console.log("No videos to download");
  }

}

//WARN not only fps, but convert audioRate too
const convertVideoFps = async (video_path: string, fps: number = 30, audioRate: number = 44100): Promise<string> => {

  if(video_path.charAt(0) != '/') {
    throw Error("video_path must be a absolute")
  }

  //TODO video format(assuming all videos here are mp4
  const file_name_with_new_fps = video_path.split('/').map((el, idx, arr) => {
    if(idx == arr.length - 1){
      return el.split('.').map((el, idx, arr) => {
        if(idx === 0){
          return el + "_converted";
        }
        return el;
      }).join('.');
    }
    return el;
  }).join('/');

  if(fs.existsSync(file_name_with_new_fps)) {
    return file_name_with_new_fps;
  }

  console.log('convertendo video', video_path);
  await new Promise((accept, reject) => {
    ffmpeg(video_path)
      .outputOptions([`-ar ${audioRate}`])
      .videoFilters(`fps=${fps}`,`scale=-1:1080`, `pad=1920:0:(ow-iw)/2`)//,'boxblur=luma_radius=min(h\,w)/20:luma_power=1:chroma_radius=min(cw\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,crop=h=iw*9/16')//,pad=1920:0:(ow-iw)/2`, `-r ${fps}`])
    //TODO INSTEAD PAD USE THIS: -lavfi '[0:v]scale=ih*16/9:-1,boxblur=luma_radius=min(h\,w)/20:luma_power=1:chroma_radius=min(cw\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,crop=h=iw*9/16' -vb 800K
      .output(file_name_with_new_fps)
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .run();
  })

  return file_name_with_new_fps;
}

const generateThumbnail = async(videos: Video[], options: {output: string, overlay?: string}): Promise<void> => {
  if(videos.length < 3){
    throw Error("Insufficient videos");
  }

  //TODO parameter to overlay
  //const overlay = options.overlay || "/home/yuri/Projetos/All/tiktok_bot/assets/overlay_comedia.png";
  const overlay = options.overlay || "/home/yuri/Projetos/All/tiktok_bot/assets/overlay.png";

  console.log("Extracting frames from videos");
  await new Promise((accept, reject) => {
    ffmpeg(videos[2].video_file_path)
      .outputOptions(['-ss 00:00:5.000', '-vframes 1', '-vf scale=-1:1024'])
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .output('/tmp/thumb1.png').run();
  });

  await new Promise((accept, reject) => {
    ffmpeg(videos[1].video_file_path)
      .outputOptions(['-ss 00:00:5.000', '-vframes 1', '-vf scale=-1:1024'])
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .output('/tmp/thumb2.png').run();
  });

  await new Promise((accept, reject) => {
    ffmpeg(videos[0].video_file_path)
      .outputOptions(['-ss 00:00:5.000', '-vframes 1', '-vf scale=-1:1024'])
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .output('/tmp/thumb3.png').run();
  });

  console.log("Editing thumbnail image");
  await new Promise((accept, reject) => {
    ffmpeg('/tmp/thumb1.png')
      .input('/tmp/thumb2.png')
      .input('/tmp/thumb3.png')
      .outputOptions(['-filter_complex [0][1][2]hstack=inputs=3[full];[full]scale=1280:720'])
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .output('/tmp/thumb_combined.png').run();
  });

  console.log("Finalizing thumbnail");
  await new Promise((accept, reject) => {
    ffmpeg('/tmp/thumb_combined.png')
      .input(overlay)
      .complexFilter([ 
        "overlay=0:0",
      ])
      .on('end', () => accept())
      .output(options.output).run();
  });
}

const makeCompilation = async (videos: Video[], options: {output: string}): Promise<void> => {

  //TODO configuration for this
  if(videos.length < 3){
    throw Error("Insufficient videos");
  }

  const command = ffmpeg();

  try{
    await fsPromises.unlink('/tmp/filelist.txt');
  } catch(e) {
    console.warn("Arquivo filelist.txt não existe");
  }

  const tempFileList = fs.createWriteStream('/tmp/filelist.txt');

  const addVideo = async (file_path: string) => {
    try{ 
      const converted_video = await convertVideoFps(file_path);
      await tempFileList.write('file ' + converted_video + '\n');
    } catch(err) {
      console.error("Erro ao adicionar video", file_path, err);
    }
  }

  //TODO add intro param
  //await addVideo('/home/yuri/Projetos/All/tiktok_bot/assets/intro_video_03.mp4');

  let videosAdded: number = 0;
  for(const video of videos) {
    if(video.video_file_path){
      await addVideo(video.video_file_path);
      await addVideo('/home/yuri/Projetos/All/tiktok_bot/assets/static_transition.mp4');
      videosAdded++;
      //TODO adicionar um meio de vídeo melhor
      //if(videosAdded === Math.round(videos.length / 2)) {
      //  await addVideo('/home/yuri/Projetos/All/tiktok_bot/assets/meio_video_02.mp4');
      //  await addVideo('/home/yuri/Projetos/All/tiktok_bot/assets/static_transition.mp4');
      //}
    }
  }

  //TODO add final video param
  await addVideo('/home/yuri/Projetos/All/tiktok_bot/assets/final_4.mp4');

  command.input('/tmp/filelist.txt');
  command.inputFormat('concat');

  command.inputOptions(["-f concat", "-safe 0"]);

  command.outputOptions(['-c copy']);

  command.output(options.output).run();

  command.on('end', async () =>{
    await fsPromises.unlink('/tmp/filelist.txt');
  })

}


async function crawlerVideos(options: {contentCreator?: string, maximum?: number} = {}) {

  const maximum: number = options.maximum || (options.contentCreator ? 500 : 10);

  const contentCreator: string | undefined = options.contentCreator || undefined;

  const videoRepository = new VideoRepository();

  const contentCreatorsRepository = new ContentCreatorsRepository();

  let contentCreators: string[];

  if(contentCreator){
    contentCreators = [contentCreator];
  } else {
    contentCreators = (await contentCreatorsRepository.findAll()).map(cc => cc.user);
  }

  if(contentCreators.length) {
    const videos = await crawler().init({contentCreators, maximum: maximum});
    for(const video of videos) {
      try {
        await videoRepository.insertVideo(video);
      } catch (err) {
        console.error("Error inserting video:", video, err);
      }
    }
  }

}

//TODO remakeCompilation
async function generateCompilationVideo(options: {compilation_id: number, stopAt?: string}) {
  const videoRepository = new VideoRepository();

  console.log("Getting videos on database...");
  const compilationVideos =  await videoRepository.findVideosFromCompilation(options);

  const getUsers = () => {
    const userMap = new Set<string>();
    for(const compilation of compilationVideos){
      userMap.add(compilation.user);
    }

    return Array.from(userMap.values());
  };

  if(compilationVideos.length) {
    console.log("Generating compilation tags");
    console.log(getUsers().join(','));
    if(options.stopAt === "tags") {
      return;
    }
    console.log("Generating thumb...");
    await generateThumbnail(compilationVideos, {output: `compilations/${options.compilation_id}.png` });
    if(options.stopAt === "thumb"){
      return;
    }

    console.log("Generating video compilation...");
    await makeCompilation(compilationVideos, {output: `compilations/${options.compilation_id}.mp4` });
    if(options.stopAt === ""){
      return;
    }
  } else {
    console.error("No compilation found");
  }

}

async function createCompilation(query: bestVideosQuery, options?: {showOnly?: boolean}) {

  if(!options){
    options = {};
  }

  const videoRepository = new VideoRepository();

  const _limit: number = query.limit || 15;

  let bestVideos = [];

  if(!query.tags && !query.user){
    throw new Error("Provide at least a user or tag");
  }

  bestVideos = await videoRepository.findBestVideosOfWeek(query);

  console.log('best videos', {bestVideos, length: bestVideos.length});

  if(!options.showOnly) {
    if(bestVideos.length >= _limit) {
      const compilationsRepository = new CompilationsRepository();

      return (await compilationsRepository.createCompilation(bestVideos.map(video => video.intern_id as number)));
    } else {
      throw Error("insufficient videos: " + bestVideos.length)
    }
  }

  return undefined;
}


//TODO update video_urls
async function updateVideoInfo(options?: {onlyNonDownloaded?: boolean}) {

  const onlyNonDownloaded = options?.onlyNonDownloaded || false;

  const videoRepository = new VideoRepository();

  const remainingVideos = await videoRepository.findVideosURLS({olderThan: 7, onlyNonDownloaded});

  const videoUrls = remainingVideos.filter(video => video.platform === "tiktok").map(video => video.url);

  if(videoUrls.length) {
    const videos: any = await crawler().crawlSpecificUrls(videoUrls);
    for(const video of videos){
      console.log('inserting video', video);
      try {
        await videoRepository.insertVideo(video);
      } catch (err) {
        console.error("Error inserting video:", video, err);
      }
    }
    return videos;
  }
}

//TODO get new urls in video_urls table
async function discoverNewUrls() {
  const urlRepository = new UrlRepository();
  const urls = await urlRepository.findAll();

  const urlsMap: Record<string, VideoUrl> = urls.reduce((acc: Record<string, VideoUrl>, el: VideoUrl) => {
    acc[el.url] = el;

    return acc;
  }, {});

  const videoUrls = urls.map(video => video.url);

  const videoRepository = new VideoRepository();

  let success_urls: typeof urls = [];
  if(videoUrls.length) {
    const videos: any = await crawler().crawlSpecificUrls(videoUrls);
    for(const video of videos){
      console.log('inserting video', video);
      console.log(urlsMap);
      const videoUrl = urlsMap[video.url];
      try {
        if(!videoUrl) {
          throw Error("no tag found");
        }
        await videoRepository.insertVideo(video, {tags: videoUrl.tags});
        success_urls.push(videoUrl);
      } catch (err) {
        console.error("Error inserting video:", video, err);
      }
    }
    await urlRepository.deleteAll(success_urls);
    return videos;
  }
}

async function crawlTag(tag: string) {
  const videoRepository = new VideoRepository();

  const videos: any = await crawler().crawlSpecificTag({tag, filter: (video) => {
    const maxDate = new Date();

    maxDate.setDate(maxDate.getDate() - 15);

    console.log(video.date, maxDate);

    return video.date > maxDate;

  }, scrollingTime: 1000});

  for(const video of videos) {
    try {
      await videoRepository.insertVideo(video);
    } catch (err) {
      console.error("Error inserting video:", video, err);
    }
  }
}

async function crawlTwitchVideo(url: string) {
  const videoRepository = new VideoRepository();
  const video = await crawler().crawlTwitchVideo(url);
  return await videoRepository.insertVideo(video); 
}

async function crawlTwitchVideoChat(video_id: number) {
  //TODO ao invés de url mandar intern_id do vídeo

  const videoRepository = new VideoRepository();

  const video = await videoRepository.find({video_id});


  if(video){
    if(video.platform !== "twitch") {
      throw "No twitch video";
    }

    const chat_messages = await crawler().crawlTwitchVideoChat(video.url, video_id);

    const chatRepository = new ChatRepository();
    console.log('chat messages', chat_messages);
    await chatRepository.insertChatMessage(chat_messages);
  } else {
    throw 'no video found';
  }
}

async function getChat() {
    const chatRepository = new ChatRepository();
  
    const chatMessages = await chatRepository.find();
  
    if(!chatMessages) {
      throw "Chat not exists()";
    }
  
    const map = new Map<number, number>();
  
  
    chatMessages.forEach(cm => {
      const regex = new RegExp('kkk|OMEGALUL|kekw', 'i');
      if(regex.test(cm.text)) {
        const second = Math.floor(cm.content_offset_seconds);
        const secondEl = map.get(second);
  
        if(secondEl){
          map.set(second, secondEl + 1)
        } else {
          map.set(second, 1)
        }
      }
    })
  
    const entries = [...map.entries()];
  
    const formattedEntries = (entries.map(entry => {
      return [new Date(entry[0] * 1000).toISOString().substr(11, 8), entry[1]]
    }));
  
    fs.writeFileSync('test.txt', 
      formattedEntries.reduce((acc, el) => {
        acc += el[0] + '|' + el[1] + '\n';
        return acc;
      }, "")
    );
  
}

async function start() {
  await crawlerVideos();
  await downloadNewVideos();
}



start().then(async () => {
  await endPool();
  await destroyKnex();
  await wtf.dump();
});
//TODO disconnect data base pool
//
