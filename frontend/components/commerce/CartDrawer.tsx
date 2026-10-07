"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartLine, getCart, notify, persistCart, productImage } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  useEffect(() => {
    const refresh = () => setCart(getCart());
    refresh();
    window.addEventListener("nexora-cart-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("nexora-cart-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const update = (next: CartLine[]) => {
    setCart(next);
    persistCart(next);
    notify("Order updated");
  };
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal >= 100 || !subtotal ? 0 : 7.95;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            aria-label="Close cart"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[420px] flex-col border-l border-white/10 bg-[#0d0d0d]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Cart</p>
                <h2 className="font-display text-lg font-bold">{cart.reduce((s, l) => s + l.quantity, 0)} items</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/8"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!cart.length ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <ShoppingBag className="mx-auto text-accent" size={22} />
                    <p className="mt-3 text-sm text-muted">Your cart is empty.</p>
                    <button onClick={onClose} className="button-primary mt-5 !py-2 !text-xs">Explore products</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line, index) => (
                    <motion.article
                      key={line.product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 rounded-2xl border border-white/8 bg-[#141414] p-3"
                    >
                      <img src={productImage(line.product)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{line.product.name}</p>
                        <p className="mt-0.5 text-[10px] capitalize text-muted">{line.product.category} · Graphite</p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
                            <button aria-label="Decrease" onClick={() => update(cart.map((item) => item.product.id === line.product.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}><Minus size={12} /></button>
                            <span className="w-4 text-center text-xs">{line.quantity}</span>
                            <button aria-label="Increase" onClick={() => update(cart.map((item) => item.product.id === line.product.id ? { ...item, quantity: Math.min(item.product.stock, item.quantity + 1) } : item))}><Plus size={12} /></button>
                          </div>
                          <span className="text-sm font-bold text-accent">{formatMoney(line.product.price * line.quantity)}</span>
                        </div>
                      </div>
                      <button aria-label={`Remove ${line.product.name}`} onClick={() => update(cart.filter((item) => item.product.id !== line.product.id))} className="self-start text-muted hover:text-white"><Trash2 size={14} /></button>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-white/8 px-5 py-5">
                <div className="space-y-2 text-xs text-muted">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-white">{formatMoney(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>{shipping ? formatMoney(shipping) : "Complimentary"}</span></div>
                  <div className="flex justify-between border-t border-white/8 pt-3 text-sm font-bold text-white"><span>Total</span><span className="text-accent">{formatMoney(subtotal + shipping)}</span></div>
                </div>
                <Link href="/checkout" onClick={onClose} className="button-primary mt-4 w-full">Checkout</Link>
                <Link href="/cart" onClick={onClose} className="mt-3 block text-center text-[11px] text-muted hover:text-white">View full bag</Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
