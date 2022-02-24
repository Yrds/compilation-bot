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
  return db.addColumn('chat_message', 'video_id',{
    type: 'int',
    foreignKey: {
      name: 'chat_message_video_id_fk',
      table: 'videos',
      mapping: 'intern_id',
      rules: {
        onDelete: 'CASCADE'
      }
    }
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
