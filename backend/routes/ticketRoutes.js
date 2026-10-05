const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { 
  createTicket, 
  getTickets, 
  updateTicket, 
  addComment, 
  getComments 
} = require('../controllers/ticketController');

// Ticket Routes
router.post('/', verifyToken, createTicket);
router.get('/', verifyToken, getTickets);
router.put('/:id', verifyToken, updateTicket);

// Comment Routes
router.post('/:id/comments', verifyToken, addComment);
router.get('/:id/comments', verifyToken, getComments);

module.exports = router;