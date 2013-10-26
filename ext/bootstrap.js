/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Old Identity Block Style.
 *
 * The Initial Developer of the Original Code is
 *   Dagger <dagger.bugzilla+oldidentityblockstyle@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   The Mozilla Foundation
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function addHandlers(window) {
  var listener = {
    onLinkIconAvailable: function (aBrowser, url) {
      if (window.gProxyFavIcon)
        if (window.gBrowser.selectedBrowser == aBrowser && window.gBrowser.userTypedValue === null)
          PageProxySetIcon(aBrowser.mIconURL);
    },
  }

  function PageProxySetIcon(aURL) {
    if (!window.gProxyFavIcon)
      return;
  
    if (!aURL)
      PageProxyClearIcon();
    else if (window.gProxyFavIcon.getAttribute("src") != aURL)
      window.gProxyFavIcon.setAttribute("src", aURL);
  }

  function PageProxyClearIcon() {
    window.gProxyFavIcon.removeAttribute("src");
  }

  var SetPageProxyState_hookenabled = true;
  var orig_SetPageProxyState = window.SetPageProxyState;
  window.SetPageProxyState = function(aState) {
    var ret = orig_SetPageProxyState.apply(this, arguments);
    if (SetPageProxyState_hookenabled) {
      if (aState == "valid")
        PageProxySetIcon(window.gBrowser.getIcon());
      else if (aState == "invalid")
        PageProxyClearIcon();
    }
    return ret;
  };

  window.gBrowser.addTabsProgressListener(listener);
  unload(function() {
    SetPageProxyState_hookenabled = false;
    window.gBrowser.removeTabsProgressListener(listener);
    PageProxyClearIcon();
  }, window);
  
  if (window.gProxyFavIcon)
    if (window.gProxyFavIcon.getAttribute("pageproxystate") == "valid")
      PageProxySetIcon(window.gBrowser.getIcon());
}

//#if 0
function logmsg(aMessage) {
  var args = Array.slice(arguments, 0);
  if (args && typeof(aMessage) === "string")
    aMessage = aMessage.replace(/\{(\d+)\}/g, function ($0, $1) args[$1]);
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage("Old Identity Block Style: " + aMessage);
}
//#endif

function registerStyleSheet() {
  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                      .getService(Components.interfaces.nsIStyleSheetService);
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(Components.interfaces.nsIIOService);
  var uri = ios.newURI("chrome://oldidentityblockstyle/skin/faviconinaddressbar.css", null, null);
  sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
  unload(function() sss.unregisterSheet(uri, sss.AGENT_SHEET));
}

/**
 * Handle the extension being activated on install/enable
 */
function startup(data, reason) {
  Cu.import("chrome://oldidentityblockstyle/content/watchwindows.jsm");
  registerStyleSheet();

  watchWindows(addHandlers);
}

/**
 * Handle the extension being deactivated on uninstall/disable
 */
function shutdown(data, reason) {
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN) {
    unload();
    Cu.unload("chrome://oldidentityblockstyle/content/watchwindows.jsm");
  }
}

/**
 * Handle the extension being installed
 */
function install(data, reason) {}

/**
 * Handle the extension being uninstalled
 */
function uninstall(data, reason) {}
