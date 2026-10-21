const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:ticketId/comments', verifyToken, commentController.getCommentsByTicket);
router.post('/:ticketId/comments', verifyToken, commentController.addComment);

module.exports = router;