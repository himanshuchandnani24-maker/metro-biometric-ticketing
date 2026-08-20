from flask import Blueprint, request, jsonify
from models.user_model import get_user_by_email, create_user, verify_password

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400
        
    if get_user_by_email(email):
        return jsonify({"error": "Email already exists"}), 409
        
    if create_user(name, email, password):
        return jsonify({"message": "User registered successfully"}), 201
    else:
        return jsonify({"error": "Failed to register user"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
        
    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
        
    if verify_password(user['password_hash'], password):
        # Do not expose password_hash in response
        user_data = {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }
        return jsonify({"message": "Login successful", "user": user_data}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
