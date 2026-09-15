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
      name: 'Manager (Dawood Ahmed)', email: 'pa672189@gmail.com', password: 'manager123', role: 'manager', phone: '0300-7777777',
    });
    const admin = await User.create({
      name: 'Haji Ahmad', email: 'admin@emasjid.pk', password: 'admin123', role: 'admin', phone: '0300-2222222',
    });
    const scholar = await User.create({
      name: 'Sheikh Muhammad Hassan', email: 'scholar@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333333', specialization: 'Nikah Services',
    });
    const committee1 = await User.create({
      name: 'Khalid Mehmood', email: 'k82045548@gmail.com', password: 'committee123', role: 'committee', phone: '0300-4444444', isActive: true,
    });
    const user1 = await User.create({
      name: 'Abdullah Ahmed', email: 'user@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555555',
    });






    const realEmailAdmin = await User.create({
      name: 'Admin User (Real Email)', email: 'dawood.bhatti8812@gmail.com', password: 'admin123', role: 'admin', phone: '0300-6666666',
    });
    const realEmailScholar = await User.create({
      name: 'Scholar User (Real Email)', email: 'dawoodah85@gmail.com', password: 'scholar123', role: 'scholar', phone: '0300-8888888', specialization: 'Nikah Services',
    });






    const mosque = await Mosque.create({
      name: 'Masjid Al-Noor', address: 'Near Civil Lines, Main GT Road', city: 'Sheikhupura',
      phone: '0321-4445566', email: 'info@emasjid.pk',
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



    const allMasjids = [mosque, mosque2];




    await User.updateOne({ _id: admin2._id }, { mosqueId: mosque2._id });






    await User.updateMany(
      { _id: { $in: [admin._id, scholar._id, committee1._id, user1._id, realEmailAdmin._id, realEmailScholar._id] } },
      { mosqueId: mosque._id }
    );

    const scholar2 = await User.create({
      name: 'Maulana Yousuf Raza', email: 'scholar2@emasjid.pk', password: 'scholar123', role: 'scholar', phone: '0300-3333334', specialization: 'Nikah & Janazah',
    });

    const committee2 = await User.create({
      name: 'Haji Tariq Mehmood', email: 'committee2@emasjid.pk', password: 'committee123', role: 'committee', phone: '0300-4444445',
    });

    const user2 = await User.create({
      name: 'Hamza Iqbal', email: 'user2@emasjid.pk', password: 'user1234', role: 'community', phone: '0300-5555556',
    });

    await User.updateOne({ _id: scholar2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: committee2._id }, { mosqueId: mosque2._id });
    await User.updateOne({ _id: user2._id }, { mosqueId: mosque2._id });


    const donations = [

      { donorName: 'Abdullah Ahmed', email: 'abdullah@example.com', amount: 5000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Fatima Khan', email: 'fatima@example.com', amount: 2500, type: 'Sadaqah', paymentMethod: 'Card', mosqueId: mosque._id },
      { donorName: 'Muhammad Hassan', email: 'hassan@example.com', amount: 10000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque._id },
      { donorName: 'Anonymous', email: '', amount: 7500, type: 'Zakat', paymentMethod: 'Online', isAnonymous: true, mosqueId: mosque._id },
      { donorName: 'Ibrahim Rahman', email: 'ibrahim@example.com', amount: 3000, type: 'Sadaqah', paymentMethod: 'Cash', mosqueId: mosque._id },

      { donorName: 'Bilal Raza', email: 'bilal@example.com', amount: 8000, type: 'Masjid Fund', paymentMethod: 'Cash', mosqueId: mosque2._id },
      { donorName: 'Khadija Noor', email: 'khadija@example.com', amount: 4500, type: 'Sadaqah', paymentMethod: 'Online', mosqueId: mosque2._id },
      { donorName: 'Usman Ali', email: 'usman@example.com', amount: 15000, type: 'Zakat', paymentMethod: 'Card', mosqueId: mosque2._id },
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
    const events = [

      { title: 'Islamic Knowledge Circle', description: 'Weekly gathering to discuss Islamic topics.', date: eventDate1, time: '19:00', location: 'Main Hall', maxParticipants: 100, mosqueId: mosque._id },
      { title: 'Community Iftaar', description: 'Ramadan community dinner.', date: eventDate2, time: '18:30', location: 'Dining Hall', maxParticipants: 200, mosqueId: mosque._id },

      { title: 'Youth Quran Competition', description: 'Annual Quran recitation competition for youth.', date: eventDate1, time: '10:00', location: 'Main Hall', maxParticipants: 50, mosqueId: mosque2._id },
      { title: 'Friday Night Lecture', description: 'Special lecture on Islamic ethics and modern life.', date: eventDate2, time: '20:00', location: 'Lecture Hall', maxParticipants: 150, mosqueId: mosque2._id },
    ];
    await Event.insertMany(events);


    const announcements = [

      { title: 'Ramadan Schedule Updated', content: 'The Ramadan prayer schedule has been updated.', isUrgent: true, publishedBy: 'Haji Ahmad', mosqueId: mosque._id },
      { title: 'Mosque Renovation Phase 2', content: 'Phase 2 of renovation will begin next week.', isUrgent: false, publishedBy: 'Imam Khalid', mosqueId: mosque._id },
      { title: 'Youth Islamic Classes', content: 'Weekly youth classes resume on Friday.', isUrgent: false, publishedBy: 'Sheikh Ahmed', mosqueId: mosque._id },

      { title: 'New Prayer Hall Opened', content: 'Alhamdulillah, our new extended prayer hall is now open for all five daily prayers.', isUrgent: true, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
      { title: 'Weekend Quran Classes', content: 'Quran classes for children age 5-12 every Saturday and Sunday from 9 AM to 11 AM.', isUrgent: false, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
      { title: 'Community Clean-Up Drive', content: 'Join us this Friday after Jummah for a community clean-up around the mosque area.', isUrgent: false, publishedBy: 'Qari Imran', mosqueId: mosque2._id },
    ];
    await Announcement.insertMany(announcements);








    const prayerTimeVariants = [
      { fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00', sunrise: '06:45' },
      { fajr: '05:15', zuhr: '12:30', asr: '16:00', maghrib: '18:35', isha: '20:00', jummah: '13:15', sunrise: '06:30' },
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
        ceremonyDate: new Date('2026-07-05'),
        ceremonyTime: '11:00',
        phone: '0302-1234567',
        email: 'ali.raza@example.com',
        address: 'House 12, Block A, Sheikhupura',
        notes: 'Family prefers a short ceremony.',
        status: 'pending',
        userId: user1._id,
        mosqueId: mosque._id,
      },
      {
        groomName: 'Usman Khalid',
        brideName: 'Hina Shah',
        ceremonyDate: new Date('2026-06-28'),
        ceremonyTime: '12:30',
        status: 'accepted',
        scholarId: scholar._id,
        confirmedDate: new Date('2026-06-28'),
        confirmedTime: '13:00',
        phone: '0305-2223344',
        email: 'usman.khalid@example.com',
        address: 'House 8, Civil Lines, Sheikhupura',
        userId: user1._id,
        mosqueId: mosque._id,
      },
      {
        groomName: 'Bilal Akhtar',
        brideName: 'Maryam Bibi',
        ceremonyDate: new Date('2026-09-12'),
        ceremonyTime: '11:30',
        phone: '0302-7771122',
        email: 'bilal.akhtar@example.com',
        address: 'House 21, Samanabad, Sheikhupura',
        status: 'pending',
        userId: user2._id,
        mosqueId: mosque2._id,
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
      mosqueId: mosque._id,
      createdBy: admin._id,
    });


    await Testimonial.create({
      name: 'Ayesha Malik',
      role: 'Community Member, Young Professional',
      quote: 'I never imagined I could book a Nikah service so easily. The mosque team helped my family through every step with such respect and care.',
      photo: '/assets/images/testimonials/testimonial-1.jpg',
      order: 0,
      isActive: true,
      mosqueId: mosque._id,
      createdBy: admin._id,
    });
    await Testimonial.create({
      name: 'Haji Muhammad Aslam',
      role: 'Community Elder, Lifetime Member',
      quote: 'This mosque has been the heart of our community for generations. The new digital system makes it easier for our children to stay connected to the deen.',
      photo: '/assets/images/testimonials/testimonial-2.jpg',
      order: 1,
      isActive: true,
      mosqueId: mosque._id,
      createdBy: admin._id,
    });
    await Testimonial.create({
      name: 'Fatima & Zainab',
      role: 'Mother & Daughter',
      quote: 'My daughter loves her madrassa classes here. The teachers are so patient, and the Quran program has given her a beautiful foundation in Islam.',
      photo: '/assets/images/testimonials/testimonial-3.jpg',
      order: 2,
      isActive: true,
      mosqueId: mosque._id,
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
    console.log('  Super Admin (manager): pa672189@gmail.com / manager123  ← manages ALL 2 masjids');
    console.log('  Admin (Al-Noor):    admin@emasjid.pk / admin123');
    console.log('  Admin (Al-Rahman):  admin2@emasjid.pk / admin123');
    console.log('  Scholar (Al-Noor):  scholar@emasjid.pk / scholar123');
    console.log('  Scholar (Al-Rahman): scholar2@emasjid.pk / scholar123');
    console.log('  Committee (Al-Noor): k82045548@gmail.com / committee123');
    console.log('  Committee (Al-Rahman): committee2@emasjid.pk / committee123');
    console.log('  User (Al-Noor):   user@emasjid.pk / user1234');
    console.log('  User (Al-Rahman): user2@emasjid.pk / user1234');
    console.log('\n📧 Real-email accounts (for forgot-password cross-role testing — receive real Gmail):');
    console.log('  Admin:     dawood.bhatti8812@gmail.com / admin123');
    console.log('  Scholar:   dawoodah85@gmail.com / scholar123');
    console.log('\n🕌 Seeded masjids (all in Sheikhupura, all under ONE super admin):');
    console.log('  - Masjid Al-Noor    (Civil Lines)    — admin: admin@emasjid.pk');
    console.log('  - Masjid Al-Rahman  (Model Town)     — admin: admin2@emasjid.pk');
    console.log('  Super admin (manages both):           pa672189@gmail.com\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
