const currentURL = window.location.href;

var _chromeStorage = {
    /* Estrutura do objeto:
    {
        "http://example": {
            "highlights": [
                {"xpath": "teste", "text": "exemplo de highlight"}
            ]
        }
    } */

    getHighlights: function () {
        chrome.storage.sync.get(currentURL, function(data) {
            //Se a url já foi salva
            if(data[currentURL]) {
                //Se existem highlights nessa url
                if(data[currentURL]['highlights']) {
                    var highlights = data[currentURL]['highlights'];
                    
                    //Estilizar highlights
                    highlights.forEach(highlight => {
                        _highlighter.highlightLoadedText(highlight.xpath, highlight.color);
                    });
                }
            }
        }); 
    },

    saveHighlight: function(xpath, text) {
        chrome.storage.sync.get(currentURL, function(data) {
            if(data[currentURL])
                data = data[currentURL];

            //Caso não existem highlights
            if(!data['highlights']) {
                data['highlights'] = [];
            }
            //-----------------------------
            
            var highlight = {'text': text, 'xpath': xpath, 'color': color};
            data['highlights'].push(highlight);
            var emptyObj = {};
            emptyObj[currentURL] = data;
            chrome.storage.sync.set(emptyObj, function() {});
        });
    }
};

