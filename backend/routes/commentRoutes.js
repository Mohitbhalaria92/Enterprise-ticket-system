const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust path to your database configuration
const { verifyToken } = require('../middleware/authMiddleware');

// Get all comments for a specific ticket
router.get('/tickets/:ticketId/comments', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const [comments] = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email, u.role AS user_role 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.ticket_id = ? 
       ORDER BY c.created_at ASC`,
      [ticketId]
    );
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// Post a new comment on a ticket
router.post('/tickets/:ticketId/comments', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Comment message cannot be empty' });
    }

    const [result] = await db.query(
      'INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
      [ticketId, req.user.id, message.trim()]
    );

    const [newComment] = await db.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email, u.role AS user_role 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error posting comment' });
  }
});

module.exports = router;