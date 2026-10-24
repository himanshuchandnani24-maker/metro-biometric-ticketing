import re
from flask import Blueprint, request, jsonify, g
from models.user_model import get_user_by_email, create_user, verify_password
from auth_middleware import generate_token, token_required

auth_bp = Blueprint('auth', __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not name or not email or not password:
        return jsonify({"error": "Missing required fields (name, email, password)"}), 400
        
    if len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters long"}), 400
        
    if not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "Please provide a valid email address"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
    if get_user_by_email(email):
        return jsonify({"error": "Email is already registered"}), 409
        
    if create_user(name, email, password):
        user = get_user_by_email(email)
        role = user.get('role', 'passenger') if user else 'passenger'
        user_id = user['id'] if user else None
        token = generate_token(user_id, email, role)
        
        return jsonify({
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role
            }
        }), 201
    else:
        return jsonify({"error": "Failed to register user"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
        
    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
        
    if verify_password(user['password_hash'], password):
        role = user.get('role', 'passenger')
        token = generate_token(user['id'], user['email'], role)
        
        user_data = {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": role
        }
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": user_data
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def get_current_user_profile():
    """Return verified user profile for active session."""
    user = get_user_by_email(g.current_user['email'])
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user.get('role', 'passenger')
        }
    }), 200
