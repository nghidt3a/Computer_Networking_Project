const TELEX_MAPPING = {
    aw: "ă", aa: "â", dd: "đ", ee: "ê", oo: "ô", ow: "ơ", uw: "ư",
    uow: "ươ", uwo: "ươ",
    tone: { s: 1, f: 2, r: 3, x: 4, j: 5 },
};
  
const VOWEL_TABLE = [
    ["a", "á", "à", "ả", "ã", "ạ"], ["ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"], ["â", "ấ", "ầ", "ẩ", "ẫ", "ậ"],
    ["e", "é", "è", "ẻ", "ẽ", "ẹ"], ["ê", "ế", "ề", "ể", "ễ", "ệ"], ["i", "í", "ì", "ỉ", "ĩ", "ị"],
    ["o", "ó", "ò", "ỏ", "õ", "ọ"], ["ô", "ố", "ồ", "ổ", "ỗ", "ộ"], ["ơ", "ớ", "ờ", "ở", "ỡ", "ợ"],
    ["u", "ú", "ù", "ủ", "ũ", "ụ"], ["ư", "ứ", "ừ", "ử", "ữ", "ự"], ["y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"],
];

function findToneInWord(word) {
    for (let i = 0; i < word.length; i++) {
        let char = word[i].toLowerCase();
        for (let row of VOWEL_TABLE) {
            for (let t = 1; t < row.length; t++) {
                if (row[t] === char) return [i, t, row[0]];
            }
        }
    }
    return null;
}

function findVowelToPlaceTone(word) {
    const lowerWord = word.toLowerCase();
    if (lowerWord.includes("ươ")) return lowerWord.indexOf("ươ") + 1;
    const priority = ["ê", "ô", "ơ", "â", "ă", "ư"];
    for (let i = 0; i < word.length; i++) {
        if (priority.includes(lowerWord[i])) return i;
    }
    const exceptions = ["oa", "oe", "uy"];
    for (let exc of exceptions) {
        if (lowerWord.includes(exc)) return lowerWord.indexOf(exc) + 1;
    }
    let startIdx = 0;
    if (lowerWord.startsWith("qu") || lowerWord.startsWith("gi")) {
        if (/[ueoaiy]/.test(lowerWord.slice(2))) startIdx = 2;
    }
    const normal = ["a", "e", "o", "u", "i", "y"];
    for (let i = startIdx; i < word.length; i++) {
        if (normal.includes(lowerWord[i])) return i;
    }
    return -1;
}

function getCharWithTone(baseChar, toneIndex) {
    for (let row of VOWEL_TABLE) {
        if (row[0] === baseChar.toLowerCase()) return row[toneIndex];
    }
    return baseChar;
}

function replaceCharInString(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + 1);
}

export function applyTelex(text, char) {
    if (char === "<BACK>") return text.slice(0, -1);
    if (char === "<ENTER>") return text + "\n";
    if (char === "<TAB>") return text + "    ";
    if (!/^[a-zA-Z0-9]$/.test(char)) return text + char;
  
    let lastSpace = Math.max(text.lastIndexOf(" "), text.lastIndexOf("\n"));
    let prefix = text.substring(0, lastSpace + 1);
    let word = text.substring(lastSpace + 1);
    let lowerChar = char.toLowerCase();
  
    if (TELEX_MAPPING.tone[lowerChar]) {
        let toneMark = TELEX_MAPPING.tone[lowerChar];
        let toneInfo = findToneInWord(word);
        if (toneInfo) {
            let [charIndex, currentTone, baseChar] = toneInfo;
            if (currentTone === toneMark) {
                let cleanWord = replaceCharInString(word, charIndex, baseChar);
                return prefix + cleanWord + char;
            } else {
                let newCharWithTone = getCharWithTone(baseChar, toneMark);
                if (word[charIndex] === word[charIndex].toUpperCase()) newCharWithTone = newCharWithTone.toUpperCase();
                let newWordReplaced = replaceCharInString(word, charIndex, newCharWithTone);
                return prefix + newWordReplaced;
            }
        } else {
            let targetIndex = findVowelToPlaceTone(word);
            if (targetIndex !== -1) {
                let baseChar = word[targetIndex];
                let newCharWithTone = getCharWithTone(baseChar, toneMark);
                if (baseChar === baseChar.toUpperCase()) newCharWithTone = newCharWithTone.toUpperCase();
                let newWordReplaced = replaceCharInString(word, targetIndex, newCharWithTone);
                return prefix + newWordReplaced;
            }
        }
    }

    let last3 = (word + char).slice(-3).toLowerCase();
    if (last3 === "uow" || last3 === "uwo") return prefix + (word + char).slice(0, -3) + "ươ";
    let last2 = (word + char).slice(-2).toLowerCase();
    if (lowerChar === "d" && word.endsWith("đ")) return prefix + word.slice(0, -1) + "dd";
    if (lowerChar === "a" && word.endsWith("â")) return prefix + word.slice(0, -1) + "aa";
    if (TELEX_MAPPING[last2]) {
        let replaceChar = TELEX_MAPPING[last2];
        let firstOfPair = (word + char).slice(-2)[0];
        if (firstOfPair === firstOfPair.toUpperCase()) replaceChar = replaceChar.toUpperCase();
        return prefix + word.slice(0, -1) + replaceChar;
    }
    if (lowerChar === "w") {
        let lastChar = word.slice(-1);
        if (lastChar.toLowerCase() === "u") return prefix + word.slice(0, -1) + (lastChar === "U" ? "Ư" : "ư");
        if (lastChar.toLowerCase() === "o") return prefix + word.slice(0, -1) + (lastChar === "O" ? "Ơ" : "ơ");
        if (lastChar.toLowerCase() === "a") return prefix + word.slice(0, -1) + (lastChar === "A" ? "Ă" : "ă");
    }
    return text + char;
}