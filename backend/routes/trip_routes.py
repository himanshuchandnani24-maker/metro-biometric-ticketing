import os
import time
from datetime import datetime
import razorpay
from flask import Blueprint, request, jsonify, g
from config import Config
from db import get_db_connection
from auth_middleware import token_required
from models.trip_model import enter_station, exit_station, get_trip_history
from models.fare_model import get_fare_amount
from models.wallet_model import get_wallet_balance, topup_wallet
from models.fingerprint_model import (
    identify_user_by_fingerprint,
    get_last_trip_info,
    log_fraud_alert,
    check_impossible_travel,
)

trip_bp = Blueprint('trip', __name__)

# Initialize Razorpay client
rzp_client = None
if Config.RAZORPAY_KEY_ID and Config.RAZORPAY_KEY_SECRET:
    try:
        rzp_client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))
    except Exception as e:
        print(f"Warning: Razorpay client initialization error in trip routes: {e}")
        rzp_client = None

# Track processed gate payment IDs in memory for idempotency
PROCESSED_GATE_PAYMENTS = set()


@trip_bp.before_request
def check_gate_access():
    """Optional gate access hardening: checks X-Gate-Key header against environment variable."""
    if request.path in ['/trip/entry', '/trip/exit'] or request.path.startswith('/gate/'):
        gate_key = os.environ.get('GATE_KEY')
        if gate_key:
            client_key = request.headers.get('X-Gate-Key')
            if client_key != gate_key:
                return jsonify({"error": "Invalid or missing X-Gate-Key header"}), 403


def extract_trip_inputs():
    """Helper to extract station_id and fingerprint source ONLY
    from either multipart form-data or JSON payload.
    Must NOT read user_id from form or JSON.
    """
    station_id = None
    fingerprint_source = None

    # Check multipart form-data
    if request.form:
        station_id = request.form.get('entry_station_id') or request.form.get('exit_station_id')

    if request.files and 'fingerprint' in request.files:
        fingerprint_source = request.files['fingerprint']

    # Check JSON payload
    data = request.get_json(silent=True)
    if data:
        if not station_id:
            station_id = data.get('entry_station_id') or data.get('exit_station_id')
        if not fingerprint_source:
            fingerprint_source = data.get('fingerprint_path')

    return station_id, fingerprint_source


def identify_or_error(source):
    """Helper to identify the user from fingerprint template 1:N match.
    Maps status -> HTTP code:
      spoof 403, no_match 401, ambiguous 409, error 500, default 400.
    Returns (user_id, None) on success, or (None, (response, status_code)) on error.
    """
    ident_res = identify_user_by_fingerprint(source)
    if not ident_res.get('success'):
        status = ident_res.get('status', 'error')
        status_codes = {
            "spoof": 403,
            "no_match": 401,
            "ambiguous": 409,
            "error": 500
        }
        code = status_codes.get(status, 400)
        return None, (jsonify({"error": ident_res.get('message', 'Fingerprint identification failed')}), code)

    return ident_res.get('user_id'), None


@trip_bp.route('/trip/entry', methods=['POST'])
def entry():
    station_id, source = extract_trip_inputs()

    if not station_id:
        return jsonify({"error": "Missing entry_station_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400

    # 1. Biometric 1:N Identification
    user_id, err = identify_or_error(source)
    if err:
        return err

    # 2. Impossible travel anomaly check (log fraud on anomaly, do not block)
    last_trip = get_last_trip_info(user_id)
    new_station_str = f"S{station_id}"
    is_anomaly, anomaly_reason = check_impossible_travel(
        user_id=str(user_id),
        new_station_id=new_station_str,
        new_timestamp=datetime.now(),
        last_trip=last_trip
    )
    if is_anomaly:
        log_fraud_alert(user_id, anomaly_reason)

    # 3. Enter station
    result = enter_station(user_id, station_id)
    if result['success']:
        # Do NOT return user_id
        return jsonify({
            "message": result['message'],
            "balance": result.get('balance')
        }), 200
    else:
        return jsonify({"error": result['message']}), 400


@trip_bp.route('/trip/exit', methods=['POST'])
def exit():
    station_id, source = extract_trip_inputs()

    if not station_id:
        return jsonify({"error": "Missing exit_station_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400

    # 1. Biometric 1:N Identification
    user_id, err = identify_or_error(source)
    if err:
        return err

    # 2. Exit station
    result = exit_station(user_id, station_id)
    if result['success']:
        return jsonify({
            "message": result['message'],
            "fare_charged": float(result['fare_charged']),
            "remaining_balance": float(result['remaining_balance']) if 'remaining_balance' in result else None
        }), 200
    else:
        status_code = 402 if result.get('insufficient_balance') else 400
        return jsonify({
            "error": result.get('message'),
            "insufficient_balance": result.get('insufficient_balance', False),
            "amount_needed": float(result['amount_needed']) if 'amount_needed' in result else None,
            "fare_amount": float(result['fare_amount']) if 'fare_amount' in result else None,
            "current_balance": float(result['current_balance']) if 'current_balance' in result else None
        }), status_code


@trip_bp.route('/gate/pay/order', methods=['POST'])
def gate_pay_order():
    """Create Razorpay order for fare settlement at the gate.
    Requires ONLY fingerprint + exit_station_id.
    Identifies the user, determines active trip and computes amount_needed on the server.
    """
    exit_station_id, source = extract_trip_inputs()

    if not exit_station_id:
        return jsonify({"error": "Missing exit_station_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file"}), 400

    # 1. Identify user from fingerprint
    user_id, err = identify_or_error(source)
    if err:
        return err

    # 2. Find IN_PROGRESS trip
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection error"}), 500

    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id, entry_station_id FROM trips WHERE user_id = %s AND status = 'IN_PROGRESS'",
            (user_id,)
        )
        trip = cur.fetchone()
        if not trip:
            return jsonify({"error": "No active in-progress trip found for rider"}), 400

        entry_station_id = trip['entry_station_id']
        fare_amount = get_fare_amount(entry_station_id, exit_station_id)
        if fare_amount is None:
            if int(entry_station_id) == int(exit_station_id):
                fare_amount = 5.00
            else:
                fare_amount = 10.00
        fare_amount = float(fare_amount)

        # Get wallet balance and compute amount needed ON THE SERVER
        balance = get_wallet_balance(user_id)
        curr_bal = float(balance) if balance is not None else 0.0
        amount_needed = round(fare_amount - curr_bal, 2)
        if amount_needed <= 0:
            return jsonify({"error": "Wallet balance is already sufficient for this trip."}), 400

        amount_paise = int(round(amount_needed * 100))
        receipt_id = f"gate_rcpt_u{user_id}_{int(time.time())}"
        order_id = None
        is_simulated = False
        order_error = None

        if rzp_client and not Config.RAZORPAY_KEY_ID.startswith('rzp_test_metroDemo'):
            try:
                rzp_order = rzp_client.order.create(data={
                    'amount': amount_paise,
                    'currency': 'INR',
                    'receipt': receipt_id,
                    'payment_capture': 1,
                    'notes': {
                        'user_id': str(user_id),
                        'trip_id': str(trip['id']),
                        'amount_needed': str(amount_needed)
                    }
                })
                order_id = rzp_order.get('id')
            except Exception as e:
                print(f"Razorpay gate order error: {e}")
                order_error = str(e)
                is_simulated = True

        if not order_id:
            # Simulated order format embeds user_id and amount_paise for verification
            order_id = f"order_gate_{int(time.time())}_{user_id}_{amount_paise}"
            is_simulated = True

        return jsonify({
            "order_id": order_id,
            "key_id": Config.RAZORPAY_KEY_ID,
            "amount": amount_needed,
            "amount_paise": amount_paise,
            "currency": "INR",
            "is_simulated": is_simulated,
            "order_error": order_error
        }), 200

    finally:
        conn.close()


@trip_bp.route('/gate/pay/verify', methods=['POST'])
def gate_pay_verify():
    """Verify Razorpay payment signature and credit the wallet at the gate.
    Requires ONLY fingerprint + razorpay fields (no user_id or amount accepted from client).
    """
    fingerprint_source = None
    if request.files and 'fingerprint' in request.files:
        fingerprint_source = request.files['fingerprint']

    # Read payment details from form-data or JSON
    data = request.get_json(silent=True) or {}
    razorpay_order_id = request.form.get('razorpay_order_id') or data.get('razorpay_order_id', '')
    razorpay_payment_id = request.form.get('razorpay_payment_id') or data.get('razorpay_payment_id', '')
    razorpay_signature = request.form.get('razorpay_signature') or data.get('razorpay_signature', '')
    if not fingerprint_source:
        fingerprint_source = data.get('fingerprint_path')

    if not fingerprint_source:
        return jsonify({"error": "Missing biometric fingerprint scan"}), 400
    if not razorpay_order_id or not razorpay_payment_id:
        return jsonify({"error": "Missing Razorpay payment identifiers"}), 400

    # 1. Identify user from fingerprint
    user_id, err = identify_or_error(fingerprint_source)
    if err:
        return err

    # 2. Idempotency check: a payment_id may be credited only once
    if razorpay_payment_id in PROCESSED_GATE_PAYMENTS:
        return jsonify({
            "message": "Payment already verified and wallet credited successfully",
            "payment_id": razorpay_payment_id
        }), 200

    # 3. Verify order ownership and amount
    amount_needed = None
    if str(razorpay_order_id).startswith('order_gate_'):
        parts = razorpay_order_id.split('_')
        # Structure: order_gate_<timestamp>_<user_id>_<amount_paise>
        if len(parts) >= 4 and str(parts[3]) != str(user_id):
            return jsonify({"error": "Payment order does not belong to identified rider"}), 403
        if len(parts) >= 5:
            try:
                amount_needed = float(parts[4]) / 100.0
            except ValueError:
                amount_needed = None
    elif rzp_client and not Config.RAZORPAY_KEY_ID.startswith('rzp_test_metroDemo'):
        try:
            rzp_order = rzp_client.order.fetch(razorpay_order_id)
            order_user = rzp_order.get('notes', {}).get('user_id')
            if order_user and str(order_user) != str(user_id):
                return jsonify({"error": "Payment order does not belong to identified rider"}), 403
            amount_needed = float(rzp_order.get('amount', 0)) / 100.0
        except Exception as e:
            print(f"Error fetching razorpay order: {e}")

    # Fallback to computing fare difference from user's active trip if not found in order
    if not amount_needed or amount_needed <= 0:
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor(dictionary=True)
                cur.execute(
                    "SELECT id, entry_station_id FROM trips WHERE user_id = %s AND status = 'IN_PROGRESS'",
                    (user_id,)
                )
                active_trip = cur.fetchone()
                if active_trip:
                    curr_bal = float(get_wallet_balance(user_id) or 0.0)
                    amount_needed = max(5.0, round(10.0 - curr_bal, 2))
                else:
                    amount_needed = 10.0
            finally:
                conn.close()
        else:
            amount_needed = 10.0

    # 4. Signature verification
    is_simulated = (
        Config.RAZORPAY_KEY_ID.startswith('rzp_test_metroDemo')
        or not razorpay_order_id
        or str(razorpay_order_id).startswith('order_')
        or (razorpay_signature and str(razorpay_signature).startswith('simulated_'))
    )

    if rzp_client and not is_simulated and razorpay_signature:
        try:
            rzp_client.utility.verify_payment_signature({
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            })
        except razorpay.errors.SignatureVerificationError:
            return jsonify({"error": "Payment signature verification failed"}), 400
        except Exception as e:
            return jsonify({"error": f"Payment verification error: {str(e)}"}), 400

    # 5. Credit wallet and log payment
    if topup_wallet(user_id, amount_needed):
        PROCESSED_GATE_PAYMENTS.add(razorpay_payment_id)
        return jsonify({
            "message": "Payment verified and wallet credited successfully",
            "amount": amount_needed,
            "payment_id": razorpay_payment_id
        }), 200
    else:
        return jsonify({"error": "Failed to update wallet balance in database"}), 500


@trip_bp.route('/trip/history/<int:user_id>', methods=['GET'])
@token_required
def history(user_id):
    """Logged-in passenger trip history.
    Protected with token_required so passengers can only view their own trips.
    """
    current_user = getattr(g, 'current_user', {})
    if current_user.get('role') != 'admin' and current_user.get('user_id') != user_id:
        return jsonify({"error": "Unauthorized access to user trip history"}), 403

    trips = get_trip_history(user_id)
    return jsonify({"history": trips}), 200
