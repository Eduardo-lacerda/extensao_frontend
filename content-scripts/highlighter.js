var flag = 0;
var highlightMode;
var teste = 'asdasfsfa';
var color = 'yellow';
var currentRange = '';

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    switch(message.msg) { //Abrir / fechar o popup
        case 'toggle_highlight_mode':
            if(message.data.highlightMode) {
                _highlighter.turnOnHighlightMode();
            }
            else {
                _highlighter.turnOffHighlightMode();
            }
            break;
        case 'wrap_highlight':
            _highlighter.highlightOneLoadedText(message.data.xpath, color, message.data.highlightId); 
            break;
        case 'save_highlight':
            _highlighter.highlightText();
            break;
    }
    return true;
});

var _highlighter = {
    //Detectar quando o usuário selecionar um texto
    addEventListeners: function() {
        document.addEventListener("mousedown", function () {
            flag = 0;
        }, false);

        document.addEventListener("mousemove", function () {
            flag = 1;
        }, false);


        document.addEventListener("mouseup", function () {
            if(flag == 1 && highlightMode){
                var sel = window.getSelection ? window.getSelection() : document.selection.createRange(); // FF : IE
                if(sel.rangeCount > 0){
                    var range = sel.getRangeAt(0);
                    const parentElementClassList = range.startContainer.parentElement.classList;
                    //Caso não seja dentro do popup
                    if(!parentElementClassList.contains('ipp')) {
                            _highlighter.highlightText();
                        } 
                }
            }
        });
    },

    turnOnHighlightModeBack: function() {
        chrome.runtime.sendMessage({msg: 'turn_on_highlight_mode'});
    },

    turnOffHighlightModeBack: function() {
        chrome.runtime.sendMessage({msg: 'turn_off_highlight_mode'});
    },

    turnOnHighlightMode: function() {
        if(!highlightMode) {
            if(document.getElementById('highlight-toggle') != null)
                document.getElementById('highlight-toggle').checked = true;
            highlightMode = true;
        }
    },

    turnOffHighlightMode: function() {
        if(highlightMode) {
            if(document.getElementById('highlight-toggle') != null)
                document.getElementById('highlight-toggle').checked = false;
            highlightMode = false;
        }
    },

    highlightText: function() {
        var sel = window.getSelection ? window.getSelection() : document.selection.createRange(); // FF : IE
        var range = sel.getRangeAt(0);

        //if(range.startOffset != 0 && range.endOffset != 0 && (range.startContainer.nodeName != 'BODY' && range.endContainer.nodeName != 'BODY'))
        if(range.startContainer.nodeName != 'BODY' && range.endContainer.nodeName != 'BODY') {
            const xpath = _xpath.createXPathRangeFromRange(range);
            const selectedText = range.toString();
            currentRange = range;
            //const id = _utils.create_UUID();
            _dataControl.saveHighlight(xpath, selectedText);
        }
    },

    highlightOneLoadedText: function(xpath, highlightColor, id) {
        var popupWasOpened = false;
        var newDoc = '';
        var popupElement = '';
        var toggleElement = '';
        var doc = '';
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
        highlightColor += ' mine-highlight';
        this.highlightLoadedText(xpath, highlightColor, id, doc);

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
        _highlighter.addMineHighlightsListener();
        _highlighter.addOthersHighlightsListener();
        _highlighter.addHoverListeners();
    },
    
    highlightLoadedText: function(xpath, highlightColor, id, doc) {
        var range = _xpath.createRangeFromXPathRange(xpath, doc);
        if(range != null)
            this.wrapSelection(range, highlightColor, id);
    },

    removeHighlight: function (id) {
        // id is for first span in list
        var that = this;
        var spanList = $('[id='+ id +']:not(.log-delete)');
        Array.prototype.forEach.call(spanList, span => {
            that.removeHighlightAux(span);
        });
    },

    removeHighlightAux: function(span) {
        if (!this.isHighlightSpan(span)) {
            return false;
        }

        /**
         * merge text nodes with prev/next sibling
         * @param n
         * @private
         */
        function _merge(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                if (n.nextSibling && n.nextSibling.nodeType === Node.TEXT_NODE) {
                    // merge next sibling into newNode
                    n.textContent += n.nextSibling.textContent;
                    // remove next sibling
                    n.nextSibling.parentNode.removeChild(n.nextSibling);
                }

                if (n.previousSibling && n.previousSibling.nodeType === Node.TEXT_NODE) {
                    // merge nodeNew into previousSibling
                    n.previousSibling.textContent += n.textContent;
                    // remove newNode
                    n.parentNode.removeChild(n);
                }
            }
        }

        // iterate whilst all tests for being a highlight span node are passed
        while (this.isHighlightSpan(span)) {
            //
            while (span.hasChildNodes()) {
                var nodeNew = span.parentNode.insertBefore(span.firstChild, span);

                // merge restored nodes
                _merge(nodeNew);
            }

            if(span.parentNode == null)
                return true;
            var nodeRemovedPreviousSibling = span.previousSibling;
            var nodeRemoved = span.parentNode.removeChild(span);

            // if removing the span brings 2 text nodes together, join them
            if (nodeRemovedPreviousSibling) {
                _merge(nodeRemovedPreviousSibling);
            }

            // point to next hl (undefined for last in list)
            span = nodeRemoved.nextSpan;
        }
        return true;
    },
    
    wrapSelection: function(range, highlightColor, id) {
        "use strict";
        // highlights are wrapped in one or more spans
        //Checar se id já existe no documento
        if($('#'+id+':not(.log-delete)').length > 0)
            return null;
        var span = document.createElement("SPAN");
        span.className = 'highlighted';
        span.id = id;
        $(span).addClass(highlightColor);
        
        
        // each node has a .nextElement property, for following the linked list
        var record = {
            firstSpan: null,
            lastSpan: null
        };
    
        this.wrapTextNodes(range, record, function () {
            // wrapper creator
            var newSpan = span.cloneNode(false);

            // link up
            if (!record.firstSpan) {
                record.firstSpan = newSpan;

                // only give the first span the id
                record.firstSpan.id = id;
            }

            if (record.lastSpan) {
                record.lastSpan.nextSpan = newSpan;
            }
    
            record.lastSpan = newSpan;
    
            // every span in the highlight has a reference to the first span
            newSpan.firstSpan = record.firstSpan;
            return newSpan;
        });
        //Troca a cor baseado no contraste
        this.setColor($(record.lastSpan));
        return record.firstSpan;
    },
    
    wrapTextNodes: function(range, record, createWrapper) {
        if (range.collapsed) {
            return;
        }
        var startSide = range.startContainer, endSide = range.endContainer,
            ancestor = range.commonAncestorContainer, dirIsLeaf = true;
    
        if (range.endOffset === 0) {  //nodeValue = text | element
            while (!endSide.previousSibling && endSide.parentNode !== ancestor) {
                endSide = endSide.parentNode;
            }
            endSide = endSide.previousSibling;
        } else if (endSide.nodeType === Node.TEXT_NODE) {
            if (range.endOffset < endSide.nodeValue.length) {
                endSide.splitText(range.endOffset);
            }
        } else if (range.endOffset > 0) {  //nodeValue = element
            endSide = endSide.childNodes.item(range.endOffset - 1);
        }
    
        if (startSide.nodeType === Node.TEXT_NODE) {
            if (range.startOffset === startSide.nodeValue.length) {
                dirIsLeaf = false;
            } else if (range.startOffset > 0) {
                startSide = startSide.splitText(range.startOffset);
    
                if (endSide === startSide.previousSibling) {
                    endSide = startSide;
                }
            }
        } else if (range.startOffset < startSide.childNodes.length) {
            startSide = startSide.childNodes.item(range.startOffset);
        } else {
            dirIsLeaf = false;
        }
    
        range.setStart(range.startContainer, 0);
        range.setEnd(range.startContainer, 0);
    
        var done = false, node = startSide;
        var nodesList = [];
        do {
            if (node === endSide && (!endSide.hasChildNodes() || !dirIsLeaf)) {
                done = true;
            }
            
            if (dirIsLeaf && node.nodeType === Node.TEXT_NODE &&
                    !(node.parentNode instanceof HTMLTableElement) &&
                    !(node.parentNode instanceof HTMLTableRowElement) &&
                    !(node.parentNode instanceof HTMLTableColElement) &&
                    !(node.parentNode instanceof HTMLTableSectionElement)) {
                //
                var wrap = node.previousSibling;
    
                if (!wrap || wrap !== record.lastSpan) {
                    wrap = createWrapper(node);
                    //no total wrapping
                    node.parentNode.insertBefore(wrap, node);
                    
                    //total wrapping
/*                     if(node.parentNode.nodeName == 'A') {
                        node.parentNode.insertBefore(wrap, node);
                        nodesList.push(node.parentNode);
                    }
                    else {
                        nodesList.push(wrap);
                    }
                    
                    if(done) {
                        var totalWrapper = createWrapper('');
                        nodesList.forEach(item => {
                            totalWrapper.appendChild(item);
                        });
                        node.parentNode.insertBefore(totalWrapper, node);
                    }
                    else if(node.parentNode.nodeName != 'A') {
                        node.parentNode.insertBefore(wrap, node);
                    } */
                }
    
                wrap.appendChild(node);
    
                node = wrap.lastChild;
                dirIsLeaf = false;
            }
    
            if (node instanceof HTMLScriptElement ||
                    node instanceof HTMLStyleElement ||
                    node instanceof HTMLSelectElement) {
                  //never parse their children
                dirIsLeaf = false;
            }
    
            if (dirIsLeaf && node.hasChildNodes()) {
                node = node.firstChild;
            } else if (node.nextSibling !== null) {
                node = node.nextSibling;
                dirIsLeaf = true;
            } else if (node.nextSibling === null) {
                node = node.parentNode;
                dirIsLeaf = false;
            }
        } while (!done);
    },

    setColor: function(element) {
        const rgbString = element.css('color');
        if(rgbString != undefined){
            const rgbValue = rgbString.replace(/[^\d,]/g, '').split(',');
            const contrast = Math.round(((parseInt(rgbValue[0]) * 299) + 
                (parseInt(rgbValue[1]) * 587) + 
                (parseInt(rgbValue[2]) * 114)) / 1000); 
            if(contrast > 125) {
                element.css('color', 'rgb(29, 29, 29)'); 
            }
        }
    },

    changeHighlightColorBack: function(newColor) {
        chrome.runtime.sendMessage({msg: 'set_color', data: {color: newColor}});
    },

    changeHighlightColor: function(newColor){
        $('.highlighter-popup .color-btn').removeClass('selected');
        $('.highlighter-popup .color-btn.'+newColor).addClass('selected');
        color = newColor;
    },

    isHighlightSpan: function (node) {
/*         return node &&
            node.nodeType === Node.ELEMENT_NODE && node.nodeName === "SPAN" &&
            node.firstSpan !== undefined; */
            return node && node.classList.contains('highlighted');
    },

    addOthersHighlightsListener: function() {
        $('dialog#others-highlight-hover').on({
            mouseleave: function () {
                _popup.startOthersHighlightHoverCounter(2000);
            },
            mouseenter: function() {
                clearTimeout(highlightOthersHoverCounter);
            }
        });
        $('#like-btn').on('click', function() {
            _highlighter.likeHighlight();
        });
        $('.highlighted.others-color.others-highlight').on({
            mouseover: function (e) {
                const id = $(this)[0].id;
                if(!(''+id in showingOthersDialog)) {
                    showingOthersDialog[id] = false;
                }
                if(showingOthersDialog[id] == false) {
                    currentOtherHighlightHoverId = id;
                    othersDialog = $("dialog#others-highlight-hover")[0];
                    othersDialog.show();
                    $("dialog#others-highlight-hover").css("transform","translate3d("+e.pageX+"px,"+e.pageY+"px,0px)");
                    showingOthersDialog = {};
                    showingOthersDialog[id] = true;
                }
            }
        });
    },

    addMineHighlightsListener: function() {
        $('dialog#mine-highlight-hover').on({
            mouseleave: function () {
                _popup.startHighlightHoverCounter(2000);
            },
            mouseenter: function() {
                clearTimeout(highlightHoverCounter);
            }
        });
        $('#delete-highlight-btn').on('click', function() {
            _dataControl.deleteHighlight(currentHighlightHoverId);
            $('.deleted-btn').css('display', 'block');
            $('.delete-btn').css('display', 'none');
            _popup.sendToBack('update_log', {});
        });
        $('.highlighted.mine-highlight').on({
            mouseover: function (e) {
                const id = $(this)[0].id;
                if(!(''+id in showingMineDialog)) {
                    showingMineDialog[id] = false;
                }
                if(showingMineDialog[id] == false) {
                    currentHighlightHoverId = id;
                    mineDialog = $("dialog#mine-highlight-hover")[0];
                    mineDialog.show();
                    $("dialog#mine-highlight-hover").css("transform","translate3d("+e.pageX+"px,"+e.pageY+"px,0px)");
                    showingMineDialog = {};
                    showingMineDialog[id] = true;
                }
            }
        });
    },

    addHoverListeners: function() {
        $('.highlighted').on({
            mouseover: function (e) {
                const id = $(this)[0].id;
                $('.highlighted[id='+id+']').addClass('hovered');
            },
            mouseleave: function () {
                const id = $(this)[0].id;
                $('.highlighted[id='+id+']').removeClass('hovered');
            }
        });
    },

    likeHighlight: function() {
        var id = currentOtherHighlightHoverId;
        var currentHighlight = othersHighlights.find(highlight => highlight._id == id);
        _highlighter.removeHighlight(id);
        _dataControl.saveHighlight(currentHighlight.xpath, currentHighlight.text);
        this.startHighlightHoverCounter(2000);
        $('.like-btn').css('display', 'none');
        $('.liked-btn').css('display', 'block');
    },
}

_highlighter.addEventListeners();


