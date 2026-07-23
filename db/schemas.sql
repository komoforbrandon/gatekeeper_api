CREATE TABLE
    IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE TABLE
    IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        organizer_id INT NOT NULL REFERENCES users (id),
        name VARCHAR(150) NOT NULL,
        venue VARCHAR(150) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        capacity INT NOT NULL CHECK (capacity >= 0),
        seats_remaining INT NOT NULL CHECK (seats_remaining >= 0),
        status VARCHAR(12) NOT NULL DEFAULT 'on_sale' CHECK (status IN ('on_sale', 'sold_out', 'cancelled'))
    );

CREATE TABLE
    IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
    );

CREATE TABLE
    IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        event_id INT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
        customer_id INT NOT NULL REFERENCES customers (id),
        quantity INT NOT NULL CHECK (quantity > 0),
        status VARCHAR(12) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
        booked_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX idx_events_starts_at_id ON events (starts_at, id);
CREATE INDEX idx_bookings_event_id_id ON bookings (event_id, id);
CREATE INDEX idx_customers_email ON customers (email);