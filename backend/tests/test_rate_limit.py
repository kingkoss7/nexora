from uuid import uuid4

import pytest
from fastapi import HTTPException

from app import rate_limit


def test_rate_limit_rejects_requests_over_limit():
    key = f"login:{uuid4().hex}"
    rate_limit.enforce_rate_limit(key, 2, 60)
    rate_limit.enforce_rate_limit(key, 2, 60)
    with pytest.raises(HTTPException) as exc:
        rate_limit.enforce_rate_limit(key, 2, 60)
    assert exc.value.status_code == 429
    assert int(exc.value.headers["Retry-After"]) > 0
