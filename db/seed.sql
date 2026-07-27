-- Clean start: Truncate existing data and reset identity counters
TRUNCATE TABLE bookings,
customers,
events,
users RESTART IDENTITY CASCADE;

-- 1. SEED USERS (Organizers)
-- All accounts share the same bcrypt hash for password123
INSERT INTO
    users (email, password_hash, created_at)
VALUES
    (
        'alice.organizer@events.com',
        '$2b$10$yU9FPuxigI1QI0mJVKitSe.bJaMRW6S7whXs.u7pP5YdwBlXWe7Bm',
        NOW () - INTERVAL '30 days'
    ),
    (
        'bob.promotions@festivals.net',
        '$2b$10$yU9FPuxigI1QI0mJVKitSe.bJaMRW6S7whXs.u7pP5YdwBlXWe7Bm',
        NOW () - INTERVAL '25 days'
    ),
    (
        'charlie.concerts@music.org',
        '$2b$10$yU9FPuxigI1QI0mJVKitSe.bJaMRW6S7whXs.u7pP5YdwBlXWe7Bm',
        NOW () - INTERVAL '20 days'
    ),
    (
        'kb@gmail.com',
        '$2b$10$yU9FPuxigI1QI0mJVKitSe.bJaMRW6S7whXs.u7pP5YdwBlXWe7Bm',
        NOW () - INTERVAL '12 days'
    ),
    (
        'diana.community@culture.org',
        '$2b$10$yU9FPuxigI1QI0mJVKitSe.bJaMRW6S7whXs.u7pP5YdwBlXWe7Bm',
        NOW () - INTERVAL '8 days'
    );

-- 2. SEED EVENTS
-- 8 events on_sale, 2 sold_out, 2 cancelled
INSERT INTO
    events (
        organizer_id,
        name,
        venue,
        starts_at,
        capacity,
        seats_remaining,
        status
    )
VALUES
    -- Organizer 1
    (
        1,
        'Tech Innovators Summit 2026',
        'Silicon Convention Center Hall A',
        NOW () + INTERVAL '15 days',
        150,
        150,
        'on_sale'
    ),
    (
        1,
        'Startup Pitch Night',
        'The Foundry Co-working Space',
        NOW () + INTERVAL '5 days',
        45,
        45,
        'on_sale'
    ),
    (
        1,
        'AI Builders Meetup',
        'North Loop Innovation Hub',
        NOW () - INTERVAL '2 days',
        15,
        15,
        'sold_out'
    ),
    -- Organizer 2
    (
        2,
        'Summer Solstice Music Festival',
        'Riverfront Open Air Park',
        NOW () + INTERVAL '45 days',
        500,
        500,
        'on_sale'
    ),
    (
        2,
        'Underground Indie Rock Showcase',
        'The Underground Basement Lounge',
        NOW () + INTERVAL '12 days',
        120,
        120,
        'on_sale'
    ),
    (
        2,
        'Annual Food & Wine Gala',
        'Grand Lakeside Pavilion',
        NOW () + INTERVAL '60 days',
        350,
        350,
        'cancelled'
    ),
    -- Organizer 3
    (
        3,
        'Symphony Under the Stars',
        'Metropolitan Botanical Gardens',
        NOW () + INTERVAL '8 days',
        800,
        800,
        'on_sale'
    ),
    (
        3,
        'Jazz & Blues Intimate Session',
        'Blue Note Cafe Downtown',
        NOW () + INTERVAL '1 day',
        60,
        60,
        'on_sale'
    ),
    (
        3,
        'Community Arts Charity Night',
        'Riverside Theater',
        NOW () + INTERVAL '30 days',
        200,
        200,
        'cancelled'
    ),
    -- Organizer 4
    (
        4,
        'Morning Coffee & Code',
        'Harbor Street Cafe',
        NOW () + INTERVAL '3 days',
        90,
        90,
        'on_sale'
    ),
    (
        4,
        'Regional Robotics Expo',
        'Metro Trade Center',
        NOW () + INTERVAL '20 days',
        50,
        50,
        'sold_out'
    ),
    -- Organizer 5
    (
        5,
        'Open Studio Night',
        'Northside Creative Loft',
        NOW () + INTERVAL '10 days',
        250,
        250,
        'on_sale'
    );

-- 3. SEED CUSTOMERS (20+ high-volume, realistic records)
INSERT INTO
    customers (full_name, email)
VALUES
    ('John Doe', 'john.doe@gmail.com'),
    ('Jane Smith', 'jane.smith@yahoo.com'),
    ('Michael Johnson', 'mjohnson@outlook.com'),
    ('Emily Davis', 'emily.davis@icloud.com'),
    ('David Wilson', 'david.wilson@protonmail.com'),
    ('Sarah Martinez', 'smartinez@techcorp.io'),
    ('James Anderson', 'j.anderson@university.edu'),
    ('Amanda Thomas', 'amanda.t@freelance.org'),
    ('Robert Chen', 'robert.chen@acme.dev'),
    ('Priya Patel', 'priya.patel@launchpad.net'),
    ('Daniel Brooks', 'daniel.brooks@northwind.co'),
    ('Olivia Garcia', 'olivia.garcia@sunsetlabs.io'),
    ('Liam Nguyen', 'liam.nguyen@pixelcraft.com'),
    ('Sophia Kim', 'sophia.kim@altstream.org'),
    ('Ethan Moore', 'ethan.moore@blueharbor.net'),
    ('Mia Rodriguez', 'mia.rodriguez@evergreen.app'),
    ('Noah Walker', 'noah.walker@urbanworks.dev'),
    ('Ava Scott', 'ava.scott@latticehq.com'),
    ('Lucas Bennett', 'lucas.bennett@northbridge.ai'),
    (
        'Isabella Flores',
        'isabella.flores@marinestudios.org'
    );

-- 4. SEED BOOKINGS WITH EXPLICIT SEAT DECREMENTS
-- Every confirmed booking decrements seats_remaining immediately beneath its insert.
-- Booking 1: John Doe -> Event 1 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (1, 1, 3, 'confirmed', NOW () - INTERVAL '3 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 1;

-- Booking 2: Jane Smith -> Event 1 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (1, 2, 2, 'confirmed', NOW () - INTERVAL '2 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 1;

-- Booking 3: Michael Johnson -> Event 1 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (1, 3, 4, 'confirmed', NOW () - INTERVAL '1 day');

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 1;

-- Booking 4: Emily Davis -> Event 2 (5 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (2, 4, 5, 'confirmed', NOW () - INTERVAL '2 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 5
WHERE
    id = 2;

-- Booking 5: David Wilson -> Event 2 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        2,
        5,
        3,
        'confirmed',
        NOW () - INTERVAL '18 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 2;

-- Booking 6: Sarah Martinez -> Event 3 (7 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (3, 6, 7, 'confirmed', NOW () - INTERVAL '1 day');

UPDATE events
SET
    seats_remaining = seats_remaining - 7
WHERE
    id = 3;

-- Booking 7: James Anderson -> Event 3 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        3,
        7,
        4,
        'confirmed',
        NOW () - INTERVAL '12 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 3;

-- Booking 8: Amanda Thomas -> Event 3 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (3, 8, 2, 'confirmed', NOW () - INTERVAL '8 hours');

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 3;

-- Booking 9: Robert Chen -> Event 3 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (3, 9, 2, 'confirmed', NOW () - INTERVAL '6 hours');

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 3;

-- Booking 10: Priya Patel -> Event 4 (5 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (4, 10, 5, 'confirmed', NOW () - INTERVAL '4 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 5
WHERE
    id = 4;

-- Booking 11: Daniel Brooks -> Event 4 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (4, 11, 2, 'confirmed', NOW () - INTERVAL '3 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 4;

-- Booking 12: Olivia Garcia -> Event 5 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (5, 12, 3, 'confirmed', NOW () - INTERVAL '2 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 5;

-- Booking 13: Liam Nguyen -> Event 5 (1 seat, cancelled)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (5, 13, 1, 'cancelled', NOW () - INTERVAL '1 day');

-- Booking 14: Sophia Kim -> Event 6 (2 seats, cancelled)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        6,
        14,
        2,
        'cancelled',
        NOW () - INTERVAL '18 hours'
    );

-- Booking 15: Ethan Moore -> Event 7 (6 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (7, 15, 6, 'confirmed', NOW () - INTERVAL '2 days');

UPDATE events
SET
    seats_remaining = seats_remaining - 6
WHERE
    id = 7;

-- Booking 16: Mia Rodriguez -> Event 7 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        7,
        16,
        4,
        'confirmed',
        NOW () - INTERVAL '20 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 7;

-- Booking 17: Noah Walker -> Event 8 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        8,
        17,
        3,
        'confirmed',
        NOW () - INTERVAL '12 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 8;

-- Booking 18: Ava Scott -> Event 8 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        8,
        18,
        2,
        'confirmed',
        NOW () - INTERVAL '6 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 8;

-- Booking 19: Lucas Bennett -> Event 9 (1 seat, cancelled)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        9,
        19,
        1,
        'cancelled',
        NOW () - INTERVAL '4 hours'
    );

-- Booking 20: Isabella Flores -> Event 10 (8 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (10, 20, 8, 'confirmed', NOW () - INTERVAL '1 day');

UPDATE events
SET
    seats_remaining = seats_remaining - 8
WHERE
    id = 10;

-- Booking 21: John Doe -> Event 10 (5 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        10,
        1,
        5,
        'confirmed',
        NOW () - INTERVAL '10 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 5
WHERE
    id = 10;

-- Booking 22: Jane Smith -> Event 11 (15 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        11,
        2,
        15,
        'confirmed',
        NOW () - INTERVAL '6 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 15
WHERE
    id = 11;

-- Booking 23: Michael Johnson -> Event 11 (10 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        11,
        3,
        10,
        'confirmed',
        NOW () - INTERVAL '5 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 10
WHERE
    id = 11;

-- Booking 24: Emily Davis -> Event 11 (8 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        11,
        4,
        8,
        'confirmed',
        NOW () - INTERVAL '4 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 8
WHERE
    id = 11;

-- Booking 25: David Wilson -> Event 11 (7 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        11,
        5,
        7,
        'confirmed',
        NOW () - INTERVAL '3 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 7
WHERE
    id = 11;

-- Booking 26: Sarah Martinez -> Event 11 (6 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        11,
        6,
        6,
        'confirmed',
        NOW () - INTERVAL '2 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 6
WHERE
    id = 11;

-- Booking 27: James Anderson -> Event 11 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (11, 7, 4, 'confirmed', NOW () - INTERVAL '1 hour');

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 11;

-- Booking 28: Amanda Thomas -> Event 12 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        12,
        8,
        4,
        'confirmed',
        NOW () - INTERVAL '12 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 12;

-- Booking 29: Robert Chen -> Event 12 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        12,
        9,
        2,
        'confirmed',
        NOW () - INTERVAL '8 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 12;

-- Booking 30: Priya Patel -> Event 1 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        1,
        10,
        2,
        'confirmed',
        NOW () - INTERVAL '6 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 1;

-- Booking 31: Daniel Brooks -> Event 2 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        2,
        11,
        4,
        'confirmed',
        NOW () - INTERVAL '4 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 2;

-- Booking 32: Olivia Garcia -> Event 4 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        4,
        12,
        3,
        'confirmed',
        NOW () - INTERVAL '3 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 4;

-- Booking 33: Liam Nguyen -> Event 5 (2 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        5,
        13,
        2,
        'confirmed',
        NOW () - INTERVAL '2 hours'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 2
WHERE
    id = 5;

-- Booking 34: Sophia Kim -> Event 7 (5 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        7,
        14,
        5,
        'confirmed',
        NOW () - INTERVAL '90 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 5
WHERE
    id = 7;

-- Booking 35: Ethan Moore -> Event 8 (4 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        8,
        15,
        4,
        'confirmed',
        NOW () - INTERVAL '75 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 4
WHERE
    id = 8;

-- Booking 36: Mia Rodriguez -> Event 10 (6 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        10,
        16,
        6,
        'confirmed',
        NOW () - INTERVAL '60 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 6
WHERE
    id = 10;

-- Booking 37: Noah Walker -> Event 12 (3 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        12,
        17,
        3,
        'confirmed',
        NOW () - INTERVAL '45 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 3
WHERE
    id = 12;

-- Booking 38: Ava Scott -> Event 1 (6 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        1,
        18,
        6,
        'confirmed',
        NOW () - INTERVAL '30 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 6
WHERE
    id = 1;

-- Booking 39: Lucas Bennett -> Event 4 (7 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        4,
        19,
        7,
        'confirmed',
        NOW () - INTERVAL '20 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 7
WHERE
    id = 4;

-- Booking 40: Isabella Flores -> Event 12 (5 seats)
INSERT INTO
    bookings (
        event_id,
        customer_id,
        quantity,
        status,
        booked_at
    )
VALUES
    (
        12,
        20,
        5,
        'confirmed',
        NOW () - INTERVAL '10 minutes'
    );

UPDATE events
SET
    seats_remaining = seats_remaining - 5
WHERE
    id = 12;
