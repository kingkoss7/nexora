import pytest
from fastapi import HTTPException
from redis.exceptions import RedisError

from app import redis_store


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.counts = {}

    def get(self, key):
        return self.values.get(key)

    def setex(self, key, _ttl, value):
        self.values[key] = value

    def delete(self, key):
        self.values.pop(key, None)

    def scan_iter(self, match):
        prefix = match.removesuffix("*")
        return iter([key for key in self.values if key.startswith(prefix)])

    def eval(self, _script, _key_count, key, _window):
        self.counts[key] = self.counts.get(key, 0) + 1
        return self.counts[key]


def test_json_cache_round_trip_and_prefix_invalidation(monkeypatch):
    client = FakeRedis()
    monkeypatch.setattr(redis_store, "_client", client)
    monkeypatch.setenv("REDIS_URL", "redis://localhost")

    redis_store.set_cached_json("products:page-1", [{"id": 1}])
    redis_store.set_cached_json("session:user-1", {"active": True})

    assert redis_store.get_cached_json("products:page-1") == [{"id": 1}]
    redis_store.delete_cache_prefix("products:")
    assert redis_store.get_cached_json("products:page-1") is None
    assert redis_store.get_cached_json("session:user-1") == {"active": True}


def test_rate_limit_rejects_requests_over_limit(monkeypatch):
    monkeypatch.setattr(redis_store, "_client", FakeRedis())
    monkeypatch.setenv("REDIS_URL", "redis://localhost")

    redis_store.enforce_rate_limit("login:127.0.0.1", 2, 60)
    redis_store.enforce_rate_limit("login:127.0.0.1", 2, 60)
    with pytest.raises(HTTPException) as exc:
        redis_store.enforce_rate_limit("login:127.0.0.1", 2, 60)
    assert exc.value.status_code == 429


def test_rate_limit_fails_closed_when_redis_is_unavailable(monkeypatch):
    class UnavailableRedis:
        def eval(self, *_args):
            raise RedisError("unavailable")

    monkeypatch.setattr(redis_store, "_client", UnavailableRedis())
    monkeypatch.setenv("REDIS_URL", "redis://localhost")

    with pytest.raises(HTTPException) as exc:
        redis_store.enforce_rate_limit("login:127.0.0.1", 2, 60)
    assert exc.value.status_code == 503
