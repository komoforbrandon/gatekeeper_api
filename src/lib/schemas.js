import { z } from "zod";

export const idSchema = z.coerce.number().int().positive();

export const userSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().max(255),
})



export const customerSchema = z.object({
   full_name: z.string().max(120),
   email: z.string().email().max(255).nullable(),
})

export const createEventSchema = z.object({
    name: z.string().min(1).max(150),
    venue: z.string().min(1).max(150),
    starts_at: z.string().datetime(),
    capacity: z.coerce.number().int().positive(),
}).strict();



export const bookingSchema = z.object({
  event_id: idSchema,
  customer_id: idSchema,
  quantity: z.coerce.number().int().positive(),
  status: z.enum(['confirmed', 'cancelled']).default('confirmed'),
  createdAt: z.date(),
})


//list event query schema GET /events?after=&limit= and GET /events/:id — list / fetch events. 200 · 404.

export const listeventQuerySchema = z.object({
    after: z.coerce.number().int().nonnegative().optional().default(0),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
})

export const fetcheventQuerySchema = z.object({
    id: idSchema
})
