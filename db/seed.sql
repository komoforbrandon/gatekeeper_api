-- Clean start: Truncate existing data and reset identity counters
TRUNCATE TABLE bookings, customers, events, users RESTART IDENTITY CASCADE;

-- 1. SEED USERS (Organizers)
-- All password hashes represent a placeholder string e.g., '$2b$10$abcdef...'
INSERT INTO users (email, password_hash, created_at) VALUES
('alice.organizer@events.com', '$2b$10$EixVaHa5U6G36.i6JkvC9uE4F7g/m5I6V6K7L8M9N0O1P2Q3R4S56', NOW() - INTERVAL '30 days'),
('bob.promotions@festivals.net', '$2b$10$EixVaHa5U6G36.i6JkvC9uE4F7g/m5I6V6K7L8M9N0O1P2Q3R4S56', NOW() - INTERVAL '25 days'),
('charlie.concerts@music.org', '$2b$10$EixVaHa5U6G36.i6JkvC9uE4F7g/m5I6V6K7L8M9N0O1P2Q3R4S56', NOW() - INTERVAL '20 days');

-- 2. SEED EVENTS
-- Note: 'seats_remaining' explicitly matches 'capacity' for fresh events
INSERT INTO events (organizer_id, name, venue, starts_at, capacity, seats_remaining, status) VALUES
-- Events by Alice (ID 1)
(1, 'Tech Innovators Summit 2026', 'Silicon Convention Center Hall A', NOW() + INTERVAL '15 days', 150, 150, 'on_sale'),
(1, 'Startup Pitch Night', 'The Foundry Co-working Space', NOW() + INTERVAL '5 days', 45, 45, 'on_sale'),
(1, 'Advanced Node.js Masterclass', 'Dev Bootcamp Campus Room 4', NOW() - INTERVAL '2 days', 30, 0, 'sold_out'),

-- Events by Bob (ID 2)
(2, 'Summer Solstice Music Festival', 'Riverfront Open Air Park', NOW() + INTERVAL '45 days', 5000, 5000, 'on_sale'),
(2, 'Underground Indie Rock Showcase', 'The Underground Basement Lounge', NOW() + INTERVAL '12 days', 120, 120, 'on_sale'),
(2, 'Annual Food & Wine Gala', 'Grand Lakeside Pavilion', NOW() + INTERVAL '60 days', 350, 350, 'on_sale'),

-- Events by Charlie (ID 3)
(3, 'Symphony Under the Stars', 'Metropolitan Botanical Gardens', NOW() + INTERVAL '8 days', 800, 800, 'on_sale'),
(3, 'Jazz & Blues Intimate Session', 'Blue Note Cafe Downtown', NOW() + INTERVAL '1 day', 60, 60, 'on_sale'),
(3, 'Charity Acoustic Night', 'Community Arts Theater', NOW() + INTERVAL '30 days', 200, 200, 'cancelled');

-- 3. SEED CUSTOMERS
INSERT INTO customers (full_name, email) VALUES
('John Doe', 'john.doe@gmail.com'),
('Jane Smith', 'jane.smith@yahoo.com'),
('Michael Johnson', 'mjohnson@outlook.com'),
('Emily Davis', 'emily.davis@icloud.com'),
('David Wilson', 'david.wilson@protonmail.com'),
('Sarah Martinez', 'smartinez@techcorp.io'),
('James Anderson', 'j.anderson@university.edu'),
('Amanda Thomas', 'amanda.t@freelance.org');

-- 4. SEED BOOKINGS & MANUAL COUNTER DECREMENTS
-- To keep your check constraints valid, we write bookings and simultaneously decrement the targeted event's seats.

-- Booking 1: John Doe buys 3 tickets to Tech Summit (Event 1)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (1, 1, 3, 'confirmed', NOW() - INTERVAL '3 days');
UPDATE events SET seats_remaining = seats_remaining - 3 WHERE id = 1;

-- Booking 2: Jane Smith buys 2 tickets to Tech Summit (Event 1)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (1, 2, 2, 'confirmed', NOW() - INTERVAL '2 days');
UPDATE events SET seats_remaining = seats_remaining - 2 WHERE id = 1;

-- Booking 3: Michael Johnson buys 5 tickets to Summer Music Fest (Event 4)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (4, 3, 5, 'confirmed', NOW() - INTERVAL '1 day');
UPDATE events SET seats_remaining = seats_remaining - 5 WHERE id = 4;

-- Booking 4: Emily Davis buys 1 ticket to Indie Rock Showcase (Event 5)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (5, 4, 1, 'confirmed', NOW() - INTERVAL '12 hours');
UPDATE events SET seats_remaining = seats_remaining - 1 WHERE id = 5;

-- Booking 5: David Wilson buys 4 tickets to Jazz Session (Event 8)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (8, 5, 4, 'confirmed', NOW() - INTERVAL '6 hours');
UPDATE events SET seats_remaining = seats_remaining - 4 WHERE id = 8;

-- Booking 6: A cancelled booking example (Seats are NOT decremented from event 5 because status is cancelled)
INSERT INTO bookings (event_id, customer_id, quantity, status, booked_at)
VALUES (5, 6, 2, 'cancelled', NOW() - INTERVAL '1 day');
