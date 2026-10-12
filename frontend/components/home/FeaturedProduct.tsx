"use client";

import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { addToCart, Product, productImage } from "@/lib/api";
import { festivalPrice, formatMoney } from "@/lib/catalog";

export default function FeaturedProduct({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);

  const add = () => {
    if (!addToCart(product)) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <section id="collections" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-12 sm:px-6 lg:px-10">
      <div className="mb-5">
        <p className="eyebrow">Featured product</p>
        <h2 className="display-heading mt-2 text-3xl sm:text-4xl">A closer look.</h2>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-[#283444] bg-[#111720] lg:grid-cols-2">
        <Link href={`/products/${product.pid}`} aria-label={`View ${product.name}`} className="block aspect-square overflow-hidden bg-[#151c26] lg:aspect-auto lg:min-h-[420px]">
          <img src={productImage(product)} alt={product.name} className="h-full w-full object-cover" />
        </Link>
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#9aa8ba]">{product.category}</p>
          <h3 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#9aa8ba]">{product.description || "Explore product details and availability."}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <p className="font-display text-3xl font-bold text-white">{formatMoney(festivalPrice(product))}</p>
            <p className="text-sm text-muted line-through">{formatMoney(product.price)}</p>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">{product.festival_discount_percent}% off</span>
          </div>
          <p className={`mt-2 text-xs ${product.stock > 0 ? "text-[#36c98f]" : "text-[#f16c78]"}`}>
            {product.stock > 0 ? `${product.stock} available` : "Currently out of stock"}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={add} disabled={!product.stock} className="button-primary disabled:opacity-50">
              {added ? <><Check size={16} /> Added to cart</> : <><ShoppingBag size={16} /> Add to cart</>}
            </button>
            <Link href={`/products/${product.pid}`} className="button-secondary">View details <ArrowRight size={15} /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
