const API = "http://localhost:8000";
const app = document.querySelector("#app");
const navLinks = document.querySelector("#nav-links");
let cart = [];
let renderId = 0;
let cartNavigationError = false;

const token = () => localStorage.getItem("token");
const role = () => localStorage.getItem("role");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", minimumFractionDigits: 2,
}).format(Number(value) || 0);
const PRODUCT_IMAGES = {
  1: "photo-1496181133206-80ce9b88a853",
  2: "photo-1505740420928-5e560c06d30e",
  3: "photo-1587829741301-dc798b83add3",
  4: "photo-1542291026-7eec264c27ff",
  5: "photo-1551028719-00167b16eac5",
  6: "photo-1495474472287-4d71bcdd2085",
  7: "photo-1507473885765-e6ed057f782c",
  8: "photo-1553062407-98eeb64c6a62",
  9: "photo-1523275335684-37898b6baf30",
  10: "photo-1523170335258-f5ed11844a49",
  11: "photo-1511707171634-5f897ff02aa9",
  12: "photo-1544244015-0df4b3ffc6b0",
  13: "photo-1516035069371-29a1b244cc32",
  14: "photo-1608043152269-423dbba4e7e1",
  15: "photo-1606220945770-b5b6c2c55bf1",
  16: "photo-1609091839311-d5365f9ff1c5",
  17: "photo-1583863788434-e58a36330cf0",
};
const CATEGORY_IMAGES = {
  electronics: "photo-1496181133206-80ce9b88a853",
  fashion: "photo-1553062407-98eeb64c6a62",
  home: "photo-1495474472287-4d71bcdd2085",
  accessories: "photo-1523170335258-f5ed11844a49",
};
const errorMessage = (error) => error instanceof Error ? error.message : "The request could not be completed.";
const productImage = (product) => {
  const photo = PRODUCT_IMAGES[product.pid] || CATEGORY_IMAGES[String(product.category).toLowerCase()] || CATEGORY_IMAGES.electronics;
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=85`;
};

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
  cartNavigationError = false;
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

function navigationIcon(name) {
  const paths = {
    shop: '<path d="M3 10h18M5 10v10h14V10M3 10l2-6h14l2 6M9 20v-6h6v6"/>',
    cart: '<path d="M5 8h14l1 13H4L5 8Zm4 0a3 3 0 0 1 6 0"/>',
    orders: '<path d="M6 3h12v18l-6-3-6 3V3Zm3 5h6m-6 4h6"/>',
    account: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    admin: '<path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Zm-3 9 2 2 4-4"/>',
  };
  return `<svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}

function activeNavigationSection(path) {
  if (path === "/" || path === "/shop" || path.startsWith("/products/")) return "shop";
  if (path === "/cart" || path === "/checkout") return "cart";
  if (path === "/orders") return "orders";
  if (path === "/account") return "account";
  if (path === "/admin") return "admin";
  return "";
}

function updateNavigation(path = route().path) {
  const active = activeNavigationSection(path);
  const link = (section, label, href, detail = "") => `
    <a href="${href}" data-nav="${section}"${active === section ? ' aria-current="page" class="is-active"' : ""}>
      ${navigationIcon(section)}<span>${label}</span>${detail}</a>`;
  const cartQuantity = cart.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const cartBadge = cartNavigationError
    ? '<span class="cart-count cart-count-error" aria-label="Cart count unavailable" title="Cart count unavailable">!</span>'
    : `<span class="cart-count" aria-label="${cartQuantity} ${cartQuantity === 1 ? "item" : "items"}">${cartQuantity}</span>`;
  navLinks.innerHTML = [
    link("shop", "Shop", "#/shop"),
    token() ? [
      link("cart", "Cart", "#/cart", cartBadge),
      link("orders", "Orders", "#/orders"),
      link("account", "Account", "#/account"),
    ].join("") : "",
    role() === "admin" ? link("admin", "Admin", "#/admin") : "",
    token() ? '<button type="button" data-action="logout">Sign out</button>' : '<a class="button small-button" href="#/login">Sign in</a>',
  ].join("");
}

async function refreshCartNavigation(path, id) {
  try {
    const result = await api("/cart");
    if (id !== renderId) return;
    cart = result.items;
    cartNavigationError = false;
  } catch (error) {
    if (id !== renderId) return;
    cartNavigationError = true;
    console.error("Unable to load cart count:", error);
  }
  updateNavigation(path);
}

function message(text, kind = "error") {
  return `<p role="${kind === "error" ? "alert" : "status"}" class="${kind}">${escapeHtml(text)}</p>`;
}

function productCard(product) {
  return `<article class="panel product-card">
    <div class="product-art"><img class="product-photo" src="${productImage(product)}" alt="${escapeHtml(product.name)}" loading="lazy">
      <span class="art-index">NEXORA · NO. ${String(product.pid).padStart(2, "0")}</span></div>
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
      <div class="intro-art" id="featured-art" aria-label="Featured luxury watch">
        <span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span>
        <span class="art-glow"></span><span class="intro-monogram">NX</span>
        <span class="edition-tag">OBJECTS FOR<br>THE MODERN ERA</span>
        <span class="intro-caption">NEXORA · EST. 2026</span>
      </div>
    </section>
    <section class="storefront-highlights" aria-label="Shopping highlights">
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">✳</span><div><strong>Thoughtfully selected</strong><span>Everyday technology and essentials</span></div></div>
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">₹</span><div><strong>Clear pricing</strong><span>Prices displayed in Indian rupees</span></div></div>
      <div class="highlight-item"><span class="highlight-icon" aria-hidden="true">↗</span><div><strong>Made for every day</strong><span>Thoughtful picks for work, home, and play</span></div></div>
    </section>
    <div class="section-heading" id="collection-heading"><div><p class="eyebrow">THE COLLECTION</p><h2>Shop products</h2></div>
      <p class="muted">Find something you'll love.</p></div>
    <div class="toolbar"><input class="field" name="q" aria-label="Search products" placeholder="Search products">
      <select class="field" name="category" aria-label="Category"><option value="">All categories</option></select>
      <select class="field" name="sort" aria-label="Sort products"><option value="name">Name</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></div>
    <div id="shop-error"></div><div id="products" class="grid products">Loading products…</div>`;
  const categorySelect = app.querySelector('[name="category"]');
  try {
    const [categories, catalog] = await Promise.all([
      api("/categories"),
      api("/products?size=100&sort=price_desc"),
    ]);
    if (id !== renderId) return;
    const featured = catalog.find((product) => /\bwatch\b/i.test(product.name));
    if (featured) {
      app.querySelector("#featured-art").innerHTML = `<img class="featured-photo" src="${productImage(featured)}" alt="${escapeHtml(featured.name)}">
        <div class="featured-shade"></div><span class="featured-badge">THE EDITOR'S PICK</span>
        <a class="featured-product" href="#/products/${encodeURIComponent(featured.pid)}">
          <span><small>THE TIMELESS ONE</small><strong>${escapeHtml(featured.name)}</strong></span>
          <span class="featured-price">${money(featured.price)} <i aria-hidden="true">↗</i></span>
        </a>`;
    }
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
      if (id !== renderId) return;
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
    app.innerHTML = `<a class="back-link" href="#/shop"><span aria-hidden="true">←</span> Back to collection</a>
      <section class="layout product-detail-layout">
        <div class="panel detail-art"><img class="detail-photo" src="${productImage(product)}" alt="${escapeHtml(product.name)}">
          <span class="art-label">${escapeHtml(product.category)}</span>
          <span class="art-index">NEXORA · NO. ${String(product.pid).padStart(2, "0")}</span>
        </div>
        <div class="panel product-detail"><p class="eyebrow">A NEXORA OBJECT</p>
          <span class="category">${escapeHtml(product.category)}</span><h1>${escapeHtml(product.name)}</h1>
          <p class="detail-description">${escapeHtml(product.description || "")}</p>
          <p class="detail-price">${money(product.price)}</p>
          <p class="detail-stock">${Number(product.stock) > 0 ? `${Number(product.stock)} available` : "Currently unavailable"}</p>
          <label class="label">Quantity<input class="field" name="quantity" type="number" min="1" max="${Number(product.stock)}" value="1"></label>
          <button class="button" data-action="add-product" data-pid="${Number(product.pid)}" ${product.stock ? "" : "disabled"}>Add to cart</button>
          <p class="detail-note">Secure checkout <span>·</span> Cash on delivery</p>
        </div></section><div id="product-error"></div>`;
    app.dataset.product = JSON.stringify(product);
  } catch (error) {
    if (id === renderId) app.innerHTML = message(errorMessage(error));
  }
}

async function showLogin(id, query) {
  if (token()) { navigate("/shop"); return; }
  const registered = query.get("registered") === "1";
  app.innerHTML = `<section class="auth-shell">
    <div class="auth-editorial"><p class="eyebrow"><span class="eyebrow-dot"></span> THE NEXORA EXPERIENCE</p>
      <h1>Make room for<br><em>the remarkable.</em></h1>
      <p class="muted">A considered collection of objects for a life well lived.</p>
      <div class="auth-seal" aria-hidden="true"><span>NX</span><small>EST. 2026</small></div>
      <p class="auth-footnote">THOUGHTFULLY SELECTED <i>·</i> DISTINCTIVELY YOURS</p>
    </div>
    <div class="panel auth-panel"><p class="eyebrow">MEMBER ACCESS</p><h2 id="auth-title">Welcome back</h2>
      <p class="muted auth-subtitle">Sign in to continue to your account.</p>
      <div id="auth-notice">${registered ? message("Account created successfully. Please sign in.", "success") : ""}</div>
      <form class="form" id="auth-form">
        <label class="label" id="name-field" hidden>Full name<input class="field" name="name" maxlength="150" autocomplete="name"></label>
        <label class="label">Email address<input class="field" type="email" name="email" autocomplete="email" placeholder="you@example.com" required></label>
        <label class="label">Password<input class="field" type="password" name="password" minlength="6" autocomplete="current-password" placeholder="Enter your password" required></label>
        <div id="auth-error"></div><button class="button" id="auth-submit">Sign in <span aria-hidden="true">↗</span></button>
        <div class="auth-divider"><span>NEW TO NEXORA</span></div>
        <button class="button secondary auth-toggle" type="button" data-action="toggle-auth">Create an account</button>
      </form>
      <p class="auth-privacy">Your account details are securely protected.</p>
    </div>
  </section>`;
  app.dataset.next = safeNext(query.get("next"));
}

async function showCart(id) {
  app.innerHTML = "<h1>Shopping cart</h1><p class=muted>Loading cart…</p>";
  try {
    const result = await api("/cart");
    if (id !== renderId) return;
    cart = result.items;
    cartNavigationError = false;
    updateNavigation(route().path);
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
    if (id === renderId) {
      cartNavigationError = true;
      updateNavigation(route().path);
      app.innerHTML = `<h1>Shopping cart</h1>${message(errorMessage(error))}`;
    }
  }
}

async function showCheckout(id) {
  app.innerHTML = "<h1>Checkout</h1><p class=muted>Loading cart…</p>";
  try {
    const result = await api("/cart");
    if (id !== renderId) return;
    cart = result.items;
    cartNavigationError = false;
    updateNavigation(route().path);
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
    if (id === renderId) {
      cartNavigationError = true;
      updateNavigation(route().path);
      app.innerHTML = `<h1>Checkout</h1>${message(errorMessage(error))}`;
    }
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
  updateNavigation(current.path);
  if (token() && !["/cart", "/checkout"].includes(current.path)) {
    void refreshCartNavigation(current.path, id);
  }
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
      cartNavigationError = false;
      updateNavigation(route().path);
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
