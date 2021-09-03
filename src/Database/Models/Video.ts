import { DataTypes, Model } from 'sequelize';

const videoAttributes = {
  intern_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  url: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  video_url: { type: DataTypes.STRING(1024), allowNull: true, unique: true },
  video_file_path: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  user: { type: DataTypes.STRING(255), allowNull: false, unique: false },
  id: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  date: { type: DataTypes.DATEONLY, allowNull: false, unique: false },
  likes: { type: DataTypes.INTEGER, allowNull: false, unique: false },
  comments: { type: DataTypes.INTEGER, allowNull: false, unique: false },
  shares: { type: DataTypes.INTEGER, allowNull: false, unique: false},
  tags: { type: DataTypes.STRING(255), allowNull: true, unique: false },
}

class TiktokVideoModel extends Model {}

export const tiktokVideoInit = (sequelize: any): void => {
  TiktokVideoModel.init(videoAttributes,
    {
      sequelize,
      modelName: 'TiktokVideo'
    }
  );
}

export default TiktokVideoModel;
