jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests-only-32chars+';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const SpecialPrayer = require('../../models/SpecialPrayer');

jest.setTimeout(30000);

describe('Special Prayers scope + lifecycle (Phase 16)', () => {
  let mongod;
  let mosqueA;
  let mosqueB;
  let manager;
  let managerToken;
  let adminA;
  let adminAToken;
  let adminB;
  let adminBToken;
  let scholarA;
  let scholarAToken;
  let committeeA;
  let committeeAToken;
  let community;
  let communityToken;

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const yesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const inDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  async function login(email) {
    const r = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'pass1234' });
    return r.body.token;
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
      SpecialPrayer.deleteMany({}),
    ]);

    manager = await User.create({
      name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager',
    });
    adminA = await User.create({
      name: 'Admin A', email: 'admin.a@test.com', password: 'pass1234', role: 'admin',
    });
    adminB = await User.create({
      name: 'Admin B', email: 'admin.b@test.com', password: 'pass1234', role: 'admin',
    });
    scholarA = await User.create({
      name: 'Scholar A', email: 'scholar.a@test.com', password: 'pass1234', role: 'scholar',
    });
    committeeA = await User.create({
      name: 'Committee A', email: 'comm.a@test.com', password: 'pass1234', role: 'committee',
    });
    community = await User.create({
      name: 'Community', email: 'comm.user@test.com', password: 'pass1234', role: 'community',
    });

    mosqueA = await Mosque.create({
      name: 'Masjid A', city: 'CityA',
      managerId: manager._id, admins: [adminA._id], isActive: true,
    });
    mosqueB = await Mosque.create({
      name: 'Masjid B', city: 'CityB',
      managerId: manager._id, admins: [adminB._id], isActive: true,
    });

    await User.updateOne({ _id: adminA._id }, { mosqueId: mosqueA._id });
    await User.updateOne({ _id: adminB._id }, { mosqueId: mosqueB._id });
    await User.updateOne({ _id: scholarA._id }, { mosqueId: mosqueA._id });
    await User.updateOne({ _id: committeeA._id }, { mosqueId: mosqueA._id });
    await User.updateOne({ _id: community._id }, { mosqueId: mosqueA._id });

    managerToken = await login('mgr@test.com');
    adminAToken = await login('admin.a@test.com');
    adminBToken = await login('admin.b@test.com');
    scholarAToken = await login('scholar.a@test.com');
    committeeAToken = await login('comm.a@test.com');
    communityToken = await login('comm.user@test.com');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Group 1: Public listing', () => {
    test('GET / without mosqueId returns 400', async () => {
      const r = await request(app).get('/api/special-prayers');
      expect(r.status).toBe(400);
      expect(r.body.message).toMatch(/mosqueId/);
    });

    test('GET / with invalid mosqueId returns 400', async () => {
      const r = await request(app).get('/api/special-prayers?mosqueId=not-an-id');
      expect(r.status).toBe(400);
    });

    test('GET / with valid mosqueId returns active items only, sorted by date asc', async () => {
      await SpecialPrayer.create({
        name: 'A Past Hidden', type: 'eid-fitr',
        date: inDays(-5), time: '07:00', isActive: false,
        mosqueId: mosqueA._id, createdBy: adminA._id,
      });
      const r = await request(app).get(`/api/special-prayers?mosqueId=${mosqueA._id}`);
      expect(r.status).toBe(200);
      expect(Array.isArray(r.body.data)).toBe(true);
      expect(r.body.data.every((p) => p.isActive)).toBe(true);
    });

    test('GET /?upcoming=true excludes past items', async () => {
      const r = await request(app).get(`/api/special-prayers?mosqueId=${mosqueA._id}&upcoming=true`);
      expect(r.status).toBe(200);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      expect(r.body.data.every((p) => new Date(p.date) >= today)).toBe(true);
    });

    test('GET /?includeInactive=true includes hidden items', async () => {
      const r = await request(app).get(`/api/special-prayers?mosqueId=${mosqueA._id}&includeInactive=true`);
      expect(r.status).toBe(200);
      const hasInactive = r.body.data.some((p) => p.isActive === false);
      expect(hasInactive).toBe(true);
    });

    test('public listing for mosqueB does not return mosqueA items', async () => {
      await SpecialPrayer.create({
        name: 'A Eid', type: 'eid-fitr', date: inDays(3), time: '07:00',
        mosqueId: mosqueA._id, createdBy: adminA._id,
      });
      const r = await request(app).get(`/api/special-prayers?mosqueId=${mosqueB._id}`);
      expect(r.status).toBe(200);
      const ids = r.body.data.map((p) => String(p.mosqueId));
      expect(ids.every((id) => id === String(mosqueB._id))).toBe(true);
    });
  });

  describe('Group 2: Admin/Manager/Scholar/Committee listing (role gate)', () => {
    test('admin lists only own-mosque items', async () => {
      await SpecialPrayer.create({
        name: 'B Tarawih', type: 'tarawih', date: inDays(5), time: '21:30',
        mosqueId: mosqueB._id, createdBy: adminB._id,
      });
      const r = await request(app)
        .get('/api/special-prayers/admin')
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(r.status).toBe(200);
      const ids = r.body.data.map((p) => String(p.mosqueId));
      expect(ids.every((id) => id === String(mosqueA._id))).toBe(true);
    });

    test('manager listing requires auth (401 without token)', async () => {
      const r = await request(app).get('/api/special-prayers/admin');
      expect(r.status).toBe(401);
    });

    test('community user cannot list admin endpoint', async () => {
      const r = await request(app)
        .get('/api/special-prayers/admin')
        .set('Authorization', `Bearer ${communityToken}`);
      expect(r.status).toBe(403);
    });

    test('scholar and committee can list (read-only role)', async () => {
      const r1 = await request(app)
        .get('/api/special-prayers/admin')
        .set('Authorization', `Bearer ${scholarAToken}`);
      expect(r1.status).toBe(200);
      const r2 = await request(app)
        .get('/api/special-prayers/admin')
        .set('Authorization', `Bearer ${committeeAToken}`);
      expect(r2.status).toBe(200);
    });
  });

  describe('Group 3: Create (admin/manager allowed; others denied; validation)', () => {
    test('admin can create a special prayer for own mosque', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: "Eid ul-Fitr Jama'ah",
          type: 'eid-fitr',
          date: inDays(2).toISOString(),
          time: '07:00',
          description: 'Main hall, khutbah follows immediately',
        });
      expect(r.status).toBe(201);
      expect(r.body.data.name).toBe("Eid ul-Fitr Jama'ah");
      expect(String(r.body.data.mosqueId)).toBe(String(mosqueA._id));
    });

    test('admin cannot create for another mosque (403)', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Sneaky Cross',
          type: 'eid-fitr',
          date: inDays(1).toISOString(),
          time: '07:00',
          mosqueId: String(mosqueB._id),
        });
      expect(r.status).toBe(403);
    });

    test('manager can create for any mosque they manage by passing mosqueId', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Tarawih',
          type: 'tarawih',
          date: inDays(4).toISOString(),
          time: '21:30',
          mosqueId: String(mosqueB._id),
        });
      expect(r.status).toBe(201);
      expect(String(r.body.data.mosqueId)).toBe(String(mosqueB._id));
    });

    test('manager without mosqueId gets 400', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'No Mosque',
          type: 'eid-fitr',
          date: inDays(1).toISOString(),
          time: '07:00',
        });
      expect(r.status).toBe(400);
    });

    test('manager cannot create for mosque they do not manage (403)', async () => {
      const otherMosque = await Mosque.create({
        name: 'Other Masjid', city: 'Elsewhere', managerId: new mongoose.Types.ObjectId(), isActive: true,
      });
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Sneaky Manager',
          type: 'eid-fitr',
          date: inDays(1).toISOString(),
          time: '07:00',
          mosqueId: String(otherMosque._id),
        });
      expect(r.status).toBe(403);
    });

    test('committee and community cannot create (403)', async () => {
      const r1 = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${committeeAToken}`)
        .send({ name: 'X Y', type: 'eid-fitr', date: inDays(1).toISOString(), time: '07:00' });
      expect(r1.status).toBe(403);
      const r2 = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${communityToken}`)
        .send({ name: 'X Y', type: 'eid-fitr', date: inDays(1).toISOString(), time: '07:00' });
      expect(r2.status).toBe(403);
    });

    test('name too short returns 400', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'A', type: 'eid-fitr', date: inDays(1).toISOString(), time: '07:00' });
      expect(r.status).toBe(400);
    });

    test('invalid time format returns 400', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Bad Time', type: 'eid-fitr', date: inDays(1).toISOString(), time: '25:99' });
      expect(r.status).toBe(400);
    });

    test('invalid type returns 400', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Bad Type', type: 'not-a-real-type', date: inDays(1).toISOString(), time: '07:00' });
      expect(r.status).toBe(400);
    });

    test('description over 500 chars returns 400', async () => {
      const r = await request(app)
        .post('/api/special-prayers')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({
          name: 'Long Desc',
          type: 'eid-fitr',
          date: inDays(1).toISOString(),
          time: '07:00',
          description: 'x'.repeat(501),
        });
      expect(r.status).toBe(400);
    });
  });

  describe('Group 4: Cross-mosque denial (update / toggle / delete)', () => {
    let targetPrayer;

    beforeAll(async () => {
      targetPrayer = await SpecialPrayer.create({
        name: 'A Eid Tomorrow', type: 'eid-fitr',
        date: tomorrow(), time: '07:00', isActive: true,
        mosqueId: mosqueA._id, createdBy: adminA._id,
      });
    });

    test('adminB cannot update mosqueA prayer (404)', async () => {
      const r = await request(app)
        .put(`/api/special-prayers/${targetPrayer._id}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ time: '08:00' });
      expect(r.status).toBe(404);
    });

    test('adminB cannot toggle mosqueA prayer (404)', async () => {
      const r = await request(app)
        .patch(`/api/special-prayers/${targetPrayer._id}/toggle`)
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(r.status).toBe(404);
    });

    test('adminB cannot delete mosqueA prayer (404)', async () => {
      const r = await request(app)
        .delete(`/api/special-prayers/${targetPrayer._id}`)
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(r.status).toBe(404);
      const stillThere = await SpecialPrayer.findById(targetPrayer._id);
      expect(stillThere).not.toBeNull();
    });

    test('update with invalid id returns 400', async () => {
      const r = await request(app)
        .put('/api/special-prayers/not-an-id')
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ time: '08:00' });
      expect(r.status).toBe(400);
    });

    test('update with non-existent valid id returns 404', async () => {
      const r = await request(app)
        .put(`/api/special-prayers/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ time: '08:00' });
      expect(r.status).toBe(404);
    });
  });

  describe('Group 5: Full lifecycle — update + toggle + delete (own-mosque only)', () => {
    let lifecyclePrayer;

    beforeAll(async () => {
      lifecyclePrayer = await SpecialPrayer.create({
        name: 'A Shab-e-Meraj', type: 'shab-meraj',
        date: inDays(7), time: '22:00', isActive: true,
        mosqueId: mosqueA._id, createdBy: adminA._id,
      });
    });

    test('adminA can update own-mosque prayer time', async () => {
      const r = await request(app)
        .put(`/api/special-prayers/${lifecyclePrayer._id}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ time: '22:30' });
      expect(r.status).toBe(200);
      expect(r.body.data.time).toBe('22:30');
    });

    test('adminA can toggle off; public listing then hides it', async () => {
      const off = await request(app)
        .patch(`/api/special-prayers/${lifecyclePrayer._id}/toggle`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(off.status).toBe(200);
      expect(off.body.data.isActive).toBe(false);

      const pub = await request(app)
        .get(`/api/special-prayers?mosqueId=${mosqueA._id}`);
      const ids = pub.body.data.map((p) => String(p._id));
      expect(ids).not.toContain(String(lifecyclePrayer._id));
    });

    test('adminA can toggle back on; public listing shows it again', async () => {
      const on = await request(app)
        .patch(`/api/special-prayers/${lifecyclePrayer._id}/toggle`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(on.status).toBe(200);
      expect(on.body.data.isActive).toBe(true);

      const pub = await request(app)
        .get(`/api/special-prayers?mosqueId=${mosqueA._id}&upcoming=true`);
      const ids = pub.body.data.map((p) => String(p._id));
      expect(ids).toContain(String(lifecyclePrayer._id));
    });

    test('adminA can delete own-mosque prayer; gone from DB', async () => {
      const r = await request(app)
        .delete(`/api/special-prayers/${lifecyclePrayer._id}`)
        .set('Authorization', `Bearer ${adminAToken}`);
      expect(r.status).toBe(200);
      const gone = await SpecialPrayer.findById(lifecyclePrayer._id);
      expect(gone).toBeNull();
    });

    test('manager can delete across any mosque they manage', async () => {
      const target = await SpecialPrayer.create({
        name: 'B Janazah', type: 'janazah', date: inDays(2), time: '14:00',
        mosqueId: mosqueB._id, createdBy: adminB._id,
      });
      const r = await request(app)
        .delete(`/api/special-prayers/${target._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(r.status).toBe(200);
    });
  });
});
