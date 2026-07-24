import { db } from "../db.js";

export async function fetchBookings(id) {
  const { rows } = await db.query(
    `SELECT id, event_id, customer_id, quantity, status, booked_at
        FROM bookings
        WHERE event_id = $1`,
    [id],
  );
  return rows[0];
}

//POST /bookings/:id/cancel — cancel and restore seats, transactionally. 204 · 404 · 409 already cancelled.

export async function cancelBooking(id) {
 let client = await db.connect();

  try {
    await client.query("BEGIN");

    const checkBooking = await client.query(
      `SELECT status FROM bookings WHERE id=$1`,
      [id],
    );

    if (checkBooking.rowCount === 0) {
      await client.query("ROLLBACK");
      return { success: false, reason: "Booking not found in DB" };
    }

    if (checkBooking.rows[0].status === "cancelled") {
      await client.query("ROLLBACK");
      return { success: false, reason: "Event cancelled" };
    }

    const event_id = await client.query(
      `SELECT event_id FROM bookings WHERE id=$1`,
      [id],
    );  

    const eventRes = await client.query(
      `UPDATE events 
      SET seats_remaining = seats_remaining + $1, status = CASE WHEN seats_remaining + $1 >= capacity THEN 'full' ELSE status END
      WHERE id = $2 AND status = 'on_sale' AND seats_remaining <= $1 
      RETURNING seats_remaining`,
      [checkBooking.rows[0].quantity, event_id.rows[0].event_id],
    );
    
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.release();
  }  
}

// export async function createBookings({ event_id, customer_id, quantity }) {
//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     const customerRes = await client.query(
//       `SELECT id, full_name, email FROM customers WHERE id = $1`,
//       [customer_id],
//     );

//     if (customerRes.rowCount === 0) {
//       await client.query("ROLLBACK");
//       return { success: false, reason: "Customer not found in DB" };
//     }

//     const eventRes = await client.query(
//       `UPDATE events 
//       SET seats_remaining = seats_remaining - $1, status = CASE WHEN seats_remaining - $1 <= 0 THEN 'sold_out' ELSE status END
//       WHERE id = $2 AND status = 'on_sale' AND seats_remaining >= $1 
//       RETURNING seats_remaining`,
//       [quantity, event_id],
//     );

//     if (eventRes.rowCount === 0) {
//       const checkEvent = await client.query(
//         `SELECT status FROM events WHERE id=$1`,
//         [event_id],
//       );
//       await client.query("ROLLBACK");

//       if (checkEvent.rowCount === 0)
//         return { success: false, reason: "Event not found" };

//       return { success: false, reason: "Insufficient seats or Not on sale" };
//     }

//     const bookingRes = await client.query(
//       `INSERT INTO bookings (event_id, customer_id, quantity, status)
//            VALUES ($1, $2, $3, 'confirmed')
//            RETURNING id, event_id, customer_id, quantity, status`,
//       [event_id, customer_id, quantity],
//     );

//     await client.query("COMMIT");

//     const data = {
//       success: true,
//       bookingInfo: bookingRes.rows[0],
//       customerInfo: customerRes.rows[0],
//     };
//     return data;
//   } catch (err) {
//     await client.query("ROLLBACK");
//     throw err;
//   } finally {
//     client.release();
//   }
// }