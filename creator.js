var Path = require('path');

function createLevelDBWithLog (execlib, leveldblib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    HookMixin = require('./hookmixincreator')(execlib, leveldblib);

  function leveldboptshash2obj (leveldboptshash, path) {
    var dbcreationoptions = leveldboptshash.dbcreationoptions || {},
      outdbcreationoptions;
    leveldblib.encodingMakeup(dbcreationoptions, path);
    outdbcreationoptions = {
      valueEncoding: dbcreationoptions.valueEncoding || 'json'
    }; 
    if (dbcreationoptions.keyEncoding) {
      outdbcreationoptions.keyEncoding = dbcreationoptions.keyEncoding;
    }
    //console.log(dbcreationoptions.valueEncoding, '=>', outdbcreationoptions.valueEncoding, dbcreationoptions, leveldboptshash);
    return {
      dbname: Path.join(path, leveldboptshash.dbname),
      listenable: true,
      dbcreationoptions: outdbcreationoptions
    }
  }

  function LevelDBWithLog (prophash) {
    this.dbdirpath = prophash.path;
    this.kvstorageopts = prophash.kvstorage || {};
    this.kvstorageopts.dbname = this.kvstorageopts.dbname || 'kvstorage.db';
    this.logopts = prophash.log || {};
    this.logopts.dbname = this.logopts.dbname || 'log.db';
    this.kvstorage = null;
    this.log = null;
    this.locks = new qlib.JobCollection();
    this.startDBs(prophash.starteddefer);
  }

  LevelDBWithLog.prototype.destroy = function () {
    if (this.locks) {
      this.locks.destroy();
    }
    this.locks = null;
    if (this.log) {
      this.log.destroy();
    }
    if (this.kvstorage) {
      this.kvstorage.destroy();
    }
    this.log = null;
    this.kvstorage = null;
    this.kvstoragename = null;
    this.dbdirpath = null;
  };

  LevelDBWithLog.prototype.startDBs = function (starteddefer) {
    q.allSettled(this.createStartDBPromises()).then(
      this.onDBsReady.bind(this, starteddefer)
    ).fail(
      this.onDBsFailed.bind(this, starteddefer)
    );
  };

  LevelDBWithLog.prototype.onDBsReady = function (starteddefer) {
    if (starteddefer) {
      starteddefer.resolve(this);
    }
  };

  LevelDBWithLog.prototype.onDBsFailed = function (starteddefer, reason) {
    if (starteddefer) {
      starteddefer.reject(reason);
    }
    this.destroy();
  };

  LevelDBWithLog.prototype.createStartDBPromises = function () {
    var kvsd = q.defer(),
      kvso = leveldboptshash2obj(this.kvstorageopts, this.dbdirpath),
      ld = q.defer(),
      lo = this.logCreateObj(),
      rd = q.defer();

    kvso.starteddefer = kvsd;
    lo.starteddefer = ld;

    this.kvstorage = leveldblib.createDBHandler(kvso);
    this.log = new (leveldblib.DBArray)(lo);
    this.resets = leveldblib.createDBHandler({
      dbname: Path.join(this.dbdirpath, 'resets.db'),
      dbcreationoptions: {
        bufferValueEncoding: ['String', 'UInt48LE', 'UInt48LE', 'UInt32LE']
        //username, minmoment, maxmoment, txncount
      }
    });
    return [kvsd.promise, ld.promise];
  };

  LevelDBWithLog.prototype.logCreateObj = function () {
    var lo = leveldboptshash2obj(this.logopts, this.dbdirpath);
    lo.startfromone = true;
    return lo;
  };

  LevelDBWithLog.prototype.put = function (key,value) {
    return this.kvstorage.put(key,value);
    //TODO work with log....
  };

  LevelDBWithLog.prototype.get = function (key) {
    return this.kvstorage.get(key);
  };

  LevelDBWithLog.prototype.safeGet = function (key, deflt) {
    return this.kvstorage.safeGet(key, deflt);
  };

  LevelDBWithLog.prototype.getWDefault = function (key, deflt) {
    return this.kvstorage.getWDefault(key, deflt);
  };

  LevelDBWithLog.prototype.del = function (key) {
    return this.kvstorage.del(key);
  };

  LevelDBWithLog.prototype.recordReset = function (resetid, username, minmoment, maxmoment, txncount) {
    return this.resets.put(resetid, [username, minmoment, maxmoment, txncount]);
  };

  LevelDBWithLog.prototype.query = function (filterdesc, defer, starteddefer) {
    return this.kvstorage.query(filterdesc, defer, starteddefer);
  };

  LevelDBWithLog.prototype.queryLog = function (filterdesc, defer, starteddefer) {
    return this.log.query(filterdesc, defer, starteddefer);
  };


  LevelDBWithLog.addMethods = function (klass) {
    lib.inheritMethods(klass, LevelDBWithLog,
      'startDBs',
      'onDBsReady',
      'onDBsFailed',
      'createStartDBPromises',
      'logCreateObj',
      'put',
      'get',
      'safeGet',
      'getWDefault',
      'del',
      'recordReset',
      'query',
      'queryLog'
    );
  };

  return q({
    LevelDBWithLog: LevelDBWithLog,
    HookMixin: HookMixin,
    Hook: require('./hookcreator')(execlib, leveldblib, HookMixin)
  });
}

module.exports = createLevelDBWithLog;
