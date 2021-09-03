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

//TODO add uniques and notNulls properly
exports.up = function(db) {
  return db.createTable('videos', {
    intern_id: {type: 'int', primaryKey: true, autoIncrement: true},
    user: {type: 'string', notNull: false},
    url: {type: 'string', notNull: false},
    video_url: {type: 'string', notNull: false},
    video_file_path: 'string',
    id: {type: 'string', unique: true},
    date: 'date',
    likes: {type: 'int', notNull: false},
    comments: {type: 'int', notNull: false},
    shares: {type: 'int', notNull: false},
    tags: 'string'
  })
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
