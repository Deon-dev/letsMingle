const router = require('express').Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createChatSchema } = require('../validators/schemas');
const { listChats, createChat, addMembers } = require('../controllers/chat.controller');

router.get('/', auth, listChats);
router.post('/', auth, validate(createChatSchema), createChat);
router.post('/:chatId/members', auth, addMembers);

module.exports = router;
