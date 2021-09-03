import { Page, ElementHandle, Browser } from 'puppeteer';
import { nullWebdriver } from '../../Crawler';
import VideoRepository from '../../Repository/VideoRepository';

export interface TiktokVideo {
  url: string;
  user: string;
  id: string;
  name: string;
  date: Date;
  likes: number;
  comments: number;
  shares: number;
  video_url: string | null;
}

//Human Readable Numbers to Integer
export const HRNToInt = (readableNumber: string | number | null): number => {

  const numberText: string = readableNumber ? readableNumber.toString() : "";

  const numberMultiplicators: Record<string, number> = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };

  const numberParts: string[] = numberText.split('.');

  if(numberParts.length && numberParts.length > 1) {
    const multIndex: string = numberParts[1].charAt(numberParts[1].length-1);
    const numberMultiplicator: number = numberMultiplicators[multIndex];
    const firstNumberPart = parseInt(numberParts[0]) * numberMultiplicator;
    const secondNumberPart = parseInt(numberParts[1]) * numberMultiplicator/10;

    return firstNumberPart + secondNumberPart;

  } else {
    const multIndex: string = numberText.charAt(numberText.length - 1);
    const numberMultiplicator: number = numberMultiplicators[multIndex];

    if(numberMultiplicator) {
      return parseInt(numberText) * numberMultiplicator ;
    } else {
      return parseInt(numberText);
    }
  }

}

const getAttribute = async (page: Page, handle: ElementHandle | null, attribute: string): Promise<string | null> => {
  if(handle) {
    return await page.evaluate((element, attribute) => element.getAttribute(attribute), handle, attribute);
  }
  return null;
}

const getText = async (page: Page, handle: ElementHandle | null): Promise<string | null> => {
  if(handle) {
    return await page.evaluate((element) => element.innerText, handle);
  }
  return null;
}

export const publishDate = (authorText: string): Date => {
  //Ex of dateText(authorText[1].split('-')). could be '19-22' or '2020-03-19' or '3d atrás'

  if(authorText.length && authorText.indexOf("d") !== -1){

    const daysAgo = authorText.split('d')[0];

    if(daysAgo) {
      const publishDate = new Date();
      publishDate.setDate(-parseInt(daysAgo));

      return publishDate;
    }

    return new Date();

  } else if(authorText.length && authorText.indexOf("w") !== -1) {

    const weeksAgo = authorText.split('w')[0];

    if(weeksAgo) {
      const publishDate = new Date();
      publishDate.setDate(-(parseInt(weeksAgo)*7));

      return publishDate;
    }

    return new Date();

  } else {
    const dateFragments = authorText.split('-');

    if(dateFragments.length === 2) {
      return new Date( (new Date()).getFullYear(), Number(dateFragments[0])-1, Number(dateFragments[1]));
    } else if(dateFragments.length === 3) {
      return new Date(Number(dateFragments[2]), Number(dateFragments[0])-1, Number(dateFragments[1]));
    } else {
      return new Date();
    }
  }
};

export const getVideoInfo = async (browser: Browser, options: {url: string}): Promise<TiktokVideo> => {
  const page = await browser.newPage();
  await nullWebdriver(page);

  await page.goto(options.url);
  await page.waitForSelector('strong[title="like"]');

  const urlParts = options.url.split('/');

  const authorFullText = await getText(page, await page.$('.author-nickname'))

  let authorText: string[] = [];

  if(authorFullText) {
    authorText = authorFullText.split('·').map((fragment: string) => fragment.trim());
  }

  const pageInfo = {
    url: options.url,
    user: urlParts[3] || "",
    id: urlParts[5] || "",
    name: (authorText && authorText.length) ? authorText[0] : "",
    date: publishDate(authorText[1]),
    likes: HRNToInt(await getText(page, await page.$('strong[title="like"]'))),
    comments: HRNToInt(await getText(page, await page.$('strong[title="comment"]'))),
    shares: HRNToInt(await getText(page, await page.$('strong[title="share"]'))),
    video_url: await getAttribute(page, await page.$('video'), 'src')
  };

  await page.close();
  return pageInfo;

}

export const getForYouVideoUrls = async(page: Page) => {
  const videoUrls: string[] = [];
  const videoContainers = await page.$$('.item-video-container');

  for(let container of videoContainers) {
    const url = await container.$eval('a', anchor => anchor.getAttribute("href"));
    videoUrls.push(url as string);
  }

  return videoUrls;
}

export const getCreatorVideoUrls = async(browser: Browser, params: {user: string, oldVideos?: boolean}): Promise<string[]> => {

  const videoUrls: string [] = [];

  const page = await browser.newPage();

  await nullWebdriver(page);

  await page.goto("https://www.tiktok.com/" + params.user);

  await page.waitForSelector('.video-feed-item');
  const videoFeedItems = await page.$$('.video-feed-item');

  const videoRepo = new VideoRepository();

  for(const feedItem of videoFeedItems) {
    const url = await feedItem.$eval('a', anchor => anchor.getAttribute("href"));

    if(url && !params.oldVideos){
      const split_url = url.split('/');
      const video_id = split_url[split_url.length-1];
      if(video_id && (await videoRepo.isOldVideo(video_id))){
        console.log('video velho encontrado');
        break;
      }
    }

    videoUrls.push(url as string);
  }

  await page.close();
  return videoUrls;
}



export const openForYouPage = async (page: Page) => {
  await page.goto("https://www.tiktok.com/pt-BR");
} 


