const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// 1. CORS Configuration (Must be at the very top)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Serve uploaded files statically for attachments preview/download
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- CORE ROUTE MOUNTING ---
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', commentRoutes);

// --- ADMIN: USER MANAGEMENT ROUTES (INLINE TO PREVENT 404S) ---
app.get('/api/users', async (req, res) => {
    console.log('⚡ HIT! GET /api/users endpoint was reached by frontend!');
    try {
        const [users] = await db.query('SELECT id, name, email, role FROM users');
        console.log(`✅ Successfully fetched ${users.length} users from database.`);
        res.json(users);
    } catch (err) {
        console.error('❌ Database query error in /api/users:', err.message);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
});

app.patch('/api/users/:id/role', async (req, res) => {
    console.log(`⚡ HIT! PATCH /api/users/${req.params.id}/role endpoint reached!`);
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['USER', 'AGENT', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        console.log(`✅ User #${userId} role updated to ${role}`);
        res.json({ message: 'User role updated successfully', userId, role });
    } catch (err) {
        console.error('❌ Database error in PATCH /api/users/:id/role:', err.message);
        res.status(500).json({ error: 'Failed to update user role', details: err.message });
    }
});

// --- AUTOMATIC USERS SEEDER ---
async function seedDefaultUsers() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    await db.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Admin User', 'admin@test.com', ?, 'ADMIN')
      ON DUPLICATE KEY UPDATE password_hash = ?
    `, [adminPassword, adminPassword]);

    await db.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Support Agent', 'agent@test.com', ?, 'AGENT')
      ON DUPLICATE KEY UPDATE password_hash = ?
    `, [agentPassword, agentPassword]);

    await db.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Standard User', 'user@test.com', ?, 'USER')
      ON DUPLICATE KEY UPDATE password_hash = ?
    `, [userPassword, userPassword]);

    console.log('✅ Default test accounts verified/seeded successfully.');
  } catch (error) {
    console.error('⚠️ Note: Could not seed users yet:', error.message);
  }
}

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        setTimeout(seedDefaultUsers, 3000);
    });
}

module.exports = app;