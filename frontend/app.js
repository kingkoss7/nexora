const API = "http://localhost:8000";
const app = document.querySelector("#app");
const navLinks = document.querySelector("#nav-links");
let cart = [];
let renderId = 0;

const token = () => localStorage.getItem("token");
const role = () => localStorage.getItem("role");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2,
}).format(Number(value) || 0);
const errorMessage = (error) => error instanceof Error ? error.message : "The request could not be completed.";

async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(API + path, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = typeof body.detail === "string" ? body.detail
      : Array.isArray(body.detail) ? body.detail.map((item) => item.msg).filter(Boolean).join("; ")
      : `Request failed (${response.status})`;
    if (response.status === 401 && token() && ["Invalid token", "Not authenticated", "User not found"].includes(message)) {
      signOut(false);
    }
    throw new Error(message);
  }
  return response.status === 204 ? undefined : response.json();
}

function signOut(navigate = true) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  cart = [];
  if (navigate) location.hash = "#/shop";
  else location.hash = `#/login?next=${encodeURIComponent(route().path)}`;
}

function route() {
  const raw = location.hash.slice(1) || "/shop";
  const splitAt = raw.indexOf("?");
  return {
    path: splitAt < 0 ? raw : raw.slice(0, splitAt),
    query: new URLSearchParams(splitAt < 0 ? "" : raw.slice(splitAt + 1)),
  };
}

function navigate(path) {
  location.hash = `#${path}`;
}

function safeNext(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/shop";
  const parsed = new URL(value, location.origin);
  return parsed.origin === location.origin && parsed.pathname !== "/login"
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : "/shop";
}

function updateNavigation() {
  navLinks.innerHTML = [
    '<a href="#/shop">Shop</a>',
    token() ? '<a href="#/cart">Cart</a><a href="#/orders">Orders</a><a href="#/account">Account</a>' : "",
    role() === "admin" ? '<a href="#/admin">Admin</a>' : "",
    token() ? '<button type="button" data-action="logout">Sign out</button>' : '<a class="button small-button" href="#/login">Sign in</a>',
  ].join("");
}

function message(text, kind = "error") {
  return `<p role="${kind === "error" ? "alert" : "status"}" class="${kind}">${escapeHtml(text)}</p>`;
}

function productCard(product) {
  return `<article class="panel product-card">
    <span class="category">${escapeHtml(product.category)}</span>
    <h2>${escapeHtml(product.name)}</h2>
    <p class="description">${escapeHtml(product.description || "")}</p>
    <div class="row"><strong>${money(product.price)}</strong>
      <a class="button" href="#/products/${encodeURIComponent(product.pid)}">View product</a></div>
    <p class="small muted">${Number(product.stock)} in stock</p>
  </article>`;
}

async function showShop(id) {
  app.innerHTML = `<section class="storefront-intro">
      <div><p class="eyebrow">NEXORA · TECHNOLOGY MARKETPLACE</p>
        <h1>Technology that moves you forward.</h1>
        <p class="muted">Explore electronics, accessories, and everyday essentials selected for life in motion.</p>
        <button class="button secondary" type="button" data-action="scroll-products">Browse the collection <span aria-hidden="true">↓</span></button>
      </div>
      <div class="intro-mark" aria-hidden="true"><span>N</span><small>BUILT FOR WHAT'S NEXT</small></div>
    </section>
    <section class="storefront-highlights" aria-label="Shopping highlights">
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">✳</span><div><strong>Thoughtfully selected</strong><span>Everyday technology and essentials</span></div></div>
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">₹</span><div><strong>Clear pricing</strong><span>Prices displayed in Indian rupees</span></div></div>
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">↗</span><div><strong>Database connected</strong><span>Browse the live product catalogue</span></div></div>
    </section>
    <div class="section-heading" id="collection-heading"><div><p class="eyebrow">THE COLLECTION</p><h2>Shop products</h2></div>
      <p class="muted">Browse products stored in the NEXORA database.</p></div>
    <div class="toolbar"><input class="field" name="q" aria-label="Search products" placeholder="Search products">
      <select class="field" name="category" aria-label="Category"><option value="">All categories</option></select>
      <select class="field" name="sort" aria-label="Sort products"><option value="name">Name</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div>
    <div id="shop-error"></div><div id="products" class="grid products">Loading products…</div>`;
  const categorySelect = app.querySelector('[name="category"]');
  let categories = [];
  try {
    categories = await api("/categories");
    if (id !== renderId) return;
    categorySelect.insertAdjacentHTML("beforeend", categories.map((category) =>
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(""));
  } catch (error) {
    if (id === renderId) app.querySelector("#shop-error").innerHTML = message(errorMessage(error));
  }
  let timer;
  let searchRequest = 0;
  const load = async () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const requestId = ++searchRequest;
      const params = new URLSearchParams({ size: "100", sort: app.querySelector('[name="sort"]').value });
      const query = app.querySelector('[name="q"]').value.trim();
      const category = categorySelect.value;
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      const list = app.querySelector("#products");
      list.textContent = "Loading products…";
      try {
        const products = await api(`/products?${params}`);
        if (id !== renderId || requestId !== searchRequest) return;
        list.innerHTML = products.length ? products.map(productCard).join("")
          : '<p class="muted">No products match this search.</p>';
      } catch (error) {
        if (id === renderId && requestId === searchRequest) list.innerHTML = message(errorMessage(error));
      }
    }, 120);
  };
  app.querySelector('[name="q"]').addEventListener("input", load);
  categorySelect.addEventListener("change", load);
  app.querySelector('[name="sort"]').addEventListener("change", load);
  load();
}

async function showProduct(id, productId) {
  app.innerHTML = "<p class=muted>Loading product…</p>";
  try {
    const product = await api(`/products/${encodeURIComponent(productId)}`);
    if (id !== renderId) return;
    app.innerHTML = `<a class="muted small" href="#/shop">← Products</a>
      <section class="layout" style="margin-top:1rem">
        <div class="panel empty"><span class="category">${escapeHtml(product.category)}</span><h2>${escapeHtml(product.name)}</h2><p class="muted">${escapeHtml(product.description || "")}</p></div>
        <div class="panel"><h1>${escapeHtml(product.name)}</h1><p>${money(product.price)}</p>
          <p class="muted">${Number(product.stock)} in stock</p>
          <label class="label">Quantity<input class="field" name="quantity" type="number" min="1" max="${Number(product.stock)}" value="1"></label>
          <button class="button" data-action="add-product" data-pid="${Number(product.pid)}" ${product.stock ? "" : "disabled"}>Add to cart</button>
        </div></section><div id="product-error"></div>`;
    app.dataset.product = JSON.stringify(product);
  } catch (error) {
    if (id === renderId) app.innerHTML = message(errorMessage(error));
  }
}

async function showLogin(id, query) {
  if (token()) { navigate("/shop"); return; }
  const registered = query.get("registered") === "1";
  app.innerHTML = `<section class="panel" style="max-width:30rem;margin:auto">
    <h1 id="auth-title">Sign in</h1><p class="muted">Sign in to manage your cart and orders.</p>
    <div id="auth-notice">${registered ? message("Account created successfully. Please sign in.", "success") : ""}</div>
    <form class="form" id="auth-form">
      <label class="label" id="name-field" hidden>Full name<input class="field" name="name" maxlength="150"></label>
      <label class="label">Email address<input class="field" type="email" name="email" autocomplete="email" required></label>
      <label class="label">Password<input class="field" type="password" name="password" minlength="6" required></label>
      <div id="auth-error"></div><button class="button" id="auth-submit">Sign in</button>
      <button class="button secondary" type="button" data-action="toggle-auth">New to NEXORA? Create an account</button>
    </form></section>`;
  app.dataset.next = safeNext(query.get("next"));
}

async function showCart(id) {
  app.innerHTML = "<h1>Shopping cart</h1><p class=muted>Loading cart…</p>";
  try {
    const result = await api("/cart");
    if (id !== renderId) return;
    cart = result.items;
    const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const shipping = subtotal > 0 && subtotal < 100 ? 7.95 : 0;
    app.innerHTML = `<h1>Shopping cart</h1>${cart.length ? `<div class="layout">
      <div class="stack">${cart.map(({ product, quantity }) => `<article class="panel row">
        <div><a href="#/products/${product.pid}"><strong>${escapeHtml(product.name)}</strong></a><p class="small muted">${money(product.price)} each · ${Number(product.stock)} in stock</p></div>
        <div class="quantity"><button class="button secondary small-button" data-action="quantity" data-pid="${product.pid}" data-delta="-1" aria-label="Decrease ${escapeHtml(product.name)}" ${quantity <= 1 ? "disabled" : ""}>−</button>
          <span>${quantity}</span><button class="button secondary small-button" data-action="quantity" data-pid="${product.pid}" data-delta="1" aria-label="Increase ${escapeHtml(product.name)}" ${quantity >= product.stock ? "disabled" : ""}>+</button>
          <button class="button danger small-button" data-action="remove" data-pid="${product.pid}">Remove</button></div>
        <strong>${money(product.price * quantity)}</strong></article>`).join("")}</div>
      <aside class="panel"><h2>Order summary</h2><p class="row">Subtotal <span>${money(subtotal)}</span></p><p class="row">Delivery <span>${shipping ? money(shipping) : "Free"}</span></p>
        <p class="row"><strong>Total</strong><strong>${money(subtotal + shipping)}</strong></p><a class="button" href="#/checkout">Continue to checkout</a></aside></div>` :
      `<div class="panel empty"><p>Your cart is empty.</p><a class="button" href="#/shop">Browse products</a></div>`}
      <div id="cart-error"></div>`;
  } catch (error) {
    if (id === renderId) app.innerHTML = `<h1>Shopping cart</h1>${message(errorMessage(error))}`;
  }
}

async function showCheckout(id) {
  app.innerHTML = "<h1>Checkout</h1><p class=muted>Loading cart…</p>";
  try {
    const result = await api("/cart");
    if (id !== renderId) return;
    cart = result.items;
    if (!cart.length) {
      app.innerHTML = '<div class="panel empty"><p>Your cart is empty.</p><a class="button" href="#/shop">Browse products</a></div>';
      return;
    }
    const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const total = subtotal + (subtotal > 0 && subtotal < 100 ? 7.95 : 0);
    app.innerHTML = `<h1>Checkout</h1><p class="muted">Enter delivery details to place your order.</p>
      <div class="layout"><form class="panel form" id="checkout-form"><div class="form-grid">
        <label class="label span-two">Full name<input class="field" name="recipient_name" maxlength="150" required></label>
        <label class="label">Phone<input class="field" name="phone" maxlength="40" required></label>
        <label class="label">Country code<input class="field" name="country" minlength="2" maxlength="2" placeholder="IN" required></label>
        <label class="label span-two">Street address<input class="field" name="address_line1" maxlength="200" required></label>
        <label class="label span-two">Apartment or suite (optional)<input class="field" name="address_line2" maxlength="200"></label>
        <label class="label">City<input class="field" name="city" maxlength="100" required></label>
        <label class="label">State or region (optional)<input class="field" name="region" maxlength="100"></label>
        <label class="label">Postal code<input class="field" name="postal_code" maxlength="30" required></label>
      </div><p class="small muted">Payment: cash on delivery.</p><div id="checkout-error"></div>
      <button class="button">Place order · ${money(total)}</button></form>
      <aside class="panel"><h2>Order summary</h2><div class="list">${cart.map(({ product, quantity }) => `<p class="row small">${quantity} × ${escapeHtml(product.name)} <span>${money(product.price * quantity)}</span></p>`).join("")}</div>
      <p class="row"><strong>Total</strong><strong>${money(total)}</strong></p></aside></div>`;
  } catch (error) {
    if (id === renderId) app.innerHTML = `<h1>Checkout</h1>${message(errorMessage(error))}`;
  }
}

async function showOrders(id) {
  app.innerHTML = "<h1>Order history</h1><p class=muted>Loading orders…</p>";
  try {
    const orders = await api("/orders");
    if (id !== renderId) return;
    app.innerHTML = `<h1>Order history</h1>${orders.length ? `<div class="stack">${orders.map((order) => `<article class="panel">
      <div class="row"><div><h2>Order #${order.oid}</h2><p class="small muted">${new Date(order.created_at).toLocaleDateString()}</p></div><strong class="category">${escapeHtml(order.status)}</strong></div>
      <div class="list">${order.items.map((item) => `<p class="row small">${item.quantity} × ${escapeHtml(item.product_name)}<span>${money(item.price * item.quantity)}</span></p>`).join("")}</div>
      <p class="row"><strong>Total</strong><strong>${money(order.total)}</strong></p>
      <p class="small muted">Payment: ${escapeHtml(order.payment?.method || "cash_on_delivery")} (${escapeHtml(order.payment?.status || "pending")})</p>
      ${order.delivery_address_line1 ? `<p class="small muted">Delivering to ${escapeHtml(order.delivery_address_line1)}, ${escapeHtml(order.delivery_city)}, ${escapeHtml(order.delivery_country)}</p>` : ""}
      <p class="progress">${order.status === "cancelled" ? "Cancelled" : ["placed","packed","shipped","delivered"].map(escapeHtml).join(" → ")}</p>
    </article>`).join("")}</div>` : '<div class="panel empty">No orders yet. <a class="category" href="#/shop">Browse products</a></div>'}`;
  } catch (error) {
    if (id === renderId) app.innerHTML = `<h1>Order history</h1>${message(errorMessage(error))}`;
  }
}

async function showAccount(id) {
  app.innerHTML = "<h1>Account</h1><p class=muted>Loading account…</p>";
  try {
    const orders = await api("/orders");
    if (id !== renderId) return;
    const spent = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
    app.innerHTML = `<h1>Account</h1><p class="muted">Your account overview.</p>
      <div class="grid products" style="margin-block:1.25rem"><article class="panel"><h2>${orders.length}</h2><p class="muted">Total orders</p></article>
      <article class="panel"><h2>${money(spent)}</h2><p class="muted">Total spent</p></article></div>
      <section class="panel"><div class="row"><h2>Recent orders</h2><a class="category" href="#/orders">View all</a></div>
      ${orders.slice(0, 5).map((order) => `<p class="list-item">Order #${order.oid} · ${escapeHtml(order.status)} <span>${money(order.total)}</span></p>`).join("") || '<p class="muted">No orders yet.</p>'}</section>`;
  } catch (error) {
    if (id === renderId) app.innerHTML = `<h1>Account</h1>${message(errorMessage(error))}`;
  }
}

async function showAdmin(id) {
  app.innerHTML = "<h1>Administration</h1><p class=muted>Loading products and orders…</p>";
  try {
    const [products, orders] = await Promise.all([api("/products?size=100"), api("/admin/orders")]);
    if (id !== renderId) return;
    app.innerHTML = `<h1>Administration</h1><p class="muted">Manage products, inventory and order status.</p>
      <section class="panel" style="margin-block:1rem"><h2 id="product-form-title">Add product</h2>
        <form id="product-form" class="form form-grid"><input type="hidden" name="pid">
          <label class="label">Name<input class="field" name="name" maxlength="200" required></label>
          <label class="label">Category<input class="field" name="category" maxlength="100" required value="general"></label>
          <label class="label span-two">Description<textarea class="field" name="description" maxlength="2000"></textarea></label>
          <label class="label">Price<input class="field" name="price" type="number" min="0" step="0.01" required></label>
          <label class="label">Stock<input class="field" name="stock" type="number" min="0" step="1" required></label>
          <div class="span-two row"><button class="button" id="product-submit">Add product</button><button class="button secondary" type="button" data-action="cancel-edit" hidden>Cancel</button></div>
        </form><div id="admin-error"></div></section>
      <section class="panel"><h2>Products</h2><div class="list">${products.map((product) => `<div class="list-item">
        <span>${escapeHtml(product.name)} · ${money(product.price)} · ${Number(product.stock)} in stock</span>
        <span class="row"><button class="button secondary small-button" data-action="edit-product" data-pid="${product.pid}">Edit</button>
          <button class="button danger small-button" data-action="delete-product" data-pid="${product.pid}">Delete</button></span></div>`).join("") || '<p class="muted">No products found.</p>'}</div></section>
      <section class="panel" style="margin-top:1rem"><h2>Orders</h2><div class="list">${orders.map((order) => {
        const allowed = { placed: ["packed","cancelled"], packed: ["shipped","cancelled"], shipped: ["delivered"] }[order.status] || [];
        return `<div class="list-item"><span>Order #${order.oid} · ${money(order.total)} · ${escapeHtml(order.status)}</span>
          ${allowed.length ? `<select class="field" style="width:auto" aria-label="Update order ${order.oid}" data-action="status" data-oid="${order.oid}">
            <option value="">Choose status</option>${allowed.map((status) => `<option value="${status}">${status}</option>`).join("")}</select>` : ""}</div>`;
      }).join("") || '<p class="muted">No orders found.</p>'}</div></section>`;
    app.dataset.products = JSON.stringify(products);
  } catch (error) {
    if (id === renderId) app.innerHTML = `<h1>Administration</h1>${message(errorMessage(error))}`;
  }
}

async function render() {
  const id = ++renderId;
  const current = route();
  updateNavigation();
  if (["/cart", "/checkout", "/account", "/orders", "/admin"].includes(current.path) && !token()) {
    navigate(`/login?next=${encodeURIComponent(current.path)}`);
    return;
  }
  if (current.path === "/admin" && role() !== "admin") {
    navigate("/shop");
    return;
  }
  if (current.path === "/shop" || current.path === "/") return showShop(id);
  if (current.path === "/login") return showLogin(id, current.query);
  if (current.path === "/cart") return showCart(id);
  if (current.path === "/checkout") return showCheckout(id);
  if (current.path === "/orders") return showOrders(id);
  if (current.path === "/account") return showAccount(id);
  if (current.path === "/admin") return showAdmin(id);
  const match = current.path.match(/^\/products\/(\d+)$/);
  if (match) return showProduct(id, match[1]);
  navigate("/shop");
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "logout") { signOut(); return; }
  if (action === "scroll-products") {
    app.querySelector("#collection-heading").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "toggle-auth") {
    const form = app.querySelector("#auth-form");
    const registering = form.dataset.register !== "true";
    form.dataset.register = String(registering);
    app.querySelector("#auth-title").textContent = registering ? "Create an account" : "Sign in";
    app.querySelector("#name-field").hidden = !registering;
    app.querySelector("#name-field input").required = registering;
    app.querySelector("#auth-submit").textContent = registering ? "Create account" : "Sign in";
    button.textContent = registering ? "Already registered? Sign in" : "New to NEXORA? Create an account";
    app.querySelector("#auth-error").innerHTML = "";
    return;
  }
  if (action === "add-product") {
    if (!token()) { navigate(`/login?next=${encodeURIComponent(route().path)}`); return; }
    const product = JSON.parse(app.dataset.product);
    const quantity = Math.max(1, Math.min(product.stock, Number(app.querySelector('[name="quantity"]').value)));
    try {
      const current = await api("/cart");
      const lines = current.items.map((line) => ({ ...line }));
      const line = lines.find((item) => item.product.pid === product.pid);
      if (line) line.quantity = Math.min(line.quantity + quantity, product.stock);
      else lines.push({ product, quantity });
      await api("/cart", { method: "PUT", body: JSON.stringify({ items: lines.map((item) => ({ product_pid: item.product.pid, quantity: item.quantity })) }) });
      navigate("/cart");
    } catch (error) { app.querySelector("#product-error").innerHTML = message(errorMessage(error)); }
    return;
  }
  if (action === "quantity" || action === "remove") {
    const pid = Number(button.dataset.pid);
    const delta = action === "remove" ? 0 : Number(button.dataset.delta);
    const lines = cart.map((line) => ({ ...line })).flatMap((line) => {
      if (line.product.pid !== pid) return [line];
      const quantity = action === "remove" ? 0 : line.quantity + delta;
      return quantity > 0 ? [{ ...line, quantity: Math.min(quantity, line.product.stock) }] : [];
    });
    try {
      await api("/cart", { method: "PUT", body: JSON.stringify({ items: lines.map((line) => ({ product_pid: line.product.pid, quantity: line.quantity })) }) });
      await render();
    } catch (error) { app.querySelector("#cart-error").innerHTML = message(errorMessage(error)); }
    return;
  }
  if (action === "cancel-edit") {
    app.querySelector("#product-form").reset();
    app.querySelector('[name="pid"]').value = "";
    app.querySelector('[name="category"]').value = "general";
    app.querySelector("#product-form-title").textContent = "Add product";
    app.querySelector("#product-submit").textContent = "Add product";
    button.hidden = true;
  }
  if (action === "edit-product") {
    const product = JSON.parse(app.dataset.products).find((item) => item.pid === Number(button.dataset.pid));
    const form = app.querySelector("#product-form");
    for (const key of ["pid", "name", "description", "category", "price", "stock"]) form.elements[key].value = product[key] ?? "";
    app.querySelector("#product-form-title").textContent = "Edit product";
    app.querySelector("#product-submit").textContent = "Save changes";
    app.querySelector('[data-action="cancel-edit"]').hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (action === "delete-product") {
    if (!confirm("Delete this product?")) return;
    try { await api(`/products/${button.dataset.pid}`, { method: "DELETE" }); await render(); }
    catch (error) { app.querySelector("#admin-error").innerHTML = message(errorMessage(error)); }
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  event.preventDefault();
  if (form.id === "auth-form") {
    const values = Object.fromEntries(new FormData(form));
    const registering = form.dataset.register === "true";
    const submitButton = app.querySelector("#auth-submit");
    submitButton.disabled = true;
    try {
      const result = await api(registering ? "/auth/register" : "/auth/login", {
        method: "POST", body: JSON.stringify(values),
      });
      if (registering) {
        navigate(`/login?registered=1&next=${encodeURIComponent(app.dataset.next || "/shop")}`);
      } else {
        localStorage.setItem("token", result.access_token);
        localStorage.setItem("role", result.role);
        navigate(safeNext(app.dataset.next));
      }
    } catch (error) { app.querySelector("#auth-error").innerHTML = message(errorMessage(error)); }
    finally { submitButton.disabled = false; }
    return;
  }
  if (form.id === "checkout-form") {
    const address = Object.fromEntries(new FormData(form));
    address.country = address.country.trim().toUpperCase();
    const submitButton = form.querySelector('button[type="submit"], button:not([type])');
    submitButton.disabled = true;
    try {
      await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map(({ product, quantity }) => ({ product_pid: product.pid, quantity })),
          address,
        }),
      });
      await api("/cart", { method: "PUT", body: JSON.stringify({ items: [] }) });
      cart = [];
      app.innerHTML = '<section class="panel empty"><h1>Order placed.</h1><p class="muted">Your order is confirmed. Payment is due on delivery.</p><a class="button" href="#/orders">View your orders</a></section>';
    } catch (error) { app.querySelector("#checkout-error").innerHTML = message(errorMessage(error)); }
    finally { if (submitButton.isConnected) submitButton.disabled = false; }
    return;
  }
  if (form.id === "product-form") {
    const values = Object.fromEntries(new FormData(form));
    const pid = values.pid;
    delete values.pid;
    values.price = Number(values.price);
    values.stock = Number(values.stock);
    const submitButton = app.querySelector("#product-submit");
    submitButton.disabled = true;
    try {
      await api(pid ? `/products/${pid}` : "/products", {
        method: pid ? "PUT" : "POST", body: JSON.stringify(values),
      });
      await render();
    } catch (error) { app.querySelector("#admin-error").innerHTML = message(errorMessage(error)); }
    finally { if (submitButton.isConnected) submitButton.disabled = false; }
  }
});

document.addEventListener("change", async (event) => {
  const select = event.target.closest('[data-action="status"]');
  if (!select || !select.value) return;
  select.disabled = true;
  try {
    await api(`/orders/${select.dataset.oid}/status`, {
      method: "PATCH", body: JSON.stringify({ status: select.value }),
    });
    await render();
  } catch (error) { app.querySelector("#admin-error").innerHTML = message(errorMessage(error)); }
  finally { if (select.isConnected) select.disabled = false; }
});

window.addEventListener("hashchange", render);
render();
