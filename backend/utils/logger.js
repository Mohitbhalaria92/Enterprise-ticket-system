const db = require('../config/db');

/**
 * Reusable helper to log actions into the ticket_activity_logs table.
 * @param {number} ticketId - The ID of the ticket being modified
 * @param {number} userId - The ID of the user performing the action
 * @param {string} actionType - The type of action (e.g., 'STATUS_CHANGE', 'COMMENT_ADDED')
 * @param {string} description - Details about what changed
 */
async function logTicketActivity(ticketId, userId, actionType, description) {
    try {
        await db.query(
            `INSERT INTO ticket_activity_logs (ticket_id, user_id, action_type, description) 
             VALUES (?, ?, ?, ?)`,
            [ticketId, userId, actionType, description]
        );
        console.log(`📝 Activity Logged [${actionType}] for Ticket #${ticketId}`);
    } catch (err) {
        console.error('❌ Failed to write activity log:', err.message);
    }
}

module.exports = { logTicketActivity };