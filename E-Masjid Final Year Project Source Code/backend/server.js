require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { stripeWebhook } = require('./routes/stripeWebhook');


if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();


app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5173'],
  credentials: true,
}));


app.use((req, _res, next) => {
  const header = req.headers && req.headers.cookie;
  req.cookies = {};
  if (!header) return next();
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) req.cookies[name] = decodeURIComponent(value);
  }
  next();
});


app.post('/api/donations/webhook', express.raw({ type: 'application/json' }), stripeWebhook);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', require('./routes/auth'));
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
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/admin/marketing', require('./routes/adminMarketing'));
app.use('/api/super-admin', require('./routes/superAdmin'));


app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'E-Masjid API is running', timestamp: new Date().toISOString() });
});


app.use(errorHandler);


let server;
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT);

  
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    if (server) {
      server.close(() => {});
    }
  });
}

module.exports = app;
