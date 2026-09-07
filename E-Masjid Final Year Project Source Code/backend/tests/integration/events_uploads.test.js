jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Event = require('../../models/Event');

jest.setTimeout(30000);

function tmpImage(ext) {
  const buf = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);
  const p = path.join(os.tmpdir(), 'emasjid-event-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext);
  fs.writeFileSync(p, buf);
  return { path: p, cleanup: () => { try { fs.unlinkSync(p); } catch (_) {} } };
}

describe('Events image upload end-to-end (BUG-29)', () => {
  let mongod;
  let adminToken;
  let managerToken;
  let communityToken;
  let mosque;

  async function login(email) {
    const r = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
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
      Event.deleteMany({}),
    ]);

    const manager = await User.create({ name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager' });
    const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'pass1234', role: 'admin' });
    const community = await User.create({ name: 'Community', email: 'community@test.com', password: 'pass1234', role: 'community' });

    mosque = await Mosque.create({
      name: 'Al-Noor', city: 'Sheikhupura',
      managerId: manager._id, admins: [admin._id], isActive: true,
    });
    await User.updateOne({ _id: admin._id }, { mosqueId: mosque._id });
    await User.updateOne({ _id: community._id }, { mosqueId: mosque._id });

    managerToken = await login('mgr@test.com');
    adminToken = await login('admin@test.com');
    communityToken = await login('community@test.com');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Group 1: create + admin listing shows image', () => {
    let createdImage;

    test('POST event with image saves /uploads/events/... path', async () => {
      const f = tmpImage('png');
      try {
        const r = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Friday Khutbah')
          .field('description', 'Weekly sermon')
          .field('date', '2026-12-31')
          .field('time', '13:00')
          .field('location', 'Main Hall')
          .field('maxParticipants', '100')
          .attach('image', f.path);
        expect(r.status).toBe(201);
        expect(r.body.data.image).toMatch(/^\/uploads\/events\/.+\.png$/);
        createdImage = r.body.data.image;

        const savedPath = path.join(__dirname, '..', '..', 'uploads', 'events', path.basename(createdImage));
        expect(fs.existsSync(savedPath)).toBe(true);
      } finally { f.cleanup(); }
    });

    test('GET /api/events/admin returns the event with image field populated', async () => {
      const r = await request(app)
        .get('/api/events/admin?mosqueId=' + mosque._id)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(r.status).toBe(200);
      const event = r.body.data.find((e) => e.title === 'Friday Khutbah');
      expect(event).toBeDefined();
      expect(event.image).toMatch(/^\/uploads\/events\/.+\.png$/);
      expect(event.image).toBe(createdImage);
    });

    test('GET /api/events (public) returns the event with image field populated', async () => {
      const r = await request(app)
        .get('/api/events?mosqueId=' + mosque._id);
      expect(r.status).toBe(200);
      const event = r.body.data.find((e) => e.title === 'Friday Khutbah');
      expect(event).toBeDefined();
      expect(event.image).toMatch(/^\/uploads\/events\/.+\.png$/);
      expect(event.image).toBe(createdImage);
    });

    test('GET /uploads/events/ serves the uploaded file', async () => {
      const filename = path.basename(createdImage);
      const r = await request(app).get('/uploads/events/' + filename);
      expect(r.status).toBe(200);
      expect(r.headers['content-type']).toMatch(/image/);
    });
  });

  describe('Group 2: update replaces image', () => {
    let eventId;
    let originalImage;

    test('PUT with new image replaces the path', async () => {
      const first = tmpImage('png');
      const second = tmpImage('jpg');
      try {
        const created = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('title', 'Update Image Event')
          .field('description', 'Test')
          .field('date', '2027-01-15')
          .field('time', '10:00')
          .field('location', 'Hall')
          .field('maxParticipants', '50')
          .attach('image', first.path);
        expect(created.status).toBe(201);
        eventId = created.body.data._id;
        originalImage = created.body.data.image;
        expect(originalImage).toMatch(/^\/uploads\/events\/.+\.png$/);

        const updated = await request(app)
          .put('/api/events/' + eventId)
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('image', second.path);
        expect(updated.status).toBe(200);
        expect(updated.body.data.image).not.toBe(originalImage);
        expect(updated.body.data.image).toMatch(/^\/uploads\/events\/.+\.jpg$/);
      } finally { first.cleanup(); second.cleanup(); }
    });

    test('admin listing reflects the updated image', async () => {
      const r = await request(app)
        .get('/api/events/admin?mosqueId=' + mosque._id)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(r.status).toBe(200);
      const event = r.body.data.find((e) => e.title === 'Update Image Event');
      expect(event).toBeDefined();
      expect(event.image).toMatch(/^\/uploads\/events\/.+\.jpg$/);
      expect(event.image).not.toBe(originalImage);
    });

    test('public listing reflects the updated image', async () => {
      const r = await request(app)
        .get('/api/events?mosqueId=' + mosque._id);
      expect(r.status).toBe(200);
      const event = r.body.data.find((e) => e.title === 'Update Image Event');
      expect(event).toBeDefined();
      expect(event.image).toMatch(/^\/uploads\/events\/.+\.jpg$/);
    });
  });

  describe('Group 3: no image — both sides return null/empty', () => {
    test('event without image has no image field', async () => {
      const r = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'No Image Event')
        .field('description', 'Plain event')
        .field('date', '2027-02-20')
        .field('time', '14:00')
        .field('location', 'Hall')
        .field('maxParticipants', '30');
      expect(r.status).toBe(201);
      expect(r.body.data.image).toBeFalsy();

      const adminList = await request(app)
        .get('/api/events/admin?mosqueId=' + mosque._id)
        .set('Authorization', `Bearer ${adminToken}`);
      const adminEvent = adminList.body.data.find((e) => e.title === 'No Image Event');
      expect(adminEvent).toBeDefined();
      expect(adminEvent.image).toBeFalsy();

      const publicList = await request(app)
        .get('/api/events?mosqueId=' + mosque._id);
      const publicEvent = publicList.body.data.find((e) => e.title === 'No Image Event');
      expect(publicEvent).toBeDefined();
      expect(publicEvent.image).toBeFalsy();
    });
  });

  describe('Group 4: scope — community role cannot upload', () => {
    test('community POST returns 403 (route guards before multer consumes body)', async () => {
      const r = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${communityToken}`)
        .field('title', 'Sneaky')
        .field('description', 'x')
        .field('date', '2027-03-01')
        .field('time', '10:00')
        .field('location', 'x')
        .field('maxParticipants', '1');
      expect(r.status).toBe(403);
    });
  });
});
