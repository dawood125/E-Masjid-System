// Mock Prayer Times Data
export const mockPrayerTimes = {
  today: {
    date: new Date().toISOString().split('T')[0],
    fajr: '05:30',
    zuhr: '12:45',
    asr: '15:45',
    maghrib: '18:25',
    isha: '19:45',
    jummah: '13:00',
  },
  week: [
    {
      date: '2026-03-24',
      fajr: '05:30',
      zuhr: '12:45',
      asr: '15:45',
      maghrib: '18:25',
      isha: '19:45',
      jummah: '13:00',
    },
    {
      date: '2026-03-25',
      fajr: '05:28',
      zuhr: '12:46',
      asr: '15:47',
      maghrib: '18:26',
      isha: '19:46',
      jummah: null,
    },
    {
      date: '2026-03-26',
      fajr: '05:26',
      zuhr: '12:47',
      asr: '15:48',
      maghrib: '18:27',
      isha: '19:47',
      jummah: null,
    },
    {
      date: '2026-03-27',
      fajr: '05:24',
      zuhr: '12:48',
      asr: '15:50',
      maghrib: '18:28',
      isha: '19:48',
      jummah: null,
    },
    {
      date: '2026-03-28',
      fajr: '05:22',
      zuhr: '12:49',
      asr: '15:51',
      maghrib: '18:29',
      isha: '19:49',
      jummah: null,
    },
    {
      date: '2026-03-29',
      fajr: '05:20',
      zuhr: '12:50',
      asr: '15:53',
      maghrib: '18:30',
      isha: '19:50',
      jummah: null,
    },
    {
      date: '2026-03-30',
      fajr: '05:18',
      zuhr: '12:51',
      asr: '15:54',
      maghrib: '18:31',
      isha: '19:51',
      jummah: '13:00',
    },
  ],
}

// Mock Announcements
export const mockAnnouncements = [
  {
    id: '1',
    title: 'Ramadan Schedule Updated',
    content: 'The Ramadan prayer schedule has been updated. Please check the prayer times section for details.',
    date: '2026-03-23',
    isUrgent: true,
    publishedBy: 'Haji Ahmad',
  },
  {
    id: '2',
    title: 'Mosque Renovation Phase 2',
    content: 'Phase 2 of the mosque renovation will begin next week. Prayers will continue as scheduled.',
    date: '2026-03-22',
    isUrgent: false,
    publishedBy: 'Imam Khalid',
  },
  {
    id: '3',
    title: 'Youth Islamic Classes',
    content: 'Weekly youth Islamic classes will resume on Friday starting at 4:00 PM. All youth are welcome.',
    date: '2026-03-20',
    isUrgent: false,
    publishedBy: 'Sheikh Ahmed',
  },
  {
    id: '4',
    title: 'Community Service Day',
    content: 'Join us for our monthly community service day this Saturday. We will be helping elderly community members.',
    date: '2026-03-19',
    isUrgent: false,
    publishedBy: 'Mosque Committee',
  },
]

// Mock Events
export const mockEvents = [
  {
    id: '1',
    title: 'Islamic Knowledge Circle',
    description: 'Weekly gathering to discuss Islamic topics and teachings. Open to all community members.',
    date: '2026-03-28',
    time: '19:00',
    location: 'Main Mosque Hall',
    maxParticipants: 100,
    registeredCount: 45,
    isUrgent: false,
  },
  {
    id: '2',
    title: 'Eid Celebration',
    description: 'Join us for Eid prayers and community celebration with food and festivities.',
    date: '2026-04-10',
    time: '07:00',
    location: 'Mosque Courtyard',
    maxParticipants: 500,
    registeredCount: 250,
    isUrgent: false,
  },
  {
    id: '3',
    title: 'Children Islamic School',
    description: 'Islamic education for children ages 5-12. Learn Quran and Islamic values.',
    date: '2026-03-25',
    time: '15:00',
    location: 'School Room',
    maxParticipants: 50,
    registeredCount: 38,
    isUrgent: false,
  },
  {
    id: '4',
    title: 'Community Ramadan Iftaar',
    description: 'Light dinner and fellowship during Ramadan. Family-friendly event.',
    date: '2026-03-26',
    time: '18:30',
    location: 'Dining Hall',
    maxParticipants: 200,
    registeredCount: 120,
    isUrgent: false,
  },
]

// Mock Donations
export const mockDonations = [
  {
    id: '1',
    donorName: 'Abdullah Ahmed',
    email: 'abdullah@example.com',
    amount: 5000,
    type: 'Zakat',
    date: '2026-03-23',
    paymentMethod: 'Cash',
  },
  {
    id: '2',
    donorName: 'Fatima Khan',
    email: 'fatima@example.com',
    amount: 2500,
    type: 'Sadaqah',
    date: '2026-03-22',
    paymentMethod: 'Card',
  },
  {
    id: '3',
    donorName: 'Muhammad Hassan',
    email: 'hassan@example.com',
    amount: 10000,
    type: 'Mosque Fund',
    date: '2026-03-21',
    paymentMethod: 'Cash',
  },
  {
    id: '4',
    donorName: 'Aisha Ali',
    email: 'aisha@example.com',
    amount: 1500,
    type: 'Sadaqah',
    date: '2026-03-20',
    paymentMethod: 'Card',
  },
  {
    id: '5',
    donorName: 'Ibrahim Rahman',
    email: 'ibrahim@example.com',
    amount: 7500,
    type: 'Zakat',
    date: '2026-03-19',
    paymentMethod: 'Cash',
  },
]

// Mock Expenses
export const mockExpenses = [
  {
    id: '1',
    description: 'Mosque Utilities (Electricity & Water)',
    amount: 8000,
    category: 'Utilities',
    date: '2026-03-23',
  },
  {
    id: '2',
    description: 'Staff Salaries - March',
    amount: 25000,
    category: 'Salary',
    date: '2026-03-20',
  },
  {
    id: '3',
    description: 'Renovation Materials - Phase 2',
    amount: 35000,
    category: 'Renovation',
    date: '2026-03-19',
  },
  {
    id: '4',
    description: 'Charity Distribution to Needy',
    amount: 12000,
    category: 'Charity',
    date: '2026-03-18',
  },
  {
    id: '5',
    description: 'Maintenance & Repairs',
    amount: 3500,
    category: 'Maintenance',
    date: '2026-03-17',
  },
]

// Mock Nikah Bookings
export const mockNikahBookings = [
  {
    id: '1',
    groomName: 'Ahmed Khan',
    brideName: 'Sarah Ali',
    preferredDate: '2026-04-15',
    preferredTime: '14:00',
    contact: '03001234567',
    status: 'accepted',
    scholarId: '1',
    scholarName: 'Sheikh Muhammad',
    schollarName: 'Sheikh Muhammad',
    confirmedDate: '2026-04-15',
    confirmedTime: '14:00',
  },
  {
    id: '2',
    groomName: 'Hassan Malik',
    brideName: 'Hira Khan',
    preferredDate: '2026-04-20',
    preferredTime: '15:00',
    contact: '03009876543',
    status: 'pending',
    scholarId: null,
    scholarName: null,
    schollarName: null,
  },
  {
    id: '3',
    groomName: 'Ali Rahman',
    brideName: 'Mariam Ahmed',
    preferredDate: '2026-04-10',
    preferredTime: '13:00',
    contact: '03005555555',
    status: 'rejected',
    scholarId: null,
    scholarName: null,
    schollarName: null,
    rejectionReason: 'Date not available',
  },
]

// Mock Scholars
export const mockScholars = [
  {
    id: '1',
    name: 'Sheikh Muhammad Hassan',
    email: 'sheikh.hassan@mosque.com',
    phone: '03001111111',
    specialization: 'Islamic Law & Nikah',
    isActive: true,
  },
  {
    id: '2',
    name: 'Sheikh Ibrahim Khan',
    email: 'sheikh.ibrahim@mosque.com',
    phone: '03002222222',
    specialization: 'Quranic Studies',
    isActive: true,
  },
  {
    id: '3',
    name: 'Sheikh Ahmed Ali',
    email: 'sheikh.ahmed@mosque.com',
    phone: '03003333333',
    specialization: 'Islamic Education',
    isActive: false,
  },
]

// Financial Summary
export const mockFinancialSummary = {
  totalDonations: 265000,
  totalExpenses: 183500,
  balance: 81500,
  donationsByType: {
    zakat: 112500,
    sadaqah: 64000,
    mosqueFund: 88500,
  },
  expensesByCategory: {
    utilities: 28000,
    salary: 55000,
    renovation: 55000,
    charity: 32000,
    maintenance: 13500,
  },
}

// Mock Mosques (Multi-Mosque Support)
export const mockMosques = [
  {
    id: '1',
    name: 'Masjid Al-Noor',
    address: 'Near Civil Lines, Main GT Road',
    city: 'Sheikhupura',
    phone: '0321-5551234',
    email: 'info@masjidalnoor.pk',
    image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600',
    enabledModules: ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'],
    managerId: 'mgr1',
    admins: ['admin1'],
    isActive: true,
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    name: 'Jamia Masjid Quba',
    address: 'Satellite Town, Block C',
    city: 'Sheikhupura',
    phone: '0321-6667890',
    email: 'info@masjidquba.pk',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600',
    enabledModules: ['donations', 'expenses', 'events', 'announcements', 'prayerTimes'],
    managerId: 'mgr1',
    admins: ['admin2'],
    isActive: true,
    createdAt: '2025-03-20',
  },
  {
    id: '3',
    name: 'Masjid Bilal',
    address: 'Model Town, Phase 2',
    city: 'Lahore',
    phone: '0300-1112233',
    email: 'info@masjidbilal.pk',
    image: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600',
    enabledModules: ['donations', 'expenses', 'prayerTimes', 'announcements'],
    managerId: 'mgr1',
    admins: [],
    isActive: false,
    createdAt: '2025-06-10',
  },
]

// Mock Committee Members
export const mockCommitteeMembers = [
  {
    id: 'cm1',
    name: 'Haji Muhammad Arif',
    email: 'arif@example.com',
    phone: '0300-1234567',
    mosqueId: '1',
    mosqueName: 'Masjid Al-Noor',
    isActive: true,
  },
  {
    id: 'cm2',
    name: 'Abdul Rasheed Khan',
    email: 'rasheed@example.com',
    phone: '0321-9876543',
    mosqueId: '1',
    mosqueName: 'Masjid Al-Noor',
    isActive: true,
  },
  {
    id: 'cm3',
    name: 'Muhammad Tariq Saeed',
    email: 'tariq@example.com',
    phone: '0333-5551234',
    mosqueId: '2',
    mosqueName: 'Jamia Masjid Quba',
    isActive: true,
  },
]

// Mock Fund Requests (Zakat/Sadaqah)
export const mockFundRequests = [
  {
    id: 'fr1',
    requesterName: 'Aslam Pervaiz',
    requesterEmail: 'aslam@example.com',
    requesterPhone: '0312-1111111',
    amount: 15000,
    reason: 'Need help for medical treatment of my mother who is suffering from kidney disease. We cannot afford the hospital bills.',
    category: 'Medical',
    mosqueId: '1',
    status: 'pending',
    reviewedBy: null,
    reviewNote: null,
    createdAt: '2026-05-01',
  },
  {
    id: 'fr2',
    requesterName: 'Bibi Fatima',
    requesterEmail: 'fatima.w@example.com',
    requesterPhone: '0300-2222222',
    amount: 25000,
    reason: 'Widow with 3 children. Need help paying school fees for my children this semester.',
    category: 'Education',
    mosqueId: '1',
    status: 'approved',
    reviewedBy: 'cm1',
    reviewerName: 'Haji Muhammad Arif',
    reviewNote: 'Verified. Family is genuinely in need. Approved full amount for education support.',
    createdAt: '2026-04-25',
  },
  {
    id: 'fr3',
    requesterName: 'Ghulam Mustafa',
    requesterEmail: 'mustafa@example.com',
    requesterPhone: '0333-3333333',
    amount: 50000,
    reason: 'House damaged in recent heavy rains. Need urgent repair for roof and walls.',
    category: 'Housing',
    mosqueId: '1',
    status: 'rejected',
    reviewedBy: 'cm2',
    reviewerName: 'Abdul Rasheed Khan',
    reviewNote: 'After investigation, applicant already received government aid for the same purpose.',
    createdAt: '2026-04-20',
  },
]

// Mock Top Donors
export const mockTopDonors = [
  { rank: 1, name: 'Muhammad Hassan', totalAmount: 150000, donationCount: 12 },
  { rank: 2, name: 'Abdullah Ahmed', totalAmount: 95000, donationCount: 8 },
  { rank: 3, name: 'Fatima Khan', totalAmount: 75000, donationCount: 15 },
  { rank: 4, name: 'Ibrahim Rahman', totalAmount: 62000, donationCount: 6 },
  { rank: 5, name: 'Bilal Saeed', totalAmount: 48000, donationCount: 10 },
]

// Promotional Content for Homepage
export const mockPromotionalContent = {
  mosquePhotos: [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',
      caption: 'Beautiful interior of Masjid Al-Noor',
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800',
      caption: 'Evening prayers during Ramadan',
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800',
      caption: 'Quran Study Circle',
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800',
      caption: 'Community donation drive',
    },
  ],
  message: 'Join our vibrant community at Masjid Al-Noor. Together we pray, learn, and grow in faith. Your presence strengthens our ummah.',
}
