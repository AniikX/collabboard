const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../simple-db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

// ========== РЕГИСТРАЦИЯ ==========
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Валидация полей
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Все поля обязательны'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Имя пользователя должно быть не менее 3 символов'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть не менее 6 символов'
            });
        }

        // Проверка уникальности
        if (db.findUserByEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        if (db.findUserByUsername(username)) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким именем уже существует'
            });
        }

        // Создание пользователя
        const user = db.createUser({ username, email, password });

        // Генерация JWT-токена (срок действия 24 часа)
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

        console.log('✅ Пользователь создан:', user.username);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при регистрации'
        });
    }
});

// ========== ВХОД ==========
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Сравнение паролей (в демо-версии без хеширования)
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        user.lastLogin = new Date();

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

        console.log('✅ Успешный вход:', user.username);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе'
        });
    }
});

// Дублирующий маршрут для совместимости с Vercel
router.post('/real-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = db.findUserByEmail(email);
        if (!user || password !== user.password) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        user.lastLogin = new Date();

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

        console.log('✅ Успешный вход (real-login):', user.username);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе'
        });
    }
});

// ========== MIDDLEWARE ПРОВЕРКИ ТОКЕНА ==========
// Выполняется перед защищёнными маршрутами
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Требуется токен доступа'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Неверный или просроченный токен'
            });
        }
        req.user = user; // Данные пользователя из токена
        next();
    });
};

// ========== ПОЛУЧЕНИЕ ДАННЫХ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ==========
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const users = db.getAllUsers();
        const user = users.find(u => u.id === req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// ========== АДМИН-МАРШРУТЫ (ДЛЯ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ) ==========

// Получить всех пользователей
router.get('/admin/users', authenticateToken, async (req, res) => {
    try {
        const users = db.getAllUsers();
        
        res.json({
            success: true,
            users: users.map(user => ({
                _id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                isActive: user.isActive
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Удалить пользователя
router.delete('/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Запрещаем удалять самого себя
        if (userId === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Нельзя удалить свой собственный аккаунт'
            });
        }

        const success = db.deleteUser(userId);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            message: 'Пользователь успешно удален'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Деактивировать пользователя
router.patch('/admin/users/:id/deactivate', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        const user = db.deactivateUser(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            message: 'Пользователь деактивирован',
            user: {
                _id: user.id,
                username: user.username,
                email: user.email,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

module.exports = router;