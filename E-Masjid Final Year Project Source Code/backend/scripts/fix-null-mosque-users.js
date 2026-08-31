require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/User');
const Mosque = require('../models/Mosque');

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const usersWithoutMosque = await User.find({
    mosqueId: { $exists: false },
  }).select('_id name email role mosqueId isActive createdAt');

  const usersWithNull = await User.find({
    mosqueId: null,
  }).select('_id name email role mosqueId isActive createdAt');

  const all = [...usersWithoutMosque, ...usersWithNull];
  const seen = new Set();
  const unique = all.filter((u) => {
    const key = String(u._id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length === 0) {
    console.log('No users without a masjid. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\nFound ${unique.length} user(s) without a masjid:\n`);
  unique.forEach((u, i) => {
    console.log(`  [${i + 1}] ${u.name} <${u.email}> role=${u.role} active=${u.isActive} created=${u.createdAt?.toISOString?.() || u.createdAt}`);
  });

  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');

  const masjids = await Mosque.find({ isActive: true }).select('_id name city').lean();
  console.log(`\nAvailable active masjids (${masjids.length}):`);
  masjids.forEach((m, i) => console.log(`  [${i + 1}] ${m.name} (${m.city})  id=${m._id}`));

  if (dryRun) {
    console.log('\nDRY RUN: nothing changed. Pass --apply to actually update.');
    console.log('\nThis script does not auto-assign masjids. Affected users must log in');
    console.log('and use the masjid switcher in the navbar to set their home masjid.');
    console.log('The new PUT /api/auth/me/mosque endpoint will persist the choice.');
    await mongoose.disconnect();
    return;
  }

  console.log('\n--apply flag detected.');
  console.log('This script will NOT bulk-assign masjids. The new masjid switcher (PUT');
  console.log('/api/auth/me/mosque) handles this for users the next time they log in.');
  console.log('If you want to deactivate these accounts instead, type "deactivate".');
  console.log('Press Enter to exit without changes.');

  const choice = await ask('\nAction (deactivate / Enter to skip): ');
  if (choice.toLowerCase() === 'deactivate') {
    const ids = unique.map((u) => u._id);
    const result = await User.updateMany({ _id: { $in: ids } }, { $set: { isActive: false } });
    console.log(`Deactivated ${result.modifiedCount} user(s).`);
  } else {
    console.log('No changes made.');
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Migration failed:', err);
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
