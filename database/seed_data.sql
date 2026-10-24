-- Demo Users
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Smith', 'alice@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'passenger'),
('Bob Johnson', 'bob@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'passenger'),
('Charlie Brown', 'charlie@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'passenger'),
('System Admin', 'admin@metro.local', '$2b$12$GovyxO6h8gwdeZ4P8j2KTepqb0qJBKxrQIyNWMamVXNkGDrtW645.', 'admin');

-- Demo Wallets
INSERT INTO wallets (user_id, balance) VALUES
(1, 50.00),
(2, 10.00),
(3, 100.00);

-- Demo Stations (Ahmedabad & Gandhinagar Metro - GMRC)
INSERT INTO stations (id, name) VALUES
(1, 'APMC'),
(2, 'Old High Court'),
(3, 'Kalupur Railway Station'),
(4, 'Motera Stadium'),
(5, 'GNLU (Gandhinagar)'),
(6, 'Infocity (Gandhinagar)');

-- Demo Fares (Realistic GMRC Distance-Based Fares in INR)
-- S1: APMC, S2: Old High Court, S3: Kalupur, S4: Motera Stadium, S5: GNLU, S6: Infocity
INSERT INTO fares (entry_station_id, exit_station_id, amount) VALUES
-- Same Station Exit (Minimum token fee)
(1, 1, 5.00), (2, 2, 5.00), (3, 3, 5.00), (4, 4, 5.00), (5, 5, 5.00), (6, 6, 5.00),
-- From APMC (1)
(1, 2, 10.00), (1, 3, 15.00), (1, 4, 20.00), (1, 5, 25.00), (1, 6, 30.00),
-- From Old High Court (2)
(2, 1, 10.00), (2, 3, 10.00), (2, 4, 15.00), (2, 5, 20.00), (2, 6, 25.00),
-- From Kalupur Railway Station (3)
(3, 1, 15.00), (3, 2, 10.00), (3, 4, 10.00), (3, 5, 15.00), (3, 6, 20.00),
-- From Motera Stadium (4)
(4, 1, 20.00), (4, 2, 15.00), (4, 3, 10.00), (4, 5, 10.00), (4, 6, 15.00),
-- From GNLU (5)
(5, 1, 25.00), (5, 2, 20.00), (5, 3, 15.00), (5, 4, 10.00), (5, 6, 10.00),
-- From Infocity (6)
(6, 1, 30.00), (6, 2, 25.00), (6, 3, 20.00), (6, 4, 15.00), (6, 5, 10.00);

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
