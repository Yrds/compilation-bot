import BaseRepository from './BaseRepository';
import { ChatMessage } from '../Types/ChatMessage';

export default class ChatRepository extends BaseRepository {
  async insertChatMessage(chatMessages: ChatMessage[]): Promise<void> {

    const knex = await this.getKnex();

    console.log('inserting chats');
    await knex.batchInsert('chat_message', chatMessages, 30);
    console.log('chats inserted');
  }

  async find(params: {video_id: number}): Promise<ChatMessage[] | undefined> {
    const knex = await this.getKnex();

    return await knex<ChatMessage[]>('chat_message').where('video_id', params.video_id).select<ChatMessage[]>('*');
  }
}
