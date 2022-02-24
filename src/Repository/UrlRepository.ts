import BaseRepository from './BaseRepository';
import VideoUrl from '../Types/VideoUrl';

export default class UrlRepository extends BaseRepository {
  async findAll(): Promise<VideoUrl[]>{

    const client = await this.getClient();

    const result = await client.query("SELECT * from video_urls", []);

    await client.release();

    return result.rows;
  }

  async deleteAll(urls: Pick<VideoUrl , 'url'>[] = []): Promise<void> {
    const client = await this.getClient();

    const where = urls.length ? `WHERE url IN (${urls.map((el, idx) => '$'+(idx+1)).join(',')}) ` : undefined; 

    const query = "DELETE FROM video_urls " + (where || "");

    const result = await client.query(query, where ? [...(urls.map(video_url => video_url.url))] : undefined);

    await client.release();
  }
}
