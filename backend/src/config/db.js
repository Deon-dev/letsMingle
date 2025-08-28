const mongoose = require('mongoose');

const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};

module.exports = connectDB;
