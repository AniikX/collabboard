// Общая база для всех API функций
let users = [
  {
    id: 1,
    username: 'demo',
    email: 'demo@demo.com',
    password: 'demo123'
  }
];
let nextId = 2;

export const db = {
  getAllUsers: () => users,
  
  findUserByEmail: (email) => {
    return users.find(u => u.email === email);
  },
  
  findUserByUsername: (username) => {
    return users.find(u => u.username === username);
  },
  
  createUser: (userData) => {
    const user = {
      id: nextId++,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    return user;
  }
};