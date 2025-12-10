import { sendCmd } from '../core/socket.js';
import { downloadVideoFromBase64, showToast } from '../utils/file.js';

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