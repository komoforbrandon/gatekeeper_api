// test/gatekeeper.test.js — contract tests for the Gatekeeper Ticket Sales API.
//
// We test the service the way a real client uses it: start the app on a random
// free port, send real HTTP requests with fetch, and assert on the status codes
// and JSON it returns. No browser, no extra libraries — just Node's built-in
// test runner (node:test) and assert.
//
// The API has ORGANIZERS, CUSTOMERS, and EVENTS, so the tests:
//   1. Log in as the seeded organizer user (who owns the sample events).
//   2. Validate true keyset pagination with cursor matching parameters.
//   3. Assert on atomic transaction states and double-booking concurrency.
//
// `npm test` first runs your migration and seed scripts (the "pretest" step)
// against the TEST database, so every run starts from the same known data.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from '../src/app.js'
import { db } from '../src/db.js'

const json = { 'content-type': 'application/json' }
function bearer(token) {
  return { 'content-type': 'application/json', authorization: `Bearer ${token}` }
}

async function login(base, email, password) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ email, password })
  })
  return (await res.json()).token
}

async function request(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, options)
  const body = res.status === 204 ? null : await res.json()

  return { res, body }
}

test('Gatekeeper API contract', async (t) => {
  const app = createApp()
  const server = app.listen(0)
  await once(server, 'listening')
  const base = `http://localhost:${server.address().port}`

  t.after(async () => {
    server.close()
    await once(server, 'close')
    await db.end()
  })

  // Use the seeded user 'kb@gmail.com' (ID: 4) from our seed data setup
  const organizerToken = await login(base, 'kb@gmail.com', 'password123')
  assert.ok(organizerToken)

  // -------------------------------------------------------------------------
  // 1. Authentication & Route Guard Tests
  // -------------------------------------------------------------------------
  await t.test('GET /health returns 200 OK public status without token context', async () => {
    const { res, body } = await request(base, '/health')

    assert.equal(res.status, 200)
    assert.deepEqual(body, { status: 'ok' })
  })

  await t.test('POST /events without token returns 401 Unauthorized', async () => {
    const { res, body } = await request(base, '/events', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({
        name: 'Unauthorized Event',
        venue: 'No Token Hall',
        starts_at: '2027-01-01T10:00:00.000Z',
        capacity: 25
      })
    })

    assert.equal(res.status, 401)
    assert.equal(body.error.status, 401)
  })

  await t.test('GET /events/:id/bookings without token returns 401 Unauthorized', async () => {
    const { res, body } = await request(base, '/events/11/bookings')

    assert.equal(res.status, 401)
    assert.equal(body.error.status, 401)
  })

  // -------------------------------------------------------------------------
  // 2. Input Boundary Validation Tests (Zod Constraints)
  // -------------------------------------------------------------------------
  await t.test('POST /events returns 400 Bad Request if missing fields or using bad date formats', async () => {
    const missingFields = await request(base, '/events', {
      method: 'POST',
      headers: bearer(organizerToken),
      body: JSON.stringify({
        name: 'Broken Event',
        starts_at: '2027-01-01T10:00:00.000Z'
      })
    })
    const badDate = await request(base, '/events', {
      method: 'POST',
      headers: bearer(organizerToken),
      body: JSON.stringify({
        name: 'Broken Event',
        venue: 'Bad Date Hall',
        starts_at: 'next Tuesday',
        capacity: 25
      })
    })

    assert.equal(missingFields.res.status, 400)
    assert.equal(missingFields.body.error.status, 400)
    assert.equal(badDate.res.status, 400)
    assert.equal(badDate.body.error.status, 400)
  })

  await t.test('POST /events/:id/bookings returns 400 Bad Request if missing customer_id or quantity > 10', async () => {
    const missingCustomer = await request(base, '/events/10/bookings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ quantity: 1 })
    })
    const tooManySeats = await request(base, '/events/10/bookings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ customer_id: 1, quantity: 11 })
    })

    assert.equal(missingCustomer.res.status, 400)
    assert.equal(missingCustomer.body.error.status, 400)
    assert.equal(tooManySeats.res.status, 400)
    assert.equal(tooManySeats.body.error.status, 400)
  })

  await t.test('GET /events?after=-5 returns 400 Bad Request because cursor must be nonnegative', async () => {
    const { res, body } = await request(base, '/events?after=-5')

    assert.equal(res.status, 400)
    assert.equal(body.error.status, 400)
  })

  // -------------------------------------------------------------------------
  // 3. Keyset Pagination & Read Tests
  // -------------------------------------------------------------------------
  await t.test("GET /events?limit=2 returns items payload and a numeric 'next' tracking ID cursor", async () => {
    const { res, body } = await request(base, '/events?limit=2')

    assert.equal(res.status, 200)
    assert.equal(body.events.length, 2)
    assert.equal(body.events[0].id, 1)
    assert.equal(body.events[1].id, 2)
    assert.equal(body.next, 2)
  })

  await t.test('GET /events/:id returns 200 for seed event 11, matching its initial configuration', async () => {
    const { res, body } = await request(base, '/events/11')

    assert.equal(res.status, 200)
    assert.equal(body.id, 11)
    assert.equal(body.organizer_id, 4)
    assert.equal(body.name, 'Regional Robotics Expo')
    assert.equal(body.venue, 'Metro Trade Center')
    assert.equal(body.capacity, 50)
    assert.equal(body.seats_remaining, 0)
    assert.equal(body.status, 'sold_out')
  })

  await t.test('GET /events/999999 returns a proper 404 Not Found error code object', async () => {
    const { res, body } = await request(base, '/events/999999')

    assert.equal(res.status, 404)
    assert.deepEqual(body, { error: 'Event not found' })
  })

  await t.test("GET /events/:id/bookings?limit=2 returns organizer collection rows or 403 if token owner doesn't match", async () => {
    const owned = await request(base, '/events/11/bookings?limit=2', {
      headers: bearer(organizerToken)
    })
    const notOwned = await request(base, '/events/1/bookings?limit=2', {
      headers: bearer(organizerToken)
    })

    assert.equal(owned.res.status, 200)
    assert.equal(owned.body.bookings.length, 2)
    assert.equal(owned.body.bookings[0].event_id, 11)
    assert.equal(owned.body.next, owned.body.bookings.at(-1).id)
    assert.equal(notOwned.res.status, 403)
    assert.equal(notOwned.body.error, 'Forbidden: You are not the organizer of this event')
  })

  // -------------------------------------------------------------------------
  // 4. Concurrency Signature & Transactional Verification
  // -------------------------------------------------------------------------
  await t.test("POST /events/:id/bookings returns a 201 Created and matching 'Location' header payload string on success", async () => {
    const { res, body } = await request(base, '/events/10/bookings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ customer_id: 1, quantity: 1 })
    })

    assert.equal(res.status, 201)
    assert.equal(body.success, true)
    assert.equal(body.bookingInfo.event_id, 10)
    assert.equal(body.bookingInfo.customer_id, 1)
    assert.equal(body.bookingInfo.quantity, 1)
    assert.equal(res.headers.get('location'), `/bookings/${body.bookingInfo.id}`)
  })

  await t.test('transactional rollback blocks a bad customer ID and leaves seats_remaining intact', async () => {
    const before = await request(base, '/events/10')
    const attempted = await request(base, '/events/10/bookings', {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ customer_id: 999999, quantity: 1 })
    })
    const after = await request(base, '/events/10')

    assert.equal(attempted.res.status, 400)
    assert.equal(attempted.body.error, 'Unknown customer reference')
    assert.equal(after.body.seats_remaining, before.body.seats_remaining)
  })

  await t.test('critical concurrency runner allows exactly one order for one remaining seat', async () => {
    const createdEvent = await request(base, '/events', {
      method: 'POST',
      headers: bearer(organizerToken),
      body: JSON.stringify({
        name: 'One Seat Concurrency Probe',
        venue: 'Atomicity Lab',
        starts_at: '2027-01-01T10:00:00.000Z',
        capacity: 1
      })
    })

    assert.equal(createdEvent.res.status, 201)

    const eventId = createdEvent.body.id
    const order = (customer_id) => request(base, `/events/${eventId}/bookings`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ customer_id, quantity: 1 })
    })
    const results = await Promise.all([order(1), order(2)])
    const statuses = results.map(({ res }) => res.status).sort()
    const finalEvent = await request(base, `/events/${eventId}`)

    assert.deepEqual(statuses, [201, 409])
    assert.equal(finalEvent.body.seats_remaining, 0)
    assert.equal(finalEvent.body.status, 'sold_out')
  })

  // -------------------------------------------------------------------------
  // 5. Security Regression Tests (SQL Injection Defenses)
  // -------------------------------------------------------------------------
  await t.test('GET /events/:id rejects an injection vector without leaking arbitrary rows', async () => {
    const { res, body } = await request(base, "/events/'%20OR%20'1'%3D'1")

    assert.ok(res.status === 400 || res.status === 404)
    if (res.status === 400) {
      assert.equal(body.error.status, 400)
    } else {
      assert.deepEqual(body, { error: 'Event not found' })
    }
  })
})
