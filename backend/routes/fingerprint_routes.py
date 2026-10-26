import base64
import os
from flask import Blueprint, request, jsonify, Response, send_file
from models.fingerprint_model import (
    register_user_fingerprint,
    verify_user_fingerprint,
    generate_unique_1532_template,
)

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

@fingerprint_bp.route('/fingerprint/status/<int:user_id>', methods=['GET'])
def get_status(user_id):
    """Check if the user has already enrolled a biometric fingerprint."""
    from db import get_db_connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT id, created_at FROM fingerprint_templates WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        return jsonify({
            "enrolled": bool(row),
            "created_at": row['created_at'].isoformat() if row and row.get('created_at') else None
        }), 200
    finally:
        conn.close()

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


@fingerprint_bp.route('/fingerprint/generate-template', methods=['GET', 'POST'])
def generate_template():
    """Generate a random 1532-byte unique biometric fingerprint template for a user."""
    user_id = request.args.get('user_id') or (request.get_json(silent=True) or {}).get('user_id')
    template_bytes = generate_unique_1532_template(user_id)
    b64_str = base64.b64encode(template_bytes).decode('utf-8')
    hex_str = template_bytes.hex()
    return jsonify({
        "size_bytes": len(template_bytes),
        "template_base64": b64_str,
        "template_hex": hex_str,
        "format": "raw_binary_1532",
        "filename": "fingerprint_template.dat"
    }), 200


@fingerprint_bp.route('/fingerprint/download-template', methods=['GET'])
def download_template():
    """Directly download a fresh 1532-byte unique template as a binary file."""
    user_id = request.args.get('user_id')
    template_bytes = generate_unique_1532_template(user_id)
    return Response(
        template_bytes,
        mimetype="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=fingerprint_template.dat"}
    )


@fingerprint_bp.route('/fingerprint/download/<int:user_id>', methods=['GET'])
def download_user_template(user_id):
    """Download the enrolled fingerprint template file for a registered user."""
    from db import get_db_connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database error"}), 500
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT template_data FROM fingerprint_templates WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if not row or not row.get('template_data'):
            return jsonify({"error": "No fingerprint template enrolled for this user"}), 404
        filepath = row['template_data']
        if not os.path.exists(filepath):
            return jsonify({"error": "Stored template file not found on disk"}), 404
        filename = os.path.basename(filepath)
        return send_file(filepath, as_attachment=True, download_name=filename)
    finally:
        conn.close()
