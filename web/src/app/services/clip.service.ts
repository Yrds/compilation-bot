import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Clip } from '../../../../src/Types/Clip';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClipService {

  constructor(
    private http: HttpClient,
  ) {}

  downloadClip(clip_id: number) {
    return this.http.get(`http://localhost:3000/clip/${clip_id}/download`);
  }

  getDownloadLink(clip_id: number) {
    return of(`http://localhost:3000/clip/${clip_id}/file.mp4`);
  }

  previewClip(clip: Clip) {
    const params = new HttpParams({
      fromObject: {
        offset_seconds: clip.offset_seconds,
        duration: clip.duration,
        video_id: clip.video_id
      }
    });

    return of(`http://localhost:3000/clip/preview?${params.toString()}`);
  }
}
