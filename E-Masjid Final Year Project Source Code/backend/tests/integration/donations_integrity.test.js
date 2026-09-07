jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const mockStripeSessionCreate = jest.fn();
const mockStripeSessionRetrieve = jest.fn();
const mockStripeConstructEvent = jest.fn();

jest.mock('stripe', () => {
  const factory = jest.fn(() => ({
    checkout: {
      sessions: {
        create: (...args) => mockStripeSessionCreate(...args),
        retrieve: (...args) => mockStripeSessionRetrieve(...args),
      },
    },
    webhooks: {
      constructEvent: (...args) => mockStripeConstructEvent(...args),
    },
  }));
  return factory;
});

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Donation = require('../../models/Donation');

jest.setTimeout(30000);

describe('Donation integrity (BUG-30)', () => {
  let mongod;
  let admin;
  let manager;
  let mosque;
  let realStripeKey;

  beforeAll(async () => {
    realStripeKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_real_looking_key_for_integrity_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
    process.env.CLIENT_URL = 'http://localhost:5173';

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

    manager = await User.create({ name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager' });
    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'pass1234', role: 'admin' });
    mosque = await Mosque.create({
      name: 'Test Masjid', city: 'Sheikhupura',
      managerId: manager._id, admins: [admin._id], isActive: true,
    });
    await User.updateOne({ _id: admin._id }, { mosqueId: mosque._id });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    if (realStripeKey) process.env.STRIPE_SECRET_KEY = realStripeKey;
    else delete process.env.STRIPE_SECRET_KEY;
  });

  beforeEach(() => {
    mockStripeSessionCreate.mockReset();
    mockStripeSessionRetrieve.mockReset();
    mockStripeConstructEvent.mockReset();
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test_session_' + Math.random().toString(36).slice(2),
      url: 'https://checkout.stripe.com/test',
      payment_status: 'unpaid',
      status: 'open',
    });
  });

  describe('Group 1: Stripe-first ordering — no DB row on Stripe failure', () => {
    test('Stripe rejects with amount-too-low: NO donation row created in DB', async () => {
      mockStripeSessionCreate.mockRejectedValueOnce(
        new Error('Checkout Session\'s total amount must convert to at least 50 cents. Rs100.00 converts to approximately $0.36.')
      );

      const before = await Donation.countDocuments({});

      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Too Low',
          amount: 100,
          type: 'Sadaqah',
          mosqueId: String(mosque._id),
        });

      expect(res.status).toBe(500);
      const after = await Donation.countDocuments({});
      expect(after).toBe(before);
    });

    test('Stripe rejects with network error: NO donation row created in DB', async () => {
      mockStripeSessionCreate.mockRejectedValueOnce(new Error('Stripe API connection failed'));

      const before = await Donation.countDocuments({});

      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Network Err',
          amount: 1000,
          type: 'Masjid Fund',
          mosqueId: String(mosque._id),
        });

      expect(res.status).toBe(500);
      const after = await Donation.countDocuments({});
      expect(after).toBe(before);
    });

    test('happy path: Stripe succeeds then ONE donation row created with pending status', async () => {
      const before = await Donation.countDocuments({});

      const res = await request(app)
        .post('/api/donations/online')
        .send({
          donorName: 'Happy Path',
          amount: 1500,
          type: 'Zakat',
          mosqueId: String(mosque._id),
        });

      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://checkout.stripe.com/test');
      const createdSession = await mockStripeSessionCreate.mock.results[0].value;
      const createdSessionId = createdSession.id;

      const after = await Donation.countDocuments({});
      expect(after).toBe(before + 1);

      const donation = await Donation.findOne({ donorName: 'Happy Path' });
      expect(donation.status).toBe('pending');
      expect(donation.stripeSessionId).toBe(createdSessionId);
      expect(donation.amount).toBe(1500);
      expect(donation.paymentMethod).toBe('Online');
    });
  });

  describe('Group 2: public list filters to completed only by default', () => {
    test('public list excludes pending rows', async () => {
      const completed = await Donation.create({
        donorName: 'Completed Donor', amount: 1000, type: 'Sadaqah',
        paymentMethod: 'Online', status: 'completed', stripeSessionId: 'cs_completed', mosqueId: mosque._id,
      });
      const pending = await Donation.create({
        donorName: 'Pending Donor', amount: 500, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_pending', mosqueId: mosque._id,
      });
      const failed = await Donation.create({
        donorName: 'Failed Donor', amount: 300, type: 'Sadaqah',
        paymentMethod: 'Online', status: 'failed', stripeSessionId: 'cs_failed', mosqueId: mosque._id,
      });

      const res = await request(app).get(`/api/donations?mosqueId=${mosque._id}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(completed._id));
      expect(ids).not.toContain(String(pending._id));
      expect(ids).not.toContain(String(failed._id));
    });

    test('public list with ?status=pending shows pending rows', async () => {
      const pending = await Donation.create({
        donorName: 'Visible Pending', amount: 500, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_pending_2', mosqueId: mosque._id,
      });

      const res = await request(app).get(`/api/donations?mosqueId=${mosque._id}&status=pending`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(pending._id));
    });

    test('public list rejects invalid status value', async () => {
      const res = await request(app).get(`/api/donations?mosqueId=${mosque._id}&status=garbage`);
      expect(res.status).toBe(400);
    });
  });

  describe('Group 3: admin list defaults to completed and accepts ?status=', () => {
    let adminToken;
    let managerToken;

    beforeAll(async () => {
      const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'pass1234' });
      adminToken = adminLogin.body.token;
      const mgrLogin = await request(app).post('/api/auth/login').send({ email: 'mgr@test.com', password: 'pass1234' });
      managerToken = mgrLogin.body.token;
    });

    test('admin default list shows only completed', async () => {
      const pending = await Donation.create({
        donorName: 'Admin Pending', amount: 500, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_admin_pending', mosqueId: mosque._id,
      });
      const res = await request(app)
        .get(`/api/donations/admin?mosqueId=${mosque._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).not.toContain(String(pending._id));
    });

    test('admin ?status=pending shows pending rows for reconciliation', async () => {
      const pending = await Donation.create({
        donorName: 'Admin Pending Reconcile', amount: 500, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_admin_pending_reconcile', mosqueId: mosque._id,
      });
      const res = await request(app)
        .get(`/api/donations/admin?mosqueId=${mosque._id}&status=pending`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).toContain(String(pending._id));
    });

    test('manager admin list also defaults to completed', async () => {
      const pending = await Donation.create({
        donorName: 'Manager Pending', amount: 500, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_mgr_pending', mosqueId: mosque._id,
      });
      const res = await request(app)
        .get(`/api/donations/admin`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((d) => String(d._id));
      expect(ids).not.toContain(String(pending._id));
    });
  });

  describe('Group 4: aggregates exclude non-completed', () => {
    test('summary excludes pending and failed donations', async () => {
      const beforeRes = await request(app).get(`/api/donations/summary?mosqueId=${mosque._id}`);
      const beforeTotal = beforeRes.body.data.totalDonations;

      await Donation.create({
        donorName: 'Aggregate Pending', amount: 9999, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_agg_pending', mosqueId: mosque._id,
      });
      await Donation.create({
        donorName: 'Aggregate Failed', amount: 8888, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'failed', stripeSessionId: 'cs_agg_failed', mosqueId: mosque._id,
      });
      await Donation.create({
        donorName: 'Aggregate Completed', amount: 100, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'completed', stripeSessionId: 'cs_agg_completed', mosqueId: mosque._id,
      });

      const res = await request(app).get(`/api/donations/summary?mosqueId=${mosque._id}`);
      expect(res.body.data.totalDonations).toBe(beforeTotal + 100);
    });

    test('top donors only includes completed donations', async () => {
      await Donation.create({
        donorName: 'TopPending Fake', amount: 99999, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'pending', stripeSessionId: 'cs_top_pending', mosqueId: mosque._id, isAnonymous: false,
      });
      await Donation.create({
        donorName: 'TopCompleted Real', amount: 50, type: 'Masjid Fund',
        paymentMethod: 'Online', status: 'completed', stripeSessionId: 'cs_top_completed', mosqueId: mosque._id, isAnonymous: false,
      });

      const res = await request(app).get(`/api/donations/top-donors?mosqueId=${mosque._id}`);
      expect(res.status).toBe(200);
      const names = res.body.data.map((d) => d.name);
      expect(names).not.toContain('TopPending Fake');
      expect(names).toContain('TopCompleted Real');
    });
  });

  describe('Group 5: missing Stripe key returns 503, no DB row, status endpoint reports it', () => {
    test('status endpoint reports unavailable when key is missing', async () => {
      const savedKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      try {
        const res = await request(app).get('/api/donations/status');
        expect(res.status).toBe(200);
        expect(res.body.data.onlineAvailable).toBe(false);
      } finally {
        process.env.STRIPE_SECRET_KEY = savedKey;
      }
    });

    test('status endpoint reports available when key is present', async () => {
      const res = await request(app).get('/api/donations/status');
      expect(res.status).toBe(200);
      expect(res.body.data.onlineAvailable).toBe(true);
    });

    test('POST online with no Stripe key returns 503, no DB row', async () => {
      const savedKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      try {
        const before = await Donation.countDocuments({});
        const res = await request(app)
          .post('/api/donations/online')
          .send({
            donorName: 'No Stripe',
            amount: 500,
            type: 'Sadaqah',
            mosqueId: String(mosque._id),
          });
        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        const after = await Donation.countDocuments({});
        expect(after).toBe(before);
      } finally {
        process.env.STRIPE_SECRET_KEY = savedKey;
      }
    });

    test('POST online with placeholder Stripe key returns 503', async () => {
      const savedKey = process.env.STRIPE_SECRET_KEY;
      process.env.STRIPE_SECRET_KEY = 'sk_test_your_test_key_here';
      try {
        const res = await request(app)
          .post('/api/donations/online')
          .send({
            donorName: 'Placeholder Key',
            amount: 500,
            type: 'Sadaqah',
            mosqueId: String(mosque._id),
          });
        expect(res.status).toBe(503);
      } finally {
        process.env.STRIPE_SECRET_KEY = savedKey;
      }
    });
  });
});
