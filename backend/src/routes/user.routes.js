const router = require('express').Router();
const auth = require('../middleware/auth');
const { me, search, updateProfile } = require('../controllers/user.controller');

router.get('/me', auth, me);
router.get('/search', auth, search);
router.put('/me', auth, updateProfile);

module.exports = router;
