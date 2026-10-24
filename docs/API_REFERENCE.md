# 📚 REST API Reference — Biometric Metro Ticketing

Base URL: `/api` (Proxied in development to `http://localhost:5000`)

---

## 1. Authentication Endpoints

### `POST /api/register`
Register a new passenger account.
* **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 105,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "passenger"
    }
  }
  ```

### `POST /api/login`
Authenticate user with email and password.
* **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 105,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "passenger"
    }
  }
  ```

### `GET /api/auth/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "user": {
      "id": 105,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "passenger"
    }
  }
  ```

---

## 2. Wallet & Payment Endpoints

### `GET /api/wallet/<user_id>`
* **Response (200 OK):**
  ```json
  {
    "balance": 150.00
  }
  ```

### `POST /api/wallet/create-order`
Create a Razorpay order for online wallet top-up.
* **Body:**
  ```json
  {
    "user_id": 105,
    "amount": 200.00
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "order_id": "order_test_179261...",
    "amount": 200.00,
    "amount_paise": 20000,
    "currency": "INR",
    "key_id": "rzp_test_metroDemoKey"
  }
  ```

### `POST /api/wallet/verify-payment`
Verify Razorpay signature and credit stored wallet balance.
* **Body:**
  ```json
  {
    "user_id": 105,
    "amount": 200.00,
    "razorpay_order_id": "order_test_179261...",
    "razorpay_payment_id": "pay_test_987654",
    "razorpay_signature": "simulated_test_sig"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "message": "Payment verified and wallet credited successfully",
    "amount": 200.00,
    "payment_id": "pay_test_987654"
  }
  ```

### `GET /api/wallet/payments/<user_id>`
Retrieve all recharge payment transactions for a passenger.
* **Response (200 OK):**
  ```json
  {
    "payments": [
      {
        "id": 12,
        "user_id": 105,
        "amount": 200.00,
        "status": "SUCCESS",
        "created_at": "2026-10-25T00:45:00"
      }
    ]
  }
  ```

---

## 3. Biometric Fingerprint Endpoints

### `POST /api/fingerprint/register`
* **Content-Type:** `multipart/form-data`
* **Form fields:**
  * `user_id`: Integer
  * `fingerprint`: Image file (`.png`, `.jpg`)
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Biometric fingerprint template enrolled successfully."
  }
  ```

### `POST /api/fingerprint/verify`
* **Content-Type:** `multipart/form-data`
* **Form fields:** `user_id`, `fingerprint` file
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "score": 0.88,
    "message": "Fingerprint verified successfully"
  }
  ```

---

## 4. Metro Gate & Trip Endpoints

### `POST /api/trip/entry`
Authenticate passenger at station entry gate turnstile.
* **Content-Type:** `multipart/form-data`
* **Form fields:**
  * `user_id`: Integer
  * `entry_station_id`: Integer (1 to 6)
  * `fingerprint`: Image file
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Entry authenticated. Gate turnstile open."
  }
  ```

### `POST /api/trip/exit`
Authenticate passenger at station exit turnstile and deduct fare.
* **Content-Type:** `multipart/form-data`
* **Form fields:**
  * `user_id`: Integer
  * `exit_station_id`: Integer (1 to 6)
  * `fingerprint`: Image file
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Exit successful",
    "fare_charged": 20.00
  }
  ```

### `GET /api/trip/history/<user_id>`
Retrieve journey history for a passenger.
* **Response (200 OK):**
  ```json
  {
    "history": [
      {
        "id": 44,
        "entry_station_id": 1,
        "exit_station_id": 4,
        "entry_time": "2026-10-25T00:15:00",
        "exit_time": "2026-10-25T00:38:00",
        "fare_charged": 20.00,
        "status": "COMPLETED"
      }
    ]
  }
  ```

---

## 5. Administration Endpoints (Protected: Admin Only)
* **Headers:** `Authorization: Bearer <admin_token>`

### `GET /api/admin/trips`
Returns all trips across the network.

### `GET /api/admin/revenue`
Returns aggregate system fare revenue and wallet top-ups.

### `GET /api/admin/alerts`
Returns logged security events (impossible travel, spoof attempts, exit mismatches).
