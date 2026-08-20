from db import get_db_connection

def get_payments(user_id):
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM payments WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        return cursor.fetchall()
    finally:
        conn.close()
