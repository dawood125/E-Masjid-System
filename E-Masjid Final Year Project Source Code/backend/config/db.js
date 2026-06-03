const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    throw new Error(`MongoDB Error: ${error.message}`);
  }
};

module.exports = connectDB;
