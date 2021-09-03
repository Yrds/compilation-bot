import { DataTypes, Model, Sequelize } from 'sequelize';

const contentCreatorAttributes = {
  intern_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: {type: DataTypes.STRING, unique: true, allowNull: false }
}

class ContentCreatorModel extends Model { }

export const contentCreatorInit = (sequelize: Sequelize): void => {
  ContentCreatorModel.init(contentCreatorAttributes,
    {
      sequelize,
      modelName: 'ContentCreator'
    }
  );
}

export default ContentCreatorModel;
