"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, Product, productImage } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";

const popular = ["Electronics", "Gaming", "Fashion", "Accessories"];
const defaults = ["Wireless headphones", "Gaming keyboard", "Smart watch"];

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>(defaults);
  const [active, setActive] = useState(0);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("nexora-recent") ?? "null") ?? defaults); } catch { setActive(0); }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({ size: "8" });
      if (query.trim()) params.set("q", query.trim());
      api<Product[]>(`/products?${params}`).then(setItems).catch(() => setItems([]));
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowDown") { event.preventDefault(); setActive((v) => Math.min(items.length - 1, v + 1)); }
      if (event.key === "ArrowUp") { event.preventDefault(); setActive((v) => Math.max(0, v - 1)); }
      if (event.key === "Enter" && items[active]) {
        remember(query || items[active].name);
        window.location.href = `/products/${items[active].id}`;
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
    <AnimatePresence>
      {open && (
        <>
          <motion.button aria-label="Close search" className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="fixed inset-x-0 top-0 z-[62] mx-auto mt-16 w-[min(720px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-panel"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
              <Search size={18} className="text-accent" />
              <input
                autoFocus
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActive(0); }}
                placeholder="Search products, collections, categories…"
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-[#666]"
              />
              <button onClick={onClose} aria-label="Close search" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/8"><X size={15} /></button>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[180px_1fr]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Recent</p>
                <div className="mt-3 space-y-1">{recent.map((item) => <button key={item} onClick={() => setQuery(item)} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-[#cfcfcf] hover:bg-white/5 hover:text-white">{item}</button>)}</div>
                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Popular</p>
                <div className="mt-3 flex flex-wrap gap-2">{popular.map((item) => <button key={item} onClick={() => setQuery(item)} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] hover:border-accent/40">{item}</button>)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Live results</p>
                <div className="mt-3 space-y-1">
                  {results.map((product, index) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={() => { remember(query || product.name); onClose(); }}
                      className={`flex items-center gap-3 rounded-xl px-2 py-2 ${index === active ? "bg-accent/10" : "hover:bg-white/5"}`}
                    >
                      <img src={productImage(product)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-[10px] capitalize text-muted">{product.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-accent">{formatMoney(product.price)}</span>
                      <ArrowUpRight size={14} className="text-muted" />
                    </Link>
                  ))}
                  {!results.length && <p className="py-8 text-center text-xs text-muted">No matches yet.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
