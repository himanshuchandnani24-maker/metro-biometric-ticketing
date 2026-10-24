from db import get_db_connection
from models.fare_model import get_max_fare, get_fare_amount
from models.wallet_model import get_wallet_balance

def enter_station(user_id, entry_station_id):
    conn = get_db_connection()
    if not conn: return {"success": False, "message": "Database connection error"}
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Check if already in progress
        cursor.execute("SELECT id FROM trips WHERE user_id = %s AND status = 'IN_PROGRESS'", (user_id,))
        if cursor.fetchone():
            return {"success": False, "message": "User already has an active trip"}
            
        # Check wallet balance
        balance = get_wallet_balance(user_id)
        max_fare = get_max_fare()
        
        if balance is None or float(balance) < float(max_fare):
            # Log fraud alert or failed trip attempt
            cursor.execute(
                "INSERT INTO fraud_alerts (user_id, reason) VALUES (%s, %s)",
                (user_id, "Insufficient balance at entry")
            )
            conn.commit()
            return {"success": False, "message": f"Insufficient balance. Minimum required is {max_fare}"}
            
        # Create trip
        cursor.execute(
            "INSERT INTO trips (user_id, entry_station_id, status) VALUES (%s, %s, 'IN_PROGRESS')",
            (user_id, entry_station_id)
        )
        conn.commit()
        return {"success": True, "message": "Entry successful"}
        
    except Exception as e:
        print(f"Error at entry: {e}")
        conn.rollback()
        return {"success": False, "message": f"Error during entry: {e}"}
    finally:
        conn.close()

def exit_station(user_id, exit_station_id):
    conn = get_db_connection()
    if not conn: return {"success": False, "message": "Database connection error"}
    
    try:
        cursor = conn.cursor(dictionary=True)
        conn.start_transaction()
        
        # Get active trip
        cursor.execute(
            "SELECT id, entry_station_id FROM trips WHERE user_id = %s AND status = 'IN_PROGRESS'",
            (user_id,)
        )
        trip = cursor.fetchone()
        
        if not trip:
            cursor.execute(
                "INSERT INTO fraud_alerts (user_id, reason) VALUES (%s, %s)",
                (user_id, "Attempted exit without active trip")
            )
            conn.commit()
            return {"success": False, "message": "No active trip found"}
            
        entry_station_id = trip['entry_station_id']
        trip_id = trip['id']
        
        # Calculate fare
        fare_amount = get_fare_amount(entry_station_id, exit_station_id)
        if fare_amount is None:
            if entry_station_id == exit_station_id:
                fare_amount = 5.00  # Default minimum fee for same-station entry & exit
            else:
                fare_amount = 10.00  # Fallback base fare if station pair not explicitly mapped
            
        # Check wallet
        balance = get_wallet_balance(user_id)
        if balance is None or float(balance) < float(fare_amount):
            curr_bal = float(balance) if balance is not None else 0.0
            amount_needed = float(fare_amount) - curr_bal
            cursor.execute(
                "INSERT INTO fraud_alerts (user_id, trip_id, reason) VALUES (%s, %s, %s)",
                (user_id, trip_id, "Insufficient balance at exit - gate payment required")
            )
            conn.commit()
            return {
                "success": False,
                "insufficient_balance": True,
                "amount_needed": amount_needed,
                "fare_amount": float(fare_amount),
                "current_balance": curr_bal,
                "message": f"Insufficient balance. Journey fare is ₹{float(fare_amount):.2f}, but current balance is ₹{curr_bal:.2f}. Please pay ₹{amount_needed:.2f} at gate to exit."
            }
            
        # Deduct fare and complete trip
        cursor.execute(
            "UPDATE wallets SET balance = balance - %s WHERE user_id = %s",
            (fare_amount, user_id)
        )
        cursor.execute(
            "UPDATE trips SET status = 'COMPLETED', exit_station_id = %s, exit_time = NOW(), fare_charged = %s WHERE id = %s",
            (exit_station_id, fare_amount, trip_id)
        )
        
        conn.commit()
        return {"success": True, "message": "Exit successful", "fare_charged": fare_amount}
        
    except Exception as e:
        print(f"Error at exit: {e}")
        conn.rollback()
        return {"success": False, "message": f"Error during exit: {e}"}
    finally:
        conn.close()

def get_trip_history(user_id):
    conn = get_db_connection()
    if not conn: return []
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM trips WHERE user_id = %s ORDER BY entry_time DESC",
            (user_id,)
        )
        return cursor.fetchall()
    finally:
        conn.close()
