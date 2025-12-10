import { sendCmd } from '../core/socket.js';
import * as Terminal from './terminal.js';
import { showToast } from '../utils/ui.js';

let allInstalledApps = [];

export function startApp() {
    const input = document.getElementById("quickAppInput");
    const appName = input.value.trim();
    if (appName) {
        sendCmd("START_APP", appName);
        Terminal.logToTerminal(`Command: Start ${appName}`);
        input.value = "";
    } else {
        showToast("Vui lòng nhập tên ứng dụng!", "error");
    }
}

export function openWeb(url) {
    sendCmd("START_APP", url);
    Terminal.logToTerminal(`Command: Open Browser > ${url}`);
    showToast(`Opening ${url}...`, "info");
}

export function browseApps() {
    document.getElementById("app-library-modal").classList.remove("hidden");
    sendCmd("GET_INSTALLED");
}

export function closeAppLibrary() {
    document.getElementById("app-library-modal").classList.add("hidden");
}

export function handleInstalledList(payload) {
    allInstalledApps = payload;
    renderAppGrid(allInstalledApps);
}

export function filterApps() {
    const keyword = document.getElementById("appSearch").value.toLowerCase();
    const filtered = allInstalledApps.filter((app) =>
        app.name.toLowerCase().includes(keyword)
    );
    renderAppGrid(filtered);
}

function renderAppGrid(appList) {
    const container = document.getElementById("app-grid");
    container.innerHTML = "";
    if (!appList || appList.length === 0) {
        container.innerHTML = '<p class="text-center w-100">No apps found.</p>';
        return;
    }
    appList.forEach((app) => {
        const div = document.createElement("div");
        div.className = "app-item-btn";
        div.onclick = () => {
            sendCmd("START_APP", app.path);
            closeAppLibrary();
            showToast(`Launching ${app.name}...`, "success");
        };
        div.innerHTML = `<i class="fas fa-cube app-item-icon"></i><span class="app-item-name">${app.name}</span>`;
        container.appendChild(div);
    });
}