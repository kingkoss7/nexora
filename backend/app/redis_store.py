import json
import logging
import os
from typing import Any

import redis
from fastapi import HTTPException
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)
_client: redis.Redis | None = None

_INCREMENT_WITH_EXPIRY = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
"""


def _get_client() -> redis.Redis | None:
    global _client
    url = os.getenv("REDIS_URL")
    if not url:
        return None
    if _client is None:
        _client = redis.Redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _client


def get_cached_json(key: str) -> Any | None:
    client = _get_client()
    if client is None:
        return None
    try:
        value = client.get(key)
    except RedisError:
        logger.warning("Redis cache read failed for key %s", key, exc_info=True)
        return None
    if value is None:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        logger.warning("Discarding invalid JSON in Redis cache key %s", key)
        try:
            client.delete(key)
        except RedisError:
            logger.warning("Could not remove invalid Redis cache key %s", key, exc_info=True)
        return None


def set_cached_json(key: str, value: Any, ttl_seconds: int = 60) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        client.setex(key, ttl_seconds, json.dumps(value))
    except RedisError:
        logger.warning("Redis cache write failed for key %s", key, exc_info=True)


def delete_cache_prefix(prefix: str) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        for key in client.scan_iter(match=f"{prefix}*"):
            client.delete(key)
    except RedisError:
        logger.warning("Redis cache invalidation failed for prefix %s", prefix, exc_info=True)


def enforce_rate_limit(key: str, limit: int, window_seconds: int) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        count = client.eval(_INCREMENT_WITH_EXPIRY, 1, key, window_seconds)
    except RedisError as exc:
        logger.error("Redis rate limiter is unavailable", exc_info=True)
        raise HTTPException(503, "Rate limiting is temporarily unavailable") from exc
    if int(count) > limit:
        raise HTTPException(
            429,
            "Too many requests. Please try again later.",
            headers={"Retry-After": str(window_seconds)},
        )
