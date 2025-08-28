const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, select: false },
  avatarUrl: { type: String, default: '' },
  status: { type: String, default: 'Hey there! I am using Mingle.' },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.compare = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
