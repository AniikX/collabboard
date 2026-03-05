console.log('📋 ===== boardRoutes.js загружен =====');
console.log('📋 Зарегистрированные маршруты:');
console.log('📋 GET /');
console.log('📋 POST /');
console.log('📋 GET /:boardId');
console.log('📋 PATCH /:boardId');
console.log('📋 DELETE /:boardId');
console.log('📋 POST /:boardId/items');
console.log('📋 PATCH /:boardId/items/:itemId');
console.log('📋 DELETE /:boardId/items/:itemId');
console.log('📋 GET /:boardId/graph');
console.log('📋 POST /:boardId/nodes');
console.log('📋 PATCH /:boardId/nodes/:nodeId');
console.log('📋 DELETE /:boardId/nodes/:nodeId');
console.log('📋 POST /:boardId/edges');
console.log('📋 DELETE /:boardId/edges/:edgeId');
const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../simple-db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Требуется токен доступа'
        });
    }
    
    const token = authHeader.split(' ')[1];
    
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

// ========== МАРШРУТЫ ДЛЯ ДОСОК ==========
// ТЕСТОВЫЙ МАРШРУТ (временно)
router.get('/test', (req, res) => {
    console.log('🧪 ТЕСТОВЫЙ МАРШРУТ СРАБОТАЛ!');
    res.json({ message: 'ok', time: new Date() });
});
// 1. Получить все доски текущего пользователя
router.get('/', authenticateToken, (req, res) => {
    console.log('🔥🔥🔥 GET / ВЫЗВАН!');
    console.log('👤 userId:', req.user.userId);
    
    try {
        const userId = req.user.userId;
        const boards = db.getUserBoards(userId);
        
        console.log('📦 Найдено досок:', boards.length);
        console.log('📤 Отправка JSON ответа...');
        
        res.json({
            success: true,
            boards: boards.map(board => ({
                id: board.id,
                title: board.title,
                mode: board.mode,
                content: board.content,
                createdAt: board.createdAt,
                updatedAt: board.updatedAt
            }))
        });
        
        console.log('✅ Ответ отправлен');
    } catch (error) {
        console.error('💥 Ошибка в GET /:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 2. Создать новую доску
router.post('/', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const { title, mode } = req.body; // mode теперь передается
        
        const board = db.createBoard(userId, title || 'Новая доска', mode || 'plans');
        
        res.status(201).json({
            success: true,
            message: 'Доска создана',
            board: {
                id: board.id,
                title: board.title,
                mode: board.mode,
                content: board.content,
                createdAt: board.createdAt
            }
        });
    } catch (error) {
        console.error('Create board error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 3. Получить конкретную доску
router.get('/:boardId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }

        res.json({
            success: true,
            board: {
                id: board.id,
                title: board.title,
                mode: board.mode, // ← ДОБАВИЛИ ЭТО
                content: board.content,
                createdAt: board.createdAt,
                updatedAt: board.updatedAt
            }
        });
    } catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 4. Обновить доску (название)
router.patch('/:boardId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const { title } = req.body;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const updated = db.updateBoard(boardId, { title });
        
        res.json({
            success: true,
            message: 'Доска обновлена',
            board: {
                id: updated.id,
                title: updated.title
            }
        });
    } catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 5. Удалить доску
router.delete('/:boardId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        db.deleteBoard(boardId);
        
        res.json({
            success: true,
            message: 'Доска удалена'
        });
    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// ========== МАРШРУТЫ ДЛЯ ЭЛЕМЕНТОВ СПИСКА ==========

// 6. Добавить элемент в доску
router.post('/:boardId/items', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const { text } = req.body;
        
        if (!text || text.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Текст элемента не может быть пустым'
            });
        }
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const newItem = db.addBoardItem(boardId, text);
        
        res.status(201).json({
            success: true,
            message: 'Элемент добавлен',
            item: newItem
        });
    } catch (error) {
        console.error('Add item error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 7. Обновить элемент (выполнено/не выполнено)
router.patch('/:boardId/items/:itemId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const itemId = parseFloat(req.params.itemId);
        const { completed, text } = req.body;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const updates = {};
        if (completed !== undefined) updates.completed = completed;
        if (text !== undefined) updates.text = text;
        
        const updatedItem = db.updateBoardItem(boardId, itemId, updates);
        
        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: 'Элемент не найден'
            });
        }
        
        res.json({
            success: true,
            message: 'Элемент обновлен',
            item: updatedItem
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 8. Удалить элемент
router.delete('/:boardId/items/:itemId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const itemId = parseFloat(req.params.itemId);
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const deleted = db.deleteBoardItem(boardId, itemId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Элемент не найден'
            });
        }
        
        res.json({
            success: true,
            message: 'Элемент удален'
        });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 9. Получить данные графа
router.get('/:boardId/graph', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const graphData = db.getGraphData ? db.getGraphData(boardId) : { nodes: [], edges: [] };    

        res.json({
            success: true,
            graph: graphData
        });
    } catch (error) {
        console.error('Get graph error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});


// 10. Добавить вершину в граф
router.post('/:boardId/nodes', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const { label, type, content, x, y, color } = req.body;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        // Проверяем, что доска в режиме "memory"
        if (board.mode !== 'memory') {
            return res.status(400).json({
                success: false,
                message: 'Эта доска не в режиме "Воспоминания"'
            });
        }
        
        const newNode = db.addGraphNode(boardId, {
            label: label || 'Новая вершина',
            type: type || 'text',
            content: content || '',
            x: x || Math.random() * 500 + 50,
            y: y || Math.random() * 300 + 50,
            color: color || '#8a2be2'
        });
        
        res.status(201).json({
            success: true,
            message: 'Вершина создана',
            node: newNode
        });
    } catch (error) {
        console.error('Add node error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 11. Обновить вершину
router.patch('/:boardId/nodes/:nodeId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const nodeId = req.params.nodeId;
        const updates = req.body;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const updatedNode = db.updateGraphNode(boardId, nodeId, updates);
        
        if (!updatedNode) {
            return res.status(404).json({
                success: false,
                message: 'Вершина не найдена'
            });
        }
        
        res.json({
            success: true,
            message: 'Вершина обновлена',
            node: updatedNode
        });
    } catch (error) {
        console.error('Update node error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 12. Удалить вершину
router.delete('/:boardId/nodes/:nodeId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const nodeId = req.params.nodeId;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const deleted = db.deleteGraphNode(boardId, nodeId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Вершина не найдена'
            });
        }
        
        res.json({
            success: true,
            message: 'Вершина удалена'
        });
    } catch (error) {
        console.error('Delete node error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 13. Добавить связь (ребро)
router.post('/:boardId/edges', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const { source, target } = req.body;
        
        if (!source || !target) {
            return res.status(400).json({
                success: false,
                message: 'Не указаны source и target'
            });
        }
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const newEdge = db.addGraphEdge(boardId, source, target);
        
        if (!newEdge) {
            return res.status(400).json({
                success: false,
                message: 'Не удалось создать связь (возможно, вершины не существуют)'
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Связь создана',
            edge: newEdge
        });
    } catch (error) {
        console.error('Add edge error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// 14. Удалить связь
router.delete('/:boardId/edges/:edgeId', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const boardId = parseInt(req.params.boardId);
        const edgeId = req.params.edgeId;
        
        const board = db.getBoardById(boardId);
        
        if (!board) {
            return res.status(404).json({
                success: false,
                message: 'Доска не найдена'
            });
        }
        
        if (board.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к этой доске'
            });
        }
        
        const deleted = db.deleteGraphEdge(boardId, edgeId);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Связь не найдена'
            });
        }
        
        res.json({
            success: true,
            message: 'Связь удалена'
        });
    } catch (error) {
        console.error('Delete edge error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

module.exports = router;