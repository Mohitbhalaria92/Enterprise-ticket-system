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

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

// Serve uploaded files statically for attachments preview/download
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tickets', commentRoutes);

// --- AUTOMATIC USERS SEEDER ---
async function seedDefaultUsers() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Upsert Admin
    await db.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Admin User', 'admin@test.com', ?, 'ADMIN')
      ON DUPLICATE KEY UPDATE password_hash = ?
    `, [adminPassword, adminPassword]);

    // Upsert Agent
    await db.query(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES ('Support Agent', 'agent@test.com', ?, 'AGENT')
      ON DUPLICATE KEY UPDATE password_hash = ?
    `, [agentPassword, agentPassword]);

    // Upsert Standard User
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

// Export app for testing purposes while listening when not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        
        // Seed default accounts after server starts up
        setTimeout(seedDefaultUsers, 3000);
    });
}

module.exports = app;