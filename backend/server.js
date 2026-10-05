require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Import Global Error Middleware
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// Health Check Route
app.get('/api/health', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.status(200).json({ 
      status: 'UP', 
      message: 'Server and Database connected successfully!', 
      testQueryResult: rows[0].result 
    });
  } catch (error) {
    next(error);
  }
});

// Global Error Handler (must be registered after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});