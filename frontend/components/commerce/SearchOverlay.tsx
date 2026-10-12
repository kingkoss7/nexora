"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, Product, productImage } from "@/lib/api";
import { festivalPrice, formatMoney } from "@/lib/catalog";

export default function SearchOverlay({ open, initialQuery = "", onClose }: { open: boolean; initialQuery?: string; onClose: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("nexora-recent") ?? "[]");
      setRecent(Array.isArray(stored) && stored.every((item) => typeof item === "string") ? stored : []);
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setItems([]);
    setError("");
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({ size: "8" });
      if (query.trim()) params.set("q", query.trim());
      api<Product[]>(`/products?${params}`)
        .then((products) => { if (active) setItems(products); })
        .catch((err: unknown) => {
          if (active) {
            setItems([]);
            setError(err instanceof Error ? err.message : "Search is unavailable.");
          }
        })
        .finally(() => { if (active) setLoading(false); });
    }, 120);
    return () => { active = false; window.clearTimeout(t); };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((v) => Math.min(items.length - 1, v + 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive((v) => Math.max(0, v - 1)); }
      if (event.key === "Enter" && items[active]) {
        remember(query || items[active].name);
        window.location.href = `/products/${items[active].pid}`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose, query]);

  const remember = (value: string) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 6);
    setRecent(next);
    localStorage.setItem("nexora-recent", JSON.stringify(next));
  };

  const results = useMemo(() => items, [items]);

  return (
    <>
      {open && (
        <>
          <button aria-label="Close search" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="fixed inset-x-0 top-0 z-[62] mx-auto mt-16 w-[min(720px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#283444] bg-[#111720] shadow-panel"
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
              <Search size={18} className="text-accent" />
              <input
                autoFocus
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                placeholder="Search products"
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-[#666]"
              />
              <button onClick={onClose} aria-label="Close search" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/8"><X size={15} /></button>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[180px_1fr]">
              <div>
                {recent.length > 0 && <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Recent searches</p>
                  <div className="mt-3 space-y-1">{recent.map((item) => <button key={item} onClick={() => setQuery(item)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-[#cfcfcf] hover:bg-white/5 hover:text-white">{item}</button>)}</div>
                </>}
              </div>
              <div className={recent.length ? "" : "md:col-span-2"}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Live results</p>
                <div className="mt-3 space-y-1">
                  {results.map((product, index) => (
                    <Link
                      key={product.pid}
                      href={`/products/${product.pid}`}
                      onClick={() => { remember(query || product.name); onClose(); }}
                      className={`flex items-center gap-3 rounded-xl px-2 py-2 ${index === active ? "bg-accent/10" : "hover:bg-white/5"}`}
                    >
                      <img src={productImage(product)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-[10px] capitalize text-muted">{product.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-accent">{formatMoney(festivalPrice(product))}</span>
                      <ArrowUpRight size={14} className="text-muted" />
                    </Link>
                  ))}
                  {loading && <p className="py-8 text-center text-xs text-muted">Searching products…</p>}
                  {error && <p role="alert" className="py-8 text-center text-xs text-[#f16c78]">{error}</p>}
                  {!loading && !error && !results.length && <p className="py-8 text-center text-xs text-muted">No matches yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
