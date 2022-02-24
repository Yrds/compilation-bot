import https from 'https';
import fs from 'fs'; 
import path from 'path';

//@ts-ignore
import ffmpeg from 'fluent-ffmpeg';

export class DownloaderService {
  async download(url: string, file_path: string, options: any = {}): Promise<string> {
    if(url.indexOf('.m3u8') !== -1){
      return this._downloadM3U8(url, file_path);
    } else if(url.indexOf('video/tos/') !== -1 ) {
      return await this._downloadHTTP(url, file_path);
    } else {
      throw "Not possible to indentify download type: " + url ;
    }
  }

  private _downloadM3U8(url: string, filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(url)
        .on('end', () => resolve(path.resolve(filepath)))
        .on('error', (err: any) => reject(err))
        .videoCodec('copy')
        .output(filepath)
        .run()
    })
  }

  private _downloadHTTP(url: string, file_path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(file_path);

      const request_options = {
        headers: { 
          'Referer': url,
        }
      };

      const request = https.get(url, request_options, response => {

        response.pipe(file);

        response.on('end',() => {
          if(response.statusCode === 403){
            reject("Forbidden")
          } else {
            console.log('finished download', url);
            resolve(path.resolve(file.path as string));
          }
        })

      }).on('error', err => reject(err));

    });

  }


}
