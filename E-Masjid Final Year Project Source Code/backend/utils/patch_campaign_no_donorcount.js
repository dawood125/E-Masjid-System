const mongoose = require('mongoose');
require('dotenv').config();

const Campaign = require('../models/Campaign');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('connected');

  const res = await Campaign.collection.updateMany(
    { donorCount: { $exists: true } },
    { $unset: { donorCount: '' } }
  );

  console.log('collection matched=' + res.matchedCount + ' modified=' + res.modifiedCount);

  const after = await Campaign.collection.find({}).toArray();
  console.log('--- after (raw bson) ---');
  after.forEach((c) => {
    console.log('  ' + c.title + ' | donorCount=' + c.donorCount);
  });

  await mongoose.disconnect();
  process.exit(0);
})();