import User from '../models/userModel.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const generateRandomPassword = (length = 10) => {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
};

const getAllUsers = async data => {
  const {
    search = '',
    filter = {},
    sortBy = 'name',
    sortOrder = 'asc',
    limit = 10,
    page = 1,
  } = data;

  const query = {};

  // 🔍 Search by name or email if provided
  if (search.trim()) {
    query.$or = [
      { 'name.firstName': { $regex: search, $options: 'i' } },
      { 'name.middleName': { $regex: search, $options: 'i' } },
      { 'name.lastName': { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // 🎯 Filter by role if provided
  if (filter?.role && filter.role !== 'all') {
    query.role = filter.role;
  }

  // 🗂️ Sorting
  const allowedSortFields = ['name', 'status'];
  let sortField = 'name.firstName'; // default to firstName
  if (allowedSortFields.includes(sortBy)) {
    if (sortBy === 'status') sortField = 'status';
    if (sortBy === 'name') sortField = 'name.firstName';
  }
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // 📄 Pagination
  const pageNumber = parseInt(page, 10) || 1;
  const pageSize = parseInt(limit, 10) || 10;
  const skip = (pageNumber - 1) * pageSize;

  // 📦 Query execution with case-insensitive sorting
  const users = await User.find(query)
    .collation({ locale: 'en', strength: 2 }) // case-insensitive
    .sort({ [sortField]: sortDirection })
    .skip(skip)
    .limit(pageSize);

  const total = await User.countDocuments(query);

  return {
    total,
    page: pageNumber,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    data: users,
  };
};

const createUserWithCredentials = async userData => {
  // Generate random plain password
  const plainPassword = generateRandomPassword();

  // Create user in DB
  const newUser = await User.create({
    ...userData,
    password: plainPassword, // store hashed password
  });

  return { newUser, plainPassword }; // return plain password for email sending
};

const banUser = async userId => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.status = 'banned';
  user.suspendUntil = null; // clear any suspension
  await user.save();
  return user;
};

const suspendUser = async (userId, durationDays = 7) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.status = 'suspended';
  const suspendUntil = new Date();
  suspendUntil.setDate(suspendUntil.getDate() + durationDays);
  user.suspendUntil = suspendUntil;
  await user.save();
  return user;
};

const unbanUser = async userId => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.status = 'active';
  user.suspendUntil = null;
  await user.save();
  return user;
};

const updateUser = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // If updating password, hash it
  let plainPassword = null;

  if (updates.password) {
    user.password = updates.password; // Assign plain password, hashing handled in model pre-save
    user.passwordChangedAt = new Date();
    plainPassword = updates.password;
  }

  // Update other fields
  if (updates.name) user.name = { ...user.name, ...updates.name };
  if (updates.email) user.email = updates.email;
  if (updates.role) user.role = updates.role;
  if (updates.status) user.status = updates.status;

  await user.save();
  return { user, plainPassword };
};

export default {
  getAllUsers,
  banUser,
  suspendUser,
  unbanUser,
  updateUser,
  createUserWithCredentials,
};
