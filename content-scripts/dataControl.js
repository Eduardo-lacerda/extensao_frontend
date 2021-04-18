const currentURL = window.location.href;
var log = {};
var highlights = [];
var logsHTML = {};
var othersHighlights = [];
var loggedIn = false;
var onLimit = false;

//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) {
        case "update_log":
            _dataControl.updateLog(message.data);
            break;
        case "update_page_highlights":
            _dataControl.stylizeHighlights(message.data);
            break;
        case "update_others_highlights":
            _dataControl.stylizeHighlights(message.data);
            break;
        case "remove_all_highlights_styles":
            _dataControl.removeAllHighlightsStyles('all', 'loadAllHighlightsAndOthers');
            break;
        case "update_others_highlights_then_mine":
            _dataControl.stylizeHighlights(message.data);
            break;
    }
    return true;
});
//--------------------------------------

var _dataControl = {
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
                    _dataControl.deleteHighlight(highlightId, url);
                })
              })
        }, 20);
    },

    removeAllHighlightsStyles: function(whatToRemove, callback) {
        if(whatToRemove == 'all') {
            if(highlights.length > 0) {
                highlights.forEach(item => {
                    _highlighter.removeHighlight(item._id);
                });  
            }
            if(othersHighlights.length > 0) {
                othersHighlights.forEach(item => {
                    _highlighter.removeHighlight(item._id);
                });  
            }
        }
        else if(whatToRemove == 'others') {
            if(othersHighlights.length > 0) {
                othersHighlights.forEach(item => {
                    _highlighter.removeHighlight(item._id);
                });  
            }
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

    stylizeHighlights: function(data) {
        var popupWasOpened = false;
        var newDoc = '';
        var popupElement = '';
        var toggleElement = '';
        var doc = '';
        //this.removeAllHighlightsStyles('all');
        if(popupOpened) {
            popupWasOpened = true;
            newDoc = document.cloneNode(true);
            if($(newDoc).find('.highlighter-popup').length > 0) {
                popupElement = $(newDoc).find('.highlighter-popup');
                $(newDoc).find('.highlighter-popup').remove();
            }
            if($(newDoc).find('.highlight-toggle-wrapper').length > 0) {
                toggleElement = $(newDoc).find('.highlight-toggle-wrapper')[0];
                $(newDoc).find('.highlight-toggle-wrapper').remove();
            }
            doc = newDoc;
        }
        else {
            doc = document;
        }
        if(data['highlightData'])
            this.stylizeMineHighlights(data.highlightData, doc);
        if(data['othersHighlightsData'])
            this.stylizeOthersHighlights(data.othersHighlightsData, doc);

        if(popupWasOpened) {
            if(popupElement != '') {
                doc.querySelector('body').prepend(popupElement[1]);
                doc.querySelector('body').prepend(popupElement[0]);
            }
            if(toggleElement != '') {
                doc.querySelector('body').prepend(toggleElement);
            }
            document.documentElement.innerHTML = doc.documentElement.innerHTML;
            _popup.addPopupListeners(currentScreen);
            _popup.addDownPopupListeners(currentDownScreen);
            _popup.addToggleListeners();
        }
        if(data['highlightData'])
            _highlighter.addMineHighlightsListener();
        if(data['othersHighlightsData']) {
            _highlighter.addOthersHighlightsListener();
        }
        _highlighter.addHoverListeners();
    },

    stylizeMineHighlights: function (data, doc) {
        highlights = data;
        if(data != undefined) {
            data.forEach(highlight => {
                if(highlight.url == currentURL) {
                    highlight.color += ' mine-highlight';
                    _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight.id, doc);
                }
            });
        }
    },

    stylizeOthersHighlights: function (highlightData, doc) {
        othersHighlights = highlightData;
        if(highlightData != undefined && othersMode == true) {
            highlightData.forEach(highlight => {
                if(highlight.url == currentURL) {
                    highlight.color = 'others-color';
                    highlight.color = highlight.color + ' others-highlight'; //Classe pra diferenciar highlights alheios
                    _highlighter.highlightLoadedText(highlight.xpath, highlight.color, highlight._id, doc);
                }
            });
        }
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
        _highlighter.removeHighlight(highlightId);
    },
};

