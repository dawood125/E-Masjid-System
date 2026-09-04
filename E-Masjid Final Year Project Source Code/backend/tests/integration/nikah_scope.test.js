jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const NikahBooking = require('../../models/NikahBooking');

jest.setTimeout(30000);

function tomorrowISO(daysAhead = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

function yesterdayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 1);
  return d.toISOString();
}

function bookingPayload(overrides = {}) {
  return {
    groomName: 'Groom',
    brideName: 'Bride',
    ceremonyDate: tomorrowISO(),
    ceremonyTime: '16:00',
    phone: '03001234567',
    email: 'test@example.com',
    address: 'House 1, Sheikhupura',
    ...overrides,
  };
}

describe('Nikah bookings module scope + behavior (Phase 12)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let adminAUser;
  let adminBUser;
  let adminAToken;
  let adminBToken;
  let scholarAUser;
  let scholarBUser;
  let scholarAToken;
  let scholarBToken;
  let committeeUser;
  let committeeToken;
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
      NikahBooking.deleteMany({}),
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
    committeeUser = await User.create({
      name: 'Committee', email: 'c@test.com', password: 'pass1234', role: 'committee',
    });
    userAUser = await User.create({
      name: 'User A', email: 'ua@test.com', password: 'pass1234', role: 'community',
    });
    userBUser = await User.create({
      name: 'User B', email: 'ub@test.com', password: 'pass1234', role: 'community',
    });
    scholarAUser = await User.create({
      name: 'Scholar A', email: 'sa@test.com', password: 'pass1234', role: 'scholar',
    });
    scholarBUser = await User.create({
      name: 'Scholar B', email: 'sb@test.com', password: 'pass1234', role: 'scholar',
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
      { _id: { $in: [adminAUser._id, committeeUser._id, scholarAUser._id, userAUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateMany(
      { _id: { $in: [adminBUser._id, scholarBUser._id, userBUser._id] } },
      { mosqueId: mosqueB._id }
    );

    adminAToken = (await request(app).post('/api/auth/login').send({ email: 'aa@test.com', password: 'pass1234' })).body.token;
    adminBToken = (await request(app).post('/api/auth/login').send({ email: 'ab@test.com', password: 'pass1234' })).body.token;
    scholarAToken = (await request(app).post('/api/auth/login').send({ email: 'sa@test.com', password: 'pass1234' })).body.token;
    scholarBToken = (await request(app).post('/api/auth/login').send({ email: 'sb@test.com', password: 'pass1234' })).body.token;
    committeeToken = (await request(app).post('/api/auth/login').send({ email: 'c@test.com', password: 'pass1234' })).body.token;
    userAToken = (await request(app).post('/api/auth/login').send({ email: 'ua@test.com', password: 'pass1234' })).body.token;
    userBToken = (await request(app).post('/api/auth/login').send({ email: 'ub@test.com', password: 'pass1234' })).body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Public access', () => {
    test('GET /api/nikah-bookings without token returns 401', async () => {
      const res = await request(app).get('/api/nikah-bookings');
      expect(res.status).toBe(401);
    });

    test('POST /api/nikah-bookings without token returns 401', async () => {
      const res = await request(app)
        .post('/api/nikah-bookings')
        .send({ groomName: 'X', brideName: 'Y', ceremonyDate: tomorrowISO(), ceremonyTime: '16:00', phone: '0300' });
      expect(res.status).toBe(401);
    });
  });

  describe('Community create + list + cancel', () => {
    test('community can create a booking for own masjid', async () => {
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Ahmad',
          brideName: 'Fatima',
          ceremonyDate: tomorrowISO(5),
          ceremonyTime: '16:00',
          phone: '03001234567',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
          notes: 'Please confirm soon.',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(String(res.body.data.mosqueId)).toBe(String(mosqueA._id));
      expect(String(res.body.data.userId)).toBe(String(userAUser._id));
      expect(res.body.data.groomName).toBe('Ahmad');
    });

    test('community list returns only own bookings', async () => {
      const res = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBeGreaterThan(0);
      list.forEach((b) => {
        expect(String(b.userId?._id || b.userId)).toBe(String(userAUser._id));
      });
    });

    test('community list scopes to current user.mosqueId (masjid switch hides other-masjid bookings)', async () => {
      const before = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(before.status).toBe(200);
      expect((before.body.data || []).length).toBeGreaterThan(0);

      await User.updateOne({ _id: userAUser._id }, { mosqueId: mosqueB._id });

      const afterSwitch = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(afterSwitch.status).toBe(200);
      expect(afterSwitch.body.data || []).toEqual([]);

      await User.updateOne({ _id: userAUser._id }, { mosqueId: mosqueA._id });

      const afterRestore = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(afterRestore.status).toBe(200);
      expect((afterRestore.body.data || []).length).toBeGreaterThan(0);
    });

    test('community cancel sets status to rejected with cancellation reason', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Bilal',
          brideName: 'Ayesha',
          ceremonyDate: tomorrowISO(6),
          ceremonyTime: '11:00',
          phone: '03009998877',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const cancel = await request(app)
        .put(`/api/nikah-bookings/${id}/cancel`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(cancel.status).toBe(200);
      expect(cancel.body.data.status).toBe('rejected');
      expect(cancel.body.data.rejectionReason).toBe('Cancelled by applicant');
      expect(cancel.body.data.scholarId).toBeUndefined();
    });

    test('community cannot cancel another user booking (403)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Cas',
          brideName: 'Dee',
          ceremonyDate: tomorrowISO(7),
          ceremonyTime: '12:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const evil = await request(app)
        .put(`/api/nikah-bookings/${id}/cancel`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(evil.status).toBe(403);
    });

    test('community cannot cancel an already accepted booking (409)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Eman',
          brideName: 'Fizz',
          ceremonyDate: tomorrowISO(8),
          ceremonyTime: '14:00',
          phone: '03007778888',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({
          status: 'accepted',
          confirmedDate: created.body.data.ceremonyDate,
          confirmedTime: created.body.data.ceremonyTime,
        });

      const cancel = await request(app)
        .put(`/api/nikah-bookings/${id}/cancel`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(cancel.status).toBe(409);
    });

    test('community cannot accept or reject (review is scholar/admin only)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Gee',
          brideName: 'Hee',
          ceremonyDate: tomorrowISO(9),
          ceremonyTime: '15:00',
          phone: '03006665544',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const tryAccept = await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'accepted' });
      expect(tryAccept.status).toBe(403);
    });
  });

  describe('Slot conflict + date validation', () => {
    test('rejects past ceremonyDate (400)', async () => {
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Past',
          brideName: 'Date',
          ceremonyDate: yesterdayISO(),
          ceremonyTime: '16:00',
          phone: '03004443322',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/past/i);
    });

    test('blocks double-booking the same slot (409)', async () => {
      const day = tomorrowISO(10);
      const first = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'First',
          brideName: 'Couple',
          ceremonyDate: day,
          ceremonyTime: '17:00',
          phone: '03001231234',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(first.status).toBe(201);

      const accept = await request(app)
        .put(`/api/nikah-bookings/${first.body.data._id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({
          status: 'accepted',
          confirmedDate: day,
          confirmedTime: '17:00',
        });
      expect(accept.status).toBe(200);

      const dup = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Second',
          brideName: 'Couple',
          ceremonyDate: day,
          ceremonyTime: '17:00',
          phone: '03005678901',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(dup.status).toBe(409);
      expect(dup.body.message).toMatch(/slot/i);
    });

    test('validates groomName/brideName/contact fields (400)', async () => {
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'A',
          brideName: 'B',
          ceremonyDate: tomorrowISO(11),
          ceremonyTime: '16:00',
          phone: '0300',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('Scholar list + review', () => {
    test('scholar sees pending bookings in own masjid', async () => {
      const res = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${scholarAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBeGreaterThan(0);
      list.forEach((b) => {
        expect(String(b.mosqueId?._id || b.mosqueId)).toBe(String(mosqueA._id));
      });
    });

    test('scholar reject requires ≥3 char reason (400)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Reject',
          brideName: 'Test',
          ceremonyDate: tomorrowISO(12),
          ceremonyTime: '10:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const reject = await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({ status: 'rejected', rejectionReason: 'no' });
      expect(reject.status).toBe(400);
    });

    test('scholar reject persists reason', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Rej2',
          brideName: 'Test',
          ceremonyDate: tomorrowISO(13),
          ceremonyTime: '11:00',
          phone: '03002223344',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const reject = await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({ status: 'rejected', rejectionReason: 'Schedule conflict with Friday prayer' });
      expect(reject.status).toBe(200);
      expect(reject.body.data.status).toBe('rejected');
      expect(reject.body.data.rejectionReason).toMatch(/Schedule conflict/);
    });

    test('scholar cannot review booking from another mosque (403)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          groomName: 'Other',
          brideName: 'Mosque',
          ceremonyDate: tomorrowISO(14),
          ceremonyTime: '12:00',
          phone: '03003334455',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      const evil = await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({ status: 'rejected', rejectionReason: 'cross mosque' });
      expect(evil.status).toBe(403);
    });
  });

  describe('Cross-mosque isolation', () => {
    test('Al-Noor admin sees only Al-Noor bookings', async () => {
      const res = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBeGreaterThan(0);
      list.forEach((b) => {
        expect(String(b.mosqueId?._id || b.mosqueId)).toBe(String(mosqueA._id));
      });
    });

    test('Al-Rahman admin sees only Al-Rahman bookings', async () => {
      const res = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      list.forEach((b) => {
        expect(String(b.mosqueId?._id || b.mosqueId)).toBe(String(mosqueB._id));
      });
    });
  });

  describe('Authorization', () => {
    test('committee cannot create booking (403)', async () => {
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send({
          groomName: 'Cal',
          brideName: 'Diya',
          ceremonyDate: tomorrowISO(21),
          ceremonyTime: '10:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(res.status).toBe(403);
    });

    test('manager cannot create booking (403)', async () => {
      const managerToken = (await request(app).post('/api/auth/login').send({ email: 'mgr@test.com', password: 'pass1234' })).body.token;
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          groomName: 'Mo',
          brideName: 'Ga',
          ceremonyDate: tomorrowISO(22),
          ceremonyTime: '11:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Deactivation mid-session', () => {
    test('deactivated scholar cannot accept booking (401)', async () => {
      const created = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'DeactS',
          brideName: 'Deny',
          ceremonyDate: tomorrowISO(24),
          ceremonyTime: '14:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
        });
      const id = created.body.data._id;

      await User.updateOne({ _id: scholarAUser._id }, { isActive: false });

      const evil = await request(app)
        .put(`/api/nikah-bookings/${id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({
          status: 'accepted',
          confirmedDate: created.body.data.ceremonyDate,
          confirmedTime: created.body.data.ceremonyTime,
        });
      expect(evil.status).toBe(401);

      await User.updateOne({ _id: scholarAUser._id }, { isActive: true });
    });
  });

  describe('Race conditions (concurrent transitions)', () => {
    let scholarA2User;
    let scholarA2Token;

    beforeAll(async () => {
      scholarA2User = await User.create({
        name: 'Schikh A2',
        email: 'scholarA2@emasjid.pk',
        password: 'scholar123',
        role: 'scholar',
        specialization: 'Nikah',
        mosqueId: mosqueA._id,
        isActive: true,
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'scholarA2@emasjid.pk', password: 'scholar123' });
      scholarA2Token = loginRes.body.token;
    });

    async function seedPendingBooking(overrides = {}) {
      const day = tomorrowISO(12).slice(0, 10);
      const res = await request(app)
        .post('/api/nikah-bookings')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          groomName: 'Race Groom',
          brideName: 'Race Bride',
          ceremonyDate: day,
          ceremonyTime: '11:00',
          phone: '03001112233',
          email: 'test@example.com',
          address: 'House 1, Sheikhupura',
          ...overrides,
        });
      expect(res.status).toBe(201);
      return { id: res.body.data._id, day };
    }

    test('two simultaneous accepts — only one wins, other gets 409', async () => {
      const { id, day } = await seedPendingBooking();

      const [first, second] = await Promise.all([
        request(app)
          .put(`/api/nikah-bookings/${id}`)
          .set('Authorization', `Bearer ${scholarAToken}`)
          .send({ status: 'accepted', confirmedDate: day, confirmedTime: '11:00' }),
        request(app)
          .put(`/api/nikah-bookings/${id}`)
          .set('Authorization', `Bearer ${scholarA2Token}`)
          .send({ status: 'accepted', confirmedDate: day, confirmedTime: '11:00' }),
      ]);

      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([200, 409]);
      const loser = first.status === 409 ? first : second;
      expect(loser.body.message).toMatch(/already/i);

      const after = await NikahBooking.findById(id);
      expect(after.status).toBe('accepted');
      expect(after.scholarId).toBeTruthy();
    });

    test('accept racing reject — only one transition lands', async () => {
      const { id, day } = await seedPendingBooking({ ceremonyTime: '12:00' });

      const [accept, reject] = await Promise.all([
        request(app)
          .put(`/api/nikah-bookings/${id}`)
          .set('Authorization', `Bearer ${scholarAToken}`)
          .send({ status: 'accepted', confirmedDate: day, confirmedTime: '12:00' }),
        request(app)
          .put(`/api/nikah-bookings/${id}`)
          .set('Authorization', `Bearer ${scholarAToken}`)
          .send({ status: 'rejected', rejectionReason: 'Schedule conflict with Jummah' }),
      ]);

      const statuses = [accept.status, reject.status].sort();
      expect(statuses).toEqual([200, 409]);

      const after = await NikahBooking.findById(id);
      expect(['accepted', 'rejected']).toContain(after.status);
    });

    test('community cancel racing scholar accept — only one transition lands', async () => {
      const { id, day } = await seedPendingBooking({ ceremonyTime: '15:00' });

      const [accept, cancel] = await Promise.all([
        request(app)
          .put(`/api/nikah-bookings/${id}`)
          .set('Authorization', `Bearer ${scholarAToken}`)
          .send({ status: 'accepted', confirmedDate: day, confirmedTime: '15:00' }),
        request(app)
          .put(`/api/nikah-bookings/${id}/cancel`)
          .set('Authorization', `Bearer ${userAToken}`),
      ]);

      const statuses = [accept.status, cancel.status].sort();
      expect(statuses).toEqual([200, 409]);

      const after = await NikahBooking.findById(id);
      expect(['accepted', 'rejected']).toContain(after.status);
    });
  });

  describe('Auto-reject on accept', () => {
    test('accepting one pending booking auto-rejects other pending bookings on the same slot', async () => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + 11);

      const winner = await NikahBooking.create({
        groomName: 'Winner', brideName: 'Pick',
        phone: '03001112233', email: 'winner@example.com',
        address: 'House 1', ceremonyDate: day, ceremonyTime: '20:00',
        userId: userAUser._id, mosqueId: mosqueA._id, status: 'pending',
      });

      const siblingA = await NikahBooking.create({
        groomName: 'Sibling',
        brideName: 'A',
        phone: '03001112233',
        email: 'sa@example.com',
        address: 'House 1',
        ceremonyDate: day,
        ceremonyTime: '20:00',
        userId: userAUser._id,
        mosqueId: mosqueA._id,
        status: 'pending',
      });
      const siblingB = await NikahBooking.create({
        groomName: 'Sibling',
        brideName: 'B',
        phone: '03001112233',
        email: 'sb@example.com',
        address: 'House 1',
        ceremonyDate: day,
        ceremonyTime: '20:00',
        userId: userAUser._id,
        mosqueId: mosqueA._id,
        status: 'pending',
      });

      const differentSlot = await NikahBooking.create({
        groomName: 'DifferentSlot',
        brideName: 'X',
        phone: '03001112233',
        email: 'dx@example.com',
        address: 'House 1',
        ceremonyDate: day,
        ceremonyTime: '21:00',
        userId: userAUser._id,
        mosqueId: mosqueA._id,
        status: 'pending',
      });

      const accept = await request(app)
        .put(`/api/nikah-bookings/${winner._id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({ status: 'accepted', confirmedDate: day, confirmedTime: '20:00' });
      expect(accept.status).toBe(200);

      const winnerAfter = await NikahBooking.findById(winner._id);
      expect(winnerAfter.status).toBe('accepted');

      const aAfter = await NikahBooking.findById(siblingA._id);
      expect(aAfter.status).toBe('rejected');
      expect(aAfter.rejectionReason).toMatch(/slot was taken/i);

      const bAfter = await NikahBooking.findById(siblingB._id);
      expect(bAfter.status).toBe('rejected');
      expect(bAfter.rejectionReason).toMatch(/slot was taken/i);

      const differentAfter = await NikahBooking.findById(differentSlot._id);
      expect(differentAfter.status).toBe('pending');
    });

    test('rejecting a booking does NOT auto-reject other pending bookings on the same slot', async () => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + 12);

      const target = await NikahBooking.create({
        groomName: 'Reject', brideName: 'Me',
        phone: '03001112233', email: 'reject@example.com',
        address: 'House 1', ceremonyDate: day, ceremonyTime: '22:00',
        userId: userAUser._id, mosqueId: mosqueA._id, status: 'pending',
      });

      const sibling = await NikahBooking.create({
        groomName: 'Sib',
        brideName: 'Reject',
        phone: '03001112233',
        email: 'sr@example.com',
        address: 'House 1',
        ceremonyDate: day,
        ceremonyTime: '22:00',
        userId: userAUser._id,
        mosqueId: mosqueA._id,
        status: 'pending',
      });

      const reject = await request(app)
        .put(`/api/nikah-bookings/${target._id}`)
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({ status: 'rejected', rejectionReason: 'Not available' });
      expect(reject.status).toBe(200);

      const siblingAfter = await NikahBooking.findById(sibling._id);
      expect(siblingAfter.status).toBe('pending');
    });
  });
});