const scriptsToInject = ['utils/jquery.js', 'content-scripts/xpath.js', 
'content-scripts/dataControl.js', 'content-scripts/highlighter.js'];
const cssToInject = ['css/highlight.css', 'css/popup.css'];

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

//Injetar CSS e scripts na aba atual
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.storage.sync.set({'highlightMode': false}, function() {});

        scriptsToInject.forEach(script => {
            chrome.tabs.executeScript(tabId, {file: script});
        });

        cssToInject.forEach(cssFile => {
            chrome.tabs.insertCSS(tabId, {file: cssFile});
        });
    }
});

//Ao clicar no ícone
chrome.browserAction.onClicked.addListener(function (){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.executeScript(tabs[0].id, {file: "popup/popup.js"});
    });
});