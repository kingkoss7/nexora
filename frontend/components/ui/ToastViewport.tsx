"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Info, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ToastTone } from "@/lib/api";

type ToastState = { message: string; tone: ToastTone; id: number } | null;

export default function ToastViewport() {
  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    let dismiss: number | undefined;
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone: ToastTone }>).detail;
      if (!detail?.message) return;
      window.clearTimeout(dismiss);
      setToast({ ...detail, id: Date.now() });
      dismiss = window.setTimeout(() => setToast(null), 2600);
    };
    window.addEventListener("nexora-toast", handleToast);
    return () => {
      window.clearTimeout(dismiss);
      window.removeEventListener("nexora-toast", handleToast);
    };
  }, []);
  const Icon = toast?.message.toLowerCase().includes("wishlist")
    ? Heart
    : toast?.message.toLowerCase().includes("cart")
      ? ShoppingBag
      : toast?.tone === "success" ? Check : Info;

  return (
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-5 right-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col items-end sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            role="status"
            className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#161616]/95 p-3.5 text-xs text-white shadow-2xl shadow-black/40"
          >
            <span className="h-8 w-[3px] rounded-full bg-accent" />
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${toast.tone === "success" ? "bg-accent/15 text-accent" : "bg-white/10 text-[#d0d0d0]"}`}>
              <Icon size={16} />
            </span>
            <span className="flex-1">{toast.message}</span>
            <button aria-label="Dismiss notification" onClick={() => setToast(null)} className="grid h-7 w-7 place-items-center rounded-full text-[#999] hover:bg-white/10 hover:text-white"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
