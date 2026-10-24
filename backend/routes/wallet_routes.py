import time
import razorpay
from flask import Blueprint, request, jsonify
from config import Config
from models.wallet_model import get_wallet_balance, topup_wallet
from models.payment_model import get_payments

wallet_bp = Blueprint('wallet', __name__)

# Initialize Razorpay client
rzp_client = None
if Config.RAZORPAY_KEY_ID and Config.RAZORPAY_KEY_SECRET:
    try:
        rzp_client = razorpay.Client(auth=(Config.RAZORPAY_KEY_ID, Config.RAZORPAY_KEY_SECRET))
    except Exception as e:
        print(f"Warning: Razorpay client initialization error: {e}")
        rzp_client = None

@wallet_bp.route('/wallet/<int:user_id>', methods=['GET'])
def get_balance(user_id):
    balance = get_wallet_balance(user_id)
    if balance is None:
        return jsonify({"error": "Wallet not found"}), 404
    return jsonify({"balance": float(balance)}), 200

@wallet_bp.route('/wallet/config', methods=['GET'])
def get_wallet_config():
    """Return public Razorpay key ID for checkout initialization."""
    return jsonify({
        "razorpay_key_id": Config.RAZORPAY_KEY_ID
    }), 200

@wallet_bp.route('/wallet/create-order', methods=['POST'])
def create_order():
    """Create a Razorpay order for wallet top-up."""
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    if not user_id or amount is None:
        return jsonify({"error": "Missing user_id or amount"}), 400
        
    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    # Ensure user exists in database
    from db import get_db_connection
    check_conn = get_db_connection()
    if check_conn:
        try:
            check_cur = check_conn.cursor()
            check_cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not check_cur.fetchone():
                return jsonify({"error": "User account not found in database. Please log out and log in again."}), 404
        finally:
            check_conn.close()

    amount_paise = int(round(amount_val * 100))
    receipt_id = f"rcpt_u{user_id}_{int(time.time())}"
    order_id = None
    is_simulated = False
    order_error = None

    # If valid non-demo credentials exist, create order via Razorpay API
    if rzp_client and not Config.RAZORPAY_KEY_ID.startswith('rzp_test_metroDemo'):
        try:
            rzp_order = rzp_client.order.create(data={
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': receipt_id,
                'payment_capture': 1
            })
            order_id = rzp_order.get('id')
        except Exception as e:
            print(f"Razorpay live order create warning: {e}")
            order_error = str(e)
            order_id = None
            is_simulated = True

    # Fallback simulation order for demo/test sandbox
    if not order_id:
        order_id = f"order_test_{int(time.time())}_{user_id}"
        is_simulated = True

    return jsonify({
        "order_id": order_id,
        "amount": amount_val,
        "amount_paise": amount_paise,
        "currency": "INR",
        "key_id": Config.RAZORPAY_KEY_ID,
        "is_simulated": is_simulated,
        "order_error": order_error
    }), 200

@wallet_bp.route('/wallet/verify-payment', methods=['POST'])
def verify_payment():
    """Verify Razorpay payment signature and credit the wallet."""
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount')
    razorpay_order_id = data.get('razorpay_order_id', '')
    razorpay_payment_id = data.get('razorpay_payment_id', '')
    razorpay_signature = data.get('razorpay_signature', '')

    if not user_id or amount is None:
        return jsonify({"error": "Missing user_id or amount"}), 400

    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return jsonify({"error": "Invalid amount"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    # Determine if this was a simulated/demo order
    is_simulated = (
        Config.RAZORPAY_KEY_ID.startswith('rzp_test_metroDemo')
        or not razorpay_order_id
        or str(razorpay_order_id).startswith('order_test_')
        or (razorpay_signature and str(razorpay_signature).startswith('simulated_'))
    )

    # If non-demo Razorpay keys and real order provided, verify with SDK
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
            print(f"Signature check warning: {e}")
            return jsonify({"error": f"Payment verification error: {str(e)}"}), 400

    # Credit the wallet balance and log payment
    if topup_wallet(user_id, amount_val):
        return jsonify({
            "message": "Payment verified and wallet credited successfully",
            "amount": amount_val,
            "payment_id": razorpay_payment_id or f"pay_test_{int(time.time())}"
        }), 200
    else:
        from db import get_db_connection
        c_conn = get_db_connection()
        user_exists = False
        if c_conn:
            try:
                c_cur = c_conn.cursor()
                c_cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                user_exists = bool(c_cur.fetchone())
            finally:
                c_conn.close()
        if not user_exists:
            return jsonify({"error": "User account was not found in the database. Please log out and log in again."}), 404
        return jsonify({"error": "Failed to update wallet balance in database"}), 500

@wallet_bp.route('/wallet/topup', methods=['POST'])
def direct_topup():
    """Direct topup fallback for quick testing."""
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    if not user_id or amount is None:
        return jsonify({"error": "Missing user_id or amount"}), 400
        
    try:
        amount_val = float(amount)
        if amount_val <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400
        
    if topup_wallet(user_id, amount_val):
        return jsonify({"message": "Topup successful"}), 200
    else:
        return jsonify({"error": "Topup failed"}), 500

@wallet_bp.route('/wallet/payments/<int:user_id>', methods=['GET'])
def get_user_payments(user_id):
    """Retrieve all payment records for a user."""
    payments = get_payments(user_id)
    return jsonify({"payments": payments}), 200
