var flag = 0;
var highlightMode;
var teste = 'asdasfsfa';
var color = 'yellow';

//Carregar os highlights já feitos na página
_chromeStorage.getHighlights();
//--------------------------------------

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
                _highlighter.highlightText();
            }
        });
    },

    turnOnHighlightMode: function() {
        $.get(chrome.runtime.getURL('popup/popup.html'), function(data) {
            $('body').prepend(data);
        });

        const that = this;
        setTimeout(function() {
            $('.highlighter-popup .color-btn.yellow').click(function() {
                that.changeHighlightColor('yellow');
            });
            $('.highlighter-popup .color-btn.blue').click(function() {
                that.changeHighlightColor('blue');
            });
            
            $('.highlighter-popup .color-btn.green').click(function() {
                that.changeHighlightColor('green');
            });
        }, 20);
    },

    turnOffHighlightMode: function() {
        $('.highlighter-popup').remove();
    },

    highlightText: function() {
        this.turnOffHighlightMode();
        var sel = window.getSelection ? window.getSelection() : document.selection.createRange(); // FF : IE
        var range = sel.getRangeAt(0);
        const xpath = _xpath.createXPathRangeFromRange(range);
        const selectedText = range.toString();
        _chromeStorage.saveHighlight(xpath, selectedText);

        this.wrapSelection(range, color);
        this.turnOnHighlightMode();
    },
    
    highlightLoadedText: function(xpath, highlightColor) {
        var range = _xpath.createRangeFromXPathRange(xpath);
        if(range != null)
            this.wrapSelection(range, highlightColor);
    },
    
    wrapSelection: function(range, highlightColor) {
        "use strict";
        // highlights are wrapped in one or more spans
        var span = document.createElement("SPAN");
        span.className = 'highlighted';
        $(span).addClass(highlightColor);
        
        // each node has a .nextElement property, for following the linked list
        var record = {
            firstSpan: null,
            lastSpan: null
        };
    
        this.wrapTextNodes(range, record, function () {
            // wrapper creator
            var newSpan = span.cloneNode(false);

            //Troca a cor baseado no contraste

            if (record.lastSpan) {
                record.lastSpan.nextSpan = newSpan;
            }
    
            record.lastSpan = newSpan;
    
            // every span in the highlight has a reference to the first span
            newSpan.firstSpan = record.firstSpan;
            return newSpan;
        });
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
    
        do {
            if (dirIsLeaf && node.nodeType === Node.TEXT_NODE &&
                    !(node.parentNode instanceof HTMLTableElement) &&
                    !(node.parentNode instanceof HTMLTableRowElement) &&
                    !(node.parentNode instanceof HTMLTableColElement) &&
                    !(node.parentNode instanceof HTMLTableSectionElement)) {
                //
                var wrap = node.previousSibling;
    
                if (!wrap || wrap !== record.lastSpan) {
                    wrap = createWrapper(node);
                    node.parentNode.insertBefore(wrap, node);
                }
    
                wrap.appendChild(node);
    
                node = wrap.lastChild;
                dirIsLeaf = false;
            }
    
            if (node === endSide && (!endSide.hasChildNodes() || !dirIsLeaf)) {
                done = true;
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

    changeHighlightColor: function(newColor){
        color = newColor;
    }
}

_highlighter.addEventListeners();


