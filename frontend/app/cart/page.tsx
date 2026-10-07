"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartLine, getCart, notify, persistCart, productImage } from "@/lib/api";

export default function Cart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  useEffect(() => setCart(getCart()), []);
  const update = (next: CartLine[]) => {
    const removed = cart.find((line) => !next.some((item) => item.product.id === line.product.id));
    const changed = cart.find((line) => next.some((item) => item.product.id === line.product.id && item.quantity !== line.quantity));
    setCart(next);
    persistCart(next);
    if (removed) notify(`${removed.product.name} removed from your bag.`, "info");
    else if (changed) notify("Order updated");
  };
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal >= 100 || !subtotal ? 0 : 7.95;

  return (
    <section className="mx-auto min-h-[68vh] max-w-[1200px] px-5 pb-10 pt-24 sm:px-8 lg:px-12 lg:pb-14">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">The good things you found</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Your bag<span className="ml-3 text-base font-medium text-[#898b99]">({cart.reduce((sum, line) => sum + line.quantity, 0)})</span>
      </h1>
      {!cart.length ? (
        <div className="panel mt-8 flex flex-col items-center px-5 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent"><ShoppingBag size={23} /></span>
          <h2 className="font-display mt-5 text-lg font-bold">Room for something lovely.</h2>
          <p className="mt-2 text-sm text-[#9293a0]">Your bag is empty. Take a look around the edit.</p>
          <Link href="/#shop" className="button-primary mt-6">Explore the edit <ArrowRight size={15} /></Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {cart.map((line) => (
                <motion.article
                  key={line.product.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
                  className="panel flex gap-4 p-3.5 sm:gap-5 sm:p-4"
                >
                  <img src={productImage(line.product)} alt={line.product.name} className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-accent">{line.product.category}</span>
                        <Link href={`/products/${line.product.id}`} className="mt-1 block truncate text-sm font-semibold">{line.product.name}</Link>
                        <p className="mt-1 text-xs text-[#858795]">${line.product.price.toFixed(2)} each</p>
                      </div>
                      <button
                        onClick={() => update(cart.filter((item) => item.product.id !== line.product.id))}
                        aria-label={`Remove ${line.product.name}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#858795] hover:bg-rose-400/10 hover:text-rose-200"
                      ><Trash2 size={15} /></button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-white/10 px-2.5 py-1.5">
                        <button disabled={line.quantity <= 1} aria-label="Decrease quantity" className="text-[#b8b6c3] disabled:opacity-30" onClick={() => update(cart.map((item) => item.product.id === line.product.id ? { ...item, quantity: item.quantity - 1 } : item))}><Minus size={13} /></button>
                        <span className="min-w-3 text-center text-xs">{line.quantity}</span>
                        <button disabled={line.quantity >= line.product.stock} aria-label="Increase quantity" className="text-[#b8b6c3] disabled:opacity-30" onClick={() => update(cart.map((item) => item.product.id === line.product.id ? { ...item, quantity: Math.min(item.product.stock, item.quantity + 1) } : item))}><Plus size={13} /></button>
                      </div>
                      <span className="text-sm font-bold">${(line.product.price * line.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
            <Link href="/#shop" className="inline-flex items-center gap-2 px-2 py-3 text-xs text-[#aaa7b6] hover:text-white"><ArrowRight className="rotate-180" size={14} /> Continue exploring</Link>
          </div>
          <aside className="panel sticky top-24 p-5 sm:p-6">
            <h2 className="font-display text-base font-bold">A little summary</h2>
            <div className="mt-5 space-y-3 text-xs">
              <div className="flex justify-between text-[#a3a2ae]"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-[#a3a2ae]"><span>Shipping</span><span>{shipping ? `$${shipping.toFixed(2)}` : "On us"}</span></div>
              {subtotal > 0 && subtotal < 100 && <p className="rounded-xl bg-accent/[.08] p-3 leading-5 text-accent/80">Add ${(100 - subtotal).toFixed(2)} more for complimentary delivery.</p>}
              <div className="my-4 border-t border-white/[.09]" />
              <div className="flex justify-between text-sm font-bold"><span>Total</span><AnimatePresence mode="wait"><motion.span key={subtotal + shipping} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>${(subtotal + shipping).toFixed(2)}</motion.span></AnimatePresence></div>
              <p className="pt-1 text-[10px] text-[#7f818e]">Taxes calculated at checkout.</p>
            </div>
            <Link href="/checkout" className="button-primary mt-6 w-full">Continue to checkout <ArrowRight size={15} /></Link>
            <p className="mt-4 text-center text-[10px] text-[#818391]">Secure checkout · Easy returns</p>
          </aside>
        </div>
      )}
    </section>
  );
}
