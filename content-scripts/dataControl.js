const currentURL = window.location.href;
var log = {};
var highlights = {};
var logsHTML = {};
var othersHighlights = {};


//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) {
        case "update_log":
            _chromeStorage.updateLog(message.data);
            break;
        case "update_page_highlights":
            _chromeStorage.stylizeHighlights(message.data);
            break;
        case "update_others_highlights":
            _chromeStorage.stylizeOthersHighlights(message.data);
            break;
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
        console.log('stylize');
        console.log(data);
        if(data != undefined) {
            data.forEach(highlight => {
                if(highlight.url == currentURL)
                    _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight.id);
            });
        }
    },

    stylizeOthersHighlights: function (highlightData) {
        othersHighlights = highlightData;
        console.log(othersHighlights)
        if(highlightData != undefined) {
            highlightData.forEach(highlight => {
                highlight.color = 'others-color';
                highlight.color = highlight.color + ' others-highlight'; //Classe pra diferenciar highlights alheios
                _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight._id);
            });
            _popup.addOthersHighlightsListener();
            console.log(othersHighlights)
        }
    },

    saveHighlight: function(xpath, text) {
        console.log('saveHighlight');
        var highlight = {'text': text, 'xpath': xpath, 'color': color};
        highlight['icon_url'] = _utils.getPageIcons()[0];
        highlight['url'] = currentURL;
        chrome.runtime.sendMessage({msg: 'save_highlight', data: highlight});
    },

    deleteHighlight: function(highlightId) {
        console.log('deleteHighlight')
        console.log(highlightId);
        chrome.runtime.sendMessage({msg: 'delete_highlight', data: {highlightId: highlightId}});

        //Remover estilo do highlight, caso seja dessa página
        _highlighter.removeHighlight(highlightId);
    },
};

