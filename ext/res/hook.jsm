/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Usage:
  // To hook DownloadUtils.getDownloadStatus:
  var hook_getDownloadStatus = hook(DownloadUtils, "getDownloadStatus",
    function(...args) {
      // Either call the original...
      var retval = hook_getDownloadStatus.target.apply(this, args);

      // ...or don't.
      var retval = 42;

      return retval;
    }
  );

  // To disable the hook temporarily:
  hook_getDownloadStatus.enable = false;

  // To unhook (on extension shutdown):
  unload(function() {
    hook_getDownloadStatus.unhook();
  });
*/

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
let EXPORTED_SYMBOLS = ["hook"];

function hook(targetobj, targetfunc, callback) {
  var global = Cu.getGlobalForObject(targetobj);
  var hookfunc = global.eval("(" + function hookfunc() {
    if (!hookfunc.enabled) { return hookfunc.target.apply(this, arguments); }

    return hookfunc.callback.apply(this, arguments);
  } + ")");

  hookfunc.target = targetobj[targetfunc];
  hookfunc.enabled = true;
  hookfunc.callback = callback;
  hookfunc.unhook = function() {
    this.enabled = false;
    delete this.callback;
    delete this.unhook;
  };

  targetobj[targetfunc] = hookfunc;

  return hookfunc;
}
