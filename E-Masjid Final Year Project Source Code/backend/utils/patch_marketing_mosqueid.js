require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');
const Mosque = require('../models/Mosque');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const mosques = await Mosque.find({}).select('_id name slug').lean();
  const alNoor = mosques.find((m) => /al[-\s]?noor/i.test(m.name)) || mosques[0];
  if (!alNoor) {
    console.error('No mosques found — run seed first.');
    process.exit(1);
  }
  console.log(`\nBackfilling marketing records → Masjid ${alNoor.name} (${alNoor._id})\n`);

  const c = await Campaign.updateMany({ $or: [{ mosqueId: { $exists: false } }, { mosqueId: null }] }, { $set: { mosqueId: alNoor._id } });
  const t = await Testimonial.updateMany({ $or: [{ mosqueId: { $exists: false } }, { mosqueId: null }] }, { $set: { mosqueId: alNoor._id } });
  const h = await HeroSlide.updateMany({ $or: [{ mosqueId: { $exists: false } }, { mosqueId: null }] }, { $set: { mosqueId: alNoor._id } });

  console.log(`  Campaign:    matched=${c.matchedCount}  modified=${c.modifiedCount}`);
  console.log(`  Testimonial: matched=${t.matchedCount}  modified=${t.modifiedCount}`);
  console.log(`  HeroSlide:   matched=${h.matchedCount}  modified=${h.modifiedCount}`);

  console.log('\nDone.');
  process.exit(0);
})().catch((e) => {
  console.error('patch_marketing_mosqueid failed:', e);
  process.exit(1);
});