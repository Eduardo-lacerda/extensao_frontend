const currentURL = window.location.href;
var log = {};
var highlights = {};
var logsHTML = {};


//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if(message.msg == 'update_log'){
        _chromeStorage.updateLog(message.data);
    }
    else if(message.msg == 'update_page_highlights'){
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
        console.log('updateLog');
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
        console.log('stylize')
        if(data != undefined) {
            data.forEach(highlight => {
                _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight.id);
            });
        }
    },

    saveHighlight: function(xpath, text) {
        console.log('saveHighlight');
        var highlight = {'text': text, 'xpath': xpath, 'color': color};
        highlight['icon_url'] = _utils.getPageIcons()[0];
        highlight['url'] = currentURL;

        chrome.runtime.sendMessage({msg: 'save_highlight', data: highlight});
    },

    deleteHighlight: function(highlightId, url) {
        console.log('deleteHighlight')
        var allHighlights = log;
        var newHighlightArray = [];
        allHighlights[url]['highlights'].forEach(function(highlight) {
            if(highlight.id != highlightId)
                newHighlightArray.push(highlight);
        });

        allHighlights[url]['highlights'] = newHighlightArray;

        chrome.storage.local.set({'allHighlights': allHighlights}, function() {});

        //Atualizar log
        chrome.runtime.sendMessage({msg: 'update_all'});

        //Remover estilo do highlight, caso seja dessa página
        if(url == currentURL)
            _highlighter.removeHighlight(highlightId);
    },
};

