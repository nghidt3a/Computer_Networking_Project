import { initiateConnection, disconnect } from './controllers/auth.js';
import { sendCmd } from './core/socket.js';
import { switchTab, viewFullImage } from './utils/ui.js';
import { downloadLog } from './utils/file.js';
import { startApp, openWeb, browseApps, closeAppLibrary, filterApps } from './controllers/dashboard.js';
import { startRecordWebcam } from './controllers/webcam.js';
import { getApps, getProcesses } from './controllers/process.js';

// Gán các hàm vào window object để file HTML có thể gọi qua onclick="..."
window.initiateConnection = initiateConnection;
window.disconnect = disconnect;
window.sendCommand = sendCmd;
window.switchTab = switchTab;
window.viewFullImage = viewFullImage;
window.downloadLog = downloadLog;
window.startApp = startApp;
window.openWeb = openWeb;
window.browseApps = browseApps;
window.closeAppLibrary = closeAppLibrary;
window.filterApps = filterApps;
window.startRecordWebcam = startRecordWebcam;
window.getApps = getApps;
window.getProcesses = getProcesses;

console.log("RCS Client Modules Loaded Successfully.");