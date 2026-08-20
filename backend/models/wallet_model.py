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
        cursor = conn.cursor()
        conn.start_transaction()
        
        # Record payment
        cursor.execute(
            "INSERT INTO payments (user_id, amount, status) VALUES (%s, %s, 'SUCCESS')",
            (user_id, amount)
        )
        
        # Update wallet balance
        cursor.execute(
            "UPDATE wallets SET balance = balance + %s WHERE user_id = %s",
            (amount, user_id)
        )
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error topping up wallet: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
