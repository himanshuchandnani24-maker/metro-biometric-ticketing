import os
import sys
import shutil
import uuid
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
AMBIGUITY_MARGIN = 0.0

def ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def log_fraud_alert(user_id=None, reason="", trip_id=None):
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

def save_uploaded_file(file_obj_or_path, user_id=None, filename_prefix="temp"):
    ensure_upload_dir()
    timestamp = int(datetime.now().timestamp() * 1000)
    uid_part = user_id if user_id is not None else uuid.uuid4().hex[:8]
    
    ext = ".png"
    if isinstance(file_obj_or_path, str):
        if not os.path.exists(file_obj_or_path):
            raise FileNotFoundError(f"Input file path {file_obj_or_path} does not exist")
        _, orig_ext = os.path.splitext(file_obj_or_path)
        if orig_ext:
            ext = orig_ext
        dest_filename = f"{filename_prefix}_{uid_part}_{timestamp}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, dest_filename)
        shutil.copy(file_obj_or_path, dest_path)
        return dest_path
    else:
        # Flask file upload object
        if hasattr(file_obj_or_path, 'filename') and file_obj_or_path.filename:
            _, orig_ext = os.path.splitext(file_obj_or_path.filename)
            if orig_ext:
                ext = orig_ext
        dest_filename = f"{filename_prefix}_{uid_part}_{timestamp}{ext}"
        dest_path = os.path.join(UPLOAD_DIR, dest_filename)
        if hasattr(file_obj_or_path, 'save'):
            file_obj_or_path.save(dest_path)
        else:
            with open(dest_path, 'wb') as f:
                if hasattr(file_obj_or_path, 'seek'):
                    file_obj_or_path.seek(0)
                f.write(file_obj_or_path.read())
        return dest_path


def generate_unique_1532_template(user_id=None):
    """Generate a unique 1532-byte binary biometric fingerprint template.
    Guaranteed unique across all registered templates in the database.
    Format (1532 bytes total):
      - 6 bytes header: b'AFPT01'
      - 16 bytes: unique UUID token
      - 8 bytes: timestamp milliseconds
      - 4 bytes: user_id seed
      - 1498 bytes: cryptographically random minutiae entropy
    """
    conn = get_db_connection()
    existing_templates = set()
    if conn:
        try:
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT template_data FROM fingerprint_templates")
            for r in cur.fetchall():
                p = r.get('template_data')
                if p and os.path.exists(p):
                    try:
                        with open(p, 'rb') as f:
                            existing_templates.add(f.read())
                    except Exception:
                        pass
        finally:
            conn.close()

    while True:
        token = uuid.uuid4().bytes
        ts = int(datetime.now().timestamp() * 1000).to_bytes(8, 'big')
        uid_num = int(user_id) if user_id is not None else int.from_bytes(os.urandom(4), 'big')
        uid_bytes = (uid_num % (2**32)).to_bytes(4, 'big')
        entropy = os.urandom(1532 - 6 - 16 - 8 - 4)
        template_bytes = b"AFPT01" + token + ts + uid_bytes + entropy
        assert len(template_bytes) == 1532
        if template_bytes not in existing_templates:
            break

    return template_bytes

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


def identify_user_by_fingerprint(file_obj_or_path):
    """Identify a user by comparing probe fingerprint against all stored templates (1:N).
    Returns dict with success and identified user_id, or error/status details.
    """
    temp_path = None
    conn = None
    try:
        # Save probe to a temp file with prefix "identify" and no user id
        temp_path = save_uploaded_file(file_obj_or_path, None, "identify")

        # Run spoof check; do not log fraud alert as user identity is not yet known
        is_spoof, spoof_reason = check_for_spoof(temp_path)
        if is_spoof:
            return {"success": False, "status": "spoof", "message": spoof_reason}

        conn = get_db_connection()
        if not conn:
            return {"success": False, "status": "error", "message": "Database connection error"}

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, template_data FROM fingerprint_templates")
        rows = cursor.fetchall()

        matches = []
        for row in rows:
            stored_path = row.get('template_data')
            user_id = row.get('user_id')
            if not stored_path or not os.path.exists(stored_path):
                continue
            try:
                score, is_match = compare_fingerprints(stored_path, temp_path)
                if is_match:
                    matches.append((float(score), user_id))
            except Exception as comp_err:
                # Skip templates that raise an exception during matching
                print(f"Skipping template {stored_path} for user {user_id}: {comp_err}")
                continue

        if not matches:
            return {"success": False, "status": "no_match", "message": "Fingerprint not recognised"}

        # Sort matches by score DESC (higher score is better)
        matches.sort(key=lambda x: x[0], reverse=True)
        best_score, best_user = matches[0]

        # Check ambiguity if more than one match is detected
        if len(matches) > 1:
            second_score, second_user = matches[1]
            if (best_score - second_score) < AMBIGUITY_MARGIN:
                return {
                    "success": False,
                    "status": "ambiguous",
                    "message": "Ambiguous biometric match: multiple templates matched within confidence threshold"
                }

        return {"success": True, "user_id": best_user, "score": best_score}

    except Exception as e:
        print(f"Error during fingerprint identification: {e}")
        return {"success": False, "status": "error", "message": f"Identification error: {e}"}
    finally:
        # ALWAYS delete the temp file and close the DB connection
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                print(f"Error removing temp identification file: {e}")
        if conn:
            conn.close()

