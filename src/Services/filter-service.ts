export abstract class Filter {
  input: string;
  output: string;
  range: {start: number, duration: number};

  abstract getFilter(): string[];

  constructor(input: string, output: string, range: {start: number, duration: number}, params?: any) {
    this.input = input;
    this.output = output;
    this.range = range;
  }
}

export class ZoomFilter extends Filter {
  rect :{ x:number, y: number, width: number, height: number };

  constructor(input: string, output: string, range: {start: number, duration: number}, params:{ rect: { x:number, y: number, width: number, height: number }}) {
    super(input, output, range);
    this.rect = params.rect;
  }


  getFilter() {
    const {x, y, width, height } = this.rect;
    const { start, duration } = this.range;
    return [
      `[${this.input}]crop=w=${width}:h=${height}:x=${x}:y=${y}[croped_video]`,
      `[croped_video]scale=1280:720[${this.output}]`
    ];
  }
}


export const makeFilter = (kind: string, input: string, output: string, range: {start: number, duration: number}, params: any): Filter => {
  if(kind == "zoom") return new ZoomFilter(input, output, range, params);
  throw "Kind not recognized";
}

//TODO zoom_smooth
//https://hhsprings.bitbucket.io/docs/programming/examples/ffmpeg/manipulating_video_colors/use_of_geq_as_zoompan_alternative.html
