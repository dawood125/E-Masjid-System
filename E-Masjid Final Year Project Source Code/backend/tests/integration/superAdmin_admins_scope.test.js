jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');

jest.setTimeout(30000);

async function login(email, password = 'pass1234') {
  const r = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return r.body.token;
}

describe('Manager activate/deactivate admin accounts (BUG-23 fix)', () => {
  let mongod;
  let managerAUser;
  let managerBUser;
  let managerAToken;
  let managerBToken;
  let adminAUser;
  let adminBUser;
  let adminAToken;
  let adminBToken;
  let communityUser;
  let communityToken;
  let mosqueA;
  let mosqueB;

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
    ]);

    managerAUser = await User.create({
      name: 'Manager A', email: 'manager.a@test.com', password: 'pass1234', role: 'manager',
    });
    managerBUser = await User.create({
      name: 'Manager B', email: 'manager.b@test.com', password: 'pass1234', role: 'manager',
    });
    adminAUser = await User.create({
      name: 'Admin A', email: 'admin.a@test.com', password: 'pass1234', role: 'admin',
    });
    adminBUser = await User.create({
      name: 'Admin B', email: 'admin.b@test.com', password: 'pass1234', role: 'admin',
    });
    communityUser = await User.create({
      name: 'Community User', email: 'community@test.com', password: 'pass1234', role: 'community',
    });

    mosqueA = await Mosque.create({
      name: 'Masjid A', city: 'CityA',
      managerId: managerAUser._id, admins: [adminAUser._id], isActive: true,
    });
    mosqueB = await Mosque.create({
      name: 'Masjid B', city: 'CityB',
      managerId: managerBUser._id, admins: [adminBUser._id], isActive: true,
    });

    await User.updateOne({ _id: adminAUser._id }, { mosqueId: mosqueA._id });
    await User.updateOne({ _id: adminBUser._id }, { mosqueId: mosqueB._id });

    managerAToken = await login('manager.a@test.com');
    managerBToken = await login('manager.b@test.com');
    adminAToken = await login('admin.a@test.com');
    adminBToken = await login('admin.b@test.com');
    communityToken = await login('community@test.com');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('GET /api/super-admin/admins - list endpoint scope (regression check)', () => {
    test('manager A sees only their own admin(s)', async () => {
      const r = await request(app)
        .get('/api/super-admin/admins')
        .set('Authorization', `Bearer ${managerAToken}`);
      expect(r.status).toBe(200);
      const ids = r.body.data.map((a) => String(a._id));
      expect(ids).toContain(String(adminAUser._id));
      expect(ids).not.toContain(String(adminBUser._id));
      expect(Array.isArray(r.body.managedMosques)).toBe(true);
      expect(r.body.managedMosques.length).toBe(1);
    });
  });

  describe('Group 1: public (no token)', () => {
    test('PUT /api/super-admin/admins/:id without token returns 401', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .send({ isActive: false });
      expect(r.status).toBe(401);
    });
  });

  describe('Group 4: cross-mosque deny', () => {
    test('manager B cannot deactivate admin of masjid managed by manager A', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${managerBToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(404);

      const inDb = await User.findById(adminAUser._id);
      expect(inDb.isActive).toBe(true);
    });

    test('manager A cannot deactivate an admin belonging to a masjid they do not manage', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminBUser._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(404);

      const inDb = await User.findById(adminBUser._id);
      expect(inDb.isActive).toBe(true);
    });
  });

  describe('Group 5: online (happy path)', () => {
    test('manager A deactivates their own admin', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
      expect(r.body.data.isActive).toBe(false);
      expect(r.body.data.id).toBe(String(adminAUser._id));
      expect(r.body.message).toMatch(/deactivated/i);

      const inDb = await User.findById(adminAUser._id);
      expect(inDb.isActive).toBe(false);
    });

    test('manager A re-activates the same admin', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: true });
      expect(r.status).toBe(200);
      expect(r.body.data.isActive).toBe(true);
      expect(r.body.message).toMatch(/activated/i);

      const inDb = await User.findById(adminAUser._id);
      expect(inDb.isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    test('rejects non-boolean isActive with 400', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: 'not-a-boolean' });
      expect(r.status).toBe(400);
    });

    test('rejects malformed adminId with 400', async () => {
      const r = await request(app)
        .put('/api/super-admin/admins/not-a-valid-id')
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(400);
    });

    test('returns 404 for a valid ObjectId that is not an admin', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const r = await request(app)
        .put(`/api/super-admin/admins/${fakeId}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(404);
    });

    test('empty body is a no-op — isActive stays unchanged', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({});
      expect(r.status).toBe(200);
      expect(r.body.data.isActive).toBe(true);
    });
  });

  describe('Role authorization', () => {
    test('admin role cannot hit this endpoint (403)', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(403);
    });

    test('community role cannot hit this endpoint (403)', async () => {
      const r = await request(app)
        .put(`/api/super-admin/admins/${adminAUser._id}`)
        .set('Authorization', `Bearer ${communityToken}`)
        .send({ isActive: false });
      expect(r.status).toBe(403);
    });
  });

  describe('Deactivation enforces session-level kick (auth middleware)', () => {
    let liveAdminId;
    let liveAdminToken;

    beforeAll(async () => {
      const created = await request(app)
        .post('/api/super-admin/mosques/' + mosqueA._id + '/admin')
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({
          name: 'Live Admin',
          email: 'live.admin@test.com',
          phone: '0300-0000099',
          password: 'liveadmin1',
        });
      liveAdminId = created.body.data.id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'live.admin@test.com', password: 'liveadmin1' });
      liveAdminToken = loginRes.body.token;
    });

    test('live admin token works before deactivation', async () => {
      const r = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveAdminToken}`);
      expect(r.status).toBe(200);
    });

    test('deactivated admin token cannot hit /api/auth/me', async () => {
      await request(app)
        .put(`/api/super-admin/admins/${liveAdminId}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: false });

      const r = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveAdminToken}`);
      expect(r.status).toBe(401);
      expect(r.body.message).toMatch(/deactivated/i);
    });

    test('deactivated admin cannot log back in', async () => {
      const r = await request(app)
        .post('/api/auth/login')
        .send({ email: 'live.admin@test.com', password: 'liveadmin1' });
      expect(r.status).toBe(403);
    });

    test('re-activated admin resumes all access with same token', async () => {
      await request(app)
        .put(`/api/super-admin/admins/${liveAdminId}`)
        .set('Authorization', `Bearer ${managerAToken}`)
        .send({ isActive: true });

      const r = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${liveAdminToken}`);
      expect(r.status).toBe(200);
    });
  });
});
