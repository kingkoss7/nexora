from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_remove_wishlists"
down_revision: Union[str, None] = "0007_descriptive_key_names"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("wishlist_items")
    op.drop_table("wishlists")


def downgrade() -> None:
    op.create_table(
        "wishlists",
        sa.Column("wid", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_uid", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), server_default="Favorites", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_uid"], ["users.uid"], name="fk_wishlists_user_uid_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("wid"),
        sa.UniqueConstraint("user_uid", "name", name="uq_wishlists_user_uid_name"),
    )
    op.create_index("ix_wishlists_user_uid", "wishlists", ["user_uid"])
    op.create_table(
        "wishlist_items",
        sa.Column("wishlist_item_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("wishlist_wid", sa.Integer(), nullable=False),
        sa.Column("product_pid", sa.Integer(), nullable=False),
        sa.Column("added_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["wishlist_wid"], ["wishlists.wid"],
            name="fk_wishlist_items_wishlist_wid_wishlists", ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["product_pid"], ["products.pid"],
            name="fk_wishlist_items_product_pid_products", ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("wishlist_item_id"),
        sa.UniqueConstraint(
            "wishlist_wid", "product_pid", name="uq_wishlist_items_wishlist_wid_product_pid"
        ),
    )
