# 🚀 Setup & Execution Guide — Biometric Smart Metro Ticketing System

## 1. Prerequisites
* **Operating System:** Windows 10/11, Linux, or macOS
* **Python:** 3.10+ (with virtual environment `venv`)
* **Node.js:** v18+ (with npm)
* **Database:** MySQL 8.0+ or MySQL 9.x running locally on port 3306

---

## 2. Database Initialization
1. Ensure your local MySQL server is running.
2. Create the project database:
   ```sql
   CREATE DATABASE IF NOT EXISTS biometric_metro;
   USE biometric_metro;
   ```
3. Run the schema script:
   ```bash
   mysql -u root -p biometric_metro < database/schema.sql
   ```
4. Seed the database with demo users, stations (Ahmedabad & Gandhinagar GMRC), fares, and admin:
   ```bash
   mysql -u root -p biometric_metro < database/seed_data.sql
   ```

---

## 3. Backend Setup (Flask REST API)
1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Verify your `.env` configuration file in `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=biometric_metro
   SECRET_KEY=angin_metro_super_secret_jwt_key_2026
   RAZORPAY_KEY_ID=rzp_test_metroDemoKey
   RAZORPAY_KEY_SECRET=metroDemoSecretKey
   ```
5. Run the Flask API server:
   ```powershell
   python app.py
   ```
   *The backend starts at `http://127.0.0.1:5000`.*

---

## 4. Frontend Setup (React + Vite)
1. Open a new terminal and navigate to `frontend/`:
   ```powershell
   cd frontend
   ```
2. Install npm dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   *The client application launches at `http://localhost:5173`.*

---

## 5. Demo Credentials

### Passenger Account
* **Email:** `alice_test@example.com`
* **Password:** `password123`
* **Role:** `passenger`

### Administrator Account
* **Email:** `admin@metro.local`
* **Password:** `admin123`
* **Role:** `admin` (Unlocks the Admin Dashboard at `/admin`)

---

## 6. How to Test the Complete Biometric Flow
1. **Login:** Log in with `alice_test@example.com` (or create a new account on `/register`).
2. **Recharge Wallet:** Go to **Wallet**, enter ₹100, and click **Pay with Razorpay** (or use quick vouchers).
3. **Station Entry Gate:** Navigate to **Entry Gate**, select **Station #1 (APMC)**, pick **Sample A** (`finger1.png`), and click **Enter Station**. Turnstile opens!
4. **Station Exit Gate:** Navigate to **Exit Gate**, select **Station #4 (Motera Stadium)**, pick **Sample A** (`finger1.png`), and click **Exit Station**. Turnstile opens, and the ₹20.00 fare is auto-deducted!
5. **Travel History:** Go to **History** to see your trip ledger.
6. **Admin Dashboard:** Log in with `admin@metro.local` to view system revenue, total rides, and security alerts.
