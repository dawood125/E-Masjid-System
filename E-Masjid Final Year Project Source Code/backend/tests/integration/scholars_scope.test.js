jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const NikahBooking = require('../../models/NikahBooking');

jest.setTimeout(30000);

describe('Scholars module scope + behavior (Phase 11)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let adminAToken;
  let adminBToken;
  let adminAUser;
  let adminBUser;
  let scholarAUser;
  let scholarBUser;
  let scholarAToken;
  let committeeUser;
  let committeeToken;

  beforeAll(async () => {
    await mongoose.disconnect().catch(() => {});
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());

    await Promise.all([
      User.deleteMany({}),
      Mosque.deleteMany({}),
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
    committeeUser = await User.create({
      name: 'Committee A', email: 'ca@test.com', password: 'pass1234', role: 'committee',
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
      { _id: { $in: [adminAUser._id, committeeUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateMany(
      { _id: { $in: [adminBUser._id] } },
      { mosqueId: mosqueB._id }
    );
    adminAUser.mosqueId = mosqueA._id;
    adminBUser.mosqueId = mosqueB._id;
    committeeUser.mosqueId = mosqueA._id;

    scholarAUser = await User.create({
      name: 'Scholar A', email: 'sa@test.com', password: 'pass1234', role: 'scholar', mosqueId: mosqueA._id,
    });
    scholarBUser = await User.create({
      name: 'Scholar B', email: 'sb@test.com', password: 'pass1234', role: 'scholar', mosqueId: mosqueB._id,
    });

    const loginA = await request(app).post('/api/auth/login').send({ email: 'aa@test.com', password: 'pass1234' });
    adminAToken = loginA.body.token;
    const loginB = await request(app).post('/api/auth/login').send({ email: 'ab@test.com', password: 'pass1234' });
    adminBToken = loginB.body.token;
    const loginSA = await request(app).post('/api/auth/login').send({ email: 'sa@test.com', password: 'pass1234' });
    scholarAToken = loginSA.body.token;
    const loginC = await request(app).post('/api/auth/login').send({ email: 'ca@test.com', password: 'pass1234' });
    committeeToken = loginC.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('GET /api/scholars - listing', () => {
    test('without token returns 401', async () => {
      const res = await request(app).get('/api/scholars');
      expect(res.status).toBe(401);
    });

    test('as scholar returns 403 (admin-only route)', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${scholarAToken}`);
      expect(res.status).toBe(403);
    });

    test('as committee returns 403 (admin-only route)', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${committeeToken}`);
      expect(res.status).toBe(403);
    });

    test('as admin A returns only A scholars', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBe(1);
      expect(String(list[0]._id)).toBe(String(scholarAUser._id));
    });

    test('as admin B returns only B scholars', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];
      expect(list.length).toBe(1);
      expect(String(list[0]._id)).toBe(String(scholarBUser._id));
    });
  });

  describe('POST /api/scholars - creation', () => {
    test('admin A creates scholar with typed password (BUG-B2 fix: password reaches DB)', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'New Scholar A',
          email: 'newsa@test.com',
          phone: '0300-1111111',
          specialization: 'Nikah',
          password: 'mypassword123',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.tempPassword).toBe('mypassword123');
      expect(res.body.data.email).toBe('newsa@test.com');
      expect(String(res.body.data.mosqueId)).toBe(String(mosqueA._id));

      const login = await request(app).post('/api/auth/login').send({ email: 'newsa@test.com', password: 'mypassword123' });
      expect(login.status).toBe(200);
      expect(login.body.token).toBeTruthy();
    });

    test('admin A creates scholar without password → server returns random tempPassword', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Temp Scholar',
          email: 'tempsa@test.com',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.tempPassword).toBeTruthy();
      expect(res.body.tempPassword.length).toBeGreaterThanOrEqual(6);

      const login = await request(app).post('/api/auth/login').send({ email: 'tempsa@test.com', password: res.body.tempPassword });
      expect(login.status).toBe(200);
      expect(login.body.token).toBeTruthy();
    });

    test('rejects duplicate email with 400', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Dup Scholar',
          email: 'newsa@test.com',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already/i);
    });

    test('rejects missing name with 400', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          email: 'noname@test.com',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(400);
    });

    test('rejects invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(400);
    });

    test('rejects password shorter than 6 characters with 400', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Short Pass',
          email: 'short@test.com',
          specialization: 'Nikah',
          password: 'abc',
        });
      expect(res.status).toBe(400);
    });

    test('committee cannot create scholar (403)', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send({
          name: 'Hacker',
          email: 'hacker@test.com',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(403);
    });

    test('scholar cannot create scholar (403)', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${scholarAToken}`)
        .send({
          name: 'Self Promote',
          email: 'self@test.com',
          specialization: 'Nikah',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/scholars/:id - update', () => {
    let editId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Edit Me', email: 'editme@test.com', specialization: 'Nikah', password: 'edit1234' });
      editId = res.body.data.id;
    });

    test('admin A updates name, phone, specialization', async () => {
      const res = await request(app)
        .put(`/api/scholars/${editId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Edited Name',
          phone: '0300-9999999',
          specialization: 'Nikah & Funeral',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Edited Name');
      expect(res.body.data.phone).toBe('0300-9999999');
      expect(res.body.data.specialization).toBe('Nikah & Funeral');
    });

    test('admin A cannot edit scholar in mosque B (returns 404, no leak)', async () => {
      const res = await request(app)
        .put(`/api/scholars/${scholarBUser._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Hacked' });
      expect(res.status).toBe(404);
      const unchanged = await User.findById(scholarBUser._id);
      expect(unchanged.name).toBe('Scholar B');
    });

    test('admin B cannot edit scholar in mosque A (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/scholars/${editId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ name: 'Hacked By B' });
      expect(res.status).toBe(404);
    });

    test('rejects invalid email format with 400', async () => {
      const res = await request(app)
        .put(`/api/scholars/${editId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    test('rejects name too short with 400', async () => {
      const res = await request(app)
        .put(`/api/scholars/${editId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'A' });
      expect(res.status).toBe(400);
    });

    test('ignores attempts to change role or mosqueId via whitelist (security)', async () => {
      const res = await request(app)
        .put(`/api/scholars/${editId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Renamed Again', role: 'admin', mosqueId: String(mosqueB._id) });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed Again');
      const fresh = await User.findById(editId);
      expect(fresh.role).toBe('scholar');
      expect(String(fresh.mosqueId)).toBe(String(mosqueA._id));
    });

    test('rejects invalid object id with 400', async () => {
      const res = await request(app)
        .put('/api/scholars/not-an-object-id')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Whatever' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/scholars/:id/reset-password', () => {
    let targetId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Reset Target', email: 'reset@t.com', specialization: 'Nikah', password: 'oldpass1' });
      targetId = res.body.data.id;
    });

    test('admin A resets password, new password works for login', async () => {
      const res = await request(app)
        .post(`/api/scholars/${targetId}/reset-password`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ password: 'brandnew123' });
      expect(res.status).toBe(200);
      expect(res.body.newPassword).toBe('brandnew123');

      const login = await request(app).post('/api/auth/login').send({ email: 'reset@t.com', password: 'brandnew123' });
      expect(login.status).toBe(200);
    });

    test('admin B cannot reset scholar in mosque A (404)', async () => {
      const res = await request(app)
        .post(`/api/scholars/${targetId}/reset-password`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ password: 'hackedpwd1' });
      expect(res.status).toBe(404);

      const stillWorks = await request(app).post('/api/auth/login').send({ email: 'reset@t.com', password: 'brandnew123' });
      expect(stillWorks.status).toBe(200);
    });

    test('rejects password shorter than 6 characters with 400', async () => {
      const res = await request(app)
        .post(`/api/scholars/${targetId}/reset-password`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ password: 'abc' });
      expect(res.status).toBe(400);
    });

    test('committee cannot reset password (403)', async () => {
      const res = await request(app)
        .post(`/api/scholars/${targetId}/reset-password`)
        .set('Authorization', `Bearer ${committeeToken}`)
        .send({ password: 'commpass1' });
      expect(res.status).toBe(403);
    });
  });

  describe('activate / deactivate (isActive flag)', () => {
    let activeId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Active Target', email: 'active@t.com', specialization: 'Nikah', password: 'activepw1' });
      activeId = res.body.data.id;
    });

    test('deactivated scholar cannot login (blocks future auth)', async () => {
      await request(app)
        .put(`/api/scholars/${activeId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: false });
      const login = await request(app).post('/api/auth/login').send({ email: 'active@t.com', password: 'activepw1' });
      expect([401, 403]).toContain(login.status);
    });

    test('reactivated scholar can login again', async () => {
      await request(app)
        .put(`/api/scholars/${activeId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: true });
      const login = await request(app).post('/api/auth/login').send({ email: 'active@t.com', password: 'activepw1' });
      expect(login.status).toBe(200);
      expect(login.body.token).toBeTruthy();
    });

    test('rejects non-boolean isActive with 400', async () => {
      const res = await request(app)
        .put(`/api/scholars/${activeId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: 'not-a-boolean' });
      expect(res.status).toBe(400);
    });
  });

  describe('deactivation mid-session kicks logged-in user out (BUG-F7 fix)', () => {
    let liveScholarId;
    let liveScholarToken;

    beforeAll(async () => {
      const created = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Live Scholar', email: 'live@t.com', specialization: 'Nikah', password: 'livepw1234' });
      liveScholarId = created.body.data.id;

      const login = await request(app).post('/api/auth/login').send({ email: 'live@t.com', password: 'livepw1234' });
      liveScholarToken = login.body.token;
    });

    test('deactivated scholar token cannot hit /api/auth/me', async () => {
      const before = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveScholarToken}`);
      expect(before.status).toBe(200);

      await request(app)
        .put(`/api/scholars/${liveScholarId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: false });

      const after = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveScholarToken}`);
      expect(after.status).toBe(401);
      expect(after.body.message).toMatch(/deactivated/i);
    });

    test('deactivated scholar token cannot hit scholar-scoped routes (nikah bookings)', async () => {
      const after = await request(app)
        .get('/api/nikah-bookings')
        .set('Authorization', `Bearer ${liveScholarToken}`);
      expect(after.status).toBe(401);
    });

    test('deactivated scholar token cannot refresh itself', async () => {
      const after = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${liveScholarToken}`);
      expect(after.status).toBe(401);
    });

    test('reactivated scholar can resume all calls with the same token', async () => {
      await request(app)
        .put(`/api/scholars/${liveScholarId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ isActive: true });

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveScholarToken}`);
      expect(me.status).toBe(200);
    });
  });

  describe('GET /api/scholars - nikah counts per scholar (BUG-11 fix)', () => {
    let metricsScholarId;
    let metricsOtherScholarId;

    beforeAll(async () => {
      await NikahBooking.deleteMany({});

      const saRes = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Metrics Scholar', email: 'metricsa@test.com', specialization: 'Nikah', password: 'metricsa1' });
      metricsScholarId = saRes.body.data.id;

      const sbRes = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Metrics Other', email: 'metricsb@test.com', specialization: 'Nikah', password: 'metricsb1' });
      metricsOtherScholarId = sbRes.body.data.id;

      const community = await User.create({
        name: 'Community Submitter',
        email: 'community-ms@test.com',
        password: 'community1',
        role: 'community',
        mosqueId: mosqueA._id,
      });

      await NikahBooking.create([
        { groomName: 'A1', brideName: 'B1', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '14:00', phone: '03001111111', email: 'a1@t.com', address: 'a1', userId: community._id, mosqueId: mosqueA._id, scholarId: metricsScholarId, status: 'accepted' },
        { groomName: 'A2', brideName: 'B2', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '15:00', phone: '03001111112', email: 'a2@t.com', address: 'a2', userId: community._id, mosqueId: mosqueA._id, scholarId: metricsScholarId, status: 'accepted' },
        { groomName: 'A3', brideName: 'B3', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '16:00', phone: '03001111113', email: 'a3@t.com', address: 'a3', userId: community._id, mosqueId: mosqueA._id, scholarId: metricsScholarId, status: 'accepted' },
        { groomName: 'A4', brideName: 'B4', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '17:00', phone: '03001111114', email: 'a4@t.com', address: 'a4', userId: community._id, mosqueId: mosqueA._id, scholarId: metricsScholarId, status: 'pending' },
        { groomName: 'A5', brideName: 'B5', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '18:00', phone: '03001111115', email: 'a5@t.com', address: 'a5', userId: community._id, mosqueId: mosqueA._id, scholarId: metricsOtherScholarId, status: 'pending' },
        { groomName: 'A6', brideName: 'B6', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '19:00', phone: '03001111116', email: 'a6@t.com', address: 'a6', userId: community._id, mosqueId: mosqueA._id, status: 'pending' },
        { groomName: 'A7', brideName: 'B7', ceremonyDate: new Date('2099-09-05'), ceremonyTime: '20:00', phone: '03001111117', email: 'a7@t.com', address: 'a7', userId: community._id, mosqueId: mosqueB._id, scholarId: scholarBUser._id, status: 'accepted' },
      ]);
    });

    test('each scholar carries real nikahPerformed + pendingRequests numbers', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];

      const metricsScholar = list.find((s) => String(s._id) === metricsScholarId);
      const metricsOther = list.find((s) => String(s._id) === metricsOtherScholarId);
      const seededScholarA = list.find((s) => String(s._id) === String(scholarAUser._id));

      expect(metricsScholar).toBeDefined();
      expect(metricsScholar.nikahPerformed).toBe(3);
      expect(metricsScholar.pendingRequests).toBe(3);

      expect(metricsOther).toBeDefined();
      expect(metricsOther.nikahPerformed).toBe(0);
      expect(metricsOther.pendingRequests).toBe(3);

      expect(seededScholarA).toBeDefined();
      expect(seededScholarA.nikahPerformed).toBe(0);
      expect(seededScholarA.pendingRequests).toBe(3);
    });

    test('counts respect mosque scope (admin B never sees mosque A bookings)', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(res.status).toBe(200);
      const list = res.body.data || [];

      const metricsLeak = list.find((s) => String(s._id) === metricsScholarId);
      expect(metricsLeak).toBeUndefined();

      const scholarB = list.find((s) => String(s._id) === String(scholarBUser._id));
      expect(scholarB).toBeDefined();
      expect(scholarB.nikahPerformed).toBe(1);
      expect(scholarB.pendingRequests).toBe(0);
    });

    test('counts are numeric, not the previous hardcoded 8/15/22 pattern', async () => {
      const res = await request(app)
        .get('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`);
      const list = res.body.data || [];
      list.forEach((s) => {
        expect(typeof s.nikahPerformed).toBe('number');
        expect(typeof s.pendingRequests).toBe('number');
        expect(s.nikahPerformed % 1).toBe(0);
      });
      const pattern = list.map((s) => s.nikahPerformed);
      expect(pattern).not.toEqual([8, 15, 22]);
    });

    test('newly created scholar (POST response) returns nikahPerformed: 0, pendingRequests: 0', async () => {
      const res = await request(app)
        .post('/api/scholars')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Fresh Scholar', email: 'freshmetrics@t.com', specialization: 'Nikah', password: 'freshpw1' });
      expect(res.status).toBe(201);
      expect(res.body.data.nikahPerformed).toBe(0);
      expect(res.body.data.pendingRequests).toBe(0);
    });
  });
});