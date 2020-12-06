chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({'highlightMode': false}, function() {});

    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

//Adicionar CSS na aba atual
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.storage.sync.set({'highlightMode': false}, function() {});
        chrome.tabs.executeScript(tabId, {file: "jquery.js"});
        chrome.tabs.insertCSS(tabId, {file: 'highlight.css'});
        chrome.tabs.executeScript(tabId, {file: "getHighlights.js"});
    }
});

chrome.browserAction.onClicked.addListener(function (){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id,{file: "highlightMode.js"});
        chrome.tabs.executeScript(tabs[0].id, {file: "popup.js"});
    });
});