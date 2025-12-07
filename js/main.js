import { CONFIG, COMMANDS } from './config.js';
import { SocketService } from './modules/socket.js';
import { UIManager } from './modules/ui.js';
import { StreamManager } from './modules/stream.js';

class AppController {
    constructor() {
        // Khởi tạo các module
        this.ui = new UIManager();
        this.stream = new StreamManager('live-image', 'stream-loading', 'live-badge');
        
        // Khởi tạo Socket và truyền callbacks
        this.socket = new SocketService({
            onOpen: () => this.handleSocketOpen(),
            onMessage: (e) => this.handleSocketMessage(e),
            onClose: (forced, attempts) => this.handleSocketClose(forced, attempts),
            onError: (e) => this.ui.setLoginMessage('Lỗi kết nối!')
        });

        // Config hiện tại
        this.currentConfig = {
            ip: CONFIG.DEFAULT_IP,
            port: CONFIG.DEFAULT_PORT,
            password: ''
        };

        this.initEventListeners();
        console.log('[App] Initialized with ES Modules');
    }

    initEventListeners() {
        // 1. Nút kết nối
        document.getElementById('btn-connect').addEventListener('click', () => {
            const creds = this.ui.getConnectCredentials();
            if (!creds.ip || !creds.port) return this.ui.showToast('Thiếu thông tin IP/Port', 'warning');
            
            this.currentConfig = creds;
            this.ui.setLoginMessage('Đang kết nối...');
            this.socket.connect(creds.ip, creds.port);
        });

        // 2. Nút Ngắt kết nối
        document.getElementById('btn-disconnect').addEventListener('click', () => {
            this.socket.disconnect();
        });

        // 3. Xử lý Reconnect overlay (Nút tải lại)
        const btnRetry = document.querySelector('#overlay-reconnect button');
        if(btnRetry) btnRetry.addEventListener('click', () => location.reload());

        // 4. Chuyển Tab
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.ui.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // 5. Các nút chức năng (Shutdown, Restart, Keylog...)
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd; // Lấy command từ data-cmd="SHUTDOWN"
                if (COMMANDS[cmd]) {
                    this.socket.send(COMMANDS[cmd]);
                } else {
                    // Trường hợp cmd trực tiếp (vd: STOP_KEYLOG)
                    this.socket.send(cmd);
                }
            });
        });

        // 6. Chức năng Stream
        document.getElementById('btn-toggle-stream').addEventListener('click', () => {
            const isStreaming = !this.stream.isStreaming;
            this.stream.setStreamState(isStreaming);
            this.ui.updateStreamButton(isStreaming);
            
            const cmd = isStreaming ? COMMANDS.START_STREAM : COMMANDS.STOP_STREAM;
            this.socket.send(cmd);
        });

        document.getElementById('btn-capture').addEventListener('click', () => {
            this.socket.send(COMMANDS.CAPTURE_SCREEN);
        });

        // 7. Process & App
        document.getElementById('btn-quick-run').addEventListener('click', () => {
            const appName = document.getElementById('quick-app').value;
            if (appName) this.socket.send(COMMANDS.START_APP, appName);
        });

        // 8. Log utilities
        document.getElementById('btn-clear-log').addEventListener('click', () => this.ui.clearLog());
    }

    // --- SOCKET HANDLERS ---

    handleSocketOpen() {
        this.ui.setLoginMessage('Đang xác thực...');
        // Gửi gói tin xác thực đặc biệt
        this.socket.sendAuth(this.currentConfig.password);
    }

    handleSocketMessage(event) {
        // 1. Nếu là Binary -> Giao cho StreamManager
        if (event.data instanceof ArrayBuffer) {
            this.stream.renderFrame(event.data);
            return;
        }

        // 2. Nếu là Text JSON -> Xử lý logic
        try {
            const msg = JSON.parse(event.data);
            this.dispatchMessage(msg);
        } catch (e) {
            console.error('[App] JSON Parse Error:', e);
        }
    }

    handleSocketClose(forced, attempts) {
        if (forced) {
            // Người dùng chủ động ngắt
            this.ui.toggleAppState(false);
            this.ui.showLoginOverlay();
            this.stream.setStreamState(false);
            this.ui.updateStreamButton(false);
            this.ui.setLoginMessage('Đã ngắt kết nối.');
        } else {
            // Mất mạng / Server sập -> Thử reconnect
            if (attempts <= CONFIG.MAX_RECONNECTS) {
                this.ui.showReconnectOverlay(attempts, CONFIG.MAX_RECONNECTS);
                setTimeout(() => {
                    this.socket.connect(this.currentConfig.ip, this.currentConfig.port);
                }, CONFIG.RECONNECT_DELAY);
            } else {
                this.ui.showToast('Không thể kết nối lại Server', 'danger');
                this.ui.toggleAppState(false);
                this.ui.showLoginOverlay();
            }
        }
    }

    // --- DISPATCHER (Phân phối tin nhắn từ Server) ---
    dispatchMessage(msg) {
        switch (msg.type) {
            case 'AUTH_RESULT':
                if (msg.payload === 'OK') {
                    this.ui.toggleAppState(true); // Vào màn hình chính
                    this.ui.showToast('Kết nối thành công!', 'success');
                    this.ui.logToTerminal('System Connected.', 'system');
                    this.socket.send(COMMANDS.GET_PROCESS); // Tự động lấy process
                } else {
                    this.ui.setLoginMessage('Sai mật khẩu!');
                    this.socket.disconnect(); // Ngắt ngay để user nhập lại
                }
                break;

            case 'LOG':
                const isKeylog = msg.payload.includes('[Keylogger]');
                this.ui.logToTerminal(msg.payload, isKeylog ? 'keylog' : 'info');
                break;

            case 'PROCESS_LIST':
            case 'APP_LIST':
                this.ui.renderProcessTable(msg.payload, (proc) => {
                    // Callback khi bấm nút Kill
                    if(confirm(`Tắt tiến trình ${proc.name || proc.title}?`)) {
                        this.socket.send(COMMANDS.KILL_PROCESS, proc.id || proc.pid);
                    }
                });
                break;
            
            case 'SCREEN_CAPTURE':
                this.stream.renderBase64(msg.payload);
                this.ui.showToast('Đã nhận ảnh HD', 'success');
                break;

            default:
                console.warn('[App] Unknown message type:', msg.type);
        }
    }
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});