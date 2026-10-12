from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_simple_commerce_schema"
down_revision: Union[str, None] = "0005_cache_rate_limits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("orders", "status", server_default="placed")
    op.add_column("orders", sa.Column("delivery_recipient_name", sa.String(length=150), nullable=True))
    op.add_column("orders", sa.Column("delivery_phone", sa.String(length=40), nullable=True))
    op.add_column("orders", sa.Column("delivery_address_line1", sa.String(length=200), nullable=True))
    op.add_column("orders", sa.Column("delivery_address_line2", sa.String(length=200), nullable=True))
    op.add_column("orders", sa.Column("delivery_city", sa.String(length=100), nullable=True))
    op.add_column("orders", sa.Column("delivery_region", sa.String(length=100), nullable=True))
    op.add_column("orders", sa.Column("delivery_postal_code", sa.String(length=30), nullable=True))
    op.add_column("orders", sa.Column("delivery_country", sa.String(length=2), nullable=True))
    op.execute(
        """
        UPDATE orders AS o
        SET delivery_recipient_name = a.recipient_name,
            delivery_phone = a.phone,
            delivery_address_line1 = a.address_line1,
            delivery_address_line2 = a.address_line2,
            delivery_city = a.city,
            delivery_region = a.region,
            delivery_postal_code = a.postal_code,
            delivery_country = a.country
        FROM order_addresses AS a
        WHERE a.order_id = o.id
        """
    )
    op.execute("UPDATE orders SET status = 'placed' WHERE status = 'processing'")
    op.create_check_constraint(
        "ck_orders_status",
        "orders",
        "status IN ('placed', 'packed', 'shipped', 'delivered', 'cancelled')",
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("method", sa.String(length=30), server_default="cash_on_delivery", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("method = 'cash_on_delivery'", name="ck_payments_method"),
        sa.CheckConstraint("status IN ('pending', 'paid')", name="ck_payments_status"),
        sa.CheckConstraint("amount >= 0", name="ck_payments_amount_nonnegative"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_payments_order_id"),
    )
    op.execute(
        """
        INSERT INTO payments (order_id, amount, status)
        SELECT id, total, CASE WHEN status = 'delivered' THEN 'paid' ELSE 'pending' END
        FROM orders
        """
    )
    op.drop_table("order_addresses")
    op.drop_index("ix_json_cache_expires_at", table_name="json_cache")
    op.drop_table("json_cache")
    op.drop_index("ix_rate_limits_window_started_at", table_name="rate_limits")
    op.drop_table("rate_limits")
    for table in ("carts", "wishlists", "addresses"):
        index_name = f"ix_{table}_user_id"
        indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
        if index_name not in indexes:
            op.create_index(index_name, table, ["user_id"])


def downgrade() -> None:
    for table in ("carts", "wishlists", "addresses"):
        index_name = f"ix_{table}_user_id"
        indexes = {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table)}
        if index_name in indexes:
            op.drop_index(index_name, table_name=table)
    op.create_table(
        "order_addresses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("recipient_name", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=False),
        sa.Column("address_line1", sa.String(length=200), nullable=False),
        sa.Column("address_line2", sa.String(length=200), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("region", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=30), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id", name="uq_order_addresses_order_id"),
    )
    op.execute(
        """
        INSERT INTO order_addresses (
            order_id, recipient_name, phone, address_line1, address_line2,
            city, region, postal_code, country
        )
        SELECT id, delivery_recipient_name, delivery_phone, delivery_address_line1,
               delivery_address_line2, delivery_city, delivery_region,
               delivery_postal_code, delivery_country
        FROM orders
        WHERE delivery_recipient_name IS NOT NULL
        """
    )
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
    op.drop_constraint("ck_orders_status", "orders", type_="check")
    op.execute("UPDATE orders SET status = 'processing' WHERE status = 'placed'")
    op.alter_column("orders", "status", server_default=None)
    op.drop_table("payments")
    op.drop_column("orders", "delivery_country")
    op.drop_column("orders", "delivery_postal_code")
    op.drop_column("orders", "delivery_region")
    op.drop_column("orders", "delivery_city")
    op.drop_column("orders", "delivery_address_line2")
    op.drop_column("orders", "delivery_address_line1")
    op.drop_column("orders", "delivery_phone")
    op.drop_column("orders", "delivery_recipient_name")
