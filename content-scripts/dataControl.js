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
        case "remove_all_highlights_styles":
            _chromeStorage.removeAllHighlightsStyles('others', 'loadAllHighlightsAndOthers');
            break;
        case "update_others_highlights_then_mine":
            _chromeStorage.stylizeAllHighlights(message.data);
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

    removeAllHighlightsStyles: function(whatToRemove, callback) {
        if(whatToRemove == 'all') {
            highlights.forEach(item => {
                _highlighter.removeHighlight(item._id, false);
              });  
              othersHighlights.forEach(item => {
                _highlighter.removeHighlight(item._id, false);
              });  
        }
        else if(whatToRemove == 'others') {
            console.log('removendo estilo others')
            othersHighlights.forEach(item => {
                _highlighter.removeHighlight(item._id, false);
              });  
        }

        if(callback) {
            if(callback == 'loadAllHighlightsAndOthers') {
                chrome.runtime.sendMessage({msg: 'get_all_highlights_and_others', data: {url: currentURL}});
            }
            if(callback == 'loadOthers') {
                chrome.runtime.sendMessage({msg: 'load_others_highlights', data: {url: currentURL}});
            }
        }
    },

    stylizeHighlights: function (data) {
        highlights = data;
        console.log(highlights);
        if(data != undefined) {
            data.forEach(highlight => {
                if(highlight.url == currentURL)
                    _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight.id);
            });
            _popup.addHoverListeners();
        }
        console.log('fim mine')
    },

    stylizeAllHighlights: function(data) {
/*         var wasOpened = false;
        if(popupOpened) {
            _popup.closePopup();
            wasOpened = true;
        } */
        this.stylizeHighlights(data.highlightData);
        this.stylizeOthersHighlights(data.othersHighlightsData);
/*         if(wasOpened)
            _popup.openPopup('default'); */
    },

    stylizeOthersHighlights: function (highlightData) {
        othersHighlights = highlightData;
        console.log(highlightData);
        if(highlightData != undefined) {
            highlightData.forEach(highlight => {
                highlight.color = 'others-color';
                highlight.color = highlight.color + ' others-highlight'; //Classe pra diferenciar highlights alheios
                _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight._id);
            });
            _popup.addOthersHighlightsListener();
            _popup.addHoverListeners();
        }
        console.log('fim others')
    },

    saveHighlight: function(xpath, text) {
        var highlight = {'text': text, 'xpath': xpath, 'color': color};
        highlight['icon_url'] = _utils.getPageIcons()[0];
        highlight['url'] = currentURL;
        chrome.runtime.sendMessage({msg: 'save_highlight', data: highlight});
    },

    deleteHighlight: function(highlightId) {
        chrome.runtime.sendMessage({msg: 'delete_highlight', data: {highlightId: highlightId}});

        //Remover estilo do highlight, caso seja dessa página
        _highlighter.removeHighlight(highlightId, true);
    },
};

