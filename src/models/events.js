import { db } from "../db.js";

// create an event

export async function createEvent({
  organizer_id,
  name,
  venue,
  starts_at,
  capacity,
}) {
  try {
    const { rows } = await db.query(
      `INSERT INTO events (organizer_id, name, venue, starts_at, capacity, seats_remaining)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, organizer_id, name, venue, starts_at, capacity, seats_remaining, status`,
      [organizer_id, name, venue, starts_at, capacity, capacity],
    );
    return rows[0] ?? null;
  } catch (err) {
    if (err.code === "23505") throw new Error("duplicate", { cause: err });
    throw err;
  }
}

export async function listEvents({ after = 0, limit = 20 }) {
  const { rows } = await db.query(
    `SELECT id, name, venue, capacity, seats_remaining, starts_at, organizer_id, status
        FROM events
        WHERE id > $1 
        ORDER BY id ASC
        LIMIT $2`,
    [after, limit],
  );
  return rows;
}

export async function listAnEvent(id) {
  const { rows } = await db.query(
    `SELECT id, name, venue, capacity, seats_remaining, starts_at, organizer_id, status
        FROM events WHERE id = $1`,
    [id],
  );
  return rows[0];
}

//GET /events/:id/bookings?after=&limit= — keyset-paginated bookings for an event. 200 · 404.

export async function listAnEventBookings(id, { after = 0, limit = 20 }) {
  const { rows } = await db.query(
    `SELECT id, event_id, customer_id, quantity, status, booked_at
        FROM bookings
        WHERE event_id = $1 AND id > $2
        ORDER BY id ASC
        LIMIT $3`,
    [id, after, limit],
  );

  return rows;
}
