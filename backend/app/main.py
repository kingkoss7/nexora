import hashlib
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload
from . import models as m, schemas as s
from .auth import hash_pw, check_pw, make_token, current_user, admin_user, user_id_from_token
from .database import get_db, SessionLocal
from .redis_store import delete_cache_prefix, enforce_rate_limit, get_cached_json, set_cached_json
from .websockets import order_connections

def seed():
    if os.getenv("SEED_DEMO_DATA", "false").lower() != "true":
        return

    with SessionLocal() as db:
        if db.scalar(select(func.count(m.Product.id))):
            return
        demo = [("Laptop Pro 14", "electronics", 1299, 15), ("Wireless Headphones", "electronics", 199, 40),
                ("Mechanical Keyboard", "electronics", 89, 60), ("Running Shoes", "fashion", 120, 30),
                ("Denim Jacket", "fashion", 75, 25), ("Coffee Maker", "home", 59, 20),
                ("Desk Lamp", "home", 35, 50), ("Backpack", "fashion", 49, 35)]
        for n, c, p, st in demo:
            db.add(m.Product(name=n, category=c, price=p, stock=st, description=f"High quality {n.lower()}."))
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
STATUSES = ["processing", "packed", "shipped", "delivered", "cancelled"]

def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

@app.post("/auth/register", response_model=s.Token, status_code=201)
def register(body: s.Creds, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"rate-limit:register:{_client_ip(request)}", 10, 60)
    if db.scalar(select(m.User).where(m.User.email == body.email)):
        raise HTTPException(409, "Email already registered")
    u = m.User(email=body.email, password_hash=hash_pw(body.password))
    db.add(u); db.commit(); db.refresh(u)
    return s.Token(access_token=make_token(u), role=u.role)

@app.post("/auth/login", response_model=s.Token)
def login(body: s.Creds, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"rate-limit:login:{_client_ip(request)}", 10, 60)
    u = db.scalar(select(m.User).where(m.User.email == body.email))
    if not u or not check_pw(body.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return s.Token(access_token=make_token(u), role=u.role)

@app.get("/products", response_model=list[s.ProductOut])
def products(q: str | None = None, category: str | None = None, min_price: float | None = None,
             max_price: float | None = None, sort: str = "name", page: int = Query(1, ge=1),
             size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    cache_args = json.dumps(
        {"q": q, "category": category, "min_price": min_price, "max_price": max_price,
         "sort": sort, "page": page, "size": size},
        sort_keys=True,
    )
    cache_key = "products:" + hashlib.sha256(cache_args.encode()).hexdigest()
    cached = get_cached_json(cache_key)
    if cached is not None:
        return [s.ProductOut.model_validate(item) for item in cached]

    stmt = select(m.Product)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(m.Product.name.ilike(like), m.Product.description.ilike(like)))
    if category: stmt = stmt.where(m.Product.category == category)
    if min_price is not None: stmt = stmt.where(m.Product.price >= min_price)
    if max_price is not None: stmt = stmt.where(m.Product.price <= max_price)
    order = {"price_asc": m.Product.price.asc(), "price_desc": m.Product.price.desc()}.get(sort, m.Product.name.asc())
    result = db.scalars(stmt.order_by(order).offset((page - 1) * size).limit(size)).all()
    cached_items = [s.ProductOut.model_validate(item).model_dump(mode="json") for item in result]
    set_cached_json(cache_key, cached_items)
    return result

@app.get("/categories", response_model=list[str])
def categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(m.Product.category).distinct()))

def _active_cart(db: Session, user_id: int, *, create: bool = False) -> m.Cart | None:
    cart = db.scalar(
        select(m.Cart)
        .where(m.Cart.user_id == user_id, m.Cart.status == "active")
        .options(selectinload(m.Cart.items).selectinload(m.CartItem.product))
        .order_by(m.Cart.id.desc())
    )
    if cart is None and create:
        cart = m.Cart(user_id=user_id, status="active")
        db.add(cart)
        db.flush()
    return cart

@app.get("/cart", response_model=s.CartOut)
def get_cart(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    cart = _active_cart(db, user.id)
    return {"items": [
        {"product": item.product, "quantity": item.quantity}
        for item in cart.items
    ] if cart else []}

@app.put("/cart", response_model=s.CartOut)
def replace_cart(body: s.CartReplace, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    product_ids = [item.product_id for item in body.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(422, "A product can only appear once in the cart")
    try:
        products_by_id = {}
        for item in body.items:
            product = db.get(m.Product, item.product_id)
            if not product:
                raise HTTPException(404, f"Product {item.product_id} not found")
            if item.quantity > product.stock:
                raise HTTPException(409, f"Insufficient stock for {product.name}")
            products_by_id[item.product_id] = product
        cart = _active_cart(db, user.id, create=bool(body.items))
        if cart is None:
            return {"items": []}
        requested = {item.product_id: item.quantity for item in body.items}
        cart.items[:] = [item for item in cart.items if item.product_id in requested]
        current_items = {item.product_id: item for item in cart.items}
        for item in body.items:
            saved_item = current_items.get(item.product_id)
            if saved_item:
                saved_item.quantity = item.quantity
            else:
                cart.items.append(m.CartItem(product=products_by_id[item.product_id], quantity=item.quantity))
        db.commit()
        db.refresh(cart)
        return {"items": [
            {"product": item.product, "quantity": item.quantity}
            for item in cart.items
        ]}
    except HTTPException:
        db.rollback()
        raise

@app.get("/wishlist", response_model=s.WishlistOut)
def get_wishlist(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    wishlist = db.scalar(
        select(m.Wishlist)
        .where(m.Wishlist.user_id == user.id, m.Wishlist.name == "Favorites")
        .options(selectinload(m.Wishlist.items).selectinload(m.WishlistItem.product))
    )
    return {"items": [item.product for item in wishlist.items] if wishlist else []}

@app.put("/wishlist", status_code=204)
def replace_wishlist(body: s.WishlistReplace, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    if len(body.product_ids) != len(set(body.product_ids)) or any(product_id < 1 for product_id in body.product_ids):
        raise HTTPException(422, "Wishlist product IDs must be unique positive integers")
    products_by_id = {}
    for product_id in body.product_ids:
        product = db.get(m.Product, product_id)
        if not product:
            raise HTTPException(404, f"Product {product_id} not found")
        products_by_id[product_id] = product
    wishlist = db.scalar(
        select(m.Wishlist)
        .where(m.Wishlist.user_id == user.id, m.Wishlist.name == "Favorites")
        .options(selectinload(m.Wishlist.items))
    )
    if wishlist is None and body.product_ids:
        wishlist = m.Wishlist(user_id=user.id, name="Favorites")
        db.add(wishlist)
        db.flush()
    if wishlist:
        requested = set(body.product_ids)
        wishlist.items[:] = [item for item in wishlist.items if item.product_id in requested]
        current_ids = {item.product_id for item in wishlist.items}
        for product_id, product in products_by_id.items():
            if product_id not in current_ids:
                wishlist.items.append(m.WishlistItem(product=product))
    db.commit()

@app.put("/wishlist/{product_id}", status_code=204)
def add_wishlist_item(product_id: int, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    product = db.get(m.Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    wishlist = db.scalar(
        select(m.Wishlist)
        .where(m.Wishlist.user_id == user.id, m.Wishlist.name == "Favorites")
        .options(selectinload(m.Wishlist.items))
    )
    if wishlist is None:
        wishlist = m.Wishlist(user_id=user.id, name="Favorites")
        db.add(wishlist)
        db.flush()
    if not any(item.product_id == product_id for item in wishlist.items):
        wishlist.items.append(m.WishlistItem(product_id=product_id))
    db.commit()

@app.delete("/wishlist/{product_id}", status_code=204)
def remove_wishlist_item(product_id: int, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    wishlist = db.scalar(
        select(m.Wishlist)
        .where(m.Wishlist.user_id == user.id, m.Wishlist.name == "Favorites")
        .options(selectinload(m.Wishlist.items))
    )
    if wishlist:
        wishlist.items[:] = [item for item in wishlist.items if item.product_id != product_id]
        db.commit()

@app.get("/addresses", response_model=list[s.AddressOut])
def get_addresses(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    return db.scalars(
        select(m.Address)
        .where(m.Address.user_id == user.id)
        .order_by(m.Address.is_default.desc(), m.Address.id.desc())
    ).all()

@app.post("/addresses", response_model=s.AddressOut, status_code=201)
def create_address(body: s.AddressIn, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    existing = list(db.scalars(select(m.Address).where(m.Address.user_id == user.id)))
    address = m.Address(user_id=user.id, **body.model_dump())
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
    addresses = list(db.scalars(select(m.Address).where(m.Address.user_id == user.id)))
    address = next((item for item in addresses if item.id == address_id), None)
    if address is None:
        raise HTTPException(404, "Address not found")
    for item in addresses:
        item.is_default = item.id == address_id
    db.commit()
    db.refresh(address)
    return address

@app.delete("/addresses/{address_id}", status_code=204)
def delete_address(address_id: int, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    addresses = list(db.scalars(select(m.Address).where(m.Address.user_id == user.id)))
    address = next((item for item in addresses if item.id == address_id), None)
    if address is None:
        raise HTTPException(404, "Address not found")
    was_default = address.is_default
    db.delete(address)
    if was_default:
        replacement = next((item for item in addresses if item.id != address_id), None)
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
    delete_cache_prefix("products:")
    return p

@app.put("/products/{pid}", response_model=s.ProductOut)
def update_product(pid: int, body: s.ProductIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    p = db.get(m.Product, pid)
    if not p: raise HTTPException(404, "Not found")
    for k, v in body.model_dump().items(): setattr(p, k, v)
    db.commit(); db.refresh(p)
    delete_cache_prefix("products:")
    return p

@app.delete("/products/{pid}", status_code=204)
def delete_product(pid: int, db: Session = Depends(get_db), _=Depends(admin_user)):
    p = db.get(m.Product, pid)
    if not p: raise HTTPException(404, "Not found")
    db.delete(p); db.commit()
    delete_cache_prefix("products:")

@app.post("/orders", response_model=s.OrderOut, status_code=201)
async def checkout(body: s.OrderIn, db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    order = m.Order(user_id=user.id, total=0)
    try:
        for it in body.items:
            p = db.get(m.Product, it.product_id)
            if not p: raise HTTPException(404, f"Product {it.product_id} not found")
            if p.stock < it.quantity: raise HTTPException(409, f"Insufficient stock for {p.name}")
            p.stock -= it.quantity
            order.total += p.price * it.quantity
            order.items.append(m.OrderItem(product_id=p.id, product_name=p.name, quantity=it.quantity, price=p.price))
        if order.total < 100:
            order.total += 7.95
        db.add(order)
        db.flush()
        if body.address:
            db.add(m.OrderAddress(order_id=order.id, **body.address.model_dump(exclude={"label"})))
        cart = _active_cart(db, user.id)
        if cart:
            cart.status = "converted"
        db.commit(); db.refresh(order)
    except HTTPException:
        db.rollback(); raise
    delete_cache_prefix("products:")
    await order_connections.send_to_user(
        user.id,
        {"type": "order.created", "order_id": order.id, "status": order.status},
    )
    return order

@app.get("/orders", response_model=list[s.OrderOut])
def my_orders(db: Session = Depends(get_db), user: m.User = Depends(current_user)):
    return db.scalars(select(m.Order).where(m.Order.user_id == user.id).order_by(m.Order.id.desc())).all()

@app.get("/admin/orders", response_model=list[s.OrderOut])
def all_orders(db: Session = Depends(get_db), _=Depends(admin_user)):
    return db.scalars(select(m.Order).order_by(m.Order.id.desc())).all()

@app.patch("/orders/{oid}/status", response_model=s.OrderOut)
async def set_status(oid: int, body: s.StatusIn, db: Session = Depends(get_db), _=Depends(admin_user)):
    if body.status not in STATUSES: raise HTTPException(422, f"Status must be one of {STATUSES}")
    o = db.get(m.Order, oid)
    if not o: raise HTTPException(404, "Not found")
    o.status = body.status; db.commit(); db.refresh(o)
    await order_connections.send_to_user(
        o.user_id,
        {"type": "order.status_changed", "order_id": o.id, "status": o.status},
    )
    return o

@app.websocket("/ws/notifications")
async def order_notifications(websocket: WebSocket):
    token = websocket.query_params.get("token", "")
    user_id = user_id_from_token(token)
    if user_id is None:
        await websocket.close(code=4401)
        return
    with SessionLocal() as db:
        if db.get(m.User, user_id) is None:
            await websocket.close(code=4401)
            return

    await order_connections.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        order_connections.disconnect(user_id, websocket)

@app.get("/admin/stats")
def stats(db: Session = Depends(get_db), _=Depends(admin_user)):
    top = db.execute(select(m.OrderItem.product_name, func.sum(m.OrderItem.quantity).label("sold"))
                     .group_by(m.OrderItem.product_name).order_by(func.sum(m.OrderItem.quantity).desc()).limit(5)).all()
    return {
        "revenue": db.scalar(select(func.coalesce(func.sum(m.Order.total), 0)).where(m.Order.status != "cancelled")),
        "orders": db.scalar(select(func.count(m.Order.id))),
        "customers": db.scalar(select(func.count(m.User.id)).where(m.User.role == "customer")),
        "products": db.scalar(select(func.count(m.Product.id))),
        "low_stock": [{"id": p.id, "name": p.name, "stock": p.stock} for p in db.scalars(select(m.Product).where(m.Product.stock < 10))],
        "top_products": [{"name": n, "sold": int(c)} for n, c in top],
    }
