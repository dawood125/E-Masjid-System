require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Mosque = require('../models/Mosque');

const FAKE_COMMITTEE_EMAILS = [
  'committee@emasjid.pk',
  'committee2@emasjid.pk',
  'committee3@emasjid.pk',
  'committee4@emasjid.pk',
];

const patch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for committee patch...');

    const alNoor = await Mosque.findOne({ name: 'Masjid Al-Noor' });
    if (!alNoor) {
      console.error('Masjid Al-Noor not found — aborting');
      process.exit(1);
    }
    console.log(`Al-Noor mosqueId = ${alNoor._id}`);

    const deactivate = await User.updateMany(
      { email: { $in: FAKE_COMMITTEE_EMAILS }, role: 'committee' },
      { $set: { isActive: false } }
    );
    console.log(`Marked ${deactivate.modifiedCount} synthetic committee accounts inactive`);

    const committee = await User.find({
      role: 'committee',
      mosqueId: alNoor._id,
    }).select('name email isActive mosqueId');

    console.log('\nCurrent Al-Noor committee members:');
    committee.forEach((m) => {
      const tag = m.isActive ? 'ACTIVE  ' : 'inactive';
      console.log(`  [${tag}] ${m.email.padEnd(35)} -> ${m.name}`);
    });

    const activeCount = committee.filter((m) => m.isActive).length;
    console.log(`\n${activeCount} active committee member(s) will receive notification emails.`);

    process.exit(0);
  } catch (err) {
    console.error('Patch error:', err.message);
    process.exit(1);
  }
};

patch();
