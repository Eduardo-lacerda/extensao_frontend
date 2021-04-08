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
            _highlighter.highlightLoadedText(message.data.xpath, color, message.data.highlightId); 
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
        var wasOpened = false;
        if(popupOpened) {
            wasOpened = true;
            _popup.closePopup();
        }
        
        var sel = window.getSelection ? window.getSelection() : document.selection.createRange(); // FF : IE
        var range = sel.getRangeAt(0);

        if(wasOpened)
            _popup.openPopup('default');

        //if(range.startOffset != 0 && range.endOffset != 0 && (range.startContainer.nodeName != 'BODY' && range.endContainer.nodeName != 'BODY'))
        if(range.startContainer.nodeName != 'BODY' && range.endContainer.nodeName != 'BODY') {
            const xpath = _xpath.createXPathRangeFromRange(range);
            const selectedText = range.toString();
            currentRange = range;
            //const id = _utils.create_UUID();
            _chromeStorage.saveHighlight(xpath, selectedText);
        }
    },
    
    highlightLoadedText: function(xpath, highlightColor, id) {
        var range = _xpath.createRangeFromXPathRange(xpath);
        if(range != null)
            this.wrapSelection(range, highlightColor, id);
    },

    removeHighlight: function (id, closePopup) {
        if(closePopup) {
            var popupWasOpened = false;
            if(popupOpened) {
                popupWasOpened = true;
                _popup.closePopup();
            }
        }


        // id is for first span in list
        var spanList = $('[id='+ id +']');
        var that = this;
        Array.prototype.forEach.call(spanList, span => {
            that.removeHighlightAux(span, closePopup, popupWasOpened);
        })
    },

    removeHighlightAux: function(span, closePopup, popupWasOpened) {
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

        if(closePopup && popupWasOpened)
            _popup.openPopup('default');

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
        if(document.getElementById(id) != null)
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
        return node &&
            node.nodeType === Node.ELEMENT_NODE && node.nodeName === "SPAN" &&
            node.firstSpan !== undefined;
    }
}

_highlighter.addEventListeners();


