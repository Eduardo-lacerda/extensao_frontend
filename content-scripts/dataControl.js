const currentURL = window.location.href;
var log = {};
var highlights = {};
var logsHTML = {};


//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if(message.msg == 'update_log'){
        highlightMode = message.highlightMode;
        _chromeStorage.updateLog(message.data);
    }
    else if(message.msg == 'update_page_highlights'){
        highlightMode = message.highlightMode;
        _chromeStorage.stylizeHighlights(message.data);
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
                    {"xpath": "teste", "text": "exemplo de highlight", color: "yellow", id: "exemplo"}
                ]
                "icon": "https://icon.png"
            }
        }
    } */

    updateLog: function (data) {
        log = data.log;
        logsHTML = data.logsHTML;
        $('.highlighter-popup-log').html('');
        $('.highlighter-popup-log').prepend(logsHTML);
        setTimeout(function() {
            document.querySelectorAll('.highlighter-popup-log .log-delete').forEach(item => {
                item.addEventListener('click', event => {
                    const highlightId = $(event.target).attr('id');
                    const url = $(event.target).parent().attr('id');
                    _chromeStorage.deleteHighlight(highlightId, url);
                })
              })
        }, 20);
    },

    stylizeHighlights: function (data) {
        //Se a url já foi salva
        if(data[currentURL]) {
            //Se existem highlights na página atual
            if(data[currentURL]['highlights']) {
                var highlights = data[currentURL]['highlights'];
                //Estilizar highlights
                highlights.forEach(highlight => {
                    _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight.id);
                });
            }
        }
    },

    saveHighlight: function(xpath, text, id) {
        var allHighlights = log;

        if(!allHighlights[currentURL]) //Caso a página atual já tenha sido salva
            allHighlights[currentURL] = {};
        var currentPage = allHighlights[currentURL];
        
        var highlight = {'text': text, 'xpath': xpath, 'color': color, 'id': id};
        if(!currentPage['highlights']) //Caso não existam highlights na página atual
            currentPage['highlights'] = [];
        currentPage['highlights'].push(highlight);
        const pageIcon = _utils.getPageIcons();
        currentPage['icon'] = pageIcon[0];
        allHighlights[currentURL] = currentPage;
        chrome.storage.sync.set({'allHighlights': allHighlights}, function() {});

        //Atualizar log
        chrome.runtime.sendMessage({msg: 'update_log'});
    },

    deleteHighlight: function(highlightId, url) {
        var allHighlights = log;
        var newHighlightArray = [];
        allHighlights[url]['highlights'].forEach(function(highlight) {
            if(highlight.id != highlightId)
                newHighlightArray.push(highlight);
        });

        allHighlights[url]['highlights'] = newHighlightArray;

        chrome.storage.sync.set({'allHighlights': allHighlights}, function() {});

        //Atualizar log
        chrome.runtime.sendMessage({msg: 'update_all'});

        //Remover estilo do highlight, caso seja dessa página
        if(url == currentURL)
            _highlighter.removeHighlight(highlightId);
    },
};

