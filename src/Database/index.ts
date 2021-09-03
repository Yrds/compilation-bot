import { Sequelize } from 'sequelize';
//import Event, { eventInit, eventRelations } from './Models/Event';
//import Game, { gameInit, gameRelations } from './Models/Game';
//
import TiktokVideoModel, { tiktokVideoInit } from './Models/Video';
import ContentCreatorModel, { contentCreatorInit } from './Models/Tiktokers';

const database = async (path: string) => {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path
  });

  await tiktokVideoInit(sequelize);
  await contentCreatorInit(sequelize);

  return sequelize;
}

export default database;
