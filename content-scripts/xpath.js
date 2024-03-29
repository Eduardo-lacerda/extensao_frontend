//Calcula a localização exata de um elemento
var _xpath = {
    getXPathFromNode: function (node) {
        "use strict";
        // if (node && node.id) {
        //     return '//*[@id="' + node.id + '"]';
        // }

        var paths = [];

        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        for (; node && (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE); node = node.parentNode)  {
            var index = 0;

            if (node.id) {
                // if the document illegally re-uses an id, then we can't use it as a unique identifier
                var selector = '[id="' + node.id + '"]';

                // no jquery
                var length = document.querySelectorAll(selector).length;
                if (length === 1) {
                    // because the first item of the path array is prefixed with '/', this will become 
                    // a double slash (select all elements). But as there's only one result, we can use [1]
                    // eg: //*[@id='something'][1]/div/text()
                    paths.splice(0, 0, '/*[@id="' + node.id + '"][1]');
                    break;
                }

                console.log("document contains " + length + " elements with selector " + selector + ". Ignoring");
            }

            for (var sibling = node.previousSibling; sibling; sibling = sibling.previousSibling) {
                // Ignore document type declaration.
                if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) {
                    continue;
                }

                if (sibling.nodeName === node.nodeName) {
                    index++;
                }
            }

            var tagName = (node.nodeType === Node.ELEMENT_NODE ? node.nodeName.toLowerCase() : "text()");
            var pathIndex = (index ? "[" + (index+1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    },

    createXPathRangeFromRange: function (range) {
        "use strict";
        return {
            startContainerPath: this.getXPathFromNode(range.startContainer),
            startOffset: range.startOffset,
            endContainerPath: this.getXPathFromNode(range.endContainer),
            endOffset: range.endOffset,
            collapsed: range.collapsed
        };
    },
    
    createRangeFromXPathRange: function (xpathRange) {
        console.log('CHAMOUUU')
        "use strict";
        var startContainer, endContainer, endOffset, evaluator = new XPathEvaluator();

        // must have legal start and end container nodes
        startContainer = evaluator.evaluate(xpathRange.startContainerPath,
            document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        console.log(startContainer)
        if (!startContainer.singleNodeValue) {
            return null;
        }

        if (xpathRange.collapsed || !xpathRange.endContainerPath) {
            endContainer = startContainer;
            endOffset = xpathRange.startOffset;
        } else {
            endContainer = evaluator.evaluate(xpathRange.endContainerPath,
                document.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (!endContainer.singleNodeValue) {
                return null;
            }

            endOffset = xpathRange.endOffset;
        }

        // map to range object
        var range = document.createRange();
        range.setStart(startContainer.singleNodeValue, xpathRange.startOffset);
        range.setEnd(endContainer.singleNodeValue, endOffset);
        console.log(range)
        return range;
    }
};