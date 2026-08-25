const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 2000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function attachConnectionHandlers() {
  mongoose.connection.on('connected', () => {
    console.log(`[mongo] connected to ${mongoose.connection.name}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected — driver will retry automatically');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[mongo] reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[mongo] connection error: ${err.message}`);
  });

  mongoose.connection.on('close', () => {
    console.warn('[mongo] connection closed');
  });

  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('[mongo] connection closed on app termination');
    process.exit(0);
  });
}

async function connectWithRetry(uri, attempt = 1) {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    });
  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`MongoDB Error after ${attempt} attempts: ${err.message}`);
    }
    const wait = BASE_RETRY_DELAY_MS * attempt;
    console.warn(`[mongo] connect attempt ${attempt} failed (${err.message}), retrying in ${wait}ms`);
    await delay(wait);
    return connectWithRetry(uri, attempt + 1);
  }
}

const connectDB = async () => {
  attachConnectionHandlers();
  await connectWithRetry(process.env.MONGODB_URI);
};

module.exports = connectDB;