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
  return db.createTable('video_urls', {
    internal_id: {type: 'int', primaryKey: true, autoIncrement: true},
    url: {type: 'string', notNull: true, unique: true}
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
