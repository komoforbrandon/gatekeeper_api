# URL Shortener

A simple URL shortener API built with Node.js, Express, PostgreSQL, and OpenAPI.

The service lets you create short links, redirect users to target URLs, track clicks, export click logs as CSV, and explore the API through Swagger docs.

## Features

- Create short links with optional custom codes and expiration dates
- Redirect short URLs to original targets
- Track click events with referrer and user-agent metadata
- View link metadata and click history
- Export click logs as CSV
- Built-in health check and Swagger documentation
- Security hardening with Helmet and rate limiting

## Requirements

- Node.js 20 or newer
- PostgreSQL database
- pnpm package manager (recommended)

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Create a `.env` file in the project root with the required environment variables:

```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/url_short
JWT_SECRET=your-secret
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
```

3. Create your database and seed it:

```bash
pnpm db:migrate
```

Or reset the database completely:

```bash
pnpm db:reset
```

## Environment Variables

- `PORT` – server port (default: `3000`)
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret used by the app configuration validator
- `NODE_ENV` – `development`, `test`, or `production` (default: `development`)
- `LOG_LEVEL` – logger level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`)
- `CORS_ORIGIN` – allowed origin for CORS (`*` by default)
- `RATE_LIMIT_MAX` – max requests per minute per IP (default: `100`)

## Running the App

Start the server:

```bash
pnpm start
```

Start in watch mode for development:

```bash
pnpm dev
```

Open the API docs in your browser:

```text
http://localhost:3000/docs
```

## API Endpoints

- `GET /health`
  - Returns `{ status: "ok" }`

- `POST /links`
  - Create a new short link
  - Request body:
    ```json
    {
      "target_url": "https://example.com",
      "code": "customcode",
      "expires_at": "2025-12-31T23:59:59.000Z"
    }
    ```
  - Response: created link details

- `GET /:code`
  - Redirects to the original target URL
  - Returns `302` redirect or `410` for expired links

- `GET /links/:code`
  - Returns metadata for the short link

- `DELETE /links/:code`
  - Deletes the short link
  - Returns `204 No Content`

- `GET /links/:code/clicks`
  - Returns click history for a link
  - Supports pagination with `limit` and `after`

- `GET /links/:code/clicks.csv`
  - Downloads click history as CSV

- `GET /docs`
  - Swagger UI for the OpenAPI specification

## Testing

Run the test suite:

```bash
pnpm test
```

## Database

The schema is defined in `db/schemas.sql` and seeded data lives in `db/seed.sql`.

The primary tables are:

- `links` — stores short link codes, target URLs, expiration and click count
- `clicks` — stores individual click events for each short link

## Notes

- Requests are rate limited and served behind Helmet for security
- OpenAPI docs are generated from `openapi.json`
- The app uses `express.json()` and input validation through Zod
