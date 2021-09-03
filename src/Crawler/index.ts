import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer';
//import puppeteer from 'puppeteer-extra';
import cliProgress from 'cli-progress';
import path from 'path';
import PageOptimizer from './PageOptimizer';
import { noCSS, noImages } from './PageOptimizer/Optmizations';
import fs, { WriteStream } from 'fs';
import { getVideoInfo, openForYouPage, getForYouVideoUrls, TiktokVideo, getCreatorVideoUrls } from './Actions/Tiktok';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import VideoRepository from '../Repository/VideoRepository';

let browser: Browser;

type initParams = {contentCreators: string[]}


interface CrawlerInterface {
  init: (options: initParams) => Promise<any>;
  getBrowser: (options: any) => Promise<any>;
}

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

const Crawler = (): CrawlerInterface => {

  const init = async (options: initParams): Promise<any> => {
    try {
      browser = await getBrowser({ headless: false });

      


      let urls: string [] = [];


      for(const contentCreator of options.contentCreators){
        urls.push(...(await getCreatorVideoUrls(browser, {user: contentCreator})))
      }

      const videos: TiktokVideo[] = [];
      for(let url of urls) {
        //TODO verificar se esse vídeo precisa ser verificado
        //ex: se faz mas de uma semana que foi postado
        //ex. await videoRepository.isVideoOld(url);
        try { 
          const pageInfo = await getVideoInfo(browser, {url});
          videos.push(pageInfo);
        }
        catch(e) {
          console.error("It was not possible get page info of url", url, e);
        }
      }

      await browser.close();

      return videos;
    } catch(err) {
      throw Error(err);
    }
  }

  const getBrowser = async (options: Object = {}): Promise<Browser> => {
    console.log('creating directory...');
    const directory = fs.mkdirSync('./puppeteer/.local-chromium', {recursive: true});

    const browserFetcher = puppeteer.createBrowserFetcher({path: path.resolve('./puppeteer/.local-chromium')});

    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    let first = true;
    console.log("Downloading chromium...");
    const revisionInfo = await browserFetcher.download('782078', (downloadBytes: number, totalBytes: number) => {
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
      return await puppeteer.launch({
        defaultViewport: {width: Math.round(1024), height: Math.round(768)},
        executablePath: '/usr/bin/chromium', //revisionInfo.executablePath,
        ...options
      });
    } catch(err) {
      throw Error(err.message);
    }
  }

  return {
    init,
    getBrowser
  };
}


export default Crawler;
