"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode, PointerEvent } from "react";

export default function MagneticLink({ href, children, className }: { href: string; children: ReactNode; className: string }) {
  const reducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 260, damping: 20, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 260, damping: 20, mass: 0.35 });

  function move(event: PointerEvent<HTMLAnchorElement>) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(Math.max(-5, Math.min(5, (event.clientX - rect.left - rect.width / 2) * 0.12)));
    rawY.set(Math.max(-4, Math.min(4, (event.clientY - rect.top - rect.height / 2) * 0.12)));
  }

  function reset() {
    rawX.set(0);
    rawY.set(0);
  }

  return <motion.a href={href} onPointerMove={move} onPointerLeave={reset} style={{ x, y }} className={className}>{children}</motion.a>;
}
