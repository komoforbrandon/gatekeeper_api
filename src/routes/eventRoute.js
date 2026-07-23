import { Router } from "express";
import createError from "http-errors";
import * as events from "../models/events.js";
import { parse } from "../lib/validate.js";
import { authorizeUser } from "../middlewares/authMiddleware.js";
import {
  idSchema,
  listeventQuerySchema,
  createEventSchema,
} from "../lib/schemas.js";

const router = Router();

router.get("/", async (req, res) => {
  const { after, limit } = parse(listeventQuerySchema, req.query, 400);

  const allEvents = await events.listEvents({ after, limit });

  const lastEvent = allEvents[allEvents.length - 1];
  const nextCursor = lastEvent < limit || !lastEvent ? null : lastEvent.id;
  res.json({
    events: allEvents,
    next: nextCursor,
  });
});

router.get("/:id", async (req, res, next) => {
  const { id } = parse(idSchema, req.params, 400);

  try {
    const event = await events.listAnEvent(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
});


router.post("/", authorizeUser, async (req, res, next) => {
  const validateBody = parse(createEventSchema, req.body, 400);
  const organizer_id = req.user.id;

  try {
    const event = await events.createEvent({ organizer_id, ...validateBody });
    res.status(201).json(event);
  } catch (err) {
    if (err.message === "duplicate") {
      return res.status(400).json({ error: "Event details already exists" });
    }
    next(err);
  }
});


router.get("/:id/bookings", authorizeUser, async (req, res, next) => {
  try {
    const  id  = parse(idSchema, req.params.id, 400);
    const { after, limit } = parse(listeventQuerySchema, req.query, 400);
    const organizer_id = req.user.id;

    const event = await events.listAnEvent(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.organizer_id !== organizer_id) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not the organizer of this event" });
    }

    const allBookings = await events.listAnEventBookings(id, { after, limit });

    const lastBooking = allBookings[allBookings.length - 1];
    const nextCursor =
      lastBooking < limit || !lastBooking ? null : lastBooking.id;

    res.json({
      bookings: allBookings,
      next: nextCursor,
    });
  } catch (err) {
    next(err);
  }
});


export default router;