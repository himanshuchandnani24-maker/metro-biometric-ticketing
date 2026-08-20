from flask import Blueprint, request, jsonify
from datetime import datetime
from models.trip_model import enter_station, exit_station, get_trip_history
from models.fingerprint_model import verify_user_fingerprint, get_last_trip_info, log_fraud_alert, check_impossible_travel

trip_bp = Blueprint('trip', __name__)

def extract_trip_inputs():
    """Helper to extract user_id, station_id, and fingerprint source
    from either multipart form-data or JSON payload.
    """
    user_id = None
    station_id = None
    fingerprint_source = None
    
    # Check form-data
    if request.form:
        user_id = request.form.get('user_id')
        # Could be entry_station_id or exit_station_id
        station_id = request.form.get('entry_station_id') or request.form.get('exit_station_id')
        
    if request.files and 'fingerprint' in request.files:
        fingerprint_source = request.files['fingerprint']
        
    # Check JSON payload
    data = request.get_json(silent=True)
    if data:
        if not user_id:
            user_id = data.get('user_id')
        if not station_id:
            station_id = data.get('entry_station_id') or data.get('exit_station_id')
        if not fingerprint_source:
            fingerprint_source = data.get('fingerprint_path')
            
    return user_id, station_id, fingerprint_source

@trip_bp.route('/trip/entry', methods=['POST'])
def entry():
    user_id, entry_station_id, source = extract_trip_inputs()
    
    if not user_id or not entry_station_id:
        return jsonify({"error": "Missing user_id or entry_station_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400
        
    # 1. Verify fingerprint (includes spoof check and fraud logging for mismatches/spoof)
    verify_res = verify_user_fingerprint(user_id, source)
    if not verify_res['success']:
        status_codes = {
            "user_not_found": 404,
            "unregistered": 404,
            "template_missing": 500,
            "spoof": 403,
            "mismatch": 401,
            "error": 500
        }
        status = verify_res.get('status', 'error')
        code = status_codes.get(status, 400)
        return jsonify({"error": verify_res['message']}), code

    # 2. Check impossible travel anomaly
    last_trip = get_last_trip_info(user_id)
    # Map station ID (integer) to string S1, S2, S3, S4 format
    new_station_str = f"S{entry_station_id}"
    is_anomaly, anomaly_reason = check_impossible_travel(
        user_id=str(user_id),
        new_station_id=new_station_str,
        new_timestamp=datetime.now(),
        last_trip=last_trip
    )
    if is_anomaly:
        log_fraud_alert(user_id, anomaly_reason)
        return jsonify({"error": anomaly_reason}), 400
        
    # 3. Normal trip entry flow
    result = enter_station(user_id, entry_station_id)
    if result['success']:
        return jsonify({"message": result['message']}), 200
    else:
        return jsonify({"error": result['message']}), 400

@trip_bp.route('/trip/exit', methods=['POST'])
def exit():
    user_id, exit_station_id, source = extract_trip_inputs()
    
    if not user_id or not exit_station_id:
        return jsonify({"error": "Missing user_id or exit_station_id"}), 400
    if not source:
        return jsonify({"error": "Missing fingerprint file or fingerprint_path"}), 400
        
    # 1. Verify fingerprint (includes spoof check and fraud logging for mismatches/spoof)
    verify_res = verify_user_fingerprint(user_id, source)
    if not verify_res['success']:
        status_codes = {
            "user_not_found": 404,
            "unregistered": 404,
            "template_missing": 500,
            "spoof": 403,
            "mismatch": 401,
            "error": 500
        }
        status = verify_res.get('status', 'error')
        code = status_codes.get(status, 400)
        return jsonify({"error": verify_res['message']}), code
        
    # 2. Normal trip exit flow
    result = exit_station(user_id, exit_station_id)
    if result['success']:
        return jsonify({
            "message": result['message'],
            "fare_charged": float(result['fare_charged'])
        }), 200
    else:
        return jsonify({"error": result['message']}), 400

@trip_bp.route('/trip/history/<int:user_id>', methods=['GET'])
def history(user_id):
    trips = get_trip_history(user_id)
    return jsonify({"history": trips}), 200
