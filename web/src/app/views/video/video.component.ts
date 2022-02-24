import { Component, OnInit } from '@angular/core';
import { VideoService } from 'src/app/services/video.service';
import { ClipService } from 'src/app/services/clip.service';
import { ActivatedRoute } from '@angular/router';
import Video from '../../../../../src/Types/Video';
import { Clip } from '../../../../../src/Types/Clip';
import { ChatMessage } from '../../../../../src/Types/ChatMessage';
//import { ScaleType } from '@swimlane/ngx-charts/lib/common/types/scale-type.enum';
import { ScaleType } from '@swimlane/ngx-charts';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent implements OnInit {

  clipForm = this.fb.group({
    offset_seconds: [null, [Validators.required, Validators.min(0)]],
    duration: [null, [Validators.required, Validators.min(0)]],
  });

  video: Video | undefined;
  chatSeries: any[] | undefined;


  view: [number, number] = [1200,600]
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = false;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = '';
  yAxisLabel: string = '';
  timeline: boolean = true;
  schemeType = ScaleType.Linear;

  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };


  constructor(
    private videoService: VideoService,
    private clipService: ClipService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.getVideos();
  }

  getVideos(): void {
    const videoId = this.route.snapshot.paramMap.get('video_id');
    console.log('videoid', videoId);
    if(videoId && !isNaN(parseInt(videoId))){
      this.videoService.getVideos({video_id: parseInt(videoId)}).subscribe(video => {
        this.video = video
        if(this.video.chats) {
          this.chatSeries = [this.getChatResults(this.video.chats)];
        };
      });
    }
  }

  xAxisTickFormatting(value: number){
    return new Date(value * 1000).toISOString().substr(11, 8)
  }

  //{{model[0].name}} - {{model[0].value}}
  getLabel(model: any[]): string {
    return new Date(model[0].name * 1000).toISOString().substr(11, 8) + " - " + model[0].value;
  }

  onClickSeries($event: {name: number, value: number, series: string}){
    console.log($event);
    if(this.video){
      //const timestamp = new Date($event.name * 1000).toISOString().substr(11, 8).split(':').map((frag, i) => {
      //  if(i == 0) return frag + 'h';
      //  if(i == 1) return frag + 'm';
      //  if(i == 2) return frag + 's';
      //  return frag;
      //}).join('');

      //window.open(this.video.url+ '?t=' + timestamp); //https://www.twitch.tv/videos/1153786571?t=5h27m57s)
      this.clipForm.controls['offset_seconds'].setValue($event.name);

      const previewClip: boolean = true;

      if(previewClip){
        this.previewClip();
      }
    }
  }

  getChatResults(chats: ChatMessage[]): {name: string, series: {name: string | Date | number, value:number}[]} {

    const map = new Map<number, number>();

    chats.forEach(cm => {
      const regex = new RegExp('lul|kkkkkkk|kek|haha', 'i');
      const second = Math.floor(cm.content_offset_seconds);
      if(regex.test(cm.text)) {
        const secondEl = map.get(second);

        if(secondEl){
          map.set(second, secondEl + 1)
        } else {
          map.set(second, 2)
        }
      } else {
          map.set(second, 1)
      }
    })

    const entries = [...map.entries()];//.filter(entry => entry[1] > 9);

    return {
      name: "Partes mais engraçadas da live",
      series: entries.map(entry => {
        return {
          //name: new Date(entry[0] * 1000).toISOString().substr(11, 8),
          name: entry[0],
          //name: new Date(entry[0] * 1000),
          value: entry[1]
        }
      })
    }
  }

  createClip() {
    if(this.video && this.video.intern_id && this.clipForm.valid) {
      const clip: Clip = {
        offset_seconds: parseInt(this.clipForm.value.offset_seconds),
        duration: parseInt(this.clipForm.value.duration),
        video_id: this.video.intern_id
      }

      this.videoService.createClip(clip).subscribe(
        _ => {console.log("Deu certo"); this.getVideos()},
        _ => {console.error("Deu errado")}
      );
    } else {
      throw "Cannot create clip";
    }

  }

  video_data: string = "";

  downloadClip(clip: Clip) {
    if(clip.internal_id) {
      this.clipService.getDownloadLink(clip.internal_id).subscribe(
        video_data => {this.video_data = video_data},
        _ => {console.error(_)}
      );
    } else {
      throw "Clip doesn't have id";
    }
  }
  previewClip() {
    if(this.video && this.video.intern_id && this.clipForm.valid) {
      const clip: Clip = {
        offset_seconds: parseInt(this.clipForm.value.offset_seconds),
        duration: parseInt(this.clipForm.value.duration),
        video_id: this.video.intern_id
      }

      this.clipService.previewClip(clip)
        .subscribe(
          video_data => {this.video_data = video_data},
          _ => {console.error(_)}
        );
    }
  }
}
