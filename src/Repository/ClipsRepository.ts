import BaseRepository from './BaseRepository';
import { Clip } from '../Types/Clip';

export class ClipsRepository extends BaseRepository {
  async createClip(params: Clip): Promise<Clip> {
    try {
      const knex = await this.getKnex();

      return await knex({clips: 'clips'}).insert(params).returning('*');
    } catch(e) {
      throw e;
    }
  }

  async findClipFromVideo(params: {video_id: number}): Promise<Clip[]> {
    const knex = await this.getKnex();

    return await knex('clips').select('*').where('video_id', params.video_id);
  }

  async find(clip_id: number): Promise<Clip | undefined> {
    try {
      const knex = await this.getKnex();

      const clip = (await knex('clips').select<Clip>('*').where('internal_id', clip_id))[0];

      if(clip){
        return clip;
      }
    } catch(e){
      throw e;
    }

    throw "Cannot find clip with id:" + clip_id;
  }
}
