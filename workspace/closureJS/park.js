(function(){function k(){l();var d=f("screen"),b=document.createElement("img");b.className="screen";b.id="screen";null!=d?(b.src=d,document.getElementsByTagName("body")[0].appendChild(b)):chrome.extension.sendMessage({method:"[AutomaticTabCleaner:getTabInfo]"},function(c){b.src=c.tabInfo.screen;document.getElementsByTagName("body")[0].appendChild(b)});chrome.runtime.onMessage.addListener(function(c,b,d){"[AutomaticTabCleaner:RestoreMessage]"==c.method&&(c.anyWay?g():chrome.tabs.getCurrent(function(b){b.selected&&
c.tab.id==b.id&&g()}))});document.getElementById("resoteImg").onmouseover=function(){g();document.getElementById("resoteImg").className="restore inprogress"}}function g(){m||window.history.back();m=!0}function l(){null==h&&(h=f("title"));document.title=h;a=document.getElementById("faviconLink");null==a&&(a=document.createElement("link"),a.type="image/x-icon",a.rel="shortcut icon");null==e&&n(f("icon"),function(d){e=d;a.href=d;document.getElementsByTagName("head")[0].appendChild(a)});null!=e&&(a.href=
e)}function f(d){var b=null,c=[];location.search.substr(1).split("&").forEach(function(a){c=a.split("=");c[0]===d&&(b=decodeURIComponent(c[1]))});return b}function n(a,b){var c=new Image;c.onload=function(){var a,d;a=window.document.createElement("canvas");a.width=c.width;a.height=c.height;d=a.getContext("2d");d.globalAlpha=.4;d.drawImage(c,0,0);b(a.toDataURL())};c.src=a||chrome.extension.getURL("img/new_page.ico")}var m=!1,h,e,a;l();window.addEventListener("load",k);window.startEX=k})();