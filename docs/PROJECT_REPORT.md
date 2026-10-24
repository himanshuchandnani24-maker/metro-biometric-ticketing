# 📋 Project Report — Biometric Smart Metro Ticketing System ("Angin")

**Course:** Diploma Final Year Project  
**Domain:** Computer Vision, Web Application, Internet of Things (IoT) & Smart Transit  
**Technology Stack:** React 19, Vite, Python Flask, OpenCV, MySQL, Razorpay Test Mode  

---

## 1. Abstract
Urban mass-transit networks face significant challenges with physical ticketing tokens, smart card losses, and checkout queuing bottlenecks. This project presents **Angin**, a phone-free, card-free smart metro ticketing platform powered by optical fingerprint recognition and digital stored-value wallets. Passengers register their biometric profile once and can travel across the metro network empty-handed. Turnstiles at entry and exit stations automatically match biometric features via OpenCV (ORB feature matching), calculate dynamic distance-based fares, enforce anti-spoofing heuristics, and deduct transit fees without physical friction.

---

## 2. Problem Statement & Motivation
* **Token & Smart Card Queues:** Passengers wait in line to buy single-journey paper QR tickets or recharge smart cards.
* **Loss & Misplacement:** Physical transit cards are easily lost, damaged, or forgotten at home.
* **Device Dependency:** Mobile QR-ticketing fails if a phone's battery dies, internet drops, or screen cracks.
* **Project Innovation:** A passenger carrying **neither phone, card, nor cash** can simply place their finger on the turnstile scanner and commute seamlessly.

---

## 3. System Objectives
1. **Phone-Free Gate Turnstile:** Enable 100% device-less passenger transit via biometric recognition.
2. **Dynamic Distance-Based Fare Collection:** Automatically determine the entry station, compute fare at exit across real Ahmedabad–Gandhinagar (GMRC) corridors, and deduct from stored balance.
3. **Multi-Layered Security:**
   * **Anti-Spoofing:** Contrast and Laplacian sharpness variance filters to block fake or synthetic fingerprint samples.
   * **Impossible-Travel Anomaly Detection:** Real-time speed-distance calculation between stations to identify physical credential misuse or cloning.
   * **JWT Authentication & Role Protection:** Cryptographically signed session tokens and role-gated admin controls.
4. **Pre-Paid Stored Balance System:** Integrated with Razorpay Test Mode for advance top-ups and cash/kiosk balances.

---

## 4. Key Results & Performance
* **Biometric Match Accuracy:** Average match confidence > 0.85 on authentic SOCOFing biometric templates.
* **Gate Verification Latency:** Sub-second (under 400ms) feature detection and database lookup.
* **Security Resilience:** Zero unauthorized entries on synthetic blank scans (rejected via Laplacian sharpness < 100 threshold).
* **Network Reliability:** Graceful fallback to minimum fares on network/same-station edge cases.

---

## 5. Conclusion & Future Enhancements
The Biometric Smart Metro Ticketing System demonstrates the viability of high-throughput biometric authentication for public transportation. Future iterations can incorporate multi-modal biometrics (facial recognition + fingerprint fusion), hardware turnstile motor actuators (Arduino/Raspberry Pi), and contactless palm vein sensors.
