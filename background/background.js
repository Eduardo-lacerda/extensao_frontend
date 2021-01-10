var highlightMode = false;
var popupOpened = false;
var popupFixed = false;

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
    if (changeInfo.status == 'complete') {
        if(popupOpened) {
            popupOpened = !popupOpened;
            togglePopup();
        }
        chrome.storage.sync.set({'highlightMode': false}, function() {});
        //Carregar os highlights já feitos na página e o log
        _chromeStorage.getHighlights('updateAll');
        //--------------------------------------
    }
});

//Ao clicar no ícone
chrome.browserAction.onClicked.addListener(function (){
    console.log('clicou')
    togglePopup();

    //Resetar highlights
    //chrome.storage.sync.set({'allHighlights': {}}, function() {});
});


function togglePopup() {
    console.log(popupOpened)
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup', data: {highlightMode: highlightMode, popupOpened: popupOpened, popupFixed: popupFixed}});
        });
    });
}

function togglePopupOption(_popupOpened) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup', data: {highlightMode: highlightMode, popupOpened: _popupOpened, popupFixed: popupFixed}});
        });
    });
}

function togglePopupFixed() {
    popupFixed = !popupFixed;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {msg: 'toggle_popup_fixed'});
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
                togglePopupFixed();
                break;
        }
    }
);