# Gatekeeper Ticket Sales API

Gatekeeper is a Node.js and PostgreSQL ticket sales API for organizers, customers, events, and bookings. It exposes a small but realistic backend surface:

- Organizer registration and login with JWT bearer tokens
- Public customer creation
- Event listing with keyset pagination
- Organizer-owned event creation
- Organizer-restricted booking inspection
- Transactional booking creation with atomic seat decrement logic
- Booking lookup and cancellation with seat restoration
- OpenAPI/Swagger documentation at `/docs`
- Contract tests that run against a real HTTP server and a real PostgreSQL test database

The app is written as an Express service with native ES modules, `pg` for database access, Zod validation, bcrypt password hashing, JWT authentication, Helmet, CORS, rate limiting, and Pino request logging.

## Table Of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Runtime Requirements](#runtime-requirements)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Locally](#running-locally)
- [Seed Data](#seed-data)
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Endpoint Reference](#endpoint-reference)
- [Pagination](#pagination)
- [Transactions And Concurrency](#transactions-and-concurrency)
- [Validation Rules](#validation-rules)
- [Error Responses](#error-responses)
- [Testing](#testing)
- [OpenAPI Docs](#openapi-docs)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Tech Stack

| Layer | Tooling |
| --- | --- |
| Runtime | Node.js `>=20`, ES modules |
| Package manager | `pnpm` `^11.8.0` |
| HTTP framework | Express `5.x` |
| Database | PostgreSQL |
| DB client | `pg` connection pool |
| Validation | Zod |
| Auth | bcrypt password hashes, JWT bearer tokens |
| Security middleware | Helmet, CORS, express-rate-limit |
| Logging | Pino and pino-http |
| Tests | Native `node:test`, `node:assert/strict`, native `fetch` |
| Docs | Swagger UI served from `docs/openapi.json` |

## Project Structure

```text
gatekeeper_api/
|-- db/
|   |-- schemas.sql          # PostgreSQL tables, checks, and indexes
|   `-- seed.sql             # deterministic sample users, events, customers, bookings
|-- docs/
|   `-- openapi.json         # OpenAPI 3.0 spec served by /docs
|-- scripts/
|   |-- migrate.js           # applies db/schemas.sql
|   |-- seed.js              # applies db/seed.sql
|   `-- reset-db.js          # drops/recreates public schema, migrates, seeds
|-- src/
|   |-- app.js               # Express app factory and middleware stack
|   |-- server.js            # HTTP server startup and graceful shutdown
|   |-- config.js            # environment validation
|   |-- db.js                # PostgreSQL pool
|   |-- lib/                 # validation, logger, password, token helpers
|   |-- middlewares/         # auth middleware
|   |-- models/              # SQL access layer
|   `-- routes/              # HTTP route handlers
|-- test/
|   `-- gatekeeper.test.js   # end-to-end contract test suite
|-- render.yaml              # Render deployment blueprint
`-- package.json
```

## Runtime Requirements

Install these before running the project:

- Node.js `20` or newer
- pnpm `11.8` or newer
- PostgreSQL running locally or reachable via `DATABASE_URL`

This package declares a `devEngines.packageManager` requirement for pnpm. Running scripts with `npm` may fail with `EBADDEVENGINES`; use `pnpm`.

## Environment Variables

The app validates environment variables at startup in `src/config.js`.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP port for `src/server.js` |
| `DATABASE_URL` | Yes | none | PostgreSQL connection string |
| `JWT_SECRET` | Yes | none | Secret used to sign and verify JWTs |
| `NODE_ENV` | No | `development` | One of `development`, `test`, `production` |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `CORS_ORIGIN` | No | `*` | CORS origin value |
| `RATE_LIMIT_MAX` | No | `100` | Requests allowed per minute after `/health` |

Example `.env`:

```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gatekeeper_db
JWT_SECRET=dev-secret-change-me
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
```

Example `.env.test`:

```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/gatekeeper_db_test
JWT_SECRET=dev-secret-for-tests
NODE_ENV=test
LOG_LEVEL=silent
CORS_ORIGIN=*
RATE_LIMIT_MAX=10000
```

## Database Setup

Create a PostgreSQL database that matches your `DATABASE_URL`.

```bash
createdb gatekeeper_db
```

Then install dependencies and initialize the schema/data:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

For a clean local reset:

```bash
pnpm db:reset
```

`db:reset` drops and recreates the `public` schema, then loads the table definitions and seed data. Use it only against a development or test database.

## Running Locally

Start the API:

```bash
pnpm start
```

Start in watch mode:

```bash
pnpm dev
```

Useful URLs:

- API base: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/docs`

## Seed Data

`db/seed.sql` inserts deterministic sample data:

- 5 organizer users
- 12 events
- 20 customers
- 40 bookings

All seeded organizer accounts use the password:

```text
password123
```

Useful seeded organizer:

| ID | Email | Notes |
| --- | --- | --- |
| `4` | `kb@gmail.com` | Owns seed events `10` and `11` |

Useful seeded events:

| ID | Name | Organizer | Capacity | Seeded Remaining | Status |
| --- | --- | --- | --- | --- | --- |
| `10` | Morning Coffee & Code | `4` | `90` | `71` | `on_sale` |
| `11` | Regional Robotics Expo | `4` | `50` | `0` | `sold_out` |

The contract test logs in as `kb@gmail.com` and checks organizer access against this seeded ownership.

## API Overview

The routes are mounted in `src/app.js`:

| Prefix | Router | Purpose |
| --- | --- | --- |
| `/health` | inline | Public liveness endpoint |
| `/auth` | `authRoute.js` | Organizer registration/login |
| `/events` | `eventRoute.js` | Event reads, event creation, event booking creation/listing |
| `/bookings` | `bookingRoute.js` | Booking lookup and cancellation |
| `/customers` | `customerRoute.js` | Customer creation |
| `/docs` | `docsRoute.js` | Swagger UI |

All request and response bodies are JSON except `204 No Content` responses.

## Authentication

Organizer-only endpoints require:

```http
Authorization: Bearer <token>
```

Get a token:

```bash
curl -s http://localhost:3000/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"kb@gmail.com","password":"password123"}'
```

Successful login response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 4,
    "email": "kb@gmail.com"
  }
}
```

JWTs are signed with `JWT_SECRET` and expire after `7d`.

## Endpoint Reference

### `GET /health`

Public health check.

Response:

```json
{
  "status": "ok"
}
```

### `POST /auth/register`

Creates an organizer account.

Request:

```json
{
  "email": "organizer@example.com",
  "password": "password123"
}
```

Response `201`:

```json
{
  "id": 6,
  "email": "organizer@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Possible errors:

- `422` validation failure
- `409` duplicate email

### `POST /auth/login`

Authenticates an organizer.

Request:

```json
{
  "email": "kb@gmail.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 4,
    "email": "kb@gmail.com"
  }
}
```

Possible errors:

- `422` validation failure
- `401` invalid email or password

### `POST /customers`

Creates a customer profile that can be used for bookings.

Request:

```json
{
  "full_name": "Ada Lovelace",
  "email": "ada@example.com"
}
```

Response `201`:

```json
{
  "id": 21,
  "full_name": "Ada Lovelace",
  "email": "ada@example.com"
}
```

Possible errors:

- `400` validation failure
- `400` duplicate customer email, returned as `Customer already exists` by the current model path

### `GET /events`

Lists events with keyset pagination.

Query parameters:

| Name | Default | Rule |
| --- | --- | --- |
| `after` | `0` | integer, nonnegative |
| `limit` | `20` | integer, `1..100` |

Example:

```bash
curl -s 'http://localhost:3000/events?limit=2'
```

Response `200`:

```json
{
  "events": [
    {
      "id": 1,
      "name": "Tech Innovators Summit 2026",
      "venue": "Silicon Convention Center Hall A",
      "capacity": 150,
      "seats_remaining": 133,
      "starts_at": "2026-08-08T...",
      "organizer_id": 1,
      "status": "on_sale"
    }
  ],
  "next": 2
}
```

Use the returned `next` as the next request's `after` value:

```bash
curl -s 'http://localhost:3000/events?after=2&limit=2'
```

### `GET /events/:id`

Fetches one event by ID.

Response `200`:

```json
{
  "id": 11,
  "name": "Regional Robotics Expo",
  "venue": "Metro Trade Center",
  "capacity": 50,
  "seats_remaining": 0,
  "starts_at": "2026-08-13T...",
  "organizer_id": 4,
  "status": "sold_out"
}
```

Possible errors:

- `400` invalid ID
- `404` event not found

### `POST /events`

Creates an event. Requires an organizer bearer token.

Request:

```json
{
  "name": "NodeConf Local",
  "venue": "Main Hall",
  "starts_at": "2027-01-01T10:00:00.000Z",
  "capacity": 100
}
```

Response `201`:

```json
{
  "id": 13,
  "organizer_id": 4,
  "name": "NodeConf Local",
  "venue": "Main Hall",
  "starts_at": "2027-01-01T10:00:00.000Z",
  "capacity": 100,
  "seats_remaining": 100,
  "status": "on_sale"
}
```

Possible errors:

- `400` validation failure
- `401` missing or invalid bearer token

### `GET /events/:id/bookings`

Lists bookings for a specific event. Requires an organizer bearer token, and the token user must own the event.

Query parameters:

| Name | Default | Rule |
| --- | --- | --- |
| `after` | `0` | integer, nonnegative |
| `limit` | `20` | integer, `1..100` |

Response `200`:

```json
{
  "bookings": [
    {
      "id": 22,
      "event_id": 11,
      "customer_id": 2,
      "quantity": 15,
      "status": "confirmed",
      "booked_at": "2026-07-24T..."
    }
  ],
  "next": 23
}
```

Possible errors:

- `400` invalid ID or pagination query
- `401` missing or invalid bearer token
- `403` authenticated user is not the event organizer
- `404` event not found

### `POST /events/:id/bookings`

Books tickets for an event. This endpoint is public in the current code path: it requires an existing `customer_id`, but it does not require a bearer token.

Request:

```json
{
  "customer_id": 1,
  "quantity": 2
}
```

Response `201`:

```json
{
  "success": true,
  "bookingInfo": {
    "id": 41,
    "event_id": 10,
    "customer_id": 1,
    "quantity": 2,
    "status": "confirmed"
  },
  "customerInfo": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john.doe@gmail.com"
  }
}
```

Response headers include:

```http
Location: /bookings/41
```

Possible errors:

- `400` invalid body
- `400` unknown customer
- `404` event not found
- `409` event is sold out, cancelled, or does not have enough seats

### `GET /bookings/:id`

Fetches one booking.

Response `200`:

```json
{
  "id": 1,
  "event_id": 1,
  "customer_id": 1,
  "quantity": 3,
  "status": "confirmed",
  "booked_at": "2026-07-21T..."
}
```

Possible errors:

- `400` invalid ID
- `404` booking not found

### `POST /bookings/:id/cancel`

Cancels a confirmed booking and restores seats to the related event transactionally.

Response:

```http
204 No Content
```

Possible errors:

- `400` invalid ID
- `404` booking not found
- `409` booking already cancelled

## Pagination

Gatekeeper uses ID-based keyset pagination on collections:

- Events are selected where `events.id > after`
- Event bookings are selected where `bookings.event_id = id AND bookings.id > after`
- Results are ordered by `id ASC`
- `next` is the last row ID in the returned page, or `null` when there are no rows

Example flow:

```bash
curl -s 'http://localhost:3000/events?limit=2'
curl -s 'http://localhost:3000/events?after=2&limit=2'
```

This avoids offset pagination drift and keeps the query shape simple and index-friendly.

## Transactions And Concurrency

Booking creation is implemented in `src/models/events.js` with an explicit PostgreSQL transaction:

1. `BEGIN`
2. Confirm the customer exists
3. Atomically decrement event seats with a guarded `UPDATE`
4. Insert the booking row
5. `COMMIT`

The critical guard is:

```sql
UPDATE events
SET seats_remaining = seats_remaining - $1,
    status = CASE
      WHEN seats_remaining - $1 <= 0 THEN 'sold_out'
      ELSE status
    END
WHERE id = $2
  AND status = 'on_sale'
  AND seats_remaining >= $1
RETURNING seats_remaining
```

Because the seat check and decrement happen in the same `UPDATE`, concurrent requests cannot both sell the final seat. The contract test creates an event with exactly one seat, fires two simultaneous booking requests, and asserts that exactly one succeeds with `201` while the other receives `409`.

Cancellation is also transactional:

1. `BEGIN`
2. Check booking exists
3. Reject if already cancelled
4. Mark booking as `cancelled`
5. Restore seats on the related event
6. If the event was `sold_out`, switch it back to `on_sale`
7. `COMMIT`

## Validation Rules

Validation lives in `src/lib/schemas.js`.

| Schema | Rules |
| --- | --- |
| `idSchema` | positive integer, coercible from path string |
| `userSchema.email` | valid email, max 255 chars |
| `userSchema.password` | max 255 chars |
| `createCustomerSchema.full_name` | string, max 120 chars |
| `createCustomerSchema.email` | valid email, max 255 chars |
| `createEventSchema.name` | string, min 1, max 150 chars |
| `createEventSchema.venue` | string, min 1, max 150 chars |
| `createEventSchema.starts_at` | ISO date-time string |
| `createEventSchema.capacity` | positive integer |
| `createBookingsSchema.customer_id` | positive integer |
| `createBookingsSchema.quantity` | integer from `1` to `10` |
| `listeventQuerySchema.after` | nonnegative integer, default `0` |
| `listeventQuerySchema.limit` | positive integer, max `100`, default `20` |

Event and booking creation schemas are strict, so unexpected extra fields are rejected.

## Error Responses

Most middleware and validation errors use the standard envelope from `src/app.js`:

```json
{
  "error": {
    "status": 400,
    "message": "Validation Error"
  }
}
```

Some route-level domain errors currently return a simpler shape:

```json
{
  "error": "Event not found"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `400` | validation error, bad ID, unknown customer |
| `401` | missing/invalid auth token or invalid credentials |
| `403` | organizer does not own the requested event |
| `404` | event/booking/route not found |
| `409` | duplicate account, already-cancelled booking, sold-out/cancelled event |
| `422` | auth payload validation error in register/login |
| `500` | unexpected internal failure |

In `development`, validation details may be included in `error.detail`. In `test` and `production`, details are hidden.

## Testing

Run the full test suite:

```bash
pnpm test
```

The `pretest` script runs first:

```bash
node --env-file=.env.test scripts/reset-db.js
```

Then Node's built-in test runner executes:

```bash
node --env-file=.env.test --test
```

The contract test in `test/gatekeeper.test.js`:

- Starts the app on a random free port with `createApp().listen(0)`
- Uses native Node `fetch`
- Uses `node:test` and `node:assert/strict`
- Logs in as seeded organizer `kb@gmail.com`
- Exercises real HTTP requests
- Verifies validation, auth guards, pagination, reads, transactions, rollback, and double-booking protection
- Closes the HTTP server and PostgreSQL pool in `t.after()` so the process does not hang

Run linting:

```bash
pnpm lint
```

## OpenAPI Docs

Swagger UI is mounted at:

```text
GET /docs
```

The source spec is:

```text
docs/openapi.json
```

When routes change, update both the route handler and `docs/openapi.json` so the interactive docs stay accurate.

## Deployment Notes

`render.yaml` defines a Render deployment:

- Web service name: `gatekeeper-api`
- Runtime: Node
- Health check: `/health`
- Production environment: `NODE_ENV=production`
- `JWT_SECRET` generated by Render
- `DATABASE_URL` linked from the Render PostgreSQL database
- `preDeployCommand`: `node scripts/migrate.js`

Important note: the current `render.yaml` uses `npm ci` as the build command, while this project declares pnpm in `devEngines` and includes a `pnpm-lock.yaml`. For a pnpm-first deployment, prefer:

```yaml
buildCommand: corepack enable && pnpm install --frozen-lockfile
startCommand: node src/server.js
```

or make sure the deployment platform's Node/npm behavior is configured to tolerate the package manager requirement.

## Troubleshooting

### `npm test` fails with `EBADDEVENGINES`

Use pnpm:

```bash
pnpm test
```

The project explicitly declares pnpm as its package manager.

### Tests fail with `connect ECONNREFUSED` or `EPERM 127.0.0.1:5432`

Check that PostgreSQL is running and that `.env.test` points at a reachable database:

```bash
pg_isready
```

Then rerun:

```bash
pnpm test
```

### Login fails for seeded accounts

Reset the database so `db/seed.sql` is reapplied:

```bash
pnpm db:reset
```

Seeded organizers use:

```text
password123
```

### `DATABASE_URL is required`

The app validates environment variables on startup. Run commands with the correct env file:

```bash
node --env-file=.env src/server.js
node --env-file=.env.test --test
```

or use the package scripts:

```bash
pnpm start
pnpm test
```

### Port already in use

Change `PORT` in `.env`, or stop the process currently using that port.

### HTML error pages appear instead of JSON

Express only treats middleware as an error handler when it has four parameters: `(err, req, res, next)`. The app's JSON error handler is registered in `src/app.js`; if that signature changes, Express may fall back to its default HTML error response.
