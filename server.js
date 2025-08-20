process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// environment setup
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT;

// db connect
import mongoose from 'mongoose';
// express app
import app from './app.js';

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log(`connected to ${mongoose.connection.name}`);
});

// start server
app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
