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
import backupRoutes from './routes/backup-route.js';
import restoreRoute from './routes/restore-route.js';

import dailyInventoryCron from './cron/dailyInventoryCron.js';

import { sanitizeBody } from './middlewares/sanitizer.js';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow cookies
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize);
app.use(sanitizeBody);
dailyInventoryCron(); // start the cron

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));

app.use(appRouter);
app.use('/api/v1/auth', authRouter);

app.use(protect);

app.use('/Images', express.static('Images'));

app.use('/api/v1/backup', backupRoutes);
app.use('/api/v1/restore', restoreRoute);
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
