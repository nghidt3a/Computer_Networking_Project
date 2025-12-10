import { sendCmd } from '../core/socket.js';

export function getProcesses() {
    sendCmd("GET_PROCESS");
}
export function getApps() {
    sendCmd("GET_APPS");
}

export function renderProcessTable(dataList) {
    const tbody = document.querySelector("#procTable tbody");
    tbody.innerHTML = "";
    dataList.forEach((item) => {
        const tr = document.createElement("tr");
        const displayName = item.title || item.name;
        tr.innerHTML = `
            <td><span class="badge bg-secondary">${item.id}</span></td>
            <td class="fw-bold">${displayName}</td>
            <td>${item.memory || "N/A"}</td>
            <td>
                <button class="btn btn-danger btn-sm kill-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Kill
                </button>
            </td>
        `;
        // Gán sự kiện click cho nút Kill
        tr.querySelector('.kill-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if(confirm(`Kill ID ${id}?`)) sendCmd('KILL', id);
        });
        tbody.appendChild(tr);
    });
}