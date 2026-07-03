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
const NikahBooking = require('../models/NikahBooking');
const FundRequest = require('../models/FundRequest');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Mosque.deleteMany({}), Donation.deleteMany({}),
      Expense.deleteMany({}), Event.deleteMany({}), Announcement.deleteMany({}),
      PrayerTime.deleteMany({}), NikahBooking.deleteMany({}), FundRequest.deleteMany({}),
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
      name: 'Abdullah Ahmed', email: 'user@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555555',
    });

    // Real-email accounts (added 2026-06-24 for cross-role manual testing)
    // These are the developer's personal Gmail accounts used to receive real password-reset emails.
    // NOTE: these are TEST accounts only — replace with the team's real accounts before any production deployment.
    const realEmailAdmin = await User.create({
      name: 'Admin User (Real Email)', email: 'dawood.bhatti8812@gmail.com', password: 'admin123', role: 'admin', phone: '0300-6666666',
    });
    const realEmailManager = await User.create({
      name: 'Manager User (Real Email)', email: 'pa672189@gmail.com', password: 'manager123', role: 'manager', phone: '0300-7777777',
    });
    const realEmailScholar = await User.create({
      name: 'Scholar User (Real Email)', email: 'dawoodah85@gmail.com', password: 'scholar123', role: 'scholar', phone: '0300-8888888',
    });
    const realEmailCommittee = await User.create({
      name: 'Committee User (Real Email)', email: 'wb494929@gmail.com', password: 'committee123', role: 'committee', phone: '0300-9999999',
    });

    // Create mosque
    const mosque = await Mosque.create({
      name: 'Masjid Al-Noor', address: 'Near Civil Lines, Main GT Road', city: 'Sheikhupura',
      phone: '0321-5551234', email: 'info@masjidalnoor.pk',
      enabledModules: ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'],
      managerId: manager._id, admins: [admin._id], isActive: true,
    })

    // Create a second mosque (for multi-mosque dropdown testing — added 2026-06-24)
    const manager2 = await User.create({
      name: 'Haji Raza Manager 2', email: 'manager2@emasjid.pk', password: 'manager123', role: 'manager', phone: '0300-1212121',
    });
    const admin2 = await User.create({
      name: 'Qari Imran', email: 'admin2@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-1313131',
    });
    const mosque2 = await Mosque.create({
      name: 'Masjid Al-Rahman', address: '15-A Model Town', city: 'Lahore',
      phone: '0321-6669988', email: 'info@masjidalrahman.pk',
      enabledModules: ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'],
      managerId: manager2._id, admins: [admin2._id], isActive: true,
    });

    // Reassign pa672189@gmail.com (the real-email manager from Phase 2) to Masjid Al-Rahman
    // so the multi-mosque test exercises a real email per mosque
    await User.updateOne(
      { email: 'pa672189@gmail.com' },
      { mosqueId: mosque2._id, role: 'manager' }
    );;

    // Update users with mosque reference
    await User.updateMany(
      { _id: { $in: [admin._id, scholar._id, committee1._id, user1._id, realEmailAdmin._id, realEmailManager._id, realEmailScholar._id, realEmailCommittee._id] } },
      { mosqueId: mosque._id }
    );

    // Seed Donations
    const donations = [
      { donorName: 'Abdullah Ahmed', email: 'abdullah@example.com', amount: 5000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Fatima Khan', email: 'fatima@example.com', amount: 2500, type: 'Sadaqah', paymentMethod: 'Card', mosqueId: mosque._id },
      { donorName: 'Muhammad Hassan', email: 'hassan@example.com', amount: 10000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque._id },
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

    // Seed Nikah bookings
    await NikahBooking.insertMany([
      {
        groomName: 'Ali Raza',
        brideName: 'Ayesha Noor',
        preferredDate: new Date('2026-07-05'),
        preferredTime: '11:00',
        contact: '0302-1234567',
        status: 'pending',
        userId: user1._id,
        mosqueId: mosque._id,
      },
      {
        groomName: 'Usman Khalid',
        brideName: 'Hina Shah',
        preferredDate: new Date('2026-06-28'),
        preferredTime: '12:30',
        status: 'accepted',
        scholarId: scholar._id,
        confirmedDate: new Date('2026-06-28'),
        confirmedTime: '13:00',
        contact: '0305-2223344',
        userId: user1._id,
        mosqueId: mosque._id,
      },
    ]);

    // Seed fund requests
    await FundRequest.insertMany([
      {
        requesterName: 'Abdullah Ahmed',
        requesterEmail: 'user@emasjid.pk',
        requesterPhone: '0300-5555555',
        amount: 12000,
        category: 'Medical',
        reason: 'Need support for medical treatment and medicine expenses for my family this month.',
        status: 'pending',
        userId: user1._id,
        mosqueId: mosque._id,
      },
      {
        requesterName: 'Abdullah Ahmed',
        requesterEmail: 'user@emasjid.pk',
        requesterPhone: '0300-5555555',
        amount: 7000,
        category: 'Education',
        reason: 'Need assistance for school fee and books for children due to temporary job loss.',
        status: 'approved',
        reviewedBy: committee1._id,
        reviewNote: 'Verified by committee with local reference and documents.',
        userId: user1._id,
        mosqueId: mosque._id,
      },
    ]);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials (primary — for module features):');
    console.log('  Manager:   manager@emasjid.pk / manager123');
    console.log('  Admin:     admin@emasjid.pk / admin123');
    console.log('  Scholar:   scholar@emasjid.pk / scholar123');
    console.log('  Committee: committee@emasjid.pk / committee123');
    console.log('  User:      user@emasjid.pk / user1234');
    console.log('\n📧 Real-email accounts (for forgot-password cross-role testing — receive real Gmail):');
    console.log('  Admin:     dawood.bhatti8812@gmail.com / admin123');
    console.log('  Manager:   pa672189@gmail.com / manager123   (assigned to Masjid Al-Rahman, Lahore)');
    console.log('  Scholar:   dawoodah85@gmail.com / scholar123');
    console.log('  Committee: wb494929@gmail.com / committee123');
    console.log('\n🕌 Seeded mosques (visible in the navbar dropdown):');
    console.log('  - Masjid Al-Noor (Sheikhupura) — manager: manager@emasjid.pk');
    console.log('  - Masjid Al-Rahman (Lahore)      — manager: pa672189@gmail.com (real Gmail)');
    console.log('  Admin2 for Masjid Al-Rahman:     admin2@emasjid.pk / admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
