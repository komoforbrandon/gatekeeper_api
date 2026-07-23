-- 1. Insert Confirmed Booking A: Customer 1 (John Doe) buys 5 tickets
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (11, 1, 5, 'confirmed', NOW() - INTERVAL '3 hours');

-- 2. Insert Confirmed Booking B: Customer 2 (Jane Smith) buys 3 tickets
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (11, 2, 3, 'confirmed', NOW() - INTERVAL '2 hours');

-- 3. Insert Confirmed Booking C: Customer 3 (Michael Johnson) buys 2 tickets
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (11, 3, 2, 'confirmed', NOW() - INTERVAL '1 hour');

-- 4. Insert Cancelled Booking D: Customer 5 (David Wilson) books 4 tickets but cancels them
-- (Because it is cancelled, these 4 seats are not decremented from the event counter)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (11, 5, 4, 'cancelled', NOW() - INTERVAL '30 minutes');

-- 5. Synchronize the event seats manually for the 10 confirmed tickets sold (5 + 3 + 2)
UPDATE events 
SET seats_remaining = seats_remaining - 10 
WHERE id = 11;
