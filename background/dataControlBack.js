const currentURL = window.location.href;
var log = {};
highlightData = {};


//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if(message.msg == 'load_all_highlights'){
        _chromeStorage.getHighlights();
    }
    return true;
});
//--------------------------------------

var _chromeStorage = {
    /* Estrutura do objeto:
    {
        'allHighlights': {
            "http://example": {
                "highlights": [
                    {"xpath": "teste", "text": "exemplo de highlight", color:"yellow"}
                ]
                "icon": "https://icon.png"
            }
        }
    } */

    getHighlights: function (callBack) {
        var that = this;
        chrome.storage.sync.get('allHighlights', function(data) {
            if(data['allHighlights']){
                data = data['allHighlights'];
                highlightData = data;
                if(callBack == 'updateAll') {
                    that.updateLog(data);
                    that.updatePageHighlights(data);
                }
                else if(callBack == 'updateLog')
                    that.updateLog(data);
                else if(callBack == 'updatePageHighlights')
                    that.updatePageHighlights(data);
            }
        }); 
    },

    saveHighlight: function(xpath, text) {
        chrome.storage.sync.get('allHighlights', function(data) {
            if(!data['allHighlights'])
                data['allHighlights'] = {}; //Caso não existem highlights
            var allHighlights = data['allHighlights'];

            if(!allHighlights[currentURL]) //Caso a página atual já tenha sido salva
                allHighlights[currentURL] = {};
            var currentPage = allHighlights[currentURL];
            
            var highlight = {'text': text, 'xpath': xpath, 'color': color};
            if(!currentPage['highlights']) //Caso não existam highlights na página atual
                currentPage['highlights'] = [];
            currentPage['highlights'].push(highlight);
            const pageIcon = _utils.getPageIcons();
            currentPage['icon'] = pageIcon[0];
            allHighlights[currentURL] = currentPage;
            chrome.storage.sync.set({'allHighlights': allHighlights}, function() {});
        });
    },

    updateLog: function(data) {
        log = data;
        var logsHTML = '';
        for (url in data){
            const urlData = data[url];
            const iconImg = '<div class="icon-wrapper"><img class="log-web-icon" src="' + urlData.icon + '"></div>';
            urlData.highlights.forEach(highlight => {
                var logHTML = '<div class="log-wrapper">';
                var text = '<p class="log-text '+ highlight.color +'">' + highlight.text + '</p>';
                logHTML = logHTML + text + '<div class="log-icons" id="'+ url +'">';
                logHTML = logHTML + iconImg + '<i id="'+ highlight.id +'" class="material-icons-outlined log-delete">delete</i></div></div>';
                logsHTML = logsHTML + logHTML;
            });
        }
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, {msg: 'update_log', data: {log: log, logsHTML: logsHTML}, highlightMode: highlightMode});
            });
        });
    },

    updatePageHighlights: function(data) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, {msg: 'update_page_highlights', data: data, highlightMode: highlightMode});
            });
        });
    }
};

