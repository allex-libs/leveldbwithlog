function createHookToLogin (execlib, leveldblib, HookToLogMixin) {
  'use strict';

  var lib = execlib.lib,
    Hook = leveldblib.Hook;

  function HookToLog (prophash) {
    Hook.call(this, prophash);
    HookToLogMixin.call(this, prophash.leveldblog, prophash.logcb);
  }
  lib.inherit(HookToLog, Hook);
  HookToLogMixin.addMethods(HookToLog);

  return HookToLog;
}

module.exports = createHookToLogin;
