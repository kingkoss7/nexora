"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export default function LaunchLoader() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("nexora-booted")) return;
    setVisible(true);
    const ms = reduce ? 400 : 1800;
    const t = window.setTimeout(() => {
      sessionStorage.setItem("nexora-booted", "1");
      setVisible(false);
    }, ms);
    return () => window.clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="launch-loader"
          role="status"
          aria-label="Loading storefront"
          className="fixed inset-0 z-[90] grid place-items-center bg-[#050505]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.55 }}
        >
          <div className="relative flex flex-col items-center">
            <div className="absolute h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
            <svg viewBox="0 0 120 90" className="mb-8 h-24 w-32 text-white/10" aria-hidden="true">
              <path d="M20 70 L60 18 L100 70 Z" fill="currentColor" />
            </svg>
            <motion.div
              className="h-[2px] w-40 overflow-hidden rounded-full bg-white/10"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full w-1/2 bg-accent"
                animate={reduce ? undefined : { x: ["-100%", "200%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.4em", filter: "blur(6px)" }}
              animate={{ opacity: 1, letterSpacing: "0.28em", filter: "blur(0px)" }}
              className="font-display mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white"
            >
              NEXORA
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
