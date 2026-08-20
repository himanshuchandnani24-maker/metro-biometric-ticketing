-- Demo Users
INSERT INTO users (name, email, password_hash) VALUES
('Alice Smith', 'alice@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
('Bob Johnson', 'bob@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
('Charlie Brown', 'charlie@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');

-- Demo Wallets
INSERT INTO wallets (user_id, balance) VALUES
(1, 50.00),
(2, 10.00),
(3, 100.00);

-- Demo Stations
INSERT INTO stations (name) VALUES
('Central Station'),
('North Park'),
('South Side'),
('East End');

-- Demo Fares
-- Assume max fare in the system is 5.00
INSERT INTO fares (entry_station_id, exit_station_id, amount) VALUES
(1, 2, 2.50),
(1, 3, 3.00),
(1, 4, 4.00),
(2, 1, 2.50),
(2, 3, 3.50),
(2, 4, 5.00),
(3, 1, 3.00),
(3, 2, 3.50),
(3, 4, 2.00),
(4, 1, 4.00),
(4, 2, 5.00),
(4, 3, 2.00);

-- Demo Fingerprint Templates (dummy data)
INSERT INTO fingerprint_templates (user_id, template_data) VALUES
(1, 'base64_encoded_template_data_for_alice'),
(2, 'base64_encoded_template_data_for_bob'),
(3, 'base64_encoded_template_data_for_charlie');

-- Demo Trips
-- Completed trip for Alice
INSERT INTO trips (user_id, entry_station_id, exit_station_id, entry_time, exit_time, fare_charged, status) VALUES
(1, 1, 2, DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), 2.50, 'COMPLETED');

-- In-progress trip for Charlie
INSERT INTO trips (user_id, entry_station_id, entry_time, status) VALUES
(3, 3, NOW(), 'IN_PROGRESS');

-- Failed trip for Bob (insufficient balance handled gracefully or flagged)
INSERT INTO trips (user_id, entry_station_id, exit_station_id, entry_time, exit_time, status) VALUES
(2, 2, 4, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 'FAILED');

-- Demo Payments
INSERT INTO payments (user_id, amount, status) VALUES
(1, 50.00, 'SUCCESS'),
(2, 10.00, 'SUCCESS'),
(3, 100.00, 'SUCCESS');

-- Demo Fraud Alerts
-- E.g., Bob tried to exit without checking in, or insufficient funds
INSERT INTO fraud_alerts (user_id, trip_id, reason) VALUES
(2, 3, 'Insufficient balance at exit');
