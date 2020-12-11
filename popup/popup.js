//Ligar / desligar highlight mode
chrome.storage.sync.get('highlightMode', function(data) {
    highlightMode = data.highlightMode;
    highlightMode = !highlightMode;
    chrome.storage.sync.set({'highlightMode': highlightMode}, function() {});

    if(highlightMode) {
        _highlighter.turnOnHighlightMode();
    }
    else {
        _highlighter.turnOffHighlightMode();
    }
});

