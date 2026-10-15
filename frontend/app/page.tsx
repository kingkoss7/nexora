"use client";
import { ArrowRight, ShieldCheck, Truck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { addToCart, api, getWishlist, notify, Product, productImage, syncWishlistFromServer } from "@/lib/api";
import { festivalPrice, formatMoney, productDisplayName } from "@/lib/catalog";
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

  const featured = items?.find((product) => /watch/i.test(product.name)) ?? items?.[0] ?? null;
  const featuredShopItems = items ? [...items].sort((a, b) => {
    const aWatch = /watch/i.test(a.name) ? 1 : 0;
    const bWatch = /watch/i.test(b.name) ? 1 : 0;
    return bWatch - aWatch;
  }) : [];

  return (
    <>
      <Hero product={featured} />
      <section aria-label="Shopping information" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid overflow-hidden rounded-xl border border-[#283444] bg-[#111720] sm:grid-cols-2 lg:grid-cols-4">
          {[["01", "Delivery", "Review delivery details and shipping at checkout."], ["02", "Payment", "Cash on delivery is available."], ["03", "Your account", "Your cart and wishlist sync after sign-in."], ["04", "Order history", "Review your order status in your account."]].map(([number, title, description], index) => (
            <div key={number} className={`flex items-start gap-3 px-4 py-4 sm:px-5 ${index < 3 ? "border-b border-[#283444] lg:border-b-0 lg:border-r" : ""}`}>
              <span className="mt-0.5 text-[10px] font-bold tracking-widest text-accent">{number}</span>
              <div><p className="text-xs font-semibold text-white">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#9aa8ba]">{description}</p></div>
            </div>
          ))}
        </div>
      </section>
      <CategoryGrid />
      {featured && <FeaturedProduct product={featured} />}

      <section id="shop" className="page-frame mx-auto max-w-[1440px] scroll-mt-24 px-4 py-16 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">The shortlist</p>
              <h2 className="display-heading mt-3 text-4xl sm:text-5xl">Shop the collection.</h2>
            </div>
            <Link href="/shop" className="button-secondary hidden !px-4 !py-2.5 !text-[11px] sm:inline-flex">Explore all <ArrowRight size={14} /></Link>
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
            {featuredShopItems.slice(0, 8).map((product, index) => (
              <ProductCard
                key={product.pid}
                product={product}
                index={index}
                saved={saved.includes(product.pid)}
                onWishlist={() => setSaved(getWishlist())}
                onQuick={() => setQuick(product)}
              />
            ))}
          </div>
        )}
      </section>

      <section id="deals" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 pb-16 sm:px-6 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-[#283444] bg-[#111720] px-6 py-9 sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">The Great Indian Festival</p>
          <h2 className="font-display mt-2 text-2xl font-bold">20% off across the entire collection.</h2>
          <p className="mt-2 max-w-lg text-sm text-[#9aa8ba]">Festival pricing is applied automatically to every product and confirmed in your order total. Payment is collected on delivery.</p>
          {featured && <p className="mt-3 text-xs text-[#c3ccda]">{productDisplayName(featured)}: <span className="font-semibold text-white">{formatMoney(festivalPrice(featured))}</span> <span className="text-muted line-through">{formatMoney(featured.price)}</span></p>}
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-[#c3ccda]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#283444] px-3 py-2"><Truck size={14} /> Shipping shown at checkout</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#283444] px-3 py-2"><ShieldCheck size={14} /> Cash on delivery</span>
            </div>
          </div>
        </Reveal>
      </section>

      {quick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuick(null); }}>
          <div role="dialog" aria-modal="true" aria-label={`Quick view ${productDisplayName(quick)}`} className="panel relative grid max-h-[88vh] w-full max-w-[720px] grid-cols-1 overflow-auto p-5 sm:grid-cols-2 sm:gap-7 sm:p-7">
            <button aria-label="Close quick view" onClick={() => setQuick(null)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/40"><X size={17} /></button>
            <img src={productImage(quick)} alt={productDisplayName(quick)} className="aspect-square w-full rounded-2xl object-cover" />
            <div className="flex flex-col justify-center py-5">
              <p className="text-[10px] uppercase tracking-[.15em] text-accent">{quick.category}</p>
              <h3 className="font-display mt-3 text-2xl font-bold">{productDisplayName(quick)}</h3>
              <p className="mt-3 text-sm leading-6 text-[#a6a6a6]">{quick.description}</p>
              <p className="mt-5 font-display text-2xl font-bold text-accent">{formatMoney(festivalPrice(quick))}</p>
              <p className="mt-1 text-xs text-muted line-through">{formatMoney(quick.price)}</p>
              <button disabled={!quick.stock} onClick={() => { if (addToCart(quick)) setQuick(null); }} className="button-primary mt-6 disabled:opacity-50">Add to Cart</button>
              <Link className="mt-3 text-center text-xs text-muted hover:text-white" href={`/products/${quick.pid}`} onClick={() => setQuick(null)}>Full details</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
