const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { logTicketActivity } = require('../utils/logger');
const { determineDomain } = require('../utils/router');

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

router.get('/:id/activity', verifyToken, async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT al.*, u.name as user_name FROM ticket_activity_logs al
       JOIN users u ON al.user_id = u.id
       WHERE al.ticket_id = ? ORDER BY al.created_at DESC`,
      [req.params.id]
    );
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, priority, domain, configuration_item } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const assignedDomain = domain || determineDomain(title, description, configuration_item);

    const [result] = await db.query(
      'INSERT INTO tickets (title, description, priority, domain, created_by, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, priority || 'MEDIUM', assignedDomain, req.user.id, 'OPEN']
    );

    const ticketId = result.insertId;
    await logTicketActivity(ticketId, req.user.id, 'TICKET_CREATED', `Ticket created and routed to domain: ${assignedDomain}`);

    const [newTicket] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    res.status(201).json(newTicket[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating ticket' });
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }

    const { status, assigned_to, priority, domain } = req.body;
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
    if (domain) {
      updates.push('domain = ?');
      params.push(domain);
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

    if (status) {
      await logTicketActivity(ticketId, req.user.id, 'STATUS_CHANGE', `Changed status to ${status}`);
    }
    if (priority) {
      await logTicketActivity(ticketId, req.user.id, 'PRIORITY_CHANGE', `Changed priority to ${priority}`);
    }
    if (assigned_to !== undefined) {
      await logTicketActivity(ticketId, req.user.id, 'ASSIGNMENT_CHANGE', `Assigned agent ID to ${assigned_to || 'Unassigned'}`);
    }
    if (domain) {
      await logTicketActivity(ticketId, req.user.id, 'DOMAIN_CHANGE', `Changed domain to ${domain}`);
    }

    res.json(updatedTicket[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating ticket' });
  }
});

module.exports = router;