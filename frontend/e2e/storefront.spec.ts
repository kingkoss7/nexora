import { expect, test } from "@playwright/test";

test("NEXORA storefront and account link open sign-in", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/NEXORA/i);
  await expect(page.getByRole("link", { name: "NEXORA home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Technology that moves you forward." })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back." }).locator("..")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("© 2026 NEXORA. All rights reserved.")).toBeVisible();
});

test("account creation collects a name, confirms success, then signs in", async ({ page }) => {
  await page.goto("/login?next=%2Fcart");
  await page.getByRole("button", { name: "New to NEXORA? Create an account" }).click();
  await page.getByLabel("Full name").fill("NEXORA Customer");
  await page.getByLabel("Email address").fill("customer@example.com");
  await page.getByLabel("Password").fill("secure-password");

  let registration: unknown;
  await page.route("**/auth/register", async (route) => {
    registration = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ message: "Account created successfully" }),
    });
  });
  await page.getByRole("button", { name: "Create your account" }).click();
  await expect(page.getByRole("status")).toContainText("Account created successfully");
  await expect(page).toHaveURL(/\/login\?registered=1&next=%2Fcart$/);
  expect(registration).toEqual({
    name: "NEXORA Customer",
    email: "customer@example.com",
    password: "secure-password",
  });

  await page.route("**/auth/login", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ access_token: "test-token", role: "customer" }),
  }));
  await page.route("**/cart", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/wishlist", (route) => route.fulfill({ json: { items: [] } }));
  await page.getByLabel("Password").fill("secure-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBe("test-token");
  await expect(page.getByRole("link", { name: "My account" })).toBeVisible();

  await page.route("**/orders", (route) => route.fulfill({ json: [] }));
  await page.route("**/addresses", (route) => route.fulfill({ json: [] }));
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("product save and add-to-cart controls require sign-in", async ({ page }) => {
  await page.route("**/products*", (route) => route.fulfill({
    json: [{
      pid: 1,
      name: "Sample Headphones",
      description: "A test product.",
      category: "electronics",
      price: 49,
      stock: 4,
      festival_discount_percent: 20,
      festival_price: 39.2,
    }],
  }));
  await page.goto("/");
  await page.locator("#shop").getByRole("link", { name: "View Sample Headphones" }).waitFor();
  await expect(page.locator("#shop").getByText("₹39.20")).toBeVisible();
  await expect(page.locator("#shop").getByText("₹49.00")).toBeVisible();
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/");

  await page.goto("/");
  const productCard = page.locator("article.product-card").first();
  await productCard.hover();
  await productCard.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/");
});

test("guests can view product details but need sign-in for wishlist and cart", async ({ page }) => {
  const product = {
    pid: 1,
    name: "Sample Headphones",
    description: "A test product.",
    category: "electronics",
    price: 49,
    stock: 4,
    festival_discount_percent: 20,
    festival_price: 39.2,
  };
  await page.route("**/products/1", (route) => route.request().resourceType() === "document"
    ? route.continue()
    : route.fulfill({ json: product }));
  await page.route("**/products?*", (route) => route.fulfill({ json: [product] }));

  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "Sample Headphones" })).toBeVisible();
  await expect(page.getByText("A test product.").first()).toBeVisible();
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/products/1");

  await page.goto("/products/1");
  await page.getByRole("button", { name: /Add to Cart/ }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/products/1");
});

test("shopping actions require sign-in and mobile navigation opens the shop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Technology that moves you forward." })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe("/account");

  for (const path of ["/wishlist", "/cart", "/checkout"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    expect(new URL(page.url()).searchParams.get("next")).toBe(path);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Shop", exact: true }).click();
  await expect(page).toHaveURL(/\/shop$/);
});

test("shop pagination works on mobile without motion or horizontal overflow", async ({ page }) => {
  const products = Array.from({ length: 15 }, (_, index) => ({
    pid: index + 1,
    name: `Product ${index + 1}`,
    description: "A test product.",
    category: "electronics",
    price: 100 + index,
    stock: 8,
    festival_discount_percent: 20,
    festival_price: (100 + index) * 0.8,
  }));
  await page.route("**/products?*", (route) => route.fulfill({ json: products }));
  await page.route("**/categories", (route) => route.fulfill({ json: ["electronics"] }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop");

  await expect(page.getByRole("link", { name: "View Product 1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Product 13", exact: true })).toHaveCount(0);
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  const cardMotion = await page.locator(".product-card").first().evaluate((card) => {
    const style = getComputedStyle(card);
    return { animationName: style.animationName, transitionDuration: style.transitionDuration };
  });

  expect(cardMotion).toEqual({ animationName: "none", transitionDuration: "0s" });

  const pages = page.getByRole("navigation", { name: "Product pages" });
  await pages.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Product 13", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Product 1", exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("the mobile homepage does not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("unknown routes render not found instead of redirecting guests to sign-in", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page).toHaveURL(/\/this-page-does-not-exist$/);
  await expect(page.getByText("This page could not be found.", { exact: false })).toBeVisible();
});

test("invalid persisted cart and wishlist data does not break the storefront", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cart", "{invalid-json");
    localStorage.setItem("wishlist", JSON.stringify({ invalid: true }));
  });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Technology that moves you forward." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cart, 0 items" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Wishlist, 0 saved" })).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("cart", JSON.stringify([null, { product: null, quantity: 2 }]));
    window.dispatchEvent(new Event("nexora-cart-change"));
  });
  await expect(page.getByRole("button", { name: "Cart, 0 items" })).toBeVisible();
  await page.getByRole("button", { name: "Cart, 0 items" }).click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("checkout validates delivery details and submits a server-priced order", async ({ page }) => {
  const product = {
    pid: 42,
    name: "Test Headphones",
    description: "Checkout test item.",
    category: "electronics",
    price: 0.1,
    stock: 5,
    festival_discount_percent: 20,
    festival_price: 0.08,
  };
  let orderRequest: { items: { product_pid: number; quantity: number }[]; address: Record<string, string> } | undefined;
  await page.addInitScript((cartProduct) => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "customer");
    localStorage.setItem("cart", JSON.stringify([{ product: cartProduct, quantity: 2 }]));
  }, product);
  let serverCart = { items: [{ product, quantity: 1 }] };
  await page.route("**/cart", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: serverCart });
      return;
    }
    const request = route.request().postDataJSON() as { items: { product_pid: number; quantity: number }[] };
    serverCart = {
      items: request.items.map((item) => ({ product, quantity: item.quantity })),
    };
    await route.fulfill({ json: serverCart });
  });
  await page.route("**/addresses", (route) => route.fulfill({ json: [] }));
  await page.route("**/orders", async (route) => {
    if (route.request().method() === "POST") {
      orderRequest = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          oid: 99,
          total: 8.19,
          status: "placed",
          created_at: new Date().toISOString(),
          items: [{ product_name: product.name, quantity: 3, price: 0.08 }],
          delivery_recipient_name: "Test Shopper",
          delivery_phone: "1234567890",
          delivery_address_line1: "1 Test Street",
          delivery_address_line2: null,
          delivery_city: "Test City",
          delivery_region: null,
          delivery_postal_code: "12345",
          delivery_country: "US",
          payment: { method: "cash_on_delivery", status: "pending", amount: 8.19 },
        }),
      });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.goto("/checkout");
  await expect(page.getByText("3 × Test Headphones")).toBeVisible();
  await expect(page.getByText("₹8.19", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add delivery details" }).click();
  await page.getByLabel("Full name").fill("Test Shopper");
  await page.getByLabel("Phone").fill("1234567890");
  await page.getByLabel("Street address").fill("1 Test Street");
  await page.getByLabel("City").fill("Test City");
  await page.getByLabel("Postal code").fill("12345");
  await page.getByLabel("Country code (2 letters)").fill("us");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  await expect(page.getByText("Cash on delivery")).toBeVisible();
  await page.getByRole("button", { name: /Place order/ }).click();

  await expect(page.getByRole("heading", { name: "Order placed." })).toBeVisible();
  expect(orderRequest).toEqual({
    items: [{ product_pid: product.pid, quantity: 3 }],
    address: {
      label: "Home",
      recipient_name: "Test Shopper",
      phone: "1234567890",
      address_line1: "1 Test Street",
      address_line2: "",
      city: "Test City",
      region: "",
      postal_code: "12345",
      country: "US",
    },
  });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cart"))).toBe("[]");
});

test("signed-in shoppers can sync wishlist and cart changes", async ({ page }) => {
  const product = {
    pid: 73,
    name: "Saved Headphones",
    description: "A saved test product.",
    category: "electronics",
    price: 150,
    stock: 4,
    festival_discount_percent: 20,
    festival_price: 120,
  };
  let cartUpdate: { items: { product_pid: number; quantity: number }[] } | undefined;
  await page.addInitScript(() => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("role", "customer");
  });
  await page.route("**/products*", (route) => route.fulfill({ json: [product] }));
  await page.route("**/categories", (route) => route.fulfill({ json: ["electronics"] }));
  await page.route("**/wishlist", (route) => route.fulfill({ json: { items: [] } }));
  await page.route("**/wishlist/73", (route) => route.fulfill({ status: 204 }));
  await page.route("**/cart", async (route) => {
    if (route.request().method() === "PUT") cartUpdate = route.request().postDataJSON();
    await route.fulfill({ json: { items: [] } });
  });

  await page.goto("/");
  const card = page.locator("article.product-card").filter({ hasText: "Saved Headphones" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("link", { name: "Wishlist, 1 saved" })).toBeVisible();
  await card.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByRole("button", { name: "Cart, 1 items" })).toBeVisible();

  await page.getByRole("button", { name: "Cart, 1 items" }).click();
  const drawer = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(drawer.getByText("Saved Headphones")).toBeVisible();
  await drawer.getByRole("button", { name: "Increase" }).click();
  await expect(drawer.getByText("2", { exact: true })).toBeVisible();
  await expect.poll(() => cartUpdate?.items).toEqual([{ product_pid: 73, quantity: 2 }]);
});
