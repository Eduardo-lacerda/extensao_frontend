const currentURL = window.location.href;

chrome.storage.sync.get(currentURL, function(data) {
    //Se a url já foi salva
    if(data[currentURL]) {
        //Se existem highlights nessa url
        if(data[currentURL]['highlights']) {
            var highlights = data[currentURL]['highlights'];
            highlights.forEach(highlightedText => {
                var stack = $(":contains('"+highlightedText+"')");
                var node = stack[stack.length-2];
                var nodeList = $(node)[0].childNodes
                nodeList.forEach((subNode, index) => {
                    var subNodeText = subNode.textContent;
                    //Achar qual parte do highlight está dentro desse elemento
                    var matchingText = compareStrings(highlightedText, subNodeText).toString().trim();
                    //
                    highlightPreviousTexts(node, matchingText, index);
                });
            });
        }
    }
}); 

function highlightPreviousTexts(node, text, subNodeIndex) {
    var newNode = document.createElement("span");
    const subNode = node.childNodes[subNodeIndex];
    const newHTML = subNode.textContent.replace(text, "<span class='highlighted'>" + text + "</span>");
    newNode.innerHTML = newHTML;
    node.replaceChild(newNode, subNode);
}


//Find parts in common between two strings

const findFirstSequence = (s1, s2) => {
    let subsequence = ""
  
    let s1Idx = 0
    let s2Idx = 0
  
    for (; s1Idx < s1.length; ++s1Idx) {
        const s1Char = s1[s1Idx]
        for (let j = s2Idx; j < s2.length; ++j, ++s2Idx) {
            const s2Char = s2[j]
            if (s1Char === s2Char) {
            subsequence += s1Char
                ++s2Idx
            break
            }
        }
        }
        return subsequence
}
  
const removeDistinctChars = (s1, s2) => s1.split("").filter(c => s2.includes(c)).join("")
const removeDuplicates = (arr) => Array.from(new Set(arr))
  
const findAllSubsequences = (s1, s2) => {
    const s1NoDistinct = removeDistinctChars(s1, s2)
    const s2NoDistinct = removeDistinctChars(s2, s1)

    let i = 0

    const sequences = []

    while (i < s1NoDistinct.length) {
        const sequence = findFirstSequence(s1NoDistinct.slice(i), s2NoDistinct)
        i += sequence.length
        sequences.push(sequence)
    }

    return sequences
}
  
const findLongestSubsequence = (s1, s2) => {
    const a = findAllSubsequences(s1, s2)
    const b = findAllSubsequences(s2, s1)

    return removeDuplicates([...a, ...b].sort((s1, s2) => s2.length - s1.length).filter((el, idx, arr) => el.length ===
    arr[0].length))
}
  
const compareStrings = (s1, s2) => {return findLongestSubsequence(s1, s2)};
//------------------------------------------