// seed.js
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/userModel.js';
import Transaction from './models/transactionModel.js';
import TransactionItem from './models/transactionItem.js';
import Product from './models/productModel.js'; // Optional: If you have products

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Helpers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAlpha(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let str = '';
  for (let i = 0; i < len; i++)
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  return str;
}

function randomRole() {
  const roles = ['admin', 'owner', 'cashier', 'inventory'];
  return roles[Math.floor(Math.random() * roles.length)];
}

function randomStatus() {
  const statuses = ['active', 'banned', 'suspended'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// Seed Users
async function seedUsers() {
  const users = [];
  for (let i = 0; i < 20; i++) {
    const firstName = randomAlpha(randomInt(3, 8));
    const lastName = randomAlpha(randomInt(4, 10));
    const middleName = Math.random() > 0.5 ? randomAlpha(randomInt(3, 8)) : '';
    const email = `${firstName}.${lastName}${i}@example.com`.toLowerCase();
    const hashedPassword = await bcrypt.hash('Password123', 12);

    users.push({
      email,
      name: { firstName, middleName: middleName || undefined, lastName },
      role: randomRole(),
      password: hashedPassword,
      status: randomStatus(),
    });
  }

  for (const userData of users) {
    const exists = await User.findOne({ email: userData.email });
    if (!exists) {
      await User.create(userData);
      console.log(`✅ User created: ${userData.email}`);
    }
  }
}

// Seed Transactions & Items
async function seedTransactions() {
  const cashiers = await User.find({ role: 'cashier' });
  if (!cashiers.length) {
    console.log('⚠️ No cashiers found. Skipping transaction seed.');
    return;
  }

  for (let t = 0; t < 10; t++) {
    const totalQty = randomInt(1, 10);
    const grossAmount = randomInt(100, 1000);
    const totalDiscount = 0;
    const vatAmount = grossAmount - grossAmount / 1.12;
    const totalAmount = grossAmount; // Can adjust for discounts

    const transaction = await Transaction.create({
      receiptNum: `RCPT-${Date.now()}-${t}`,
      totalQty,
      grossAmount,
      vatableAmount: grossAmount - vatAmount,
      vatAmount,
      totalAmount,
      totalDiscount,
      cashier: cashiers[randomInt(0, cashiers.length - 1)]._id,
      paymentMethod: 'cash',
    });

    // Seed transaction items
    const numItems = randomInt(1, 5);
    for (let i = 0; i < numItems; i++) {
      const quantity = randomInt(1, 5);
      const price = randomInt(10, 300);
      const totalAmount = price * quantity;
      const vatAmount = totalAmount - totalAmount / 1.12;
      const netAmount = totalAmount - vatAmount;

      await TransactionItem.create({
        transactionId: transaction._id,
        productId: new mongoose.Types.ObjectId(), // Replace with actual product ID if available
        quantity,
        price,
        totalAmount,
        vatAmount,
        netAmount,
        vatType: 'vatable',
      });
    }

    console.log(`✅ Transaction seeded: ${transaction.receiptNum}`);
  }
}

(async () => {
  await connectDB();
  await seedUsers();
  await seedTransactions();
  mongoose.connection.close();
})();
