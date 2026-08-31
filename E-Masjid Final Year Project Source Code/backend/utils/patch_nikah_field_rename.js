require('dotenv').config();
const mongoose = require('mongoose');
const NikahBooking = require('../models/NikahBooking');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const cursor = NikahBooking.find({
    $or: [
      { preferredDate: { $exists: true } },
      { preferredTime: { $exists: true } },
      { contact: { $exists: true } },
    ],
  }).cursor();

  let updated = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const set = {};
    const unset = {};
    if (doc.preferredDate && !doc.ceremonyDate) set.ceremonyDate = doc.preferredDate;
    if (doc.preferredTime && !doc.ceremonyTime) set.ceremonyTime = doc.preferredTime;
    if (doc.contact && !doc.phone) set.phone = String(doc.contact).slice(0, 20);
    if (doc.contact) {
      const tail = String(doc.contact).slice(0, 30);
      if (tail.includes('@')) set.email = tail.toLowerCase();
    }
    if (!doc.email) set.email = 'legacy-noemail@emasjid.pk';
    if (!doc.address) set.address = 'Address not recorded';

    if (doc.preferredDate !== undefined) unset.preferredDate = '';
    if (doc.preferredTime !== undefined) unset.preferredTime = '';
    if (doc.contact !== undefined) unset.contact = '';

    const update = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    if (Object.keys(update).length) {
      await NikahBooking.updateOne({ _id: doc._id }, update);
      updated += 1;
    }
  }
  console.log(`Migrated ${updated} NikahBooking rows`);

  const total = await NikahBooking.countDocuments();
  const stillLegacy = await NikahBooking.countDocuments({
    $or: [
      { preferredDate: { $exists: true } },
      { preferredTime: { $exists: true } },
      { contact: { $exists: true } },
    ],
  });
  console.log(`Total rows: ${total}, rows still on legacy fields: ${stillLegacy}`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
