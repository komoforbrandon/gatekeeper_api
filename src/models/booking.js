import { db } from "../db.js";

export async function createBookings({
  event_id,
  customer_id,
  quantity,
  status,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const eventRes = await client.query(
      `UPDATE events SET seats_remaining = seats_remaining - $1 WHERE id = $2 AND status = 'on_sale' AND seats_remaining >= $1 RETURNING seats_remaining`,
      [quantity, event_id],
    );

    if (eventRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Insufficient seats" };
    }

    const seatsRemaining = eventRes.rows[0].seats_remaining;

    const bookingRes = await client.query(
      `INSERT INTO bookings (event_id, customer_id, quantity, status)
           VALUES ($1, $2, $3, $4)
           RETURNING id, event_id, customer_id, quantity, status`,
      [event_id, customer_id, quantity, status || 'confirmed'],
    );

    if (seatsRemaining === 0) {
      await client.query(
        `UPDATE events SET status = 'sold_out' WHERE id = $1`,
        [event_id],
      );
    }

    const customerRes = await client.query(
      `SELECT full_name, email FROM customers WHERE id = $1`,
      [customer_id],
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
