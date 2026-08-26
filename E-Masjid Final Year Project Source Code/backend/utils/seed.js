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
const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    
    await Promise.all([
      User.deleteMany({}), Mosque.deleteMany({}), Donation.deleteMany({}),
      Expense.deleteMany({}), Event.deleteMany({}), Announcement.deleteMany({}),
      PrayerTime.deleteMany({}), NikahBooking.deleteMany({}), FundRequest.deleteMany({}),
      Campaign.deleteMany({}), Testimonial.deleteMany({}), HeroSlide.deleteMany({}),
    ]);

    
    const manager = await User.create({
      name: 'Haji Saeed Manager', email: 'manager@emasjid.pk', password: 'manager123', role: 'manager', phone: '0300-1111111',
    });
    const admin = await User.create({
      name: 'Haji Ahmad', email: 'admin@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-2222222',
    });
    const scholar = await User.create({
      name: 'Sheikh Muhammad Hassan', email: 'scholar@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333333', specialization: 'Nikah Services',
    });
    const committee1 = await User.create({
      name: 'Haji Muhammad Arif', email: 'committee@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444444', isActive: false,
    });
    const user1 = await User.create({
      name: 'Abdullah Ahmed', email: 'user@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555555',
    });

    
    
    
    const realEmailAdmin = await User.create({
      name: 'Admin User (Real Email)', email: 'dawood.bhatti8812@gmail.com', password: 'admin123', role: 'admin', phone: '0300-6666666',
    });
    const realEmailManager = await User.create({
      name: 'Manager User (Real Email)', email: 'pa672189@gmail.com', password: 'manager123', role: 'manager', phone: '0300-7777777',
    });
    const realEmailScholar = await User.create({
      name: 'Scholar User (Real Email)', email: 'dawoodah85@gmail.com', password: 'scholar123', role: 'scholar', phone: '0300-8888888', specialization: 'Nikah Services',
    });
    const realEmailCommittee = await User.create({
      name: 'Committee Jack (Friend #1)', email: 'jackcanada333@gmail.com', password: 'committee123', role: 'committee', phone: '0301-1110001',
    });
    const realEmailCommittee2 = await User.create({
      name: 'Committee Jack (Friend #2)', email: 'jackcanada111@gmail.com', password: 'committee123', role: 'committee', phone: '0301-1110002',
    });
    const realEmailCommittee3 = await User.create({
      name: 'Committee Motivation4 (Friend)', email: 'motivation4@gmail.com', password: 'committee123', role: 'committee', phone: '0301-1110003',
    });
    const realEmailCommittee4 = await User.create({
      name: 'Committee Haseeb (Friend)', email: 'haseeb102323@gmail.com', password: 'committee123', role: 'committee', phone: '0301-1110004',
    });

    
    
    
    
    
    
    

    
    const mosque = await Mosque.create({
      name: 'Masjid Al-Noor', address: 'Near Civil Lines, Main GT Road', city: 'Sheikhupura',
      phone: '0321-5551234', email: 'info@masjidalnoor.pk',
      managerId: manager._id, admins: [admin._id], isActive: true,
    });

    
    const admin2 = await User.create({
      name: 'Qari Imran', email: 'admin2@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-1313131',
    });
    const mosque2 = await Mosque.create({
      name: 'Masjid Al-Rahman', address: '15-A Model Town', city: 'Sheikhupura',
      phone: '0321-6669988', email: 'info@masjidalrahman.pk',
      managerId: manager._id, admins: [admin2._id], isActive: true,
    });

    
    const admin3 = await User.create({
      name: 'Mufti Bilal', email: 'admin3@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-1414141',
    });
    const mosque3 = await Mosque.create({
      name: 'Masjid Al-Falah', address: 'Block B, Samanabad', city: 'Sheikhupura',
      phone: '0321-7773344', email: 'info@masjidalfalah.pk',
      managerId: manager._id, admins: [admin3._id], isActive: true,
    });

    
    const admin4 = await User.create({
      name: 'Maulana Tariq Jameel', email: 'admin4@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-1515151',
    });
    const mosque4 = await Mosque.create({
      name: 'Masjid Al-Taqwa', address: 'Housing Colony, Near GTS Bus Stand', city: 'Sheikhupura',
      phone: '0321-8885566', email: 'info@masjidaltaqwa.pk',
      managerId: manager._id, admins: [admin4._id], isActive: true,
    });

    
    const allMasjids = [mosque, mosque2, mosque3, mosque4];

    
    
    
    
    await User.updateOne({ _id: admin2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: admin3._id }, { mosqueId: mosque3._id });
    await User.updateOne({ _id: admin4._id }, { mosqueId: mosque4._id });

    
    
    
    
    
    
    await User.updateMany(
      { _id: { $in: [admin._id, scholar._id, committee1._id, user1._id, realEmailAdmin._id, realEmailScholar._id, realEmailCommittee._id, realEmailCommittee2._id, realEmailCommittee3._id, realEmailCommittee4._id] } },
      { mosqueId: mosque._id }
    );

    const scholar2 = await User.create({
      name: 'Maulana Yousuf Raza', email: 'scholar2@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333334', specialization: 'Nikah & Janazah',
    });
    const scholar3 = await User.create({
      name: 'Sheikh Abdul Kareem', email: 'scholar3@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333335', specialization: 'Family Counseling',
    });
    const scholar4 = await User.create({
      name: 'Mufti Salman', email: 'scholar4@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333336', specialization: 'Nikah Services',
    });

    const committee2 = await User.create({
      name: 'Haji Tariq Mehmood', email: 'committee2@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444445',
    });
    const committee3 = await User.create({
      name: 'Haji Rashid Aziz', email: 'committee3@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444446',
    });
    const committee4 = await User.create({
      name: 'Haji Akram Hussain', email: 'committee4@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444447',
    });

    const user2 = await User.create({
      name: 'Hamza Iqbal', email: 'user2@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555556',
    });
    const user3 = await User.create({
      name: 'Ahmad Raza', email: 'user3@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555557',
    });
    const user4 = await User.create({
      name: 'Saad Ahmed', email: 'user4@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555558',
    });

    await User.updateOne({ _id: scholar2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: scholar3._id }, { mosqueId: mosque3._id });
    await User.updateOne({ _id: scholar4._id }, { mosqueId: mosque4._id });
    await User.updateOne({ _id: committee2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: committee3._id }, { mosqueId: mosque3._id });
    await User.updateOne({ _id: committee4._id }, { mosqueId: mosque4._id });
    await User.updateOne({ _id: user2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: user3._id }, { mosqueId: mosque3._id });
    await User.updateOne({ _id: user4._id }, { mosqueId: mosque4._id });

    
    const donations = [
      
      { donorName: 'Abdullah Ahmed', email: 'abdullah@example.com', amount: 5000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Fatima Khan', email: 'fatima@example.com', amount: 2500, type: 'Sadaqah', paymentMethod: 'Card', mosqueId: mosque._id },
      { donorName: 'Muhammad Hassan', email: 'hassan@example.com', amount: 10000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Anonymous', email: '', amount: 7500, type: 'Zakat', paymentMethod: 'Online', isAnonymous: true, mosqueId: mosque._id },
      { donorName: 'Ibrahim Rahman', email: 'ibrahim@example.com', amount: 3000, type: 'Sadaqah', paymentMethod: 'Cash', mosqueId: mosque._id },
      
      { donorName: 'Bilal Raza', email: 'bilal@example.com', amount: 8000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque2._id },
      { donorName: 'Khadija Noor', email: 'khadija@example.com', amount: 4500, type: 'Sadaqah', paymentMethod: 'Online', mosqueId: mosque2._id },
      { donorName: 'Usman Ali', email: 'usman@example.com', amount: 15000, type: 'Zakat', paymentMethod: 'Card', mosqueId: mosque2._id },
      
      { donorName: 'Aisha Siddiqua', email: 'aisha@example.com', amount: 6000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosque3._id },
      { donorName: 'Yusuf Khan', email: 'yusuf@example.com', amount: 3500, type: 'Sadaqah', paymentMethod: 'Online', mosqueId: mosque3._id },
      
      { donorName: 'Haji Aslam', email: 'aslam@example.com', amount: 9000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque4._id },
      { donorName: 'Maryam Bibi', email: 'maryam@example.com', amount: 4000, type: 'Sadaqah', paymentMethod: 'Card', mosqueId: mosque4._id },
    ];
    await Donation.insertMany(donations);

    
    const expenses = [
      { description: 'Mosque Utilities (Electricity & Water)', amount: 8000, category: 'Utilities', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Staff Salaries - Monthly', amount: 25000, category: 'Salary', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Renovation Materials', amount: 15000, category: 'Renovation', mosqueId: mosque._id, addedBy: admin._id },
      { description: 'Charity Distribution', amount: 12000, category: 'Charity', mosqueId: mosque._id, addedBy: admin._id },
    ];
    await Expense.insertMany(expenses);

    
    const today = new Date();
    const eventDate1 = new Date(today); eventDate1.setDate(eventDate1.getDate() + 7);
    const eventDate2 = new Date(today); eventDate2.setDate(eventDate2.getDate() + 14);
    const eventDate3 = new Date(today); eventDate3.setDate(eventDate3.getDate() + 21);
    const events = [
      
      { title: 'Islamic Knowledge Circle', description: 'Weekly gathering to discuss Islamic topics.', date: eventDate1, time: '19:00', location: 'Main Hall', maxParticipants: 100, mosqueId: mosque._id },
      { title: 'Community Iftaar', description: 'Ramadan community dinner.', date: eventDate2, time: '18:30', location: 'Dining Hall', maxParticipants: 200, mosqueId: mosque._id },
      
      { title: 'Youth Quran Competition', description: 'Annual Quran recitation competition for youth.', date: eventDate1, time: '10:00', location: 'Main Hall', maxParticipants: 50, mosqueId: mosque2._id },
      { title: 'Friday Night Lecture', description: 'Special lecture on Islamic ethics and modern life.', date: eventDate2, time: '20:00', location: 'Lecture Hall', maxParticipants: 150, mosqueId: mosque2._id },
      
      { title: 'Family Milad', description: 'Annual family Milad gathering for sisters and children.', date: eventDate1, time: '16:00', location: 'Main Hall', maxParticipants: 180, mosqueId: mosque3._id },
      { title: 'New Muslim Welcome Dinner', description: 'Dinner to welcome new reverts to the community.', date: eventDate3, time: '19:30', location: 'Multipurpose Hall', maxParticipants: 80, mosqueId: mosque3._id },
      
      { title: 'Hifz Completion Ceremony', description: 'Celebration for students completing Quran Hifz.', date: eventDate2, time: '17:00', location: 'Main Hall', maxParticipants: 250, mosqueId: mosque4._id },
    ];
    await Event.insertMany(events);

    
    const announcements = [
      
      { title: 'Ramadan Schedule Updated', content: 'The Ramadan prayer schedule has been updated.', isUrgent: true, publishedBy: 'Haji Ahmad', mosqueId: mosque._id },
      { title: 'Mosque Renovation Phase 2', content: 'Phase 2 of renovation will begin next week.', isUrgent: false, publishedBy: 'Imam Khalid', mosqueId: mosque._id },
      { title: 'Youth Islamic Classes', content: 'Weekly youth classes resume on Friday.', isUrgent: false, publishedBy: 'Sheikh Ahmed', mosqueId: mosque._id },
      
      { title: 'New Prayer Hall Opened', content: 'Alhamdulillah, our new extended prayer hall is now open for all five daily prayers.', isUrgent: true, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
      { title: 'Weekend Quran Classes', content: 'Quran classes for children age 5-12 every Saturday and Sunday from 9 AM to 11 AM.', isUrgent: false, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
      { title: 'Community Clean-Up Drive', content: 'Join us this Friday after Jummah for a community clean-up around the mosque area.', isUrgent: false, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
      
      { title: 'Friday Khutbah Reminder', content: 'Jummah Khutbah begins at 1:15 PM. Please arrive 15 minutes early.', isUrgent: true, publishedBy: 'Mufti Bilal', mosqueId: mosque3._id },
      { title: 'Monthly Sadaqah Collection', content: 'Monthly sadaqah collection will be held after Asr on the first Sunday of every month.', isUrgent: false, publishedBy: 'Mufti Bilal', mosqueId: mosque3._id },
      
      { title: 'New Admin Announcement', content: 'Welcome to the E-Masjid platform. Prayer times are now available online.', isUrgent: false, publishedBy: 'Maulana Tariq Jameel', mosqueId: mosque4._id },
      { title: 'Taraweeh Prayer Timings', content: 'Taraweeh prayers will be held at 9:30 PM nightly during Ramadan.', isUrgent: false, publishedBy: 'Maulana Tariq Jameel', mosqueId: mosque4._id },
    ];
    await Announcement.insertMany(announcements);

    
    
    
    
    
    
    
    
    
    const prayerTimeVariants = [
      { fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00', sunrise: '06:45' },
      { fajr: '05:15', zuhr: '12:30', asr: '16:00', maghrib: '18:35', isha: '20:00', jummah: '13:15', sunrise: '06:30' },
      { fajr: '05:20', zuhr: '12:35', asr: '15:50', maghrib: '18:30', isha: '19:55', jummah: '13:05', sunrise: '06:35' },
      { fajr: '05:25', zuhr: '12:40', asr: '15:55', maghrib: '18:32', isha: '19:50', jummah: '13:10', sunrise: '06:40' },
    ];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      for (let j = 0; j < allMasjids.length; j++) {
        const t = prayerTimeVariants[j];
        await PrayerTime.create({
          date,
          fajr: t.fajr, zuhr: t.zuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha,
          jummah: date.getDay() === 5 ? t.jummah : null,
          sunrise: t.sunrise,
          mosqueId: allMasjids[j]._id,
        });
      }
    }

    
    
    
    
    const ramadanStart = new Date('2027-02-17');
    ramadanStart.setHours(0, 0, 0, 0);
    const ramadanVariants = [
      { fajr: '05:05', zuhr: '12:30', asr: '16:00', maghrib: '18:05', isha: '19:30', jummah: '13:00', sunrise: '06:25' },
      { fajr: '04:50', zuhr: '12:15', asr: '16:15', maghrib: '18:15', isha: '19:50', jummah: '13:15', sunrise: '06:10' },
      { fajr: '04:55', zuhr: '12:20', asr: '16:10', maghrib: '18:10', isha: '19:45', jummah: '13:10', sunrise: '06:15' },
      { fajr: '05:00', zuhr: '12:25', asr: '16:05', maghrib: '18:10', isha: '19:35', jummah: '13:05', sunrise: '06:20' },
    ];
    for (let i = 0; i < 30; i++) {
      const date = new Date(ramadanStart);
      date.setDate(date.getDate() + i);
      for (let j = 0; j < allMasjids.length; j++) {
        const t = ramadanVariants[j];
        await PrayerTime.create({
          date,
          fajr: t.fajr, zuhr: t.zuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha,
          jummah: date.getDay() === 5 ? t.jummah : null,
          sunrise: t.sunrise,
          mosqueId: allMasjids[j]._id,
        });
      }
    }

    
    
    
    const eidDate = new Date(ramadanStart);
    eidDate.setDate(eidDate.getDate() + 30);
    for (let j = 0; j < allMasjids.length; j++) {
      const t = ramadanVariants[j];
      await PrayerTime.create({
        date: eidDate,
        fajr: t.fajr, zuhr: t.zuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha,
        jummah: eidDate.getDay() === 5 ? t.jummah : null,
        sunrise: t.sunrise,
        eidUlFitr: '07:00',
        mosqueId: allMasjids[j]._id,
      });
    }

    
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
      {
        groomName: 'Bilal Akhtar',
        brideName: 'Maryam Bibi',
        preferredDate: new Date('2026-09-12'),
        preferredTime: '11:30',
        contact: '0302-7771122',
        status: 'pending',
        userId: user2._id,
        mosqueId: mosque2._id,
      },
      {
        groomName: 'Faisal Iqbal',
        brideName: 'Zainab Fatima',
        preferredDate: new Date('2026-09-20'),
        preferredTime: '12:00',
        contact: '0302-8883344',
        status: 'pending',
        userId: user3._id,
        mosqueId: mosque3._id,
      },
      {
        groomName: 'Imran Younas',
        brideName: 'Sana Tariq',
        preferredDate: new Date('2026-09-28'),
        preferredTime: '13:00',
        contact: '0302-9995566',
        status: 'pending',
        userId: user4._id,
        mosqueId: mosque4._id,
      },
    ]);

    
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

    
    
    await Campaign.create({
      title: 'Help Us Build a New Minaret',
      subtitle: 'Our community has grown. We need a taller minaret so the Adhan can be heard across Sheikhupura.',
      targetAmount: 800000,
      raisedAmount: 320000,
      donorCount: 142,
      daysLeft: 23,
      isActive: true,
      isFeatured: true,
      order: 0,
      createdBy: admin._id,
    });

    
    await Testimonial.create({
      name: 'Ayesha Malik',
      role: 'Community Member, Young Professional',
      quote: 'I never imagined I could book a Nikah service so easily. The mosque team helped my family through every step with such respect and care.',
      photo: '/assets/images/testimonials/testimonial-1.jpg',
      order: 0,
      isActive: true,
      createdBy: admin._id,
    });
    await Testimonial.create({
      name: 'Haji Muhammad Aslam',
      role: 'Community Elder, Lifetime Member',
      quote: 'This mosque has been the heart of our community for generations. The new digital system makes it easier for our children to stay connected to the deen.',
      photo: '/assets/images/testimonials/testimonial-2.jpg',
      order: 1,
      isActive: true,
      createdBy: admin._id,
    });
    await Testimonial.create({
      name: 'Fatima & Zainab',
      role: 'Mother & Daughter',
      quote: 'My daughter loves her madrassa classes here. The teachers are so patient, and the Quran program has given her a beautiful foundation in Islam.',
      photo: '/assets/images/testimonials/testimonial-3.jpg',
      order: 2,
      isActive: true,
      createdBy: admin._id,
    });

    
    
    const defaultSlides = [
      { image: '/assets/images/gallery/gallery-fajr.jpg',       caption: 'Fajr prayer at dawn — worshippers in sujood' },
      { image: '/assets/images/gallery/gallery-quran.jpg',      caption: 'Quran study circle with our ustaad' },
      { image: '/assets/images/gallery/gallery-madrassa.jpg',  caption: 'Children learning Arabic letters' },
      { image: '/assets/images/gallery/gallery-iftar.jpg',      caption: 'Community iftar during Ramadan' },
      { image: '/assets/images/gallery/gallery-nikah.jpg',      caption: 'A blessed Nikah ceremony' },
      { image: '/assets/images/gallery/gallery-courtyard.jpg', caption: 'Our peaceful courtyard at golden hour' },
    ];
    for (const m of allMasjids) {
      const createdBy = m._id.equals(mosque._id) ? admin._id : (m.admins[0] || admin._id);
      for (let i = 0; i < defaultSlides.length; i++) {
        await HeroSlide.create({
          ...defaultSlides[i],
          order: i,
          isActive: true,
          createdBy,
          mosqueId: m._id,
        });
      }
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials (primary — for module features):');
    console.log('  Super Admin (manager): manager@emasjid.pk / manager123  ← manages ALL 4 masjids');
    console.log('  Admin (Al-Noor):    admin@emasjid.pk / admin123');
    console.log('  Admin (Al-Rahman):  admin2@emasjid.pk / admin123');
    console.log('  Admin (Al-Falah):   admin3@emasjid.pk / admin123');
    console.log('  Admin (Al-Taqwa):   admin4@emasjid.pk / admin123');
    console.log('  Scholar (Al-Noor):  scholar@emasjid.pk / scholar123');
    console.log('  Scholar (Al-Rahman): scholar2@emasjid.pk / scholar123');
    console.log('  Scholar (Al-Falah):  scholar3@emasjid.pk / scholar123');
    console.log('  Scholar (Al-Taqwa):  scholar4@emasjid.pk / scholar123');
    console.log('  Committee (Al-Noor): committee@emasjid.pk / committee123');
    console.log('  Committee (Al-Rahman): committee2@emasjid.pk / committee123');
    console.log('  Committee (Al-Falah):  committee3@emasjid.pk / committee123');
    console.log('  Committee (Al-Taqwa):  committee4@emasjid.pk / committee123');
    console.log('  User (Al-Noor):   user@emasjid.pk / user1234');
    console.log('  User (Al-Rahman): user2@emasjid.pk / user1234');
    console.log('  User (Al-Falah):  user3@emasjid.pk / user1234');
    console.log('  User (Al-Taqwa):  user4@emasjid.pk / user1234');
    console.log('\n📧 Real-email accounts (for forgot-password cross-role testing — receive real Gmail):');
    console.log('  Admin:     dawood.bhatti8812@gmail.com / admin123');
    console.log('  Manager:   pa672189@gmail.com / manager123   (role: manager — NOT managing any mosque in this seed)');
    console.log('  Scholar:   dawoodah85@gmail.com / scholar123');
    console.log('  Committee (Al-Noor, Gmail #1): jackcanada333@gmail.com / committee123');
    console.log('  Committee (Al-Noor, Gmail #2): jackcanada111@gmail.com / committee123');
    console.log('  Committee (Al-Noor, Gmail #3): motivation4@gmail.com / committee123');
    console.log('  Committee (Al-Noor, Gmail #4): haseeb102323@gmail.com / committee123');
    console.log('\n🕌 Seeded masjids (all in Sheikhupura, all under ONE super admin):');
    console.log('  - Masjid Al-Noor    (Civil Lines)    — admin: admin@emasjid.pk');
    console.log('  - Masjid Al-Rahman  (Model Town)     — admin: admin2@emasjid.pk');
    console.log('  - Masjid Al-Falah   (Samanabad)      — admin: admin3@emasjid.pk');
    console.log('  - Masjid Al-Taqwa   (Housing Colony) — admin: admin4@emasjid.pk');
    console.log('  Super admin (manages all 4):          manager@emasjid.pk\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
