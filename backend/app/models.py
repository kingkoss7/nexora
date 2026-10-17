from datetime import datetime, timezone
from sqlalchemy import ForeignKey, String, Float, Integer, DateTime, CheckConstraint, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"
    uid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), default="", server_default="")
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="customer")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
        CheckConstraint("stock >= 0", name="ck_products_stock_nonnegative"),
    )
    pid: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[str] = mapped_column(String(2000), default="")
    category: Mapped[str] = mapped_column(String(100), index=True, default="general")
    price: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(Integer, default=0)

class Cart(Base):
    __tablename__ = "carts"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'converted', 'abandoned')", name="ck_carts_status"),
    )
    cid: Mapped[int] = mapped_column(primary_key=True)
    user_uid: Mapped[int] = mapped_column(ForeignKey("users.uid", name="fk_carts_user_uid_users", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active", server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    items: Mapped[list["CartItem"]] = relationship(cascade="all, delete-orphan", lazy="selectin")

class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_cid", "product_pid", name="uq_cart_items_cart_cid_product_pid"),
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity_positive"),
    )
    cart_item_id: Mapped[int] = mapped_column(primary_key=True)
    cart_cid: Mapped[int] = mapped_column(ForeignKey("carts.cid", name="fk_cart_items_cart_cid_carts", ondelete="CASCADE"))
    product_pid: Mapped[int] = mapped_column(ForeignKey("products.pid", name="fk_cart_items_product_pid_products", ondelete="RESTRICT"))
    quantity: Mapped[int] = mapped_column(Integer)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    product: Mapped[Product] = relationship()

class Address(Base):
    __tablename__ = "addresses"
    address_id: Mapped[int] = mapped_column(primary_key=True)
    user_uid: Mapped[int] = mapped_column(ForeignKey("users.uid", name="fk_addresses_user_uid_users", ondelete="CASCADE"), index=True)
    label: Mapped[str | None] = mapped_column(String(50))
    recipient_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str] = mapped_column(String(40))
    address_line1: Mapped[str] = mapped_column(String(200))
    address_line2: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(100))
    region: Mapped[str | None] = mapped_column(String(100))
    postal_code: Mapped[str] = mapped_column(String(30))
    country: Mapped[str] = mapped_column(String(2))
    is_default: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('placed', 'packed', 'shipped', 'delivered', 'cancelled')",
            name="ck_orders_status",
        ),
    )
    oid: Mapped[int] = mapped_column(primary_key=True)
    user_uid: Mapped[int] = mapped_column(ForeignKey("users.uid", name="fk_orders_user_uid_users"), index=True)
    total: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="placed", server_default="placed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    delivery_recipient_name: Mapped[str | None] = mapped_column(String(150))
    delivery_phone: Mapped[str | None] = mapped_column(String(40))
    delivery_address_line1: Mapped[str | None] = mapped_column(String(200))
    delivery_address_line2: Mapped[str | None] = mapped_column(String(200))
    delivery_city: Mapped[str | None] = mapped_column(String(100))
    delivery_region: Mapped[str | None] = mapped_column(String(100))
    delivery_postal_code: Mapped[str | None] = mapped_column(String(30))
    delivery_country: Mapped[str | None] = mapped_column(String(2))
    items: Mapped[list["OrderItem"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    payment: Mapped["Payment | None"] = relationship(
        back_populates="order", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id: Mapped[int] = mapped_column(primary_key=True)
    order_oid: Mapped[int] = mapped_column(ForeignKey("orders.oid", name="fk_order_items_order_oid_orders"))
    product_pid: Mapped[int] = mapped_column(ForeignKey("products.pid", name="fk_order_items_product_pid_products"))
    product_name: Mapped[str] = mapped_column(String(200))
    quantity: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Float)

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("order_oid", name="uq_payments_order_oid"),
        CheckConstraint("method = 'cash_on_delivery'", name="ck_payments_method"),
        CheckConstraint("status IN ('pending', 'paid')", name="ck_payments_status"),
        CheckConstraint("amount >= 0", name="ck_payments_amount_nonnegative"),
    )
    payment_id: Mapped[int] = mapped_column(primary_key=True)
    order_oid: Mapped[int] = mapped_column(ForeignKey("orders.oid", name="fk_payments_order_oid_orders", ondelete="CASCADE"))
    method: Mapped[str] = mapped_column(String(30), default="cash_on_delivery", server_default="cash_on_delivery")
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    amount: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    order: Mapped[Order] = relationship(back_populates="payment")
