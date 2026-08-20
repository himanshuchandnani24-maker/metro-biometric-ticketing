from typing import Any, cast

from db import get_db_connection

def get_max_fare():
    conn = get_db_connection()
    if not conn: return 0.00
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT MAX(amount) as max_fare FROM fares")
        result = cast(dict[str, Any] | None, cursor.fetchone())
        return float(result['max_fare']) if result and result['max_fare'] is not None else 0.00
    finally:
        conn.close()

def get_fare_amount(entry_station_id, exit_station_id):
    conn = get_db_connection()
    if not conn: return None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT amount FROM fares WHERE entry_station_id = %s AND exit_station_id = %s",
            (entry_station_id, exit_station_id)
        )
        result = cast(dict[str, Any] | None, cursor.fetchone())
        return float(result['amount']) if result else None
    finally:
        conn.close()
