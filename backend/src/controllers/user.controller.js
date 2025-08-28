const User = require('../models/User');

exports.me = async (req, res) => {
  const u = req.user;
  res.json({ id: u._id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, status: u.status, lastSeen: u.lastSeen });
};

exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } }
    ],
    _id: { $ne: req.user._id }
  }).select('name email avatarUrl');
  res.json(users);
};

exports.updateProfile = async (req, res) => {
  const { name, status, avatarUrl } = req.body;
  const u = await User.findByIdAndUpdate(req.user._id, { name, status, avatarUrl }, { new: true });
  res.json({ id: u._id, name: u.name, email: u.email, avatarUrl: u.avatarUrl, status: u.status });
};
