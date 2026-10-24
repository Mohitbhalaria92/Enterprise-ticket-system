const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { logTicketActivity } = require('../utils/logger');

router.get('/:ticketId/comments', verifyToken, async (req, res) => {
  try {
    const [comments] = await db.query(
      `SELECT c.*, u.name as user_name FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.ticket_id = ? ORDER BY c.created_at ASC`,
      [req.params.ticketId]
    );
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

router.post('/:ticketId/comments', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.ticketId;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const [result] = await db.query(
      'INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
      [ticketId, req.user.id, message]
    );

    await logTicketActivity(ticketId, req.user.id, 'COMMENT_ADDED', 'Added a new comment.');

    const [newComment] = await db.query(
      `SELECT c.*, u.name as user_name FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newComment[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

module.exports = router;