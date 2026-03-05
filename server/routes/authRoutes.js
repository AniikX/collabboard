const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../simple-db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

// Register new user
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Регистрация запроса:', req.body);
        console.log('📧 Email:', req.body.email);
        console.log('👤 Username:', req.body.username);
        console.log('Registration attempt:', req.body);
        
        const { username, email, password } = req.body;

        // Validate input
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

        // Check if user already exists
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

        // Create user
        const user = db.createUser({
            username,
            email,
            password
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        console.log('✅ Пользователь создан:', {
            id: user.id,
            username: user.username,
            email: user.email,
            time: new Date().toLocaleTimeString()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при регистрации'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Попытка входа:', req.body.email);
        const { email, password } = req.body;

        // Find user
        const user = db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Check password
        const isMatch = password === user.password;
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Update last login
        user.lastLogin = new Date();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        console.log('✅ Успешный вход:', {
            user: user.username,
            email: user.email,
            time: new Date().toLocaleTimeString()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе'
        });
    }
});
router.post('/real-login', async (req, res) => {
    try {
        console.log('🔐 Попытка входа:', req.body.email);
        const { email, password } = req.body;

        // Find user
        const user = db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Check password
        const isMatch = password === user.password;
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        // Update last login
        user.lastLogin = new Date();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        console.log('✅ Успешный вход:', {
            user: user.username,
            email: user.email,
            time: new Date().toLocaleTimeString()
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при входе'
        });
    }
});

// Verify token middleware

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
        req.user = user;
        next();
    });
};

// Get current user
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

// ADMIN ROUTES

// Get all users

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

// Delete user
router.delete('/admin/users/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Prevent self-deletion
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

// Deactivate user
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