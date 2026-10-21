const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust path to your database configuration
const { verifyToken } = require('../middleware/authMiddleware');

// Get tickets based on user role
// ADMIN and AGENT see all tickets; regular USER sees only their own created tickets
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM tickets';
    let params = [];

    if (req.user.role === 'USER') {
      query += ' WHERE created_by = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY id DESC';
    const [tickets] = await db.query(query, params);
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching tickets' });
  }
});

// Create a new ticket linked to created_by
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const [result] = await db.query(
      'INSERT INTO tickets (title, description, priority, created_by, status) VALUES (?, ?, ?, ?, ?)',
      [title, description, priority || 'MEDIUM', req.user.id, 'OPEN']
    );

    const [newTicket] = await db.query('SELECT * FROM tickets WHERE id = ?', [result.insertId]);
    res.status(201).json(newTicket[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
});

// Update ticket status, assignment, or priority (ADMIN & AGENT only)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }

    const { status, assigned_to, priority } = req.body;
    const ticketId = req.params.id;

    let updates = [];
    let params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (priority) {
      updates.push('priority = ?');
      params.push(priority);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    params.push(ticketId);

    await db.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updatedTicket] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (updatedTicket.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(updatedTicket[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating ticket' });
  }
});

module.exports = router;