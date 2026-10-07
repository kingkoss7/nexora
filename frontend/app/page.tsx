"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { addToCart, api, getWishlist, notify, Product, productImage, syncWishlistFromServer, toggleWishlist } from "@/lib/api";
import { enrich, formatMoney } from "@/lib/catalog";
import ProductCard from "@/components/commerce/ProductCard";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import Reveal from "@/components/ui/Reveal";

export default function Home() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  const [quick, setQuick] = useState<Product | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<Product[]>("/products?size=100");
      setItems(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load products.");
      setItems([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    setSaved(getWishlist());
    void syncWishlistFromServer().then(setSaved).catch((err: unknown) => {
      notify(err instanceof Error ? err.message : "Wishlist could not be loaded.", "info");
    });
  }, []);

  const featured = items?.[0] ?? null;

  return (
    <>
      <Hero />
      <CategoryGrid />
      {featured && <FeaturedProduct product={featured} />}

      <section id="shop" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-16 sm:px-8 lg:px-12">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Showcase</p>
              <h2 className="font-display mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">The collection</h2>
            </div>
            <Link href="/shop" className="hidden text-xs text-muted hover:text-white sm:inline-flex sm:items-center sm:gap-1">All products <ArrowRight size={14} /></Link>
          </div>
        </Reveal>
        {items === null ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}><div className="skeleton aspect-[4/5] rounded-[22px]" /><div className="skeleton mt-4 h-3 w-2/3 rounded" /><div className="skeleton mt-2 h-3 w-1/3 rounded" /></div>
            ))}
          </div>
        ) : error ? (
          <div className="panel mt-10 p-8 text-center"><p className="text-sm text-rose-200">{error}</p><button className="button-secondary mt-4" onClick={() => void load()}>Try again</button></div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                saved={saved.includes(product.id)}
                onWishlist={() => setSaved(getWishlist())}
                onQuick={() => setQuick(product)}
              />
            ))}
          </div>
        )}
      </section>

      <section id="deals" className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#121212] px-6 py-10 sm:px-12">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-accent/10 blur-[80px]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Membership</p>
            <h2 className="font-display mt-2 text-2xl font-bold">Complimentary delivery over $100.</h2>
            <p className="mt-2 max-w-lg text-sm text-[#b0b0b0]">Secure checkout, considered packaging, and a two-year service promise on flagship hardware.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-[#d4d4d4]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2"><Truck size={13} /> White-glove shipping</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2"><ShieldCheck size={13} /> Secure checkout</span>
            </div>
          </div>
        </Reveal>
      </section>

      <AnimatePresence>
        {quick && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setQuick(null); }}>
            <motion.div role="dialog" aria-modal="true" aria-label={`Quick view ${quick.name}`} className="panel relative grid max-h-[88vh] w-full max-w-[720px] grid-cols-1 overflow-auto p-5 sm:grid-cols-2 sm:gap-7 sm:p-7" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
              <button aria-label="Close quick view" onClick={() => setQuick(null)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40"><X size={17} /></button>
              <img src={productImage(quick)} alt={quick.name} className="aspect-square w-full rounded-2xl object-cover" />
              <div className="flex flex-col justify-center py-5">
                <p className="text-[10px] uppercase tracking-[.15em] text-accent">{enrich(quick).brand}</p>
                <h3 className="font-display mt-3 text-2xl font-bold">{quick.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#a6a6a6]">{quick.description}</p>
                <p className="mt-5 font-display text-2xl font-bold text-accent">{formatMoney(quick.price)}</p>
                <button disabled={!quick.stock} onClick={() => { addToCart(quick); setQuick(null); }} className="button-primary mt-6 disabled:opacity-50">Add to Cart</button>
                <Link className="mt-3 text-center text-xs text-muted hover:text-white" href={`/products/${quick.id}`} onClick={() => setQuick(null)}>Full details</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
