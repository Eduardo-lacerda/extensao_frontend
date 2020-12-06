var highlightMode = false;
var flag = 0;

chrome.storage.sync.get('highlightMode', function(data) {
    highlightMode = data.highlightMode;
    console.log(data)
    highlightMode = !highlightMode;
    chrome.storage.sync.set({'highlightMode': highlightMode}, function() {});
});

document.addEventListener("mousedown", function () {
    flag = 0;
}, false);

document.addEventListener("mousemove", function () {
    flag = 1;
}, false);


document.addEventListener("mouseup", function () {
    if(flag == 1 && highlightMode){
        highlightText();
    }
});

function highlightText() {
    var sel = window.getSelection ? window.getSelection() : document.selection.createRange(); // FF : IE
    if (sel.getRangeAt) { // thats for FF
        var range = sel.getRangeAt(0);
        saveHighlight(range.toString());
        var newNode = document.createElement("span");
        newNode.setAttribute('class', 'highlighted');
        range.surroundContents(newNode);
    } else { //and thats for IE7
        saveHighlight(range.htmlText);
        sel.pasteHTML('<span class="highlighted">' + sel.htmlText + '</span>');
    }
}

function saveHighlight(text) {
    const currentURL = window.location.href;
    chrome.storage.sync.get(currentURL, function(data) {
        if(data[currentURL])
            data = data[currentURL];
        //Caso não existem highlights
        if(!data['highlights']) {
            data['highlights'] = [];
        }
        data['highlights'].push(text);
        var obj = {};
        obj[currentURL] = data;
        chrome.storage.sync.set(obj, function() {});
    });
}






