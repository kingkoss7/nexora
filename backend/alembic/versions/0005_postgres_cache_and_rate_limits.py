from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_cache_rate_limits"
down_revision: Union[str, None] = "0004_user_name"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "json_cache",
        sa.Column("cache_key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("cache_key"),
    )
    op.create_index("ix_json_cache_expires_at", "json_cache", ["expires_at"])
    op.create_table(
        "rate_limits",
        sa.Column("key_hash", sa.String(length=64), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("key_hash"),
    )
    op.create_index("ix_rate_limits_window_started_at", "rate_limits", ["window_started_at"])


def downgrade() -> None:
    op.drop_index("ix_rate_limits_window_started_at", table_name="rate_limits")
    op.drop_table("rate_limits")
    op.drop_index("ix_json_cache_expires_at", table_name="json_cache")
    op.drop_table("json_cache")
