import { showToast } from "../utils/ui.js";

let socket = null;

export function getSocket() { return socket; }

// Hàm này nhận callback 'handleMessage' để tránh circular dependency với Router
export function connect(ip, port, pass, onOpenCallback, onMessageCallback, onCloseCallback) {
    if (!ip || !port) {
        throw new Error("Missing IP or Port");
    }

    socket = new WebSocket(`ws://${ip}:${port}`);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
        const authPacket = JSON.stringify({ type: "AUTH", payload: pass });
        socket.send(authPacket);
        if(onOpenCallback) onOpenCallback();
    };

    socket.onmessage = (event) => {
        if(onMessageCallback) onMessageCallback(event);
    };

    socket.onclose = () => {
        if(onCloseCallback) onCloseCallback();
        socket = null;
    };

    socket.onerror = () => {
        // Handle error if needed
    };
}

export function sendCmd(command, param = "") {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ command: command, param: param.toString() }));
    } else {
        showToast("Không có kết nối Server!", "error");
    }
}

export function disconnectSocket() {
    if (socket) socket.close();
}