require('dotenv').config();
const mongoose = require('mongoose');
const Mosque = require('../models/Mosque');
const HeroSlide = require('../models/HeroSlide');

const DEFAULT_SLIDES = [
  { image: '/assets/images/gallery/gallery-fajr.jpg',       caption: 'Fajr prayer at dawn — worshippers in sujood' },
  { image: '/assets/images/gallery/gallery-quran.jpg',      caption: 'Quran study circle with our ustaad' },
  { image: '/assets/images/gallery/gallery-madrassa.jpg',  caption: 'Children learning Arabic letters' },
  { image: '/assets/images/gallery/gallery-iftar.jpg',      caption: 'Community iftar during Ramadan' },
  { image: '/assets/images/gallery/gallery-nikah.jpg',      caption: 'A blessed Nikah ceremony' },
  { image: '/assets/images/gallery/gallery-courtyard.jpg', caption: 'Our peaceful courtyard at golden hour' },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const masjids = await Mosque.find({}).sort({ createdAt: 1 });
  console.log(`Found ${masjids.length} masjid(s).`);
  for (const m of masjids) {
    const existing = await HeroSlide.countDocuments({ mosqueId: m._id });
    if (existing > 0) {
      console.log(`  [skip] ${m.name} already has ${existing} slide(s).`);
      continue;
    }
    for (let i = 0; i < DEFAULT_SLIDES.length; i++) {
      await HeroSlide.create({
        ...DEFAULT_SLIDES[i],
        order: i,
        isActive: true,
        createdBy: m.managerId,
        mosqueId: m._id,
      });
    }
    console.log(`  [add]  ${m.name}: inserted ${DEFAULT_SLIDES.length} default slide(s).`);
  }
  const finalCount = await HeroSlide.countDocuments({});
  console.log(`\nTotal HeroSlide documents in DB: ${finalCount}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
