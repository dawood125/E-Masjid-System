jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const Campaign = require('../../models/Campaign');
const Testimonial = require('../../models/Testimonial');
const HeroSlide = require('../../models/HeroSlide');

jest.setTimeout(30000);

function tmpImage(ext, body) {
  const buf = body || Buffer.from([
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
  const p = path.join(os.tmpdir(), 'emasjid-test-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext);
  fs.writeFileSync(p, buf);
  return { path: p, cleanup: () => { try { fs.unlinkSync(p); } catch (_) {} } };
}

function txtFile() {
  const p = path.join(os.tmpdir(), 'emasjid-test-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.txt');
  fs.writeFileSync(p, 'this is not an image');
  return { path: p, cleanup: () => { try { fs.unlinkSync(p); } catch (_) {} } };
}

function oversizeFile() {
  const buf = Buffer.alloc(6 * 1024 * 1024, 0);
  buf[0] = 0x89; buf[1] = 0x50; buf[2] = 0x4e; buf[3] = 0x47;
  const p = path.join(os.tmpdir(), 'emasjid-test-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.png');
  fs.writeFileSync(p, buf);
  return { path: p, cleanup: () => { try { fs.unlinkSync(p); } catch (_) {} } };
}

describe('Admin Marketing image uploads (BUG-24/25/26 fix)', () => {
  let mongod;
  let managerUser;
  let adminAUser;
  let adminBUser;
  let adminAToken;
  let adminBToken;
  let managerToken;
  let committeeToken;
  let communityToken;
  let mosqueA;
  let mosqueB;

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
      Campaign.deleteMany({}),
      Testimonial.deleteMany({}),
      HeroSlide.deleteMany({}),
    ]);

    managerUser = await User.create({ name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager' });
    adminAUser = await User.create({ name: 'Admin A', email: 'admin.a@test.com', password: 'pass1234', role: 'admin' });
    adminBUser = await User.create({ name: 'Admin B', email: 'admin.b@test.com', password: 'pass1234', role: 'admin' });
    const committeeUser = await User.create({ name: 'Committee', email: 'committee@test.com', password: 'pass1234', role: 'committee' });
    const communityUser = await User.create({ name: 'Community', email: 'community@test.com', password: 'pass1234', role: 'community' });

    mosqueA = await Mosque.create({
      name: 'Masjid A', city: 'CityA',
      managerId: managerUser._id, admins: [adminAUser._id], isActive: true,
    });
    mosqueB = await Mosque.create({
      name: 'Masjid B', city: 'CityB',
      managerId: managerUser._id, admins: [adminBUser._id], isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [adminAUser._id, committeeUser._id, communityUser._id] } },
      { mosqueId: mosqueA._id }
    );
    await User.updateOne({ _id: adminBUser._id }, { mosqueId: mosqueB._id });

    managerToken = await login('mgr@test.com');
    adminAToken = await login('admin.a@test.com');
    adminBToken = await login('admin.b@test.com');
    committeeToken = await login('committee@test.com');
    communityToken = await login('community@test.com');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  describe('Group 1: public (no token)', () => {
    test('POST campaign without token returns 401', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/campaigns')
        .field('title', 'No Auth')
        .field('targetAmount', '1000');
      expect(r.status).toBe(401);
    });

    test('POST testimonial without token returns 401', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/testimonials')
        .field('name', 'No Auth')
        .field('role', 'Member')
        .field('quote', 'Long enough quote for the validator.');
      expect(r.status).toBe(401);
    });

    test('POST hero slide without token returns 401', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/hero-slides')
        .field('caption', 'No Auth');
      expect(r.status).toBe(401);
    });
  });

  describe('Group 2: role authorization', () => {
    test('community cannot upload campaign image (403)', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/campaigns')
        .set('Authorization', `Bearer ${communityToken}`)
        .field('title', 'Test')
        .field('targetAmount', '1000');
      expect(r.status).toBe(403);
    });

    test('committee cannot upload testimonial photo (403)', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/testimonials')
        .set('Authorization', `Bearer ${committeeToken}`)
        .field('name', 'T')
        .field('role', 'T')
        .field('quote', 'Long enough quote here yes.');
      expect(r.status).toBe(403);
    });
  });

  describe('Group 3: cross-mosque deny', () => {
    test('admin of masjid B cannot update a campaign that belongs to masjid A', async () => {
      const created = await request(app)
        .post('/api/admin/marketing/campaigns')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('title', 'Belongs to Masjid A')
        .field('targetAmount', '5000')
        .field('image', 'https://example.com/a.jpg');
      expect(created.status).toBe(201);
      const id = created.body.data._id;

      const r = await request(app)
        .put(`/api/admin/marketing/campaigns/${id}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .field('title', 'Hijack attempt')
        .field('targetAmount', '999');
      expect(r.status).toBe(404);

      const inDb = await Campaign.findById(id);
      expect(inDb.title).toBe('Belongs to Masjid A');
    });

    test('admin of masjid B cannot delete a campaign that belongs to masjid A', async () => {
      const created = await request(app)
        .post('/api/admin/marketing/campaigns')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('title', 'Do Not Delete')
        .field('targetAmount', '100')
        .field('image', 'https://example.com/x.jpg');
      const id = created.body.data._id;

      const r = await request(app)
        .delete(`/api/admin/marketing/campaigns/${id}`)
        .set('Authorization', `Bearer ${adminBToken}`);
      expect(r.status).toBe(404);

      const still = await Campaign.findById(id);
      expect(still).not.toBeNull();
    });
  });

  describe('Group 4: online happy path — file upload', () => {
    test('admin uploads a campaign image (PNG)', async () => {
      const f = tmpImage('png');
      try {
        const r = await request(app)
          .post('/api/admin/marketing/campaigns')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('title', 'Build New Minaret')
          .field('targetAmount', '800000')
          .field('subtitle', 'Help us grow')
          .attach('image', f.path);
        expect(r.status).toBe(201);
        expect(r.body.success).toBe(true);
        expect(r.body.data.image).toMatch(/^\/uploads\/marketing\/campaigns\/.+\.png$/);

        const savedPath = path.join(__dirname, '..', '..', 'uploads', 'marketing', 'campaigns', path.basename(r.body.data.image));
        expect(fs.existsSync(savedPath)).toBe(true);
      } finally { f.cleanup(); }
    });

    test('admin uploads a testimonial photo (JPG)', async () => {
      const f = tmpImage('jpg');
      try {
        const r = await request(app)
          .post('/api/admin/marketing/testimonials')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('name', 'Haji Ahmad')
          .field('role', 'Community Member')
          .field('quote', 'Our mosque changed my family’s life in many beautiful ways.')
          .attach('photo', f.path);
        expect(r.status).toBe(201);
        expect(r.body.data.photo).toMatch(/^\/uploads\/marketing\/testimonials\/.+\.jpg$/);

        const savedPath = path.join(__dirname, '..', '..', 'uploads', 'marketing', 'testimonials', path.basename(r.body.data.photo));
        expect(fs.existsSync(savedPath)).toBe(true);
      } finally { f.cleanup(); }
    });

    test('admin uploads hero slide image + mobile image together', async () => {
      const desktop = tmpImage('png');
      const mobile = tmpImage('webp');
      try {
        const r = await request(app)
          .post('/api/admin/marketing/hero-slides')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('caption', 'Fajr at dawn')
          .field('order', '1')
          .attach('image', desktop.path)
          .attach('mobileImage', mobile.path);
        expect(r.status).toBe(201);
        expect(r.body.data.image).toMatch(/^\/uploads\/marketing\/hero-slides\/.+\.png$/);
        expect(r.body.data.mobileImage).toMatch(/^\/uploads\/marketing\/hero-slides\/.+\.webp$/);
      } finally { desktop.cleanup(); mobile.cleanup(); }
    });

    test('GET /uploads/marketing/... serves the uploaded file', async () => {
      const f = tmpImage('png');
      try {
        const r = await request(app)
          .post('/api/admin/marketing/campaigns')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('title', 'Serve Test')
          .field('targetAmount', '100')
          .attach('image', f.path);
        expect(r.status).toBe(201);
        const url = r.body.data.image;
        const fetch = await request(app).get(url);
        expect(fetch.status).toBe(200);
        expect(fetch.headers['content-type']).toMatch(/image/);
      } finally { f.cleanup(); }
    });

    test('PUT updates an existing campaign image', async () => {
      const first = tmpImage('png');
      const second = tmpImage('jpg');
      try {
        const created = await request(app)
          .post('/api/admin/marketing/campaigns')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('title', 'Update Image')
          .field('targetAmount', '500')
          .attach('image', first.path);
        expect(created.status).toBe(201);
        const id = created.body.data._id;
        const originalImage = created.body.data.image;

        const updated = await request(app)
          .put('/api/admin/marketing/campaigns/' + id)
          .set('Authorization', `Bearer ${adminAToken}`)
          .attach('image', second.path);
        expect(updated.status).toBe(200);
        expect(updated.body.data.image).not.toBe(originalImage);
        expect(updated.body.data.image).toMatch(/^\/uploads\/marketing\/campaigns\/.+\.jpg$/);
      } finally { first.cleanup(); second.cleanup(); }
    });
  });

  describe('Group 5: URL-only fallback (no file)', () => {
    test('campaign can still be created with URL only', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/campaigns')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('title', 'URL Only Campaign')
        .field('targetAmount', '1000')
        .field('image', 'https://example.com/banner.jpg');
      expect(r.status).toBe(201);
      expect(r.body.data.image).toBe('https://example.com/banner.jpg');
    });

    test('testimonial with URL-only photo works', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/testimonials')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('name', 'URL Person')
        .field('role', 'Member')
        .field('quote', 'A perfectly fine quote at least ten characters.')
        .field('photo', '/assets/images/testimonials/testimonial-1.jpg');
      expect(r.status).toBe(201);
      expect(r.body.data.photo).toBe('/assets/images/testimonials/testimonial-1.jpg');
    });
  });

  describe('Group 6: validation', () => {
    test('non-image file is rejected (400)', async () => {
      const f = txtFile();
      try {
        const r = await request(app)
          .post('/api/admin/marketing/campaigns')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('title', 'Bad File')
          .field('targetAmount', '100')
          .attach('image', f.path);
        expect(r.status).toBe(400);
      } finally { f.cleanup(); }
    });

    test('oversize file is rejected (400)', async () => {
      const f = oversizeFile();
      try {
        const r = await request(app)
          .post('/api/admin/marketing/campaigns')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('title', 'Oversize')
          .field('targetAmount', '100')
          .attach('image', f.path);
        expect(r.status).toBe(400);
      } finally { f.cleanup(); }
    });

    test('hero slide with neither file nor URL returns 400', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/hero-slides')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('caption', 'No image at all');
      expect(r.status).toBe(400);
      expect(r.body.message).toMatch(/Image is required/);
    });

    test('hero slide with only URL (no file) is accepted', async () => {
      const r = await request(app)
        .post('/api/admin/marketing/hero-slides')
        .set('Authorization', `Bearer ${adminAToken}`)
        .field('caption', 'URL only slide')
        .field('image', 'https://example.com/slide.jpg');
      expect(r.status).toBe(201);
      expect(r.body.data.image).toBe('https://example.com/slide.jpg');
    });

    test('hero slide with only file (no URL) is accepted', async () => {
      const f = tmpImage('png');
      try {
        const r = await request(app)
          .post('/api/admin/marketing/hero-slides')
          .set('Authorization', `Bearer ${adminAToken}`)
          .field('caption', 'File only slide')
          .attach('image', f.path);
        expect(r.status).toBe(201);
        expect(r.body.data.image).toMatch(/^\/uploads\/marketing\/hero-slides\/.+\.png$/);
      } finally { f.cleanup(); }
    });
  });
});
