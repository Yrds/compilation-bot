import dotenv from 'dotenv';
dotenv.config();

import crawler from "./Crawler";
import { DownloaderService } from './Services/Downloader';
import fs from 'fs';
import fsPromises from 'fs/promises';
import VideoRepository from './Repository/VideoRepository';
import ContentCreatorsRepository from './Repository/ContentCreatorsRepository';
import Video from './Types/Video';



//@ts-ignore
import ffmpeg from 'fluent-ffmpeg';

import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';

//Move to Repository
import { Op } from 'sequelize';

const downloadNewVideos = async (): Promise<void> => {
  const videoRepo = new VideoRepository();
  const videosToDownload: Pick<Video, 'video_url' | 'video_file_path' | 'intern_id'>[] =  await videoRepo.findNonDownloadedVideos();

  const downloader_service = new DownloaderService();

  if(videosToDownload.length) {
    for(const video of videosToDownload) {
      try{
        const download_info = await downloader_service.download(video.video_url, 'videos/' + video.intern_id + '.mp4');
        video.video_file_path = download_info;
        await videoRepo.assignDownload(video);
      }
      catch(e){
        console.error("Houve um erro ao baixar o arquivo", e);
      }
    }
  }
  else {
    console.log("No videos to download");
  }

}

const convertVideoFps = async (video_path: string, fps: number = 30): Promise<string> => {

  if(video_path.charAt(0) != '/') {
    throw Error("video_path must be a absolute")
  }

  const file_name_with_new_fps = video_path.split('/').map((el, idx, arr) => {
    if(idx == arr.length - 1){
      return el.split('.').map((el, idx, arr) => {
        if(idx === 0){
          return el + "_30_fps";
        }
        return el;
      }).join('.');
    }
    return el;
  }).join('/');

  if(fs.existsSync(file_name_with_new_fps)) {
    return file_name_with_new_fps;
  }

  console.log('convertendo video');
  await new Promise((accept, reject) => {
    ffmpeg(video_path)
      .outputOptions([`-filter:v fps=fps=${fps}`, `-r ${fps}`])
      .output(file_name_with_new_fps)
      .on('end', () => accept())
      .on('error', (err: any) => reject(err))
      .run();
  })

  return file_name_with_new_fps;
}


const makeCompilation = async (videos: Video[]): Promise<void> => {

  const command = ffmpeg();

  try{
    await fsPromises.unlink('/tmp/filelist.txt');
  } catch(e) {
    console.warn("Arquivo filelist.txt não existe");
  }

  const tempFileList = fs.createWriteStream('/tmp/filelist.txt');

  for(const video of videos) {
    if(video.video_file_path){
      const converted_video = await convertVideoFps(video.video_file_path);
      tempFileList.write('file ' + converted_video + '\n');
    }
  }

  command.input('/tmp/filelist.txt');
  command.inputFormat('concat');

  command.inputOptions(["-f concat", "-safe 0"]);

  command.outputOptions(['-c copy']);

  command.output('teste.mp4').run();

  command.on('end', async () =>{
    await fsPromises.unlink('/tmp/filelist.txt');
  })
}


async function crawlerVideos() {

  const videoRepository = new VideoRepository();

  const contentCreatorsRepository = new ContentCreatorsRepository();


  const contentCreators = (await contentCreatorsRepository.findAll()).map(cc => cc.user);

  console.log(contentCreators);

  if(contentCreators.length) {
    const videos = await crawler().init({contentCreators});
    videos.forEach((video: Video) =>  videoRepository.insertVideo(video));
  }

}

async function compileTheBestsVideos() {
  const videoRepository = new VideoRepository();

  const bestVideos =  await videoRepository.findBestVideosOfWeek();

  await makeCompilation(bestVideos);
}

//crawlerVideos();
downloadNewVideos().then(() => {
  compileTheBestsVideos();
});

