class SocketManager {
    constructor(boardId, token) {
        this.boardId = boardId;
        this.token = token;
        this.socket = null;
        this.isConnected = false;
        this.updateCallbacks = [];
    }

    connect() {
        const serverUrl = window.location.origin;
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            query: { token: this.token }
        });

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.joinBoard();
        });

        this.socket.on('board-changed', (updateData) => {
            this.updateCallbacks.forEach(cb => cb(updateData));
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Ошибка подключения Socket.io:', error);
            this.isConnected = false;
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
        });
    }

    joinBoard() {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-board', this.boardId);
        }
    }

    leaveBoard() {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave-board', this.boardId);
        }
    }

    sendUpdate(updateData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('board-update', { boardId: this.boardId, ...updateData });
        }
    }

    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    offUpdate(callbackToRemove) {
        this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callbackToRemove);
    }

    disconnect() {
        if (this.socket) {
            this.leaveBoard();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}