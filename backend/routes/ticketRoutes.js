const express = require('express');
const router = express.Router();
const { createTicket, getTickets, updateTicket } = require('../controllers/ticketController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Protect all routes with JWT verification
router.use(verifyToken);

router.post('/', createTicket);
router.get('/', getTickets);
router.patch('/:id', authorizeRoles('ADMIN', 'AGENT'), updateTicket);

module.exports = router;