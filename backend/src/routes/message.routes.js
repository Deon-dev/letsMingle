const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../validators/schemas');
const { send, listByChat, markRead } = require('../controllers/message.controller');
const { upload } = require('../utils/upload');

// List messages by chat
router.get('/:chatId', auth, listByChat);

// Send a new message
router.post('/', auth, validate(sendMessageSchema), send);

// Mark all messages in chat as read
router.post('/:chatId/read', auth, markRead);

// Upload image for message
router.post('/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.status(201).json({ imageUrl: `/uploads/${req.file.filename}` });
});

module.exports = router;

