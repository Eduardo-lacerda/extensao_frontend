var popupOpened;
var toggleOpened;
var mouseLeave = false;
var mouseOver = false;
var counter;
var toggleCounter;
var popupFixed = false;
var ratingData = {};
var messageData = {
    'msg': '',
    'type': ''
}
var jwt_token;

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) { //Abrir / fechar o popup
        case 'toggle_popup':
            color = message.data.color;
            if(!message.data.popupOpened) {
                if(!message.data.updatedPage) { //Se não tiver atualizado a página, mas sim clicado no ícone
                    if(!message.data.highlightMode) { //Se tiver o highlight mode tiver desligado, ligar
                        _highlighter.turnOnHighlightModeBack();
                    }
                }
                if(message.data.popupFixed)
                    popupFixed = true;
                else
                    popupFixed = false;

                //chrome.storage.local.remove('destaquei_jwt_token');
                
                chrome.storage.local.get('destaquei_jwt_token', function(data) {
                    console.log(data);
                    if(data['destaquei_jwt_token']) {
                        jwt_token = data.destaquei_jwt_token;
                        _popup.openPopup('default');
                    }
                    else { //Se não estiver logado
                        console.log('não logado')
                        _popup.openPopup('initial');
                    }
                });

                if(!message.data.toggleOpened)
                    _popup.openToggle();
            }
            else {
                _popup.closePopup();
            }
            break;
        case 'toggle_popup_fixed':
            if(!message.data.popupFixed)
                _popup.fixPopup();
            else
                _popup.unfixPopup();
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
        case 'update_rating':
            ratingData = message.data.ratingData;
            _popup.updateRating();
            break;
        case 'success_message':
            _popup.showMessage(message.data, 'success');
            break;
        case 'error_message':
            _popup.showMessage(message.data, 'error');
            break;
        case 'logged_in':
            chrome.storage.local.get('destaquei_jwt_token', function(data) {
                console.log(data);
                if(data['destaquei_jwt_token'])
                    jwt_token = data.destaquei_jwt_token;
            });
            _popup.openPopup('default');
            break;
    }
    return true;
});

var _popup = {
    showMessage: function(data, type) {
        messageData = data;
        _popup.openPopup(type);
    },

    openPopup: function(screen) {
        console.log('openPopup');   
        console.log(screen)

        if($('.highlighter-popup').length == 0){
            $.get(chrome.runtime.getURL('popup/base.html'), function(data) {
                $('body').prepend(data);
            });
        }

        _utils.waitFor(_ => document.getElementsByClassName('highlighter-popup-body').length > 0).then(_ => {
            popupOpened = true;
            clearTimeout(counter);
            chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});
            
            switch(screen) {
                case 'default':
                    $.get(chrome.runtime.getURL('popup/popup.html'), function(data) {
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                        $('.highlighter-popup-log').html('');
                        $('.highlighter-popup-log').append(logsHTML);
                    });
                    break;
                case 'initial':
                    console.log('initial screen')
                    $.get(chrome.runtime.getURL('popup/initialPopup.html'), function(data) {
                        console.log(data);
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    });
                    break;
                case 'register':
                    $.get(chrome.runtime.getURL('popup/registerPopup.html'), function(data) {
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    });
                    break;
                case 'login':
                    $.get(chrome.runtime.getURL('popup/loginPopup.html'), function(data) {
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    });
                    break;
                case 'success':
                    $.get(chrome.runtime.getURL('popup/success.html'), function(data) {
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    });
                    break;
                case 'error':
                    $.get(chrome.runtime.getURL('popup/error.html'), function(data) {
                        $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    });
                    break;
                case 'rate':
                    $.get(chrome.runtime.getURL('popup/ratePopup.html'), function(data) {
                        $('.highlighter-popup.controller').html(data);
                    });
                    break;
                case 'about-content':
                    $.get(chrome.runtime.getURL('popup/aboutContent.html'), function(data) {
                        $('.highlighter-popup.controller').html(data);
                    });
                    break;
            }
    
            var highlighter = _highlighter;
            var that = this;
    
            clearTimeout(toggleCounter);
            
            _utils.waitFor(_ => document.getElementsByClassName('highlight-toggle-container').length > 0).then(_ => {
                highlighter.changeHighlightColor(color);
                that.updateRating();
    
                switch(screen) {
                    case 'default':
                        $('#highlight-search').on('input', function() {
                            that.sendToBack('search_highlights_substring', {substring: $('#highlight-search').val()});
                        });
                        break;
                    case 'initial':
                        document.getElementById('register-cta').addEventListener('click', function(){
                            that.openPopup('register');
                        });
                        document.getElementById('login-cta').addEventListener('click', function(){
                            that.openPopup('login');
                        });
                        break;
                    case 'register':
                        mdc.autoInit();
    
                        document.getElementById('register-btn').addEventListener('click', function(){
                            var name = document.getElementById('name-input').value;
                            var email = document.getElementById('email-input').value;
                            var password = document.getElementById('password-input').value;
        
                            chrome.runtime.sendMessage({msg: 'register_user', data: {name: name, email: email, password: password}});
                        });
                        document.getElementById('cancel-btn').addEventListener('click', function(){
                            that.openPopup('initial');
                        });
                        break;
                    case 'login':
                        document.getElementById('login-btn').addEventListener('click', function(){
                            var email = document.getElementById('email-input').value;
                            var password = document.getElementById('password-input').value;
        
                            chrome.runtime.sendMessage({msg: 'login_user', data: {email: email, password: password}});
                        });
                        document.getElementById('cancel-btn').addEventListener('click', function(){
                            that.openPopup('initial');
                        });
                        document.getElementById('register-cta').addEventListener('click', function(){
                            that.openPopup('register');
                        });
                        break;
                    case 'success':
                        document.getElementById('success-msg').innerHTML = messageData.msg;
                        document.getElementById('cancel-btn').addEventListener('click', function(){
                            that.openPopup('initial');
                        });
                        break;
                    case 'error':
                        document.getElementById('error-msg').innerHTML = messageData.msg;
                        document.getElementById('cancel-btn').addEventListener('click', function(){
                            if(messageData.type == 'register')
                                that.openPopup('register');
                            else
                                that.openPopup('initial');
                        });
                        break;
                    case 'rate':
                        _utils.waitFor(_ => document.getElementById('about-content') != null).then(_ => {
                            document.getElementById('about-content').addEventListener('click', function(){
                                that.openPopup('about-content');
                            });
                        });
                        break;
                    case 'about-content':
                        _utils.waitFor(_ => document.getElementById('rate-btn') != null).then(_ => {
                            document.getElementById('rate-btn').addEventListener('click', function(){
                                that.openPopup('rate');
                            });
                        });
                        break;
                };
    
                if(popupFixed)
                    $('.header-btn#fix-btn').addClass('activated');
                    
                $('.highlighter-popup').on('mouseleave', function() { //Ao tirar o mouse do popup
                    if(!popupFixed)
                        _popup.startCounter(3000);
                });
    
                $('.highlighter-popup').on('mouseover', function() { //Ao passar o mouse por cima
                    if(!popupFixed)
                        clearTimeout(counter);
                });
                
                $('.header-btn#close-btn').on('click', function() {
                    that.closePopupBack();
                });
    
                $('.header-btn#fix-btn').on('click', function() {
                    that.toggleFixPopup(popupFixed);
                });
    
                $('.highlighter-popup .color-btn.yellow').on('click', function() {
                    _highlighter.changeHighlightColorBack('yellow');
                });
                $('.highlighter-popup .color-btn.orange').on('click', function() {
                    _highlighter.changeHighlightColorBack('orange');
                });
                
                $('.highlighter-popup .color-btn.green').on('click', function() {
                    _highlighter.changeHighlightColorBack('green');
                });

                $('.logout-btn').on('click', function() {
                    chrome.storage.local.remove('destaquei_jwt_token');
                    _popup.openPopup('initial');
                });
    
                document.querySelectorAll('.highlighter-popup-log .log-delete').forEach(item => {
                    item.addEventListener('click', event => {
                        const highlightId = $(event.target).attr('id');
                        //const url = $(event.target).parent().attr('id');
                        _chromeStorage.deleteHighlight(highlightId);
                    })
                });

                if(document.getElementById('rate-btn')) {
                    document.getElementById('rate-btn').addEventListener('click', function(){
                        that.openPopup('rate');
                    });
                }
                _popup.startCounter(3000);
            });
        });
    },

    closePopup: function() {
        console.log('closePopup')
        if($('.highlighter-popup').length > 0) {
            popupOpened = false;
            clearTimeout(counter);
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
        chrome.runtime.sendMessage({msg: 'toggle_popup_fixed', data: {popupFixed: popupFixed}});
    },

    fixPopup: function() {
        console.log('fixPopup')
        clearTimeout(counter);
        popupFixed = true;
        $('.header-btn#fix-btn').addClass('activated');

    },

    unfixPopup: function() {
        console.log('unfixPopup')
        popupFixed = false;
        $('.header-btn#fix-btn').removeClass('activated');
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

                $('#highlight-toggle').on('click', function() {
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

    updateRating: function() {
        if(popupOpened) {
            console.log('updateRatingFront')
            var pageBar = $('#page-rate .rate-bar-value');
            var globalBar = $('#global-rate .rate-bar-value');
            const pageWidth = Math.round((ratingData.page / 5 * 100)) + '%'
            const globalWidth = Math.round((ratingData.global / 5 * 100)) + '%'
            pageBar.text((''+ratingData.page).replace('.', ','));
            pageBar.width(pageWidth);
            globalBar.text((''+ratingData.global).replace('.', ','));
            globalBar.width(globalWidth);

            var classification = null;
            if(ratingData.global <= (5 / 3))
                classification = 'bad';
            if(ratingData.global >= (5 / 3) && ratingData.global <= (5 / 3 * 2))
                classification = 'good';
            if(ratingData.global >= (5 / 3 * 2))
                classification = 'great';
            console.log(classification);
            $.get(chrome.runtime.getURL('popup/svg/' + classification + '.html'), function(data) {
                $('.page-classification').html('');
                $('.page-classification').append(data);
            });
        }
    },

    sendToBack: function(msg, data){
        chrome.runtime.sendMessage({msg: msg, data: data});
    }
}



