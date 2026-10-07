"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PointerEvent, useEffect, useState } from "react";

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setIndex((v) => (v + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((v) => (v - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  function swipeStart(event: PointerEvent<HTMLDivElement>) { setTouchX(event.clientX); }
  function swipeEnd(event: PointerEvent<HTMLDivElement>) {
    if (touchX == null) return;
    const delta = event.clientX - touchX;
    if (delta < -40) setIndex((v) => (v + 1) % images.length);
    if (delta > 40) setIndex((v) => (v - 1 + images.length) % images.length);
    setTouchX(null);
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[#101010]"
        onPointerDown={swipeStart}
        onPointerUp={swipeEnd}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrigin(`${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`);
        }}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={images[index]}
            src={images[index]}
            alt={alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: zoom ? 1.18 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ transformOrigin: origin }}
            className="aspect-square w-full object-cover"
          />
        </AnimatePresence>
        <button aria-label="Previous image" onClick={() => setIndex((v) => (v - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45"><ChevronLeft size={16} /></button>
        <button aria-label="Next image" onClick={() => setIndex((v) => (v + 1) % images.length)} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/45"><ChevronRight size={16} /></button>
      </div>
      <div className="mt-3 flex gap-2">
        {images.map((image, i) => (
          <button key={image + i} aria-label={`Show image ${i + 1}`} onClick={() => setIndex(i)} className={`h-16 w-16 overflow-hidden rounded-xl border ${i === index ? "border-accent" : "border-white/10"}`}>
            <img src={image} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
