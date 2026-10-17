import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from . import models as m, schemas as s
from .auth import hash_pw, check_pw, make_token, current_user, admin_user
from .database import get_db, SessionLocal
from .rate_limit import enforce_rate_limit

def seed():
    if os.getenv("SEED_DEMO_DATA", "false").lower() != "true":
        return

    with SessionLocal() as db:
        demo = [
            ("Laptop Pro 14", "electronics", 1299, 15, "A powerful, portable laptop for work and everyday use."),
            ("Wireless Headphones", "electronics", 199, 40, "Comfortable wireless headphones with rich sound."),
            ("Mechanical Keyboard", "electronics", 89, 60, "A responsive mechanical keyboard for work and gaming."),
            ("Running Shoes", "fashion", 120, 30, "Lightweight running shoes for everyday training."),
            ("Denim Jacket", "fashion", 75, 25, "A versatile denim jacket for everyday wear."),
            ("Coffee Maker", "home", 59, 20, "A dependable coffee maker for your home."),
            ("Desk Lamp", "home", 35, 50, "A compact adjustable lamp for your desk."),
            ("Backpack", "fashion", 49, 35, "A practical backpack for commuting and travel."),
            ("Smartwatch Active", "electronics", 2499, 24, "A smartwatch for notifications, activity tracking, and everyday use."),
            ("Luxury Watch Silver Dynamic", "accessories", 35000, 18, "A premium silver dynamic watch with a refined luxury finish and timeless style."),
            ("Android Smartphone", "electronics", 14999, 16, "An Android smartphone for communication, photos, and daily apps."),
            ("10-inch Android Tablet", "electronics", 9999, 14, "A 10-inch tablet for reading, streaming, and browsing."),
            ("Mirrorless Camera", "electronics", 42999, 8, "A compact mirrorless camera for photography and video."),
            ("Bluetooth Speaker", "electronics", 2499, 32, "A portable Bluetooth speaker for music at home or outdoors."),
            ("Wireless Earbuds", "electronics", 1299, 35, "Compact wireless earbuds for calls and music."),
            ("Portable Power Bank", "electronics", 999, 40, "A portable power bank for charging devices on the go."),
        ]
        existing = set(db.scalars(select(m.Product.name)).all())
        for name, category, price, stock, description in demo:
            if name not in existing:
                db.add(m.Product(
                    name=name,
                    category=category,
                    price=price,
                    stock=stock,
                    description=description,
                ))
        if any(name not in existing for name, *_ in demo):
            db.commit()

@asynccontextmanager
async def lifespan(_: FastAPI):
    seed()
    yield

app = FastAPI(title="Shop API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
STATUS_TRANSITIONS = {
    "placed": {"packed", "cancelled"},
    "packed": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}

def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

@app.post("/auth/register", response_model=s.RegistrationResult, status_code=201)
def register(body: s.RegisterIn, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"rate-limit:register:{_client_ip(request)}", 10, 60)
    email = str(body.email).strip().lower()
    if db.scalar(select(m.User).where(func.lower(m.User.email) == email)):
        raise HTTPException(409, "Email already registered")
    u = m.User(name=body.name, email=email, password_hash=hash_pw(body.password))
    db.add(u)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(409, "Email already registered") from error
    return s.RegistrationResult(message="Account created successfully")

@app.post("/auth/login", response_model=s.Token)
def login(body: s.Creds, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"rate-limit:login:{_client_ip(request)}", 10, 60)
    u = db.scalar(select(m.User).where(func.lower(m.User.email) == str(body.email).lower()))
    if not u or not check_pw(body.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return s.Token(access_token=make_token(u), role=u.role)

@app.get("/products", response_model=list[s.ProductOut])
def products(q: str | None = None, category: str | None = None, min_price: float | None = None,
             max_price: float | None = None, sort: str = "name", page: int = Query(1, ge=1),
             size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    stmt = select(m.Product)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(m.Product.name.ilike(like), m.Product.description.ilike(like)))
    if category: stmt = stmt.where(m.Product.category == category)
    if min_price is not None: stmt = stmt.where(m.Product.price >= min_price)
    if max_price is not None: stmt = stmt.where(m.Product.price <= max_price)
    order = {"price_asc": m.Product.price.asc(), "price_desc": m.Product.price.desc()}.get(sort, m.Product.name.asc())
    result = db.scalars(stmt.order_by(order).offset((page - 1) * size).limit(size)).all()
    return result

@app.get("/categories", response_model=list[str])
def categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(m.Product.category).distinct()))

def _active_cart(db: Session, user_uid: int, *, create: bool = False) -> m.Cart | None:
    cart = db.scalar(
        select(m.Cart)
        .where(m.Cart.user_uid == user_uid, m.Cart.status == "active")
        .options(selectinload(m.Cart.items).selectinload(m.CartItem.product))
        .order_by(m.Cart.cid.desc())
    )
    if cart is None and create:
        cart = m.Cart(user_uid=user_uid, status="active")
        db.add(cart)
        db.flush()
    return cart

@app.get("/cart", response_model=s.CartOut)
def get_cart(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    cart = _active_cart(db, user.uid)
    return {"items": [
        {"product": item.product, "quantity": item.quantity}
        for item in cart.items
    ] if cart else []}

@app.put("/cart", response_model=s.CartOut)
def replace_cart(body: s.CartReplace, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    product_pids = [item.product_pid for item in body.items]
    if len(product_pids) != len(set(product_pids)):
        raise HTTPException(422, "A product can only appear once in the cart")
    try:
        products_by_pid = {}
        for item in body.items:
            product = db.get(m.Product, item.product_pid)
            if not product:
                raise HTTPException(404, f"Product {item.product_pid} not found")
            if item.quantity > product.stock:
                raise HTTPException(409, f"Insufficient stock for {product.name}")
            products_by_pid[item.product_pid] = product
        cart = _active_cart(db, user.uid, create=bool(body.items))
        if cart is None:
            return {"items": []}
        requested = {item.product_pid: item.quantity for item in body.items}
        cart.items[:] = [item for item in cart.items if item.product_pid in requested]
        current_items = {item.product_pid: item for item in cart.items}
        for item in body.items:
            saved_item = current_items.get(item.product_pid)
            if saved_item:
                saved_item.quantity = item.quantity
            else:
                cart.items.append(m.CartItem(product=products_by_pid[item.product_pid], quantity=item.quantity))
        db.commit()
        db.refresh(cart)
        return {"items": [
            {"product": item.product, "quantity": item.quantity}
            for item in cart.items
        ]}
    except HTTPException:
        db.rollback()
        raise

@app.get("/addresses", response_model=list[s.AddressOut])
def get_addresses(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    return db.scalars(
        select(m.Address)
        .where(m.Address.user_uid == user.uid)
        .order_by(m.Address.is_default.desc(), m.Address.address_id.desc())
    ).all()

@app.post("/addresses", response_model=s.AddressOut, status_code=201)
def create_address(body: s.AddressIn, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    existing = list(db.scalars(select(m.Address).where(m.Address.user_uid == user.uid)))
    address = m.Address(user_uid=user.uid, **body.model_dump())
    if not existing:
        address.is_default = True
    if address.is_default:
        for saved in existing:
            saved.is_default = False
    db.add(address)
    db.commit()
    db.refresh(address)
    return address

@app.patch("/addresses/{address_id}/default", response_model=s.AddressOut)
def set_default_address(address_id: int, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    addresses = list(db.scalars(select(m.Address).where(m.Address.user_uid == user.uid)))
    address = next((item for item in addresses if item.address_id == address_id), None)
    if address is None:
        raise HTTPException(404, "Address not found")
    for item in addresses:
        item.is_default = item.address_id == address_id
    db.commit()
    db.refresh(address)
    return address

@app.delete("/addresses/{address_id}", status_code=204)
def delete_address(address_id: int, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    addresses = list(db.scalars(select(m.Address).where(m.Address.user_uid == user.uid)))
    address = next((item for item in addresses if item.address_id == address_id), None)
    if address is None:
        raise HTTPException(404, "Address not found")
    was_default = address.is_default
    db.delete(address)
    if was_default:
        replacement = next((item for item in addresses if item.address_id != address_id), None)
        if replacement:
            replacement.is_default = True
    db.commit()

@app.get("/products/{pid}", response_model=s.ProductOut)
def product(pid: int, db: Session = Depends(get_db)):
    p = db.get(m.Product, pid)
    if not p: raise HTTPException(404, "Not found")
    return p

@app.post("/products", response_model=s.ProductOut, status_code=201)
def create_product(body: s.ProductIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    p = m.Product(**body.model_dump()); db.add(p); db.commit(); db.refresh(p)
    return p

@app.put("/products/{pid}", response_model=s.ProductOut)
def update_product(pid: int, body: s.ProductIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    p = db.get(m.Product, pid)
    if not p: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@app.delete("/products/{pid}", status_code=204)
def delete_product(pid: int, db: Session = Depends(get_db), _=Depends(admin_user)):
    p = db.get(m.Product, pid)
    if not p: raise HTTPException(404, "Not found")
    db.delete(p); db.commit()

@app.post("/orders", response_model=s.OrderOut, status_code=201)
async def checkout(body: s.OrderIn, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    address = body.address.model_dump(exclude={"label"})
    order = m.Order(
        user_uid=user.uid,
        total=0,
        delivery_recipient_name=address["recipient_name"],
        delivery_phone=address["phone"],
        delivery_address_line1=address["address_line1"],
        delivery_address_line2=address["address_line2"],
        delivery_city=address["city"],
        delivery_region=address["region"],
        delivery_postal_code=address["postal_code"],
        delivery_country=address["country"],
    )
    try:
        product_pids = [item.product_pid for item in body.items]
        if len(product_pids) != len(set(product_pids)):
            raise HTTPException(422, "A product can only appear once in an order")
        for it in body.items:
            p = db.get(m.Product, it.product_pid)
            if not p: raise HTTPException(404, f"Product {it.product_pid} not found")
            if p.stock < it.quantity: raise HTTPException(409, f"Insufficient stock for {p.name}")
            p.stock -= it.quantity
            order.total += p.price * it.quantity
            order.items.append(m.OrderItem(
                product_pid=p.pid,
                product_name=p.name,
                quantity=it.quantity,
                price=p.price,
            ))
        if order.total < 100:
            order.total += 7.95
        db.add(order)
        db.flush()
        order.payment = m.Payment(method="cash_on_delivery", status="pending", amount=order.total)
        cart = _active_cart(db, user.uid)
        if cart:
            cart.status = "converted"
        db.commit(); db.refresh(order)
    except HTTPException:
        db.rollback(); raise
    return order

@app.get("/orders", response_model=list[s.OrderOut])
def my_orders(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    return db.scalars(select(m.Order).where(m.Order.user_uid == user.uid).order_by(m.Order.oid.desc())).all()

@app.get("/admin/orders", response_model=list[s.OrderOut])
def all_orders(db: Session = Depends(get_db), _=Depends(admin_user)):
    return db.scalars(select(m.Order).order_by(m.Order.oid.desc())).all()

@app.patch("/orders/{oid}/status", response_model=s.OrderOut)
async def set_status(oid: int, body: s.StatusIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    o = db.get(m.Order, oid)
    if not o: raise HTTPException(404, "Not found")
    allowed_statuses = STATUS_TRANSITIONS.get(o.status)
    if allowed_statuses is None:
        raise HTTPException(409, f"Order has unsupported status: {o.status}")
    if body.status != o.status and body.status not in allowed_statuses:
        raise HTTPException(409, f"Cannot change order status from {o.status} to {body.status}")
    if body.status == "cancelled" and o.status != "cancelled":
        for item in o.items:
            product = db.get(m.Product, item.product_pid)
            if product is not None:
                product.stock += item.quantity
    o.status = body.status
    if body.status == "delivered" and o.payment:
        o.payment.status = "paid"
    db.commit(); db.refresh(o)
    return o
