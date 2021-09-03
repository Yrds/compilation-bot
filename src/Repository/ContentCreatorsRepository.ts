import BaseRepository from './BaseRepository';
import ContentCreator from '../Types/ContentCreator';

export default class ContentCreatorsRepository extends BaseRepository {
  async findAll(): Promise<ContentCreator[]> {
    const pool = this.getPool();

    const response = await pool.query('SELECT "user" FROM content_creators');

    return response.rows;

    await pool.end();
  }
}
