import BaseRepository from './BaseRepository';
import Video from '../Types/Video'; 

export default class VideoRepository extends BaseRepository {
  async findAll(): Promise<Video[]> {
    const pool = await this.getPool();

    const result = await pool.query('SELECT * from videos');

    await pool.end();

    return result.rows;
  }

  async findNonDownloadedVideos(): Promise<Pick<Video, 'video_url' | 'intern_id' | 'video_file_path'>[]> {
    const pool = this.getPool();

    const result = await pool.query(`SELECT video_url, intern_id from videos WHERE video_file_path is NULL AND video_url IS NOT NULL`)

    await pool.end();

    return result.rows;
  }

  async assignDownload(video : Pick<Video, 'intern_id' | 'video_file_path'>): Promise<void> {
    const pool = this.getPool();

    await pool.query('UPDATE videos SET video_file_path = $1 WHERE intern_id = $2', [video.video_file_path, video.intern_id]);
    pool.end();
  }

  async findBestVideosOfWeek(): Promise<Video[]> {
    const startDay = (() => { const date = new Date(); date.setDate(-7); return date})();
    const endDay = new Date();

    const pool = await this.getPool();

    const result = await pool.query('SELECT * from videos WHERE date BETWEEN $1 and $2 ORDER BY likes DESC LIMIT 30', [
      startDay.toISOString().split('T')[0],
      endDay.toISOString().split('T')[0]
    ]);

    await pool.end();

    return result.rows;
  }

  async insertVideo(video: Video): Promise<any> {
    const pool = await this.getPool();

    const columnInfo = this.getColumnsValuesString({
      user: video.user,
      url: video.url,
      video_url: video.video_url,
      id: video.id,
      date: video.date,
      likes: video.likes,
      comments: video.comments,
      shares: video.shares
    });

    const response = await pool.query(`INSERT INTO videos ${columnInfo.columns} VALUES ${columnInfo.placeholders} 
    ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url, date = EXCLUDED.date RETURNING *`,
      columnInfo.values);
    await pool.end();

    return response.rows[0];
  }

  async isOldVideo(id: Video['id']) {
    const pool = await this.getPool();

    const weekAgo = (() => { const date = new Date(); date.setDate(-7); return date})();

    console.log(weekAgo.toISOString().split('T')[0]);
    console.log(id)

    const response = await pool.query('SELECT COUNT(*) FROM "videos" WHERE "date" <= $1 AND "id" = $2', 
      [weekAgo.toISOString().split('T')[0], id]);

    await pool.end();

    console.log(response.rows);

    return response.rows && response.rows.length && response.rows[0].count >= 1;
  }
}
