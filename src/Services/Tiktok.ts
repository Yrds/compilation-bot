import { parse } from 'node-html-parser';
import { TiktokVideo } from 'src/Types/TiktokVideo';
import https from 'https';

export class TiktokService {
  //TODO private this
  //
  static cookie: string | null = null;

  static async getCookies(): Promise<any> {
    if(this.cookie) return this.cookie;

    const request_options = {
      headers: { 
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36'
      }
    };

    const cookie: string = await new Promise((resolve, reject) => {
      const request = https.get("https://www.tiktok.com/", request_options, (response) => {

        //let oi = "";
        response.on('data', () => {});

        response.on('end', () => {
          const cookieHeader = response.headers['set-cookie'] as string[];

          resolve(cookieHeader.join(';'));

        })

      }).on('error', err => reject(err))
      .end();
    });

    return this.cookie = cookie;
  }

  static async getPageInfo(query_url: string): Promise<TiktokVideo> {

    const cookie = await this.getCookies();

    const request_options = {
      headers: { 
        'Referer': query_url,
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4576.63 Safari/537.36',
        cookie
      }
    };

    const page: string = await new Promise((resolve, reject) => {
      const request = https.get(query_url, request_options, response => {
        let result: string = '';

        response.on('end',() => {
          if(response.statusCode === 403){
            reject("Forbidden")
          } else {
            resolve(result);
          }
        })

        response.on('data', (chunk) => {
          result += chunk;
        })

        response.on('error', (err) => {
          reject(err);
        })

      }).on('error', err => reject(err));
    });

    const root = parse(page);

    const nextData = JSON.parse(root.querySelector('script#__NEXT_DATA__').childNodes[0].text);

    const url: string = nextData.props.initialProps.$fullUrl;
    const user: string = '@' + nextData.props.pageProps.itemInfo.itemStruct.author.uniqueId;
    const id: string = nextData.props.pageProps.itemInfo.itemStruct.id;
    const text: string = nextData.props.pageProps.itemInfo.itemStruct.desc;
    const duration: number = nextData.props.pageProps.itemInfo.itemStruct.video.duration;
    const date: Date = new Date(nextData.props.pageProps.itemInfo.itemStruct.createTime*1000);
    const likes: number = nextData.props.pageProps.itemInfo.itemStruct.stats.diggCount;
    const shares: number = nextData.props.pageProps.itemInfo.itemStruct.stats.shareCount;
    const comments: number = nextData.props.pageProps.itemInfo.itemStruct.stats.commentCount;
    const video_url: string = nextData.props.pageProps.itemInfo.itemStruct.video.playAddr;

    const video: TiktokVideo = {
      url,
      user,
      id,
      date,
      likes,
      comments,
      shares,
      text,
      video_url,
      duration
    };

    return video;
  }

  static async getContentCreatorInfo(query_url: string): Promise<{videos: TiktokVideo | any, creator: any}> {

    const cookie = await this.getCookies();

    const request_options = {
      headers: { 
        'Referer': query_url,
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4576.63 Safari/537.36',
        cookie
      }
    };

    //TODO not working
    const page: string = await new Promise((resolve, reject) => {
      const request = https.get(query_url, request_options, response => {
        let result: string = '';

        response.on('data', (chunk) => {
          result += chunk;
        })

        response.on('end',() => {
          if(response.statusCode === 403){
            reject("Forbidden")
          } else {
            resolve(result);
          }
        })

        response.on('error', (err) => reject(err));

      }).on('error', err => reject(err));
    });

    console.log('page', page);

    const root = parse(page);

    //const nextData = JSON.parse(root.querySelector('script#__NEXT_DATA__').childNodes[0].text);
    //const nextData = JSON.parse(root.querySelector('script#__NEXT_DATA__').childNodes[0].text);



    return {
      videos: [],
      creator: []
    }
  }
}
