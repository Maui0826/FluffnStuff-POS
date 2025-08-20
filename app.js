import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
dotenv.config();

import globalErrorHandler from './controllers/globalErrorHandler.js';

import { protect } from './middlewares/authMiddleware.js';
import mongoSanitize from './middlewares/mongoSanitize.js';

import cors from 'cors';
import appRouter from './routes/app-routes.js';
import authRouter from './routes/auth-route.js';
import dashboard from './routes/dashboard-route.js';
import actionRoute from './routes/action-route.js';
import inventory from './routes/inventory-route.js';
import posRoute from './routes/pos-route.js';
import stockRoute from './routes/stock-route.js';
import transaction from './routes/transaction-route.js';
import userRoute from './routes/user-route.js';
import refundRoute from './routes/refund-route.js';
import report from './routes/report-route.js';

import dailyInventoryCron from './cron/dailyInventoryCron.js';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize);
dailyInventoryCron(); // start the cron

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.static(join(__dirname, 'public')));

app.use(appRouter);
app.use('/api/v1/auth', authRouter);

app.use(protect);

app.use('/Images', express.static('Images'));

app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1/point-of-sale', posRoute);
app.use('/api/v1/inventory', inventory);
app.use('/api/v1/supplies', stockRoute);
app.use('/api/v1/reports', report);
app.use('/api/v1/user-actions', actionRoute);
app.use('/api/v1/transactions', transaction);
app.use('/api/v1/manage-users', userRoute);
app.use('/api/v1/refunds', refundRoute);

app.use(globalErrorHandler);

export default app;
