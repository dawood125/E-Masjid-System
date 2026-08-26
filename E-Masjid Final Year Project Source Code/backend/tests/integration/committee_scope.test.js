jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const FundRequest = require('../../models/FundRequest');

jest.setTimeout(30000);

describe('Committee account management + deactivate-mid-vote (Phase 15)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let adminAUser;
  let adminBUser;
  let adminAToken;
  let adminBToken;
  let commA1User;
  let commA1Token;
  let commA2User;
  let commA2Token;
  let commA3User;
  let communityUser;
  let communityToken;

  async function login(email) {
    const r = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'pass1234' });
    return r.body.token;
  }

  async function createPendingRequest(requesterName = 'Test Requester') {
    const r = await request(app)
      .post('/api/fund-requests')
      .set('Authorization', `Bearer ${communityToken}`)
      .send({
        requesterName,
        requesterEmail: 'req@example.com',
        requesterPhone: '0300-0000000',
        amount: 5000,
        category: 'Medical',
        reason: 'Phase 15 E2E — requester needs funds for urgent family medical expenses and ongoing treatment plan.',
      });
    return r.body.data._id;
  }

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
      binary: { systemBinary: 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe' },
      instance: { storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
      FundRequest.deleteMany({}),
    ]);

    const sharedManager = await User.create({
      name: 'Shared Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager',
    });
    adminAUser = await User.create({
      name: 'Admin A', email: 'admin.a@test.com', password: 'pass1234', role: 'admin',
    });
    adminBUser = await User.create({
      name: 'Admin B', email: 'admin.b@test.com', password: 'pass1234', role: 'admin',
    });
    commA1User = await User.create({
      name: 'Comm A1', email: 'comm.a1@test.com', password: 'pass1234', role: 'committee',
    });
    commA2User = await User.create({
      name: 'Comm A2', email: 'comm.a2@test.com', password: 'pass1234', role: 'committee',
    });
    commA3User = await User.create({
      name: 'Comm A3', email: 'comm.a3@test.com', password: 'pass1234', role: 'committee',
    });
    communityUser = await User.create({
      name: 'Community User', email: 'comm.user@test.com', password: 'pass1234', role: 'community',
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
      { _id: { $in: [adminAUser._id, commA1User._id, commA2User._id, commA3User._id, communityUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateOne(
      { _id: adminBUser._id },
      { mosqueId: mosqueB._id }
    );

    adminAToken = await login('admin.a@test.com');
    adminBToken = await login('admin.b@test.com');
    commA1Token = await login('comm.a1@test.com');
    commA2Token = await login('comm.a2@test.com');
    communityToken = await login('comm.user@test.com');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Admin Committee CRUD', () => {
    test('admin lists only own-mosque committee members', async () => {
      const r = await request(app)
        .get('/api/committee')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body.data)).toBe(true);
      const ids = r.body.data.map((m) => String(m._id));
      expect(ids).toContain(String(commA1User._id));
      expect(ids).toContain(String(commA2User._id));
      expect(ids).toContain(String(commA3User._id));
      expect(ids).not.toContain(String(adminAUser._id));
      expect(ids).not.toContain(String(adminBUser._id));
      expect(ids).not.toContain(String(communityUser._id));
    });

    test('non-admin cannot list committee', async () => {
      const r = await request(app)
        .get('/api/committee')
        .set('Authorization', `Bearer ${commA1Token}`);
      expect(r.status).toBe(403);
    });

    test('admin of another mosque sees empty list', async () => {
      const r = await request(app)
        .get('/api/committee')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(r.status).toBe(200);
      expect(r.body.data).toEqual([]);
    });

    test('admin can create committee member in own mosque', async () => {
      const r = await request(app)
        .post('/api/committee')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'New Comm', email: 'new.comm@test.com', phone: '0300-1112233' });
      expect(r.status).toBe(201);
      expect(r.body.data.email).toBe('new.comm@test.com');
      const inDb = await User.findOne({ email: 'new.comm@test.com' });
      expect(inDb.role).toBe('committee');
      expect(String(inDb.mosqueId)).toBe(String(mosqueA._id));
    });

    test('admin cannot create duplicate email', async () => {
      const r = await request(app)
        .post('/api/committee')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Dup Comm', email: 'comm.a1@test.com' });
      expect(r.status).toBe(400);
      expect(r.body.message).toMatch(/already registered/i);
    });

    test('admin cannot create member with invalid email', async () => {
      const r = await request(app)
        .post('/api/committee')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Bad Email', email: 'not-an-email' });
      expect(r.status).toBe(400);
    });

    test('admin cannot create member with too-short name', async () => {
      const r = await request(app)
        .post('/api/committee')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'A', email: 'too.short@test.com' });
      expect(r.status).toBe(400);
    });

    test('non-admin cannot create committee member', async () => {
      const r = await request(app)
        .post('/api/committee')
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ name: 'Sneaky Comm', email: 'sneaky@test.com' });
      expect(r.status).toBe(403);
    });

    test('admin can update own-mosque member name', async () => {
      const r = await request(app)
        .put(`/api/committee/${commA1User._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Comm A1 Updated' });
      expect(r.status).toBe(200);
      expect(r.body.data.name).toBe('Comm A1 Updated');
      const inDb = await User.findById(commA1User._id);
      expect(inDb.name).toBe('Comm A1 Updated');
    });

    test('admin can toggle isActive on own-mosque member', async () => {
      const r = await request(app)
        .put(`/api/committee/${commA2User._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(200);
      expect(r.body.data.isActive).toBe(false);
      const inDb = await User.findById(commA2User._id);
      expect(inDb.isActive).toBe(false);
    });

    test('admin cannot update member of another mosque', async () => {
      const r = await request(app)
        .put(`/api/committee/${commA1User._id}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ name: 'Hacked Name' });
      expect(r.status).toBe(404);
    });

    test('admin gets 400 for invalid update id', async () => {
      const r = await request(app)
        .put('/api/committee/not-an-id')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'X' });
      expect(r.status).toBe(400);
    });

    test('admin gets 404 for non-existent member id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const r = await request(app)
        .put(`/api/committee/${fakeId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Ghost' });
      expect(r.status).toBe(404);
    });

    test('admin can delete own-mosque member', async () => {
      const r = await request(app)
        .delete(`/api/committee/${commA3User._id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(r.status).toBe(200);
      const inDb = await User.findById(commA3User._id);
      expect(inDb).toBeNull();
    });

    test('admin cannot delete member of another mosque', async () => {
      const r = await request(app)
        .delete(`/api/committee/${commA1User._id}`)
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(r.status).toBe(404);
    });

    test('public access without token returns 401', async () => {
      const r = await request(app).get('/api/committee');
      expect(r.status).toBe(401);
    });
  });

  describe('Deactivate-mid-vote edge case', () => {
    beforeAll(async () => {
      await User.updateOne({ _id: commA2User._id }, { isActive: true });
    });

    test('deactivated member cannot log in', async () => {
      await User.updateOne({ _id: commA2User._id }, { isActive: false });
      const r = await request(app)
        .post('/api/auth/login')
        .send({ email: 'comm.a2@test.com', password: 'pass1234' });
      expect(r.status).toBe(403);
      expect(r.body.message).toMatch(/deactivated/i);
      await User.updateOne({ _id: commA2User._id }, { isActive: true });
    });

    test('old token of deactivated member is rejected on next request', async () => {
      const tokenBeforeDeactivate = commA2Token;
      await User.updateOne({ _id: commA2User._id }, { isActive: false });
      const r = await request(app)
        .get('/api/committee')
        .set('Authorization', `Bearer ${tokenBeforeDeactivate}`);
      expect(r.status).toBe(401);
      expect(r.body.message).toMatch(/deactivated/i);
      await User.updateOne({ _id: commA2User._id }, { isActive: true });
    });

    test('deactivated member cannot cast a vote even if already on the committee', async () => {
      const reqId = await createPendingRequest('Mid Vote Requester');
      await request(app)
        .post(`/api/fund-requests/${reqId}/vote`)
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ vote: 'approve' });
      const tallyMid = await FundRequest.findById(reqId);
      expect(tallyMid.votes.length).toBe(1);

      await User.updateOne({ _id: commA1User._id }, { isActive: false });

      const r = await request(app)
        .post(`/api/fund-requests/${reqId}/vote`)
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ vote: 'reject' });
      expect(r.status).toBe(401);

      const tallyAfter = await FundRequest.findById(reqId);
      expect(tallyAfter.votes.length).toBe(1);
      expect(tallyAfter.votes[0].vote).toBe('approve');

      await User.updateOne({ _id: commA1User._id }, { isActive: true });
    });

    test('notifyCommittee skips deactivated members', async () => {
      await User.updateOne({ _id: commA2User._id }, { isActive: false });

      const sendEmail = require('../../utils/sendEmail');
      sendEmail.mockClear();

      const r = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${communityToken}`)
        .send({
          requesterName: 'Notify Skip Requester',
          requesterEmail: 'req.skip@example.com',
          requesterPhone: '0300-0000099',
          amount: 7000,
          category: 'Medical',
          reason: 'Phase 15 notify-skip test — ensure deactivated committee member does not receive notification email.',
        });
      expect(r.status).toBe(201);

      const recipients = sendEmail.mock.calls.map((c) => c[0].to);
      expect(recipients).toContain('comm.a1@test.com');
      expect(recipients).not.toContain('comm.a2@test.com');
      expect(recipients.every((r) => r !== 'comm.a2@test.com')).toBe(true);

      await User.updateOne({ _id: commA2User._id }, { isActive: true });
    });

    test('re-activated member can vote again on the same request', async () => {
      const reqId = await createPendingRequest('Reactivate Requester');
      await request(app)
        .post(`/api/fund-requests/${reqId}/vote`)
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ vote: 'approve' });

      await User.updateOne({ _id: commA1User._id }, { isActive: false });
      const blocked = await request(app)
        .post(`/api/fund-requests/${reqId}/vote`)
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ vote: 'reject' });
      expect(blocked.status).toBe(401);

      await User.updateOne({ _id: commA1User._id }, { isActive: true });
      const ok = await request(app)
        .post(`/api/fund-requests/${reqId}/vote`)
        .set('Authorization', `Bearer ${commA1Token}`)
        .send({ vote: 'reject' });
      expect(ok.status).toBe(200);
      const tally = await FundRequest.findById(reqId);
      expect(tally.votes.length).toBe(1);
      expect(tally.votes[0].vote).toBe('reject');
    });
  });
});