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

//POST /events/:id/bookings — book { customer_id, quantity }, transactionally. 201 + Location · 409 sold out / not enough seats / event cancelled · 400 unknown customer or bad quantity.
export async function createBookings({ event_id, customer_id, quantity }) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const customerRes = await client.query(
      `SELECT id, full_name, email FROM customers WHERE id = $1`,
      [customer_id],
    );

    if (customerRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Customer not found in DB" };
    }

    const eventRes = await client.query(
      `UPDATE events 
      SET seats_remaining = seats_remaining - $1, status = CASE WHEN seats_remaining - $1 <= 0 THEN 'sold_out' ELSE status END
      WHERE id = $2 AND status = 'on_sale' AND seats_remaining >= $1 
      RETURNING seats_remaining`,
      [quantity, event_id],
    );

    if (eventRes.rowCount === 0) {
      const checkEvent = await client.query(
        `SELECT status FROM events WHERE id=$1`,
        [event_id],
      );
      await client.query("ROLLBACK");

      if (checkEvent.rowCount === 0)
        return { success: false, reason: "Event not found" };

      return { success: false, reason: "Insufficient seats or Not on sale" };
    }

    const bookingRes = await client.query(
      `INSERT INTO bookings (event_id, customer_id, quantity, status)
           VALUES ($1, $2, $3, 'confirmed')
           RETURNING id, event_id, customer_id, quantity, status`,
      [event_id, customer_id, quantity],
    );

    await client.query("COMMIT");

    const data = {
      success: true,
      bookingInfo: bookingRes.rows[0],
      customerInfo: customerRes.rows[0],
    };
    return data;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}