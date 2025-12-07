/**
 * Module xử lý hiển thị hình ảnh (Live Stream & Screenshot)
 */
export class StreamManager {
    constructor(imgElementId, loadingElementId, badgeElementId) {
        this.imgElement = document.getElementById(imgElementId);
        this.loadingElement = document.getElementById(loadingElementId);
        this.badgeElement = document.getElementById(badgeElementId);
        this.currentBlobUrl = null;
        this.isStreaming = false;
    }

    // Xử lý dữ liệu nhị phân (ArrayBuffer) nhận được từ Socket
    renderFrame(arrayBuffer) {
        if (!this.isStreaming && !this.imgElement.src.startsWith('data:')) return; 

        // Giải phóng bộ nhớ của frame cũ (QUAN TRỌNG để tránh tràn RAM)
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
        }

        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        this.currentBlobUrl = URL.createObjectURL(blob);
        
        this.imgElement.src = this.currentBlobUrl;
        this._showImage(true);
    }

    // Xử lý ảnh chụp màn hình HD (Base64)
    renderBase64(base64Data) {
        this.imgElement.src = "data:image/jpeg;base64," + base64Data;
        this._showImage(true);
    }

    setStreamState(active) {
        this.isStreaming = active;
        if (this.badgeElement) {
            this.badgeElement.style.display = active ? 'block' : 'none';
        }
        if (!active) {
            this._showImage(false); // Reset về trạng thái loading
        }
    }

    _showImage(visible) {
        this.imgElement.style.display = visible ? 'block' : 'none';
        this.loadingElement.style.display = visible ? 'none' : 'block';
    }
}