"use client";

import { Check, Eye, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { addToCart, Product, productImage, toggleWishlist } from "@/lib/api";
import { festivalPrice, formatMoney } from "@/lib/catalog";
import WishlistButton from "@/components/ui/WishlistButton";

export default function ProductCard({
  product, index, saved, onWishlist, onQuick,
}: {
  product: Product; index: number; saved: boolean; onWishlist: () => void; onQuick: () => void;
}) {
  const [added, setAdded] = useState(false);
  return (
    <article className="product-card group flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#111720]">
        <Link href={`/products/${product.pid}`} aria-label={`View ${product.name}`} className="absolute inset-0 z-[1]" />
        <img className="product-image h-full w-full object-cover" loading={index > 3 ? "lazy" : "eager"} src={productImage(product)} alt={product.name} />
        <span className="absolute left-3 top-3 z-[2] rounded-md border border-[#2583ff]/25 bg-[#0b0f14]/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#72adff]">{product.festival_discount_percent}% festival offer</span>
        {product.stock <= 0 && <span className="absolute bottom-14 left-3 z-[2] rounded-md border border-[#283444] bg-[#0b0f14]/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#c3ccda]">Out of stock</span>}
        <div className="absolute right-3 top-3 z-[2]"><WishlistButton saved={saved} onToggle={() => { toggleWishlist(product.pid); onWishlist(); }} /></div>
        <div className="absolute inset-x-3 bottom-3 z-[2] flex gap-2">
          <button type="button" onClick={onQuick} aria-label={`Quick view ${product.name}`} className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#283444] bg-[#0b0f14]/90 text-white hover:border-accent" title="Quick view"><Eye size={15} /></button>
          <button
            type="button"
            disabled={!product.stock}
            onClick={() => {
              if (!addToCart(product)) return;
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1400);
            }}
            className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2.5 text-xs font-bold text-white hover:bg-[#4697ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {added ? <><Check size={13} /> Added</> : <><ShoppingBag size={13} /> Add to Cart</>}
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">{product.category}</p>
        <div className="mt-1 flex items-start justify-between gap-2">
          <Link href={`/products/${product.pid}`} className="line-clamp-2 min-h-10 font-display text-sm font-semibold text-[#e5eaf2] hover:text-white">{product.name}</Link>
        </div>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight text-white">{formatMoney(festivalPrice(product))}</span>
            <span className="text-xs text-muted line-through">{formatMoney(product.price)}</span>
          </span>
          <span className={`text-[10px] ${product.stock > 0 ? "text-[#36c98f]" : "text-[#f16c78]"}`}>{product.stock > 0 ? `${product.stock} available` : "Sold out"}</span>
        </div>
      </div>
    </article>
  );
}
