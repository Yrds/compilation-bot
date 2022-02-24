import { ClipsRepository } from '../Repository/ClipsRepository';
import VideoRepository from '../Repository/VideoRepository';
import { Clip } from '../Types/Clip';
//@ts-ignore
import ffmpeg from 'fluent-ffmpeg';
import fs, { WriteStream } from 'fs'; 
import path from 'path';
import { Filter } from './filter-service';

export class ClipService {
  async createClip(clip: Clip) {
    if(clip.duration <= 5) { throw "Clip duration must have 5 seconds or more" };
    if(clip.offset_seconds < 0) { throw "Clip offset_seconds must have 0 or more" }

    const videoRepository = new VideoRepository();

    const clipVideo = await videoRepository.find({video_id: clip.video_id});

    if(!clipVideo) { throw "Clip video not exists"; }

    if((clip.offset_seconds + clip.duration) > clipVideo.duration) {
      throw "Clip offset and duration is greater than video duration";
    }

    const clipsRepository = new ClipsRepository();

    clipsRepository.createClip(clip);
  }

  async downloadClip(_clip: number | Clip): Promise<string | undefined> {

    const clipsRepository = new ClipsRepository();

    const clip: Clip | undefined = await (async () => {
      if(typeof _clip === "number"){
        return await clipsRepository.find(_clip);
      } else {
        return _clip as Clip;
      }
    })();

    if(!clip){ throw "Clip don't exists"; }

    const videoRepository = new VideoRepository();

    const clipVideo = await videoRepository.find({video_id: clip.video_id});

    if(!clipVideo) { throw "Clip video not exists"; }
    if(!clipVideo.video_file_path) { throw "Video must be downloaded first"; }


    const file_path = (() => {
      if(!clip.internal_id) {
        return path.resolve('/tmp/clip_'+ clip.video_id  + '_' + clip.offset_seconds + '_' + clip.duration + '.mp4');
      }
      return path.resolve('clips/'+ clip.internal_id +'.mp4');
    })();

    console.log('clip preview', clip);
    if(fs.existsSync(file_path)) {
      return file_path;
    }



    const makeZoom = (options: {input: string, output: string, range: {start: number, duration: number}, rect:{ x:number, y: number, width: number, height: number } }) => {
      const {x, y, width, height } = options.rect;
      const { start, duration } = options.range;

      if(start + duration >= clip.duration) {
        throw "[VIDEO_ZOOM] zoom filter size must be lesser than the clip duration"
      }

      const filter = [
        //TODO separar essa parte e fazer generico pra todos os filtros tiverem esse parametro de range
        `[${options.input}]trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS[part_to_be_zoomed]`,
        `[part_to_be_zoomed]crop=w=${width}:h=${height}:x=${x}:y=${y}[croped_video]`,
        `[croped_video]scale=1280:720[zoomed_video]`,
      ]

      let video_end: boolean = false;
      if(duration < clip.duration) {
        filter.unshift(`[${options.input}]trim=start=${start+duration}:duration=${clip.duration-start+duration},setpts=PTS-STARTPTS[video_end]`)
        video_end = true;
      }

      let video_start: boolean = false;
      if(start > 0) {
        filter.unshift(`[${options.input}]trim=start=0:duration=${start},setpts=PTS-STARTPTS[video_start]`)
        video_start = true;
      }

      filter.push(`${video_start ? '[video_start]' : ''}[zoomed_video]${video_end ? '[video_end]' : ''}concat=n=3[${options.output}]`)

      return filter;
    };

    const complexFilters = [
      '[0:v]scale=1280:720[v]',
      '[0:a]aresample=44100[a]',
    ];

    const zoom = {
      range: {start: 12, duration: 4},
      rect: {x: 980, y: 0, width: 300, height: 200}
    };

    if(zoom){
      complexFilters.push(...(makeZoom( {input: 'v', output: 'video', range: zoom.range , rect: zoom.rect} )));
    }

    console.log('complexFilters', complexFilters);


    const clipFile = await new Promise((resolve, reject) => {
      ffmpeg(clipVideo.video_file_path)
        .inputOptions(`-ss ${clip.offset_seconds}`)
        .outputOptions(`-t ${clip.duration}`)
        .complexFilter(complexFilters, [zoom ? 'video' : 'v', 'a'])
        .output(file_path)
        .on('end', () => resolve(true))
        .on('error', (err: any) => { 
          console.log('err', err);
          resolve(false) 
        })
        .run();
    });

    if(clipFile) {
      return file_path;
    } else {
      return undefined;
    }
  }
}
