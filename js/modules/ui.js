/**
 * Module quản lý Giao diện người dùng (UI)
 * Nhiệm vụ: Ẩn hiện các Tab, Render bảng, In log ra terminal.
 */
export class UIManager {
    constructor() {
        // Cache DOM Elements để tối ưu hiệu năng
        this.els = {
            overlayLogin: document.getElementById('overlay-login'),
            overlayReconnect: document.getElementById('overlay-reconnect'),
            appWrapper: document.getElementById('app-wrapper'),
            loginMsg: document.getElementById('login-msg'),
            processTable: document.getElementById('process-table-body'),
            terminal: document.getElementById('terminal-output'),
            toastArea: document.getElementById('toast-area'),
            retryCount: document.getElementById('retry-count'),
            inpIp: document.getElementById('inp-ip'),
            inpPort: document.getElementById('inp-port'),
            inpPass: document.getElementById('inp-pass'),
            btnToggleStream: document.getElementById('btn-toggle-stream')
        };
    }

    // Lấy thông tin đăng nhập từ form
    getConnectCredentials() {
        return {
            ip: this.els.inpIp.value.trim(),
            port: this.els.inpPort.value.trim(),
            password: this.els.inpPass.value.trim()
        };
    }

    setLoginMessage(msg) {
        this.els.loginMsg.textContent = msg;
    }

    // Chuyển đổi trạng thái giao diện khi Login/Logout
    toggleAppState(isLoggedIn) {
        if (isLoggedIn) {
            this.els.overlayLogin.classList.remove('active');
            this.els.overlayReconnect.style.display = 'none';
            this.els.appWrapper.classList.remove('opacity-25', 'disabled-events');
        } else {
            this.els.appWrapper.classList.add('opacity-25', 'disabled-events');
        }
    }

    showReconnectOverlay(attempt, max) {
        this.els.overlayReconnect.style.display = 'flex';
        this.els.retryCount.textContent = `${attempt}/${max}`;
    }

    showLoginOverlay() {
        this.els.overlayLogin.classList.add('active');
        this.els.overlayReconnect.style.display = 'none';
    }

    // Xử lý chuyển Tab
    switchTab(tabId) {
        // Active Nav Link
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.tab === tabId);
        });
        // Show View
        document.querySelectorAll('.view-section').forEach(v => {
            v.style.display = (v.id === `view-${tabId}`) ? 'block' : 'none';
        });
    }

    // Cập nhật nút Stream
    updateStreamButton(isStreaming) {
        const btn = this.els.btnToggleStream;
        if (isStreaming) {
            btn.innerHTML = '<i class="fas fa-stop me-2"></i>Stop Stream';
            btn.className = 'btn btn-danger';
        } else {
            btn.innerHTML = '<i class="fas fa-video me-2"></i>Start Stream';
            btn.className = 'btn btn-success';
        }
    }

    // Render bảng tiến trình
    renderProcessTable(processes, onKillClick) {
        this.els.processTable.innerHTML = '';
        if (!Array.isArray(processes)) return;

        processes.forEach(proc => {
            const tr = document.createElement('tr');
            
            // Sử dụng template literals an toàn
            tr.innerHTML = `
                <td>${proc.id || proc.pid}</td>
                <td class="fw-bold text-primary">${proc.title || proc.name}</td>
                <td>${proc.memory || 'N/A'}</td>
                <td class="text-end"></td>
            `;
            
            // Tạo nút Kill bằng JS để dễ gắn sự kiện
            const btnKill = document.createElement('button');
            btnKill.className = 'btn btn-sm btn-outline-danger';
            btnKill.innerHTML = '<i class="fas fa-times"></i>';
            btnKill.onclick = () => onKillClick(proc);
            
            tr.lastElementChild.appendChild(btnKill);
            this.els.processTable.appendChild(tr);
        });
        this.showToast(`Đã cập nhật ${processes.length} tiến trình`, 'info');
    }

    // Ghi log ra màn hình Console giả lập
    logToTerminal(text, type = 'info') {
        const time = new Date().toLocaleTimeString();
        let colorClass = 'text-light';
        
        if (type === 'success') colorClass = 'text-success';
        if (type === 'system') colorClass = 'text-primary';
        if (type === 'keylog') colorClass = 'text-warning';

        // Xử lý riêng cho Keylogger (in ngang hàng)
        if (type === 'keylog') {
            const cleanText = text.replace('[Keylogger]', '').trim();
            const lastChild = this.els.terminal.lastElementChild;
            
            // Nếu dòng cuối đang là dòng keylog thì nối thêm chữ vào
            if (lastChild && lastChild.classList.contains('keylog-line')) {
                const span = document.createElement('span');
                span.className = colorClass;
                span.textContent = ` ${cleanText} `;
                lastChild.appendChild(span);
            } else {
                const div = document.createElement('div');
                div.className = 'keylog-line border-bottom border-dark pb-1 mb-1';
                div.innerHTML = `<span class="text-muted">[${time}] KEYLOG:</span> <span class="${colorClass}">${cleanText}</span>`;
                this.els.terminal.appendChild(div);
            }
        } else {
            const div = document.createElement('div');
            div.className = `log-line ${colorClass}`;
            div.innerHTML = `<span class="text-muted">[${time}]</span> ${text}`;
            this.els.terminal.appendChild(div);
        }
        
        // Auto scroll xuống cuối
        this.els.terminal.scrollTop = this.els.terminal.scrollHeight;
    }

    clearLog() {
        this.els.terminal.innerHTML = '';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 show`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        this.els.toastArea.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}