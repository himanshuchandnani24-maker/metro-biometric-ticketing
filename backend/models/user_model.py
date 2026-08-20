from db import get_db_connection
import bcrypt  # type: ignore

def get_user_by_email(email):
    conn = get_db_connection()
    if not conn: return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()
    finally:
        conn.close()

def create_user(name, email, password):
    conn = get_db_connection()
    if not conn: return False
    try:
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor = conn.cursor()
        
        # We need a transaction to create a user and their wallet
        conn.start_transaction()
        
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s)",
            (name, email, password_hash)
        )
        user_id = cursor.lastrowid
        
        # Create an empty wallet for the user
        cursor.execute(
            "INSERT INTO wallets (user_id, balance) VALUES (%s, 0.00)",
            (user_id,)
        )
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error creating user: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

def verify_password(stored_hash, provided_password):
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hash.encode('utf-8'))
