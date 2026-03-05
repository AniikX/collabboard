// api/boards.js
const jwt = require('jsonwebtoken');

let boards = [];
let nextBoardId = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'collabboard-secret-key-2024';

// Middleware для проверки токена
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

export default async function handler(req, res) {
    console.log('📋 API boards.js вызван:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // ТЕСТОВЫЙ МАРШРУТ
    if (req.url.includes('/test')) {
        return res.status(200).json({ 
            success: true, 
            message: 'API работает!',
            time: new Date().toISOString()
        });
    }
    
    try {
        // Разбираем URL
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathParts = url.pathname.split('/').filter(p => p);
        
        console.log('📌 Path parts:', pathParts);
        
        // ========== ОСНОВНЫЕ МАРШРУТЫ ==========
        
        // GET /api/boards — получить все доски
        if (req.method === 'GET' && pathParts.length === 0) {
            return new Promise((resolve) => {
                authenticateToken(req, res, () => {
                    const userBoards = boards.filter(b => b.userId === req.user.userId);
                    res.json({
                        success: true,
                        boards: userBoards.map(board => ({
                            id: board.id,
                            title: board.title,
                            mode: board.mode || 'plans',
                            content: board.content || (board.mode === 'plans' ? [] : { nodes: [], edges: [] }),
                            createdAt: board.createdAt,
                            updatedAt: board.updatedAt
                        }))
                    });
                    resolve();
                });
            });
        }
        
        // POST /api/boards — создать доску
        if (req.method === 'POST' && pathParts.length === 0) {
            return new Promise((resolve) => {
                authenticateToken(req, res, () => {
                    const { title, mode = 'plans' } = req.body;
                    
                    const newBoard = {
                        id: nextBoardId++,
                        userId: req.user.userId,
                        title: title || 'Новая доска',
                        mode: mode,
                        content: mode === 'plans' ? [] : { nodes: [], edges: [] },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    
                    boards.push(newBoard);
                    
                    res.json({
                        success: true,
                        message: 'Доска создана',
                        board: {
                            id: newBoard.id,
                            title: newBoard.title,
                            mode: newBoard.mode,
                            content: newBoard.content,
                            createdAt: newBoard.createdAt
                        }
                    });
                    resolve();
                });
            });
        }
        
        // ========== МАРШРУТЫ ДЛЯ КОНКРЕТНОЙ ДОСКИ ==========
        if (pathParts.length >= 1 && !isNaN(pathParts[0])) {
            const boardId = parseInt(pathParts[0]);
            const subPath = pathParts.slice(1).join('/');
            
            // GET /api/boards/:boardId — получить конкретную доску
            if (req.method === 'GET' && pathParts.length === 1) {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        res.json({
                            success: true,
                            board: {
                                id: board.id,
                                title: board.title,
                                mode: board.mode,
                                content: board.content,
                                createdAt: board.createdAt,
                                updatedAt: board.updatedAt
                            }
                        });
                        resolve();
                    });
                });
            }
            
            // PATCH /api/boards/:boardId — обновить название доски
            if (req.method === 'PATCH' && pathParts.length === 1) {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const { title } = req.body;
                        if (title) board.title = title;
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Доска обновлена',
                            board: { id: board.id, title: board.title }
                        });
                        resolve();
                    });
                });
            }
            
            // DELETE /api/boards/:boardId — удалить доску
            if (req.method === 'DELETE' && pathParts.length === 1) {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const index = boards.findIndex(b => b.id === boardId && b.userId === req.user.userId);
                        if (index === -1) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        boards.splice(index, 1);
                        
                        res.json({
                            success: true,
                            message: 'Доска удалена'
                        });
                        resolve();
                    });
                });
            }
            
            // ========== МАРШРУТЫ ДЛЯ ГРАФА ==========
            
            // GET /api/boards/:boardId/graph — получить данные графа
            if (req.method === 'GET' && subPath === 'graph') {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const graphData = board.content?.nodes ? board.content : { nodes: [], edges: [] };
                        
                        res.json({
                            success: true,
                            graph: graphData
                        });
                        resolve();
                    });
                });
            }
            
            // POST /api/boards/:boardId/nodes — добавить вершину
            if (req.method === 'POST' && subPath === 'nodes') {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const { label, type, content, x, y, color } = req.body;
                        
                        if (!board.content.nodes) board.content.nodes = [];
                        if (!board.content.edges) board.content.edges = [];
                        
                        const newNode = {
                            id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            label: label || 'Новая вершина',
                            type: type || 'text',
                            content: content || '',
                            x: x || Math.random() * 500 + 50,
                            y: y || Math.random() * 300 + 50,
                            color: color || '#8a2be2',
                            createdAt: new Date()
                        };
                        
                        board.content.nodes.push(newNode);
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Вершина создана',
                            node: newNode
                        });
                        resolve();
                    });
                });
            }
            
            // PATCH /api/boards/:boardId/nodes/:nodeId — обновить вершину
            const nodeMatch = subPath.match(/^nodes\/(.+)$/);
            if (req.method === 'PATCH' && nodeMatch) {
                const nodeId = nodeMatch[1];
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !board.content.nodes) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const node = board.content.nodes.find(n => n.id === nodeId);
                        if (!node) {
                            return res.status(404).json({ success: false, message: 'Вершина не найдена' });
                        }
                        
                        const { label, type, content, x, y, color } = req.body;
                        if (label !== undefined) node.label = label;
                        if (type !== undefined) node.type = type;
                        if (content !== undefined) node.content = content;
                        if (x !== undefined) node.x = x;
                        if (y !== undefined) node.y = y;
                        if (color !== undefined) node.color = color;
                        
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Вершина обновлена',
                            node
                        });
                        resolve();
                    });
                });
            }
            
            // DELETE /api/boards/:boardId/nodes/:nodeId — удалить вершину
            const deleteNodeMatch = subPath.match(/^nodes\/(.+)$/);
            if (req.method === 'DELETE' && deleteNodeMatch) {
                const nodeId = deleteNodeMatch[1];
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !board.content.nodes) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const nodeIndex = board.content.nodes.findIndex(n => n.id === nodeId);
                        if (nodeIndex === -1) {
                            return res.status(404).json({ success: false, message: 'Вершина не найдена' });
                        }
                        
                        board.content.nodes.splice(nodeIndex, 1);
                        
                        // Удаляем связанные рёбра
                        if (board.content.edges) {
                            board.content.edges = board.content.edges.filter(e => 
                                e.source !== nodeId && e.target !== nodeId
                            );
                        }
                        
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Вершина удалена'
                        });
                        resolve();
                    });
                });
            }
            
            // POST /api/boards/:boardId/edges — добавить ребро
            if (req.method === 'POST' && subPath === 'edges') {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !board.content.nodes) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const { source, target } = req.body;
                        
                        if (!source || !target) {
                            return res.status(400).json({ success: false, message: 'Не указаны source и target' });
                        }
                        
                        if (!board.content.edges) board.content.edges = [];
                        
                        const newEdge = {
                            id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                            source,
                            target,
                            label: '',
                            createdAt: new Date()
                        };
                        
                        board.content.edges.push(newEdge);
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Связь создана',
                            edge: newEdge
                        });
                        resolve();
                    });
                });
            }
            
            // DELETE /api/boards/:boardId/edges/:edgeId — удалить ребро
            const edgeMatch = subPath.match(/^edges\/(.+)$/);
            if (req.method === 'DELETE' && edgeMatch) {
                const edgeId = edgeMatch[1];
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !board.content.edges) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const edgeIndex = board.content.edges.findIndex(e => e.id === edgeId);
                        if (edgeIndex === -1) {
                            return res.status(404).json({ success: false, message: 'Ребро не найдено' });
                        }
                        
                        board.content.edges.splice(edgeIndex, 1);
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Ребро удалено'
                        });
                        resolve();
                    });
                });
            }
            
            // ========== МАРШРУТЫ ДЛЯ ЭЛЕМЕНТОВ СПИСКА (ПЛАНЫ) ==========
            
            // POST /api/boards/:boardId/items — добавить элемент списка
            if (req.method === 'POST' && subPath === 'items') {
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const { text } = req.body;
                        
                        if (!board.content) board.content = [];
                        
                        const newItem = {
                            id: Date.now() + Math.random(),
                            text,
                            completed: false,
                            createdAt: new Date()
                        };
                        
                        board.content.push(newItem);
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Элемент добавлен',
                            item: newItem
                        });
                        resolve();
                    });
                });
            }
            
            // PATCH /api/boards/:boardId/items/:itemId — обновить элемент списка
            const itemMatch = subPath.match(/^items\/(.+)$/);
            if (req.method === 'PATCH' && itemMatch) {
                const itemId = parseFloat(itemMatch[1]);
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !Array.isArray(board.content)) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const item = board.content.find(i => i.id === itemId);
                        if (!item) {
                            return res.status(404).json({ success: false, message: 'Элемент не найден' });
                        }
                        
                        const { text, completed } = req.body;
                        if (text !== undefined) item.text = text;
                        if (completed !== undefined) item.completed = completed;
                        
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Элемент обновлен',
                            item
                        });
                        resolve();
                    });
                });
            }
            
            // DELETE /api/boards/:boardId/items/:itemId — удалить элемент списка
            const deleteItemMatch = subPath.match(/^items\/(.+)$/);
            if (req.method === 'DELETE' && deleteItemMatch) {
                const itemId = parseFloat(deleteItemMatch[1]);
                return new Promise((resolve) => {
                    authenticateToken(req, res, () => {
                        const board = boards.find(b => b.id === boardId && b.userId === req.user.userId);
                        if (!board || !Array.isArray(board.content)) {
                            return res.status(404).json({ success: false, message: 'Доска не найдена' });
                        }
                        
                        const itemIndex = board.content.findIndex(i => i.id === itemId);
                        if (itemIndex === -1) {
                            return res.status(404).json({ success: false, message: 'Элемент не найден' });
                        }
                        
                        board.content.splice(itemIndex, 1);
                        board.updatedAt = new Date();
                        
                        res.json({
                            success: true,
                            message: 'Элемент удален'
                        });
                        resolve();
                    });
                });
            }
        }
        
        // Если ничего не подошло
        res.status(404).json({ 
            success: false, 
            message: 'Маршрут не найден',
            method: req.method,
            url: req.url
        });
        
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ошибка сервера' 
        });
    }
}