const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/users - Fetch all users for admin management
router.get('/', async (req, res) => {
    console.log('⚡ MODULAR ROUTE HIT: GET /api/users');
    try {
        const [users] = await db.query('SELECT id, name, email, role FROM users');
        res.json(users);
    } catch (err) {
        console.error('❌ Database error in GET /api/users:', err.message);
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
});

// PATCH /api/users/:id/role - Update user role
router.patch('/:id/role', async (req, res) => {
    console.log(`⚡ MODULAR ROUTE HIT: PATCH /api/users/${req.params.id}/role`);
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['USER', 'AGENT', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role specified' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.json({ message: 'User role updated successfully', userId, role });
    } catch (err) {
        console.error('❌ Database error in PATCH /api/users/:id/role:', err.message);
        res.status(500).json({ error: 'Failed to update user role', details: err.message });
    }
});

module.exports = router;