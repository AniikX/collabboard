require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

console.log('🚀 CollabBoard server starting...');

// API маршруты
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));

// Статические страницы
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../public/dashboard.html')));
app.get('/boards', (req, res) => res.sendFile(path.join(__dirname, '../public/boards.html')));
app.get('/board', (req, res) => res.sendFile(path.join(__dirname, '../public/board.html')));
app.get('/memory-board', (req, res) => res.sendFile(path.join(__dirname, '../public/memory-board.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));

// WebSocket логика
io.on('connection', (socket) => {
    console.log('🔥 Новое WebSocket соединение:', socket.id);

    socket.on('join-board', (boardId) => {
        socket.join(`board-${boardId}`);
    });

    socket.on('leave-board', (boardId) => {
        socket.leave(`board-${boardId}`);
    });

    socket.on('board-update', (data) => {
        const { boardId, type: eventType, ...rest } = data;
        socket.to(`board-${boardId}`).emit('board-changed', { type: eventType, ...rest });
    });

    socket.on('disconnect', () => {
        console.log('❌ Соединение закрыто:', socket.id);
    });
});

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

process.on('SIGINT', () => {
    console.log('👋 Сервер останавливается...');
    io.close(() => {
        process.exit(0);
    });
});