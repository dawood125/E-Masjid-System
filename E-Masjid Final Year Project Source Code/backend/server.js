require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { stripeWebhook } = require('./routes/stripeWebhook');

// Connect to Database (tests manage their own connections)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

// ─── MIDDLEWARE ──────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Stripe webhook must use raw body
app.post('/api/donations/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
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
let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    if (server) {
      server.close(() => {});
    }
  });
}

module.exports = app;
