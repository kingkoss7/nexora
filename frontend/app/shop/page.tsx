"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addToCart, api, getWishlist, notify, Product, syncWishlistFromServer } from "@/lib/api";
import { festivalPrice, formatMoney } from "@/lib/catalog";
import ProductCard from "@/components/commerce/ProductCard";
import { Suspense } from "react";

function ShopInner() {
  const params = useSearchParams();
  const initialCategory = params.get("category") ?? "All";
  const [items, setItems] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("name");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [inStock, setInStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [quick, setQuick] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const search = new URLSearchParams({ sort, size: "100" });
    if (query.trim()) search.set("q", query.trim());
    if (category !== "All") search.set("category", category);
    try {
      const data = await api<Product[]>(`/products?${search}`);
      setItems(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products.");
      setItems([]);
    }
  }, [category, maxPrice, minPrice, query, sort]);

  useEffect(() => { const t = window.setTimeout(() => void load(), 160); return () => window.clearTimeout(t); }, [load]);
  useEffect(() => {
    api<string[]>("/categories").then((values) => {
      setCategories(values);
      if (initialCategory !== "All") {
        const matching = values.find((value) => value.toLowerCase() === initialCategory.toLowerCase());
        if (matching) setCategory(matching);
      }
    }).catch((err: unknown) => notify(err instanceof Error ? err.message : "Categories could not be loaded.", "info"));
  }, [initialCategory]);
  useEffect(() => {
    setSaved(getWishlist());
    void syncWishlistFromServer().then(setSaved).catch((err: unknown) => notify(err instanceof Error ? err.message : "Wishlist could not be loaded.", "info"));
  }, []);

  const filtered = useMemo(() => (items ?? []).filter((item) => (
    (!inStock || item.stock > 0) && festivalPrice(item) >= minPrice && festivalPrice(item) <= maxPrice
  )), [items, inStock, maxPrice, minPrice]);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[11px] font-semibold">Category</p>
        {["All", ...categories].map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`mb-1 block w-full rounded-lg px-2.5 py-2 text-left text-xs capitalize ${category === item ? "bg-accent/12 text-accent" : "text-muted hover:text-white"}`}>{item}</button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold">Price range</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-muted">From
            <input aria-label="Minimum price" type="number" min="0" max={maxPrice} value={minPrice} onChange={(event) => setMinPrice(Math.max(0, Math.min(maxPrice, Number(event.target.value))))} className="field mt-1 !h-9 !py-1 text-xs" />
          </label>
          <label className="text-[10px] text-muted">To
            <input aria-label="Maximum price" type="number" min={minPrice} value={maxPrice} onChange={(event) => setMaxPrice(Math.max(minPrice, Number(event.target.value)))} className="field mt-1 !h-9 !py-1 text-xs" />
          </label>
        </div>
        <p className="mt-1 text-[10px] text-muted">{formatMoney(minPrice)} – {formatMoney(maxPrice)}</p>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} className="accent-accent" /> Availability — in stock</label>
    </div>
  );

  return (
    <section className="page-frame mx-auto max-w-[1440px] px-5 pb-20 pt-28 sm:px-8 lg:px-12">
      <p className="eyebrow">NEXORA marketplace</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-heading text-5xl sm:text-6xl">Find your next favorite.</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#9aa8ba]">Explore available products and narrow your search by category, price, and stock.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#283444] bg-[#111720] px-3.5 py-2.5 text-[10px] text-[#9aa8ba]"><span className="size-1.5 rounded-full bg-accent" />{items === null ? "Loading products…" : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`}</span>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="surface-card hidden h-fit p-5 lg:sticky lg:top-24 lg:block">{FilterPanel}</aside>
        <div>
          <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-white/[.07] bg-white/[.02] p-2">
            <input aria-label="Search" className="field !h-10 !rounded-xl !border-transparent !bg-transparent !py-0 !text-xs sm:w-[240px]" placeholder="Search products…" value={query} onChange={(event) => setQuery(event.target.value)} />
            <select aria-label="Sort" className="field !h-10 !w-full !rounded-xl !border-transparent !bg-transparent !py-0 !text-xs sm:ml-auto sm:w-[180px]" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option className="bg-[#111720]" value="name">Name</option>
              <option className="bg-[#111720]" value="price_asc">Price: low to high</option>
              <option className="bg-[#111720]" value="price_desc">Price: high to low</option>
            </select>
            <button onClick={() => setFiltersOpen(!filtersOpen)} className="button-secondary !h-10 !py-0 !text-[11px] lg:hidden"><SlidersHorizontal size={14} /> Refine</button>
          </div>
          <nav aria-label="Browse categories" className="scrollbar-none mb-6 flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories].map((item) => (
              <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] capitalize transition-colors ${category === item ? "border-accent/35 bg-accent/10 text-accent" : "border-white/[.08] bg-white/[.025] text-[#a3aaa5] hover:border-white/20 hover:text-white"}`}>{item}</button>
            ))}
          </nav>
          {filtersOpen && (
              <div className="mb-5 overflow-hidden rounded-2xl border border-[#283444] bg-[#111720] p-4 lg:hidden">
                {FilterPanel}
              </div>
            )}
          {items === null ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-[22px]" />)}</div>
          ) : error ? (
            <div className="panel p-8 text-center text-sm text-rose-200">{error}</div>
          ) : filtered.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product, index) => (
                  <div key={product.pid}>
                    <ProductCard product={product} index={index} saved={saved.includes(product.pid)} onWishlist={() => setSaved(getWishlist())} onQuick={() => setQuick(product)} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="panel py-16 text-center"><p className="text-sm">No products match these filters.</p><button className="button-secondary mt-4 !text-xs" onClick={() => { setCategory("All"); setMinPrice(0); setMaxPrice(100000); setInStock(false); setQuery(""); }}>Clear filters <X size={12} /></button></div>
          )}
        </div>
      </div>
      {quick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuick(null); }}>
          <div role="dialog" aria-modal="true" className="panel max-w-md p-6">
            <p className="text-[10px] uppercase tracking-[0.16em] text-accent">{quick.category}</p>
            <h3 className="font-display mt-2 text-xl font-bold">{quick.name}</h3>
            <p className="mt-2 text-sm text-muted">{quick.description}</p>
            <button className="button-primary mt-5 w-full" onClick={() => { if (addToCart(quick)) setQuick(null); }}>Add to Cart</button>
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
