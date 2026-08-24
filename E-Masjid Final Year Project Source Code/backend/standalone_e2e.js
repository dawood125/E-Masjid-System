process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const app = require('./server');
  const User = require('./models/User');
  const Mosque = require('./models/Mosque');
  const NikahBooking = require('./models/NikahBooking');

  await Promise.all([
    User.deleteMany({}),
    Mosque.deleteMany({}),
    NikahBooking.deleteMany({}),
  ]);

  const manager = await User.create({ name: 'Super Manager', email: 'manager@emasjid.pk', password: 'manager123', role: 'manager' });

  async function makeMosque(name, city, adminEmail, scholarEmail, userEmail) {
    const admin = await User.create({ name: `${name} Admin`, email: adminEmail, password: 'admin123', role: 'admin' });
    const scholar = await User.create({ name: `Sheikh ${name}`, email: scholarEmail, password: 'scholar123', role: 'scholar', specialization: 'Nikah Services' });
    const community = await User.create({ name: `User ${name}`, email: userEmail, password: 'user123', role: 'community' });
    const mosque = await Mosque.create({ name, city, managerId: manager._id, admins: [admin._id], isActive: true });
    admin.mosqueId = mosque._id; await admin.save();
    scholar.mosqueId = mosque._id; await scholar.save();
    community.mosqueId = mosque._id; await community.save();
    return { mosque, admin, scholar, community };
  }

  const alNoor = await makeMosque('Masjid Al-Noor', 'Sheikhupura', 'admin@emasjid.pk', 'scholar@emasjid.pk', 'user@emasjid.pk');
  const alRahman = await makeMosque('Masjid Al-Rahman', 'Sheikhupura', 'admin.alrahman@emasjid.pk', 'scholar2@emasjid.pk', 'user.alrahman@emasjid.pk');

  const futureDate = new Date(); futureDate.setHours(0,0,0,0); futureDate.setDate(futureDate.getDate() + 10);

  await NikahBooking.create({
    groomName: 'Seed Groom', brideName: 'Seed Bride', preferredDate: futureDate, preferredTime: '15:00',
    contact: '03001234567', status: 'pending', userId: alNoor.community._id, mosqueId: alNoor.mosque._id,
  });

  const pastDate = new Date(); pastDate.setHours(0,0,0,0); pastDate.setDate(pastDate.getDate() + 5);
  await NikahBooking.create({
    groomName: 'Accepted Seed', brideName: 'Already Done', preferredDate: pastDate, preferredTime: '11:00',
    contact: '03001234567', status: 'accepted', userId: alNoor.community._id, mosqueId: alNoor.mosque._id,
    scholarId: alNoor.scholar._id, confirmedDate: pastDate, confirmedTime: '11:00',
  });

  await User.create({ name: 'Committee Head', email: 'committee@emasjid.pk', password: 'committee123', role: 'committee', mosqueId: alNoor.mosque._id });

  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`E2E standalone backend up on :${PORT} (in-memory mongo)`);
  });

  process.on('SIGINT', async () => { await mongoose.disconnect(); await mongod.stop(); process.exit(0); });
})().catch(e => { console.error(e); process.exit(1); });