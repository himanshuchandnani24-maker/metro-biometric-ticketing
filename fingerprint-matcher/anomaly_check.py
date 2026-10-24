"""Anomaly detection for metro travel patterns.

Provides ``check_impossible_travel`` which flags trips that would require
unrealistically fast travel between stations.
"""
from datetime import datetime


# Travel times in minutes between Ahmedabad & Gandhinagar metro stations:
# S1: APMC, S2: Old High Court, S3: Kalupur, S4: Motera Stadium, S5: GNLU, S6: Infocity
STATION_TRAVEL_TIMES = {
    ("S1", "S2"): 10,
    ("S1", "S3"): 15,
    ("S1", "S4"): 22,
    ("S1", "S5"): 35,
    ("S1", "S6"): 45,
    ("S2", "S3"): 8,
    ("S2", "S4"): 14,
    ("S2", "S5"): 27,
    ("S2", "S6"): 38,
    ("S3", "S4"): 15,
    ("S3", "S5"): 28,
    ("S3", "S6"): 40,
    ("S4", "S5"): 16,
    ("S4", "S6"): 25,
    ("S5", "S6"): 10,
}


def _normalize_station_key(st) -> str:
    s = str(st).strip()
    return f"S{s}" if s.isdigit() else s


def _get_min_travel_time(station_a, station_b) -> int:
    """Return the minimum travel time (minutes) between two stations.

    The lookup is symmetric — ``(A, B)`` and ``(B, A)`` give the same result.
    If the pair is not in the table, a generous default of 3 minutes is used.
    """
    sa = _normalize_station_key(station_a)
    sb = _normalize_station_key(station_b)
    if sa == sb:
        return 0
    key = tuple(sorted([sa, sb]))
    return STATION_TRAVEL_TIMES.get(key, 3)


def check_impossible_travel(
    user_id: str,
    new_station_id: str,
    new_timestamp: datetime,
    last_trip: dict | None,
):
    """Check whether a user's new trip is physically plausible.

    Args:
        user_id: Identifier for the user (for logging purposes).
        new_station_id: Station ID where the new trip is starting.
        new_timestamp: ``datetime`` when the new trip starts.
        last_trip: A dict with keys ``"station_id"`` (str) and
            ``"timestamp"`` (``datetime``) representing the user's most
            recent trip.  Pass ``None`` if there is no previous trip.

    Returns:
        tuple: ``(is_anomaly: bool, reason: str)``
    """
    if last_trip is None:
        return False, "No previous trip on record — nothing to compare."

    last_station = last_trip["station_id"]
    last_time = last_trip["timestamp"]

    if new_timestamp < last_time:
        return True, (
            f"New timestamp ({new_timestamp}) is earlier than the last trip "
            f"({last_time}) — possible clock tampering."
        )

    elapsed_minutes = (new_timestamp - last_time).total_seconds() / 60.0
    min_required = _get_min_travel_time(last_station, new_station_id)

    if elapsed_minutes < min_required:
        return True, (
            f"Impossible travel: user {user_id} went from {last_station} to "
            f"{new_station_id} in {elapsed_minutes:.1f} min, but minimum is "
            f"{min_required} min."
        )

    return False, (
        f"Travel from {last_station} to {new_station_id} in "
        f"{elapsed_minutes:.1f} min is plausible (min {min_required} min)."
    )
