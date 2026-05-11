jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Donation = require('../../models/Donation');
const FundRequest = require('../../models/FundRequest');

jest.setTimeout(30000);

describe('E-Masjid API (integration)', () => {
  let mongod;
  let mosque;
  let adminToken;
  let committeeToken;
  let communityToken;
  let committeeUser;

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    try {
      mongod = await MongoMemoryServer.create();
    } catch (err) {
      throw new Error(
        `mongodb-memory-server failed to start (refusing MONGODB_URI so tests never wipe a real database): ${err.message}`
      );
    }
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
      Donation.deleteMany({}),
      FundRequest.deleteMany({}),
    ]);

    const manager = await User.create({ name: 'Manager', email: 'm@test.com', password: 'pass1234', role: 'manager' });
    const admin = await User.create({ name: 'Admin', email: 'a@test.com', password: 'pass1234', role: 'admin' });
    committeeUser = await User.create({ name: 'Committee', email: 'c@test.com', password: 'pass1234', role: 'committee' });
    const community = await User.create({ name: 'User', email: 'u@test.com', password: 'pass1234', role: 'community' });

    mosque = await Mosque.create({
      name: 'Masjid Test',
      city: 'TestCity',
      managerId: manager._id,
      admins: [admin._id],
      enabledModules: ['donations', 'fundRequests', 'announcements', 'prayerTimes'],
      isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [admin._id, committeeUser._id, community._id] } },
      { mosqueId: mosque._id }
    );

    // Login to get tokens
    const loginAdmin = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'pass1234' });
    adminToken = loginAdmin.body.token;
    const loginCommittee = await request(app).post('/api/auth/login').send({ email: 'c@test.com', password: 'pass1234' });
    committeeToken = loginCommittee.body.token;
    const loginUser = await request(app).post('/api/auth/login').send({ email: 'u@test.com', password: 'pass1234' });
    communityToken = loginUser.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('GET /api/mosques/public lists active mosques', async () => {
    const res = await request(app).get('/api/mosques/public');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((m) => String(m._id) === String(mosque._id))).toBe(true);
  });

  test('auth /me works with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeTruthy();
  });

  test('donations: admin can create cash donation (mosque scoped)', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ donorName: 'X', amount: 500, type: 'Zakat', paymentMethod: 'Cash' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mosqueId).toBe(String(mosque._id));
  });

  test('donations: top donors excludes anonymous', async () => {
    await Donation.create({ donorName: 'Anon', amount: 1000, type: 'Zakat', isAnonymous: true, mosqueId: mosque._id });
    await Donation.create({ donorName: 'Named', amount: 2000, type: 'Zakat', isAnonymous: false, mosqueId: mosque._id });

    const res = await request(app).get(`/api/donations/top-donors?mosqueId=${mosque._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.find((d) => d.name === 'Anon')).toBeFalsy();
    expect(res.body.data.find((d) => d.name === 'Named')).toBeTruthy();
  });

  test('fund request flow: community submit -> committee approve', async () => {
    const create = await request(app)
      .post('/api/fund-requests')
      .set('Authorization', `Bearer ${communityToken}`)
      .send({
        requesterName: 'Need Help',
        requesterEmail: 'need@test.com',
        requesterPhone: '0300',
        amount: 1000,
        category: 'Medical',
        reason: 'Need help for medical treatment and bills are too high for my family.',
        mosqueId: String(mosque._id),
      });
    expect(create.status).toBe(201);
    const id = create.body.data._id;

    const listForCommittee = await request(app)
      .get('/api/fund-requests')
      .set('Authorization', `Bearer ${committeeToken}`);
    expect(listForCommittee.status).toBe(200);
    expect(listForCommittee.body.data.find((r) => r._id === id)).toBeTruthy();

    const approve = await request(app)
      .put(`/api/fund-requests/${id}`)
      .set('Authorization', `Bearer ${committeeToken}`)
      .send({ status: 'approved', reviewNote: 'Verified' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('approved');
    expect(approve.body.data.reviewedBy.name).toBe(committeeUser.name);
  });
});

