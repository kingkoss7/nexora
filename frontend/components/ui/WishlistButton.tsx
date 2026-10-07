"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

export default function WishlistButton({ saved, onToggle, className = "" }: { saved: boolean; onToggle: () => void; className?: string }) {
  const reduce = useReducedMotion();
  const [burst, setBurst] = useState(false);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={() => {
        onToggle();
        if (!saved) {
          setBurst(true);
          window.setTimeout(() => setBurst(false), 700);
        }
      }}
      className={`relative grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/40 text-white backdrop-blur transition duration-300 hover:border-accent/40 ${saved ? "text-accent" : ""} ${className}`}
    >
      <motion.span animate={reduce ? undefined : { scale: saved ? [1, 1.18, 1] : 1 }} transition={{ duration: 0.32 }}>
        <Heart size={16} fill={saved ? "currentColor" : "none"} />
      </motion.span>
      <AnimatePresence>
        {burst && !reduce && (
          <motion.span
            initial={{ opacity: 0.8, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.8 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-full bg-accent/25"
          />
        )}
      </AnimatePresence>
    </button>
  );
}
