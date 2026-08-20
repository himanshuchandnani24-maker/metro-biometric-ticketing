import os
import sys
import shutil
from datetime import datetime
from typing import Any, cast
from db import get_db_connection

# Add fingerprint-matcher to sys.path
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
MATCHER_DIR = os.path.abspath(os.path.join(THIS_DIR, '..', '..', 'fingerprint-matcher'))
if MATCHER_DIR not in sys.path:
    sys.path.insert(0, MATCHER_DIR)

from matcher import compare_fingerprints  # type: ignore
from spoof_check import check_for_spoof  # type: ignore
from anomaly_check import check_impossible_travel  # type: ignore

UPLOAD_DIR = os.path.abspath(os.path.join(THIS_DIR, '..', 'uploads', 'fingerprints'))

def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def log_fraud_alert(user_id, reason, trip_id=None):
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO fraud_alerts (user_id, trip_id, reason) VALUES (%s, %s, %s)",
            (user_id, trip_id, reason)
        )
        conn.commit()
        return True
    except Exception as e:
        print(f"Error logging fraud alert: {e}")
        return False
    finally:
        conn.close()

def get_last_trip_info(user_id):
    conn = get_db_connection()
    if not conn:
        return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT entry_station_id, exit_station_id, entry_time, exit_time, status FROM trips WHERE user_id = %s ORDER BY entry_time DESC LIMIT 1",
            (user_id,)
        )
        row = cursor.fetchone()
        if not row:
            return None

        row = cast(dict[str, Any], row)
        
        # Determine the last station and timestamp
        if row['status'] == 'COMPLETED' and row['exit_station_id'] is not None:
            station_id = f"S{row['exit_station_id']}"
            timestamp = row['exit_time']
        else:
            station_id = f"S{row['entry_station_id']}"
            
            timestamp = row['entry_time']
            
        return {
            "station_id": station_id,
            "timestamp": timestamp
        }
    except Exception as e:
        print(f"Error getting last trip info: {e}")
        return None
    finally:
        conn.close()

def save_uploaded_file(file_obj_or_path, user_id, filename_prefix="temp"):
    ensure_upload_dir()
    timestamp = int(datetime.now().timestamp() * 1000)
    
    if isinstance(file_obj_or_path, str):
        # It's a file path
        if not os.path.exists(file_obj_or_path):
            raise FileNotFoundError(f"Input file path {file_obj_or_path} does not exist")
        dest_filename = f"{filename_prefix}_{user_id}_{timestamp}.png"
        dest_path = os.path.join(UPLOAD_DIR, dest_filename)
        shutil.copy(file_obj_or_path, dest_path)
        return dest_path
    else:
        # It's a Flask file upload object
        dest_filename = f"{filename_prefix}_{user_id}_{timestamp}.png"
        dest_path = os.path.join(UPLOAD_DIR, dest_filename)
        file_obj_or_path.save(dest_path)
        return dest_path

def register_user_fingerprint(user_id, file_obj_or_path):
    conn = get_db_connection()
    if not conn:
        return {"success": False, "message": "Database connection error"}
        
    try:
        cursor = conn.cursor(dictionary=True)
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return {"success": False, "message": "User not found"}
            
        # Save file locally
        saved_path = save_uploaded_file(file_obj_or_path, user_id, "registered")
        
        # Run spoof check
        is_spoof, spoof_reason = check_for_spoof(saved_path)
        if is_spoof:
            # Delete file if spoof
            if os.path.exists(saved_path):
                os.remove(saved_path)
            log_fraud_alert(user_id, spoof_reason)
            return {"success": False, "message": spoof_reason}
            
        # Store in database. Delete/update old template if exists
        cursor.execute("SELECT template_data FROM fingerprint_templates WHERE user_id = %s", (user_id,))
        old_template = cursor.fetchone()
        if old_template:
            old_template = cast(dict[str, Any], old_template)
            # Delete old file
            old_path = old_template['template_data']
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception as e:
                    print(f"Error removing old template file: {e}")
            
            cursor.execute(
                "UPDATE fingerprint_templates SET template_data = %s, created_at = NOW() WHERE user_id = %s",
                (saved_path, user_id)
            )
        else:
            cursor.execute(
                "INSERT INTO fingerprint_templates (user_id, template_data) VALUES (%s, %s)",
                (user_id, saved_path)
            )
            
        conn.commit()
        return {"success": True, "message": "Fingerprint registered successfully"}
        
    except Exception as e:
        print(f"Error registering fingerprint: {e}")
        conn.rollback()
        return {"success": False, "message": f"Internal error: {e}"}
    finally:
        conn.close()

def verify_user_fingerprint(user_id, file_obj_or_path):
    conn = get_db_connection()
    if not conn:
        return {"success": False, "message": "Database connection error", "status": "error"}
        
    try:
        cursor = conn.cursor(dictionary=True)
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return {"success": False, "message": "User not found", "status": "user_not_found"}
            
        # Get registered template
        cursor.execute("SELECT template_data FROM fingerprint_templates WHERE user_id = %s", (user_id,))
        template_row = cursor.fetchone()
        if not template_row:
            return {"success": False, "message": "No fingerprint registered for this user", "status": "unregistered"}
            
        template_row = cast(dict[str, Any], template_row)
        stored_path = template_row['template_data']
        if not os.path.exists(stored_path):
            return {"success": False, "message": "Registered template file not found on server", "status": "template_missing"}
            
        # Save incoming file to a temp path
        temp_path = save_uploaded_file(file_obj_or_path, user_id, "verify")
        
        try:
            # Perform spoof check on the incoming scan
            is_spoof, spoof_reason = check_for_spoof(temp_path)
            if is_spoof:
                log_fraud_alert(user_id, spoof_reason)
                return {"success": False, "message": spoof_reason, "status": "spoof"}
                
            # Compare prints
            score, is_match = compare_fingerprints(stored_path, temp_path)
            if not is_match:
                log_fraud_alert(user_id, "Fingerprint mismatch")
                return {"success": False, "message": "Fingerprint mismatch", "status": "mismatch", "score": score}
                
            return {"success": True, "message": "Verification successful", "score": score}
        finally:
            # Clean up temp verification file
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e:
                    print(f"Error removing temporary verification file: {e}")
                    
    except Exception as e:
        print(f"Error verifying fingerprint: {e}")
        return {"success": False, "message": f"Internal error: {e}", "status": "error"}
    finally:
        conn.close()
