# 🏛️ System Architecture — Biometric Smart Metro Ticketing System

## 1. Overview
The **Biometric Smart Metro Ticketing System ("Angin")** is an end-to-end contactless mass-transit platform where passengers can travel phone-free and card-free. The system uses computer vision fingerprint biometrics, stored digital balances, anti-spoofing heuristics, and automated fare calculation across the **Ahmedabad & Gandhinagar Metro Network (GMRC)**.

```
                    ┌────────────────────────────┐
                    │      React 19 + Vite       │
                    │   Client Web Application   │
                    └─────────────┬──────────────┘
                                  │ JSON / JWT (Bearer)
                                  ▼
                    ┌────────────────────────────┐
                    │     Flask REST Backend     │
                    │  (Authentication & API)    │
                    └──────┬──────────────┬──────┘
                           │              │
                           ▼              ▼
            ┌───────────────────┐    ┌───────────────────┐
            │   MySQL Database  │    │Fingerprint Engine │
            │  (InnoDB Engine)  │    │  (OpenCV + ORB)   │
            └───────────────────┘    └───────────────────┘
```

---

## 2. Core Subsystems

### 2.1 Biometric Processing Engine (`fingerprint-matcher/`)
* **Feature Extraction & Matching:** Uses **ORB (Oriented FAST and Rotated BRIEF)** keypoint detector and descriptors with a **Brute-Force Hamming Distance Matcher**.
* **Anti-Spoofing Detection (`spoof_check.py`):**
  * Evaluates image contrast and dynamic range.
  * Measures image sharpness via the **Laplacian variance** to reject blank screens, uniform synthetic scans, and low-fidelity photocopies.
* **Impossible-Travel Anomaly Detection (`anomaly_check.py`):**
  * Tracks timestamps and minimum physical transit intervals between stations along the Ahmedabad–Gandhinagar corridor (S1: APMC to S6: Infocity).
  * Automatically flags impossible transit speeds (e.g. traveling between distant stations in 1 minute) and records fraud alerts.

### 2.2 Backend Application Layer (`backend/`)
* Built with **Python Flask** using modular blueprints:
  * `auth_bp`: Registration, login, password hashing via `bcrypt`, and secure JWT generation.
  * `wallet_bp`: Balance checks, Razorpay test order creation, payment verification, and transaction history.
  * `trip_bp`: Station entry gate check, balance threshold verification, exit gate calculation, and trip history.
  * `fingerprint_bp`: User biometric template enrollment and 1-to-1 verification.
  * `admin_bp`: Role-guarded metrics (network revenue, live trips, security & fraud alerts).

### 2.3 Database Layer (`database/`)
* 7 relational MySQL tables with referential integrity and foreign keys:
  * `users`: Passenger and administrator credentials, names, and roles (`passenger` vs `admin`).
  * `wallets`: Pre-stored passenger digital currency.
  * `stations`: Real Ahmedabad & Gandhinagar GMRC metro stations.
  * `fares`: Complete symmetric fare matrix (including same-station exit fee).
  * `fingerprint_templates`: Biometric template paths linked to user IDs.
  * `trips`: `IN_PROGRESS`, `COMPLETED`, and `FAILED` journey logs with timestamps.
  * `payments`: Detailed payment records for wallet recharges.
  * `fraud_alerts`: Audit logs of spoofing, impossible travel, and entry/exit violations.

---

## 3. Station Gate Flow & State Machine

```
[Passenger at Entry Gate]
        │
        ▼
Scan Fingerprint ──► Verify Identity & Anti-Spoof
        │
        ├── [Mismatch / Spoof] ──► Flag Alert, Gate Closed 🔴
        │
        ▼
Check Stored Balance >= Network Max Fare (₹30.00)
        │
        ├── [Insufficient Balance] ──► Reject Entry, Prompt Recharge 🔴
        │
        ▼
Open Turnstile 🟢 ──► Create Active Trip (IN_PROGRESS)
        │
[Ride Metro Train]
        │
        ▼
[Passenger at Exit Gate]
        │
        ▼
Scan Fingerprint ──► Match Active Journey
        │
Calculate Route Fare (Origin -> Destination)
        │
Deduct Fare from Stored Wallet Balance
        │
Mark Trip COMPLETED ──► Open Turnstile 🟢
```
