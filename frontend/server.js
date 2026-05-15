/**
 * server.js — Tawjih Backend Entry Point
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes            = require('./routes/auth');
const studentRoutes         = require('./routes/students');
const orientationRoutes     = require('./routes/orientation');
const schoolRoutes          = require('./routes/schools');
const adminRoutes           = require('./routes/admins');
const recommendationRoutes  = require('./routes/recommendations');
const announcementRoutes    = require('./routes/announcements');
const paymentRoutes         = require('./routes/payments');
const counselorRoutes       = require('./routes/counselors');
const careerRoutes          = require('./routes/careers');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth',            authRoutes);
app.use('/api/students',        studentRoutes);
app.use('/api/orientation',     orientationRoutes);
app.use('/api/schools',         schoolRoutes);
app.use('/api/admins',          adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/announcements',   announcementRoutes);
app.use('/api/payments',        paymentRoutes);
app.use('/api/counselors',      counselorRoutes);
app.use('/api/careers',         careerRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`✅ Tawjih API running at http://localhost:${PORT}`));
module.exports = app;