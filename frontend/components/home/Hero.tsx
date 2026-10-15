"use client";

import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";
import { Product, productImage } from "@/lib/api";
import { festivalPrice, formatMoney, productDisplayName } from "@/lib/catalog";

export default function Hero({ product }: { product: Product | null }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-10 lg:pt-12">
      <p className="mb-4 rounded-xl border border-[#3b82f6]/25 bg-[#101722] px-4 py-3 text-xs text-[#c3ccda]">
        <span className="font-semibold text-accent">The Great Indian Festival</span>
        <span className="mx-2 text-[#536174]">·</span>
        20% off every product, applied automatically at checkout
      </p>
      <div className="grid overflow-hidden rounded-2xl border border-[#263449] bg-[#101722] md:min-h-[420px] md:grid-cols-[1fr_.9fr]">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#283444] bg-[#151c26] px-3 py-1.5 text-xs font-medium text-[#9aa8ba]">
            <Cpu size={14} className="text-accent" /> NEXORA TECHNOLOGY MARKETPLACE
          </div>
          <h1 className="font-display max-w-[13ch] text-4xl font-bold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl">
            Technology that moves you forward.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[#9aa8ba] sm:text-base">
            Shop thoughtfully selected electronics, accessories, and everyday essentials in one place.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="button-primary" href="/shop">Shop now <ArrowRight size={16} /></Link>
            <Link className="button-secondary" href="/#categories">Browse categories</Link>
          </div>
        </div>
        <div className="relative min-h-[260px] border-t border-[#263449] bg-[#141d2b] md:min-h-full md:border-l md:border-t-0">
          <img
            src={product ? productImage(product) : "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=85"}
            alt={product?.name ?? "Electronics and technology products"}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f14]/90 via-[#0b0f14]/10 to-transparent" />
          {product && (
            <Link href={`/products/${product.pid}`} className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-xl border border-white/10 bg-[#0b0f14]/85 p-4 sm:inset-x-6 sm:bottom-6">
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#9aa8ba]">Featured product</span>
                <span className="mt-1 block truncate font-semibold text-white">{productDisplayName(product)}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-lg font-bold text-white">{formatMoney(festivalPrice(product))}</span>
                <span className="block text-[10px] text-[#9aa8ba] line-through">{formatMoney(product.price)}</span>
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
