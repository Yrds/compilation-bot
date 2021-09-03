import https from 'https';
import fs from 'fs'; 
import path from 'path';

export class DownloaderService {
  download(url: string, file_path: string, options: any = {}): Promise<string> {
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
