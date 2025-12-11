export function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
  
    const toast = document.createElement("div");
    toast.className = `toast-msg ${type}`;
    let icon = type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle";
    let color = type === "success" ? "text-success" : type === "error" ? "text-danger" : "text-primary";
  
    toast.innerHTML = `<i class="fas fa-${icon} ${color}"></i> <span>${message}</span>`;
    container.appendChild(toast);
  
    setTimeout(() => {
      toast.style.animation = "fadeOut 0.5s ease-out forwards";
      setTimeout(() => toast.remove(), 500);
    }, 3000);
}
  
export function switchTab(tabName, element) {
    document.querySelectorAll(".list-group-item").forEach((el) => el.classList.remove("active"));
    element.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
    document.getElementById(`tab-${tabName}`).classList.add("active");
  
    const titles = {
      dashboard: "Overview",
      monitor: "Screen Monitor",
      webcam: "Webcam Control",
      processes: "Task Manager",
      terminal: "Terminal & Logs",
    };
    document.getElementById("pageTitle").innerText = titles[tabName] || "RCS";
}
  
export function viewFullImage(imgElement) {
    const w = window.open("");
    w.document.write(`<img src="${imgElement.src}" style="width:100%">`);
}