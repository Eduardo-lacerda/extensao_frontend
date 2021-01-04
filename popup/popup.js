//Ligar / desligar highlight mode
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if(message.msg == 'toggle_highlightMode'){
        highlightMode = message.data.highlightMode;
        _popup.toggleHighlightMode();
    }
    return true;
});

var _popup = {
    toggleHighlightMode: function() {
        if(highlightMode) {
            _highlighter.turnOnHighlightMode();
        }
        else {
            _highlighter.turnOffHighlightMode();
        }
    },
}


