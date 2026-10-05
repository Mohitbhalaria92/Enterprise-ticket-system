const db = require('../config/db');

// 1. Create Ticket
exports.createTicket = async (req, res, next) => {
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
    next(error);
  }
};

// 2. Get Tickets (Paginated, Filtered, Searched, & RBAC Scoped)
exports.getTickets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { status, priority, search } = req.query;

    let baseQuery = `
      FROM tickets t 
      JOIN users u ON t.created_by = u.id 
      LEFT JOIN users a ON t.assigned_to = a.id 
    `;

    const whereClauses = [];
    const queryParams = [];

    // RBAC: Standard users only see tickets they created or are assigned to
    if (req.user.role === 'USER') {
      whereClauses.push(`(t.created_by = ? OR t.assigned_to = ?)`);
      queryParams.push(req.user.id, req.user.id);
    }

    // Filter by Status
    if (status) {
      whereClauses.push(`t.status = ?`);
      queryParams.push(status.toUpperCase());
    }

    // Filter by Priority
    if (priority) {
      whereClauses.push(`t.priority = ?`);
      queryParams.push(priority.toUpperCase());
    }

    // Search by Title or Description
    if (search) {
      whereClauses.push(`(t.title LIKE ? OR t.description LIKE ?)`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ` + whereClauses.join(' AND ');
    }

    // Get Total Count for Metadata
    const countSql = `SELECT COUNT(*) AS total ${baseQuery}`;
    const [countRows] = await db.execute(countSql, queryParams);
    const totalTickets = countRows[0].total;
    const totalPages = Math.ceil(totalTickets / limit);

    // Get Paginated Data
    const dataSql = `
      SELECT t.*, u.name as creator_name, a.name as assignee_name 
      ${baseQuery} 
      ORDER BY t.created_at DESC 
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    const [tickets] = await db.execute(dataSql, queryParams);

    res.json({
      pagination: {
        totalTickets,
        totalPages,
        currentPage: page,
        limit
      },
      tickets
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Ticket by ID
exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [tickets] = await db.execute(
      `SELECT t.*, u.name as creator_name, a.name as assignee_name 
       FROM tickets t 
       JOIN users u ON t.created_by = u.id 
       LEFT JOIN users a ON t.assigned_to = a.id 
       WHERE t.id = ?`,
      [id]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const ticket = tickets[0];

    // Ownership check for standard USER role
    if (req.user.role === 'USER' && ticket.created_by !== req.user.id && ticket.assigned_to !== req.user.id) {
      return res.status(403).json({ message: "Access forbidden: You do not have permission to view this ticket." });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

// 4. Update Ticket
exports.updateTicket = async (req, res, next) => {
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
    next(error);
  }
};

// 5. Delete Ticket
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(`DELETE FROM tickets WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    res.json({ message: "Ticket deleted successfully!" });
  } catch (error) {
    next(error);
  }
};

// 6. Add Comment
exports.addComment = async (req, res, next) => {
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
    next(error);
  }
};

// 7. Get Comments
exports.getComments = async (req, res, next) => {
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
    next(error);
  }
};