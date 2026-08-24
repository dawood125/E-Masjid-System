require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mosque = require('../models/Mosque');

const OLD_GMAIL_COMMITTEE = [
  'wb494929@gmail.com',
  'ara786125@gmail.com',
  'dawood.ahmed786678@gmail.com',
];

const NEW_FRIEND_COMMITTEE = [
  { name: 'Committee Jack (Friend #1)', email: 'jackcanada333@gmail.com', phone: '0301-1110001' },
  { name: 'Committee Jack (Friend #2)', email: 'jackcanada111@gmail.com', phone: '0301-1110002' },
  { name: 'Committee Motivation4 (Friend)', email: 'motivation4@gmail.com', phone: '0301-1110003' },
  { name: 'Committee Haseeb (Friend)', email: 'haseeb102323@gmail.com', phone: '0301-1110004' },
];

const patch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for committee-friend patch...');

    const alNoor = await Mosque.findOne({ name: 'Masjid Al-Noor' });
    if (!alNoor) {
      console.error('Masjid Al-Noor not found — aborting');
      process.exit(1);
    }
    console.log(`Al-Noor mosqueId = ${alNoor._id}`);

    const deactivate = await User.updateMany(
      { email: { $in: OLD_GMAIL_COMMITTEE }, role: 'committee' },
      { $set: { isActive: false } }
    );
    console.log(`Marked ${deactivate.modifiedCount} old Gmail committee accounts inactive`);

    for (const friend of NEW_FRIEND_COMMITTEE) {
      const existing = await User.findOne({ email: friend.email });
      if (existing) {
        await User.updateOne(
          { _id: existing._id },
          {
            $set: {
              role: 'committee',
              isActive: true,
              mosqueId: alNoor._id,
              name: friend.name,
              phone: friend.phone,
            },
          }
        );
        console.log(`Updated existing account: ${friend.email}`);
      } else {
        await User.create({
          name: friend.name,
          email: friend.email,
          password: 'committee123',
          role: 'committee',
          phone: friend.phone,
          isActive: true,
          mosqueId: alNoor._id,
        });
        console.log(`Created new account:   ${friend.email}`);
      }
    }

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
