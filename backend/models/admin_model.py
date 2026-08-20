from db import get_db_connection

def get_all_trips():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM trips ORDER BY entry_time DESC")
        return cursor.fetchall()
    finally:
        conn.close()

def get_total_revenue():
    conn = get_db_connection()
    if not conn: return 0.00
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT SUM(fare_charged) as total FROM trips WHERE status = 'COMPLETED'")
        result = cursor.fetchone()
        return float(result['total']) if result and result['total'] else 0.00
    finally:
        conn.close()

def get_all_alerts():
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM fraud_alerts ORDER BY created_at DESC")
        return cursor.fetchall()
    finally:
        conn.close()
