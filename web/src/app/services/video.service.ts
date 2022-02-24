import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Video from '../../../../src/Types/Video';
import { Clip } from '../../../../src/Types/Clip';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor(
    private http: HttpClient,
  ) { }

  getVideos(params: {video_id: number}) {
    return this.http.get<Video>(`http://localhost:3000/video/${params.video_id}`);
  }

  createClip(clip: Clip) {
    return this.http.post(`http://localhost:3000/video/${clip.video_id}/clip`, clip);
  }
}
