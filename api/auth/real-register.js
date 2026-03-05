// api/auth/real-register.js
const jwt = require('jsonwebtoken');

let users = [];
let nextId = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

export default async function handler(req, res) {
    console.log('📋 API real-register.js вызван:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Только POST разрешён
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const { username, email, password } = req.body;
        console.log('📝 Регистрация:', { username, email });

        // Проверка существования
        if (users.find(u => u.email === email)) {
            return res.status(200).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        if (users.find(u => u.username === username)) {
            return res.status(200).json({
                success: false,
                message: 'Пользователь с таким именем уже существует'
            });
        }

        // Создаём пользователя
        const newUser = {
            id: nextId++,
            username,
            email,
            password, // В демо-версии без хеширования
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // JWT токен
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Пользователь создан:', newUser.id);

        res.status(200).json({
            success: true,
            message: 'Регистрация успешна',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
}