"use client";
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addToCart, api, getWishlist, notify, Product, productImage, syncWishlistFromServer, toggleWishlist } from "@/lib/api";
import { festivalPrice, formatMoney } from "@/lib/catalog";
import ProductGallery from "@/components/product/ProductGallery";
import ProductCard from "@/components/commerce/ProductCard";
import WishlistButton from "@/components/ui/WishlistButton";

export default function ProductPage() {
  const params = useParams<{ pid: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("Description");

  useEffect(() => {
    const pid = Number(params.pid);
    if (!Number.isInteger(pid) || pid < 1) { setError("That product could not be found."); return; }
    api<Product>(`/products/${pid}`).then((item) => {
      setProduct(item);
      setSaved(getWishlist().includes(item.pid));
      void syncWishlistFromServer().then((ids) => setSaved(ids.includes(item.pid))).catch((err: unknown) => {
        notify(err instanceof Error ? err.message : "Wishlist could not be loaded.", "info");
      });
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : "That product could not be found."));
    api<Product[]>("/products?size=100").then((items) => setRelated(items.filter((item) => item.pid !== pid).slice(0, 3))).catch((err: unknown) => {
      notify(err instanceof Error ? err.message : "Related products could not be loaded.", "info");
    });
  }, [params.pid]);

  if (error) return <div className="mx-auto max-w-3xl px-5 py-32 text-center"><p className="text-[#c7c7c7]">{error}</p><Link href="/shop" className="button-secondary mt-6">Back to shop</Link></div>;
  if (!product) return <div className="mx-auto max-w-6xl px-5 py-24"><div className="grid gap-10 md:grid-cols-2"><div className="skeleton aspect-square rounded-3xl" /><div className="space-y-4 pt-10"><div className="skeleton h-5 w-1/3 rounded" /><div className="skeleton h-10 w-3/4 rounded" /><div className="skeleton h-4 w-1/2 rounded" /></div></div></div>;

  return (
    <div className="page-frame mx-auto max-w-[1200px] px-5 pb-28 pt-28 sm:px-8 lg:px-12">
      <Link href="/shop" className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] px-4 py-2.5 text-[11px] text-muted transition hover:border-accent/20 hover:text-white"><ArrowLeft size={14} /> Back to the edit</Link>
      <div className="grid gap-8 md:grid-cols-[1.04fr_.96fr] md:gap-14">
        <div className="relative">
          <ProductGallery images={[productImage(product)]} alt={product.name} />
          <div className="absolute right-4 top-4 z-10"><WishlistButton saved={saved} onToggle={() => setSaved(toggleWishlist(product.pid))} /></div>
        </div>
        <div className="surface-card flex flex-col justify-center p-5 sm:p-7 md:sticky md:top-24 md:self-start">
          <p className="eyebrow">{product.category}</p>
          <h1 className="display-heading mt-4 text-4xl sm:text-5xl">{product.name}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#a6a6a6]">{product.description || "No description is available for this product yet."}</p>
          <div className="mt-6 flex items-baseline gap-3">
            <p className="font-display text-3xl font-extrabold text-accent">{formatMoney(festivalPrice(product))}</p>
            <p className="text-sm text-muted line-through">{formatMoney(product.price)}</p>
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent">{product.festival_discount_percent}% off</span>
          </div>
          <p className={`mt-2 text-xs ${product.stock > 0 ? "text-accent" : "text-rose-300"}`}>{product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium">Quantity</span>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/15 px-3 py-2">
              <button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="disabled:opacity-30"><Minus size={15} /></button>
              <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
              <button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} className="disabled:opacity-30"><Plus size={15} /></button>
            </div>
            <span className="text-[10px] text-[#818b84]">{product.stock} available</span>
          </div>
          <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
            <button
              disabled={!product.stock}
              onClick={() => {
                if (!addToCart(product, quantity)) return;
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1500);
              }}
              className="button-primary min-h-12 disabled:opacity-40"
            >
              {added ? <><Check size={17} /> Added</> : <><ShoppingBag size={17} /> Add to Cart — {formatMoney(festivalPrice(product) * quantity)}</>}
            </button>
            <button
              type="button"
              className="button-secondary min-h-12"
              onClick={() => {
                if (addToCart(product, quantity)) router.push("/checkout");
              }}
            >
              Buy now
            </button>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050505]/92 p-3 backdrop-blur md:hidden">
            <button
              disabled={!product.stock}
              onClick={() => {
                addToCart(product, quantity);
              }}
              className="button-primary w-full"
            >
              Add to Cart — {formatMoney(festivalPrice(product) * quantity)}
            </button>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 text-[11px] text-[#b1b1b1]">
            <div className="flex items-center gap-2 rounded-xl border border-white/[.07] p-3"><Truck size={15} className="text-accent" /> Thoughtful delivery</div>
            <div className="flex items-center gap-2 rounded-xl border border-white/[.07] p-3"><ShieldCheck size={15} className="text-accent" /> Secure checkout</div>
          </div>
          <div className="mt-9 border-b border-white/[.08]">{["Description", "Specifications"].map((name) => <button key={name} onClick={() => setTab(name)} className={`mr-5 border-b-2 pb-3 text-xs ${tab === name ? "border-accent text-white" : "border-transparent text-muted"}`}>{name}</button>)}</div>
          <p className="pt-4 text-xs leading-6 text-[#9b9b9b]">
            {tab === "Description" && (product.description || "No description is available for this product yet.")}
            {tab === "Specifications" && `Category: ${product.category}. Festival price: ${formatMoney(festivalPrice(product))}. Available stock: ${product.stock}.`}
          </p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold">Related products</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {related.map((item, index) => (
              <ProductCard key={item.pid} product={item} index={index} saved={getWishlist().includes(item.pid)} onWishlist={() => setSaved(getWishlist().includes(product.pid))} onQuick={() => undefined} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
