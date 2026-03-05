// Простая база данных в памяти
const users = [];
let nextUserId = 1;

// НОВОЕ: хранилище досок
let boards = [];
let nextBoardId = 1;

module.exports = {
    // Users (старое)
    users,
    
    createUser: (userData) => {
        const user = {
            id: nextUserId++,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            createdAt: new Date(),
            lastLogin: null,
            isActive: true
        };
        users.push(user);
        console.log('👤 New user created:', user.username);
        return user;
    },
    
    findUserByEmail: (email) => {
        return users.find(u => u.email === email && u.isActive);
    },
    
    findUserByUsername: (username) => {
        return users.find(u => u.username === username && u.isActive);
    },
    
    getAllUsers: () => {
        return users.filter(u => u.isActive);
    },
    
    deleteUser: (userId) => {
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            const deletedUser = users.splice(index, 1)[0];
            console.log('🗑️ User deleted:', deletedUser.username);
            return true;
        }
        return false;
    },
    
    deactivateUser: (userId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isActive = false;
            console.log('⛔ User deactivated:', user.username);
            return user;
        }
        return null;
    },
    
    // 📋 МЕТОДЫ ДЛЯ ДОСОК (с поддержкой двух режимов)

    // Создать доску (с указанием режима)
    createBoard: (userId, title, mode = 'plans') => {
        const board = {
            id: nextBoardId++,
            userId: userId,
            title: title || 'Новая доска',
            mode: mode, // 'plans' или 'memory'
            content: mode === 'plans' ? [] : { nodes: [], edges: [] },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        boards.push(board);
        console.log(`📋 Board created: "${board.title}" (mode: ${mode}) for user ${userId}`);
        return board;
    },

    
    // Получить все доски пользователя
    getUserBoards: (userId) => {
        return boards.filter(board => board.userId === userId);
    },

    // Получить конкретную доску
    getBoardById: (boardId) => {
        return boards.find(board => board.id === boardId);
    },

    // Обновить доску
    updateBoard: (boardId, updates) => {
        const board = boards.find(b => b.id === boardId);
        if (!board) return null;
        
        if (updates.title) board.title = updates.title;
        if (updates.content) board.content = updates.content;
        board.updatedAt = new Date();
        
        console.log(`📝 Board updated: ${board.title}`);
        return board;
    },

    // Удалить доску
    deleteBoard: (boardId) => {
        const index = boards.findIndex(b => b.id === boardId);
        if (index !== -1) {
            const deleted = boards.splice(index, 1)[0];
            console.log(`🗑️ Board deleted: ${deleted.title}`);
            return true;
        }
        return false;
    },

    // ========== МЕТОДЫ ДЛЯ РЕЖИМА "ПЛАНЫ" (СПИСКИ) ==========

    // Добавить элемент в список доски
    addBoardItem: (boardId, itemText) => {
        const board = boards.find(b => b.id === boardId);
        if (!board) return null;
        
        if (!board.content) board.content = [];
        
        const newItem = {
            id: Date.now() + Math.random(),
            text: itemText,
            completed: false,
            createdAt: new Date()
        };
        
        board.content.push(newItem);
        board.updatedAt = new Date();
        
        return newItem;
    },

    // Обновить элемент списка
    updateBoardItem: (boardId, itemId, updates) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content) return null;
        
        const item = board.content.find(i => i.id === itemId);
        if (!item) return null;
        
        if (updates.text !== undefined) item.text = updates.text;
        if (updates.completed !== undefined) item.completed = updates.completed;
        
        board.updatedAt = new Date();
        return item;
    },

    // Удалить элемент из списка
    deleteBoardItem: (boardId, itemId) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content) return false;
        
        const index = board.content.findIndex(i => i.id === itemId);
        if (index !== -1) {
            board.content.splice(index, 1);
            board.updatedAt = new Date();
            return true;
        }
        return false;
    },

    // ========== НОВЫЕ МЕТОДЫ ДЛЯ РЕЖИМА "ВОСПОМИНАНИЯ" (ГРАФ) ==========

    // Добавить вершину в граф
    addGraphNode: (boardId, nodeData) => {
        const board = boards.find(b => b.id === boardId);
        if (!board) return null;
        
        // Инициализируем структуру если её нет
        if (!board.content || !board.content.nodes) {
            board.content = { nodes: [], edges: [] };
        }
        
        const newNode = {
            id: 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            label: nodeData.label || 'Новая вершина',
            type: nodeData.type || 'text', // text, image, note
            content: nodeData.content || '',
            x: nodeData.x || Math.random() * 500 + 50,
            y: nodeData.y || Math.random() * 300 + 50,
            color: nodeData.color || '#8a2be2',
            createdAt: new Date()
        };
        
        board.content.nodes.push(newNode);
        board.updatedAt = new Date();
        
        return newNode;
    },

    // Добавить связь (ребро) между вершинами
    addGraphEdge: (boardId, sourceId, targetId) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content || !board.content.nodes) return null;
        
        // Проверяем, что обе вершины существуют
        const sourceExists = board.content.nodes.find(n => n.id === sourceId);
        const targetExists = board.content.nodes.find(n => n.id === targetId);
        
        if (!sourceExists || !targetExists) return null;
        
        const newEdge = {
            id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            source: sourceId,
            target: targetId,
            label: '',
            createdAt: new Date()
        };
        
        if (!board.content.edges) board.content.edges = [];
        board.content.edges.push(newEdge);
        board.updatedAt = new Date();
        
        return newEdge;
    },

    // Обновить вершину
    updateGraphNode: (boardId, nodeId, updates) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content || !board.content.nodes) return null;
        
        const node = board.content.nodes.find(n => n.id === nodeId);
        if (!node) return null;
        
        if (updates.label !== undefined) node.label = updates.label;
        if (updates.content !== undefined) node.content = updates.content;
        if (updates.x !== undefined) node.x = updates.x;
        if (updates.y !== undefined) node.y = updates.y;
        if (updates.color !== undefined) node.color = updates.color;
        
        board.updatedAt = new Date();
        return node;
    },

    // Удалить вершину (и все связанные с ней рёбра)
    deleteGraphNode: (boardId, nodeId) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content || !board.content.nodes) return false;
        
        // Удаляем вершину
        const nodeIndex = board.content.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return false;
        
        board.content.nodes.splice(nodeIndex, 1);
        
        // Удаляем все рёбра, связанные с этой вершиной
        if (board.content.edges) {
            board.content.edges = board.content.edges.filter(e => 
                e.source !== nodeId && e.target !== nodeId
            );
        }
        
        board.updatedAt = new Date();
        return true;
    },

    // Удалить ребро
    deleteGraphEdge: (boardId, edgeId) => {
        const board = boards.find(b => b.id === boardId);
        if (!board || !board.content || !board.content.edges) return false;
        
        const edgeIndex = board.content.edges.findIndex(e => e.id === edgeId);
        if (edgeIndex === -1) return false;
        
        board.content.edges.splice(edgeIndex, 1);
        board.updatedAt = new Date();
        return true;
    },

    // Получить данные графа
    getGraphData: (boardId) => {
        const board = boards.find(b => b.id === boardId);
        if (!board) return null;
        
        return {
            nodes: board.content?.nodes || [],
            edges: board.content?.edges || []
        };
    }
};