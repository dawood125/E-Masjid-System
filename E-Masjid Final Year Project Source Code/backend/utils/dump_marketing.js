require('dotenv').config();
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');

const dump = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const camps = await Campaign.find().select('title isFeatured isActive order raisedAmount targetAmount').lean();
  const tests = await Testimonial.find().select('name role isActive order').lean();
  const heroes = await HeroSlide.find().select('image caption isActive order').lean();

  console.log(`\n=== Campaigns (${camps.length}) ===`);
  camps.forEach((c) => console.log(`  [${c.isActive ? 'ACTIVE' : 'inactive'}${c.isFeatured ? ', FEATURED' : ''}] order=${c.order}  raised=${c.raisedAmount}/${c.targetAmount}  "${c.title}"`));

  console.log(`\n=== Testimonials (${tests.length}) ===`);
  tests.forEach((t) => console.log(`  [${t.isActive ? 'ACTIVE' : 'inactive'}] order=${t.order}  ${t.name} — ${t.role}`));

  console.log(`\n=== Hero Slides (${heroes.length}) ===`);
  heroes.forEach((h) => console.log(`  [${h.isActive ? 'ACTIVE' : 'inactive'}] order=${h.order}  ${h.image} (${h.caption || 'no caption'})`));

  process.exit(0);
};

dump();
