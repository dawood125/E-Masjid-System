jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const FundRequest = require('../../models/FundRequest');

jest.setTimeout(30000);

function validRequestBody(overrides = {}) {
  return {
    requesterName: 'Bilal Ahmed',
    requesterEmail: 'bilal@example.com',
    requesterPhone: '03001234567',
    amount: 25000,
    category: 'Medical',
    reason: 'My mother needs urgent surgery and we cannot afford the hospital bill right now.',
    ...overrides,
  };
}

async function createRequest(token, overrides = {}) {
  const res = await request(app)
    .post('/api/fund-requests')
    .set('Authorization', `Bearer ${token}`)
    .send(validRequestBody(overrides));
  expect(res.status).toBe(201);
  return res.body.data;
}

describe('Fund voting + finalize (Phase 13)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let adminAUser;
  let adminBUser;
  let committee1AUser;
  let committee2AUser;
  let committee3AUser;
  let committee1BUser;
  let adminAToken;
  let adminBToken;
  let committee1AToken;
  let committee2AToken;
  let committee3AToken;
  let committee1BToken;
  let userAUser;
  let userBUser;
  let userAToken;
  let userBToken;

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
      FundRequest.deleteMany({}),
    ]);

    const manager = await User.create({
      name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager',
    });

    adminAUser = await User.create({
      name: 'Admin A', email: 'aa@test.com', password: 'pass1234', role: 'admin',
    });
    adminBUser = await User.create({
      name: 'Admin B', email: 'ab@test.com', password: 'pass1234', role: 'admin',
    });
    committee1AUser = await User.create({
      name: 'Committee A1', email: 'c1a@test.com', password: 'pass1234', role: 'committee',
    });
    committee2AUser = await User.create({
      name: 'Committee A2', email: 'c2a@test.com', password: 'pass1234', role: 'committee',
    });
    committee3AUser = await User.create({
      name: 'Committee A3', email: 'c3a@test.com', password: 'pass1234', role: 'committee',
    });
    committee1BUser = await User.create({
      name: 'Committee B1', email: 'c1b@test.com', password: 'pass1234', role: 'committee',
    });
    userAUser = await User.create({
      name: 'User A', email: 'ua@test.com', password: 'pass1234', role: 'community',
    });
    userBUser = await User.create({
      name: 'User B', email: 'ub@test.com', password: 'pass1234', role: 'community',
    });

    mosqueA = await Mosque.create({
      name: 'Masjid A', city: 'CityA',
      managerId: manager._id, admins: [adminAUser._id], isActive: true,
    });
    mosqueB = await Mosque.create({
      name: 'Masjid B', city: 'CityB',
      managerId: manager._id, admins: [adminBUser._id], isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [adminAUser._id, committee1AUser._id, committee2AUser._id, committee3AUser._id, userAUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateMany(
      { _id: { $in: [adminBUser._id, committee1BUser._id, userBUser._id] } },
      { mosqueId: mosqueB._id }
    );

    adminAToken = (await request(app).post('/api/auth/login').send({ email: 'aa@test.com', password: 'pass1234' })).body.token;
    adminBToken = (await request(app).post('/api/auth/login').send({ email: 'ab@test.com', password: 'pass1234' })).body.token;
    committee1AToken = (await request(app).post('/api/auth/login').send({ email: 'c1a@test.com', password: 'pass1234' })).body.token;
    committee2AToken = (await request(app).post('/api/auth/login').send({ email: 'c2a@test.com', password: 'pass1234' })).body.token;
    committee3AToken = (await request(app).post('/api/auth/login').send({ email: 'c3a@test.com', password: 'pass1234' })).body.token;
    committee1BToken = (await request(app).post('/api/auth/login').send({ email: 'c1b@test.com', password: 'pass1234' })).body.token;
    userAToken = (await request(app).post('/api/auth/login').send({ email: 'ua@test.com', password: 'pass1234' })).body.token;
    userBToken = (await request(app).post('/api/auth/login').send({ email: 'ub@test.com', password: 'pass1234' })).body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Public access', () => {
    test('GET /api/fund-requests without token returns 401', async () => {
      const res = await request(app).get('/api/fund-requests');
      expect(res.status).toBe(401);
    });

    test('POST /api/fund-requests without token returns 401', async () => {
      const res = await request(app).post('/api/fund-requests').send(validRequestBody());
      expect(res.status).toBe(401);
    });

    test('POST /:id/vote without token returns 401', async () => {
      const res = await request(app)
        .post('/api/fund-requests/64c000000000000000000000/vote')
        .send({ vote: 'approve' });
      expect(res.status).toBe(401);
    });

    test('POST /:id/finalize without token returns 401', async () => {
      const res = await request(app)
        .post('/api/fund-requests/64c000000000000000000000/finalize')
        .send({ finalNote: 'Approved after meeting' });
      expect(res.status).toBe(401);
    });
  });

  describe('Community submit + list', () => {
    test('community can submit a request for own masjid', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validRequestBody({ requesterName: 'Sumera Bibi' }));
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(String(res.body.data.mosqueId)).toBe(String(mosqueA._id));
      expect(String(res.body.data.userId)).toBe(String(userAUser._id));
      expect(res.body.data.votes).toEqual([]);
    });

    test('community cannot submit for another mosque (400)', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validRequestBody({ mosqueId: String(mosqueB._id) }));
      expect(res.status).toBe(400);
    });

    test('reason must be at least 30 chars (400)', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validRequestBody({ reason: 'short' }));
      expect(res.status).toBe(400);
    });

    test('amount must be a positive number (400)', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validRequestBody({ amount: 0 }));
      expect(res.status).toBe(400);
    });

    test('category must be from the allowed enum (400)', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validRequestBody({ category: 'NotARealCategory' }));
      expect(res.status).toBe(400);
    });

    test('committee cannot submit a request (403)', async () => {
      const res = await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send(validRequestBody());
      expect(res.status).toBe(403);
    });

    test('community list returns only own requests', async () => {
      await createRequest(userAToken, { requesterName: 'Owner Check' });
      const res = await request(app)
        .get('/api/fund-requests')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBeGreaterThan(0);
      list.forEach((r) => {
        expect(String(r.userId?._id || r.userId)).toBe(String(userAUser._id));
      });
    });

    test('admin list is mosque-scoped (A admin sees only mosque A)', async () => {
      await createRequest(userAToken, { requesterName: 'A side' });
      await request(app)
        .post('/api/fund-requests')
        .set('Authorization', `Bearer ${userBToken}`)
        .send(validRequestBody({ requesterName: 'B side', requesterEmail: 'b@example.com' }));

      const listA = await request(app)
        .get('/api/fund-requests')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(listA.status).toBe(200);
      listA.body.data.forEach((r) => {
        expect(String(r.mosqueId?._id || r.mosqueId)).toBe(String(mosqueA._id));
      });

      const listB = await request(app)
        .get('/api/fund-requests')
        .set('Authorization', `Bearer ${adminBToken}`);
      listB.body.data.forEach((r) => {
        expect(String(r.mosqueId?._id || r.mosqueId)).toBe(String(mosqueB._id));
      });
    });
  });

  describe('Committee voting', () => {
    test('committee can cast an approve vote (200, recorded)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Vote Test 1' });
      const vote = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve', note: 'Saw the receipt, recommend support' });
      expect(vote.status).toBe(200);
      expect(vote.body.data.votes).toHaveLength(1);
      expect(vote.body.data.votes[0].vote).toBe('approve');
      expect(String(vote.body.data.votes[0].member._id || vote.body.data.votes[0].member)).toBe(String(committee1AUser._id));
    });

    test('committee can change their vote (re-vote replaces)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Vote Change' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      const second = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'reject' });
      expect(second.status).toBe(200);
      expect(second.body.data.votes).toHaveLength(1);
      expect(second.body.data.votes[0].vote).toBe('reject');
    });

    test('vote persists one entry per committee member', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Multi Vote' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'reject' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee3AToken}`)
        .send({ vote: 'approve' });

      const after = await FundRequest.findById(created._id);
      const memberIds = after.votes.map((v) => String(v.member));
      expect(after.votes).toHaveLength(3);
      expect(new Set(memberIds).size).toBe(3);
    });

    test('cannot vote on already-finalized request (409)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Late Vote' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee3AToken}`)
        .send({ vote: 'reject' });
      const finalize = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ finalNote: 'Final decision recorded' });
      expect(finalize.body.data.status).toBe('approved');

      const late = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee3AToken}`)
        .send({ vote: 'approve' });
      expect(late.status).toBe(409);
    });

    test('vote requires a valid enum value (400)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Bad Vote' });
      const bad = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'maybe' });
      expect(bad.status).toBe(400);
    });

    test('admin cannot vote (committee-only, 403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Admin Vote' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ vote: 'approve' });
      expect(evil.status).toBe(403);
    });

    test('community cannot vote (403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'User Vote' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ vote: 'approve' });
      expect(evil.status).toBe(403);
    });

    test('committee from another mosque cannot vote (403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Cross Mosque Vote' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1BToken}`)
        .send({ vote: 'approve' });
      expect(evil.status).toBe(403);
    });
  });

  describe('Admin finalize', () => {
    test('majority approve → status approved (200)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Approved Path' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee3AToken}`)
        .send({ vote: 'reject' });

      const final = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ finalNote: 'Approved by majority vote' });
      expect(final.status).toBe(200);
      expect(final.body.data.status).toBe('approved');
      expect(String(final.body.data.finalizedBy?._id || final.body.data.finalizedBy)).toBe(String(adminAUser._id));
      expect(final.body.data.finalNote).toBe('Approved by majority vote');
      expect(final.body.data.finalizedAt).toBeTruthy();
    });

    test('majority reject → status rejected (200)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Rejected Path' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'reject' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'reject' });

      const final = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ finalNote: 'Rejected after investigation' });
      expect(final.status).toBe(200);
      expect(final.body.data.status).toBe('rejected');
    });

    test('tied votes require overrideStatus (otherwise 409)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Tied Path' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'reject' });

      const noOverride = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({});
      expect(noOverride.status).toBe(409);
      expect(noOverride.body.message).toMatch(/tied/i);

      const overrideApprove = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ overrideStatus: 'approved', finalNote: 'Admin overrides tie in favor' });
      expect(overrideApprove.status).toBe(200);
      expect(overrideApprove.body.data.status).toBe('approved');
    });

    test('cannot finalize with zero votes (400)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'No Votes' });
      const final = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ finalNote: 'Rush' });
      expect(final.status).toBe(400);
    });

    test('cannot finalize twice (409 on the second attempt)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Double Finalize' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      const first = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({});
      expect(first.status).toBe(200);
      const second = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({});
      expect(second.status).toBe(409);
    });

    test('community cannot finalize (403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'User Finalize' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});
      expect(evil.status).toBe(403);
    });

    test('committee cannot finalize (admin-only, 403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Committee Finalize' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({});
      expect(evil.status).toBe(403);
    });

    test('admin of another mosque cannot finalize (403)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Cross Finalize' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/finalize`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({});
      expect(evil.status).toBe(403);
    });
  });

  describe('Voting then deactivation', () => {
    test('committee deactivated mid-flow cannot change vote (401)', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Deactivate Mid Vote' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await User.updateOne({ _id: committee2AUser._id }, { isActive: false });
      const evil = await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'reject' });
      expect(evil.status).toBe(401);
      await User.updateOne({ _id: committee2AUser._id }, { isActive: true });
    });
  });

  describe('Race conditions (concurrent finalize)', () => {
    test('two simultaneous finalize attempts — only one wins', async () => {
      const created = await createRequest(userAToken, { requesterName: 'Race Finalize' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee1AToken}`)
        .send({ vote: 'approve' });
      await request(app)
        .post(`/api/fund-requests/${created._id}/vote`)
        .set('Authorization', `Bearer ${committee2AToken}`)
        .send({ vote: 'approve' });

      const [first, second] = await Promise.all([
        request(app)
          .post(`/api/fund-requests/${created._id}/finalize`)
          .set('Authorization', `Bearer ${adminAToken}`)
          .send({}),
        request(app)
          .post(`/api/fund-requests/${created._id}/finalize`)
          .set('Authorization', `Bearer ${adminAToken}`)
          .send({}),
      ]);

      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([200, 409]);

      const after = await FundRequest.findById(created._id);
      expect(after.status).toBe('approved');
      expect(after.finalizedBy).toBeTruthy();
    });
  });
});