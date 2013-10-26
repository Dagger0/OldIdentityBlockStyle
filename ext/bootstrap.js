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
  function PageProxySetIcon(aURL, aTab) {
    if (!window.gProxyFavIcon)
      return;

    if (aTab && aTab != window.gBrowser.selectedTab)
      return;

    // Clear the favicon if the new URI is null, or if pageproxystate == invalid
    // (which usually means the user has typed into the address bar, so the
    // address bar no longer reflects the page's identity.)
    if (!aURL || window.gProxyFavIcon.getAttribute("pageproxystate") == "invalid") {
      return PageProxyClearIcon();
    }

    if (window.gProxyFavIcon.getAttribute("src") != aURL) {
      window.gProxyFavIcon.setAttribute("src", aURL);
    }
  }

  function PageProxyClearIcon() {
    window.gProxyFavIcon.removeAttribute("src");
  }

  function onTabSelect(evt) {
    PageProxySetIcon(window.gBrowser.getIcon(), evt.originalTarget);
  }
  window.gBrowser.tabContainer.addEventListener("TabSelect", onTabSelect);

  var hook_setIcon = hook(window.gBrowser, "setIcon", function(aTab, aURI) {
    if (aTab == window.gBrowser.selectedTab) {
      PageProxySetIcon(aURI instanceof Ci.nsIURI ? aURI.spec : aURI, aTab);
    }
    return hook_setIcon.target.apply(this, arguments);
  });

  // Change the favicon back to the default when
  // the user starts typing into the address bar.
  var hook_SetPageProxyState = hook(window, "SetPageProxyState", function(aState) {
    var ret = hook_SetPageProxyState.target.apply(this, arguments);
    // PageProxySetIcon will take care of reverting the icon to the
    // default favicon, based on the new pageproxystate value.
    PageProxySetIcon(window.gBrowser.getIcon());
    return ret;
  });

  // Restore browser.identity.ssl_domain_display functionality for non-EV domains.
  var hook_setIdentityMessages = hook(window.gIdentityHandler, "setIdentityMessages", function(newMode) {
    var ret = hook_setIdentityMessages.target.apply(this, arguments);
    if (newMode == this.IDENTITY_MODE_DOMAIN_VERIFIED) {
      switch (window.gPrefService.getIntPref("browser.identity.ssl_domain_display")) {
        case 2: // Show full domain
          icon_label = this._lastLocation.hostname;
          break;
        case 1: // Show eTLD.
          icon_label = this.getEffectiveHost();
          break;
        case 0:
          icon_label = "";
      }
      this._identityIconLabel.value = icon_label;
      this._identityIconLabel.parentNode.collapsed = icon_label ? false : true;
    }
    return ret;
  });

  unload(function() {
    window.gBrowser.tabContainer.removeEventListener("TabSelect", onTabSelect);
    hook_SetPageProxyState.unhook();
    hook_setIdentityMessages.unhook();
    hook_setIcon.unhook();
    PageProxyClearIcon();
  }, window);

  // Make sure gProxyFavIcon is defined.
  if (!window.gProxyFavIcon)
    window.gProxyFavIcon = window.document.getElementById("page-proxy-favicon");
  
  // Set the favicon on the current tab.
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

function setDefaultPrefs() {
  var branch = Services.prefs.getDefaultBranch("");
  branch.setIntPref("browser.identity.ssl_domain_display", 1);
}

/**
 * Handle the extension being activated on install/enable
 */
function startup(data, reason) {
  Cu.import("chrome://oldidentityblockstyle/content/watchwindows.jsm");
  Cu.import("chrome://oldidentityblockstyle/content/hook.jsm");
  registerStyleSheet();
  setDefaultPrefs();

  watchWindows(addHandlers);
}

/**
 * Handle the extension being deactivated on uninstall/disable
 */
function shutdown(data, reason) {
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN) {
    unload();
    Cu.unload("chrome://oldidentityblockstyle/content/hook.jsm");
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
