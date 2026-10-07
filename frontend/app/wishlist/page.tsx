"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { addToCart, api, getWishlist, notify, Product, productImage, syncWishlistFromServer, toggleWishlist } from "@/lib/api";

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ids, setIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIds(getWishlist());
    void syncWishlistFromServer()
      .then((savedIds) => api<Product[]>("/products?size=100").then((items) => ({ savedIds, items })))
      .then(({ savedIds, items }) => {
        if (!active) return;
        setIds(savedIds);
        setProducts(items.filter((item) => savedIds.includes(item.id)));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Your favorites could not be loaded.");
        notify(`Your favorites could not be loaded: ${err instanceof Error ? err.message : "Please try again."}`, "info");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const remove = (id: number) => {
    toggleWishlist(id);
    setIds(getWishlist());
    setProducts((items) => items.filter((item) => item.id !== id));
  };

  return (
    <section className="mx-auto min-h-[60vh] max-w-[1200px] px-5 pb-12 pt-24 sm:px-8 lg:px-12">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Saved for later</p>
      <h1 className="font-display mt-2 text-3xl font-bold">Your favorites</h1>
      {error ? <div role="alert" className="panel mt-8 p-5 text-sm text-rose-200">{error}</div>
        : loading ? <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-square animate-pulse rounded-2xl bg-white/[.05]" />)}</div>
          : !ids.length ? <div className="panel mt-8 py-16 text-center"><Heart className="mx-auto text-accent" size={24} /><p className="mt-4 text-sm text-[#c3c1cd]">Your wishlist is waiting for its first favorite.</p><Link href="/shop" className="button-primary mt-6">Find your favorite</Link></div>
            : <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">{products.map((item) => <article key={item.id} className="product-card"><Link href={`/products/${item.id}`} className="block overflow-hidden rounded-2xl bg-[#171923]"><img className="product-image aspect-square w-full object-cover" src={productImage(item)} alt={item.name} /></Link><div className="flex items-center justify-between gap-2 pt-3"><Link href={`/products/${item.id}`} className="text-sm font-semibold">{item.name}</Link><button onClick={() => remove(item.id)} aria-label={`Remove ${item.name} from wishlist`} className="text-accent"><Heart size={16} fill="currentColor" /></button></div><div className="mt-2 flex items-center justify-between"><span className="text-sm font-bold">${item.price.toFixed(2)}</span><button onClick={() => addToCart(item)} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-semibold hover:bg-white/20">Add to bag</button></div></article>)}</div>}
    </section>
  );
}
