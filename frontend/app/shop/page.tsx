"use client";

import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addToCart, api, getWishlist, notify, Product, syncWishlistFromServer } from "@/lib/api";
import { enrich, editorialCategories } from "@/lib/catalog";
import ProductCard from "@/components/commerce/ProductCard";
import { Suspense } from "react";

function ShopInner() {
  const params = useSearchParams();
  const initialCategory = params.get("category") ?? "All";
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("All");
  const [sort, setSort] = useState("name");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [quick, setQuick] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const search = new URLSearchParams({ sort, size: "100", max_price: String(maxPrice) });
    if (query.trim()) search.set("q", query.trim());
    const apiCategory = editorialCategories.find((item) => item.slug === category)?.slug;
    if (apiCategory && ["electronics", "fashion", "home"].includes(apiCategory)) search.set("category", apiCategory);
    try {
      const data = await api<Product[]>(`/products?${search}`);
      setItems(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products.");
      setItems([]);
    }
  }, [category, maxPrice, query, sort]);

  useEffect(() => { const t = window.setTimeout(() => void load(), 160); return () => window.clearTimeout(t); }, [load]);
  useEffect(() => {
    setSaved(getWishlist());
    void syncWishlistFromServer().then(setSaved).catch((err: unknown) => notify(err instanceof Error ? err.message : "Wishlist could not be loaded.", "info"));
  }, []);

  const brands = useMemo(() => ["All", ...new Set((items ?? []).map((item) => enrich(item).brand))], [items]);
  const filtered = useMemo(() => (items ?? []).filter((item) => {
    const view = enrich(item);
    if (brand !== "All" && view.brand !== brand) return false;
    if (inStock && item.stock <= 0) return false;
    if (onSale && view.discount < 10) return false;
    if (view.rating < minRating) return false;
    if (category !== "All" && !["electronics", "fashion", "home"].includes(category) && !`${item.name} ${item.category}`.toLowerCase().includes(category.slice(0, 4))) {
      if (category === "gaming" && !item.name.toLowerCase().includes("keyboard") && item.category !== "electronics") return false;
    }
    return true;
  }), [items, brand, inStock, onSale, minRating, category]);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[11px] font-semibold">Category</p>
        {["All", ...editorialCategories.map((item) => item.slug)].map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`mb-1 block w-full rounded-lg px-2.5 py-2 text-left text-xs capitalize ${category === item ? "bg-accent/12 text-accent" : "text-muted hover:text-white"}`}>{item}</button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold">Brand</p>
        {brands.map((item) => (
          <button key={item} onClick={() => setBrand(item)} className={`mb-1 block w-full rounded-lg px-2.5 py-2 text-left text-xs ${brand === item ? "bg-accent/12 text-accent" : "text-muted hover:text-white"}`}>{item}</button>
        ))}
      </div>
      <div>
        <div className="mb-2 flex justify-between text-[11px]"><span className="font-semibold">Price</span><span className="text-accent">Up to ${maxPrice}</span></div>
        <input aria-label="Maximum price" type="range" min="50" max="2000" step="50" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="w-full accent-[#3dcf8a]" />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold">Rating</p>
        {[0, 4, 4.5].map((value) => (
          <button key={value} onClick={() => setMinRating(value)} className={`mb-1 block w-full rounded-lg px-2.5 py-2 text-left text-xs ${minRating === value ? "bg-accent/12 text-accent" : "text-muted"}`}>{value === 0 ? "Any rating" : `${value}+`}</button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} className="accent-[#3dcf8a]" /> Availability — in stock</label>
      <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={onSale} onChange={(event) => setOnSale(event.target.checked)} className="accent-[#3dcf8a]" /> Discounted</label>
    </div>
  );

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-24 sm:px-8 lg:px-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Shop</p>
      <h1 className="font-display mt-2 text-4xl font-bold tracking-[-0.04em]">The catalog</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="hidden h-fit rounded-2xl border border-white/8 bg-[#121212] p-5 lg:block">{FilterPanel}</aside>
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <input aria-label="Search" className="field !h-10 !rounded-full !py-0 !text-xs sm:w-[240px]" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select aria-label="Sort" className="field !h-10 !rounded-full !py-0 !text-xs sm:w-[180px]" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option className="bg-[#121212]" value="name">Featured</option>
              <option className="bg-[#121212]" value="price_asc">Price: low to high</option>
              <option className="bg-[#121212]" value="price_desc">Price: high to low</option>
            </select>
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="button-secondary !h-10 !py-0 !text-[11px] lg:hidden"><SlidersHorizontal size={14} /> Filters</button>
          </div>
          <AnimatePresence>{filtersOpen && <div className="mb-5 rounded-2xl border border-white/8 bg-[#121212] p-4 lg:hidden">{FilterPanel}</div>}</AnimatePresence>
          {items === null ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-[22px]" />)}</div>
          ) : error ? (
            <div className="panel p-8 text-center text-sm text-rose-200">{error}</div>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} saved={saved.includes(product.id)} onWishlist={() => setSaved(getWishlist())} onQuick={() => setQuick(product)} />
              ))}
            </div>
          ) : (
            <div className="panel py-16 text-center"><p className="text-sm">No products match these filters.</p><button className="button-secondary mt-4 !text-xs" onClick={() => { setCategory("All"); setBrand("All"); setMaxPrice(2000); setMinRating(0); setInStock(false); setOnSale(false); }}>Clear filters <X size={12} /></button></div>
          )}
        </div>
      </div>
      {quick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuick(null); }}>
          <div role="dialog" aria-modal="true" className="panel max-w-md p-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent">{quick.category}</p>
            <h3 className="font-display mt-2 text-xl font-bold">{quick.name}</h3>
            <p className="mt-2 text-sm text-muted">{quick.description}</p>
            <button className="button-primary mt-5 w-full" onClick={() => { addToCart(quick); setQuick(null); }}>Add to Cart</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-5 pt-24"><div className="skeleton h-10 w-48 rounded" /></div>}>
      <ShopInner />
    </Suspense>
  );
}
