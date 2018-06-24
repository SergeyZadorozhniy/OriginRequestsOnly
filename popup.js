/*
 * Copyright (c) 2015 Sergey Zadorozhniy. The content presented herein may not, under any circumstances, 
 * be reproduced in whole or in any part or form without written permission from Sergey Zadorozhniy.
 * Zadorozhniy.Sergey@gmail.com
 */
"use strict";

var knownSelectors = [];

redrawTable();
setInterval(redrawTable, 1500);

function redrawTable()
{
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs)
    {
        chrome.extension.sendMessage({method: '[ORO:popupQuery]', tabId: tabs[0].id}, function (res)
        {
            'use strict';

            initSelectors(res.selectors);
        });
    });
}


/********************************************************/

var helloApp = angular.module("helloApp", []);

helloApp.directive('myDirective', function ()
{
    return function (scope, element, attr)
    {
        attr.$observe('value', function (actual_value)
        {
            element.val(actual_value);
        });
        attr.$observe('myChecked', function (actual_value)
        {
            //debugger;
            if (actual_value === 'true')
                element.attr('checked', actual_value);
        });
    }
});

helloApp.directive('myStatus', function ()
{
    return function (scope, element, attr)
    {
        attr.$observe('allowed', function (actual_value)
        {
            //debugger;
            if (actual_value === 'true')
                element.attr('style', "color: #05c705;");
            else
                element.attr('style', "color: #000;");
        });
    }
});

helloApp.directive('myStatusWithRed', function ()
{
    return function (scope, element, attr)
    {
        attr.$observe('allowed', function (actual_value)
        {
            //debugger;
            if (actual_value === 'true')
                element.attr('style', "color: #05c705;");
            else
                element.attr('style', "color: red;");
        });
    }
});

helloApp.controller("CompanyCtrl", function ($scope)
{
    $scope.companies = [

        /*{
         'id': 'Cognizant Technologies',
         'host': 100000,
         'selector': 'Bangalore'
         },*/
    ];

    window.initSelectors = function (selectors)
    {
        for (var i in selectors)
        {
            var exist = false;
            for (var j in knownSelectors)
                if (selectors[i].targetDomain === knownSelectors[j].targetDomain)
                {
                    exist = true;
                    knownSelectors[j].rCount = selectors[i].rCount;
                    knownSelectors[j].status = selectors[i].status;
                    knownSelectors[j].allowFlag = selectors[i].allowFlag;
                    break;
                }
            if (!exist)
                knownSelectors.push(selectors[i]);
        }


        $scope.companies = knownSelectors;
        $scope.$apply();


        $(".allow-ceckbox").on("click", /*"input[type=checkbox]",*/ function ()
        {
            var jqThis = $(this);
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs)
            {
                //if()
                {
                    chrome.extension.sendMessage({
                        method: '[ORO:allowRequest]',
                        tabId: tabs[0].id,
                        targetDomain: jqThis.val(),
                        allow: jqThis[0].checked
                    }, function (res)
                    {
                        redrawTable();
                    });
                }
            });
        });
    };

    $scope.addRow = function ()
    {
        $scope.companies.push({'id': $scope.id, 'host': $scope.host, 'selector': $scope.selector});
        $scope.id = '';
        $scope.host = '';
        $scope.selector = '';
    };
});