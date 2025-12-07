import { CONFIG } from '../config.js';

/**
 * Module quản lý kết nối WebSocket
 */
export class SocketService {
    constructor(callbacks) {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.forcedDisconnect = false; // Cờ báo hiệu người dùng chủ động ngắt
        
        // Callbacks để gọi ngược về Main khi có sự kiện
        this.onOpen = callbacks.onOpen;
        this.onMessage = callbacks.onMessage;
        this.onClose = callbacks.onClose;
        this.onError = callbacks.onError;
    }

    connect(ip, port) {
        if (this.socket) this.socket.close();
        
        try {
            console.log(`[Socket] Connecting to ws://${ip}:${port}`);
            this.socket = new WebSocket(`ws://${ip}:${port}`);
            this.socket.binaryType = 'arraybuffer'; // Bắt buộc để nhận ảnh stream mượt

            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
                this.forcedDisconnect = false;
                if (this.onOpen) this.onOpen();
            };

            this.socket.onmessage = (event) => {
                if (this.onMessage) this.onMessage(event);
            };

            this.socket.onclose = () => {
                this.handleClose();
            };

            this.socket.onerror = (error) => {
                console.error('[Socket] Error:', error);
                if (this.onError) this.onError(error);
            };

        } catch (err) {
            console.error('[Socket] Init Error:', err);
            this.handleClose();
        }
    }

    // Gửi lệnh dạng JSON
    send(command, param = '') {
        if (this.isConnected()) {
            const packet = JSON.stringify({ command, param: param.toString() });
            this.socket.send(packet);
        }
    }

    // Gửi gói tin Auth (Logic đặc biệt của Server này)
    sendAuth(password) {
        if (this.isConnected()) {
            const authData = {
                type: "AUTH",
                payload: password,
                command: "",
                param: ""
            };
            this.socket.send(JSON.stringify(authData));
        }
    }

    disconnect() {
        this.forcedDisconnect = true;
        if (this.socket) this.socket.close();
    }

    handleClose() {
        if (this.onClose) this.onClose(this.forcedDisconnect, this.reconnectAttempts);
        
        // Logic tự động kết nối lại
        if (!this.forcedDisconnect && this.reconnectAttempts < CONFIG.MAX_RECONNECTS) {
            this.reconnectAttempts++;
            // Gọi callback reconnect để Main biết mà cập nhật UI
            if (this.onClose) this.onClose(false, this.reconnectAttempts); 
        }
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}