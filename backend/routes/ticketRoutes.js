const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getTickets, 
  getTicketById, 
  updateTicket, 
  deleteTicket,
  addComment, 
  getComments 
} = require('../controllers/ticketController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// All ticket endpoints require authentication
router.use(authenticateToken);

// Ticket CRUD operations
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);

// Status/assignment updates reserved for ADMIN and MANAGER
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateTicket);

// Deletion restricted to ADMIN only
router.delete('/:id', authorizeRoles('ADMIN'), deleteTicket);

// Threaded comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

module.exports = router;