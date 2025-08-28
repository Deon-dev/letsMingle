const path = require('path');
const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../validators/schemas');
const { send, listByChat, markRead } = require('../controllers/message.controller');
const { upload } = require('../utils/upload');

router.get('/:chatId', auth, listByChat);
router.post('/', auth, validate(sendMessageSchema), send);
router.post('/:chatId/read', auth, markRead);

// image upload endpoint (returns imageUrl for use in send)
router.post('/upload', auth, upload.single('image'), (req, res) => {
  const file = req.file;
  res.status(201).json({ imageUrl: `/uploads/${file.filename}` });
});

module.exports = router;
