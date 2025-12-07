/**
 * Cấu hình chung cho toàn bộ ứng dụng
 */
export const CONFIG = {
    DEFAULT_IP: '127.0.0.1',
    DEFAULT_PORT: '8181',
    MAX_RECONNECTS: 5,
    RECONNECT_DELAY: 3000 // ms
};

// Định nghĩa các lệnh giao tiếp với Server để tránh gõ sai chuỗi string (Magic Strings)
export const COMMANDS = {
    SHUTDOWN: 'SHUTDOWN',
    RESTART: 'RESTART',
    GET_PROCESS: 'GET_PROCESS',
    KILL_PROCESS: 'KILL',
    START_APP: 'START_APP',
    START_KEYLOG: 'START_KEYLOG',
    STOP_KEYLOG: 'STOP_KEYLOG',
    START_STREAM: 'START_STREAM',
    STOP_STREAM: 'STOP_STREAM',
    CAPTURE_SCREEN: 'CAPTURE_SCREEN'
};