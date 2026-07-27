import { Router } from "express";
import { parse } from "../lib/validate.js";
import { idSchema} from "../lib/schemas.js";
import * as bookings from "../models/booking.js";

const router = Router();

//GET /bookings/:id — fetch a booking. 200 · 404.

router.get("/:id", async (req, res, next) => {
  try {
    const id = parse(idSchema, req.params.id, 400);
    const booking = await bookings.fetchBookings(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/cancel", async (req, res, next) => {
  try {
    const id = parse(idSchema, req.params.id, 400);

    const result = await bookings.cancelBooking(id); //204.

    if (!result.success) {
      if (result.reason === "Booking not found in DB") {
        return res.status(404).json({ error: "Booking not found" });
      }
      if (result.reason === "Booking already cancelled") {
        return res.status(409).json({ error: "Booking already cancelled" });
      }
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;