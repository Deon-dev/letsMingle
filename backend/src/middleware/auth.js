const { verifyAccess } = require('../utils/jwt');
const User = require('../models/User');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'No token' });
    const payload = verifyAccess(token);
    req.user = await User.findById(payload.id);
    if (!req.user) return res.status(401).json({ message: 'Invalid user' });
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
