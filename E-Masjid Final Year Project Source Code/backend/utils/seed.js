require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mosque = require('../models/Mosque');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const PrayerTime = require('../models/PrayerTime');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Mosque.deleteMany({}), Donation.deleteMany({}),
      Expense.deleteMany({}), Event.deleteMany({}), Announcement.deleteMany({}),
      PrayerTime.deleteMany({}),
    ]);

    // Create users
    const manager = await User.create({
      name: 'Haji Saeed Manager', email: 'manager@emasjid.pk', password: 'manager123', role: 'manager', phone: '0300-1111111',
    });
    const admin = await User.create({
      name: 'Haji Ahmad', email: 'admin@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-2222222',
    });
    const scholar = await User.create({
      name: 'Sheikh Muhammad Hassan', email: 'scholar@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333333',
    });
    const committee1 = await User.create({
      name: 'Haji Muhammad Arif', email: 'committee@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444444',
    });
    const user1 = await User.create({
      name: 'Abdullah Ahmed', email: 'user@emasjid.pk', password: 'user123', role: 'community', phone: '0300-5555555',
    });

    // Create mosque
    const mosque = await Mosque.create({
      name: 'Masjid Al-Noor', address: 'Near Civil Lines, Main GT Road', city: 'Sheikhupura',
      phone: '0321-5551234', email: 'info@masjidalnoor.pk',
      enabledModules: ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'],
      managerId: manager._id, admins: [admin._id], isActive: true,
    });

    // Update users with mosque reference
    await User.updateMany(
      { _id: { $in: [admin._id, scholar._id, committee1._id] } },
      { mosqueId: mosque._id }
    );

    // Seed Donations
    const donations = [
      { donorName: 'Abdullah Ahmed', email: 'abdullah@example.com', amount: 5000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Fatima Khan', email: 'fatima@example.com', amount: 2500, type: 'Sadaqah', paymentMethod: 'Card', mosqueId: mosque._id },
      { donorName: 'Muhammad Hassan', email: 'hassan@example.com', amount: 10000, type: 'Mosque Fund', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Anonymous', email: '', amount: 7500, type: 'Zakat', paymentMethod: 'Online', isAnonymous: true, mosqueId: mosque._id },
      { donorName: 'Ibrahim Rahman', email: 'ibrahim@example.com', amount: 3000, type: 'Sadaqah', paymentMethod: 'Cash', mosqueId: mosque._id },
    ];
    await Donation.insertMany(donations);

    // Seed Expenses
    const expenses = [
      { description: 'Mosque Utilities (Electricity & Water)', amount: 8000, category: 'Utilities', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Staff Salaries - Monthly', amount: 25000, category: 'Salary', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Renovation Materials', amount: 15000, category: 'Renovation', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Charity Distribution', amount: 12000, category: 'Charity', mosqueId: mosque._id, addedBy: admin._id },
    ];
    await Expense.insertMany(expenses);

    // Seed Events
    const events = [
      { title: 'Islamic Knowledge Circle', description: 'Weekly gathering to discuss Islamic topics.', date: new Date('2026-06-15'), time: '19:00', location: 'Main Hall', maxParticipants: 100, mosqueId: mosque._id },
      { title: 'Community Iftaar', description: 'Ramadan community dinner.', date: new Date('2026-06-20'), time: '18:30', location: 'Dining Hall', maxParticipants: 200, mosqueId: mosque._id },
    ];
    await Event.insertMany(events);

    // Seed Announcements
    const announcements = [
      { title: 'Ramadan Schedule Updated', content: 'The Ramadan prayer schedule has been updated.', isUrgent: true, publishedBy: 'Haji Ahmad', mosqueId: mosque._id },
      { title: 'Mosque Renovation Phase 2', content: 'Phase 2 of renovation will begin next week.', isUrgent: false, publishedBy: 'Imam Khalid', mosqueId: mosque._id },
      { title: 'Youth Islamic Classes', content: 'Weekly youth classes resume on Friday.', isUrgent: false, publishedBy: 'Sheikh Ahmed', mosqueId: mosque._id },
    ];
    await Announcement.insertMany(announcements);

    // Seed Prayer Times (7 days)
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      await PrayerTime.create({
        date, fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45',
        jummah: date.getDay() === 5 ? '13:00' : null, mosqueId: mosque._id,
      });
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('  Manager:   manager@emasjid.pk / manager123');
    console.log('  Admin:     admin@emasjid.pk / admin123');
    console.log('  Scholar:   scholar@emasjid.pk / scholar123');
    console.log('  Committee: committee@emasjid.pk / committee123');
    console.log('  User:      user@emasjid.pk / user123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
