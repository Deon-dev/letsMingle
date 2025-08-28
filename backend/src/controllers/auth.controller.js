const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');
const bcrypt = require('bcrypt');

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already in use' });
  const user = await User.create({ name, email, password });
  const accessToken = signAccess({ id: user._id });
  const refreshToken = signRefresh({ id: user._id });
  res
    .cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: 7*24*60*60*1000 })
    .json({ user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }, accessToken });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await user.compare(password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const accessToken = signAccess({ id: user._id });
  const refreshToken = signRefresh({ id: user._id });
  res
    .cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: 7*24*60*60*1000 })
    .json({ user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }, accessToken });
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const payload = verifyRefresh(token);
    const accessToken = signAccess({ id: payload.id });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('refresh_token').json({ message: 'Logged out' });
};
