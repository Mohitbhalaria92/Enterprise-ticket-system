const db = require('../config/db');

// 1. Create Ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const created_by = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const [result] = await db.execute(
      `INSERT INTO tickets (title, description, priority, created_by) VALUES (?, ?, ?, ?)`,
      [title, description, priority || 'MEDIUM', created_by]
    );

    res.status(201).json({
      message: "Ticket created successfully",
      ticketId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 2. Get Tickets
exports.getTickets = async (req, res) => {
  try {
    const [tickets] = await db.execute(
      `SELECT t.*, u.name as creator_name, a.name as assignee_name 
       FROM tickets t 
       JOIN users u ON t.created_by = u.id 
       LEFT JOIN users a ON t.assigned_to = a.id 
       ORDER BY t.created_at DESC`
    );
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 3. Update Ticket
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;

    const [result] = await db.execute(
      `UPDATE tickets 
       SET status = COALESCE(?, status), 
           priority = COALESCE(?, priority), 
           assigned_to = COALESCE(?, assigned_to),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status || null, priority || null, assigned_to || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    res.json({ message: "Ticket updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 4. Add Comment
exports.addComment = async (req, res) => {
  try {
    const { id: ticket_id } = req.params;
    const { message } = req.body;
    const user_id = req.user.id;

    if (!message) {
      return res.status(400).json({ message: "Comment message cannot be empty." });
    }

    const [result] = await db.execute(
      `INSERT INTO comments (ticket_id, user_id, message) VALUES (?, ?, ?)`,
      [ticket_id, user_id, message]
    );

    res.status(201).json({ 
      message: "Comment posted successfully!", 
      commentId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 5. Get Comments
exports.getComments = async (req, res) => {
  try {
    const { id: ticket_id } = req.params;

    const [comments] = await db.execute(
      `SELECT c.id, c.message, c.created_at, u.name as author_name, u.role as author_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = ?
       ORDER BY c.created_at ASC`,
      [ticket_id]
    );

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};