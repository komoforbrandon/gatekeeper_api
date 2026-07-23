import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export const userSchema = z.object({
  email: z.string().email().max(255),
  passwordHash: z.string().max(255),
})



export const customerSchema = z.object({
   full_name: z.string().max(120),
   email: z.string().email().max(255).nullable(),
})

export const eventSchema = z.object({
    organizer_id: idSchema,
    name: z.string().max(150),
    venue: z.string().max(150),
    starts_at: z.date(),
    capacity: z.coerce.number().int().positive(),
    seats_remaining: z.coerce.number().int().positive(),
    status: z.enum(['on_sale', 'sold_out', 'cancelled']).default('on_sale'),
})



export const bookingSchema = z.object({
  event_id: idSchema,
  customer_id: idSchema,
  quantity: z.coerce.number().int().positive(),
  status: z.enum(['confirmed', 'cancelled']).default('confirmed'),
  createdAt: z.date(),
})


//list event query schema GET /events?after=&limit= and GET /events/:id — list / fetch events. 200 · 404.

export const listeventQuerySchema = z.object({
    after: z.date().optional(),
    limit: z.coerce.number().int().positive().optional()
})

export const fetcheventQuerySchema = z.object({
    id: idSchema
})
