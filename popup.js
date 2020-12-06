var highlightMode = false;

chrome.storage.sync.get('highlightMode', function(data) {
    highlightMode = data.highlightMode;
    highlightMode = !highlightMode;
    chrome.storage.sync.set({'highlightMode': highlightMode}, function() {});

    if(highlightMode) {
        $.get(chrome.runtime.getURL('/popup.html'), function(data) {
            $('body').prepend(data);
        });
    }
    else {
        $('.popup').remove();
    }
});