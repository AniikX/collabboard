import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vercel-demo-secret';

export default function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(200).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: 'Неверный токен'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.userId,
          username: user.username
        }
      });
    });

  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
}