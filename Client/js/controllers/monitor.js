// Import hàm download từ file.js
import { downloadImageFromBase64 } from '../utils/file.js';
// Import hàm showToast từ ui.js (nơi nó thực sự được định nghĩa)
import { showToast } from '../utils/ui.js';

let objectUrl = null;

export function handleBinaryStream(arrayBuffer) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
    objectUrl = URL.createObjectURL(blob);
    const img = document.getElementById("live-screen");
    img.src = objectUrl;
    img.style.display = "block";
    document.getElementById("screen-placeholder").style.display = "none";
    document.getElementById("monitorStatus").innerText = "Live Streaming";
}

export function handleScreenCapture(payload) {
    const imgSrc = "data:image/jpeg;base64," + payload;
    const previewImg = document.getElementById("captured-preview");
    if (previewImg) {
        previewImg.src = imgSrc;
        previewImg.classList.remove("hidden");
        document.getElementById("preview-text").style.display = "none";
        document.getElementById("save-badge").classList.remove("hidden");
    }
}

export function handleScreenshotFile(payload) {
    downloadImageFromBase64(payload);
    showToast("Ảnh đã được lưu về máy!", "success");
}