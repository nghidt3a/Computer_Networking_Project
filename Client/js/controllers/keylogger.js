import { applyTelex } from '../utils/telex.js';

export function handleKeylogData(dataString) {
    let rawKey = dataString;
    let translatedChar = "";

    if (dataString.includes("|||")) {
        const parts = dataString.split("|||");
        rawKey = parts[0];
        translatedChar = parts[1];
    }

    // 1. Raw Key Output
    const rawContainer = document.getElementById("raw-key-output");
    if (rawContainer) {
        const span = document.createElement("span");
        span.className = "key-badge";
        span.innerText = rawKey;
        if (["Enter", "Back", "Delete"].includes(rawKey)) span.classList.add("special");
        if (rawKey.includes("Shift") || rawKey.includes("Control")) span.classList.add("mod");
        rawContainer.appendChild(span);
        rawContainer.scrollTop = rawContainer.scrollHeight;
    }

    // 2. Telex Editor Output
    if (translatedChar) {
        const editor = document.getElementById("keylogger-editor");
        if (editor) {
            editor.value = applyTelex(editor.value, translatedChar);
            editor.scrollTop = editor.scrollHeight;
        }
    }
}