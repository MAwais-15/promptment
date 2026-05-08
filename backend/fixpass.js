require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

mongoose.connect('mongodb://localhost:27017/promptment').then(async () => {
  const hash1 = await bcrypt.hash('Admin@123456', 12);
  const hash2 = await bcrypt.hash('Test@123456', 12);
  await User.updateOne({ email: 'admin@promptment.app' }, { password: hash1 });
  await User.updateOne({ email: 'student1@test.com' }, { password: hash2 });
  await User.updateOne({ email: 'student2@test.com' }, { password: hash2 });
  await User.updateOne({ email: 'executor1@test.com' }, { password: hash2 });
  await User.updateOne({ email: 'executor2@test.com' }, { password: hash2 });
  await User.updateOne({ email: 'executor3@test.com' }, { password: hash2 });
  console.log('All passwords fixed!');
  process.exit();
});
