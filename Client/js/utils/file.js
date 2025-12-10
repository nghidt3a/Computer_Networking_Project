import { showToast } from "./ui.js";

export function downloadLog() {
    const content = document.getElementById("keylogger-editor").value;
    if (!content) {
        showToast("Chưa có nội dung!", "error");
        return;
    }
    const time = new Date().toISOString().slice(0, 19).replace(/:/g, "-").replace("T", "_");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RCS_Log_${time}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Đang tải xuống...", "success");
}

export function downloadVideoFromBase64(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "video/avi" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    const time = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    a.download = `Server_Rec_${time}.avi`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

export function downloadImageFromBase64(base64) {
    const link = document.createElement('a');
    link.href = 'data:image/jpeg;base64,' + base64;
    const time = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    link.download = `Screenshot_${time}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}