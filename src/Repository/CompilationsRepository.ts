import BaseRepository from './BaseRepository';
//import Video from '../Types/Video'; 
//

export default class CompilationsRepository extends BaseRepository {
  async createCompilation(video_ids: number[]) {
    const pool = await this.getPool();

    await pool.query("BEGIN");

    const compilations_res = await pool.query("INSERT INTO compilations DEFAULT VALUES RETURNING *");

    const compilation_id = compilations_res.rows[0].internal_id;

    //TODO optmize performance with multiple values insert
    for(const video_id of video_ids) {
      await pool.query(`INSERT INTO compilations_videos (compilation_id, video_id) VALUES($1, $2)`,
        [compilation_id, video_id]);
    }

    await pool.query("COMMIT");

    await pool.release();

    return compilations_res.rows[0];
  }
}
