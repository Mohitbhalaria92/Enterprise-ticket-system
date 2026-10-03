const db = require('../config/db');

// 1. Create a Ticket
exports.createTicket = async (req, res) => {
  const { title, description, priority } = req.body;
  const created_by = req.user.id;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO tickets (title, description, priority, created_by) VALUES (?, ?, ?, ?)',
      [title, description, priority || 'MEDIUM', created_by]
    );

    res.status(201).json({
      message: 'Ticket created successfully!',
      ticketId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: 'Database error.', error: error.message });
  }
};

// 2. Get Tickets (USER sees own created tickets; ADMIN & AGENT see all)
exports.getTickets = async (req, res) => {
  try {
    let query = `
      SELECT t.*, u.name AS creator_name, a.name AS assignee_name 
      FROM tickets t 
      LEFT JOIN users u ON t.created_by = u.id 
      LEFT JOIN users a ON t.assigned_to = a.id
    `;
    let params = [];

    if (req.user.role === 'USER') {
      query += ' WHERE t.created_by = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tickets] = await db.query(query, params);
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Database error.', error: error.message });
  }
};

// 3. Update Ticket Status or Assignment (ADMIN & AGENT only)
exports.updateTicket = async (req, res) => {
  const { id } = req.params;
  const { status, assigned_to } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE tickets SET status = COALESCE(?, status), assigned_to = COALESCE(?, assigned_to) WHERE id = ?',
      [status, assigned_to, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    res.status(200).json({ message: 'Ticket updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Database error.', error: error.message });
  }
};