"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { CartFlyDetail } from "@/lib/api";

export default function AddToCartFly() {
  const reduce = useReducedMotion();
  const [fly, setFly] = useState<(CartFlyDetail & { id: number; to: DOMRect }) | null>(null);

  useEffect(() => {
    const onFly = (event: Event) => {
      const detail = (event as CustomEvent<CartFlyDetail>).detail;
      const cart = document.getElementById("nav-cart")?.getBoundingClientRect();
      if (!detail?.from || !cart) return;
      setFly({ ...detail, to: cart, id: Date.now() });
      window.setTimeout(() => {
        document.getElementById("nav-cart")?.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }, 420);
    };
    window.addEventListener("nexora-cart-fly", onFly);
    return () => window.removeEventListener("nexora-cart-fly", onFly);
  }, []);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {fly && (
        <motion.img
          key={fly.id}
          src={fly.image}
          alt=""
          initial={{
            position: "fixed",
            left: fly.from.left,
            top: fly.from.top,
            width: Math.min(72, fly.from.width),
            height: Math.min(72, fly.from.height),
            opacity: 1,
            borderRadius: 12,
            zIndex: 85,
          }}
          animate={{
            left: fly.to.left,
            top: fly.to.top,
            width: 18,
            height: 18,
            opacity: 0.2,
            borderRadius: 99,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => setFly(null)}
          className="pointer-events-none object-cover shadow-lg"
        />
      )}
    </AnimatePresence>
  );
}
