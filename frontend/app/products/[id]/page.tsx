"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addToCart, api, getWishlist, notify, Product, productImage, syncWishlistFromServer, toggleWishlist } from "@/lib/api";
import { enrich, formatMoney } from "@/lib/catalog";
import ProductGallery from "@/components/product/ProductGallery";
import ProductCard from "@/components/commerce/ProductCard";
import WishlistButton from "@/components/ui/WishlistButton";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("Description");
  const [color, setColor] = useState("Graphite");
  const [size, setSize] = useState("Standard");
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) { setError("That product could not be found."); return; }
    api<Product>(`/products/${id}`).then((item) => {
      setProduct(item);
      const view = enrich(item);
      setSize(view.sizes[0]);
      setSaved(getWishlist().includes(item.id));
      void syncWishlistFromServer().then((ids) => setSaved(ids.includes(item.id))).catch((err: unknown) => {
        notify(err instanceof Error ? err.message : "Wishlist could not be loaded.", "info");
      });
    }).catch(() => setError("That product could not be found."));
    api<Product[]>("/products?size=100").then((items) => setRelated(items.filter((item) => item.id !== id).slice(0, 3))).catch(() => undefined);
  }, [params.id]);

  const view = useMemo(() => (product ? enrich(product) : null), [product]);

  if (error) return <div className="mx-auto max-w-3xl px-5 py-32 text-center"><p className="text-[#c7c7c7]">{error}</p><Link href="/shop" className="button-secondary mt-6">Back to shop</Link></div>;
  if (!product || !view) return <div className="mx-auto max-w-6xl px-5 py-24"><div className="grid gap-10 md:grid-cols-2"><div className="skeleton aspect-square rounded-3xl" /><div className="space-y-4 pt-10"><div className="skeleton h-5 w-1/3 rounded" /><div className="skeleton h-10 w-3/4 rounded" /><div className="skeleton h-4 w-1/2 rounded" /></div></div></div>;

  const gallery = color === "Forest" ? [view.gallery[1], ...view.gallery] : color === "Silver" ? [view.gallery[2], ...view.gallery] : view.gallery;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[1200px] px-5 pb-28 pt-24 sm:px-8 lg:px-12">
      <Link href="/shop" className="mb-8 inline-flex items-center gap-2 text-xs text-muted transition hover:text-white"><ArrowLeft size={15} /> Back to shop</Link>
      <div className="grid gap-8 md:grid-cols-[1.04fr_.96fr] md:gap-14">
        <div ref={galleryRef} className="relative">
          <ProductGallery images={gallery} alt={product.name} />
          <div className="absolute right-4 top-4 z-10"><WishlistButton saved={saved} onToggle={() => setSaved(toggleWishlist(product.id))} /></div>
        </div>
        <div className="flex flex-col justify-center py-2 md:py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.19em] text-accent">{view.brand}</p>
          <h1 className="font-display mt-4 text-3xl font-extrabold leading-tight tracking-[-.045em] sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-xs text-[#cfcfcf]">★ {view.rating} · {view.reviews} reviews</p>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#a6a6a6]">{product.description}</p>
          <div className="mt-6 flex items-baseline gap-3">
            <p className="font-display text-3xl font-extrabold text-accent">{formatMoney(product.price)}</p>
            <p className="text-sm text-muted line-through">{formatMoney(view.originalPrice)}</p>
            <span className="rounded-full bg-accent/12 px-2 py-1 text-[10px] font-bold text-accent">-{view.discount}%</span>
          </div>
          <p className={`mt-2 text-xs ${product.stock > 0 ? "text-accent" : "text-rose-300"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}</p>
          <div className="mt-6">
            <p className="text-[11px] font-semibold">Color — {color}</p>
            <div className="mt-2 flex gap-2">
              {view.colors.map((item) => (
                <button key={item.name} aria-label={item.name} onClick={() => setColor(item.name)} className={`h-8 w-8 rounded-full border ${color === item.name ? "border-accent ring-2 ring-accent/30" : "border-white/15"}`} style={{ background: item.hex }} />
              ))}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-semibold">Size</p>
            <div className="mt-2 flex gap-2">
              {view.sizes.map((item) => (
                <button key={item} onClick={() => setSize(item)} className={`rounded-full border px-3 py-1.5 text-[11px] ${size === item ? "border-accent text-accent" : "border-white/12 text-muted"}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs font-medium">Quantity</span>
            <div className="flex items-center gap-3 rounded-full border border-white/10 px-3 py-2">
              <button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="disabled:opacity-30"><Minus size={15} /></button>
              <AnimatePresence mode="wait"><motion.span key={quantity} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }} className="w-5 text-center text-sm font-semibold">{quantity}</motion.span></AnimatePresence>
              <button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="disabled:opacity-30"><Plus size={15} /></button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
            <button
              disabled={!product.stock}
              onClick={() => {
                const from = galleryRef.current?.getBoundingClientRect();
                addToCart(product, quantity, from ? { image: productImage(product), from } : undefined);
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1500);
              }}
              className="button-primary min-h-12 disabled:opacity-40"
            >
              {added ? <><Check size={17} /> Added</> : <><ShoppingBag size={17} /> Add to Cart — {formatMoney(product.price * quantity)}</>}
            </button>
            <Link href="/checkout" className="button-secondary min-h-12">Buy Now</Link>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050505]/92 p-3 backdrop-blur md:hidden">
            <button
              disabled={!product.stock}
              onClick={() => {
                const from = galleryRef.current?.getBoundingClientRect();
                addToCart(product, quantity, from ? { image: productImage(product), from } : undefined);
              }}
              className="button-primary w-full"
            >
              Add to Cart — {formatMoney(product.price * quantity)}
            </button>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 text-[11px] text-[#b1b1b1]">
            <div className="flex items-center gap-2 rounded-xl border border-white/[.07] p-3"><Truck size={15} className="text-accent" /> Thoughtful delivery</div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[.07] p-3"><ShieldCheck size={15} className="text-accent" /> Secure checkout</div>
          </div>
          <div className="mt-9 border-b border-white/[.08]">{["Description", "Specifications", "Reviews", "Shipping", "Returns"].map((name) => <button key={name} onClick={() => setTab(name)} className={`mr-5 border-b-2 pb-3 text-xs ${tab === name ? "border-accent text-white" : "border-transparent text-muted"}`}>{name}</button>)}</div>
          <p className="pt-4 text-xs leading-6 text-[#9b9b9b]">
            {tab === "Description" && (product.description || `A considered ${product.category} essential, selected for design, quality and everyday versatility.`)}
            {tab === "Specifications" && `Brand: ${view.brand}. Category: ${product.category}. Color: ${color}. Size: ${size}. Availability: ${product.stock} units.`}
            {tab === "Reviews" && `${view.reviews} verified reviews at ${view.rating} average. A dedicated review studio is expanding.`}
            {tab === "Shipping" && "Complimentary shipping on orders over $100. Typical arrival in 2–5 business days."}
            {tab === "Returns" && "30-day returns on unused items. Hardware includes a two-year limited service promise."}
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold">Related products</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} saved={getWishlist().includes(item.id)} onWishlist={() => setSaved(getWishlist().includes(product.id))} onQuick={() => undefined} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
