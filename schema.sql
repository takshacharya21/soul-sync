-- Soul Syync Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service VARCHAR(80) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time VARCHAR(20) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password VARCHAR(120) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data for demo
INSERT INTO bookings (name, email, phone, service, preferred_date, preferred_time, message, status) VALUES
('Priya Sharma',   'priya@email.com',   '9876543210', 'Personal Counselling', '2025-06-10', '11:00 AM', 'Looking forward to the session', 'confirmed'),
('Meera Patel',    'meera@email.com',   '9123456789', 'Astrology Guidance',   '2025-06-12', '3:00 PM',  'First time here', 'pending'),
('Ananya Joshi',   'ananya@email.com',  '9988776655', 'Healing Sessions',     '2025-06-15', '10:00 AM', 'Need deep healing', 'pending'),
('Kavita Desai',   'kavita@email.com',  '9654321098', 'Vastu Consultation',   '2025-06-18', '2:00 PM',  'New home Vastu', 'confirmed');

INSERT INTO contacts (name, email, phone, message) VALUES
('Ritu Verma',  'ritu@email.com',  '9001122334', 'Interested in group healing sessions'),
('Sonal Mehta', 'sonal@email.com', '9445566778', 'Want to know about NGO volunteering');
