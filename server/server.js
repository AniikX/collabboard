require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
// В САМОМ НАЧАЛЕ, после всех require
console.log('🚀 ===== ЗАПУСК СЕРВЕРА =====');
console.log('📁 Текущая директория:', __dirname);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 PORT:', process.env.PORT);

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
    console.log(`🌐 CORS: ${req.method} ${req.url} from ${req.headers.origin}`);
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes')); // ← НОВОЕ!

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 CollabBoard server запущен!`);
    console.log(`📡 Локальный: http://localhost:${PORT}`);
    console.log(`📱 Для телефона: http://${getIPAddress()}:${PORT}`);
    console.log(`🖥️  Открой в браузере: http://localhost:${PORT}`);
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