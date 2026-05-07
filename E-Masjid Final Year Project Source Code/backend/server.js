require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to Database
connectDB();

const app = express();

// ─── MIDDLEWARE ──────────────────────────────────────
// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// ─── ROUTES ─────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/events', require('./routes/events'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/prayer-times', require('./routes/prayerTimes'));
app.use('/api/nikah-bookings', require('./routes/nikahBookings'));
app.use('/api/scholars', require('./routes/scholars'));
app.use('/api/mosques', require('./routes/mosques'));
app.use('/api/fund-requests', require('./routes/fundRequests'));
app.use('/api/committee', require('./routes/committee'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'E-Masjid API is running', timestamp: new Date().toISOString() });
});

// ─── ERROR HANDLING ─────────────────────────────────
app.use(errorHandler);

// ─── START SERVER ───────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n  🕌 E-Masjid API Server running on port ${PORT}`);
  console.log(`  📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  🔗 Health: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
