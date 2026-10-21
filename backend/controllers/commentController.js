const db = require('../config/db');

// Get all comments for a specific ticket
exports.getCommentsByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const [comments] = await db.query(
            `SELECT c.id, c.ticket_id, c.user_id, c.message, c.created_at, u.email as user_email 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.ticket_id = ? 
             ORDER BY c.created_at ASC`,
            [ticketId]
        );
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Add a new comment to a ticket
exports.addComment = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Comment message cannot be empty' });
        }

        await db.query(
            'INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)',
            [ticketId, userId, message]
        );

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};