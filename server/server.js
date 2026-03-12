// server/server.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const http = require('http'); // <-- ВСТРОЕННЫЙ МОДУЛЬ Node.js для создания HTTP сервера
const { Server } = require('socket.io'); // <-- БИБЛИОТЕКА Socket.io для сервера
const cors = require('cors');
const path = require('path');

// --- Инициализация ---
const app = express();
const server = http.createServer(app); // <-- Создаем HTTP сервер на основе Express
const io = new Server(server, { // <-- Привязываем Socket.io к нашему HTTP серверу
    cors: {
        origin: '*', // В разработке можно разрешить все
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// --- Мидлвары Express (как и раньше) ---
app.use((req, res, next) => {
    console.log(`🌐 CORS: ${req.method} ${req.url} from ${req.headers.origin}`);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        console.log('🛬 Preflight запрос обработан');
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

console.log('🚀 CollabBoard server starting...');

// --- REST API Маршруты (Express) ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));

// --- Статические файлы (Express) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));
app.get('/boards', (req, res) => res.sendFile(path.join(__dirname, '../public/boards.html')));
app.get('/board', (req, res) => res.sendFile(path.join(__dirname, '../public/board.html')));
app.get('/memory-board', (req, res) => res.sendFile(path.join(__dirname, '../public/memory-board.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));


// --- WebSocket Логика (Socket.io) ---
io.on('connection', (socket) => {
    console.log('🔥 Новое WebSocket соединение:', socket.id);

    // Слушаем событие, когда клиент хочет присоединиться к комнате (доске)
    socket.on('join-board', (boardId) => {
        console.log(`📌 Клиент ${socket.id} присоединяется к доске: ${boardId}`);
        socket.join(`board-${boardId}`); // Создаем или входим в комнату
    });

    // Слушаем событие, когда клиент покидает комнату
    socket.on('leave-board', (boardId) => {
        console.log(`📌 Клиент ${socket.id} покидает доску: ${boardId}`);
        socket.leave(`board-${boardId}`);
    });

    // Слушаем события от клиента об изменениях на доске
    socket.on('board-update', (data) => {
        console.log(`♻️ Получено обновление для доски ${data.boardId} от ${socket.id}`);
        console.log('📦 Данные обновления (оригинал):', data);

        // Явно забираем все поля
        const { boardId, type: eventType, ...rest } = data;

        console.log('📦 Событие:', eventType);
        console.log('📦 Остальное:', rest);

        // Отправляем дальше, сохраняя тип события
        socket.to(`board-${boardId}`).emit('board-changed', {
            type: eventType,
            ...rest
        });
    });

    // Обработчик отключения клиента
    socket.on('disconnect', () => {
        console.log('❌ Соединение закрыто:', socket.id);
    });
});


// --- Запуск сервера (используем server.listen вместо app.listen) ---
server.listen(PORT, () => {
    console.log(`🚀 CollabBoard server запущен на порту ${PORT}!`);
    console.log(`📡 Локальный: http://localhost:${PORT}`);
    console.log(`📱 Для телефона: http://${getIPAddress()}:${PORT}`);
});

function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Не забываем добавить обработку закрытия сервера (Graceful Shutdown)
process.on('SIGINT', () => {
    console.log('👋 Сервер останавливается...');
    io.close(() => {
        console.log('✅ Все сокеты закрыты.');
        process.exit(0);
    });
});