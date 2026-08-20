from flask import Blueprint, request, jsonify
from models.fingerprint_model import register_user_fingerprint, verify_user_fingerprint

fingerprint_bp = Blueprint('fingerprint', __name__)

def extract_input_and_user_id():
    """Helper to extract user_id and fingerprint source (file object or path string)
    from either multipart form-data or JSON payload.
    """
    user_id = None
    fingerprint_source = None
    
    # Check form-data (multipart/form-data)
    if request.form:
        user_id = request.form.get('user_id')
    if request.files and 'fingerprint' in request.files:
        fingerprint_source = request.files['fingerprint']
        
    # Check JSON payload
    if not fingerprint_source or not user_id:
        data = request.get_json(silent=True)
        if data:
            if not user_id:
                user_id = data.get('user_id')
            if not fingerprint_source:
                fingerprint_source = data.get('fingerprint_path')
                
    return user_id, fingerprint_source

@fingerprint_bp.route('/fingerprint/register', methods=['POST'])
def register():
    user_id, source = extract_input_and_user_id()
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400
        
    result = register_user_fingerprint(user_id, source)
    if result['success']:
        return jsonify({"message": result['message']}), 201
    else:
        # Check if user not found to return correct status
        if result['message'] == "User not found":
            return jsonify({"error": result['message']}), 404
        return jsonify({"error": result['message']}), 400

@fingerprint_bp.route('/fingerprint/verify', methods=['POST'])
def verify():
    user_id, source = extract_input_and_user_id()
    
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400
        
    result = verify_user_fingerprint(user_id, source)
    if result['success']:
        return jsonify({
            "message": result['message'],
            "score": result.get('score')
        }), 200
    else:
        status_codes = {
            "user_not_found": 404,
            "unregistered": 404,
            "template_missing": 500,
            "spoof": 403,
            "mismatch": 401,
            "error": 500
        }
        status = result.get('status', 'error')
        code = status_codes.get(status, 400)
        return jsonify({"error": result['message']}), code
