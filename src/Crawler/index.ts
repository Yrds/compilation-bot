import { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from 'puppeteer-extra';
import cliProgress from 'cli-progress';
import path from 'path';
import PageOptimizer from './PageOptimizer';
import { noCSS, noImages } from './PageOptimizer/Optmizations';
import fs, { WriteStream } from 'fs';
import { getVideoInfo, openForYouPage, getForYouVideoUrls, TiktokVideo, getCreatorVideoUrls, getTagUrls } from './Actions/Tiktok';
import { getTwitchVideoInfo, getTwitchVideoChat} from './Actions/Twitch';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import VideoRepository from '../Repository/VideoRepository';
import Video from '../Types/Video';
import { TiktokService } from '../Services/Tiktok';
import {ChatMessage} from '../Types/ChatMessage';

let browser: Browser;

type initParams = {contentCreators: string[]}


export const nullWebdriver = async (page: Page) => {
      await page.evaluateOnNewDocument(() => {
        if (navigator.webdriver === false) {
          // Post Chrome 89.0.4339.0 and already good
        } else if (navigator.webdriver === undefined) {
          // Pre Chrome 89.0.4339.0 and already good
        } else {
          // Pre Chrome 88.0.4291.0 and needs patching
          delete Object.getPrototypeOf(navigator).webdriver
        }
      })
}

const Crawler = () => {

  const init = async (options: {contentCreators: string[], maximum?: number}): Promise<any> => {

    if(!options.maximum){
      options.maximum = 5;
    }
    
    browser = await getBrowser({ slowMo: 150 });
    try {

      let urls: string [] = [];

      for(const contentCreator of options.contentCreators){
        try{
          const firstTen = (await getCreatorVideoUrls(browser, {user: contentCreator, maximum: options.maximum}));
          urls.push(...firstTen);
        } catch (err) {
          console.error("Error to get information about contentCreator:", contentCreator, err);
        }
      }

      const videos: Video[] = [];
      let count = 0;
      for(let url of urls) {
        console.log(`crawling url: ${count}/${urls.length}` , url);
        try { 
          const pageInfo = await getVideoInfo(browser, {url});
          videos.push(pageInfo);
        }
        catch(e) {
          console.error("It was not possible get page info of url", url, e);
        }
        count++;
      }

      return videos;
    } catch(err) {
      throw Error(err);
    } finally {
      await browser.close();
    }
  }

  const crawlSpecificTag = async (options: {tag: string, filter?: (video: Video) => boolean, scrollingTime?: number } ) => {
    browser = await getBrowser({ slowMo: 150 });

    try {
      const videos: Video[] = [];

      const urls: string[] = await getTagUrls(browser, {tag: options.tag, scrollingTime: options.scrollingTime});

      let count = 0;

      for(let url of urls) {
        console.log(`crawling url: ${count}/${urls.length}` , url);
        try { 
          const pageInfo = await getVideoInfo(browser, {url});
          if(!options.filter || options.filter(pageInfo)){
            videos.push(pageInfo);
          } else {
            console.log('ignoring', pageInfo.url);
          }
        }
        catch(e) {
          console.error("It was not possible get page info of url", url, e);
        } finally {
          count++;
        }
      }

      return videos;
    } catch(err) {
      throw Error(err);
    } finally {
      await browser.close();
    }
    console.log('closing the browser');
  }

  const crawlSpecificUrls = async (urls: string[]) => {
    const browser = await getBrowser({ slowMo: 150 }) as Browser;

    try {
      const videos: Video[] = [];

      //TODO transform into a function to use in other method to crawl urls
      let count = 0;
      for(let url of urls) {
        console.log(`crawling url: ${count}/${urls.length}` , url);
          try {
            const pageInfo = await getVideoInfo(browser, {url});
            videos.push(pageInfo);
          }
          catch(e) {
            console.error("It was not possible get page info of url", url, e);
        }
        count++;
      }

      return videos;
    } catch(err) {
      throw Error(err);
    } finally {
      await browser.close();
    }
  }

  const getBrowser = async (options: Object = {}): Promise<any> => {
    console.log('creating directory...');
    const directory = fs.mkdirSync('./puppeteer/.local-chromium', {recursive: true});

    const browserFetcher = await puppeteer.createBrowserFetcher({path: path.resolve('./puppeteer/.local-chromium')});

    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    let first = true;
    console.log("Downloading chromium...");
    const revisionInfo = await browserFetcher.download('818858', (downloadBytes: number, totalBytes: number) => {
      if(first){
        bar1.start(totalBytes, 0);
        first = false;
      } else {
        bar1.update(downloadBytes);
      }
    });
    bar1.stop();
    console.log("Download finish");


    try {
      return await (await puppeteer.use(StealthPlugin())).launch({
        headless: false,
        defaultViewport: {width: Math.round(1400), height: Math.round(768)},
        executablePath: revisionInfo.executablePath,
        userDataDir: '/home/yuri/Projetos/All/tiktok_bot/data_dir/',
        ...options
      });
    } catch(err) {
      throw Error(err.message);
    }
  }

  const crawlTwitchVideo = async (url: string): Promise<Video> => {
    browser = await getBrowser({ slowMo: 150 });

    try {
      const video = await getTwitchVideoInfo(browser, {url});

      return video;
    }
    catch(e) {
      throw e;
    } finally {
      await browser.close();
    }
  }

  const crawlTwitchVideoChat = async (url:string, video_id: number) => {
    browser = await getBrowser({ slowMo: 150 });

    try {
      const messages = await getTwitchVideoChat(browser, {url, video_id});
      return messages;
    }
    catch(e) {
      throw e;
    } finally {
      await browser.close();
    }

    return [];
  }

  return {
    init,
    getBrowser,
    crawlSpecificUrls,
    crawlSpecificTag,
    crawlTwitchVideo,
    crawlTwitchVideoChat
  };
}


export default Crawler;
