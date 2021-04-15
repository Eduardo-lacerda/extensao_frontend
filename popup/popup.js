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
ratingParsedData = {};
var jwt_token;
var currentCommentIndex = 1;
var givingRatingData = {rate_number: 1, comment: ''};
var othersDialog;
var mineDialog;
var showingOthersDialog = {};
var showingMineDialog = {};
var highlightHoverCounter;
var highlightOthersHoverCounter;
var currentOtherHighlightHoverId;
var othersMode = true;
var currentScreen = 'default';
var currentDownScreen = 'about-content';
var cancelSearchOpened = false;

$.get(chrome.runtime.getURL('popup/hoverOthersHighlights.html'), function(data) {
    $('body').append(data);
    othersDialog = document.querySelector('dialog#others-highlight-hover');
});

$.get(chrome.runtime.getURL('popup/hoverHighlights.html'), function(data) {
    $('body').append(data);
    mineDialog = document.querySelector('dialog#mine-highlight-hover');
});

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) { //Abrir / fechar o popup
        case 'toggle_popup':
            color = message.data.color;
            if(!message.data.popupOpened) {
                if(!message.data.updatedPage) { //Se não tiver atualizado a página, mas sim clicado no ícone
                    if(!message.data.highlightMode) { //Se tiver o highlight mode tiver desligado, ligar
                        _highlighter.turnOnHighlightModeBack();
                        highlightMode = true;
                    }
                }
                else { //Atualizou a página ou trocou de aba
                    if(message.data.highlightMode) { //Se tiver o highlight mode tiver desligado, ligar
                        highlightMode = true;
                    }
                    else {
                        highlightMode = false;
                    }
                }
                if(message.data.popupFixed)
                    popupFixed = true;
                else
                    popupFixed = false;

                //chrome.storage.local.remove('destaquei_jwt_token');
                
                othersMode = message.data.othersMode;

                chrome.storage.local.get('destaquei_jwt_token', function(data) {
                    if(data['destaquei_jwt_token']) {
                        jwt_token = data.destaquei_jwt_token;
                        _popup.openPopup('default');
                    }
                    else { //Se não estiver logado
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
            if(popupOpened)
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
                if(data['destaquei_jwt_token'])
                    jwt_token = data.destaquei_jwt_token;
            });
            _popup.openPopup('default');
            break;
        case 'toggle_others_mode':
            othersMode = message.data.othersMode;
            _popup.toggleOthersMode();
            break;
    }
    return true;
});

var _popup = {
    showMessage: function(data, type) {
        messageData = data;
        _popup.openPopup(type);
    },

    toggleOthersMode: function() {
        if(!othersMode) {
            document.getElementById('others-highlight-toggle').checked = false;
            _dataControl.removeAllHighlightsStyles('others');
        }
        else {
            document.getElementById('others-highlight-toggle').checked = true;
            this.sendToBack('load_others_highlights', {url: currentURL});
        }
    },

    openPopup: function(screen) {
        currentScreen = screen;
        if($('.highlighter-popup').length == 0){
            $.get(chrome.runtime.getURL('popup/base.html'), function(data) {
                $('body').prepend(data);
                _popup.openPopupAux(screen);
            });
        }
        else
            this.openPopupAux(screen);
    },

    openPopupAux: function(screen) {
        popupOpened = true;
        clearTimeout(counter);
        chrome.runtime.sendMessage({msg: 'toggle_popup', data: {popupOpened: popupOpened}});

        if(screen != 'rate') {
            if(Object.keys(ratingData).length == 0) { //Não tem dado de avaliação
                _popup.openPopupDown('empty-rating');
            }
            else { //Tem dado de avaliação
                _popup.openPopupDown('about-content')
            }
        }

        if(screen == 'rate') {
            _popup.openPopupDown('rate');
            return false;
        }

        $('.highlight-toggle-container').remove();
        
        switch(screen) {
            case 'default':
                $.get(chrome.runtime.getURL('popup/popup.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    $('.highlighter-popup-log').html('');
                    $('.highlighter-popup-log').append(logsHTML);
                    _popup.addPopupListeners(screen);
                });
                break;
            case 'initial':
                $.get(chrome.runtime.getURL('popup/initialPopup.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    _popup.addPopupListeners(screen);
                });
                break;
            case 'register':
                $.get(chrome.runtime.getURL('popup/registerPopup.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    _popup.addPopupListeners(screen);
                });
                break;
            case 'login':
                $.get(chrome.runtime.getURL('popup/loginPopup.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    _popup.addPopupListeners(screen);
                });
                break;
            case 'success':
                $.get(chrome.runtime.getURL('popup/success.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    _popup.addPopupListeners(screen);
                });
                break;
            case 'error':
                $.get(chrome.runtime.getURL('popup/error.html'), function(data) {
                    $('.highlighter-popup.log .highlighter-popup-body').html(data);
                    _popup.addPopupListeners(screen);
                });
                break;
        }

        clearTimeout(toggleCounter);
    },

    addPopupListeners: function(screen) {
        var that = this;
        var highlighter = _highlighter;
        highlighter.changeHighlightColor(color);

        switch(screen) {
            case 'default':
                $('#highlight-search').on('input', function() {
                    if($('#highlight-search').val() != '' && !cancelSearchOpened) {
                        $('.search-wrapper .cancel-search-icon').css('display', 'block');
                        $('.search-wrapper .cancel-search-icon').on('click', function() {
                            $('#highlight-search').val('');
                            $('.search-wrapper .cancel-search-icon').css('display', 'none');
                            that.sendToBack('search_highlights_substring', {substring: $('#highlight-search').val()});
                            cancelSearchOpened = false;
                        })
                        cancelSearchOpened = true;
                    }
                    else if($('#highlight-search').val() == '') {
                        $('.search-wrapper .cancel-search-icon').css('display', 'none');
                        cancelSearchOpened = false;
                    }
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

                    chrome.runtime.sendMessage({msg: 'login_user', data: {email: email, password: password, url: currentURL}});
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
        };

        if(document.getElementById('others-highlight-toggle') != null) {
            if(othersMode)
                document.getElementById('others-highlight-toggle').checked = true;
            else
                document.getElementById('others-highlight-toggle').checked = false;
            document.getElementById('others-highlight-toggle').addEventListener('click', function() {
                that.sendToBack('toggle_others_mode', {othersMode: !othersMode})
            });
        }

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
            _popup.logOut();
        });

        document.querySelectorAll('.highlighter-popup-log .log-delete').forEach(item => {
            item.addEventListener('click', event => {
                const highlightId = $(event.target).attr('id');
                //const url = $(event.target).parent().attr('id');
                _dataControl.deleteHighlight(highlightId);
            })
        });

        _popup.startCounter(3000);
    },

    openPopupDown: function(screen) {
        currentDownScreen = screen;
        switch(screen) {
            case 'rate':
                $.get(chrome.runtime.getURL('popup/ratePopup.html'), function(data) {
                    $('.highlighter-popup.controller').html('');
                    $('.highlighter-popup.controller').html(data);
                    _popup.addDownPopupListeners(screen);
                });
                break;
            case 'about-content':
                $.get(chrome.runtime.getURL('popup/aboutContent.html'), function(data) {
                    $('.highlighter-popup.controller').html('');
                    $('.highlighter-popup.controller').html(data);
                    _popup.addDownPopupListeners(screen);
                });
                break;
            case 'empty-rating':
                $.get(chrome.runtime.getURL('popup/emptyRating.html'), function(data) {
                    $('.highlighter-popup.controller .highlighter-popup-body').html('');
                    $('.highlighter-popup.controller .highlighter-popup-body').append(data);
                    document.querySelector('.highlighter-popup.controller .highlighter-popup-header h5').textContent = 'Ops...';
                    _popup.addDownPopupListeners(screen);
                });
                break;
        }
    },

    addDownPopupListeners: function(screen) {
        var that = this;
        switch(screen) {
            case 'rate':
                _utils.waitFor(_ => document.getElementById('about-content') != null).then(_ => {
                    mdc.autoInit();
                    sldr = new mdc.slider.MDCSlider(document.querySelector('.mdc-slider'));
                    sldr.root.addEventListener('MDCSlider:change', (e)=> {
                        givingRatingData.rate_number = e.detail.value;
                    });
                    document.getElementById('about-content').addEventListener('click', function(){
                        that.openPopupDown('about-content');
                    });
                    document.getElementById('cancel-btn').addEventListener('click', function(){
                        that.openPopupDown('about-content');
                    });
                    document.getElementById('send-btn').addEventListener('click', function(){
                        givingRatingData['page_url'] = window.location.href;
                        givingRatingData['base_url'] = window.location.origin;
                        givingRatingData.comment = document.getElementById('comment-input').value;
                        that.sendToBack('send_rating', givingRatingData);
                    });
                });
                break;
            case 'about-content':
                _utils.waitFor(_ => document.getElementById('rate-btn') != null).then(_ => {
                    document.getElementById('rate-btn').addEventListener('click', function(){
                        that.openPopupDown('rate');
                    });
                    that.updateRating();
                });
                break;
        }
    },

    closePopup: function() {
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
        toggleCounter = setTimeout(function(){
            if (!document.hidden)
                that.closeToggleBack();
        }, time);
    },

    startOthersHighlightHoverCounter: function(time) {
        var that = this;
        highlightOthersHoverCounter = setTimeout(function(){
            if (!document.hidden) {
                showingOthersDialog = {};
                othersDialog = $("dialog#others-highlight-hover")[0];
                othersDialog.close();
                $('.like-btn').css('display', 'block');
                $('.liked-btn').css('display', 'none');
            }
        }, time);
    },

    startHighlightHoverCounter: function(time) {
        var that = this;
        highlightHoverCounter = setTimeout(function(){
            if (!document.hidden) {
                showingMineDialog = {};
                mineDialog = $("dialog#mine-highlight-hover")[0];
                mineDialog.close();
                $('.delete-btn').css('display', 'block');
                $('.deleted-btn').css('display', 'none');
            }
        }, time);
    },

    toggleFixPopup: function() {
        chrome.runtime.sendMessage({msg: 'toggle_popup_fixed', data: {popupFixed: popupFixed}});
    },

    fixPopup: function() {
        clearTimeout(counter);
        popupFixed = true;
        $('.header-btn#fix-btn').addClass('activated');

    },

    unfixPopup: function() {
        popupFixed = false;
        $('.header-btn#fix-btn').removeClass('activated');
    },

    openToggle: function() {
        if($('.highlight-toggle-wrapper').length == 0){
            toggleOpened = true;
            chrome.runtime.sendMessage({msg: 'toggle_toggle', data: {toggleOpened: toggleOpened}});

            $.get(chrome.runtime.getURL('popup/toggle.html'), function(data) {
                $('body').prepend(data);
                _popup.addToggleListeners();
            });
        }
    },

    addToggleListeners: function() {
        var highlighter = _highlighter;
        var that = this;
        if(highlightMode)
            document.getElementById('highlight-toggle').checked = true;

        $('#highlight-toggle').on('click', function() {
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
    },

    closeToggle: function() {
        if($('.highlight-toggle-wrapper').length > 0) {
            toggleOpened = false;
            chrome.runtime.sendMessage({msg: 'toggle_toggle', data: {toggleOpened: toggleOpened}});
            $('.highlight-toggle-wrapper').remove();
        }
    },

    closeToggleBack: function() {
        chrome.runtime.sendMessage({msg: 'close_toggle'});
    },

    updateRating: function() {
        if(popupOpened) {
            if(ratingData['baseRating']) {
                if(document.getElementsByClassName('rate-info-wrapper').length == 0)
                    _popup.openPopupDown('about-content');
                _utils.waitFor(_ => document.getElementsByClassName('rate-info-wrapper').length > 0).then(_ => {
                    var pageBar = $('#page-rate .rate-bar-value')[0];
                    var globalBar = $('#global-rate .rate-bar-value')[0];
                    var pageRating = null;
                    var baseRating = ratingData.baseRating;
                    if(ratingData.pageRating != null) { //Não tem avaliação da página
                        $('#page-rate').removeClass('empty');
                        pageRating = ratingData.pageRating;
                        const pageWidth = Math.round((pageRating / 5 * 100)) + '%';
                        pageBar.innerText = (''+pageRating).replace('.', ',');
                        pageBar.style.width = pageWidth;
                    }
                    else {
                        $('#page-rate').addClass('empty');
                        $('#page-rate')[0].textContent = 'Nenhuma Avaliação :(';
                    }
                    
                    const globalWidth = Math.round((baseRating / 5 * 100)) + '%';
                    globalBar.innerText = (''+baseRating).replace('.', ',');
                    globalBar.style.width = globalWidth;
        
                    var classification = null;
                    if(baseRating <= (5 / 3))
                        classification = 'bad';
                    if(baseRating >= (5 / 3) && baseRating <= (5 / 3 * 2))
                        classification = 'good';
                    if(baseRating >= (5 / 3 * 2))
                        classification = 'great';
                    
                    $.get(chrome.runtime.getURL('popup/svg/' + classification + '.html'), function(data) {
                        $('.page-classification').html('');
                        $('.page-classification').append(data);
                    });
        
                    //Comentários
                    $.get(chrome.runtime.getURL('popup/comment.html'), function(data) {
                        var counter = 1;
                        var length = ratingData.comments.length;
        
                        $('.carousel-wrapper').html('');
                        if(document.getElementsByClassName('comment-counter')[0])
                            document.getElementsByClassName('comment-counter')[0].textContent = '1 de ' + length + ' comentários';
                        
                        ratingData.comments.forEach(comment => {                
                            var newComment = document.createElement('div');
                            newComment.innerHTML = data;
                            newComment.getElementsByClassName('carousel-slide')[0].id = 'comment_carousel_slide' + counter;
        
                            if(counter == 1) { //Se for o primeiro comentário
                                //Vai pro último slide
                                newComment.getElementsByClassName('carousel-prev')[0].href= '#comment_carousel_slide'+length;
                                newComment.getElementsByClassName('carousel-prev')[0].target = '_self';
                                newComment.getElementsByClassName('carousel-next')[0].href = '#comment_carousel_slide'+(counter+1);
                                newComment.getElementsByClassName('carousel-next')[0].target = '_self';
                            }
                            else if(counter == length) { //Se for o último comentário
                                newComment.getElementsByClassName('carousel-prev')[0].href = '#comment_carousel_slide'+(counter-1);
                                newComment.getElementsByClassName('carousel-prev')[0].target = '_self';
                                //Vai pro primeiro slide
                                newComment.getElementsByClassName('carousel-next')[0].href = '#comment_carousel_slide1';
                                newComment.getElementsByClassName('carousel-next')[0].target = '_self';
                            }
                            else {
                                newComment.getElementsByClassName('carousel-prev')[0].href = '#comment_carousel_slide'+(counter-1);
                                newComment.getElementsByClassName('carousel-next')[0].href = '#comment_carousel_slide'+(counter+1);
                                newComment.getElementsByClassName('carousel-prev')[0].target = '_self';
                                newComment.getElementsByClassName('carousel-next')[0].target = '_self';
                            }        
        
                            newComment.getElementsByClassName('comment-text')[0].textContent = '"'+comment.comment+'"';
                            newComment.querySelector('.comment-owner .user-name').textContent = comment.user_name;
                            newComment.querySelector('.comment-owner .rating-number').textContent = ' (nota: ' + comment.rate_number + '/5)';
                            
                            counter++;
        
                            $('.carousel-wrapper').append(newComment.innerHTML);
                        });
        
                        $('.carousel-next').on('click', function() {
                            if(currentCommentIndex == ratingData.comments.length)
                                currentCommentIndex = 1;
                            else
                                currentCommentIndex++;
                            document.getElementsByClassName('comment-counter')[0].textContent = currentCommentIndex + ' de ' + length + ' comentários';
                        });
        
                        $('.carousel-prev').on('click', function() {
                            if(currentCommentIndex == 1)
                                currentCommentIndex = ratingData.comments.length;
                            else
                                currentCommentIndex--;
                            document.getElementsByClassName('comment-counter')[0].textContent = currentCommentIndex + ' de ' + length + ' comentários';
                        });
        
                        document.querySelectorAll('a[href^="#"]').forEach(anchor => { //Corrigir bug
                            anchor.addEventListener('click', function (e) {
                                e.preventDefault();
                                document.querySelector(this.getAttribute('href')).scrollIntoView({
                                    behavior: 'smooth'
                                });
                            });
                        });
                    });
                });
            }
        }
    },

    logOut: function() {
        chrome.storage.local.remove('destaquei_jwt_token');
        chrome.storage.local.remove('user_email');
        _dataControl.removeAllHighlightsStyles('all', 'loadOthers');
        _popup.openPopup('initial');
    },

    sendToBack: function(msg, data){
        chrome.runtime.sendMessage({msg: msg, data: data});
    }
}



