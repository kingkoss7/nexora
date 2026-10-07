"use client";

import { Check, Eye, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { addToCart, Product, productImage, toggleWishlist } from "@/lib/api";
import { enrich, formatMoney } from "@/lib/catalog";
import WishlistButton from "@/components/ui/WishlistButton";

export default function ProductCard({
  product, index, saved, onWishlist, onQuick,
}: {
  product: Product; index: number; saved: boolean; onWishlist: () => void; onQuick: () => void;
}) {
  const view = enrich(product);
  const [added, setAdded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  return (
    <article className="product-card group" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#101010]">
        <Link href={`/products/${product.id}`} aria-label={`View ${product.name}`} className="absolute inset-0 z-[1]" />
        <img ref={imgRef} className="product-image h-full w-full object-cover" loading={index > 3 ? "lazy" : "eager"} src={productImage(product)} alt={product.name} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
        <span className="absolute left-3 top-3 z-[2] rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold capitalize tracking-wide backdrop-blur">{view.brand}</span>
        {view.discount > 0 && <span className="absolute left-3 top-11 z-[2] rounded-full bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent">-{view.discount}%</span>}
        <div className="absolute right-3 top-3 z-[2]"><WishlistButton saved={saved} onToggle={() => { toggleWishlist(product.id); onWishlist(); }} /></div>
        <div className="absolute inset-x-3 bottom-3 z-[2] flex translate-y-2 gap-2 opacity-0 transition duration-320 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <button onClick={onQuick} className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-black/55 py-2.5 text-[11px] font-semibold backdrop-blur"><Eye size={13} /> Quick View</button>
          <button
            disabled={!product.stock}
            onClick={() => {
              const from = imgRef.current?.getBoundingClientRect();
              addToCart(product, 1, from ? { image: productImage(product), from } : undefined);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-[11px] font-bold text-[#04140c] disabled:opacity-40"
          >
            {added ? <><Check size={13} /> Added</> : <><ShoppingBag size={13} /> Add to Cart</>}
          </button>
        </div>
      </div>
      <div className="px-1.5 pb-2 pt-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{product.category}</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="line-clamp-1 font-display text-[15px] font-semibold">{product.name}</Link>
          <span className="text-[11px] text-[#cfcfcf]">★ {view.rating}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-base font-bold text-accent">{formatMoney(product.price)}</span>
          <span className="text-[11px] text-muted line-through">{formatMoney(view.originalPrice)}</span>
        </div>
      </div>
    </article>
  );
}
