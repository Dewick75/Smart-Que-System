-- Smart Queue Management System Database Schema
-- SQLite Database Structure - CORRECTED VERSION

-- Routes table
CREATE TABLE IF NOT EXISTS route (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    start_point VARCHAR(100) NOT NULL,
    end_point VARCHAR(100) NOT NULL,
    estimated_duration INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus stops table
CREATE TABLE IF NOT EXISTS bus_stop (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    route_id INTEGER NOT NULL,
    order_in_route INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES route (id) ON DELETE CASCADE
);

-- Buses table
CREATE TABLE IF NOT EXISTS bus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    route_name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 45,
    current_location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS booking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id VARCHAR(36) UNIQUE NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_email VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    bus_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    pickup_stop_id INTEGER NOT NULL,
    dropoff_stop_id INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    travel_date TIMESTAMP NOT NULL,
    qr_code VARCHAR(255),
    status VARCHAR(20) DEFAULT 'confirmed',
    payment_status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (bus_id) REFERENCES bus (id),
    FOREIGN KEY (route_id) REFERENCES route (id),
    FOREIGN KEY (pickup_stop_id) REFERENCES bus_stop (id),
    FOREIGN KEY (dropoff_stop_id) REFERENCES bus_stop (id)
);

-- Queue data table for AI predictions
CREATE TABLE IF NOT EXISTS queue_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_stop_id INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    queue_length INTEGER NOT NULL,
    waiting_time INTEGER NOT NULL,
    weather_condition VARCHAR(50),
    day_of_week INTEGER,
    hour_of_day INTEGER,
    FOREIGN KEY (bus_stop_id) REFERENCES bus_stop (id)
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alert (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    bus_id INTEGER,
    route_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (bus_id) REFERENCES bus (id),
    FOREIGN KEY (route_id) REFERENCES route (id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_bus_date ON booking (bus_id, travel_date, status);
CREATE INDEX IF NOT EXISTS idx_queue_data_stop_time ON queue_data (bus_stop_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_status ON alert (status, created_at);
CREATE INDEX IF NOT EXISTS idx_bus_stop_route ON bus_stop (route_id, order_in_route);

-- Insert sample data
INSERT OR IGNORE INTO route (id, name, start_point, end_point, estimated_duration, price) VALUES
(1, 'Downtown Express', 'Central Station', 'Business District', 45, 5.50),
(2, 'Airport Shuttle', 'City Center', 'Changi Airport', 60, 8.00),
(3, 'University Line', 'North Campus', 'South Campus', 25, 3.00);

INSERT OR IGNORE INTO bus_stop (name, latitude, longitude, route_id, order_in_route) VALUES
-- Downtown Express stops
('Central Station', 1.3521, 103.8198, 1, 1),
('Marina Bay', 1.2835, 103.8607, 1, 2),
('Raffles Place', 1.2843, 103.8511, 1, 3),
('Business District', 1.2799, 103.8500, 1, 4),

-- Airport Shuttle stops
('City Center', 1.3048, 103.8318, 2, 1),
('East Coast', 1.3016, 103.9074, 2, 2),
('Changi Airport', 1.3644, 103.9915, 2, 3),

-- University Line stops
('North Campus', 1.3966, 103.9024, 3, 1),
('Library Junction', 1.3896, 103.9012, 3, 2),
('Student Center', 1.3856, 103.8998, 3, 3),
('South Campus', 1.3786, 103.8986, 3, 4);

INSERT OR IGNORE INTO bus (id, bus_number, route_name, capacity, current_location, status) VALUES
(1, 'SG001', 'Downtown Express', 45, 'Central Station', 'active'),
(2, 'SG002', 'Downtown Express', 45, 'Marina Bay', 'active'),
(3, 'SG101', 'Airport Shuttle', 35, 'City Center', 'active'),
(4, 'SG102', 'Airport Shuttle', 35, 'East Coast', 'active'),
(5, 'SG201', 'University Line', 40, 'North Campus', 'active'),
(6, 'SG202', 'University Line', 40, 'Library Junction', 'active');

-- Insert sample queue data for AI training
INSERT OR IGNORE INTO queue_data 
(bus_stop_id, timestamp, queue_length, waiting_time, weather_condition, day_of_week, hour_of_day) 
VALUES
-- Sample data for different hours and days
(1, '2024-01-15 08:00:00', 12, 15, 'sunny', 1, 8),
(1, '2024-01-15 09:00:00', 8, 10, 'sunny', 1, 9),
(1, '2024-01-15 17:00:00', 15, 18, 'cloudy', 1, 17),
(1, '2024-01-15 18:00:00', 10, 12, 'cloudy', 1, 18),
(2, '2024-01-15 08:30:00', 6, 8, 'sunny', 1, 8),
(2, '2024-01-15 12:00:00', 4, 5, 'sunny', 1, 12),
(2, '2024-01-15 17:30:00', 9, 11, 'rainy', 1, 17),
(3, '2024-01-15 07:45:00', 8, 10, 'sunny', 1, 7),
(3, '2024-01-15 18:15:00', 12, 14, 'cloudy', 1, 18);

INSERT OR IGNORE INTO alert (alert_type, message, severity, bus_id, route_id, status) VALUES
('delay', 'Bus SG001 is running 10 minutes late due to traffic', 'medium', 1, 1, 'active'),
('overcrowding', 'High passenger volume expected at Marina Bay stop', 'high', NULL, 1, 'active'),
('maintenance', 'Bus SG102 scheduled for maintenance at 2:00 PM', 'low', 4, 2, 'active');