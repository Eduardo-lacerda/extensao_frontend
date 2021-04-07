var currentURL = window.location.href;
var log = {};
var highlightData = {};
var ratingData = {};
var othersHighlightsData = {};
var userEmail;


//Carregar os highlights já feitos na página
chrome.extension.onMessage.addListener(function (message, messageSender, sendResponse) {
    switch (message.msg) {
        case "load_all_highlights":
            _chromeStorage.getHighlights();
            break;
        case "register_user":
            console.log('registerUser');
            _chromeStorage.registerUser(message.data);
            break;
        case "login_user":
            _chromeStorage.loginUser(message.data);
            break;
        case "save_highlight":
            _chromeStorage.saveHighlight(message.data);
            break;
        case "delete_highlight":
            _chromeStorage.removeHighlight(message.data.highlightId);
            break;
        case "search_highlights_substring":
            _chromeStorage.getHighlights('updateLog', message.data.substring);
            break;
        case "send_rating":
            _chromeStorage.sendRating(message.data);
            break;
    }
    return true;
});
//--------------------------------------

var _chromeStorage = {
    getAllHighlights: function(tabId) {
        this.getOthersHighlights(tabId);
    },

    getHighlights: function (callBack, substring) {
        var that = this;

        chrome.storage.local.get('destaquei_jwt_token', function (data) {
            if (data['destaquei_jwt_token']) {
                var params = {};
                if(substring != undefined && substring != null) {
                    params['text'] = substring;
                }
                $.ajax({
                    url: "https://visualiz.com.br/highlights",
                    headers: { "Authorization": "Bearer " + data['destaquei_jwt_token'] },
                    contentType: "application/json",
                    data: params,
                    dataType: "json",
                    type: 'get',
                    crossDomain: true,
                    success: function (response) {
                        console.log(response)
                        if (!response.error) {
                            var data = response.results;
                            highlightData = response.results.highlights;
                            if (callBack == 'updateAll') {
                                that.updateLog(data.highlights);
                                that.updatePageHighlights(data.highlights);
                                console.log('get highlights update all')
                            }
                            else if (callBack == 'updateLog')
                                that.updateLog(data.highlights);
                            else if (callBack == 'updatePageHighlights')
                                that.updatePageHighlights(data.highlights);
                            else if (callBack == 'updateAllAndOthers') {
                                that.updateLog(data.highlights);
                                that.updatePageHighlights(data.highlights);
                                that.updateOthersHighlights();
                            }
                        }
                    },
                    error: function (response) {
                        console.log(response)
                        //Se code for 401, logar de novo
                        if (response.error) {
                            if (response.errors)
                                that.sendToFront('error_message', { msg: response.errors.msg, type: "get_highlights" });
                            else
                                that.sendToFront('error_message', { msg: "Erro no servidor", type: "get_highlights" });
                        }
                    }
                });
            }
        });
    },

    getOthersHighlights: function (url) {
        var that = this;

        var params = {url: url};
        $.ajax({
            url: "https://visualiz.com.br/highlights/others",
            contentType: "application/json",
            data: params,
            dataType: "json",
            type: 'get',
            crossDomain: true,
            success: function (response) {
                console.log(response)
                if (!response.error) {
                    var responseData = response.results.highlights;
                    chrome.storage.local.get('user_email', function (data) {
                        if (data['user_email']) {
                            userEmail = data['user_email'];
                            othersHighlightsData = responseData;
                            that.getHighlights('updateAllAndOthers');
                        }
                        else {
                            that.sendToFront('update_others_highlights', responseData);
                        }
                    });
                }
            },
            error: function (response) {
                console.log(response)
                //Se code for 401, logar de novo
                if (response.error) {
                    if (response.errors)
                        that.sendToFront('error_message', { msg: response.errors.msg, type: "get_others_highlights" });
                    else
                        that.sendToFront('error_message', { msg: "Erro no servidor", type: "get_others_highlights" });
                }
            }
        });
    },
    
    updateOthersHighlights: function() {
        othersHighlightsData = othersHighlightsData.filter(item => {
            var condition = true;
            if(item.user_email == userEmail)
                condition = false;
            var sameHighlight = highlightData.find(highlight => highlight.text == item.text);
            if(sameHighlight != null) //Existir o mesmo texto nos highlights alheios e próprios
                condition = false;
            return condition;
        })
        this.sendToFront('update_others_highlights', othersHighlightsData);
    },

    saveHighlight: function (highlight) {
        var that = this;

        chrome.storage.local.get('user_email', function (data) {
            console.log(data);
            if (data['user_email']) {
                highlight['user_email'] = data['user_email'];

                chrome.storage.local.get('destaquei_jwt_token', function (data) {
                    $.ajax({
                        url: "https://visualiz.com.br/highlights",
                        headers: { "Authorization": "Bearer " + data['destaquei_jwt_token'] },
                        contentType: "application/json",
                        dataType: "json",
                        type: 'post',
                        crossDomain: true,
                        data: JSON.stringify(highlight),
                        success: function (response) {
                            console.log(response)
                            if (!response.error) {
                                that.getHighlights('updateLog');
                                that.sendToFront('wrap_highlight', { highlightId: response.results.id, xpath: response.results.xpath })
                            }
                        },
                        error: function (response) {
                            console.log(response)
                            if (response.error) {
                                if (response.errors)
                                    _popup.showMessage({ msg: response.errors.msg, type: "save_highlight" }, 'error');
                                else
                                    _popup.showMessage({ msg: 'Erro no servidor', type: "save_highlight" }, 'error');
                            }
                        }
                    });
                });
            }
        });
    },

    sendRating: function (ratingData) {
        var that = this;

        chrome.storage.local.get('destaquei_jwt_token', function (data) {
            $.ajax({
                url: "https://visualiz.com.br/rate",
                headers: { "Authorization": "Bearer " + data['destaquei_jwt_token'] },
                contentType: "application/json",
                dataType: "json",
                type: 'post',
                crossDomain: true,
                data: JSON.stringify(ratingData),
                success: function (response) {
                    console.log(response)
                    that.sendToFront('success_message', { msg: "Avaliação enviada com sucesso!", type: "save_rating" });
                },
                error: function (response) {
                    console.log(response)
                    if (response.error) {
                        if (response.errors)
                        that.sendToFront('error_message', { msg: response.errors.msg, type: "save_rating" });
                    else
                        that.sendToFront('error_message', { msg: "Erro no servidor", type: "save_rating" });
                    }
                }
            });
        });
    },

    updateLog: function (data) {
        log = data;
        var logsHTML = '';
        
        if (data != undefined) {
            data.forEach(highlight => {
                highlight.color = highlight.color[0];
                highlight['id'] = highlight['_id'];
                const iconImg = '<div class="icon-wrapper ipp"><a target="_blank" class="ipp" href="' + highlight.url + '"><img class="log-web-icon ipp" src="' + highlight.icon_url + '"></a></div>';
                var logHTML = '<a rel="noopener" target="_blank" class="ipp" href="' + highlight.url + '#:~:text=' + encodeURIComponent(highlight.text) + '"><div class="log-wrapper ipp">';
                var text = '<p class="log-text ipp ' + highlight.color + '">' + highlight.text + '</p>';
                logHTML = logHTML + text + '<div class="log-icons ipp" id="' + highlight.url + '">';
                logHTML = logHTML + iconImg + '<i id="' + highlight.id + '" class="ipp material-icons-outlined log-delete">delete</i></div></div></a>';
                logsHTML = logsHTML + logHTML;
            });

            this.sendToFront('update_log', { log: log, logsHTML: logsHTML, highlightMode: highlightMode});
        }
    },

    updatePageHighlights: function (data) {
        console.log('updatepage highlights back')
        this.sendToFront('update_page_highlights', data);
    },

    registerUser: function (data) {
        var that = this;
        console.log(JSON.stringify(data))
        $.ajax({
            url: "https://visualiz.com.br/auth/register",
            contentType: "application/json",
            dataType: "json",
            type: 'post',
            crossDomain: true,
            data: JSON.stringify(data),
            success: function (response) {
                console.log(response)
                if (!response.error) {
                    that.sendToFront('success_message', { msg: "Registrado com sucesso!", type: "register" });
                    that.verifyUser(response.results.verification);
                }
            },
            error: function (response) {
                console.log(response)
                if (response.error) {
                    if (response.errors)
                        that.sendToFront('error_message', { msg: response.errors.msg, type: "register" });
                    else
                        that.sendToFront('error_message', { msg: "Erro no servidor", type: "register" });
                }
            }
        })
    },

    loginUser: function (data) {
        var that = this;
        $.ajax({
            url: "https://visualiz.com.br/auth/login",
            contentType: "application/json",
            dataType: "json",
            type: 'post',
            crossDomain: true,
            data: JSON.stringify(data),
            success: function (response) {
                if (!response.error) {
                    chrome.storage.local.set({ 'destaquei_jwt_token': response.results.token }, function () { });
                    chrome.storage.local.set({ 'user_email': response.results.user.email }, function () { });
                    that.sendToFront('logged_in', {});
                    that.getHighlights('updateAll');
                }
            },
            error: function (response) {
                if (response.error) {
                    if (response.errors)
                        that.sendToFront('error_message', { msg: response.errors, type: "register" });
                    else
                        that.sendToFront('error_message', { msg: "Erro no servidor", type: "register" });
                }
            }
        })
    },

    verifyUser: function (data) {
        var that = this;
        $.ajax({
            url: "https://visualiz.com.br/auth/verify/" + data.token,
            contentType: "application/json",
            dataType: "json",
            type: 'get',
            crossDomain: true,
            success: function (response) {
                console.log(response);
            }
        })
    },

    removeHighlight: function (highlightId) {
        var that = this;
        chrome.storage.local.get('destaquei_jwt_token', function (data) {
            if (data['destaquei_jwt_token']) {
                $.ajax({
                    url: "https://visualiz.com.br/highlights/" + highlightId,
                    headers: { "Authorization": "Bearer " + data['destaquei_jwt_token'] },
                    contentType: "application/json",
                    dataType: "json",
                    type: 'delete',
                    crossDomain: true,
                    success: function (response) {
                        console.log(response)
                        if (!response.error) {
                            that.getHighlights('updateAll');
                        }
                    },
                    error: function (response) {
                        console.log(response)
                        if (response.error) {
                            if (response.errors)
                                _popup.showMessage({ msg: response.errors, type: "delete_highlight" }, 'error');
                            else
                                _popup.showMessage({ msg: 'Erro no servidor', type: "save_highlight" }, 'error');
                        }
                    }
                });
            }
        });
    },

    getRating: function (tabId, pageUrl, baseUrl) {
        console.log('update rating back')
        console.log(baseUrl)
        var that = this;
        
        var params = {"baseUrl": baseUrl, "pageUrl": pageUrl};
        console.log(params)
        $.ajax({
            url: "https://visualiz.com.br/rate",
            contentType: "application/json",
            data: params,
            dataType: "json",
            type: 'get',
            crossDomain: true,
            success: function (response) {
                if (!response.error) {
                    var data = response.results.rate;
                    var newData = {};
                    newData['pageRating'] = data.page_rate.toFixed(1);
                    newData['baseRating'] = data.base_rate.toFixed(1);
                    newData['comments'] = data.comments; 
                    console.log(newData);
                    that.sendToFront('update_rating', { ratingData: newData }, tabId);
                }
            },
            error: function (response) {
                console.log(response)
                //Se code for 401, logar de novo
                if (response.error) {
                    if (response.errors)
                        that.sendToFront('error_message', { msg: response.errors.msg, type: "get_rating" });
                    else
                        that.sendToFront('error_message', { msg: "Erro no servidor", type: "get_rating" });
                }
            }
        });
    },

    sendToFront: function (msg, data, tabId) {
        console.log('tabid: '+tabId)
        var obj = {msg: msg, data: data};
        if(tabId) {
            chrome.tabs.sendMessage(tabId, obj);
        }
        else {
            chrome.tabs.query({}, function (tabs) {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, obj);
                });
            });
        }
    }
};





//OLHAR ISSO: CRIAR URL ÚNICA PARA HIGHLIGHT

const startProcessing = async (tab) => {
    const result = await createURL(tab.url);
    if(result)
        return result;
    else
        return null;
};

const escapeRegExp = (s) => {
    return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
};

const unescapeRegExp = (s) => {
    return s.replace(/\\([\\^$.*+?()[\]{}|])/g, '$1');
};

const encodeURIComponentAndMinus = (text) => {
    return encodeURIComponent(text).replace(/-/g, '%2D');
};

const isUniqueMatch = (hayStack, start, end = '') => {
    try {
        const needle = new RegExp(`${start}${end}`, 'gims');
        const matches = [...hayStack.matchAll(needle)];
        log(
            '———\n',
            'RegEx: 👉' + needle.source + '👈\n',
            'Matches:',
            matches,
            '\n———',
        );
        if (matches.length === 1) {
            let matchedText = matches[0][0];
            // Find inner matches where the needle is (at least partly) contained
            // again in the haystack.
            const startNeedle = new RegExp(start, 'ims');
            const endNeedle = new RegExp(end.replace(/^\.\*\?/), 'ims');
            matchedText = matchedText
                .replace(startNeedle, '')
                .replace(endNeedle, '');
            const innerMatches = [...matchedText.matchAll(needle)];
            if (innerMatches.length === 0) {
                return true;
            }
            return false;
        } else if (matches.length === 0) {
            return null;
        }
        return false;
    } catch (err) {
        // This can happen when the regular expression can't be created.
        console.error(err.name, err.message);
        return null;
    }
};

const findUniqueMatch = (
    pageText,
    textStart,
    textEnd,
    unique,
    wordsBefore,
    wordsAfter,
    growthDirection,
    prefix = '',
    suffix = '',
) => {
    log(
        'prefix: "' +
        prefix +
        '"\n' +
        'textStart: "' +
        textStart +
        '"\n' +
        'textEnd: "' +
        textEnd +
        '"\n' +
        'suffix: "' +
        suffix +
        '"\n' +
        'growth direction: ' +
        growthDirection,
    );
    if (
        wordsAfter.length === 0 &&
        wordsBefore.length > 0 &&
        growthDirection === 'suffix'
    ) {
        // Switch the growth direction.
        growthDirection = 'prefix';
    } else if (
        wordsBefore.length === 0 &&
        wordsAfter.length === 0 &&
        unique === false
    ) {
        // No more search options.
        return {
            prefix: false,
            suffix: false,
        };
    }
    // We need to add outer context before or after the needle.
    if (growthDirection === 'prefix' && wordsBefore.length > 0) {
        const newPrefix = escapeRegExp(wordsBefore.pop());
        prefix = `${newPrefix}${prefix ? ` ${prefix}` : ''}`.trim();
        log('New prefix "' + prefix + '"');
    } else if (wordsAfter.length > 0) {
        const newSuffix = escapeRegExp(wordsAfter.shift());
        suffix = `${suffix ? `${suffix} ` : ''}${newSuffix}`.trim();
        log('New suffix "' + suffix + '"');
    }
    unique = isUniqueMatch(
        pageText,
        `${prefix ? `${prefix}(.?|\\s*)` : ''}${textStart}`,
        // eslint-disable-next-line max-len
        `${textEnd ? `.*?${textEnd}` : ''}${suffix ? `(.?|\\s*)${suffix}` : ''}`,
    );
    if (unique) {
        return {
            prefix: unescapeRegExp(prefix.trim()),
            suffix: unescapeRegExp(suffix.trim()),
        };
    } else if (unique === null) {
        // Couldn't create regular expression. This should rarely happen…
        return {
            prefix: false,
            suffix: false,
        };
    }
    return findUniqueMatch(
        pageText,
        textStart,
        textEnd,
        unique,
        wordsBefore,
        wordsAfter,
        growthDirection,
        prefix,
        suffix,
    );
};

const chooseSeedTextStartAndTextEnd = (selection) => {
    const selectedText = selection;
    const selectedWords = selection.split(/\s/g);
    const selectedParagraphs = selection.split(/\n+/g);
    let textStart = '';
    let textEnd = '';
    let textStartGrowthWords = [];
    let textEndGrowthWords = [];
    log('🔎 Beginning our search.', selection);
    // Reminder: `shift()`, `pop()`, and `splice()` all change the array.
    if (selectedParagraphs.length > 1) {
        log('Selection spans multiple boundaries.');
        // Use the first word of the first boundary and the last word of the last
        // boundary.
        const selectedWordsBeforeBoundary = selectedParagraphs
            .shift()
            .split(/\s/g);
        const selectedWordsAfterBoundary = selectedParagraphs.pop().split(/\s/g);
        textStart = selectedWordsBeforeBoundary.shift();
        textEnd = selectedWordsAfterBoundary.pop();
        // Add inner context at the beginning and the end.
        if (CONTEXT_MAX_WORDS > 0) {
            if (selectedWordsBeforeBoundary.length) {
                textStart +=
                    ' ' +
                    selectedWordsBeforeBoundary.splice(0, CONTEXT_MAX_WORDS).join(' ');
            }
            textStartGrowthWords = selectedWordsBeforeBoundary;
            if (selectedWordsAfterBoundary.length) {
                textEnd =
                    selectedWordsAfterBoundary
                        .splice(-1 * CONTEXT_MAX_WORDS)
                        .join(' ') +
                    ' ' +
                    textEnd;
            }
            textEndGrowthWords = selectedWordsAfterBoundary;
        }
    } else if (
        selectedWords.length === 1 ||
        selectedText.length <= EXACT_MATCH_MAX_CHARS
    ) {
        log('Selection spans just one boundary and is short enough.');
        // Just use the entire text.
        textStart = selectedText;
    } else {
        log('Selection spans just one boundary, but is too long.');
        // Use the first and the last word of the selection.
        textStart = selectedWords.shift();
        textEnd = selectedWords.pop();
        // Add inner context at the beginning and the end.
        if (CONTEXT_MAX_WORDS > 0) {
            if (selectedWords.length) {
                textStart +=
                    ' ' + selectedWords.splice(0, CONTEXT_MAX_WORDS).join(' ');
            }
            // Need to check again since `splice` changes the array.
            if (selectedWords.length) {
                textEnd =
                    selectedWords.splice(-1 * CONTEXT_MAX_WORDS).join(' ') +
                    ' ' +
                    textEnd;
            }
            textStartGrowthWords = selectedWords;
        }
    }
    return {
        textStart: escapeRegExp(textStart.trim()),
        textEnd: escapeRegExp(textEnd.trim()),
        textStartGrowthWords,
        textEndGrowthWords,
    };
};

const createURL = async (tabURL) => {
    let pageResponse;
    try {
        pageResponse = await sendMessageToPage('get-text');
    } catch (err) {
        console.error(err.name, err.message);
        return false;
    }
    const {
        selectedText,
        pageText,
        textBeforeSelection,
        textAfterSelection,
        textNodeBeforeSelection,
        textNodeAfterSelection,
        closestElementFragment,
    } = pageResponse;

    if (!selectedText) {
        return '';
    }

    tabURL = new URL(tabURL);
    let textFragmentURL = `${tabURL.origin}${tabURL.pathname}${tabURL.search}${closestElementFragment ? `#${closestElementFragment}` : '#'
        }`;

    let {
        textStart,
        textEnd,
        textStartGrowthWords,
        textEndGrowthWords,
    } = chooseSeedTextStartAndTextEnd(selectedText);
    let unique = isUniqueMatch(
        pageText,
        textStart,
        `${textEnd ? `.*?${textEnd}` : ''}`,
    );
    if (unique) {
        // We have a unique match, return it.
        textStart = encodeURIComponentAndMinus(unescapeRegExp(textStart));
        textEnd = textEnd ?
            `,${encodeURIComponentAndMinus(unescapeRegExp(textEnd))}` :
            '';
        return {
            url: (textFragmentURL += `:~:text=${textStart}${textEnd}`),
            selectedText,
        };
    } else if (unique === null) {
        return false;
    }

    // We need to add inner context to textStart.
    if (textStartGrowthWords.length) {
        log('Growing inner context at text start');
        while (textStartGrowthWords.length) {
            const newTextStart = escapeRegExp(textStartGrowthWords.shift());
            textStart = `${textStart} ${newTextStart}`;
            log('New text start "' + textStart + '"');
            unique = isUniqueMatch(
                pageText,
                textStart,
                `${textEnd ? `.*?${textEnd}` : ''}`,
            );
            if (unique) {
                // We have a unique match, return it.
                textStart = encodeURIComponentAndMinus(unescapeRegExp(textStart));
                textEnd = textEnd ?
                    `,${encodeURIComponentAndMinus(unescapeRegExp(textEnd))}` :
                    '';
                return {
                    url: (textFragmentURL += `:~:text=${textStart}${textEnd}`),
                    selectedText,
                };
            } else if (unique === null) {
                return false;
            }
        }
    }

    // We need to add inner context to textEnd.
    if (textEndGrowthWords.length) {
        log('Growing inner context at text end');
        while (textEndGrowthWords.length) {
            const newTextEnd = escapeRegExp(textEndGrowthWords.pop());
            textEnd = `${newTextEnd} ${textEnd}`;
            log('New text end "' + textEnd + '"');
            unique = isUniqueMatch(pageText, textStart, `.*?${textEnd}`);
            if (unique) {
                // We have a unique match, return it.
                textStart = encodeURIComponentAndMinus(unescapeRegExp(textStart));
                textEnd = encodeURIComponentAndMinus(unescapeRegExp(textEnd));
                return {
                    url: (textFragmentURL += `:~:text=${textStart}${textEnd}`),
                    selectedText,
                };
            } else if (unique === null) {
                return false;
            }
        }
    }

    // We need to add outer context. Therefore, use the text before/after in the
    // same node as the selected text, or if there's none, the text in
    // the previous/next node.
    const wordsInTextNodeBeforeSelection = textNodeBeforeSelection ?
        textNodeBeforeSelection.split(/\s/g) :
        [];
    const wordsBeforeSelection = textBeforeSelection ?
        textBeforeSelection.split(/\s/g) :
        [];
    const wordsBefore = wordsBeforeSelection.length ?
        wordsBeforeSelection :
        wordsInTextNodeBeforeSelection;

    const wordsInTextNodeAfterSelection = textNodeAfterSelection ?
        textNodeAfterSelection.split(/\s/g) :
        [];
    const wordsAfterSelection = textAfterSelection ?
        textAfterSelection.split(/\s/g) :
        [];
    const wordsAfter = wordsAfterSelection.length ?
        wordsAfterSelection :
        wordsInTextNodeAfterSelection;

    // Add context either before or after the selected text, depending on
    // where there is more text.
    const growthDirection =
        wordsBefore.length > wordsAfter.length ? 'prefix' : 'suffix';

    let { prefix, suffix } = findUniqueMatch(
        pageText,
        textStart,
        textEnd,
        unique,
        wordsBefore,
        wordsAfter,
        growthDirection,
    );
    if (!prefix && !suffix) {
        return false;
    }
    prefix = prefix ?
        `${encodeURIComponentAndMinus(unescapeRegExp(prefix))}-,` :
        '';
    suffix = suffix ?
        `,-${encodeURIComponentAndMinus(unescapeRegExp(suffix))}` :
        '';
    textStart = encodeURIComponentAndMinus(unescapeRegExp(textStart));
    textEnd = textEnd ?
        `,${encodeURIComponentAndMinus(unescapeRegExp(textEnd))}` :
        '';
    textFragmentURL += `:~:text=${prefix}${textStart}${textEnd}${suffix}`;
    return {
        url: textFragmentURL,
        selectedText,
    };
};