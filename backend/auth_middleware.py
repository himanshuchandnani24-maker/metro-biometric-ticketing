import datetime
from functools import wraps
import jwt
from flask import request, jsonify, g
from config import Config

def generate_token(user_id, email, role='passenger', expires_in_hours=24):
    """Generate a JWT token for an authenticated user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=expires_in_hours),
        'iat': datetime.datetime.now(datetime.timezone.utc)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to enforce valid JWT token in Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1].strip()
        
        if not token:
            return jsonify({"error": "Authorization token is missing"}), 401
            
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    """Decorator to enforce admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1].strip()
            
        if not token:
            return jsonify({"error": "Admin authorization token is missing"}), 401
            
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401
            
        if payload.get('role') != 'admin':
            return jsonify({"error": "Access denied: Administrator privileges required"}), 403
            
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated
