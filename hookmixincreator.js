function createHookToLogMixin (execlib, leveldblib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    Hook = leveldblib.Hook;

  function HookToLogMixin (leveldb, cb) {
    this.logHook = new Hook({leveldb: leveldb, cb:cb||this.onLogChanged.bind(this)});
  }
  HookToLogMixin.prototype.destroy = function () {
    if (this.logHook) {
      this.logHook.destroy();
    }
    this.logHook = null;
  };
  HookToLogMixin.prototype.hookToLog = function (hookobj, defer) {
    console.log('hook2log', require('util').inspect(hookobj, {depth:7}), defer);
    return this.logHook.hook(hookobj, defer);
  };

  HookToLogMixin.prototype.unhookFromLog = function (dbkeys, defer) {
    return this.logHook.unhook(dbkeys, defer);
  };

  HookToLogMixin.prototype.onLogChanged = function (logkey, logvalue) {
  };

  HookToLogMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, HookToLogMixin, 'hookToLog', 'unhookFromLog', 'onLogChanged');
  };

  return HookToLogMixin;
}

module.exports = createHookToLogMixin;
