export const API = process.env.NEXT_PUBLIC_API || "http://localhost:8000";
export type Product = { id: number; name: string; description: string; category: string; price: number; stock: number };
export type CartLine = { product: Product; quantity: number };
export type SavedAddress = {
  id: number; label: string | null; recipient_name: string; phone: string; address_line1: string;
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
  shoes: "1542291026-7eec264c27ff",
  jacket: "1551028719-00167b16eac5",
  coffee: "1495474472287-4d71bcdd2085",
  lamp: "1507473885765-e6ed057f782c",
  backpack: "1553062407-98eeb64c6a62",
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
  try { return JSON.parse(ls()?.getItem("wishlist") ?? "[]") as number[]; }
  catch { return []; }
};
export const saveWishlist = (items: number[]) => {
  ls()?.setItem("wishlist", JSON.stringify(items));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nexora-wishlist-change"));
};
export const toggleWishlist = (id: number) => {
  const items = getWishlist();
  const next = items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  saveWishlist(next);
  const added = next.includes(id);
  if (getToken()) {
    wishlistSyncQueue = wishlistSyncQueue.catch(() => undefined).then(async () => {
      await api(`/wishlist/${id}`, { method: added ? "PUT" : "DELETE" });
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
export const setAuth = (t: string, r: string) => { ls()?.setItem("token", t); ls()?.setItem("role", r); };
export const logout = () => { ls()?.removeItem("token"); ls()?.removeItem("role"); };

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(API + path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === "string" ? err.detail : "Request failed");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const getCart = (): CartLine[] => JSON.parse(ls()?.getItem("cart") ?? "[]");
export const saveCart = (c: CartLine[]) => {
  ls()?.setItem("cart", JSON.stringify(c));
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nexora-cart-change"));
};
let cartSyncQueue: Promise<void> = Promise.resolve();
export function persistCart(c: CartLine[]) {
  saveCart(c);
  if (!getToken()) return;
  cartSyncQueue = cartSyncQueue.catch(() => undefined).then(async () => {
    await api("/cart", {
      method: "PUT",
      body: JSON.stringify({ items: c.map((line) => ({ product_id: line.product.id, quantity: line.quantity })) }),
    });
  }).catch((error: unknown) => {
    notify(error instanceof Error ? `Your bag could not be saved: ${error.message}` : "Your bag could not be saved.", "info");
  });
}
export async function syncCartFromServer(): Promise<CartLine[]> {
  if (!getToken()) return getCart();
  const remote = await api<{ items: CartLine[] }>("/cart");
  const merged = new Map<number, CartLine>();
  for (const line of [...remote.items, ...getCart()]) {
    const existing = merged.get(line.product.id);
    merged.set(line.product.id, {
      product: line.product,
      quantity: Math.min(line.product.stock, (existing?.quantity ?? 0) + line.quantity),
    });
  }
  const result = [...merged.values()].filter((line) => line.quantity > 0);
  saveCart(result);
  if (result.some((line) => !remote.items.some((saved) => saved.product.id === line.product.id && saved.quantity === line.quantity))
      || remote.items.some((line) => !result.some((saved) => saved.product.id === line.product.id))) {
    await api("/cart", {
      method: "PUT",
      body: JSON.stringify({ items: result.map((line) => ({ product_id: line.product.id, quantity: line.quantity })) }),
    });
  }
  return result;
}
let wishlistSyncQueue: Promise<void> = Promise.resolve();
export async function syncWishlistFromServer(): Promise<number[]> {
  if (!getToken()) return getWishlist();
  const remote = await api<{ items: Product[] }>("/wishlist");
  const ids = [...new Set([...remote.items.map((item) => item.id), ...getWishlist()])];
  saveWishlist(ids);
  if (ids.length !== remote.items.length) {
    await api("/wishlist", { method: "PUT", body: JSON.stringify({ product_ids: ids }) });
  }
  return ids;
}
export async function getSavedAddresses(): Promise<SavedAddress[]> {
  if (!getToken()) return [];
  return api<SavedAddress[]>("/addresses");
}
export type CartFlyDetail = { image: string; from: DOMRect };
export function addToCart(p: Product, quantity = 1, fly?: CartFlyDetail) {
  const c = getCart(); const l = c.find((x) => x.product.id === p.id);
  if (l) l.quantity = Math.min(l.quantity + quantity, p.stock); else c.push({ product: p, quantity: Math.min(quantity, p.stock) });
  persistCart(c.filter((line) => line.quantity > 0));
  if (typeof window !== "undefined" && fly) {
    window.dispatchEvent(new CustomEvent("nexora-cart-fly", { detail: fly }));
  }
  notify("Added to cart");
}
