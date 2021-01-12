var popupOpened;
var toggleOpened;
var mouseLeave = false;
var mouseOver = false;
var counter;
var toggleCounter;
var popupFixed = false;

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) { //Abrir / fechar o popup
        case 'toggle_popup':
            color = message.data.color;
            if(!message.data.popupOpened) {
                if(!message.data.highlightMode) {
                    _highlighter.turnOnHighlightModeBack();
                }
                if(message.data.popupFixed)
                    popupFixed = true;
                else
                    popupFixed = false;
                _popup.openPopup();
                if(!message.data.toggleOpened)
                    _popup.openToggle();
            }
            else {
                _popup.closePopup();
            }
            break;
        case 'toggle_popup_fixed':
            _popup.toggleFixPopupFront();
            break;
        case 'set_color':
            _highlighter.changeHighlightColor(message.data.color);
            break;
        case 'toggle_toggle':
            if(!message.data.toggleOpened) {
                _popup.openToggle();
            }
            else {
                _popup.closeToggle();
            }
            break;
    }
    return true;
});

var _popup = {
    openPopup: function() {
        console.log('openPopup')
        if($('.highlighter-popup-log').length == 0){
            popupOpened = true;
            chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});

            $.get(chrome.runtime.getURL('popup/popup.html'), function(data) {
                $('body').prepend(data);
                $('.highlighter-popup-log').html('');
                $('.highlighter-popup-log').prepend(logsHTML);
            });
    
            var highlighter = _highlighter;
            var that = this;
            
            _utils.waitFor(_ => document.getElementsByClassName('highlighter-popup').length > 0).then(_ => {
                highlighter.changeHighlightColor(color);

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
    
                $('.highlighter-popup .color-btn.yellow').click(function() {
                    _highlighter.changeHighlightColorBack('yellow');
                });
                $('.highlighter-popup .color-btn.orange').click(function() {
                    _highlighter.changeHighlightColorBack('orange');
                });
                
                $('.highlighter-popup .color-btn.green').click(function() {
                    _highlighter.changeHighlightColorBack('green');
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
        console.log('closePopup')
        if($('.highlighter-popup-log').length > 0) {
            popupOpened = false;
            chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});
            $('.highlighter-popup').remove();
            if(toggleOpened && !highlightMode)
                this.startToggleCounter(5000);
        }
    },

    closePopupBack: function() {
        console.log('closePopupBack')
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

    startToggleCounter: function(time) {
        var that = this;
        console.log('startToggleCounter')
        toggleCounter = setTimeout(function(){
            if (!document.hidden)
                that.closeToggleBack();
        }, time);
    },

    toggleFixPopup: function() {
        console.log('toggleFixPopup')
        chrome.runtime.sendMessage({msg: 'toggle_popup_fixed'});
    },

    toggleFixPopupFront: function() {
        console.log('toggleFixPopupFront')
        clearTimeout(counter);
        popupFixed = !popupFixed;
        $('.header-btn#fix-btn').toggleClass('activated');
    },

    openToggle: function() {
        console.log('openToggle')
        if($('.highlight-toggle-wrapper').length == 0){
            toggleOpened = true;
            chrome.runtime.sendMessage({msg: 'toggle_toggle', data: {toggleOpened: toggleOpened}});

            $.get(chrome.runtime.getURL('popup/toggle.html'), function(data) {
                $('body').prepend(data);
            });
    
            var highlighter = _highlighter;
            var that = this;
            
            _utils.waitFor(_ => document.getElementsByClassName('highlight-toggle-wrapper').length > 0).then(_ => {
                if(highlightMode)
                    document.getElementById('highlight-toggle').checked = true;

                $('#highlight-toggle').click(function() {
                    console.log(highlightMode)
                    if(highlightMode) {
                        highlighter.turnOffHighlightModeBack();
                        if(!popupOpened)
                            _popup.startToggleCounter(5000);
                    }
                    else {
                        highlighter.turnOnHighlightModeBack();
                        clearTimeout(toggleCounter);
                    }
                });
            });
        }
    },

    closeToggle: function() {
        console.log('closeToggle')
        if($('.highlight-toggle-wrapper').length > 0) {
            toggleOpened = false;
            chrome.runtime.sendMessage({msg: 'toggle_toggle', data: {toggleOpened: toggleOpened}});
            $('.highlight-toggle-wrapper').remove();
        }
    },

    closeToggleBack: function() {
        console.log('closeToggleBack')
        chrome.runtime.sendMessage({msg: 'close_toggle'});
    },
}



