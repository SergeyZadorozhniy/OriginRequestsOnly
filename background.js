"use strict";

(function ()
{
    "use strict";
    var debug = true;
    var knownTabs = {};
    var allowedMap;

    /* Reading configuration */
    chrome.storage.sync.get('allowedMap', function (result)
    {
        if (result == null || result.allowedMap == null)
        {
            allowedMap = {};
        }
        else
        {
            allowedMap = result.allowedMap;
            console.log("allowedMap: ", allowedMap);
        }
    });

    chrome.webRequest.onHeadersReceived.addListener(function (details)
    {
        if (details.type == 'main_frame')
        {
            if (debug)
                console.log("onHeadersReceived", details);
            setTimeout(function ()
            {
                if (details != null && details.responseHeaders != null)
                {
                    var section;
                    for (var i in details.responseHeaders)
                    {
                        if (details.responseHeaders[i] != null && (details.responseHeaders[i].name === 'Content-Security-Policy-Report-Only' || details.responseHeaders[i].name === 'Content-Security-Policy') && details.responseHeaders[i].value != null && details.responseHeaders[i].value != '')
                        {
                            var sections = details.responseHeaders[i].value.split(';');
                            for (var j in sections)
                            {
                                section = sections[j].trim();
                                if (section.startsWith('img-src'))
                                {
                                    var allowedImgSrc = [];
                                    var patternList = section.substr('img-src'.length).split(' ');
                                    for (var k in patternList)
                                    {
                                        allowedImgSrc.push(createRegExp(patternList[k]));
                                    }
                                    if (knownTabs[details.tabId].allowedCSP == null)
                                        knownTabs[details.tabId].allowedCSP = {};
                                    knownTabs[details.tabId].allowedCSP.image = allowedImgSrc;
                                }
                            }
                        }
                    }
                }
            }, 0);
        }

        return {cancel: false};
    }, {urls: ["http://*/*", "https://*/*"]}, ["responseHeaders"]);

    chrome.webRequest.onBeforeRequest.addListener(function (details)
        {
            if (details.type == "main_frame")
            {
                knownTabs[details.tabId] = {
                    url: details.url,
                    id: details.tabId,
                    ststistic: {}
                };
                return {cancel: false};
            }

            var baseDomain = extractHostname(knownTabs[details.tabId].url);
            var requestDomain = extractHostname(details.url);

            /* Check origin */
            if (!requestDomain.includes(baseDomain))
            {
                var allowed = false;
                if (allowedMap[baseDomain] != null && allowedMap[baseDomain][requestDomain] == true)
                {
                    allowed = true;
                }
                else
                {
                    /* Content-Security-Policy... */
                    if (knownTabs[details.tabId].allowedCSP != null)
                        for (var contentKey in knownTabs[details.tabId].allowedCSP)
                        {
                            // skip loop if the property is from prototype
                            if (!knownTabs[details.tabId].allowedCSP.hasOwnProperty(contentKey)) continue;

                            if (details.type === contentKey && knownTabs[details.tabId].allowedCSP[contentKey] != null)
                            {
                                for (var i in knownTabs[details.tabId].allowedCSP[contentKey])
                                {
                                    if (knownTabs[details.tabId].allowedCSP[contentKey][i] != null)
                                    {
                                        try
                                        {
                                            var result = knownTabs[details.tabId].allowedCSP[contentKey][i].exec(requestDomain);

                                            if (result != null)
                                            {
                                                if (debug)
                                                    console.log('Allowed by Content-Security-Policy: ', requestDomain, details);
                                                return {cancel: false};
                                            }
                                        }
                                        catch (e)
                                        {
                                            //if(debug)
                                            consoleError(e);
                                        }
                                    }
                                }
                            }
                        }
                }

                //if(debug)
                //	console.log("Base: "+baseDomain+" Request: "+requestDomain+" Contains: "+requestDomain.includes(baseDomain));

                if (knownTabs[details.tabId].ststistic[requestDomain] == null)
                    knownTabs[details.tabId].ststistic[requestDomain] = {allowFlag: allowed, requests: []};

                //? 'allowed by user':'rejected'

                knownTabs[details.tabId].ststistic[requestDomain].requests.push(details);

                if (allowed)
                    return {cancel: false};
                else
                    return {cancel: true}; //, redirectUrl: 'javascript:void(0)'
            }
            else /* Origin Ok */
                return {cancel: false};
        },
        {urls: ["<all_urls>"]},
        ["blocking"]);

    var collectTabs;
    setTimeout(collectTabs = function ()
    {
        chrome.tabs.query({}, function (tabs)
        {
            for (var i in tabs)
                if (tabs.hasOwnProperty(i))
                    knownTabs[tabs[i].id] = tabs[i];
        });
    }, 1000);
    collectTabs();


    chrome.runtime.onUpdateAvailable.addListener(function (details)
    {
        consoleLog('Update available.. ' + (details ? details.version : 'no version info.'));
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
    {

    });

    chrome.extension.onMessage.addListener(function (request, sender, sendResponse)
    {
        "use strict";

        if (request.method === '[ORO:popupQuery]')
        {
            //var baseDomain = extractHostname(knownTabs[details.tabId].url);
            var infoList = [];
            for (var key in knownTabs[request.tabId].ststistic)
            {
                if (!knownTabs[request.tabId].ststistic.hasOwnProperty(key))
                    continue;

                infoList.push({
                    targetDomain: key,
                    rCount: knownTabs[request.tabId].ststistic[key].requests.length,
                    status: knownTabs[request.tabId].ststistic[key].allowFlag ? 'allowed by user' : 'rejected',
                    allowFlag: knownTabs[request.tabId].ststistic[key].allowFlag
                });
            }

            sendResponse({
                selectors: infoList
            });
        }
        else if (request.method === '[ORO:allowRequest]')
        {
            var baseDomain = extractHostname(knownTabs[request.tabId].url);
            if (request.allow)
            {
                if (allowedMap[baseDomain] == null)
                    allowedMap[baseDomain] = {};

                allowedMap[baseDomain][request.targetDomain] = true;
            }
            else
            {
                if (allowedMap[baseDomain] != null)
                    delete allowedMap[baseDomain][request.targetDomain];
            }

            chrome.tabs.reload(request.tabId, {bypassCache: true});

            chrome.storage.sync.set({'allowedMap': allowedMap}, function ()
            {
                console.log('allowedMap saved');
            });
        }
    });


    /***********************************
     *  Utils ...
     ***********************************/

    function createRegExp(pattern)
    {
        "use strict";

        try
        {
            pattern = pattern.replace(/\./g, '\\.');
            pattern = pattern.replace(/\*/g, '.*');
            pattern = '^' + pattern + '$';
            return new RegExp(pattern, 'i');
        }
        catch (e)
        {
            consoleError(e);
            return null;
        }
    }


    function extractHostname(url)
    {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("://") > -1)
        {
            hostname = url.split('/')[2];
        }
        else
        {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    }

})();