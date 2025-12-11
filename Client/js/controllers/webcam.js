import { sendCmd } from '../core/socket.js';
import { downloadVideoFromBase64 } from '../utils/file.js'; // Chỉ lấy hàm download từ file.js
import { showToast } from '../utils/ui.js'; // Lấy showToast từ ui.js

export function startRecordWebcam() {
    const duration = document.getElementById("record-duration").value;
    sendCmd("RECORD_WEBCAM", duration);
    showToast(`Yêu cầu ghi hình ${duration}s...`, "info");
}

export function startRecordWebcam() {
    const duration = document.getElementById("record-duration").value;
    sendCmd("RECORD_WEBCAM", duration);
    showToast(`Yêu cầu ghi hình ${duration}s...`, "info");
}

export function handleVideoFile(payload) {
    downloadVideoFromBase64(payload);
    showToast("Đã nhận được video từ Server!", "success");
}

export function handleWebcamFrame(payload) {
    const camImg = document.getElementById("webcam-feed");
    if(camImg) {
        camImg.src = "data:image/jpeg;base64," + payload;
        camImg.style.display = "block";
        document.getElementById("webcam-placeholder").style.display = "none";
        document.getElementById("cam-status").className = "badge bg-success";
        document.getElementById("cam-status").innerText = "LIVE";
    }
}