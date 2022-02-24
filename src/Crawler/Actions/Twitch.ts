import { Page, ElementHandle, Browser, HTTPResponse } from 'puppeteer';
import { nullWebdriver } from '../../Crawler';
import VideoRepository from '../../Repository/VideoRepository';
import Video from '../../Types/Video';
import { ChatMessage } from '../../Types/ChatMessage';
import https from 'https';


export const getTwitchVideoInfo = async (browser: Browser, options: {url: string}): Promise<Video> => {
  const page = await browser.newPage();

  try {
    console.log('opening url...', options.url);

    const metadata: { duration: number,
        date: Date,
        user: string,
        video_id: string,
        id: string,
    } = await new Promise(async (resolve, reject) => {

      let duration: number = 0;
      let date: Date;
      let user: string;

      const timeout = setTimeout(() => {
        reject("Not possible to extract video metadata");
      }, 10000);
      const captureGql = async (res: HTTPResponse) => {


        if(res.url().indexOf('gql') !== -1 && res.request().method() === "POST"){
          const json = await res.json();
          if(json.length){
            json.forEach((el: any) => {
              if(el.data && el.data.user && el.data.video && el.data.video.createdAt && el.data.video.lengthSeconds){
                console.log('data', el.data);

                user = el.data.video.owner.login;
                duration = el.data.video.lengthSeconds;
                date = new Date(Date.parse(el.data.video.createdAt));
                const content_url_parts = el.data.video.previewThumbnailURL.split('/');
                const id = content_url_parts[4];
                console.log('content_url_parts', content_url_parts);
                const video_id = content_url_parts[5];

                clearTimeout(timeout);
                page.off('response', captureGql);

                resolve({
                  duration,
                  date,
                  user,
                  id,
                  video_id
                });

              }
            })
          }
        }
      };

      page.on('response', captureGql);

      await page.goto(options.url);
    });


    const video_url = `https://${metadata.id}.cloudfront.net/${metadata.video_id}/720p60/index-dvr.m3u8`;
    console.log('video_url', video_url)

    const streamTitle = await page.$eval('h2[data-a-target="stream-title"]', handle => {return handle.getAttribute('title')});

    if(!streamTitle){
      throw "Not possible to get stream title";
    }

    const content_id: string = options.url.split('/').reduce((acc, el) => {
      if(!isNaN(parseInt(el))){
        acc = el;
      }

      return acc;
    }, "");

    if(content_id == "") {
      throw "Not possible to get content_id";
    }

    return {
      url: options.url,
      id: content_id,
      user: metadata.user,
      video_url,
      text: streamTitle,
      platform: 'twitch',
      date: metadata.date,
      duration: metadata.duration,
    }

  } catch(e) {
    throw e;
  } finally {
    await page.close();
  }
}

export const getTwitchVideoChat = async (browser: Browser, options: {url: string, video_id: number}): Promise<ChatMessage[]> => {
  const page = await browser.newPage();

  const video_id = options.video_id;

  const comments: ChatMessage[] = [];


  try {
    const [_, res] = await Promise.all([
      page.goto(options.url),
      page.waitForResponse(res => { 
        return (res.url().indexOf('comments?content_offset') !== -1 && res.request().method() === "GET");
      })
    ])

    console.log('waiting response')

    //TODO get client id other way to get private videos
    //TODO get pogu live private VODS
    const headers = await res.request().headers();
    const commentUrl = await (res.url()).split('=')[0].replace("content_offset_seconds", "cursor");
    let next = (await res.json())._next;

    const commentsJSON = (await res.json()).comments;

    commentsJSON.forEach((comment: any) => {
      comments.push({
        text: comment.message.body,
        content_offset_seconds: comment.content_offset_seconds,
        video_id
      })
    })

    while(next) {
      console.log('comments: ', comments.length);
      const response = await new Promise((resolve, reject) => {
        https.get(commentUrl+'='+next, {headers}, req => {
          let data = "";
          if(req.statusCode !== 200) {
            reject('error: ' + req.statusCode)
          } else {
            req.on('data', chunk => data += chunk)
            req.on('end', () => resolve(data))
          }
        });
      });

      try {
        const parsedResponse = JSON.parse(response as string);
        if(parsedResponse && parsedResponse.comments) {
          parsedResponse.comments.forEach((comment: any) => {
            comments.push({
              text: comment.message.body,
              content_offset_seconds: comment.content_offset_seconds,
              video_id
            })
          })
        }
        next = parsedResponse._next;
      } catch(e) {
        console.error(e);
      }


      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 250)
      })
    }
  } catch(e){

    throw e;
  }

  await page.close();

  return comments;
}

