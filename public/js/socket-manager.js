// public/js/socket-manager.js

class SocketManager {
    constructor(boardId, token) {
        this.boardId = boardId;
        this.token = token;
        this.socket = null;
        this.isConnected = false;
        this.updateCallbacks = []; // Массив функций, которые вызовутся при получении обновления
        console.log(`🔌 SocketManager создан для доски ${boardId}`);
    }

    // Подключение к серверу
    connect() {
        // Определяем адрес сервера (для локальной разработки и деплоя)
        const serverUrl = window.location.origin; // Работает и на localhost, и на Vercel/Codespaces
        console.log(`🔌 Подключаемся к серверу: ${serverUrl}`);

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'], // Пытаемся использовать WebSocket, если не выходит - long-polling
            query: {
                token: this.token // Передаем токен при подключении (можно будет проверять на сервере)
            }
        });

        // Слушаем событие успешного подключения
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Socket.io подключен! ID:', this.socket.id);

            // Как только подключились, присоединяемся к комнате доски
            this.joinBoard();
        });

        // Слушаем событие, когда кто-то другой изменил доску
        this.socket.on('board-changed', (updateData) => {
            console.log('♻️ Получено обновление от сервера:', updateData);
            // Вызываем все сохраненные функции обратного вызова
            this.updateCallbacks.forEach(cb => cb(updateData));
        });

        // Слушаем ошибки
        this.socket.on('connect_error', (error) => {
            console.error('❌ Ошибка подключения Socket.io:', error);
            this.isConnected = false;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Отключен от сервера. Причина:', reason);
            this.isConnected = false;
        });
    }

    // Присоединиться к комнате доски
    joinBoard() {
        if (this.socket && this.isConnected) {
            console.log(`📌 Отправляем запрос на присоединение к доске: ${this.boardId}`);
            this.socket.emit('join-board', this.boardId);
        } else {
            console.warn('⚠️ Не удалось присоединиться: сокет не подключен');
        }
    }

    // Покинуть комнату доски
    leaveBoard() {
        if (this.socket && this.isConnected) {
            console.log(`📌 Отправляем запрос на выход из доски: ${this.boardId}`);
            this.socket.emit('leave-board', this.boardId);
        }
    }

    // Отправить обновление на сервер (чтобы он разослал всем остальным)
    sendUpdate(updateData) {
        if (this.socket && this.isConnected) {
            console.log('📤 SocketManager отправляет:', updateData);
            // Добавляем boardId к данным, чтобы сервер знал, в какую комнату отправить
            const dataToSend = {
                boardId: this.boardId,
                ...updateData
            };
            console.log('📤 SocketManager отправляет (итог):', dataToSend);
            
            this.socket.emit('board-update', dataToSend);
        } else {
            console.warn('⚠️ Не удалось отправить обновление: сокет не подключен');
            // Здесь можно добавить логику повторной отправки или уведомить пользователя
        }
    }

    // Подписаться на обновления (добавить функцию, которая будет вызываться при изменениях)
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    // Отписаться от обновлений (убрать функцию из списка)
    offUpdate(callbackToRemove) {
        this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callbackToRemove);
    }

    // Закрыть соединение (например, при выходе со страницы)
    disconnect() {
        if (this.socket) {
            this.leaveBoard(); // Покидаем комнату перед отключением
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            console.log('🔌 Соединение Socket.io закрыто принудительно');
        }
    }
}