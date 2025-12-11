import { showToast } from '../utils/ui.js';
import { handleKeylogData } from './keylogger.js';

export function logToTerminal(text, type = "info") {
    const term = document.getElementById("terminal-output");
    if (type === "keylog") {
        const key = text.replace("[Keylogger] ", "");
        const displayKey = key.length > 1 ? ` [${key}] ` : key;
        if (term.lastChild && term.lastChild.classList && term.lastChild.classList.contains("keylog-stream")) {
            term.lastChild.textContent += displayKey;
        } else {
            const div = document.createElement("div");
            div.className = "keylog-stream";
            div.style.color = "#fbbf24";
            div.textContent = `> ${displayKey}`;
            term.appendChild(div);
        }
    } else {
        const div = document.createElement("div");
        div.style.color = type === "system" ? "#3b82f6" : "#10b981";
        div.textContent = `[${new Date().toLocaleTimeString()}] > ${text}`;
        term.appendChild(div);
    }
    term.scrollTop = term.scrollHeight;
}

export function handleLog(text) {
    if (text.startsWith("[Keylogger]")) {
        handleKeylogData(text.replace("[Keylogger] ", ""));
    } else {
        logToTerminal(text, "info");
        if (text.includes("Đã diệt") || text.includes("Đã mở")) {
            showToast(text, "success");
        } else if (text.includes("Lỗi")) {
            showToast(text, "error");
        }
    }
}