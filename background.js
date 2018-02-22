"use strict";

(function ()
{
    "use strict";
	var knownTabs = {};


	chrome.webRequest.onBeforeRequest.addListener(function (details)
	{
		if(details.type == "main_frame")
		{
			knownTabs[details.tabId] = {
				url: details.url,
				id: details.tabId
			};
			return {cancel: false};
		}

		var baseDomain = extractHostname(knownTabs[details.tabId].url);
		var requestDomain = extractHostname(details.url);

		if(!requestDomain.includes(baseDomain))
		{
			console.log("Base: "+baseDomain+" Request: "+requestDomain+" Contains: "+requestDomain.includes(baseDomain));
			return {cancel: true}; //, redirectUrl: 'javascript:void(0)'
		}
		else
			return {cancel: false};
	},
	{urls: ["<all_urls>"]},
	["blocking"]);

	var collectTabs;
	setTimeout(collectTabs=function()
	{
		chrome.tabs.query({}, function (tabs)
		{
			for (var i in tabs)
                    if (tabs.hasOwnProperty(i))
					knownTabs[tabs[i].id] = tabs[i];
		});
	}, 1000);
	collectTabs();

	function extractHostname(url) 
	{
		var hostname;
		//find & remove protocol (http, ftp, etc.) and get hostname

		if (url.indexOf("://") > -1) {
		   hostname = url.split('/')[2];
		}
		else {
		   hostname = url.split('/')[0];
		}

		//find & remove port number
		hostname = hostname.split(':')[0];
		//find & remove "?"
		hostname = hostname.split('?')[0];

		return hostname;
	}


	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) 
		{
			"use strict";
		}
	);


	chrome.runtime.onUpdateAvailable.addListener(function(details){
		consoleLog('Update available.. '+(details ? details.version : 'no version info.'));
	});

	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
	    
	});

})();