from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_user_name"
down_revision: Union[str, None] = "0003_customer_commerce_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("name", sa.String(length=150), server_default="", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "name")
