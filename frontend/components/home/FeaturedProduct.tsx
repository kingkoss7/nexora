"use client";

import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { addToCart, Product, productImage } from "@/lib/api";
import { enrich, formatMoney } from "@/lib/catalog";
import ProductStage from "@/components/product/ProductStage";
import Reveal from "@/components/ui/Reveal";

const ProductStudio = dynamic(() => import("@/components/three/ThreeScenes").then((module) => module.ProductStudio), {
  ssr: false,
  loading: () => <div className="aspect-square w-full rounded-[28px] bg-[#101010]" />,
});

export default function FeaturedProduct({ product }: { product: Product }) {
  const view = enrich(product);
  const [color, setColor] = useState(view.colors[0]);
  const [size, setSize] = useState(view.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [mode, setMode] = useState<"3d" | "photo">("3d");
  const stageRef = useRef<HTMLDivElement>(null);
  const image = color.name === "Forest" ? view.gallery[1] : color.name === "Silver" ? view.gallery[2] : productImage(product);

  return (
    <section id="collections" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-10 sm:px-8 lg:px-12">
      <Reveal>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div ref={stageRef}>
            <div className="mb-3 flex w-fit rounded-full border border-white/8 p-1 text-[10px] font-semibold">
              <button onClick={() => setMode("3d")} className={`rounded-full px-3 py-1.5 ${mode === "3d" ? "bg-accent/15 text-accent" : "text-muted"}`}>3D</button>
              <button onClick={() => setMode("photo")} className={`rounded-full px-3 py-1.5 ${mode === "photo" ? "bg-accent/15 text-accent" : "text-muted"}`}>Studio</button>
            </div>
            {mode === "3d"
              ? <ProductStudio product={product} image={image} />
              : <ProductStage images={[image]} alt={product.name} colorKey={color.name} enableDrag />}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{view.brand}</p>
            <h2 className="font-display mt-3 text-4xl font-bold tracking-[-0.04em]">{product.name}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#b0b0b0]">{product.description}</p>
            <p className="mt-3 text-xs text-[#cfcfcf]">★ {view.rating} · {view.reviews} reviews</p>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-accent">{formatMoney(product.price)}</span>
              <span className="text-sm text-muted line-through">{formatMoney(view.originalPrice)}</span>
              <span className="rounded-full bg-accent/12 px-2 py-1 text-[10px] font-bold text-accent">-{view.discount}%</span>
            </div>
            <p className={`mt-3 text-xs ${product.stock > 0 ? "text-accent" : "text-rose-300"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Sold out"}</p>
            <div className="mt-6">
              <p className="text-[11px] font-semibold text-[#cfcfcf]">Color — {color.name}</p>
              <div className="mt-2 flex gap-2">
                {view.colors.map((item) => (
                  <button
                    key={item.name}
                    aria-label={item.name}
                    onClick={() => setColor(item)}
                    className={`h-8 w-8 rounded-full border ${color.name === item.name ? "border-accent ring-2 ring-accent/30" : "border-white/15"}`}
                    style={{ background: item.hex }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold text-[#cfcfcf]">Size</p>
              <div className="mt-2 flex gap-2">
                {view.sizes.map((item) => (
                  <button key={item} onClick={() => setSize(item)} className={`rounded-full border px-3 py-1.5 text-[11px] ${size === item ? "border-accent text-accent" : "border-white/12 text-muted"}`}>{item}</button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-white/12 px-3 py-2">
                <button aria-label="Decrease" onClick={() => setQty((v) => Math.max(1, v - 1))}><Minus size={14} /></button>
                <span className="w-5 text-center text-sm">{qty}</span>
                <button aria-label="Increase" onClick={() => setQty((v) => Math.min(product.stock, v + 1))}><Plus size={14} /></button>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                disabled={!product.stock}
                onClick={() => {
                  const from = stageRef.current?.getBoundingClientRect();
                  addToCart(product, qty, from ? { image: productImage(product), from } : undefined);
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 1400);
                }}
                className="button-primary disabled:opacity-40"
              >
                {added ? <><Check size={16} /> Added</> : <><ShoppingBag size={16} /> Add to Cart</>}
              </button>
              <a href="/checkout" className="button-secondary">Buy Now</a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
