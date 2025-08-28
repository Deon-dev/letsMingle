const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { xss, mongoSanitize } = require('./utils/sanitize');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH']
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(xss());
app.use(mongoSanitize);
app.use(apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/chats', require('./routes/chat.routes'));
app.use('/api/messages', require('./routes/message.routes'));

// health
app.get('/health', (_, res) => res.json({ ok: true }));

// error handler
const errorHandler = require('./middleware/error');
app.use(errorHandler);

module.exports = app;
