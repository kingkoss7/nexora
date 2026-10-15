export const API = process.env.NEXT_PUBLIC_API || "http://localhost:8000";
export type Product = {
  pid: number; name: string; description: string; category: string; price: number; stock: number;
  festival_discount_percent: number; festival_price: number;
};
export type CartLine = { product: Product; quantity: number };
export type SavedAddress = {
  address_id: number; label: string | null; recipient_name: string; phone: string; address_line1: string;
  address_line2: string | null; city: string; region: string | null; postal_code: string;
  country: string; is_default: boolean;
};
export type ToastTone = "success" | "info";
export function notify(message: string, tone: ToastTone = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nexora-toast", { detail: { message, tone } }));
  }
}
const productPhotos: Record<string, string> = {
  laptop: "1498049794561-7780e7231661",
  headphones: "1505740420928-5e560c06d30e",
  keyboard: "1517336714731-489689fd1ca8",
  smartwatch: "1546868871-7041f2a55e12",
  watch: "1636639818651-d97365346a5c",
  smartphone: "1511707171634-5f897ff02aa9",
  phone: "1511707171634-5f897ff02aa9",
  tablet: "1544244015-0df4b3ffc6b0",
  camera: "1516035069371-29a1b244cc32",
  speaker: "1608043152269-423dbba4e7e1",
  earbuds: "1606220945770-b5b6c2c55bf1",
  power: "1609091839311-d5365f9ff1c5",
  shoes: "1542291026-7eec264c27ff",
  jacket: "1551028719-00167b16eac5",
  coffee: "1495474472287-4d71bcdd2085",
  lamp: "1507473885765-e6ed057f782c",
  backpack: "1553062407-98eeb64c6a62",
};
const readStoredValue = (key: string): unknown => {
  try {
    const value = ls()?.getItem(key);
    return value ? JSON.parse(value) as unknown : [];
  } catch {
    return [];
  }
};
export const productImage = (p: Product) => {
  const search = `${p.name} ${p.category}`.toLowerCase();
  if (/\b(samsung|galaxy)\b/.test(search)) {
    return "https://upload.wikimedia.org/wikipedia/commons/b/bd/Samsung-Galaxy-A32-2021.jpg";
  }
  if (/\b(iphone|i-phone)\b/.test(search)) {
    return "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/IPhone_7_Plus_Rose_Gold_128GB_04.jpg/960px-IPhone_7_Plus_Rose_Gold_128GB_04.jpg";
  }
  const photo = Object.entries(productPhotos).find(([keyword]) => search.includes(keyword))?.[1]
    ?? (p.category === "fashion" ? "1523275335684-37898b6baf30" : p.category === "home" ? "1490312278390-ab64016e0aa9" : "1498049794561-7780e7231661");
  return `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=960&q=85`;
};
export const getWishlist = (): number[] => {
  const stored = readStoredValue("wishlist");
  return Array.isArray(stored)
    ? [...new Set(stored.filter((pid): pid is number => Number.isSafeInteger(pid) && pid > 0))]
    : [];
};
export const saveWishlist = (items: number[]) => {
  ls()?.setItem("wishlist", JSON.stringify(items));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nexora-wishlist-change"));
};
export const toggleWishlist = (pid: number) => {
  if (!requireAuthentication("save favorites")) return false;
  const items = getWishlist();
  const next = items.includes(pid) ? items.filter((item) => item !== pid) : [...items, pid];
  saveWishlist(next);
  const added = next.includes(pid);
  if (getToken()) {
    wishlistSyncQueue = wishlistSyncQueue.catch(() => undefined).then(async () => {
      await api(`/wishlist/${pid}`, { method: added ? "PUT" : "DELETE" });
    }).catch((error: unknown) => {
      notify(error instanceof Error ? `Your favorites could not be saved: ${error.message}` : "Your favorites could not be saved.", "info");
    });
  }
  notify(added ? "Added to wishlist" : "Removed from wishlist", added ? "success" : "info");
  return added;
};

const ls = () => (typeof window === "undefined" ? null : window.localStorage);
export const getToken = () => ls()?.getItem("token") ?? null;
export const getRole = () => ls()?.getItem("role") ?? null;
const CART_SYNC_BASELINE = "cart-sync-baseline";
const notifyAuthChange = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nexora-auth-change"));
};
export const setAuth = (t: string, r: string) => {
  ls()?.removeItem(CART_SYNC_BASELINE);
  ls()?.setItem("token", t);
  ls()?.setItem("role", r);
  notifyAuthChange();
};
export const logout = () => {
  ls()?.removeItem("token");
  ls()?.removeItem("role");
  ls()?.removeItem(CART_SYNC_BASELINE);
  notifyAuthChange();
};
export function getPostLoginPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) return "/";
  const destination = new URL(next, window.location.origin);
  return destination.origin === window.location.origin && destination.pathname !== "/login"
    ? `${destination.pathname}${destination.search}${destination.hash}`
    : "/";
}

function requireAuthentication(action: string) {
  if (getToken()) return true;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  notify(`Sign in to ${action}.`, "info");
  window.location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
  return false;
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API) {
    throw new Error("The API is not configured. Set NEXT_PUBLIC_API to your deployed FastAPI URL.");
  }
  const token = getToken();
  const res = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = typeof err.detail === "string" ? err.detail : "Request failed";
    if (res.status === 401 && token && ["Invalid token", "Not authenticated", "User not found"].includes(detail)) {
      logout();
      notify("Your session expired. Please sign in again.", "info");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
      }
    }
    throw new Error(detail);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const getCart = (): CartLine[] => {
  const stored = readStoredValue("cart");
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((line): CartLine[] => {
    if (!line || typeof line !== "object") return [];
    const { product, quantity } = line as {
      product?: Partial<Product> & { id?: number };
      quantity?: number;
    };
    if (!product || typeof product !== "object") return [];
    const pid = product.pid ?? product.id;
    if (
      !Number.isSafeInteger(pid) || pid! < 1
      || !Number.isSafeInteger(quantity) || quantity! < 1
      || typeof product.name !== "string"
      || typeof product.category !== "string"
      || typeof product.price !== "number" || !Number.isFinite(product.price) || product.price < 0
      || typeof product.stock !== "number" || !Number.isSafeInteger(product.stock) || product.stock < 0
    ) return [];
    const discount = product.festival_discount_percent;
    const festivalPrice = product.festival_price;
    return [{
      product: {
        pid: pid!,
        name: product.name,
        description: typeof product.description === "string" ? product.description : "",
        category: product.category,
        price: product.price,
        stock: product.stock,
        festival_discount_percent: typeof discount === "number" && Number.isFinite(discount) && discount >= 0 ? discount : 20,
        festival_price: typeof festivalPrice === "number" && Number.isFinite(festivalPrice) && festivalPrice >= 0
          ? festivalPrice
          : Math.round(Math.round(product.price * 100) * 0.8) / 100,
      },
      quantity: quantity!,
    }];
  });
};
export const saveCart = (c: CartLine[]) => {
  ls()?.setItem("cart", JSON.stringify(c));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nexora-cart-change"));
};
let cartSyncQueue: Promise<void> = Promise.resolve();
let cartSyncInFlight: Promise<CartLine[]> | null = null;
export function persistCart(c: CartLine[]) {
  saveCart(c);
  if (!getToken()) return;
  cartSyncQueue = cartSyncQueue.catch(() => undefined).then(async () => {
    await api("/cart", {
      method: "PUT",
      body: JSON.stringify({ items: c.map((line) => ({ product_pid: line.product.pid, quantity: line.quantity })) }),
    });
  }).catch((error: unknown) => {
    notify(error instanceof Error ? `Your bag could not be saved: ${error.message}` : "Your bag could not be saved.", "info");
  });
}
export function syncCartFromServer(): Promise<CartLine[]> {
  if (!getToken()) return Promise.resolve(getCart());
  if (cartSyncInFlight) return cartSyncInFlight;
  cartSyncInFlight = mergeCartFromServer().finally(() => {
    cartSyncInFlight = null;
  });
  return cartSyncInFlight;
}

async function mergeCartFromServer(): Promise<CartLine[]> {
  const remote = await api<{ items: CartLine[] }>("/cart");
  const previousSync = readStoredValue(CART_SYNC_BASELINE);
  const baseline = new Map<number, number>(
    Array.isArray(previousSync)
      ? previousSync.flatMap((entry): [number, number][] => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as { pid?: unknown; quantity?: unknown };
        return Number.isSafeInteger(item.pid) && Number.isSafeInteger(item.quantity)
          && (item.pid as number) > 0 && (item.quantity as number) > 0
          ? [[item.pid as number, item.quantity as number]]
          : [];
      })
      : [],
  );
  const localById = new Map(getCart().map((line) => [line.product.pid, line]));
  const remoteById = new Map(remote.items.map((line) => [line.product.pid, line]));
  const merged = new Map<number, CartLine>();
  for (const pid of new Set([...localById.keys(), ...remoteById.keys(), ...baseline.keys()])) {
    const local = localById.get(pid);
    const saved = remoteById.get(pid);
    const product = saved?.product ?? local?.product;
    if (!product) continue;
    const quantity = Math.min(
      product.stock,
      Math.max(0, (saved?.quantity ?? 0) + (local?.quantity ?? 0) - (baseline.get(pid) ?? 0)),
    );
    if (quantity > 0) {
      merged.set(pid, { product, quantity });
    }
  }
  const result = [...merged.values()].filter((line) => line.quantity > 0);
  if (result.some((line) => !remote.items.some((saved) => saved.product.pid === line.product.pid && saved.quantity === line.quantity))
      || remote.items.some((line) => !result.some((saved) => saved.product.pid === line.product.pid))) {
    await api("/cart", {
      method: "PUT",
      body: JSON.stringify({ items: result.map((line) => ({ product_pid: line.product.pid, quantity: line.quantity })) }),
    });
  }
  saveCart(result);
  ls()?.setItem(CART_SYNC_BASELINE, JSON.stringify(result.map((line) => ({ pid: line.product.pid, quantity: line.quantity }))));
  return result;
}
let wishlistSyncQueue: Promise<void> = Promise.resolve();
export async function syncWishlistFromServer(): Promise<number[]> {
  if (!getToken()) return getWishlist();
  const remote = await api<{ items: Product[] }>("/wishlist");
  const ids = [...new Set([...remote.items.map((item) => item.pid), ...getWishlist()])];
  saveWishlist(ids);
  if (ids.length !== remote.items.length) {
    await api("/wishlist", { method: "PUT", body: JSON.stringify({ product_pids: ids }) });
  }
  return ids;
}
export async function getSavedAddresses(): Promise<SavedAddress[]> {
  if (!getToken()) return [];
  return api<SavedAddress[]>("/addresses");
}
export function addToCart(p: Product, quantity = 1) {
  if (!requireAuthentication("add items to your bag")) return false;
  const c = getCart(); const l = c.find((x) => x.product.pid === p.pid);
  if (l) l.quantity = Math.min(l.quantity + quantity, p.stock); else c.push({ product: p, quantity: Math.min(quantity, p.stock) });
  persistCart(c.filter((line) => line.quantity > 0));
  notify("Added to cart");
  return true;
}
