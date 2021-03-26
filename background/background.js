var highlightMode = false;
var popupOpened = false;
var popupFixed = false;
var color = 'yellow';
var toggleOpened = false;
var updatedPage = false;
var baseUrlRegex = /^https?:\/\/[^\/]+/i;

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
});


//Ao atualizar a página
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    updatedPage = true;
    if (changeInfo.status == 'complete') {
        console.log('update')
        console.log('highlightMode: ' + highlightMode);
        _chromeStorage.getRating(tabId, tab.url, tab.url.match(baseUrlRegex)[0]);
        if(popupOpened) {
            popupOpened = !popupOpened;
            if(toggleOpened)
                toggleOpened = !toggleOpened;
            togglePopup();
        }
        chrome.storage.local.set({'highlightMode': false}, function() {});
        //Carregar os highlights já feitos na página e o log
        _chromeStorage.getHighlights('updateAll');
        //--------------------------------------
    }
});

//Ao trocar de tab
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        _chromeStorage.getRating(activeInfo.tabId, tab.url, tab.url.match(baseUrlRegex)[0]);
    });
});

//Ao clicar no ícone
chrome.browserAction.onClicked.addListener(function (){
    console.log('clicou')
    updatedPage = false;
    togglePopup();
    //Resetar highlights
    //chrome.storage.local.set({'allHighlights': {}}, function() {});
});


function togglePopup() {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup', data: {highlightMode: highlightMode, popupOpened: popupOpened, popupFixed: popupFixed, color: color, toggleOpened: toggleOpened, updatedPage: updatedPage}});
        });
    });
}

function togglePopupOption(_popupOpened) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup', data: {highlightMode: highlightMode, popupOpened: _popupOpened, popupFixed: popupFixed, color: color, toggleOpened: toggleOpened, updatedPage: updatedPage}});
        });
    });
}

function togglePopupFixed(_popupFixed) {
    popupFixed = !_popupFixed;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup_fixed', data: {popupFixed: _popupFixed}});
        });
    });
}

function toggleHighlightMode(activated) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_highlight_mode', data: {highlightMode: activated}});
        });
    });
}

function setColor(newColor) {
    color = newColor;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'set_color', data: {color: newColor}});
        });
    });
}

function toggleToggle(opened) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_toggle', data: {toggleOpened: opened}});
        });
    });
}

//Atualizar log
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse){  
        switch(message.msg) {
            case 'update_log':
                _chromeStorage.getHighlights('updateLog');
                break;
            case 'update_all':
                _chromeStorage.getHighlights('updateAll');
                break;
            case 'toggle_popup':
                popupOpened = message.data.popupOpened;
                break;
            case 'close_popup':
                togglePopupOption(true)
                break;
            case 'turn_on_highlight_mode':
                toggleHighlightMode(true);
                break;
            case 'turn_off_highlight_mode':
                toggleHighlightMode(false);
                break;
            case 'toggle_popup_fixed':
                togglePopupFixed(message.data.popupFixed);
                break;
            case 'set_color':
                setColor(message.data.color);
                break;
            case 'toggle_toggle':
                toggleOpened = message.data.toggleOpened;
                break;
            case 'close_toggle':
                toggleToggle(true);
                break;
        }
    }
);