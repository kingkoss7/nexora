"""Add checkout idempotency keys.

Revision ID: 0008_order_idempotency
Revises: 0007_descriptive_key_names
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_order_idempotency"
down_revision: Union[str, None] = "0007_descriptive_key_names"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("idempotency_key", sa.String(length=100), nullable=True))
    op.create_unique_constraint(
        "uq_orders_user_idempotency_key",
        "orders",
        ["user_uid", "idempotency_key"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_orders_user_idempotency_key", "orders", type_="unique")
    op.drop_column("orders", "idempotency_key")
