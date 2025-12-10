import { connect, disconnectSocket } from '../core/socket.js';
import { routeMessage } from '../core/router.js';
import { showToast } from '../utils/ui.js';
import * as Terminal from './terminal.js';
import { getApps } from './process.js';

export function initiateConnection() {
    const ip = document.getElementById("server-ip").value.trim();
    const port = document.getElementById("server-port").value.trim();
    const pass = document.getElementById("auth-pass").value.trim();
    const errorLabel = document.getElementById("login-error");

    errorLabel.textContent = "Connecting...";

    try {
        connect(
            ip, port, pass,
            () => { /* On Open */ },
            routeMessage, // Delegate to Router
            handleDisconnect
        );
    } catch (e) {
        errorLabel.textContent = "Invalid IP Address!";
    }
}

export function handleAuthResult(payload) {
    if (payload === "OK") {
        const overlay = document.getElementById("login-overlay");
        overlay.style.opacity = "0";
        setTimeout(() => {
            overlay.style.display = "none";
            document.getElementById("main-interface").classList.remove("disabled-ui");
        }, 500);

        const badge = document.getElementById("connectionBadge");
        badge.className = "status-badge status-online";
        badge.innerHTML = '<i class="fas fa-circle"></i> Online';

        Terminal.logToTerminal("System Connected.", "system");
        showToast("Connected to Server!", "success");
        getApps(); // Auto get apps
    } else {
        document.getElementById("login-error").textContent = "Wrong Password!";
        showToast("Login Failed!", "error");
        disconnectSocket();
    }
}

export function handleDisconnect() {
    document.getElementById("main-interface").classList.add("disabled-ui");
    const overlay = document.getElementById("login-overlay");
    overlay.style.display = "flex";
    overlay.style.opacity = "1";
    document.getElementById("login-error").textContent = "Disconnected from Server.";
    
    const badge = document.getElementById("connectionBadge");
    badge.className = "status-badge status-offline";
    badge.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
}

export function disconnect() {
    disconnectSocket();
}