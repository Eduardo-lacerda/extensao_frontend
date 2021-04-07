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
var dialog;
var showingDialog = {};
var highlightHoverCounter;
var currentOtherHighlightHoverId;

$.get(chrome.runtime.getURL('popup/hoverOthersHighlights.html'), function(data) {
    $('body').append(data);
    dialog = document.querySelector('dialog');
    $('dialog').on({
        mouseleave: function () {
            _popup.startHighlightHoverCounter(2000);
        },
        mouseenter: function() {
            clearTimeout(highlightHoverCounter);
        }
    });
    $('#like-btn').on('click', function() {
        _popup.likeHighlight();
    });
});

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
            $('.highlight-toggle-container').remove();

            if(Object.keys(ratingData).length == 0) { //Não tem dado de avaliação
                $.get(chrome.runtime.getURL('popup/emptyRating.html'), function(data) {
                    $('.highlighter-popup.controller .highlighter-popup-body').html('');
                    $('.highlighter-popup.controller .highlighter-popup-body').append(data);
                });
            }
            
            _utils.waitFor(_ => document.getElementsByClassName('highlight-toggle-container').length > 0).then(_ => {
                highlighter.changeHighlightColor(color);
    
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
                            mdc.autoInit();
                            sldr = new mdc.slider.MDCSlider(document.querySelector('.mdc-slider'));
                            sldr.root.addEventListener('MDCSlider:change', (e)=> {
                                givingRatingData.rate_number = e.detail.value;
                            });
                            document.getElementById('about-content').addEventListener('click', function(){
                                that.openPopup('about-content');
                            });
                            document.getElementById('cancel-btn').addEventListener('click', function(){
                                that.openPopup('about-content');
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
                                that.openPopup('rate');
                            });
                        });
                        break;
                };

                if(screen != 'rate') {
                    _utils.waitFor(_ => document.getElementsByClassName('carousel-wrapper').length > 0).then(_ => {
                        that.updateRating();
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
                    chrome.storage.local.remove('destaquei_jwt_token');
                    chrome.storage.local.remove('user_email');
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

    startHighlightHoverCounter: function(time) {
        var that = this;
        console.log('startHighlightHoverCounter')
        highlightHoverCounter = setTimeout(function(){
            if (!document.hidden) {
                showingDialog = {};
                dialog.close();
                $('.like-btn').css('display', 'block');
                $('.liked-btn').css('display', 'none');
            }
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
            console.log(ratingData)
            if(ratingData['pageRating']) {
                var pageBar = $('#page-rate .rate-bar-value')[0];
                var globalBar = $('#global-rate .rate-bar-value')[0];
                const pageWidth = Math.round((ratingData.pageRating / 5 * 100)) + '%';
                const globalWidth = Math.round((ratingData.baseRating / 5 * 100)) + '%';
    
                pageBar.innerText = (''+ratingData.pageRating).replace('.', ',');
                pageBar.style.width = pageWidth;
                globalBar.innerText = (''+ratingData.baseRating).replace('.', ',');
                globalBar.style.width = globalWidth;
    
                var classification = null;
                if(ratingData.baseRating <= (5 / 3))
                    classification = 'bad';
                if(ratingData.baseRating >= (5 / 3) && ratingData.baseRating <= (5 / 3 * 2))
                    classification = 'good';
                if(ratingData.baseRating >= (5 / 3 * 2))
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
                        newComment.getElementsByClassName('comment-owner')[0].textContent = comment.user_name + ' - ' + comment.rate_number + '/5';
                        
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
            }
        }
    },

    addOthersHighlightsListener: function() {
        $('span.highlighted.others-color.others-highlight').on({
            mouseover: function (e) {
                const id = $(this)[0].id;
                if(!(''+id in showingDialog)) {
                    showingDialog[id] = false;
                }
                if(showingDialog[id] == false) {
                    currentOtherHighlightHoverId = id;
                    dialog.show();
                    $("dialog").css("transform","translate3d("+e.pageX+"px,"+e.pageY+"px,0px)");
                    showingDialog = {};
                    showingDialog[id] = true;
                }
            }
        });
    },

    likeHighlight: function() {
        var id = currentOtherHighlightHoverId;
        var currentHighlight = othersHighlights.find(highlight => highlight._id == id);
        _highlighter.removeHighlight(id);
        _chromeStorage.saveHighlight(currentHighlight.xpath, currentHighlight.text);
        this.startHighlightHoverCounter(2000);
        $('.like-btn').css('display', 'none');
        $('.liked-btn').css('display', 'block');
    },

    sendToBack: function(msg, data){
        chrome.runtime.sendMessage({msg: msg, data: data});
    }
}



