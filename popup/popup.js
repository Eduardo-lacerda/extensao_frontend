var popupOpened;
var mouseLeave = false;
var mouseOver = false;
var counter;
var popupFixed = false;

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) { //Abrir / fechar o popup
        case 'toggle_popup':
            if(!message.data.popupOpened) {
                if(!message.data.highlightMode) {
                    _highlighter.turnOnHighlightMode();
                }
                if(message.data.popupFixed)
                    popupFixed = true;
                else
                    popupFixed = false;
                _popup.openPopup();
            }
            else {
                _popup.closePopup();
            }
            break;
        case 'toggle_popup_fixed':
            _popup.toggleFixPopupFront();
            break;
    }
    return true;
});

var _popup = {
    openPopup: function() {
        console.log($('.highlighter-popup-log'))
        if($('.highlighter-popup-log').length == 0){
            popupOpened = true;
            chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});

            if(!highlightMode) {
                $.get(chrome.runtime.getURL('popup/popup.html'), function(data) {
                    $('body').prepend(data);
                    $('.highlighter-popup-log').html('');
                    $('.highlighter-popup-log').prepend(logsHTML);
                });
            }
    
            else {
                $.get(chrome.runtime.getURL('popup/popup-highlight-mode.html'), function(data) {
                    $('body').prepend(data);
                    $('.highlighter-popup-log').html('');
                    $('.highlighter-popup-log').prepend(logsHTML);
                });
            }
    
            var highlighter = _highlighter;
            var that = this;
            
            _utils.waitFor(_ => $('.highlighter-popup').length > 0).then(_ => {
                if(popupFixed)
                    $('.header-btn#fix-btn').addClass('activated');
                $('.highlighter-popup').mouseleave(function() { //Ao tirar o mouse do popup
                    if(!popupFixed)
                        _popup.startCounter(3000);
                });
    
                $('.highlighter-popup').mouseover(function() { //Ao passar o mouse por cima
                    if(!popupFixed)
                        clearTimeout(counter);
                });
                
                $('.header-btn#close-btn').click(function() {
                    that.closePopupBack();
                });
    
                $('.header-btn#fix-btn').click(function() {
                    that.toggleFixPopup();
                });
    
                $('.highlight-toggle-wrapper #highlight-toggle').click(function() {
                    if(!highlightMode) 
                        highlighter.turnOnHighlightMode();
                    else
                        highlighter.turnOffHighlightMode();
                });
    
                $('.highlighter-popup .color-btn.yellow').click(function() {
                    _highlighter.changeHighlightColor('yellow');
                    $('.highlighter-popup .color-btn').removeClass('selected');
                    $('.highlighter-popup .color-btn.yellow').addClass('selected');
                });
                $('.highlighter-popup .color-btn.orange').click(function() {
                    _highlighter.changeHighlightColor('orange');
                    $('.highlighter-popup .color-btn').removeClass('selected');
                    $('.highlighter-popup .color-btn.orange').addClass('selected');
                });
                
                $('.highlighter-popup .color-btn.green').click(function() {
                    _highlighter.changeHighlightColor('green');
                    $('.highlighter-popup .color-btn').removeClass('selected');
                    $('.highlighter-popup .color-btn.green').addClass('selected');
                });
    
                document.querySelectorAll('.highlighter-popup-log .log-delete').forEach(item => {
                    item.addEventListener('click', event => {
                        const highlightId = $(event.target).attr('id');
                        const url = $(event.target).parent().attr('id');
                        _chromeStorage.deleteHighlight(highlightId, url);
                    })
                });
                _popup.startCounter(3000);
            });
        }
    },

    closePopup: function() {
        if($('.highlighter-popup-log').length > 0) {
            popupOpened = false;
            chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});
            $('.highlighter-popup').remove();
        }
    },

    closePopupBack: function() {
        chrome.runtime.sendMessage({msg: 'close_popup'});
    },

    startCounter: function(time) {
        if(!popupFixed) {
            var that = this;
            counter = setTimeout(function(){
                if (!document.hidden)
                    that.closePopupBack();
            }, time);
        }
    },

    toggleFixPopup: function() {
        chrome.runtime.sendMessage({msg: 'toggle_popup_fixed'});
    },

    toggleFixPopupFront: function() {
        clearTimeout(counter);
        popupFixed = !popupFixed;
        $('.header-btn#fix-btn').toggleClass('activated');
    }
}



