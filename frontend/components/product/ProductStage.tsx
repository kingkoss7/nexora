"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PointerEvent, useState } from "react";

export default function ProductStage({
  images, alt, colorKey, enableDrag,
}: {
  images: string[];
  alt: string;
  colorKey: string;
  enableDrag?: boolean;
}) {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0, lx: 50, ly: 40 });
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [originX, setOriginX] = useState(0);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({
      x: (0.5 - py) * 8,
      y: (px - 0.5) * 8,
      lx: px * 100,
      ly: py * 100,
    });
  }

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#101010]"
      style={{ perspective: 1000 }}
      onPointerMove={move}
      onPointerLeave={() => { setTilt({ x: 0, y: 0, lx: 50, ly: 40 }); setDragging(false); }}
      onPointerDown={(event) => { if (!enableDrag) return; setDragging(true); setOriginX(event.clientX); }}
      onPointerUp={() => setDragging(false)}
      onPointerMoveCapture={(event) => {
        if (!dragging || !enableDrag) return;
        const delta = event.clientX - originX;
        setRotation((value) => value + delta * 0.18);
        setOriginX(event.clientX);
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(61,207,138,0.16),transparent_58%)]" style={{ transform: `translate(${(tilt.lx - 50) / 8}px, ${(tilt.ly - 40) / 8}px)` }} />
      <motion.div
        className="relative aspect-square"
        animate={reduce ? undefined : { rotateX: tilt.x, rotateY: tilt.y + rotation * 0.04 }}
        transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.4 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={colorKey}
            src={images[0]}
            alt={alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.45 }}
            className="h-full w-full object-contain p-8 drop-shadow-[0_30px_40px_rgba(0,0,0,.55)]"
            draggable={false}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
