import BaseRepository from './BaseRepository';
import ContentCreatorsRepository from './ContentCreatorsRepository';
import Video from '../Types/Video'; 

export type bestVideosQuery = {days: number, tags?: string, limit?: number, user?: string};

export default class VideoRepository extends BaseRepository {
  async findAll(): Promise<Video[]> {
    const pool = await this.getPool();

    const result = await pool.query('SELECT * from videos');

    await pool.release();

    return result.rows;
  }

  async find(params: {video_id: number}): Promise<Video | undefined> {
    const knex = await this.getKnex();

    return (await knex('videos').select('*').where('intern_id', params.video_id).limit(1))[0];
  }

  async findNonDownloadedVideos(): Promise<Pick<Video, 'platform' | 'video_url' | 'intern_id' | 'video_file_path' | 'url'>[]> {
    const pool = await this.getPool();

    const result = await pool.query(`SELECT platform, video_url, intern_id, url from videos WHERE video_file_path is NULL AND video_url IS NOT NULL`)

    await pool.release();

    return result.rows;
  }

  async assignDownload(video : Pick<Video, 'intern_id' | 'video_file_path'>): Promise<void> {
    const pool = await this.getPool();

    await pool.query('UPDATE videos SET video_file_path = $1 WHERE intern_id = $2', [video.video_file_path, video.intern_id]);
    pool.release();
  }

  async findBestVideosOfWeek(options: bestVideosQuery): Promise<Pick<Video, 'duration' | 'user' | 'url' | 'likes' |'video_file_path' |'intern_id' | 'date' >[]> {

    const limit: number = options.limit || 7;
    const days: number = options.days || 7;

    const startDay = (() => { const date = new Date(); date.setDate(date.getDate()-days); return date})(); //TODO add parameter for days
    const endDay = new Date();

    const pool = await this.getPool();

    let additionalWhere: Record<string, any> = {};
    const values = [
      startDay.toISOString().split('T')[0],
      endDay.toISOString().split('T')[0],
      limit
    ];


    if(options.tags){
      const tags = options.tags;
      additionalWhere['tags LIKE'] = "%" + tags + "%";
    }

    if(options.user){
      const user = options.user;
      additionalWhere['"user" ='] = user;
    }

    additionalWhere['platform ='] = "tiktok";

    const getAdditionalWhereString = () : string => {
      const keys: string[] = Object.keys(additionalWhere);
      if(keys.length) {
        return keys.reduce((acc, k) => {

          values.push(additionalWhere[k]);
          acc += ` AND ${k} $${values.length}`;

          console.log('acc', acc);
          return acc;
        }, "") + " ";
      } else {
        return "";
      }
    }

    const isDistinct = options.user ? false : true;
    const onlyNonCompiled: boolean = options.user ? false : true;

    const query = {
      name: 'find videos',
      text: `SELECT ${isDistinct ? '* FROM (SELECT DISTINCT on ("user")': ""} "user", "date", "duration", "url", likes, video_file_path, intern_id from videos WHERE ${onlyNonCompiled ? " videos.intern_id NOT IN (select video_id from compilations_videos)  AND" : ""} elegible = 1 ${getAdditionalWhereString()} AND date BETWEEN $1 and $2 ORDER BY ${isDistinct ? ") t ORDER by likes DESC" : "likes DESC"}  LIMIT $3 `,
      values
    };

    console.log('query', query);

    const result = await pool.query(query);

    await pool.release();

    return result.rows;
  }

  async insertVideo(video: Video, update: Partial<Video> = {}): Promise<Video> {
    const pool = await this.getPool();

    try {
      const columnsToBeInserted: Partial<Video> = {
        user: video.user,
        url: video.url,
        video_url: video.video_url,
        id: video.id,
        date: video.date,
        likes: video.likes,
        comments: video.comments,
        shares: video.shares,
        text: video.text,
        duration: video.duration,
        platform: video.platform
      }

      if(update.tags) {
        columnsToBeInserted.tags = update.tags;
      } else {
        //TODO maybe pass this to a query instead call repository again
        const contentCreatorsRepo = new ContentCreatorsRepository();
        const contentCreator = await contentCreatorsRepo.findByUser(video.user);
        if(contentCreator) {
          columnsToBeInserted.tags = contentCreator.tags;
        }
      }

      const columnInfo = this.getColumnsValuesString(columnsToBeInserted);

      const response = await pool.query(`INSERT INTO videos ${columnInfo.columns} VALUES ${columnInfo.placeholders}
    ON CONFLICT (id) DO UPDATE SET tags = EXCLUDED.tags, text = EXCLUDED.text, duration = EXCLUDED.duration, video_url = EXCLUDED.video_url, date = EXCLUDED.date, likes = EXCLUDED.likes, shares = EXCLUDED.shares, comments = EXCLUDED.comments RETURNING *`,
        columnInfo.values);

      return response.rows[0];
    } finally {
      await pool.release();
    }

  }

  async isOldVideo(id: Video['id']) {
    const pool = await this.getPool();

    const weekAgo = (() => { const date = new Date(); date.setDate(-7); return date})();

    const response = await pool.query('SELECT COUNT(*) FROM "videos" WHERE "date" <= $1 AND "id" = $2', 
      [weekAgo.toISOString().split('T')[0], id]);

    await pool.release();

    return response.rows && response.rows.length && response.rows[0].count >= 1;
  }

  async findVideosFromCompilation(options: {compilation_id: number}): Promise<any>{
    try {
      const pool = await this.getPool();

      const result = await pool.query(`SELECT videos.* from videos WHERE 
      videos.intern_id IN (select video_id from compilations_videos WHERE compilations_videos.compilation_id = $1) ORDER BY (likes, shares, comments) DESC`,
        [options.compilation_id]);

      await pool.release();

      return result.rows;
    } catch(e) {
      throw e;
    }
  }

  //change name older than to another one like maximumOld
  async findVideosURLS(options: {olderThan?: number, onlyNonDownloaded?: boolean}): Promise<Video[]> {
    try {
      const knex = await this.getKnex();

      const onlyNonDownloaded = options.onlyNonDownloaded || false;

      const dateLimit: number = options.olderThan ? options.olderThan : 7;

      const weekAgo = (() => { const date = new Date(); date.setDate(date.getDate() - dateLimit); return date})();

      let query = knex({v: 'videos'}).where('date', '>', weekAgo.toISOString().split('T')[0]);

      if(onlyNonDownloaded) {
        console.log('downloading only non downloaded...')
        query = query.whereNull('video_file_path');
      }

      return query.select<Video[]>('*');
    } catch(e) {
      throw e;
    }
  }

  //TODO deleteFileFromOldVideos() //Delete video older than 1month or configuration
}
