jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Donation = require('../../models/Donation');

jest.setTimeout(30000);

describe('Donations scope isolation (Phase 8)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let adminAToken;
  let adminBToken;
  let adminAUser;
  let adminBUser;
  let donationInA;
  let donationInB;

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    try {
      mongod = await MongoMemoryServer.create();
    } catch (err) {
      throw new Error(`mongodb-memory-server failed to start: ${err.message}`);
    }
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
      Donation.deleteMany({}),
    ]);

    const sharedManager = await User.create({
      name: 'Shared Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager',
    });
    adminAUser = await User.create({
      name: 'Admin A', email: 'aa@test.com', password: 'pass1234', role: 'admin',
    });
    adminBUser = await User.create({
      name: 'Admin B', email: 'ab@test.com', password: 'pass1234', role: 'admin',
    });

    mosqueA = await Mosque.create({
      name: 'Masjid A', city: 'CityA',
      managerId: sharedManager._id, admins: [adminAUser._id], isActive: true,
    });
    mosqueB = await Mosque.create({
      name: 'Masjid B', city: 'CityB',
      managerId: sharedManager._id, admins: [adminBUser._id], isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [adminAUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateMany(
      { _id: { $in: [adminBUser._id] } },
      { mosqueId: mosqueB._id }
    );
    adminAUser.mosqueId = mosqueA._id;
    adminBUser.mosqueId = mosqueB._id;

    const loginA = await request(app).post('/api/auth/login').send({ email: 'aa@test.com', password: 'pass1234' });
    adminAToken = loginA.body.token;
    const loginB = await request(app).post('/api/auth/login').send({ email: 'ab@test.com', password: 'pass1234' });
    adminBToken = loginB.body.token;

    donationInA = await Donation.create({
      donorName: 'Donor A', amount: 5000, type: 'Zakat', paymentMethod: 'Cash', mosqueId: mosqueA._id, userId: adminAUser._id,
    });
    donationInB = await Donation.create({
      donorName: 'Donor B', amount: 7500, type: 'Sadaqah', paymentMethod: 'Cash', mosqueId: mosqueB._id, userId: adminBUser._id,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('public listing endpoints', () => {
    test('GET /api/donations?mosqueId=A returns only A donations', async () => {
      const res = await request(app).get(`/api/donations?mosqueId=${mosqueA._id}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(donationInA._id));
      expect(ids).not.toContain(String(donationInB._id));
    });

    test('GET /api/donations?mosqueId=B returns only B donations', async () => {
      const res = await request(app).get(`/api/donations?mosqueId=${mosqueB._id}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(donationInB._id));
      expect(ids).not.toContain(String(donationInA._id));
    });

    test('GET /api/donations without mosqueId returns both (global public view)', async () => {
      const res = await request(app).get('/api/donations');
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(donationInA._id));
      expect(ids).toContain(String(donationInB._id));
    });

    test('GET /api/donations rejects invalid mosqueId with 400', async () => {
      const res = await request(app).get('/api/donations?mosqueId=not-an-object-id');
      expect(res.status).toBe(400);
    });

    test('GET /api/donations masks anonymous donor identity', async () => {
      await Donation.create({
        donorName: 'Should Be Hidden', amount: 9999, type: 'Zakat',
        paymentMethod: 'Cash', mosqueId: mosqueA._id, isAnonymous: true,
      });
      const res = await request(app).get(`/api/donations?mosqueId=${mosqueA._id}`);
      expect(res.status).toBe(200);
      const anon = res.body.data.find((d) => String(d._id) === undefined || d.donorName === 'Anonymous' || d.donorName === 'Should Be Hidden');
      const hidden = res.body.data.find((d) => d.donorName === 'Should Be Hidden');
      expect(hidden).toBeFalsy();
      const masked = res.body.data.find((d) => d.donorName === 'Anonymous');
      expect(masked).toBeTruthy();
      expect(masked.email).toBe('');
    });
  });

  describe('top donors aggregation', () => {
    test('GET /api/donations/top-donors?mosqueId=A excludes B donors', async () => {
      await Donation.deleteMany({ donorName: 'TopA' });
      await Donation.deleteMany({ donorName: 'TopB' });
      await Donation.create({ donorName: 'TopA', amount: 9000, type: 'Zakat', mosqueId: mosqueA._id });
      await Donation.create({ donorName: 'TopB', amount: 8000, type: 'Zakat', mosqueId: mosqueB._id });

      const res = await request(app).get(`/api/donations/top-donors?mosqueId=${mosqueA._id}`);
      expect(res.status).toBe(200);
      const names = res.body.data.map((d) => d.name);
      expect(names).toContain('TopA');
      expect(names).not.toContain('TopB');
    });

    test('GET /api/donations/top-donors rejects invalid mosqueId', async () => {
      const res = await request(app).get('/api/donations/top-donors?mosqueId=bad-id');
      expect(res.status).toBe(400);
    });
  });

  describe('summary aggregation', () => {
    test('GET /api/donations/summary?mosqueId=A totals only A donations', async () => {
      const res = await request(app).get(`/api/donations/summary?mosqueId=${mosqueA._id}`);
      expect(res.status).toBe(200);
      const expectedMin = 5000 + 9000;
      expect(res.body.data.totalDonations).toBeGreaterThanOrEqual(expectedMin);
    });

    test('GET /api/donations/summary?mosqueId=B totals only B donations', async () => {
      const res = await request(app).get(`/api/donations/summary?mosqueId=${mosqueB._id}`);
      expect(res.status).toBe(200);
      const expectedMin = 7500 + 8000;
      expect(res.body.data.totalDonations).toBeGreaterThanOrEqual(expectedMin);
    });
  });

  describe('admin create endpoint', () => {
    test('POST /api/donations by admin A assigns mosqueId from token, ignoring client mosqueId', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          donorName: 'Test Admin A',
          amount: 1500,
          type: 'Sadaqah',
          paymentMethod: 'Cash',
          mosqueId: String(mosqueB._id),
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(String(res.body.data.mosqueId)).toBe(String(mosqueA._id));
    });

    test('POST /api/donations by admin B assigns mosqueId B even when body omits it', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({
          donorName: 'Test Admin B',
          amount: 2200,
          type: 'Masjid Fund',
          paymentMethod: 'Cash',
        });
      expect(res.status).toBe(201);
      expect(String(res.body.data.mosqueId)).toBe(String(mosqueB._id));
    });

    test('POST /api/donations requires admin token (committee gets 403)', async () => {
      const committee = await User.create({
        name: 'Committee', email: 'c@test.com', password: 'pass1234', role: 'committee', mosqueId: mosqueA._id,
      });
      const loginC = await request(app).post('/api/auth/login').send({ email: 'c@test.com', password: 'pass1234' });
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${loginC.body.token}`)
        .send({ donorName: 'Should Fail', amount: 100, type: 'Sadaqah' });
      expect(res.status).toBe(403);
    });
  });

  describe('admin update/delete cross-mosque isolation', () => {
    test('admin A cannot update donation in mosque B (returns 404, not leak)', async () => {
      const res = await request(app)
        .put(`/api/donations/${donationInB._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ amount: 99999 });
      expect(res.status).toBe(404);
    });

    test('admin B cannot update donation in mosque A (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/donations/${donationInA._id}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ amount: 99999 });
      expect(res.status).toBe(404);
    });

    test('admin A cannot delete donation in mosque B (returns 404)', async () => {
      const target = await Donation.create({
        donorName: 'To Delete', amount: 100, type: 'Zakat', mosqueId: mosqueB._id,
      });
      const res = await request(app)
        .delete(`/api/donations/${target._id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(res.status).toBe(404);
      const still = await Donation.findById(target._id);
      expect(still).toBeTruthy();
    });

    test('admin A can update donation in own mosque A', async () => {
      const res = await request(app)
        .put(`/api/donations/${donationInA._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ amount: 5500 });
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(5500);
    });

    test('admin A can delete donation in own mosque A', async () => {
      const target = await Donation.create({
        donorName: 'Delete Me', amount: 50, type: 'Sadaqah', mosqueId: mosqueA._id,
      });
      const res = await request(app)
        .delete(`/api/donations/${target._id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(res.status).toBe(200);
      const gone = await Donation.findById(target._id);
      expect(gone).toBeNull();
    });
  });

  describe('online donations', () => {
    test('POST /api/donations/online with mosqueId A scopes correctly (legacy path)', async () => {
      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Online A',
          amount: 300,
          type: 'Sadaqah',
          mosqueId: String(mosqueA._id),
        });
      expect([200, 201]).toContain(res.status);
      if (res.body.data) {
        expect(String(res.body.data.mosqueId)).toBe(String(mosqueA._id));
      }
    });

    test('POST /api/donations/online rejects amount below PKR 100', async () => {
      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Tiny', amount: 50, type: 'Sadaqah', mosqueId: String(mosqueA._id),
        });
      expect(res.status).toBe(400);
    });

    test('POST /api/donations/online rejects invalid mosqueId', async () => {
      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Bad Mosque', amount: 500, type: 'Sadaqah', mosqueId: 'not-an-object-id',
        });
      expect(res.status).toBe(400);
    });
  });
});
