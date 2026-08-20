from flask import Blueprint, request, jsonify
from models.wallet_model import get_wallet_balance, topup_wallet

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/wallet/<int:user_id>', methods=['GET'])
def get_balance(user_id):
    balance = get_wallet_balance(user_id)
    if balance is None:
        return jsonify({"error": "Wallet not found"}), 404
    return jsonify({"balance": float(balance)}), 200

@wallet_bp.route('/wallet/topup', methods=['POST'])
def topup():
    data = request.json
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    if not user_id or amount is None:
        return jsonify({"error": "Missing user_id or amount"}), 400
        
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400
    except ValueError:
        return jsonify({"error": "Invalid amount"}), 400
        
    if topup_wallet(user_id, amount):
        return jsonify({"message": "Topup successful"}), 200
    else:
        return jsonify({"error": "Topup failed"}), 500
