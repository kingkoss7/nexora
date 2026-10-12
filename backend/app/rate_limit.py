from datetime import datetime, timedelta, timezone
from math import ceil
from threading import Lock

from fastapi import HTTPException

_windows: dict[str, tuple[datetime, int]] = {}
_lock = Lock()


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=window_seconds)
    with _lock:
        expired = [item for item, (started, _) in _windows.items() if started <= cutoff]
        for item in expired:
            del _windows[item]

        started, count = _windows.get(key, (now, 0))
        if started <= cutoff:
            started, count = now, 0
        count += 1
        _windows[key] = (started, count)

    if count > limit:
        retry_after = max(1, ceil((started + timedelta(seconds=window_seconds) - now).total_seconds()))
        raise HTTPException(
            429,
            "Too many requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
