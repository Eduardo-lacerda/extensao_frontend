var highlightMode = false;

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});

//Injetar CSS e scripts na aba atual
/* chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.storage.sync.set({'highlightMode': false}, function() {});

        scriptsToInject.forEach(script => {
            chrome.tabs.executeScript(tabId, {file: script});
        });

        cssToInject.forEach(cssFile => {
            chrome.tabs.insertCSS(tabId, {file: cssFile});
        });
    }
}); */



chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete') {
        chrome.storage.sync.set({'highlightMode': false}, function() {});
        chrome.tabs.sendMessage(tabId, {msg: 'toggle_highlightMode', data: {highlightMode: highlightMode}});
        //Carregar os highlights já feitos na página e o log
        _chromeStorage.getHighlights('updateAll');
        //--------------------------------------
    }
});

//Ao clicar no ícone
chrome.browserAction.onClicked.addListener(function (){
    highlightMode = !highlightMode;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_highlightMode', data: {highlightMode: highlightMode}});
        });
    });

    //Resetar highlights
    //chrome.storage.sync.set({'allHighlights': {}}, function() {});
});

//Atualizar log
chrome.runtime.onMessage.addListener(
    function(response, sender, sendResponse){  
        if(response.msg == 'update_log') {
            _chromeStorage.getHighlights('updateLog');
        }
        else if(response.msg == 'update_all') {
            _chromeStorage.getHighlights('updateAll');
        }
    }
);