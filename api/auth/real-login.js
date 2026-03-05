// api/auth/real-login.js
const jwt = require('jsonwebtoken');

// База пользователей (в демо-версии)
let users = [];

const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

export default async function handler(req, res) {
    console.log('📋 API real-login.js вызван:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const { email, password } = req.body;
        console.log('🔐 Вход:', email);

        const user = users.find(u => u.email === email);
        
        if (!user || user.password !== password) {
            return res.status(200).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Вход выполнен:', user.username);

        res.status(200).json({
            success: true,
            message: 'Вход выполнен успешно',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
}