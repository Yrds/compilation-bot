import BaseRepository from './BaseRepository';
import ContentCreator from '../Types/ContentCreator';

export default class ContentCreatorsRepository extends BaseRepository {
  async findAll(): Promise<ContentCreator[]> {
    const pool = await this.getPool();

    const response = await pool.query('SELECT "user" FROM content_creators WHERE status = 1');

    await pool.release();

    return response.rows;
  }

  async findByUser(user: string): Promise<ContentCreator | undefined> {
    const pool = await this.getPool();

    try {
      const response = await pool.query('SELECT * FROM content_creators where "user" = $1 LIMIT 1', [user]);

      return response.rows[0];
    } finally {
      await pool.release();
    }
  }
}
