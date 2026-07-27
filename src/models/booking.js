import { db } from "../db.js";

export async function fetchBookings(id) {
  const { rows } = await db.query(
    `SELECT id, event_id, customer_id, quantity, status, booked_at
        FROM bookings
        WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

//POST /bookings/:id/cancel — cancel and restore seats, transactionally. 204 · 404 · 409 already cancelled.

export async function cancelBooking(id) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const bookingCheck = await client.query(
      `SELECT event_id, quantity, status FROM bookings WHERE id=$1`,
      [id],
    );

    if (bookingCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Booking not found in DB" };
    }

    const { event_id, quantity, status: bookingStatus } = bookingCheck.rows[0];

    if (bookingStatus === "cancelled") {
      await client.query("ROLLBACK");
      return { success: false, reason: "Booking already cancelled" };
    }

    await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
      [id],
    );

    const eventRes = await client.query(
      `UPDATE events SET seats_remaining = seats_remaining + $1,
           status = CASE WHEN status = 'sold_out' THEN 'on_sale' ELSE status END
       WHERE id = $2
       RETURNING seats_remaining`,
      [quantity, event_id],
    );

     const remainingSeats = eventRes.rows[0]?.seats_remaining ?? 0;

    await client.query("COMMIT");
    return { success: true, seats_remaining: remainingSeats };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
