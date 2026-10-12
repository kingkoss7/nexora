from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_descriptive_key_names"
down_revision: Union[str, None] = "0006_simple_commerce_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

KEY_RENAMES = {
    "users": {"id": "uid"},
    "products": {"id": "pid"},
    "carts": {"id": "cid", "user_id": "user_uid"},
    "cart_items": {"id": "cart_item_id", "cart_id": "cart_cid", "product_id": "product_pid"},
    "wishlists": {"id": "wid", "user_id": "user_uid"},
    "wishlist_items": {"id": "wishlist_item_id", "wishlist_id": "wishlist_wid", "product_id": "product_pid"},
    "addresses": {"id": "address_id", "user_id": "user_uid"},
    "orders": {"id": "oid", "user_id": "user_uid"},
    "order_items": {"id": "order_item_id", "order_id": "order_oid", "product_id": "product_pid"},
    "payments": {"id": "payment_id", "order_id": "order_oid"},
}

FOREIGN_KEYS = (
    ("carts", "fk_carts_user_uid_users", ["user_uid"], "users", ["uid"], "CASCADE"),
    ("cart_items", "fk_cart_items_cart_cid_carts", ["cart_cid"], "carts", ["cid"], "CASCADE"),
    ("cart_items", "fk_cart_items_product_pid_products", ["product_pid"], "products", ["pid"], "RESTRICT"),
    ("wishlists", "fk_wishlists_user_uid_users", ["user_uid"], "users", ["uid"], "CASCADE"),
    ("wishlist_items", "fk_wishlist_items_wishlist_wid_wishlists", ["wishlist_wid"], "wishlists", ["wid"], "CASCADE"),
    ("wishlist_items", "fk_wishlist_items_product_pid_products", ["product_pid"], "products", ["pid"], "CASCADE"),
    ("addresses", "fk_addresses_user_uid_users", ["user_uid"], "users", ["uid"], "CASCADE"),
    ("orders", "fk_orders_user_uid_users", ["user_uid"], "users", ["uid"], None),
    ("order_items", "fk_order_items_order_oid_orders", ["order_oid"], "orders", ["oid"], None),
    ("order_items", "fk_order_items_product_pid_products", ["product_pid"], "products", ["pid"], None),
    ("payments", "fk_payments_order_oid_orders", ["order_oid"], "orders", ["oid"], "CASCADE"),
)

UNIQUE_CONSTRAINTS = (
    ("cart_items", "uq_cart_items_cart_cid_product_pid", ["cart_cid", "product_pid"]),
    ("wishlists", "uq_wishlists_user_uid_name", ["user_uid", "name"]),
    ("wishlist_items", "uq_wishlist_items_wishlist_wid_product_pid", ["wishlist_wid", "product_pid"]),
    ("payments", "uq_payments_order_oid", ["order_oid"]),
)

INDEXES = (
    ("carts", "user_uid"),
    ("wishlists", "user_uid"),
    ("addresses", "user_uid"),
    ("orders", "user_uid"),
)


def _drop_foreign_keys() -> None:
    inspector = sa.inspect(op.get_bind())
    for table in KEY_RENAMES:
        for constraint in inspector.get_foreign_keys(table):
            if constraint["name"]:
                op.drop_constraint(constraint["name"], table, type_="foreignkey")


def _drop_unique_constraints(renames: dict[str, dict[str, str]]) -> None:
    inspector = sa.inspect(op.get_bind())
    for table in KEY_RENAMES:
        for constraint in inspector.get_unique_constraints(table):
            columns = set(constraint.get("column_names") or ())
            if constraint["name"] and columns.intersection(renames[table]):
                op.drop_constraint(constraint["name"], table, type_="unique")


def _drop_key_indexes(renames: dict[str, dict[str, str]]) -> None:
    inspector = sa.inspect(op.get_bind())
    for table, columns in renames.items():
        old_columns = set(columns)
        for index in inspector.get_indexes(table):
            if (
                index["name"]
                and not index.get("duplicates_constraint")
                and old_columns.intersection(index.get("column_names") or ())
            ):
                op.drop_index(index["name"], table_name=table)


def _rename_columns(renames: dict[str, dict[str, str]]) -> None:
    for table, columns in renames.items():
        for old_name, new_name in columns.items():
            op.alter_column(table, old_name, new_column_name=new_name)


def _create_key_constraints(
    foreign_keys: tuple[tuple[str, str, list[str], str, list[str], str | None], ...],
    unique_constraints: tuple[tuple[str, str, list[str]], ...],
) -> None:
    for table, name, local_columns, remote_table, remote_columns, ondelete in foreign_keys:
        op.create_foreign_key(
            name,
            table,
            remote_table,
            local_columns,
            remote_columns,
            ondelete=ondelete,
        )
    for table, name, columns in unique_constraints:
        op.create_unique_constraint(name, table, columns)


def _create_indexes(column_name: str) -> None:
    for table, column in INDEXES:
        op.create_index(f"ix_{table}_{column_name}", table, [column])


def upgrade() -> None:
    _drop_foreign_keys()
    _drop_unique_constraints(KEY_RENAMES)
    _drop_key_indexes(KEY_RENAMES)
    _rename_columns(KEY_RENAMES)
    _create_key_constraints(FOREIGN_KEYS, UNIQUE_CONSTRAINTS)
    _create_indexes("user_uid")


def downgrade() -> None:
    _drop_foreign_keys()
    reverse_renames = {
        table: {new_name: old_name for old_name, new_name in columns.items()}
        for table, columns in KEY_RENAMES.items()
    }
    _drop_unique_constraints(reverse_renames)
    _drop_key_indexes(reverse_renames)
    _rename_columns(reverse_renames)

    old_foreign_keys = (
        ("carts", "fk_carts_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
        ("cart_items", "fk_cart_items_cart_id_carts", ["cart_id"], "carts", ["id"], "CASCADE"),
        ("cart_items", "fk_cart_items_product_id_products", ["product_id"], "products", ["id"], "RESTRICT"),
        ("wishlists", "fk_wishlists_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
        ("wishlist_items", "fk_wishlist_items_wishlist_id_wishlists", ["wishlist_id"], "wishlists", ["id"], "CASCADE"),
        ("wishlist_items", "fk_wishlist_items_product_id_products", ["product_id"], "products", ["id"], "CASCADE"),
        ("addresses", "fk_addresses_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
        ("orders", "fk_orders_user_id_users", ["user_id"], "users", ["id"], None),
        ("order_items", "fk_order_items_order_id_orders", ["order_id"], "orders", ["id"], None),
        ("order_items", "fk_order_items_product_id_products", ["product_id"], "products", ["id"], None),
        ("payments", "fk_payments_order_id_orders", ["order_id"], "orders", ["id"], "CASCADE"),
    )
    old_unique_constraints = (
        ("cart_items", "uq_cart_items_cart_product", ["cart_id", "product_id"]),
        ("wishlists", "uq_wishlists_user_name", ["user_id", "name"]),
        ("wishlist_items", "uq_wishlist_items_wishlist_product", ["wishlist_id", "product_id"]),
        ("payments", "uq_payments_order_id", ["order_id"]),
    )
    _create_key_constraints(old_foreign_keys, old_unique_constraints)
    _create_indexes("user_id")
