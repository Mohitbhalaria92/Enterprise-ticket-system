const db = require('./config/db');

(async () => {
  try {
    const [rows] = await db.query('SELECT id, title, domain FROM tickets');
    console.log("Current Database Tickets:", rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
})();