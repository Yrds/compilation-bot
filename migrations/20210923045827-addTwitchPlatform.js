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
  return db.createTable('chat_message', {
    internal_id: {type: 'int', primaryKey: true, autoIncrement: true},
    text: 'string',
    content_offset_seconds: 'decimal',
  }, () => {
    db.addColumn('videos', 'platform', {
      type: 'string', notNull: true, defaultValue: 'tiktok'
    }, () => {
      db.changeColumn('videos', 'platform', {
        defaultValue: null
      })
    })
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
