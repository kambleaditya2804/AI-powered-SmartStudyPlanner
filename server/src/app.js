const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', env: process.env.NODE_ENV });
});

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/plans',    require('./routes/plan.routes'));
app.use('/api/sessions', require('./routes/session.routes'));
app.use('/api/progress', require('./routes/progress.routes'));
app.use('/api/flashcards', require('./routes/flashcard.routes'));

app.use('/api/plans/:planId/topics',   require('./routes/topic.routes'));
app.use('/api/plans/:planId/sessions', require('./routes/session.routes'));
app.use('/api/youtube', require('./routes/youtube.routes'));
app.use('/api/quiz', require('./routes/quiz.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use(errorHandler);

module.exports = app;