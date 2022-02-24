import { Page, ElementHandle, Browser } from 'puppeteer';
import { nullWebdriver } from '../../Crawler';
import VideoRepository from '../../Repository/VideoRepository';
import Video from '../../Types/Video';

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
  text: string;
  duration: number;
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
      const parsedNumber = parseInt(numberText) * numberMultiplicator;

      if(isNaN(parsedNumber)){
        console.log("Cannot parse text: not a number, returning 0");
        return 0
      }

      return parsedNumber;
    } else {
      const parsedNumber = parseInt(numberText);

      if(isNaN(parsedNumber)){
        console.log("Cannot parse text: not a number, returning 0");
        return 0;
      }

      return parsedNumber;
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
      publishDate.setDate(publishDate.getDate() - parseInt(daysAgo));


      return publishDate;
    }

    return new Date();

  } else if(authorText.length && authorText.indexOf("w") !== -1) {

    const weeksAgo = authorText.split('w')[0];

    if(weeksAgo) {
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - (parseInt(weeksAgo)*7));

      return publishDate;
    }

    return new Date();

  } else {
    const dateFragments = authorText.split('-');

    console.log('fragments', dateFragments);
    if(dateFragments.length === 2) {
      return new Date( (new Date()).getFullYear(), Number(dateFragments[0])-1, Number(dateFragments[1]));
    } else if(dateFragments.length === 3) {
      return new Date(Number(dateFragments[0]), Number(dateFragments[2])-1, Number(dateFragments[1]));
    } else {
      return new Date();
    }
  }
};

export const getVideoInfo = async (browser: Browser, options: {url: string}): Promise<Video> => {
  const page = await browser.newPage();
  try {
    await nullWebdriver(page);

    await page.goto(options.url);
    await page.waitForSelector('strong[title="like"]');

    const urlParts = options.url.split('/');

    const authorFullText = await getText(page, await page.$('.author-nickname'))

    const nextData: any = JSON.parse(await getText(page, await page.$('script#__NEXT_DATA__')) || "");

    const duration: number = nextData.props.pageProps.itemInfo.itemStruct.video.duration || 0;
    const video_url: string = nextData.props.pageProps.itemInfo.itemStruct.video.playAddr;
    const id: string = nextData.props.pageProps.itemInfo.itemStruct.id;
    const url: string = nextData.props.initialProps.$fullUrl;

    const user: string = '@' + nextData.props.pageProps.itemInfo.itemStruct.author.uniqueId;

    if(!video_url) {
      throw Error("no video url defined");
    }

    if(!id) {
      throw Error("no video id defined");
    }

    let authorText: string[] = [];

    if(authorFullText) {
      authorText = authorFullText.split('·').map((fragment: string) => fragment.trim());
    }

    const pageInfo: Video = {
      url: options.url,
      user,
      //id: urlParts[5].replace("?","") || "",
      id,
      //name: (authorText && authorText.length) ? authorText[0] : "",
      date: publishDate(authorText[1]),
      likes: HRNToInt(await getText(page, await page.$('strong[title="like"]'))),
      comments: HRNToInt(await getText(page, await page.$('strong[title="comment"]'))),
      shares: HRNToInt(await getText(page, await page.$('strong[title="share"]'))),
      text: await getText(page, await page.$('.tt-video-meta-caption')) || "",
      video_url,
      duration,
      platform: 'tiktok'
    };

    return pageInfo;
  } finally {
    await page.close();
  }

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

export const getTagUrls = async(browser: Browser, options: {tag: string, scrollingTime?: number}) => {
  const page = await browser.newPage();

  console.log('goint to ', options.tag)


  try {
    await nullWebdriver(page);

    await page.goto("https://www.tiktok.com/tag/"+options.tag);

    if(!options.scrollingTime) {
      options.scrollingTime = 1;
    }

    let scrollTimes: number = 0;

    while (scrollTimes != options.scrollingTime) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000);
      scrollTimes ++;
    }

    const urls = await page.$$eval('.video-feed-item a.video-feed-item-wrapper', anchor => anchor.map(a => a.getAttribute("href") || ""));

    return urls;
    //const urls = await container.$$eval('a', anchor => anchor.map(a => a.getAttribute("href")));
    // videoUrls.push(url as string);

  } catch(err) {
    throw Error(err);
  } finally {
    await page.close();
  }

  return [];
}

export const getCreatorVideoUrls = async(browser: Browser, params: {user: string, maximum?: number}): Promise<string[]> => {

  if(!params.maximum){
    params.maximum = 10;
  }

  const videoUrls: string [] = [];

  const page = await browser.newPage();

  try {
    await nullWebdriver(page);

    await page.goto("https://www.tiktok.com/" + params.user);

    let scrollTimes: number = 0;

    while (scrollTimes < (params.maximum/5)) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000); // sleep a bit
      scrollTimes ++;
    };

    await page.waitForSelector('.video-feed-item');
    const videoFeedItems = await page.$$('.video-feed-item');

    const videoRepo = new VideoRepository();

    for(const feedItem of videoFeedItems.slice(0,params.maximum)) {
      const url = await feedItem.$eval('a', anchor => anchor.getAttribute("href"));

      videoUrls.push(url as string);
    }

  }
  catch(err) {
    throw Error(err);
  } finally {
    await page.close();
  }

  return videoUrls;
}



export const openForYouPage = async (page: Page) => {
  await page.goto("https://www.tiktok.com/pt-BR");
} 


