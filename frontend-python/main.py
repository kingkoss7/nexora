import os
from datetime import datetime
import httpx
from nicegui import ui

API = os.getenv("NEXORA_API_URL", "http://127.0.0.1:8000").rstrip("/")
BG = "#100B1B"
SURFACE = "#1C1430"
CARD = "#291D40"
ACCENT = "#C3A0FF"
TEXT = "#F7F1FF"
MUTED = "#B6A9CC"

ui.colors(primary=ACCENT, secondary="#8D6BCA", accent=ACCENT, dark=BG)
ui.add_head_html("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
body,.q-page{background:#100B1B;color:#F7F1FF;font-family:'DM Sans',sans-serif}
h1,h2,h3,.brand{font-family:'Space Grotesk',sans-serif}
.q-card{border:1px solid #3B2B56;border-radius:18px;box-shadow:0 12px 34px #08051155}
.q-btn{border-radius:10px;font-weight:700;text-transform:none}
.field-label{color:#B6A9CC}.product-image{height:150px;display:flex;align-items:center;justify-content:center;
background:linear-gradient(135deg,#291D40,#1C1430);border-radius:12px;font-size:48px}
.pill{display:inline-block;background:#39284f;color:#D8C4FF;padding:4px 10px;border-radius:99px;font-size:12px}
</style>
""")
ui.dark_mode().enable()

@ui.page("/")
def home():
    token, role = {"value": ""}, {"value": "customer"}
    cart, products_cache = {"items": []}, {"items": []}
    content = None
    search_text = {"value": ""}
    category_filter = {"value": ""}
    sort_filter = {"value": "name"}

    def request(method, path, payload=None, auth=True, params=None):
        headers = {"Authorization": f"Bearer {token['value']}"} if auth and token["value"] else {}
        try:
            response = httpx.request(method, f"{API}{path}", json=payload, headers=headers, params=params, timeout=8)
            if response.status_code >= 400:
                try: detail = response.json().get("detail", response.text)
                except Exception: detail = response.text
                ui.notify(str(detail), type="negative")
                return None
            return response.json() if response.status_code != 204 else {}
        except httpx.HTTPError:
            ui.notify(f"Cannot reach API at {API}. Start the FastAPI backend first.", type="negative")
            return None

    def money(value):
        return "₹{:,.2f}".format(float(value or 0))

    def show_notice(message):
        ui.notify(message, type="positive")

    def get_products():
        params = {"size": 100, "sort": sort_filter["value"]}
        if search_text["value"].strip(): params["q"] = search_text["value"].strip()
        if category_filter["value"]: params["category"] = category_filter["value"]
        data = request("GET", "/products", auth=False, params=params)
        if data is not None: products_cache["items"] = data
        return products_cache["items"]

    def sync_cart():
        data = request("GET", "/cart")
        if data is not None: cart["items"] = data.get("items", [])
        return cart["items"]

    def cart_count():
        return sum(int(item.get("quantity", 0)) for item in cart["items"])

    def save_cart():
        items = [{"product_pid": item["product"]["pid"], "quantity": item["quantity"]} for item in cart["items"]]
        data = request("PUT", "/cart", {"items": items})
        if data is not None: cart["items"] = data.get("items", [])

    def add_to_cart(product):
        if not token["value"]:
            ui.notify("Sign in to add products to your cart.", type="warning")
            render_auth()
            return
        sync_cart()
        found = next((x for x in cart["items"] if x["product"]["pid"] == product["pid"]), None)
        if found:
            if found["quantity"] >= product["stock"]:
                ui.notify("Maximum available stock reached.", type="warning"); return
            found["quantity"] += 1
        else:
            if product["stock"] < 1:
                ui.notify("This item is out of stock.", type="warning"); return
            cart["items"].append({"product": product, "quantity": 1})
        save_cart()
        show_notice("Added to your cart.")

    def render_products():
        content.clear()
        with content:
            ui.label("Discover your next favourite").classes("text-3xl font-bold")
            ui.label("Thoughtfully selected essentials. A premium experience, made simple.").style(f"color:{MUTED}")
            with ui.row().classes("w-full items-center gap-3 mt-4"):
                search = ui.input("Search products", value=search_text["value"]).props("outlined rounded").classes("grow")
                categories = request("GET", "/categories", auth=False) or []
                category = ui.select(["All categories", *categories], value=category_filter["value"] or "All categories", label="Category").props("outlined")
                sorting = ui.select({"name":"Name","price_asc":"Price: low to high","price_desc":"Price: high to low"}, value=sort_filter["value"], label="Sort by").props("outlined")
                def apply_filters():
                    search_text["value"] = search.value or ""
                    category_filter["value"] = "" if category.value == "All categories" else category.value
                    sort_filter["value"] = sorting.value or "name"
                    render_products()
                ui.button("Apply", on_click=apply_filters, icon="tune")
            items = get_products()
            if not items:
                ui.label("No products found. Try a different search or check your database seed settings.").style(f"color:{MUTED}")
            with ui.grid(columns=4).classes("w-full gap-4 mt-3").style("grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"):
                for p in items:
                    with ui.card().classes("w-full p-3"):
                        with ui.element("div").classes("product-image w-full"):
                            ui.icon("inventory_2", size="42px").style(f"color:{ACCENT}")
                        ui.label(p["category"].replace("_"," ").title()).style(f"color:{MUTED};font-size:12px;margin-top:12px")
                        ui.label(p["name"]).classes("text-lg font-bold")
                        ui.label(p.get("description","")).style(f"color:{MUTED};min-height:42px;font-size:13px")
                        with ui.row().classes("w-full items-center justify-between"):
                            ui.label(money(p["price"])).classes("text-xl font-bold")
                            ui.label(f"{p['stock']} in stock").style(f"color:{MUTED};font-size:12px")
                        ui.button("Add to cart", icon="add_shopping_cart", on_click=lambda product=p: add_to_cart(product)).props("unelevated").classes("w-full")

    def render_auth():
        content.clear()
        with content:
            ui.label("Welcome to NEXORA").classes("text-3xl font-bold")
            ui.label("Sign in or create an account to continue.").style(f"color:{MUTED}")
            with ui.card().classes("w-full max-w-lg mt-5 p-6"):
                mode = ui.toggle({"login":"Sign in","register":"Create account"}, value="login")
                name = ui.input("Full name").props("outlined").classes("w-full")
                email = ui.input("Email address").props("outlined type=email").classes("w-full")
                password = ui.input("Password", password=True, password_toggle_button=True).props("outlined").classes("w-full")
                def submit():
                    if mode.value == "register":
                        result = request("POST", "/auth/register", {"name":name.value or "", "email":email.value or "", "password":password.value or ""}, auth=False)
                        if result is None: return
                        ui.notify("Account created. Sign in to continue.", type="positive")
                        mode.value = "login"
                        return
                    result = request("POST", "/auth/login", {"email":email.value or "", "password":password.value or ""}, auth=False)
                    if result is None: return
                    token["value"], role["value"] = result["access_token"], result.get("role","customer")
                    sync_cart()
                    show_notice("Signed in successfully.")
                    render_products()
                    render_header.refresh()
                ui.button("Continue", on_click=submit, icon="login").props("unelevated").classes("w-full mt-3")
                ui.label("Your account is secured by the existing FastAPI authentication.").style(f"color:{MUTED};font-size:12px")

    def render_cart():
        content.clear()
        with content:
            ui.label("Your cart").classes("text-3xl font-bold")
            if not token["value"]:
                ui.label("Sign in to view your saved cart.")
                ui.button("Sign in", on_click=render_auth)
                return
            sync_cart()
            if not cart["items"]:
                ui.label("Your cart is empty. Find something you love.").style(f"color:{MUTED}")
                ui.button("Explore products", on_click=render_products, icon="storefront")
                return
            total = 0
            for item in cart["items"]:
                p, qty = item["product"], item["quantity"]
                total += float(p["price"]) * qty
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center"):
                        ui.icon("inventory_2", size="36px").style(f"color:{ACCENT}")
                        with ui.column().classes("grow gap-1"):
                            ui.label(p["name"]).classes("font-bold")
                            ui.label(money(p["price"])).style(f"color:{MUTED}")
                        ui.button(icon="remove", on_click=lambda pid=p["pid"]: change_qty(pid,-1)).props("flat round")
                        ui.label(str(qty)).classes("font-bold")
                        ui.button(icon="add", on_click=lambda pid=p["pid"]: change_qty(pid,1)).props("flat round")
                        ui.button(icon="delete_outline", on_click=lambda pid=p["pid"]: remove_item(pid)).props("flat round color=negative")
            ui.separator()
            ui.label(f"Subtotal  {money(total)}").classes("text-2xl font-bold")
            ui.label("Shipping may apply to orders below ₹100 equivalent in the API currency.").style(f"color:{MUTED};font-size:12px")
            ui.button("Continue to checkout", on_click=render_checkout, icon="local_shipping").props("unelevated")

    def change_qty(pid, delta):
        sync_cart()
        item = next((x for x in cart["items"] if x["product"]["pid"] == pid), None)
        if item:
            item["quantity"] += delta
            if item["quantity"] <= 0: cart["items"].remove(item)
            elif item["quantity"] > item["product"]["stock"]:
                item["quantity"] -= delta
                ui.notify("Not enough stock.", type="warning"); return
            save_cart()
        render_cart()

    def remove_item(pid):
        sync_cart()
        cart["items"] = [x for x in cart["items"] if x["product"]["pid"] != pid]
        save_cart()
        render_cart()

    def render_checkout():
        content.clear()
        with content:
            ui.label("Checkout").classes("text-3xl font-bold")
            if not token["value"]:
                ui.label("Please sign in before checkout."); ui.button("Sign in", on_click=render_auth); return
            sync_cart()
            if not cart["items"]:
                ui.label("Your cart is empty."); ui.button("Shop now", on_click=render_products); return
            ui.label("Delivery details").classes("text-xl font-bold mt-4")
            with ui.card().classes("w-full max-w-2xl p-5"):
                recipient = ui.input("Recipient name").props("outlined").classes("w-full")
                phone = ui.input("Phone number").props("outlined").classes("w-full")
                line1 = ui.input("Address line 1").props("outlined").classes("w-full")
                line2 = ui.input("Address line 2 (optional)").props("outlined").classes("w-full")
                city = ui.input("City").props("outlined").classes("w-full")
                region = ui.input("State / region").props("outlined").classes("w-full")
                postal = ui.input("Postal code").props("outlined").classes("w-full")
                country = ui.input("Country code (e.g. IN)", value="IN").props("outlined").classes("w-full")
                total = sum(float(x["product"]["price"]) * x["quantity"] for x in cart["items"])
                ui.label(f"Order subtotal: {money(total)}").classes("text-xl font-bold")
                ui.label("Payment method: Cash on delivery").style(f"color:{MUTED}")
                def place_order():
                    address = {"recipient_name":recipient.value or "", "phone":phone.value or "",
                        "address_line1":line1.value or "", "address_line2":line2.value or None,
                        "city":city.value or "", "region":region.value or None,
                        "postal_code":postal.value or "", "country":country.value or "IN"}
                    items = [{"product_pid":x["product"]["pid"],"quantity":x["quantity"]} for x in cart["items"]]
                    result = request("POST","/orders",{"items":items,"address":address})
                    if result is not None:
                        cart["items"] = []
                        ui.notify(f"Order #{result['oid']} placed successfully!", type="positive")
                        render_orders()
                ui.button("Place COD order", on_click=place_order, icon="check_circle").props("unelevated").classes("w-full mt-3")

    def render_orders():
        content.clear()
        with content:
            ui.label("Your orders").classes("text-3xl font-bold")
            if not token["value"]:
                ui.label("Sign in to view your orders."); ui.button("Sign in", on_click=render_auth); return
            orders = request("GET","/orders") or []
            if not orders:
                ui.label("No orders yet. Your future purchases will appear here.").style(f"color:{MUTED}")
            for order in orders:
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center justify-between"):
                        ui.label(f"Order #{order['oid']}").classes("text-lg font-bold")
                        ui.badge(order["status"].title(), color="purple")
                    ui.label(datetime.fromisoformat(order["created_at"].replace("Z","+00:00")).strftime("%d %b %Y"))
                    for item in order.get("items",[]):
                        ui.label(f"{item['product_name']} × {item['quantity']} — {money(item['price'] * item['quantity'])}")
                    ui.separator()
                    ui.label(f"Total: {money(order['total'])}").classes("text-lg font-bold")
                    payment = order.get("payment") or {}
                    ui.label(f"Payment: Cash on delivery · {(payment.get('status') or 'pending').title()}").style(f"color:{MUTED}")

    def render_admin():
        content.clear()
        with content:
            ui.label("Admin workspace").classes("text-3xl font-bold")
            if not token["value"] or role["value"] != "admin":
                ui.label("This area requires an admin account. Sign in with your configured admin credentials.")
                ui.button("Sign in", on_click=render_auth); return
            ui.label("Create product").classes("text-xl font-bold mt-4")
            with ui.card().classes("w-full max-w-2xl p-5"):
                pname=ui.input("Product name").props("outlined").classes("w-full")
                pdesc=ui.input("Description").props("outlined").classes("w-full")
                pcat=ui.input("Category", value="general").props("outlined").classes("w-full")
                price=ui.number("Price",min=0,value=0).props("outlined").classes("w-full")
                stock=ui.number("Stock",min=0,value=0).props("outlined").classes("w-full")
                def create_product():
                    data=request("POST","/products",{"name":pname.value or "","description":pdesc.value or "",
                        "category":pcat.value or "general","price":price.value or 0,"stock":int(stock.value or 0)})
                    if data is not None: ui.notify("Product created.",type="positive"); render_admin()
                ui.button("Create product",on_click=create_product,icon="add").props("unelevated")
            ui.label("Manage orders").classes("text-xl font-bold mt-6")
            orders=request("GET","/admin/orders") or []
            for order in orders:
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center justify-between"):
                        ui.label(f"Order #{order['oid']} · {money(order['total'])}")
                        ui.label(order["status"].title()).style(f"color:{ACCENT}")
                    choices={"placed":["packed","cancelled"],"packed":["shipped","cancelled"],"shipped":["delivered"],"delivered":[],"cancelled":[]}.get(order["status"],[])
                    if choices:
                        next_status=ui.select(choices,value=choices[0],label="Next status").props("outlined")
                        def update_status(oid=order["oid"], select=next_status):
                            if request("PATCH",f"/orders/{oid}/status",{"status":select.value}) is not None:
                                ui.notify("Order status updated.",type="positive"); render_admin()
                        ui.button("Update status",on_click=update_status).props("unelevated")

    def sign_out():
        token["value"], role["value"], cart["items"] = "", "customer", []
        render_products()
        render_header.refresh()
        ui.notify("Signed out.")

    @ui.refreshable
    def render_header():
        with ui.header().classes("items-center justify-between px-5 py-3").style(f"background:{SURFACE};border-bottom:1px solid #3B2B56"):
            with ui.row().classes("items-center gap-3 cursor-pointer") as brand:
                ui.icon("diamond", size="30px").style(f"color:{ACCENT}")
                ui.label("NEXORA").classes("brand text-2xl font-bold")
                ui.label("STORE").style(f"color:{MUTED};font-size:10px;letter-spacing:3px")
                brand.on("click", render_products)
            with ui.row().classes("items-center gap-1"):
                ui.button("Shop", on_click=render_products, icon="storefront").props("flat")
                ui.button(f"Cart ({cart_count()})", on_click=render_cart, icon="shopping_bag").props("flat")
                if token["value"]:
                    ui.button("Orders", on_click=render_orders, icon="receipt_long").props("flat")
                    if role["value"] == "admin": ui.button("Admin", on_click=render_admin, icon="admin_panel_settings").props("flat")
                    ui.button("Sign out", on_click=sign_out, icon="logout").props("flat")
                else:
                    ui.button("Sign in", on_click=render_auth, icon="person").props("unelevated")

    with ui.column().classes("w-full max-w-7xl mx-auto px-4 py-5 gap-5"):
        render_header()
        with ui.row().classes("w-full items-center justify-between rounded-2xl p-6 md:p-8").style("background:linear-gradient(115deg,#291D40,#1C1430 58%,#38244E);border:1px solid #493360"):
            with ui.column().classes("gap-2"):
                ui.label("THE NEW STANDARD").style(f"color:{ACCENT};letter-spacing:3px;font-size:11px;font-weight:700")
                ui.label("Everyday essentials.\nElevated.").classes("text-3xl md:text-5xl font-bold").style("white-space:pre-line;line-height:1.08")
                ui.label("Discover technology, lifestyle and home picks in one place.").style(f"color:{MUTED}")
                ui.button("Explore collection",on_click=render_products,icon="arrow_forward").props("unelevated")
            ui.icon("auto_awesome",size="90px").style(f"color:{ACCENT};opacity:.85")
        content = ui.column().classes("w-full gap-4")
        with ui.footer().classes("justify-center").style(f"background:{BG};color:{MUTED}"):
            ui.label("NEXORA · Powered by Python, NiceGUI, FastAPI & PostgreSQL")
    render_products()

ui.run(title="NEXORA E-Commerce", host="0.0.0.0", port=int(os.getenv("PORT","3000")), reload=False, show=False)
