from db import get_db_connection

def get_wallet_balance(user_id):
    conn = get_db_connection()
    if not conn: return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT balance FROM wallets WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        if result:
            row = dict(result)  # type: ignore[arg-type]
            return row.get('balance')  # type: ignore
        return None
    finally:
        conn.close()

def topup_wallet(user_id, amount):
    conn = get_db_connection()
    if not conn: return False
    try:
        cursor = conn.cursor(dictionary=True)
        conn.start_transaction()

        # Check user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            print(f"Error topping up wallet: user_id {user_id} does not exist in users table")
            conn.rollback()
            return False
        
        # Record payment
        cursor.execute(
            "INSERT INTO payments (user_id, amount, status) VALUES (%s, %s, 'SUCCESS')",
            (user_id, amount)
        )
        
        # Upsert wallet balance (handles both new and existing wallet rows)
        cursor.execute(
            """INSERT INTO wallets (user_id, balance) 
               VALUES (%s, %s) 
               ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)""",
            (user_id, amount)
        )
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error topping up wallet: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
