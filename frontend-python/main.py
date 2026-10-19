import os
from datetime import datetime
import httpx
from nicegui import ui

API = os.getenv("NEXORA_API_URL", "http://127.0.0.1:8000").rstrip("/")
BG, SURFACE, CARD = "#100B1B", "#1C1430", "#291D40"
ACCENT, TEXT, MUTED = "#C3A0FF", "#F7F1FF", "#B6A9CC"

ui.colors(primary=ACCENT, secondary="#8D6BCA", accent=ACCENT, dark=BG)
ui.add_head_html("""
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
body,.q-page{background:#100B1B;color:#F7F1FF;font-family:'DM Sans',sans-serif}
h1,h2,h3,.brand{font-family:'Space Grotesk',sans-serif}
.q-card{background:#1C1430;border:1px solid #3B2B56;border-radius:18px;box-shadow:0 12px 34px #08051155}
.q-btn{border-radius:10px;font-weight:700;text-transform:none}
.q-field__label{color:#B6A9CC}
.product-image{height:130px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#291D40,#1C1430);border-radius:12px}
.muted{color:#B6A9CC}.accent{color:#C3A0FF}
</style>
""")
ui.dark_mode().enable()

@ui.page("/")
def home():
    session = {"token": "", "role": "customer"}
    cart = {"items": []}
    products_cache = {"items": []}
    content_box = None

    def api(method, path, payload=None, auth=True, params=None):
        headers = {"Authorization": "Bearer " + session["token"]} if auth and session["token"] else {}
        try:
            response = httpx.request(method, API + path, json=payload, headers=headers, params=params, timeout=12)
            if response.status_code >= 400:
                try:
                    detail = response.json().get("detail", response.text)
                except Exception:
                    detail = response.text
                ui.notify(str(detail), type="negative")
                return None
            return response.json() if response.status_code != 204 else {}
        except httpx.HTTPError:
            ui.notify("Cannot reach the API. Start FastAPI at " + API, type="negative")
            return None

    def money(value):
        return "₹{:,.2f}".format(float(value or 0))

    def reset_content():
        content_box.clear()

    def load_cart():
        result = api("GET", "/cart")
        if result is not None:
            cart["items"] = result.get("items", [])
        return cart["items"]

    def save_cart():
        lines = [{"product_pid": x["product"]["pid"], "quantity": x["quantity"]} for x in cart["items"]]
        result = api("PUT", "/cart", {"items": lines})
        if result is not None:
            cart["items"] = result.get("items", [])
            refresh_nav.refresh()
            return True
        return False

    def render_shop(search_value="", category_value="", sort_value="name"):
        reset_content()
        with content_box:
            ui.label("THE NEXORA COLLECTION").style("color:" + ACCENT + ";letter-spacing:3px;font-size:11px;font-weight:700")
            ui.label("Everyday essentials. Elevated.").classes("text-3xl md:text-5xl font-bold")
            ui.label("Discover technology, lifestyle and home picks in one place.").style("color:" + MUTED)
            with ui.row().classes("w-full items-center gap-3 mt-4"):
                search = ui.input("Search products", value=search_value).props("outlined rounded").classes("grow")
                cats = api("GET", "/categories", auth=False) or []
                category = ui.select(["All categories"] + cats, value=category_value or "All categories", label="Category").props("outlined")
                sorting = ui.select({"name": "Name", "price_asc": "Price: low to high", "price_desc": "Price: high to low"}, value=sort_value, label="Sort by").props("outlined")
                def apply():
                    render_shop(search.value or "", "" if category.value == "All categories" else category.value, sorting.value or "name")
                ui.button("Search / Filter", on_click=apply, icon="tune").props("unelevated")
            params = {"size": 100, "sort": sort_value}
            if search_value.strip():
                params["q"] = search_value.strip()
            if category_value:
                params["category"] = category_value
            products = api("GET", "/products", auth=False, params=params)
            if products is None:
                products = []
            products_cache["items"] = products
            if not products:
                ui.label("No products found. Try another search or check your sample data.").style("color:" + MUTED)
            with ui.grid(columns=4).classes("w-full gap-4 mt-3").style("grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"):
                for p in products:
                    with ui.card().classes("w-full p-3"):
                        with ui.element("div").classes("product-image w-full"):
                            ui.icon("inventory_2", size="42px").style("color:" + ACCENT)
                        ui.label(str(p.get("category", "")).replace("_", " ").title()).style("color:" + MUTED + ";font-size:12px;margin-top:12px")
                        ui.label(p["name"]).classes("text-lg font-bold")
                        ui.label(p.get("description") or "").style("color:" + MUTED + ";min-height:42px;font-size:13px")
                        with ui.row().classes("w-full items-center justify-between"):
                            ui.label(money(p["price"])).classes("text-xl font-bold")
                            ui.label(str(p["stock"]) + " in stock").style("color:" + MUTED + ";font-size:12px")
                        ui.button("View details", on_click=lambda _=None, product=p: render_product(product["pid"]), icon="visibility").props("outline").classes("w-full")
                        ui.button("Add to cart", on_click=lambda _=None, product=p: add_product(product, 1), icon="add_shopping_cart").props("unelevated").classes("w-full")

    def render_product(pid):
        p = api("GET", "/products/" + str(pid), auth=False)
        if p is None:
            return
        reset_content()
        with content_box:
            ui.button("Back to shop", on_click=lambda: render_shop(), icon="arrow_back").props("flat")
            with ui.row().classes("w-full items-start gap-6"):
                with ui.card().classes("w-full md:w-1/2 p-8 items-center justify-center"):
                    ui.icon("inventory_2", size="100px").style("color:" + ACCENT)
                    ui.label(str(p.get("category", "")).replace("_", " ").title()).style("color:" + MUTED)
                with ui.column().classes("grow gap-3"):
                    ui.label(p["name"]).classes("text-3xl font-bold")
                    ui.label(money(p["price"])).classes("text-2xl font-bold").style("color:" + ACCENT)
                    ui.label(str(p.get("description") or "No description available.")).style("color:" + MUTED)
                    ui.label(str(p["stock"]) + " available").style("color:" + MUTED)
                    qty = ui.number("Quantity", min=1, max=max(1, int(p["stock"])), value=1).props("outlined").classes("w-40")
                    ui.button("Add selected quantity to cart", on_click=lambda: add_product(p, int(qty.value or 1)), icon="add_shopping_cart").props("unelevated").classes("w-full")
                    ui.label("Secure checkout · Cash on delivery").style("color:" + MUTED)

    def add_product(product, quantity=1):
        if not session["token"]:
            ui.notify("Please sign in before adding items.", type="warning")
            render_auth()
            return
        if int(product.get("stock", 0)) < 1:
            ui.notify("This product is out of stock.", type="warning")
            return
        load_cart()
        found = next((x for x in cart["items"] if x["product"]["pid"] == product["pid"]), None)
        quantity = max(1, min(int(quantity), int(product["stock"])))
        if found:
            found["quantity"] = min(int(product["stock"]), found["quantity"] + quantity)
        else:
            cart["items"].append({"product": product, "quantity": quantity})
        if save_cart():
            ui.notify("Added to cart.", type="positive")

    def render_auth():
        reset_content()
        with content_box:
            ui.label("Welcome to NEXORA").classes("text-3xl font-bold")
            ui.label("Sign in or create your account.").style("color:" + MUTED)
            with ui.card().classes("w-full max-w-lg p-6"):
                mode = ui.toggle({"login": "Sign in", "register": "Create account"}, value="login")
                name = ui.input("Full name").props("outlined").classes("w-full")
                email = ui.input("Email address").props("outlined type=email").classes("w-full")
                password = ui.input("Password", password=True, password_toggle_button=True).props("outlined").classes("w-full")
                def submit():
                    if mode.value == "register":
                        result = api("POST", "/auth/register", {"name": name.value or "", "email": email.value or "", "password": password.value or ""}, auth=False)
                        if result is not None:
                            ui.notify("Account created. Please sign in.", type="positive")
                            mode.value = "login"
                        return
                    result = api("POST", "/auth/login", {"email": email.value or "", "password": password.value or ""}, auth=False)
                    if result is not None:
                        session["token"], session["role"] = result["access_token"], result.get("role", "customer")
                        load_cart()
                        refresh_nav.refresh()
                        ui.notify("Signed in successfully.", type="positive")
                        render_shop()
                ui.button("Continue", on_click=submit, icon="login").props("unelevated").classes("w-full mt-3")
                ui.label("Authentication is handled by the existing FastAPI backend.").style("color:" + MUTED + ";font-size:12px")

    def render_cart():
        reset_content()
        with content_box:
            ui.label("Your cart").classes("text-3xl font-bold")
            if not session["token"]:
                ui.label("Sign in to view your saved cart.")
                ui.button("Sign in", on_click=render_auth)
                return
            items = load_cart()
            if not items:
                ui.label("Your cart is empty.").style("color:" + MUTED)
                ui.button("Explore products", on_click=lambda: render_shop(), icon="storefront")
                return
            total = 0
            for line in items:
                p, qty = line["product"], line["quantity"]
                total += float(p["price"]) * qty
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center"):
                        ui.icon("inventory_2", size="32px").style("color:" + ACCENT)
                        with ui.column().classes("grow gap-1"):
                            ui.button(p["name"], on_click=lambda _=None, pid=p["pid"]: render_product(pid)).props("flat")
                            ui.label(money(p["price"]) + " each").style("color:" + MUTED)
                        ui.button(icon="remove", on_click=lambda _=None, pid=p["pid"]: change_qty(pid, -1)).props("flat round")
                        ui.label(str(qty)).classes("font-bold")
                        ui.button(icon="add", on_click=lambda _=None, pid=p["pid"]: change_qty(pid, 1)).props("flat round")
                        ui.button(icon="delete_outline", on_click=lambda _=None, pid=p["pid"]: remove_item(pid)).props("flat round color=negative")
                        ui.label(money(float(p["price"]) * qty)).classes("font-bold")
            ui.separator()
            ui.label("Subtotal: " + money(total)).classes("text-2xl font-bold")
            ui.button("Continue to checkout", on_click=render_checkout, icon="local_shipping").props("unelevated")

    def change_qty(pid, delta):
        load_cart()
        line = next((x for x in cart["items"] if x["product"]["pid"] == pid), None)
        if line:
            next_qty = line["quantity"] + delta
            if next_qty <= 0:
                cart["items"] = [x for x in cart["items"] if x["product"]["pid"] != pid]
            elif next_qty > line["product"]["stock"]:
                ui.notify("Maximum available stock reached.", type="warning")
                return
            else:
                line["quantity"] = next_qty
            if save_cart():
                render_cart()

    def remove_item(pid):
        load_cart()
        cart["items"] = [x for x in cart["items"] if x["product"]["pid"] != pid]
        if save_cart():
            render_cart()

    def render_checkout():
        reset_content()
        with content_box:
            ui.label("Checkout").classes("text-3xl font-bold")
            if not session["token"]:
                ui.label("Please sign in before checkout.")
                ui.button("Sign in", on_click=render_auth)
                return
            items = load_cart()
            if not items:
                ui.label("Your cart is empty.")
                ui.button("Shop now", on_click=lambda: render_shop())
                return
            addresses = api("GET", "/addresses") or []
            ui.label("Delivery details").classes("text-xl font-bold")
            with ui.card().classes("w-full max-w-3xl p-5"):
                saved = ui.select({str(a["address_id"]): (a.get("label") or a["address_line1"] + ", " + a["city"]) for a in addresses}, label="Use a saved address") if addresses else None
                recipient = ui.input("Recipient name").props("outlined").classes("w-full")
                phone = ui.input("Phone number").props("outlined").classes("w-full")
                line1 = ui.input("Address line 1").props("outlined").classes("w-full")
                line2 = ui.input("Address line 2 (optional)").props("outlined").classes("w-full")
                city = ui.input("City").props("outlined").classes("w-full")
                region = ui.input("State / region").props("outlined").classes("w-full")
                postal = ui.input("Postal code").props("outlined").classes("w-full")
                country = ui.input("Country code", value="IN").props("outlined").classes("w-full")
                def fill_saved():
                    if not saved or not saved.value:
                        return
                    a = next((x for x in addresses if str(x["address_id"]) == str(saved.value)), None)
                    if a:
                        recipient.value, phone.value = a["recipient_name"], a["phone"]
                        line1.value, line2.value = a["address_line1"], a.get("address_line2") or ""
                        city.value, region.value = a["city"], a.get("region") or ""
                        postal.value, country.value = a["postal_code"], a["country"]
                if saved:
                    saved.on_value_change(lambda _: fill_saved())
                total = sum(float(x["product"]["price"]) * x["quantity"] for x in items)
                ui.label("Order subtotal: " + money(total)).classes("text-xl font-bold")
                ui.label("Payment method: Cash on delivery").style("color:" + MUTED)
                def place_order():
                    address = {"recipient_name": recipient.value or "", "phone": phone.value or "",
                        "address_line1": line1.value or "", "address_line2": line2.value or None,
                        "city": city.value or "", "region": region.value or None,
                        "postal_code": postal.value or "", "country": (country.value or "IN").upper()}
                    if not all([address["recipient_name"], address["phone"], address["address_line1"], address["city"], address["postal_code"], address["country"]]):
                        ui.notify("Please complete all required delivery fields.", type="warning")
                        return
                    result = api("POST", "/orders", {"items": [{"product_pid": x["product"]["pid"], "quantity": x["quantity"]} for x in items], "address": address})
                    if result is not None:
                        cart["items"] = []
                        ui.notify("Order placed successfully.", type="positive")
                        render_orders()
                ui.button("Place COD order", on_click=place_order, icon="check_circle").props("unelevated").classes("w-full mt-3")

    def render_orders():
        reset_content()
        with content_box:
            ui.label("Order history").classes("text-3xl font-bold")
            if not session["token"]:
                ui.label("Sign in to view orders.")
                ui.button("Sign in", on_click=render_auth)
                return
            orders = api("GET", "/orders") or []
            if not orders:
                ui.label("No orders yet.").style("color:" + MUTED)
            for order in orders:
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center justify-between"):
                        ui.label("Order #" + str(order["oid"])).classes("text-lg font-bold")
                        ui.badge(order["status"].title(), color="purple")
                    try:
                        ui.label(datetime.fromisoformat(order["created_at"].replace("Z", "+00:00")).strftime("%d %b %Y")).style("color:" + MUTED)
                    except (ValueError, TypeError):
                        pass
                    for item in order.get("items", []):
                        ui.label(str(item["quantity"]) + " × " + item["product_name"] + " — " + money(item["price"] * item["quantity"]))
                    ui.separator()
                    ui.label("Total: " + money(order["total"])).classes("text-lg font-bold")
                    payment = order.get("payment") or {}
                    ui.label("Payment: " + str(payment.get("method") or "cash_on_delivery") + " · " + str(payment.get("status") or "pending")).style("color:" + MUTED)
                    if order.get("delivery_address_line1"):
                        ui.label("Delivering to: " + order["delivery_address_line1"] + ", " + order.get("delivery_city", "")).style("color:" + MUTED)

    def render_account():
        reset_content()
        with content_box:
            ui.label("My account").classes("text-3xl font-bold")
            if not session["token"]:
                ui.label("Sign in to manage your account.")
                ui.button("Sign in", on_click=render_auth)
                return
            orders = api("GET", "/orders") or []
            addresses = api("GET", "/addresses") or []
            spent = sum(float(o.get("total", 0)) for o in orders if o.get("status") != "cancelled")
            with ui.grid(columns=2).classes("w-full"):
                with ui.card().classes("p-5"):
                    ui.label(str(len(orders))).classes("text-3xl font-bold")
                    ui.label("Total orders").style("color:" + MUTED)
                with ui.card().classes("p-5"):
                    ui.label(money(spent)).classes("text-3xl font-bold")
                    ui.label("Total spent").style("color:" + MUTED)
            with ui.row().classes("w-full items-center justify-between"):
                ui.label("Saved delivery addresses").classes("text-xl font-bold")
                ui.button("Add address", on_click=lambda: render_address_form(), icon="add").props("unelevated")
            if not addresses:
                ui.label("No saved addresses yet. Add one for faster checkout.").style("color:" + MUTED)
            for a in addresses:
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center justify-between"):
                        with ui.column().classes("gap-1"):
                            ui.label(a.get("label") or "Delivery address").classes("font-bold")
                            ui.label(a["recipient_name"] + " · " + a["phone"])
                            ui.label(a["address_line1"] + ", " + a["city"] + ", " + (a.get("region") or "") + " " + a["postal_code"] + ", " + a["country"]).style("color:" + MUTED)
                            if a.get("is_default"):
                                ui.badge("Default address", color="purple")
                        with ui.row():
                            if not a.get("is_default"):
                                ui.button("Set default", on_click=lambda _=None, aid=a["address_id"]: set_default(aid)).props("outline")
                            ui.button("Delete", on_click=lambda _=None, aid=a["address_id"]: delete_address(aid)).props("flat color=negative")
            ui.button("View all orders", on_click=render_orders, icon="receipt_long").props("outline").classes("mt-3")

    def render_address_form():
        reset_content()
        with content_box:
            ui.button("Back to account", on_click=render_account, icon="arrow_back").props("flat")
            ui.label("Add delivery address").classes("text-3xl font-bold")
            with ui.card().classes("w-full max-w-2xl p-5"):
                label = ui.input("Address label (Home / College)").props("outlined").classes("w-full")
                recipient = ui.input("Recipient name").props("outlined").classes("w-full")
                phone = ui.input("Phone").props("outlined").classes("w-full")
                line1 = ui.input("Address line 1").props("outlined").classes("w-full")
                line2 = ui.input("Address line 2 (optional)").props("outlined").classes("w-full")
                city = ui.input("City").props("outlined").classes("w-full")
                region = ui.input("State / region").props("outlined").classes("w-full")
                postal = ui.input("Postal code").props("outlined").classes("w-full")
                country = ui.input("Country code", value="IN").props("outlined").classes("w-full")
                default = ui.checkbox("Set as default address")
                def save():
                    payload = {"label": label.value or "Delivery", "recipient_name": recipient.value or "", "phone": phone.value or "",
                        "address_line1": line1.value or "", "address_line2": line2.value or None, "city": city.value or "",
                        "region": region.value or None, "postal_code": postal.value or "", "country": (country.value or "IN").upper(),
                        "is_default": bool(default.value)}
                    if not all([payload["recipient_name"], payload["phone"], payload["address_line1"], payload["city"], payload["postal_code"], payload["country"]]):
                        ui.notify("Please complete all required fields.", type="warning")
                        return
                    result = api("POST", "/addresses", payload)
                    if result is not None:
                        ui.notify("Address saved.", type="positive")
                        render_account()
                ui.button("Save address", on_click=save, icon="save").props("unelevated").classes("w-full mt-3")

    def set_default(address_id):
        if api("PATCH", "/addresses/" + str(address_id) + "/default") is not None:
            ui.notify("Default address updated.", type="positive")
            render_account()

    def delete_address(address_id):
        if api("DELETE", "/addresses/" + str(address_id)) is not None:
            ui.notify("Address deleted.", type="positive")
            render_account()

    def render_admin():
        reset_content()
        with content_box:
            ui.label("Admin workspace").classes("text-3xl font-bold")
            if not session["token"] or session["role"] != "admin":
                ui.label("This page requires an administrator account.")
                ui.button("Sign in", on_click=render_auth)
                return
            ui.label("Create / edit product").classes("text-xl font-bold mt-4")
            with ui.card().classes("w-full p-5"):
                editing = {"pid": None}
                pname = ui.input("Product name").props("outlined").classes("w-full")
                pdesc = ui.textarea("Description").props("outlined").classes("w-full")
                pcat = ui.input("Category", value="general").props("outlined").classes("w-full")
                price = ui.number("Price", min=0, value=0).props("outlined").classes("w-full")
                stock = ui.number("Stock", min=0, value=0).props("outlined").classes("w-full")
                form_title = ui.label("New product").classes("font-bold")
                def clear_form():
                    editing["pid"] = None
                    pname.value, pdesc.value, pcat.value = "", "", "general"
                    price.value, stock.value = 0, 0
                    form_title.text = "New product"
                def submit_product():
                    payload = {"name": pname.value or "", "description": pdesc.value or "", "category": pcat.value or "general",
                        "price": float(price.value or 0), "stock": int(stock.value or 0)}
                    if not payload["name"].strip():
                        ui.notify("Product name is required.", type="warning")
                        return
                    path = "/products" if editing["pid"] is None else "/products/" + str(editing["pid"])
                    result = api("POST" if editing["pid"] is None else "PUT", path, payload)
                    if result is not None:
                        ui.notify("Product saved.", type="positive")
                        render_admin()
                with ui.row().classes("gap-2"):
                    ui.button("Save product", on_click=submit_product, icon="save").props("unelevated")
                    ui.button("Clear form", on_click=clear_form).props("outline")
                products = api("GET", "/products", params={"size": 100}) or []
                ui.separator()
                ui.label("Products").classes("text-xl font-bold")
                for p in products:
                    with ui.row().classes("w-full items-center"):
                        with ui.column().classes("grow gap-0"):
                            ui.label(p["name"]).classes("font-bold")
                            ui.label(money(p["price"]) + " · " + str(p["stock"]) + " in stock").style("color:" + MUTED)
                        def edit(_event=None, product=p):
                            editing["pid"] = product["pid"]
                            pname.value, pdesc.value = product["name"], product.get("description") or ""
                            pcat.value, price.value, stock.value = product["category"], product["price"], product["stock"]
                            form_title.text = "Editing: " + product["name"]
                            ui.notify("Product loaded into the form.")
                        def delete(_event=None, product=p):
                            if api("DELETE", "/products/" + str(product["pid"])) is not None:
                                ui.notify("Product deleted.", type="positive")
                                render_admin()
                        ui.button("Edit", on_click=edit, icon="edit").props("outline")
                        ui.button("Delete", on_click=delete, icon="delete").props("flat color=negative")
                    ui.separator()
            ui.label("Order management").classes("text-xl font-bold mt-4")
            orders = api("GET", "/admin/orders") or []
            transitions = {"placed": ["packed", "cancelled"], "packed": ["shipped", "cancelled"], "shipped": ["delivered"], "delivered": [], "cancelled": []}
            for order in orders:
                with ui.card().classes("w-full p-4"):
                    with ui.row().classes("w-full items-center justify-between"):
                        ui.label("Order #" + str(order["oid"]) + " · " + money(order["total"])).classes("font-bold")
                        ui.badge(order["status"].title(), color="purple")
                    choices = transitions.get(order["status"], [])
                    if choices:
                        select = ui.select(choices, value=choices[0], label="Next status").props("outlined")
                        def update_status(_event=None, oid=order["oid"], field=select):
                            if api("PATCH", "/orders/" + str(oid) + "/status", {"status": field.value}) is not None:
                                ui.notify("Order status updated.", type="positive")
                                render_admin()
                        ui.button("Update status", on_click=update_status).props("unelevated")

    def sign_out():
        session["token"], session["role"], cart["items"] = "", "customer", []
        refresh_nav.refresh()
        ui.notify("Signed out.")
        render_shop()

    with ui.header().classes("items-center justify-between px-5 py-3").style("background:" + SURFACE + ";border-bottom:1px solid #3B2B56"):
        with ui.row().classes("items-center gap-2 cursor-pointer") as brand:
            ui.icon("diamond", size="28px").style("color:" + ACCENT)
            ui.label("NEXORA").classes("brand text-2xl font-bold")
            ui.label("STORE").style("color:" + MUTED + ";font-size:10px;letter-spacing:3px")
            brand.on("click", lambda: render_shop())
        @ui.refreshable
        def refresh_nav():
            with ui.row().classes("items-center gap-1"):
                ui.button("Shop", on_click=lambda: render_shop(), icon="storefront").props("flat")
                ui.button("Cart (" + str(sum(x["quantity"] for x in cart["items"])) + ")", on_click=render_cart, icon="shopping_bag").props("flat")
                if session["token"]:
                    ui.button("Account", on_click=render_account, icon="person").props("flat")
                    ui.button("Orders", on_click=render_orders, icon="receipt_long").props("flat")
                    if session["role"] == "admin":
                        ui.button("Admin", on_click=render_admin, icon="admin_panel_settings").props("flat")
                    ui.button("Sign out", on_click=sign_out, icon="logout").props("flat")
                else:
                    ui.button("Sign in", on_click=render_auth, icon="login").props("unelevated")
        refresh_nav()
    with ui.column().classes("w-full max-w-7xl mx-auto px-4 py-5 gap-5"):
        with ui.row().classes("w-full items-center justify-between rounded-2xl p-6 md:p-8").style("background:linear-gradient(115deg,#291D40,#1C1430 58%,#38244E);border:1px solid #493360"):
            with ui.column().classes("gap-2"):
                ui.label("THE NEW STANDARD").style("color:" + ACCENT + ";letter-spacing:3px;font-size:11px;font-weight:700")
                ui.label("Technology. Lifestyle.\nMade yours.").classes("text-3xl md:text-5xl font-bold").style("white-space:pre-line;line-height:1.08")
                ui.label("A connected shopping experience powered by the NEXORA database.").style("color:" + MUTED)
                ui.button("Explore collection", on_click=lambda: render_shop(), icon="arrow_forward").props("unelevated")
            ui.icon("auto_awesome", size="80px").style("color:" + ACCENT + ";opacity:.85")
        content_box = ui.column().classes("w-full gap-4")
        with ui.footer().classes("justify-center").style("background:" + BG + ";color:" + MUTED):
            ui.label("NEXORA · Python NiceGUI · FastAPI · PostgreSQL")
    render_shop()

ui.run(title="NEXORA E-Commerce", host="0.0.0.0", port=int(os.getenv("PORT", "3000")), reload=False, show=False)
