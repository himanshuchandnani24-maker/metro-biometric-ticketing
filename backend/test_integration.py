import os
import sys
import unittest
import json
import shutil
from datetime import datetime, timedelta

# Ensure backend directory is in path
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if THIS_DIR not in sys.path:
    sys.path.insert(0, THIS_DIR)

from app import create_app
from db import get_db_connection

# Fingerprint paths from Phase 3 dataset
FINGER_DIR = os.path.abspath(os.path.join(THIS_DIR, '..', 'fingerprint-matcher', 'sample_images'))
FINGER1 = os.path.join(FINGER_DIR, 'finger1.png')
FINGER2 = os.path.join(FINGER_DIR, 'finger2.png')
BLANK = os.path.join(FINGER_DIR, 'blank.png')

class TestFingerprintIntegration(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        
        # Clean up database for testing or insert clean user data
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                # Clear existing test templates, trips, alerts to avoid state pollution
                cursor.execute("DELETE FROM fraud_alerts")
                cursor.execute("DELETE FROM trips")
                cursor.execute("DELETE FROM fingerprint_templates")
                cursor.execute("DELETE FROM payments")
                cursor.execute("DELETE FROM wallets")
                cursor.execute("DELETE FROM users")
                cursor.execute("DELETE FROM fares")
                cursor.execute("DELETE FROM stations")
                
                # Insert explicit stations and fares
                cursor.execute(
                    "INSERT INTO stations (id, name) VALUES (1, 'Central Station'), (2, 'North Park'), (3, 'South Side'), (4, 'East End')"
                )
                cursor.execute(
                    "INSERT INTO fares (entry_station_id, exit_station_id, amount) VALUES (1, 2, 2.50), (1, 3, 3.00), (1, 4, 4.00), (2, 1, 2.50), (2, 3, 3.50), (2, 4, 5.00), (3, 1, 3.00), (3, 2, 3.50), (3, 4, 2.00), (4, 1, 4.00), (4, 2, 5.00), (4, 3, 2.00)"
                )
                
                # Insert clean test users
                # Alice: Sufficient balance
                cursor.execute(
                    "INSERT INTO users (id, name, email, password_hash) VALUES (101, 'Alice Test', 'alice_test@example.com', 'hash')"
                )
                cursor.execute(
                    "INSERT INTO wallets (user_id, balance) VALUES (101, 100.00)"
                )
                # Bob: Low balance
                cursor.execute(
                    "INSERT INTO users (id, name, email, password_hash) VALUES (102, 'Bob Test', 'bob_test@example.com', 'hash')"
                )
                cursor.execute(
                    "INSERT INTO wallets (user_id, balance) VALUES (102, 1.00)"
                )
                conn.commit()
            except Exception as e:
                print(f"Error during setUpClass DB prep: {e}")
                conn.rollback()
            finally:
                conn.close()

    def test_01_register_fingerprint_success(self):
        # Register genuine fingerprint for Alice
        response = self.client.post('/fingerprint/register', json={
            "user_id": 101,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("successfully", data["message"])
        
        # Verify it exists in database
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT template_data FROM fingerprint_templates WHERE user_id = 101")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertTrue(os.path.exists(row['template_data']))
        finally:
            conn.close()

    def test_02_register_fingerprint_spoof_rejected(self):
        # Register blank (spoof) fingerprint for Alice
        response = self.client.post('/fingerprint/register', json={
            "user_id": 101,
            "fingerprint_path": BLANK
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("Possible spoof", data["error"])
        
        # Verify a fraud alert was logged
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT reason FROM fraud_alerts WHERE user_id = 101 ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertIn("Possible spoof", row['reason'])
        finally:
            conn.close()

    def test_03_verify_fingerprint_success(self):
        # Verify Alice with her own fingerprint copy
        response = self.client.post('/fingerprint/verify', json={
            "user_id": 101,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("successful", data["message"])
        self.assertGreater(data["score"], 0.4)

    def test_04_verify_fingerprint_mismatch(self):
        # Verify Alice with Bob's different fingerprint
        response = self.client.post('/fingerprint/verify', json={
            "user_id": 101,
            "fingerprint_path": FINGER2
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertIn("mismatch", data["error"])
        
        # Verify fraud alert logged
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT reason FROM fraud_alerts WHERE user_id = 101 ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual("Fingerprint mismatch", row['reason'])
        finally:
            conn.close()

    def test_05_verify_fingerprint_spoof(self):
        # Verify Alice with spoof print
        response = self.client.post('/fingerprint/verify', json={
            "user_id": 101,
            "fingerprint_path": BLANK
        })
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("Possible spoof", data["error"])

    def test_06_trip_entry_insufficient_balance(self):
        # Register Bob first
        self.client.post('/fingerprint/register', json={
            "user_id": 102,
            "fingerprint_path": FINGER1
        })
        
        # Try entry with insufficient balance (Bob only has 1.00, minimum is max fare, i.e. 5.00)
        response = self.client.post('/trip/entry', json={
            "user_id": 102,
            "entry_station_id": 1,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("Insufficient balance", data["error"])

    def test_07_trip_entry_success(self):
        # Alice enters Station 1 with correct fingerprint
        response = self.client.post('/trip/entry', json={
            "user_id": 101,
            "entry_station_id": 1,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("successful", data["message"])

    def test_08_trip_exit_success(self):
        # Alice exits at Station 2 with correct fingerprint
        # Fare from 1 to 2 is 2.50
        response = self.client.post('/trip/exit', json={
            "user_id": 101,
            "exit_station_id": 2,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn("successful", data["message"])
        self.assertEqual(data["fare_charged"], 2.50)

    def test_09_trip_entry_impossible_travel_anomaly(self):
        # Alice tries to enter Station 4 just 1 minute after exit at Station 2
        # (Min travel time from S2 to S4 is 15 minutes)
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor()
            # Update the last trip exit time to be 1 minute ago to simulate rapid entry
            cursor.execute(
                "UPDATE trips SET exit_time = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE user_id = 101 AND status = 'COMPLETED'"
            )
            conn.commit()
        finally:
            conn.close()
            
        response = self.client.post('/trip/entry', json={
            "user_id": 101,
            "entry_station_id": 4,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn("Impossible travel", data["error"])
        
        # Verify a fraud alert was logged
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT reason FROM fraud_alerts WHERE user_id = 101 ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertIn("Impossible travel", row['reason'])
        finally:
            conn.close()

    def test_10_trip_entry_invalid_fingerprint_rejected(self):
        # 1. Get initial wallet balance and active trips for Alice
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT balance FROM wallets WHERE user_id = 101")
            initial_balance = float(cursor.fetchone()['balance'])
            
            # Make sure no active trip exists
            cursor.execute("SELECT id FROM trips WHERE user_id = 101 AND status = 'IN_PROGRESS'")
            self.assertIsNone(cursor.fetchone())
        finally:
            conn.close()

        # 2. Attempt entry with wrong fingerprint (FINGER2)
        response = self.client.post('/trip/entry', json={
            "user_id": 101,
            "entry_station_id": 1,
            "fingerprint_path": FINGER2
        })
        self.assertEqual(response.status_code, 401)
        
        # 3. Verify wallet balance and active trips are unchanged
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT balance FROM wallets WHERE user_id = 101")
            current_balance = float(cursor.fetchone()['balance'])
            self.assertEqual(initial_balance, current_balance)
            
            cursor.execute("SELECT id FROM trips WHERE user_id = 101 AND status = 'IN_PROGRESS'")
            self.assertIsNone(cursor.fetchone())
        finally:
            conn.close()

    def test_11_trip_exit_invalid_fingerprint_rejected(self):
        # Clear previous trip history to prevent impossible travel triggers
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM trips WHERE user_id = 101")
            conn.commit()
        finally:
            conn.close()

        # 1. Put Alice in a valid active trip first
        response = self.client.post('/trip/entry', json={
            "user_id": 101,
            "entry_station_id": 1,
            "fingerprint_path": FINGER1
        })
        self.assertEqual(response.status_code, 200)

        # 2. Get initial wallet balance
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT balance FROM wallets WHERE user_id = 101")
            initial_balance = float(cursor.fetchone()['balance'])
        finally:
            conn.close()

        # 3. Attempt exit with wrong fingerprint (FINGER2)
        response = self.client.post('/trip/exit', json={
            "user_id": 101,
            "exit_station_id": 2,
            "fingerprint_path": FINGER2
        })
        self.assertEqual(response.status_code, 401)

        # 4. Verify wallet balance is unchanged and trip is still IN_PROGRESS
        conn = get_db_connection()
        assert conn is not None
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT balance FROM wallets WHERE user_id = 101")
            current_balance = float(cursor.fetchone()['balance'])
            self.assertEqual(initial_balance, current_balance)
            
            cursor.execute("SELECT status FROM trips WHERE user_id = 101 AND status = 'IN_PROGRESS'")
            self.assertIsNotNone(cursor.fetchone())
        finally:
            conn.close()

if __name__ == '__main__':
    unittest.main()
