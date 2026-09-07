jest.mock('../../utils/sendEmail', () => jest.fn().mockResolvedValue({ messageId: 'test-mock' }));

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../server');
const User = require('../../models/User');
const Mosque = require('../../models/Mosque');
const NikahBooking = require('../../models/NikahBooking');

jest.setTimeout(30000);

function tomorrowAt(daysAhead, hours = 10) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function bookingPayload(date, time, overrides = {}) {
  return {
    groomName: 'Groom',
    brideName: 'Bride',
    ceremonyDate: date,
    ceremonyTime: time,
    phone: '03001234567',
    email: 'test@example.com',
    address: 'House 1, Sheikhupura',
    ...overrides,
  };
}

describe('Scholar list refresh after accept (BUG-32)', () => {
  let mongod;
  let manager;
  let admin;
  let mosque;
  let scholar;
  let scholarToken;
  let userA;
  let userB;
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

    manager = await User.create({ name: 'Manager', email: 'mgr@test.com', password: 'pass1234', role: 'manager' });
    admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'pass1234', role: 'admin' });
    scholar = await User.create({ name: 'Scholar', email: 'sch@test.com', password: 'pass1234', role: 'scholar' });
    userA = await User.create({ name: 'User A', email: 'ua@test.com', password: 'pass1234', role: 'community' });
    userB = await User.create({ name: 'User B', email: 'ub@test.com', password: 'pass1234', role: 'community' });

    mosque = await Mosque.create({
      name: 'Test Masjid', city: 'Sheikhupura',
      managerId: manager._id, admins: [admin._id], isActive: true,
    });

    await User.updateMany(
      { _id: { $in: [admin._id, scholar._id, userA._id, userB._id] } },
      { mosqueId: mosque._id }
    );

    scholarToken = (await request(app).post('/api/auth/login').send({ email: 'sch@test.com', password: 'pass1234' })).body.token;
    userAToken = (await request(app).post('/api/auth/login').send({ email: 'ua@test.com', password: 'pass1234' })).body.token;
    userBToken = (await request(app).post('/api/auth/login').send({ email: 'ub@test.com', password: 'pass1234' })).body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  test('after scholar accepts one, sibling no longer in pending list (frontend refetch will hide it)', async () => {
    const day = tomorrowAt(20);
    const slotTime = '17:30';

    const first = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'First Groom', brideName: 'First Bride' }));
    expect(first.status).toBe(201);
    const firstId = first.body.data._id;

    const second = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'Second Groom', brideName: 'Second Bride' }));
    expect(second.status).toBe(201);
    const secondId = second.body.data._id;

    const before = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${scholarToken}`);
    expect(before.status).toBe(200);
    const beforePending = before.body.data.filter((b) => b.status === 'pending');
    const beforeIds = beforePending.map((b) => String(b._id));
    expect(beforeIds).toContain(String(firstId));
    expect(beforeIds).toContain(String(secondId));

    const accept = await request(app)
      .put(`/api/nikah-bookings/${firstId}`)
      .set('Authorization', `Bearer ${scholarToken}`)
      .send({ status: 'accepted', confirmedDate: day.toISOString(), confirmedTime: slotTime });
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe('accepted');

    const after = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${scholarToken}`);
    expect(after.status).toBe(200);

    const afterPending = after.body.data.filter((b) => b.status === 'pending');
    const afterPendingIds = afterPending.map((b) => String(b._id));
    expect(afterPendingIds).not.toContain(String(secondId));
    expect(afterPendingIds).not.toContain(String(firstId));

    const secondDoc = await NikahBooking.findById(secondId);
    expect(secondDoc.status).toBe('rejected');
    expect(secondDoc.rejectionReason).toMatch(/slot was taken/i);
  });

  test('after scholar rejects one, sibling at same slot is unaffected and still pending', async () => {
    const day = tomorrowAt(21);
    const slotTime = '18:00';

    const target = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'Reject Me', brideName: 'Test' }));
    expect(target.status).toBe(201);
    const targetId = target.body.data._id;

    const sibling = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'Stay Pending', brideName: 'Test' }));
    expect(sibling.status).toBe(201);
    const siblingId = sibling.body.data._id;

    const reject = await request(app)
      .put(`/api/nikah-bookings/${targetId}`)
      .set('Authorization', `Bearer ${scholarToken}`)
      .send({ status: 'rejected', rejectionReason: 'Schedule conflict on requested date' });
    expect(reject.status).toBe(200);

    const targetDoc = await NikahBooking.findById(targetId);
    expect(targetDoc.status).toBe('rejected');
    expect(targetDoc.rejectionReason).toMatch(/Schedule conflict/);

    const siblingDoc = await NikahBooking.findById(siblingId);
    expect(siblingDoc.status).toBe('pending');

    const after = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${scholarToken}`);
    expect(after.status).toBe(200);
    const afterIds = after.body.data.map((b) => String(b._id));
    expect(afterIds).not.toContain(String(targetId));
    expect(afterIds).toContain(String(siblingId));
  });

  test('different-slot siblings stay pending after accept', async () => {
    const day = tomorrowAt(22);

    const winner = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(bookingPayload(day.toISOString(), '19:00', { groomName: 'Winner', brideName: 'Time' }));
    expect(winner.status).toBe(201);
    const winnerId = winner.body.data._id;

    const sameDayLater = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send(bookingPayload(day.toISOString(), '20:00', { groomName: 'Later', brideName: 'Slot' }));
    expect(sameDayLater.status).toBe(201);
    const sameDayLaterId = sameDayLater.body.data._id;

    const accept = await request(app)
      .put(`/api/nikah-bookings/${winnerId}`)
      .set('Authorization', `Bearer ${scholarToken}`)
      .send({ status: 'accepted', confirmedDate: day.toISOString(), confirmedTime: '19:00' });
    expect(accept.status).toBe(200);

    const after = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${scholarToken}`);
    expect(after.status).toBe(200);

    const laterAfter = after.body.data.find((b) => String(b._id) === String(sameDayLaterId));
    expect(laterAfter.status).toBe('pending');
  });

  test('user side also reflects the auto-reject after refetch (mirrors MyBookings behaviour)', async () => {
    const day = tomorrowAt(23);
    const slotTime = '15:00';

    const userABooking = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userAToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'UserA Winner', brideName: 'Test' }));
    expect(userABooking.status).toBe(201);
    const userAId = userABooking.body.data._id;

    const userBBooking = await request(app)
      .post('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userBToken}`)
      .send(bookingPayload(day.toISOString(), slotTime, { groomName: 'UserB Loser', brideName: 'Test' }));
    expect(userBBooking.status).toBe(201);
    const userBId = userBBooking.body.data._id;

    await request(app)
      .put(`/api/nikah-bookings/${userAId}`)
      .set('Authorization', `Bearer ${scholarToken}`)
      .send({ status: 'accepted', confirmedDate: day.toISOString(), confirmedTime: slotTime });

    const userBList = await request(app)
      .get('/api/nikah-bookings')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(userBList.status).toBe(200);
    const userBAfter = userBList.body.data.find((b) => String(b._id) === String(userBId));
    expect(userBAfter).toBeTruthy();
    expect(userBAfter.status).toBe('rejected');
    expect(userBAfter.rejectionReason).toMatch(/slot was taken/i);
  });
});
