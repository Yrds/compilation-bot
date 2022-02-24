'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('clips', {
    internal_id: {type: 'int', primaryKey: true, autoIncrement: true},
    offset_seconds: {type: 'int',  allowNull: false},
    duration: {type: 'int',  allowNull: false},
    video_id: {
      type: 'int',
      allowNull: false,
      foreignKey: {
        name: 'clips_video_id_fk',
        table: 'videos',
        mapping: 'intern_id',
        rules: {
          onDelete: 'CASCADE'
        }
      }
    },
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
